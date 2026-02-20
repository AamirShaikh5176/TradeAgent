import { Bell, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useAlerts, PriceAlert } from "@/hooks/useAlerts";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { formatPrice } from "@/lib/indicators";

export function AlertsView() {
  const { alerts, addAlert, removeAlert, toggleAlert } = useAlerts();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ symbol: "", name: "", targetPrice: "", direction: "above" as "above" | "below" });

  const handleAdd = () => {
    if (!form.symbol || !form.targetPrice) return;
    addAlert({ symbol: form.symbol.toUpperCase(), name: form.name || form.symbol, targetPrice: Number(form.targetPrice), direction: form.direction });
    setForm({ symbol: "", name: "", targetPrice: "", direction: "above" });
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Price Alerts</h2>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="Target Price" type="number" value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
              className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as any })}
              className="rounded-lg bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
          <Button size="sm" onClick={handleAdd} className="w-full h-9">Create Alert</Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bell className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">No alerts set</p>
            <p className="text-xs mt-1">Create a price alert to get notified</p>
          </div>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className={`flex items-center gap-3 px-4 py-3 border-b border-border/30 ${!a.isActive ? "opacity-50" : ""}`}>
              <div className={`p-1.5 rounded-lg ${a.direction === "above" ? "bg-bullish/15" : "bg-bearish/15"}`}>
                {a.direction === "above" ? <ArrowUp className="h-3.5 w-3.5 text-bullish" /> : <ArrowDown className="h-3.5 w-3.5 text-bearish" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.symbol}</p>
                <p className="text-[11px] text-muted-foreground">{a.direction === "above" ? "Above" : "Below"} {formatPrice(a.targetPrice)}</p>
              </div>
              <button onClick={() => toggleAlert(a.id)} className={`text-xs px-2 py-1 rounded-lg ${a.isActive ? "bg-bullish/15 text-bullish" : "bg-secondary text-muted-foreground"}`}>
                {a.isActive ? "Active" : "Paused"}
              </button>
              <button onClick={() => removeAlert(a.id)} className="text-muted-foreground hover:text-destructive p-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
