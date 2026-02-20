import { useQuery, keepPreviousData } from "@tanstack/react-query";

const MARKET_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-data`;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
};

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

export interface ChartDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

export interface StockQuote {
  id: string;
  symbol: string;
  name: string;
  type: string;
  current_price: number;
  price_change_percentage_24h: number;
  currency: string;
}

export interface OHLCPoint {
  timestamp: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorData {
  name: string;
  price: number;
  rsi: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  support: number;
  resistance: number;
  volatility: number;
  currency: string;
  summary: string;
}

async function fetchMarketPrices(): Promise<CoinMarket[]> {
  const resp = await fetch(MARKET_URL, { method: "POST", headers, body: JSON.stringify({ action: "prices" }) });
  if (!resp.ok) throw new Error("Failed to fetch market data");
  return resp.json();
}

async function fetchChartData(coinId: string, days: string): Promise<ChartDataPoint[]> {
  const resp = await fetch(MARKET_URL, { method: "POST", headers, body: JSON.stringify({ action: "chart", ids: coinId, days }) });
  if (!resp.ok) throw new Error("Failed to fetch chart data");
  const data = await resp.json();
  const numDays = parseInt(days, 10);
  return (data.prices as [number, number][]).map(([ts, price]) => ({
    timestamp: ts,
    time: numDays <= 7
      ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric" })
      : new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    price,
  }));
}

async function fetchStockPrices(): Promise<{ global: StockQuote[]; indian: StockQuote[]; indices: StockQuote[]; commodities: StockQuote[] }> {
  const resp = await fetch(MARKET_URL, { method: "POST", headers, body: JSON.stringify({ action: "stocks" }) });
  if (!resp.ok) throw new Error("Failed to fetch stock data");
  return resp.json();
}

async function fetchStockChart(symbol: string, range = "3mo", interval = "1d"): Promise<{ meta: any; ohlc: OHLCPoint[] }> {
  const resp = await fetch(MARKET_URL, { method: "POST", headers, body: JSON.stringify({ action: "stock-chart", symbol, range, interval }) });
  if (!resp.ok) throw new Error("Failed to fetch stock chart");
  return resp.json();
}

async function fetchIndicators(symbol: string): Promise<IndicatorData> {
  const resp = await fetch(MARKET_URL, { method: "POST", headers, body: JSON.stringify({ action: "indicators", symbol }) });
  if (!resp.ok) throw new Error("Failed to fetch indicators");
  return resp.json();
}

export function useMarketPrices() {
  return useQuery({ queryKey: ["market-prices"], queryFn: fetchMarketPrices, refetchInterval: 60000, staleTime: 30000 });
}

export function useCoinChart(coinId: string | null, days = "7") {
  return useQuery({ queryKey: ["coin-chart", coinId, days], queryFn: () => fetchChartData(coinId!, days), enabled: !!coinId, staleTime: 60000, placeholderData: keepPreviousData });
}

export function useStockPrices() {
  return useQuery({ queryKey: ["stock-prices"], queryFn: fetchStockPrices, refetchInterval: 120000, staleTime: 60000 });
}

export function useStockChart(symbol: string | null, range = "3mo", interval = "1d") {
  return useQuery({ queryKey: ["stock-chart", symbol, range, interval], queryFn: () => fetchStockChart(symbol!, range, interval), enabled: !!symbol, staleTime: 60000, placeholderData: keepPreviousData });
}

export function useIndicators(symbol: string | null) {
  return useQuery({ queryKey: ["indicators", symbol], queryFn: () => fetchIndicators(symbol!), enabled: !!symbol, staleTime: 120000 });
}
