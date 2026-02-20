import { Briefcase, Plus, Trash2 } from "lucide-react";
import { usePortfolio, PortfolioItem } from "@/hooks/usePortfolio";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { formatPrice } from "@/lib/indicators";

export function PortfolioView() {
  const { items, addItem, removeItem } = usePortfolio();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ symbol: "", name: "", quantity: "", buyPrice: "", type: "crypto" as "crypto" | "stock" });

  const handleAdd = () => {
    if (!form.symbol || !form.quantity || !form.buyPrice) return;
    addItem({ symbol: form.symbol.toUpperCase(), name: form.name || form.symbol, quantity: Number(form.quantity), buyPrice: Number(form.buyPrice), type: form.type });
    setForm({ symbol: "", name: "", quantity: "", buyPrice: "", type: "crypto" });
    setShowAdd(false);
  };

  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.buyPrice, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Portfolio</h2>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        {totalValue > 0 && (
          <p className="text-2xl font-bold text-foreground mt-2">{formatPrice(totalValue)}</p>
        )}
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Buy Price" type="number" value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
              className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex gap-2">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none flex-1">
              <option value="crypto">Crypto</option>
              <option value="stock">Stock</option>
            </select>
            <Button size="sm" onClick={handleAdd} className="h-9">Add</Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Briefcase className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">No holdings yet</p>
            <p className="text-xs mt-1">Add your first position to track</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.symbol}</p>
                <p className="text-[11px] text-muted-foreground">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatPrice(item.quantity * item.buyPrice)}</p>
                <p className="text-[11px] text-muted-foreground">{item.quantity} @ {formatPrice(item.buyPrice)}</p>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive p-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
