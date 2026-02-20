import { useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Zap, Loader2, BarChart3, LineChart } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Line, Cell, ReferenceLine,
} from "recharts";
import { useStockChart, useCoinChart, useIndicators } from "@/hooks/useMarketData";
import { Button } from "@/components/ui/button";
import { formatPrice, rsiColor, signalColor, signalBg } from "@/lib/indicators";

interface Props {
  asset: { id: string; symbol: string; name: string; type: string; currency?: string };
  onBack: () => void;
  onAnalyze: (prompt: string) => void;
}

const periods = [
  { label: "1W", range: "5d", days: "7", interval: "1h" },
  { label: "1M", range: "1mo", days: "30", interval: "1d" },
  { label: "3M", range: "3mo", days: "90", interval: "1d" },
  { label: "1Y", range: "1y", days: "365", interval: "1wk" },
];

type ChartMode = "area" | "candle";

const INDEX_NAMES: Record<string, string> = {
  "^NSEI": "NIFTY 50", "%5ENSEI": "NIFTY 50",
  "^BSESN": "SENSEX", "%5EBSESN": "SENSEX",
  "^GSPC": "S&P 500", "%5EGSPC": "S&P 500",
  "^DJI": "DOW JONES", "%5EDJI": "DOW JONES",
  "^IXIC": "NASDAQ", "%5EIXIC": "NASDAQ",
  "^RUT": "RUSSELL 2000", "%5ERUT": "RUSSELL 2000",
  "^FTSE": "FTSE 100", "%5EFTSE": "FTSE 100",
  "^GDAXI": "DAX", "%5EGDAXI": "DAX",
  "^FCHI": "CAC 40", "%5EFCHI": "CAC 40",
  "^STOXX50E": "EURO STOXX 50", "%5ESTOXX50E": "EURO STOXX 50",
  "^IBEX": "IBEX 35", "%5EIBEX": "IBEX 35",
  "^N225": "NIKKEI 225", "%5EN225": "NIKKEI 225",
  "^HSI": "HANG SENG", "%5EHSI": "HANG SENG",
  "000001.SS": "SHANGHAI",
  "^KS11": "KOSPI", "%5EKS11": "KOSPI",
  "^STI": "STI", "%5ESTI": "STI",
  "^AXJO": "ASX 200", "%5EAXJO": "ASX 200",
  "^TWII": "TAIEX", "%5ETWII": "TAIEX",
  "^JKSE": "JAKARTA", "%5EJKSE": "JAKARTA",
  "^KLSE": "KLCI", "%5EKLSE": "KLCI",
  "^NZ50": "NZX 50", "%5ENZ50": "NZX 50",
  "^BVSP": "BOVESPA", "%5EBVSP": "BOVESPA",
  "^MXX": "IPC MEXICO", "%5EMXX": "IPC MEXICO",
  "^GSPTSE": "TSX", "%5EGSPTSE": "TSX",
  "GC=F": "GOLD", "SI=F": "SILVER", "CL=F": "CRUDE OIL",
};

function displayAssetSymbol(symbol: string): string {
  if (INDEX_NAMES[symbol]) return INDEX_NAMES[symbol];
  return symbol.replace(".NS", "");
}

