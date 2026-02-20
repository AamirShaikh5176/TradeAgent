import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

// ── Simple in-memory cache to avoid 429 rate limits ────────────────
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 120_000;

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}
function setCache(key: string, data: any) {
  cache.set(key, { data, ts: Date.now() });
}

// ── Indicator helpers ──────────────────────────────────────────────
function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function computeSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function computeEMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

function computeMACD(closes: number[]): { macd: number; signal: number; histogram: number } | null {
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  if (ema12 === null || ema26 === null) return null;
  const macdLine = ema12 - ema26;
  const signal = macdLine * 0.8;
  return { macd: macdLine, signal, histogram: macdLine - signal };
}

function findSupportResistance(highs: number[], lows: number[]): { support: number; resistance: number } {
  const recentLows = lows.slice(-20);
  const recentHighs = highs.slice(-20);
  return { support: Math.min(...recentLows), resistance: Math.max(...recentHighs) };
}

function computeVolatility(closes: number[]): number {
  if (closes.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

function trendDirection(sma20: number | null, sma50: number | null, price: number): string {
  if (!sma20 || !sma50) return "Neutral";
  if (price > sma20 && sma20 > sma50) return "Bullish";
  if (price < sma20 && sma20 < sma50) return "Bearish";
  return "Sideways";
}

function rsiLabel(rsi: number): string {
  if (rsi > 70) return "overbought";
  if (rsi < 30) return "oversold";
  return "neutral";
}

function generateCompressedSummary(
  name: string, price: number, closes: number[], highs: number[], lows: number[], volumes: number[], currency = "USD"
): string {
  const rsi = computeRSI(closes);
  const sma20 = computeSMA(closes, 20);
  const sma50 = computeSMA(closes, 50);
  const sma200 = computeSMA(closes, 200);
  const macdData = computeMACD(closes);
  const sr = findSupportResistance(highs, lows);
  const vol = computeVolatility(closes);
  const trend = trendDirection(sma20, sma50, price);
  const avgVol = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;
  const lastVol = volumes[volumes.length - 1] || 0;
  const volTrend = lastVol > avgVol * 1.2 ? "above avg" : lastVol < avgVol * 0.8 ? "below avg" : "normal";
  const macdStr = macdData ? (macdData.histogram > 0 ? "bullish" : "bearish") : "N/A";
  let confidence = 50;
  if (trend === "Bullish") confidence += 15;
  if (trend === "Bearish") confidence -= 15;
  if (rsi < 30) confidence += 10;
  if (rsi > 70) confidence -= 10;
  if (macdData && macdData.histogram > 0) confidence += 7;
  confidence = Math.max(10, Math.min(95, confidence));
  const signal = confidence > 65 ? "BUY" : confidence < 40 ? "SELL" : "HOLD";
  const sym = currency === "INR" ? "₹" : "$";
  const fmt = (n: number) => `${sym}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `${name}: Price ${fmt(price)} | Currency: ${currency} | Trend: ${trend} | RSI: ${rsi.toFixed(1)} (${rsiLabel(rsi)}) | MACD: ${macdStr} | Support: ${fmt(sr.support)} | Resistance: ${fmt(sr.resistance)} | Volatility: ${vol.toFixed(2)}% | Volume: ${volTrend} | SMA20: ${sma20 ? fmt(sma20) : "N/A"} | SMA50: ${sma50 ? fmt(sma50) : "N/A"} | SMA200: ${sma200 ? fmt(sma200) : "N/A"} | Signal: ${signal} (confidence: ${confidence}%)`;
}

// ── Stock / Index / Commodity data definitions ─────────────────────
const GLOBAL_STOCKS = [
  { symbol: "AAPL", name: "Apple", type: "global" },
  { symbol: "MSFT", name: "Microsoft", type: "global" },
  { symbol: "NVDA", name: "Nvidia", type: "global" },
  { symbol: "AMZN", name: "Amazon", type: "global" },
  { symbol: "GOOGL", name: "Alphabet (Google)", type: "global" },
  { symbol: "TSLA", name: "Tesla", type: "global" },
  { symbol: "META", name: "Meta Platforms", type: "global" },
  { symbol: "NFLX", name: "Netflix", type: "global" },
  { symbol: "AMD", name: "AMD", type: "global" },
  { symbol: "INTC", name: "Intel", type: "global" },
  { symbol: "JPM", name: "JPMorgan Chase", type: "global" },
  { symbol: "V", name: "Visa", type: "global" },
  { symbol: "WMT", name: "Walmart", type: "global" },
  { symbol: "JNJ", name: "Johnson & Johnson", type: "global" },
  { symbol: "PG", name: "Procter & Gamble", type: "global" },
  { symbol: "MA", name: "Mastercard", type: "global" },
  { symbol: "UNH", name: "UnitedHealth", type: "global" },
  { symbol: "HD", name: "Home Depot", type: "global" },
  { symbol: "DIS", name: "Walt Disney", type: "global" },
  { symbol: "BAC", name: "Bank of America", type: "global" },
  { symbol: "CRM", name: "Salesforce", type: "global" },
  { symbol: "ADBE", name: "Adobe", type: "global" },
  { symbol: "ORCL", name: "Oracle", type: "global" },
  { symbol: "CSCO", name: "Cisco", type: "global" },
  { symbol: "PEP", name: "PepsiCo", type: "global" },
  { symbol: "KO", name: "Coca-Cola", type: "global" },
  { symbol: "AVGO", name: "Broadcom", type: "global" },
  { symbol: "MRK", name: "Merck", type: "global" },
  { symbol: "NKE", name: "Nike", type: "global" },
  { symbol: "PYPL", name: "PayPal", type: "global" },
  { symbol: "QCOM", name: "Qualcomm", type: "global" },
  { symbol: "TXN", name: "Texas Instruments", type: "global" },
  { symbol: "IBM", name: "IBM", type: "global" },
  { symbol: "GS", name: "Goldman Sachs", type: "global" },
  { symbol: "MS", name: "Morgan Stanley", type: "global" },
  { symbol: "AXP", name: "American Express", type: "global" },
  { symbol: "SBUX", name: "Starbucks", type: "global" },
  { symbol: "CVX", name: "Chevron", type: "global" },
  { symbol: "XOM", name: "ExxonMobil", type: "global" },
  { symbol: "LLY", name: "Eli Lilly", type: "global" },
  { symbol: "ABBV", name: "AbbVie", type: "global" },
  { symbol: "TMO", name: "Thermo Fisher", type: "global" },
  { symbol: "NOW", name: "ServiceNow", type: "global" },
  { symbol: "UBER", name: "Uber", type: "global" },
  { symbol: "ABNB", name: "Airbnb", type: "global" },
  { symbol: "SPOT", name: "Spotify", type: "global" },
  { symbol: "COIN", name: "Coinbase", type: "global" },
  { symbol: "PLTR", name: "Palantir", type: "global" },
  { symbol: "NET", name: "Cloudflare", type: "global" },
  { symbol: "CRWD", name: "CrowdStrike", type: "global" },
];

const INDIAN_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", type: "india" },
  { symbol: "TCS.NS", name: "TCS", type: "india" },
  { symbol: "INFY.NS", name: "Infosys", type: "india" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", type: "india" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", type: "india" },
  { symbol: "SBIN.NS", name: "SBI", type: "india" },
  { symbol: "LT.NS", name: "Larsen & Toubro", type: "india" },
  { symbol: "ITC.NS", name: "ITC", type: "india" },
  { symbol: "AXISBANK.NS", name: "Axis Bank", type: "india" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", type: "india" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", type: "india" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki", type: "india" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", type: "india" },
  { symbol: "WIPRO.NS", name: "Wipro", type: "india" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharma", type: "india" },
  { symbol: "TITAN.NS", name: "Titan Company", type: "india" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", type: "india" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises", type: "india" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", type: "india" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", type: "india" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corp", type: "india" },
  { symbol: "NTPC.NS", name: "NTPC", type: "india" },
  { symbol: "HINDALCO.NS", name: "Hindalco", type: "india" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", type: "india" },
  { symbol: "TECHM.NS", name: "Tech Mahindra", type: "india" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", type: "india" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv", type: "india" },
  { symbol: "ONGC.NS", name: "ONGC", type: "india" },
  { symbol: "COALINDIA.NS", name: "Coal India", type: "india" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's", type: "india" },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", type: "india" },
  { symbol: "CIPLA.NS", name: "Cipla", type: "india" },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals", type: "india" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors", type: "india" },
  { symbol: "NESTLEIND.NS", name: "Nestle India", type: "india" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", type: "india" },
  { symbol: "BRITANNIA.NS", name: "Britannia", type: "india" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank", type: "india" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", type: "india" },
  { symbol: "GRASIM.NS", name: "Grasim Industries", type: "india" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", type: "india" },
  { symbol: "VEDL.NS", name: "Vedanta", type: "india" },
  { symbol: "TATAPOWER.NS", name: "Tata Power", type: "india" },
  { symbol: "ZOMATO.NS", name: "Zomato", type: "india" },
  { symbol: "PAYTM.NS", name: "Paytm (One97)", type: "india" },
];

const GLOBAL_INDICES = [
  // Indian
  { symbol: "^NSEI", name: "Nifty 50", type: "index", currency: "INR" },
  { symbol: "^BSESN", name: "BSE Sensex", type: "index", currency: "INR" },
  // US
  { symbol: "^GSPC", name: "S&P 500", type: "index", currency: "USD" },
  { symbol: "^DJI", name: "Dow Jones", type: "index", currency: "USD" },
  { symbol: "^IXIC", name: "NASDAQ Composite", type: "index", currency: "USD" },
  { symbol: "^RUT", name: "Russell 2000", type: "index", currency: "USD" },
  // Europe
  { symbol: "^FTSE", name: "FTSE 100", type: "index", currency: "GBP" },
  { symbol: "^GDAXI", name: "DAX", type: "index", currency: "EUR" },
  { symbol: "^FCHI", name: "CAC 40", type: "index", currency: "EUR" },
  { symbol: "^STOXX50E", name: "Euro Stoxx 50", type: "index", currency: "EUR" },
  { symbol: "^IBEX", name: "IBEX 35", type: "index", currency: "EUR" },
  // Asia-Pacific
  { symbol: "^N225", name: "Nikkei 225", type: "index", currency: "JPY" },
  { symbol: "^HSI", name: "Hang Seng", type: "index", currency: "HKD" },
  { symbol: "000001.SS", name: "Shanghai Composite", type: "index", currency: "CNY" },
  { symbol: "^KS11", name: "KOSPI", type: "index", currency: "KRW" },
  { symbol: "^STI", name: "Straits Times", type: "index", currency: "SGD" },
  { symbol: "^AXJO", name: "ASX 200", type: "index", currency: "AUD" },
  { symbol: "^TWII", name: "TAIEX", type: "index", currency: "TWD" },
  { symbol: "^JKSE", name: "Jakarta Composite", type: "index", currency: "IDR" },
  { symbol: "^KLSE", name: "KLCI", type: "index", currency: "MYR" },
  { symbol: "^NZ50", name: "NZX 50", type: "index", currency: "NZD" },
  // Americas
  { symbol: "^BVSP", name: "Bovespa", type: "index", currency: "BRL" },
  { symbol: "^MXX", name: "IPC Mexico", type: "index", currency: "MXN" },
  { symbol: "^GSPTSE", name: "TSX Composite", type: "index", currency: "CAD" },
];

// Commodities - prices in USD
const COMMODITIES = [
  { symbol: "GC=F", name: "Gold", type: "commodity", currency: "USD" },
  { symbol: "SI=F", name: "Silver", type: "commodity", currency: "USD" },
  { symbol: "CL=F", name: "Crude Oil (WTI)", type: "commodity", currency: "USD" },
];
const COMMODITY_SYMBOLS = COMMODITIES.map(c => c.symbol);

// USD to INR conversion
async function getUsdToInr(): Promise<number> {
  const cacheKey = "usd-inr-rate";
  const cached = getCached(cacheKey);
  if (cached) return cached;
  try {
    const data = await fetchYahooChart("USDINR=X", "5d", "1d");
    if (data && data.currentPrice) {
      setCache(cacheKey, data.currentPrice);
      return data.currentPrice;
    }
  } catch (e) { console.error("USD/INR fetch error:", e); }
  return 85; // fallback
}

// Index symbol → display name mapping
const INDEX_DISPLAY_NAMES: Record<string, string> = {};
for (const idx of [...GLOBAL_INDICES, ...COMMODITIES]) {
  INDEX_DISPLAY_NAMES[idx.symbol] = idx.name;
  INDEX_DISPLAY_NAMES[idx.symbol.replace("^", "%5E")] = idx.name;
}

function displaySymbol(rawSymbol: string, definedName?: string): string {
  if (INDEX_DISPLAY_NAMES[rawSymbol]) return INDEX_DISPLAY_NAMES[rawSymbol];
  return rawSymbol.replace(".NS", "");
}

async function fetchYahooChart(symbol: string, range = "3mo", interval = "1d") {
  const urlSymbol = symbol.startsWith("^") ? symbol.replace("^", "%5E") : symbol;
  const url = `${YAHOO_BASE}/${urlSymbol}?interval=${interval}&range=${range}`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
  });
  if (!resp.ok) {
    console.error(`Yahoo error for ${symbol}: ${resp.status}`);
    return null;
  }
  const data = await resp.json();
  const result = data?.chart?.result?.[0];
  if (!result) return null;
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const meta = result.meta || {};
  return {
    symbol: meta.symbol || symbol,
    name: meta.shortName || meta.longName || symbol,
    currency: meta.currency || "USD",
    currentPrice: meta.regularMarketPrice || quote.close?.[quote.close.length - 1] || 0,
    previousClose: meta.chartPreviousClose || meta.previousClose || 0,
    timestamps,
    open: quote.open || [],
    high: quote.high || [],
    low: quote.low || [],
    close: quote.close || [],
    volume: quote.volume || [],
  };
}

async function fetchStockPrices(stocks: { symbol: string; name: string; type: string; currency?: string }[]) {
  const results = await Promise.allSettled(
    stocks.map(async (s) => {
      const cacheKey = `stock-${s.symbol}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;
      const data = await fetchYahooChart(s.symbol, "5d", "1d");
      if (!data) return null;
      const closes = data.close.filter((c: number | null) => c != null) as number[];
      const lastPrice = data.currentPrice || closes[closes.length - 1] || 0;
      const prevClose = data.previousClose || closes[closes.length - 2] || lastPrice;
      const change = prevClose ? ((lastPrice - prevClose) / prevClose) * 100 : 0;
      const result = {
        id: s.symbol,
        symbol: displaySymbol(s.symbol, s.name),
        name: s.name,
        type: s.type,
        current_price: lastPrice,
        price_change_percentage_24h: change,
        currency: (s as any).currency || data.currency || "USD",
      };
      setCache(cacheKey, result);
      return result;
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value != null)
    .map((r) => r.value);
}

// Expanded crypto IDs for CoinGecko
const CRYPTO_IDS = [
  "bitcoin", "ethereum", "solana", "ripple", "cardano", "dogecoin",
  "polkadot", "avalanche-2", "chainlink", "polygon-ecosystem-token",
  "tron", "shiba-inu", "litecoin", "uniswap", "cosmos",
  "stellar", "near", "internet-computer", "aptos", "sui",
  "arbitrum", "optimism", "filecoin", "hedera-hashgraph", "vechain",
  "aave", "the-graph", "render-token", "injective-protocol", "fantom",
  "pepe", "bonk", "floki", "sei-network", "celestia",
  "stacks", "maker", "theta-token", "lido-dao", "mantle",
].join(",");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, ids, vs_currency = "usd", days = "7", symbol, range, interval } = await req.json();

    switch (action) {
      case "prices": {
        const cacheKey = `prices-${vs_currency}-${ids || "default"}`;
        const cached = getCached(cacheKey);
        if (cached) {
          return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const coinIds = ids || CRYPTO_IDS;
        const url = `${COINGECKO_BASE}/coins/markets?vs_currency=${vs_currency}&ids=${coinIds}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h,24h,7d`;
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) {
          console.error("CoinGecko error:", response.status, await response.text());
          return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const data = await response.json();
        setCache(cacheKey, data);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "chart": {
        const chartCacheKey = `chart-${ids}-${vs_currency}-${days}`;
        const chartCached = getCached(chartCacheKey);
        if (chartCached) {
          return new Response(JSON.stringify(chartCached), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const url = `${COINGECKO_BASE}/coins/${ids}/market_chart?vs_currency=${vs_currency}&days=${days}`;
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) {
          return new Response(JSON.stringify({ prices: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const data = await response.json();
        setCache(chartCacheKey, data);
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "stocks": {
        const stocksCacheKey = "stocks-all-v3";
        const stocksCached = getCached(stocksCacheKey);
        if (stocksCached) {
          return new Response(JSON.stringify(stocksCached), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const [global, indian, indices, commodities] = await Promise.all([
          fetchStockPrices(GLOBAL_STOCKS),
          fetchStockPrices(INDIAN_STOCKS),
          fetchStockPrices(GLOBAL_INDICES),
          fetchStockPrices(COMMODITIES),
        ]);
        const result = { global, indian, indices, commodities };
        setCache(stocksCacheKey, result);
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "stock-chart": {
        const chartSym = symbol || ids;
        const chartRange = range || "3mo";
        const chartInterval = interval || "1d";
        const scCacheKey = `sc-${chartSym}-${chartRange}-${chartInterval}-v2`;
        const scCached = getCached(scCacheKey);
        if (scCached) {
          return new Response(JSON.stringify(scCached), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const data = await fetchYahooChart(chartSym, chartRange, chartInterval);
        if (!data) {
          return new Response(JSON.stringify({ error: "Stock chart unavailable" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const ohlc = data.timestamps.map((ts: number, i: number) => ({
          timestamp: ts * 1000,
          time: new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          open: data.open[i] != null ? data.open[i] : null,
          high: data.high[i] != null ? data.high[i] : null,
          low: data.low[i] != null ? data.low[i] : null,
          close: data.close[i] != null ? data.close[i] : null,
          volume: data.volume[i],
        })).filter((d: any) => d.close != null);
        const chartResult = {
          meta: { symbol: displaySymbol(data.symbol), name: data.name, currency: data.currency, currentPrice: data.currentPrice },
          ohlc,
        };
        setCache(scCacheKey, chartResult);
        return new Response(JSON.stringify(chartResult), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "indicators": {
        const sym = symbol || ids;
        const indCacheKey = `ind-${sym}-v2`;
        const indCached = getCached(indCacheKey);
        if (indCached) {
          return new Response(JSON.stringify(indCached), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        let closes: number[] = [], highs: number[] = [], lows: number[] = [], volumes: number[] = [];
        let name = sym;
        let price = 0;
        let currency = "USD";
        const cryptoIds = CRYPTO_IDS.split(",");
        if (cryptoIds.includes(sym?.toLowerCase())) {
          const url = `${COINGECKO_BASE}/coins/${sym}/ohlc?vs_currency=usd&days=90`;
          const resp = await fetch(url, { headers: { Accept: "application/json" } });
          if (resp.ok) {
            const ohlcData = await resp.json();
            closes = ohlcData.map((d: number[]) => d[4]);
            highs = ohlcData.map((d: number[]) => d[2]);
            lows = ohlcData.map((d: number[]) => d[3]);
            price = closes[closes.length - 1] || 0;
            name = sym.charAt(0).toUpperCase() + sym.slice(1);
            currency = "USD";
          }
        } else {
          const data = await fetchYahooChart(sym, "1y", "1d");
          if (data) {
            closes = data.close.filter((c: number | null) => c != null) as number[];
            highs = data.high.filter((h: number | null) => h != null) as number[];
            lows = data.low.filter((l: number | null) => l != null) as number[];
            volumes = data.volume.filter((v: number | null) => v != null) as number[];
            price = data.currentPrice || closes[closes.length - 1] || 0;
            name = data.name || sym;
            currency = data.currency || "USD";
          }
        }
        // Commodities stay in USD (no conversion needed)
        if (closes.length === 0) {
          return new Response(JSON.stringify({ error: "No data available for indicators" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const rsi = computeRSI(closes);
        const sma20 = computeSMA(closes, 20);
        const sma50 = computeSMA(closes, 50);
        const sma200 = computeSMA(closes, 200);
        const macdData = computeMACD(closes);
        const sr = findSupportResistance(highs, lows);
        const volatility = computeVolatility(closes);
        const summary = generateCompressedSummary(name, price, closes, highs, lows, volumes, currency);
        const indResult = { name, price, rsi, sma20, sma50, sma200, macd: macdData, support: sr.support, resistance: sr.resistance, volatility, currency, summary };
        setCache(indCacheKey, indResult);
        return new Response(JSON.stringify(indResult), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "trending": {
        const url = `${COINGECKO_BASE}/search/trending`;
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) return new Response(JSON.stringify({ error: "Unavailable" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "global": {
        const url = `${COINGECKO_BASE}/global`;
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (!response.ok) return new Response(JSON.stringify({ error: "Unavailable" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("market-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
