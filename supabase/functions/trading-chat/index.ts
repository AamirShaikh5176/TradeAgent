import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MARKET_DATA_URL = Deno.env.get("SUPABASE_URL") + "/functions/v1/market-data";

async function fetchIndicatorSummary(symbol: string): Promise<string | null> {
  try {
    const resp = await fetch(MARKET_DATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ action: "indicators", symbol }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.summary || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, documents, asset } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build RAG context from uploaded documents
    let ragContext = "";
    if (documents && documents.length > 0) {
      ragContext += "\n\n## Reference Documents (RAG Context)\nUse these documents to ground your analysis:\n\n";
      for (const doc of documents) {
        ragContext += `### ${doc.name}\n${doc.content}\n\n`;
      }
    }

    // Auto-fetch market data if asset is specified or mentioned in last message
    let marketContext = "";
    if (asset) {
      const summary = await fetchIndicatorSummary(asset);
      if (summary) {
        marketContext = `\n\n## Live Market Data (Auto-fetched)\n${summary}\n`;
      }
    } else {
      // Try to detect asset mentions in the last user message
      const lastMsg = messages?.[messages.length - 1]?.content?.toLowerCase() || "";
      const assetMap: Record<string, string> = {
        btc: "bitcoin", bitcoin: "bitcoin", eth: "ethereum", ethereum: "ethereum",
        sol: "solana", solana: "solana", xrp: "ripple", ada: "cardano", doge: "dogecoin",
        tesla: "TSLA", tsla: "TSLA", apple: "AAPL", aapl: "AAPL", nvidia: "NVDA", nvda: "NVDA",
        reliance: "RELIANCE.NS", tcs: "TCS.NS", hdfc: "HDFCBANK.NS", infosys: "INFY.NS",
        icici: "ICICIBANK.NS", sbi: "SBIN.NS", nifty: "%5ENSEI", sensex: "%5EBSESN",
      };
      const detected: string[] = [];
      for (const [keyword, sym] of Object.entries(assetMap)) {
        if (lastMsg.includes(keyword) && !detected.includes(sym)) {
          detected.push(sym);
        }
      }
      // Fetch up to 3 assets
      if (detected.length > 0) {
        const summaries = await Promise.allSettled(
          detected.slice(0, 3).map((sym) => fetchIndicatorSummary(sym))
        );
        const validSummaries = summaries
          .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled" && !!r.value)
          .map((r) => r.value);
        if (validSummaries.length > 0) {
          marketContext = `\n\n## Live Market Data (Auto-detected)\n${validSummaries.join("\n")}\n`;
        }
      }
    }

    const systemPrompt = `You are an elite quantitative trading strategy agent called TradeAgent. Your role is to:

1. **Analyze market data** — Compress and interpret price action, volume, volatility, and technical indicators.
2. **Identify patterns** — Detect chart patterns, mean reversion signals, momentum shifts, and statistical anomalies.
3. **Recommend strategies** — Suggest entry/exit points, position sizing, risk management, and hedging approaches.
4. **Generate structured reports** when analyzing specific assets with these sections:
   - 📊 **Market Snapshot** — Current price, trend, key metrics
   - 📈 **Trend Analysis** — Direction, momentum, moving averages
   - 🎯 **Support & Resistance** — Key levels
   - 📉 **Indicator Signals** — RSI, MACD, volume analysis
   - ⚠️ **Risk Assessment** — Volatility, downside risks
   - 💡 **Recommendation** — BUY/HOLD/SELL with confidence score
5. **Explain rationale** — Provide clear reasoning backed by data.

Always format responses with markdown. Use **bold** for key metrics, tables for comparisons, bullet points for action items. Include risk warnings.${ragContext}${marketContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("trading-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
