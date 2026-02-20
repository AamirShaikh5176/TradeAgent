import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "tradeagent-watchlist";

export function useWatchlist() {
  const [items, setItems] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  const toggle = useCallback((id: string) => {
    setItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }, []);

  const isWatched = useCallback((id: string) => items.includes(id), [items]);

  return { items, toggle, isWatched };
}
