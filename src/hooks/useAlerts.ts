import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "tradeagent-alerts";

export interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  targetPrice: number;
  direction: "above" | "below";
  isActive: boolean;
  createdAt: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); }, [alerts]);

  const addAlert = useCallback((alert: Omit<PriceAlert, "id" | "isActive" | "createdAt">) => {
    setAlerts((prev) => [...prev, { ...alert, id: crypto.randomUUID(), isActive: true, createdAt: new Date().toISOString() }]);
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)));
  }, []);

  return { alerts, addAlert, removeAlert, toggleAlert };
}
