import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useCoinChart, CoinMarket } from "@/hooks/useMarketData";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  coin: CoinMarket;
  onBack: () => void;
}

const periods = [
  { label: "24H", days: "1" },
  { label: "7D", days: "7" },
  { label: "1M", days: "30" },
  { label: "3M", days: "90" },
  { label: "1Y", days: "365" },
];

export function CoinDetailChart({ coin, onBack }: Props) {
  const [days, setDays] = useState("7");
  const { data: chartData, isLoading } = useCoinChart(coin.id, days);

  const positive = coin.price_change_percentage_24h >= 0;
  const formatPrice = (n: number) =>
    n >= 1 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${n.toFixed(6)}`;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <img src={coin.image} alt={coin.name} className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-foreground">{coin.name}</h2>
          <p className="text-xs text-muted-foreground uppercase">{coin.symbol}</p>
        </div>
      </div>

      {/* Price */}
      <div className="px-4 pt-4">
        <p className="text-2xl font-bold text-foreground">{formatPrice(coin.current_price)}</p>
        <div className={`flex items-center gap-1 text-sm ${positive ? "text-bullish" : "text-bearish"}`}>
          {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span className="font-medium">{positive ? "+" : ""}{coin.price_change_percentage_24h?.toFixed(2)}%</span>
          <span className="text-muted-foreground text-xs ml-1">24h</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-2 py-4 min-h-[200px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={positive ? "hsl(160, 60%, 45%)" : "hsl(0, 65%, 55%)"} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={positive ? "hsl(160, 60%, 45%)" : "hsl(0, 65%, 55%)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(215, 15%, 50%)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(2)}`} width={55} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(215, 15%, 50%)" }}
                formatter={(value: number) => [formatPrice(value), "Price"]}
              />
              <Area type="monotone" dataKey="price" stroke={positive ? "hsl(160, 60%, 45%)" : "hsl(0, 65%, 55%)"} strokeWidth={2} fill="url(#chartGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Period selector */}
      <div className="flex gap-1 px-4 pb-4">
        {periods.map((p) => (
          <button
            key={p.days}
            onClick={() => setDays(p.days)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              days === p.days
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {[
          { label: "Market Cap", value: `$${(coin.market_cap / 1e9).toFixed(2)}B` },
          { label: "24h Volume", value: `$${(coin.total_volume / 1e9).toFixed(2)}B` },
          { label: "24h High", value: formatPrice(coin.high_24h) },
          { label: "24h Low", value: formatPrice(coin.low_24h) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-secondary/50 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
