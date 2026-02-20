import { useState } from "react";
import { Search, TrendingUp, TrendingDown, Loader2, Star } from "lucide-react";
import { useMarketPrices, useStockPrices } from "@/hooks/useMarketData";
import { useWatchlist } from "@/hooks/useWatchlist";
import { formatPrice } from "@/lib/indicators";
import { getAssetLogo } from "@/lib/stockLogos";

type Category = "crypto" | "global" | "india" | "indices" | "commodities";

interface Props {
  onSelectAsset: (asset: { id: string; symbol: string; name: string; type: string; currency?: string }) => void;
}

const tabs: { label: string; value: Category }[] = [
  { label: "Crypto", value: "crypto" },
  { label: "Global", value: "global" },
  { label: "India", value: "india" },
  { label: "Indices", value: "indices" },
  { label: "Commodities", value: "commodities" },
];

const currencySymbols: Record<string, string> = {
  USD: "$", INR: "₹", GBP: "£", EUR: "€", JPY: "¥", HKD: "HK$", CNY: "¥", KRW: "₩", SGD: "S$", AUD: "A$",
};

function fmtPrice(price: number, currency: string) {
  const sym = currencySymbols[currency] || "$";
  if (currency === "INR") return `₹${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  if (currency === "JPY" || currency === "KRW") return `${sym}${Math.round(price).toLocaleString()}`;
  return `${sym}${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function MarketsView({ onSelectAsset }: Props) {
  const [category, setCategory] = useState<Category>("crypto");
  const [search, setSearch] = useState("");
  const { data: coins, isLoading: cryptoLoading } = useMarketPrices();
  const { data: stocks, isLoading: stocksLoading } = useStockPrices();
  const { toggle, isWatched } = useWatchlist();

  const filterBySearch = <T extends { name: string; symbol: string }>(items: T[]) =>
    items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.symbol.toLowerCase().includes(search.toLowerCase()));

  const isLoading = category === "crypto" ? cryptoLoading : stocksLoading;

  const counts = {
    crypto: coins?.length || 0,
    global: stocks?.global?.length || 0,
    india: stocks?.indian?.length || 0,
    indices: stocks?.indices?.length || 0,
    commodities: stocks?.commodities?.length || 0,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Markets</h2>
          </div>
          <span className="text-xs text-muted-foreground">{counts[category]} assets</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 mb-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none flex-1"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setCategory(t.value)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                category === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {counts[t.value] > 0 && <span className="ml-1 opacity-60">({counts[t.value]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/30">
        <span className="flex-1">Asset</span>
        <span className="w-28 text-right">Price</span>
        <span className="w-16 text-right">24h</span>
        <span className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {category === "crypto" && coins && filterBySearch(coins).map((c) => (
              <MarketRow key={c.id} id={c.id} symbol={c.symbol.toUpperCase()} name={c.name} price={c.current_price} change={c.price_change_percentage_24h} currency="USD" image={c.image} isWatched={isWatched(c.id)} onToggleWatch={() => toggle(c.id)} onClick={() => onSelectAsset({ id: c.id, symbol: c.symbol, name: c.name, type: "crypto", currency: "USD" })} />
            ))}
            {category === "global" && stocks?.global && filterBySearch(stocks.global).map((s) => (
              <MarketRow key={s.id} id={s.id} symbol={s.symbol} name={s.name} price={s.current_price} change={s.price_change_percentage_24h} currency={s.currency} image={getAssetLogo(s.id, "stock") || undefined} isWatched={isWatched(s.id)} onToggleWatch={() => toggle(s.id)} onClick={() => onSelectAsset({ id: s.id, symbol: s.id, name: s.name, type: "stock", currency: s.currency })} />
            ))}
            {category === "india" && stocks?.indian && filterBySearch(stocks.indian).map((s) => (
              <MarketRow key={s.id} id={s.id} symbol={s.symbol} name={s.name} price={s.current_price} change={s.price_change_percentage_24h} currency={s.currency} image={getAssetLogo(s.id, "stock") || undefined} isWatched={isWatched(s.id)} onToggleWatch={() => toggle(s.id)} onClick={() => onSelectAsset({ id: s.id, symbol: s.id, name: s.name, type: "stock", currency: s.currency })} />
            ))}
            {category === "indices" && stocks?.indices && filterBySearch(stocks.indices).map((s) => (
              <MarketRow key={s.id} id={s.id} symbol={s.symbol} name={s.name} price={s.current_price} change={s.price_change_percentage_24h} currency={s.currency} image={getAssetLogo(s.id, "index") || undefined} isWatched={isWatched(s.id)} onToggleWatch={() => toggle(s.id)} onClick={() => onSelectAsset({ id: s.id, symbol: s.id, name: s.name, type: "index", currency: s.currency })} />
            ))}
            {category === "commodities" && stocks?.commodities && filterBySearch(stocks.commodities).map((s) => (
              <MarketRow key={s.id} id={s.id} symbol={s.symbol} name={s.name} price={s.current_price} change={s.price_change_percentage_24h} currency={s.currency} image={getAssetLogo(s.id, "commodity") || undefined} isWatched={isWatched(s.id)} onToggleWatch={() => toggle(s.id)} onClick={() => onSelectAsset({ id: s.id, symbol: s.id, name: s.name, type: "commodity", currency: s.currency })} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function MarketRow({
  id, symbol, name, price, change, currency = "USD", image,
  isWatched, onToggleWatch, onClick,
}: {
  id: string; symbol: string; name: string; price: number; change: number;
  currency?: string; image?: string;
  isWatched?: boolean; onToggleWatch?: () => void; onClick?: () => void;
}) {
  const positive = change >= 0;
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer border-b border-border/20 group"
    >
      {image && !imgError ? (
        <img src={image} alt={name} className="w-8 h-8 rounded-full shrink-0 bg-secondary object-contain" onError={() => setImgError(true)} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground">{symbol.slice(0, 2)}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate block">{symbol}</span>
        <p className="text-[11px] text-muted-foreground truncate">{name}</p>
      </div>
      <div className="w-28 text-right shrink-0">
        <p className="text-sm font-semibold text-foreground">{fmtPrice(price, currency)}</p>
      </div>
      <div className="w-16 text-right shrink-0">
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
          positive ? "text-bullish bg-bullish/15" : "text-bearish bg-bearish/15"
        }`}>
          {positive ? "+" : ""}{change.toFixed(2)}%
        </span>
      </div>
      {onToggleWatch && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleWatch(); }}
          className="shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={isWatched ? { opacity: 1 } : undefined}
        >
          <Star className={`h-3.5 w-3.5 transition-colors ${isWatched ? "fill-warning text-warning" : "text-muted-foreground hover:text-warning"}`} />
        </button>
      )}
    </div>
  );
}
