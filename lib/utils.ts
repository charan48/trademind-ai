import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "INR"): string {
  if (currency === "INR") {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(2)}K`;
    return `₹${value.toFixed(2)}`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toFixed(2);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatChange(change: number, price: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${((change / price) * 100).toFixed(2)}%)`;
}

export function formatVolume(volume: number): string {
  if (volume >= 10000000) return `${(volume / 10000000).toFixed(2)}Cr`;
  if (volume >= 100000) return `${(volume / 100000).toFixed(2)}L`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`;
  return volume.toString();
}

export function formatMarketCap(cap: number): string {
  if (cap >= 10000000000000) return `₹${(cap / 10000000000000).toFixed(2)}L Cr`;
  if (cap >= 100000000000) return `₹${(cap / 100000000000).toFixed(2)}K Cr`;
  if (cap >= 10000000) return `₹${(cap / 10000000).toFixed(2)} Cr`;
  return `₹${cap}`;
}

export function getChangeColor(value: number): string {
  if (value > 0) return "text-market-bull";
  if (value < 0) return "text-market-bear";
  return "text-gray-400";
}

export function getBgChangeColor(value: number): string {
  if (value > 0) return "bg-bull";
  if (value < 0) return "bg-bear";
  return "bg-surface";
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "Strongly Bullish": return "text-emerald-400";
    case "Bullish": return "text-green-400";
    case "Neutral": return "text-yellow-400";
    case "Bearish": return "text-red-400";
    case "Strongly Bearish": return "text-rose-600";
    default: return "text-gray-400";
  }
}

export function getAIScoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  if (score >= 40) return "#EF4444";
  return "#6B7280";
}

export function generateChartData(
  basePrice: number,
  days = 30,
  volatility = 0.02
): { date: string; open: number; high: number; low: number; close: number; volume: number }[] {
  const data = [];
  let price = basePrice * (1 - volatility * 10);
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    price = Math.max(price + change, 1);
    const high = Math.max(open, price) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, price) * (1 - Math.random() * volatility * 0.5);
    const volume = Math.floor(Math.random() * 5000000 + 500000);

    data.push({
      date: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume,
    });
  }

  return data;
}

export function generateIntraday(basePrice: number): { time: string; value: number }[] {
  const data = [];
  let price = basePrice * 0.98;
  const times = ["09:15","09:30","09:45","10:00","10:15","10:30","10:45","11:00","11:15","11:30","11:45","12:00","12:15","12:30","12:45","13:00","13:15","13:30","13:45","14:00","14:15","14:30","14:45","15:00","15:15","15:30"];

  for (const time of times) {
    const change = (Math.random() - 0.47) * 0.008 * price;
    price = Math.max(price + change, 1);
    data.push({ time, value: parseFloat(price.toFixed(2)) });
  }

  return data;
}

export function clampPercent(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max);
}