export function AssetDetail({ asset, onBack, onAnalyze }: Props) {
  const [periodIdx, setPeriodIdx] = useState(1);
  const [chartMode, setChartMode] = useState<ChartMode>("area");
  const period = periods[periodIdx];

  const isCrypto = asset.type === "crypto";
  const isYahoo = !isCrypto; // stocks, indices, commodities all use Yahoo
  const cryptoChart = useCoinChart(isCrypto ? asset.id : null, period.days);
  const stockChart = useStockChart(isYahoo ? asset.symbol : null, period.range, period.interval);
  const indicators = useIndicators(isCrypto ? asset.id : asset.symbol);

  const chartLoading = isCrypto ? (cryptoChart.isLoading || cryptoChart.isFetching) : (stockChart.isLoading || stockChart.isFetching);

  const currency = indicators.data?.currency || asset.currency || stockChart.data?.meta?.currency || "USD";

  // Normalize chart data
  let chartData: { time: string; price: number; open?: number; high?: number; low?: number; close?: number; volume?: number }[] = [];
  if (isCrypto && cryptoChart.data) {
    chartData = cryptoChart.data.map((d) => ({ time: d.time, price: d.price }));
  } else if (isYahoo && stockChart.data?.ohlc) {
    chartData = stockChart.data.ohlc.map((d) => ({
      time: d.time, price: d.close, open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume,
    }));
  }

  const currentPrice = indicators.data?.price || chartData[chartData.length - 1]?.price || 0;
  const firstPrice = chartData[0]?.price || currentPrice;
  const priceChange = firstPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;
  const positive = priceChange >= 0;

  const rsi = indicators.data?.rsi;
  const macd = indicators.data?.macd;

  const fmtCurrency = currency === "INR" ? "INR" : "USD";
  const currencySymbol = currency === "INR" ? "₹" : "$";

  const fmtAxisTick = (v: number) => {
    if (v >= 100000) return `${currencySymbol}${(v / 1000).toFixed(0)}k`;
    if (v >= 1000) return `${currencySymbol}${(v / 1000).toFixed(1)}k`;
    return `${currencySymbol}${v.toFixed(2)}`;
  };

  const hasOHLC = chartData.length > 0 && chartData[0].open !== undefined;

  // High / Low range for this period
  const periodHigh = chartData.length > 0 ? Math.max(...chartData.map(d => d.high || d.price)) : 0;
  const periodLow = chartData.length > 0 ? Math.min(...chartData.map(d => d.low || d.price)) : 0;
  const rangePercent = periodHigh > periodLow ? ((currentPrice - periodLow) / (periodHigh - periodLow)) * 100 : 50;

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground truncate">{asset.name}</h2>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider shrink-0">
              {asset.type === "crypto" ? "CRYPTO" : asset.type === "index" ? "INDEX" : asset.type === "commodity" ? "COMMODITY" : currency === "INR" ? "NSE" : "STOCK"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground uppercase">{displayAssetSymbol(asset.symbol)}</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1" onClick={() => onAnalyze(`Analyze ${asset.name} (${asset.symbol}) - give me a full quantitative trading report`)}>
          <Zap className="h-3.5 w-3.5" />
          Analyze
        </Button>
      </div>

      {/* Price + High/Low */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-2xl font-bold text-foreground">{formatPrice(currentPrice, fmtCurrency)}</p>
        <div className={`flex items-center gap-1 text-sm ${positive ? "text-bullish" : "text-bearish"}`}>
          {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span className="font-medium">{positive ? "+" : ""}{priceChange.toFixed(2)}%</span>
          <span className="text-muted-foreground text-xs ml-1">({period.label})</span>
        </div>
        {/* High/Low range bar */}
        {chartData.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Low {formatPrice(periodLow, fmtCurrency)}</span>
              <span>High {formatPrice(periodHigh, fmtCurrency)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden relative">
              <div
                className="absolute h-full rounded-full"
                style={{
                  width: `${rangePercent}%`,
                  background: `linear-gradient(90deg, hsl(var(--bearish)), hsl(var(--warning)), hsl(var(--bullish)))`,
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground border border-background shadow-sm"
                style={{ left: `calc(${rangePercent}% - 4px)` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Chart mode toggle + Period selector */}
      <div className="flex items-center gap-2 px-4 pb-2">
        {hasOHLC && (
          <div className="flex rounded-lg bg-secondary p-0.5 shrink-0">
            <button
              onClick={() => setChartMode("area")}
              className={`p-1.5 rounded-md transition-colors ${chartMode === "area" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Area chart"
            >
              <LineChart className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setChartMode("candle")}
              className={`p-1.5 rounded-md transition-colors ${chartMode === "candle" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Candlestick chart"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex gap-1 flex-1">
          {periods.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPeriodIdx(i)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                periodIdx === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-2" style={{ height: 260 }}>
        {chartLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          chartMode === "candle" && hasOHLC ? (
            <CandlestickChart data={chartData} fmtCurrency={fmtCurrency} fmtAxisTick={fmtAxisTick} />
          ) : (
            <ResponsiveContainer width="100%" height={244}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={positive ? "hsl(155, 65%, 48%)" : "hsl(0, 65%, 55%)"} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={positive ? "hsl(155, 65%, 48%)" : "hsl(0, 65%, 55%)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis domain={['dataMin', 'dataMax']} tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }} tickLine={false} axisLine={false} width={65} tickFormatter={fmtAxisTick} padding={{ top: 10, bottom: 10 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [formatPrice(value, fmtCurrency), "Price"]}
                />
                <Area type="monotone" dataKey="price" stroke={positive ? "hsl(155, 65%, 48%)" : "hsl(0, 65%, 55%)"} strokeWidth={2} fill="url(#assetGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No chart data</div>
        )}
      </div>

      {/* Volume sub-chart (stocks only) */}
      {!isCrypto && chartData.length > 0 && chartData[0].volume !== undefined && (
        <div className="px-2" style={{ height: 70 }}>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={chartData}>
              <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={false} axisLine={false} tickLine={false} width={65} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => [(value / 1e6).toFixed(2) + "M", "Volume"]}
              />
              <Bar dataKey="volume" opacity={0.6}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.close && entry.open
                        ? entry.close >= entry.open
                          ? "hsl(155, 65%, 48%)"
                          : "hsl(0, 65%, 55%)"
                        : "hsl(215, 50%, 35%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Indicators */}
      {indicators.data && (
        <div className="px-4 pb-4 pt-2 space-y-3">
          {/* Signal badge */}
          {indicators.data.summary && (() => {
            const match = indicators.data.summary.match(/Signal: (BUY|SELL|HOLD) \(confidence: (\d+)%\)/);
            if (!match) return null;
            const [, signal, confidence] = match;
            return (
              <div className={`flex items-center justify-between rounded-xl border p-3 ${signalBg(signal)}`}>
                <div>
                  <p className="text-xs text-muted-foreground">AI Signal</p>
                  <p className={`text-lg font-bold ${signalColor(signal)}`}>{signal}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-lg font-bold text-foreground">{confidence}%</p>
                </div>
              </div>
            );
          })()}

          {/* RSI gauge */}
          {rsi !== undefined && (
            <div className="rounded-xl bg-secondary/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">RSI (14)</span>
                <span className={`text-sm font-bold ${rsiColor(rsi)}`}>{rsi.toFixed(1)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, rsi)}%`,
                    background: rsi > 70 ? "hsl(0, 65%, 55%)" : rsi < 30 ? "hsl(155, 65%, 48%)" : "hsl(40, 90%, 55%)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-muted-foreground">Oversold</span>
                <span className="text-[9px] text-muted-foreground">Overbought</span>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "SMA 20", value: indicators.data.sma20 ? formatPrice(indicators.data.sma20, fmtCurrency) : "N/A" },
              { label: "SMA 50", value: indicators.data.sma50 ? formatPrice(indicators.data.sma50, fmtCurrency) : "N/A" },
              { label: "SMA 200", value: indicators.data.sma200 ? formatPrice(indicators.data.sma200, fmtCurrency) : "N/A" },
              { label: "Volatility", value: `${indicators.data.volatility.toFixed(2)}%` },
              { label: "Support", value: formatPrice(indicators.data.support, fmtCurrency) },
              { label: "Resistance", value: formatPrice(indicators.data.resistance, fmtCurrency) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-secondary/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* MACD */}
          {macd && (
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground mb-2">MACD (12, 26, 9)</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">MACD</p>
                  <p className={`text-sm font-bold ${macd.macd > 0 ? "text-bullish" : "text-bearish"}`}>{macd.macd.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Signal</p>
                  <p className="text-sm font-bold text-foreground">{macd.signal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Histogram</p>
                  <p className={`text-sm font-bold ${macd.histogram > 0 ? "text-bullish" : "text-bearish"}`}>{macd.histogram.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {indicators.isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground ml-2">Loading indicators...</span>
        </div>
      )}
    </div>
  );
}

/* ── Candlestick Chart Sub-component ─────────────────────────────── */

function CandlestickChart({
  data,
  fmtCurrency,
  fmtAxisTick,
}: {
  data: { time: string; price: number; open?: number; high?: number; low?: number; close?: number }[];
  fmtCurrency: string;
  fmtAxisTick: (v: number) => string;
}) {
  // Custom shape for candlestick body + wick
  const CandleShape = (props: any) => {
    const { x, y, width, height, payload } = props;
    if (!payload || payload.open == null || payload.close == null) return null;

    const { open, high, low, close } = payload;
    const bullish = close >= open;
    const color = bullish ? "hsl(155, 65%, 48%)" : "hsl(0, 65%, 55%)";

    // We need to map price values to Y coordinates
    // y and height correspond to the "body" range (open-close already mapped by composed chart)
    const bodyTop = Math.min(y, y + height);
    const bodyBottom = Math.max(y, y + height);
    const candleWidth = Math.max(width * 0.6, 2);
    const candleX = x + (width - candleWidth) / 2;

    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={bodyTop}
          x2={x + width / 2}
          y2={bodyBottom}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={candleX}
          y={bodyTop + (bodyBottom - bodyTop) * 0.15}
          width={candleWidth}
          height={Math.max((bodyBottom - bodyTop) * 0.7, 1)}
          fill={bullish ? color : color}
          stroke={color}
          strokeWidth={0.5}
          rx={1}
        />
      </g>
    );
  };

  // For candlestick, use a bar chart where we map high-low as the bar range
  return (
    <ResponsiveContainer width="100%" height={244}>
      <ComposedChart data={data}>
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={['dataMin', 'dataMax']} tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }} tickLine={false} axisLine={false} width={65} tickFormatter={fmtAxisTick} padding={{ top: 10, bottom: 10 }} />
        <Tooltip
          contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
          formatter={(value: number, name: string) => {
            if (name === "price") return [formatPrice(value, fmtCurrency), "Close"];
            return [formatPrice(value, fmtCurrency), name.charAt(0).toUpperCase() + name.slice(1)];
          }}
          labelFormatter={(label) => label}
        />
        {/* Using a bar from low to high for wick range */}
        <Bar dataKey="high" shape={<CandleShape />} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={i} />
          ))}
        </Bar>
        {/* Close price line overlay */}
        <Line type="monotone" dataKey="price" stroke="hsl(215, 15%, 50%)" strokeWidth={1} dot={false} strokeDasharray="3 3" opacity={0.4} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
