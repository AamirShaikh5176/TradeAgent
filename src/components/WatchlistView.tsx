import { Star } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useMarketPrices, useStockPrices } from "@/hooks/useMarketData";
import { AssetCard } from "./AssetCard";

interface Props {
  onSelectAsset: (asset: { id: string; symbol: string; name: string; type: string }) => void;
}

export function WatchlistView({ onSelectAsset }: Props) {
  const { items, toggle } = useWatchlist();
  const { data: coins } = useMarketPrices();
  const { data: stocks } = useStockPrices();

  const allStocks = [...(stocks?.global || []), ...(stocks?.indian || []), ...(stocks?.indices || [])];

  const watchedCoins = coins?.filter((c) => items.includes(c.id)) || [];
  const watchedStocks = allStocks.filter((s) => items.includes(s.id));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-bold text-foreground">Watchlist</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{items.length} assets</p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Star className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Watchlist empty</p>
            <p className="text-xs mt-1">Star assets from Markets to add them here</p>
          </div>
        ) : (
          <>
            {watchedCoins.map((c) => (
              <AssetCard
                key={c.id} id={c.id} symbol={c.symbol.toUpperCase()} name={c.name}
                price={c.current_price} change={c.price_change_percentage_24h} type="crypto"
                isWatched onToggleWatch={() => toggle(c.id)}
                onClick={() => onSelectAsset({ id: c.id, symbol: c.symbol, name: c.name, type: "crypto" })}
              />
            ))}
            {watchedStocks.map((s) => (
              <AssetCard
                key={s.id} id={s.id} symbol={s.symbol} name={s.name}
                price={s.current_price} change={s.price_change_percentage_24h} currency={s.currency} type={s.type}
                isWatched onToggleWatch={() => toggle(s.id)}
                onClick={() => onSelectAsset({ id: s.id, symbol: s.id, name: s.name, type: "stock" })}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
