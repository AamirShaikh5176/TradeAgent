const currencySymbols: Record<string, string> = {
  USD: "$", INR: "₹", GBP: "£", EUR: "€", JPY: "¥", HKD: "HK$", CNY: "¥", KRW: "₩", SGD: "S$", AUD: "A$",
};

export function formatPrice(n: number, currency = "USD"): string {
  if (currency === "INR") return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  if (currency === "JPY" || currency === "KRW") {
    const sym = currencySymbols[currency] || "$";
    return `${sym}${Math.round(n).toLocaleString()}`;
  }
  const sym = currencySymbols[currency] || "$";
  return n >= 1 ? `${sym}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `${sym}${n.toFixed(6)}`;
}

export function rsiColor(rsi: number): string {
  if (rsi > 70) return "text-bearish";
  if (rsi < 30) return "text-bullish";
  return "text-warning";
}

export function signalColor(signal: string): string {
  if (signal === "BUY") return "text-bullish";
  if (signal === "SELL") return "text-bearish";
  return "text-warning";
}

export function signalBg(signal: string): string {
  if (signal === "BUY") return "bg-bullish/15 border-bullish/30";
  if (signal === "SELL") return "bg-bearish/15 border-bearish/30";
  return "bg-warning/15 border-warning/30";
}
