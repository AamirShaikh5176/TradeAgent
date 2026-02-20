import { TrendingUp, TrendingDown, Star } from "lucide-react";
import { formatPrice } from "@/lib/indicators";

interface Props {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  currency?: string;
  type?: string;
  isWatched?: boolean;
  onToggleWatch?: () => void;
  onClick?: () => void;
}

export function AssetCard({ id, symbol, name, price, change, currency = "USD", type, isWatched, onToggleWatch, onClick }: Props) {
  const positive = change >= 0;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border/30"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{symbol}</span>
          {type && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider">
              {type}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{name}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-foreground">{formatPrice(price, currency)}</p>
        <p className={`text-[11px] font-medium flex items-center justify-end gap-0.5 ${positive ? "text-bullish" : "text-bearish"}`}>
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {positive ? "+" : ""}{change.toFixed(2)}%
        </p>
      </div>
      {onToggleWatch && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWatch(); }}
          className="shrink-0 p-1"
        >
          <Star className={`h-4 w-4 transition-colors ${isWatched ? "fill-warning text-warning" : "text-muted-foreground hover:text-warning"}`} />
        </button>
      )}
    </div>
  );
}
