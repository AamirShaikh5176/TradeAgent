import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";
import { useMarketPrices, CoinMarket } from "@/hooks/useMarketData";
import { SparklineChart } from "./SparklineChart";
import { CoinDetailChart } from "./CoinDetailChart";

export function MarketSidebar() {
  const { data: coins, isLoading, refetch, isFetching } = useMarketPrices();
  const [search, setSearch] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<CoinMarket | null>(null);

  const filtered = coins?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (n: number) =>
    n >= 1 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${n.toFixed(4)}`;

  if (selectedCoin) {
    return (
      <aside className="hidden lg:flex w-80 flex-col border-l border-border bg-card/30 overflow-hidden">
        <CoinDetailChart coin={selectedCoin} onBack={() => setSelectedCoin(null)} />
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex w-80 flex-col border-l border-border bg-card/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Markets</h2>
        </div>
        <button
          onClick={() => refetch()}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search coins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none flex-1"
          />
        </div>
      </div>

      {/* Coin List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="divide-y divide-border/50">
            {filtered.map((coin) => {
              const positive = coin.price_change_percentage_24h >= 0;
              return (
                <button
                  key={coin.id}
                  onClick={() => setSelectedCoin(coin)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                >
                  <img src={coin.image} alt={coin.name} className="h-8 w-8 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{coin.name}</span>
                      <span className="text-sm font-semibold text-foreground ml-2">{formatPrice(coin.current_price)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[11px] text-muted-foreground uppercase">{coin.symbol}</span>
                      <span className={`text-[11px] font-medium flex items-center gap-0.5 ${positive ? "text-bullish" : "text-bearish"}`}>
                        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {positive ? "+" : ""}{coin.price_change_percentage_24h?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {coin.sparkline_in_7d?.price && (
                    <div className="w-16 shrink-0">
                      <SparklineChart data={coin.sparkline_in_7d.price} positive={positive} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-8">No coins found</p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2">
        <p className="text-[10px] text-muted-foreground/60">
          Data from CoinGecko · Auto-refreshes every 60s
        </p>
      </div>
    </aside>
  );
}
