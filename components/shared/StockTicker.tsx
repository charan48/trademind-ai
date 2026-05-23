"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { STOCKS, INDICES } from "@/lib/data/mockData";

const tickerItems = [
  ...INDICES.map((i) => ({
    symbol: i.displayName,
    price: i.value.toLocaleString("en-IN"),
    change: i.changePercent,
    isIndex: true,
  })),
  ...STOCKS.slice(0, 6).map((s) => ({
    symbol: s.symbol,
    price: `₹${s.price.toLocaleString("en-IN")}`,
    change: s.changePercent,
    isIndex: false,
  })),
];

export function StockTicker() {
  const items = [...tickerItems, ...tickerItems]; // doubled for seamless loop

  return (
    <div className="w-full overflow-hidden bg-bg-secondary border-b border-border ticker-fade-left py-2">
      <div className="flex animate-ticker-scroll whitespace-nowrap gap-0">
        {items.map((item, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-2 px-6 border-r border-border/50"
          >
            <span className="text-xs font-semibold text-gray-300">{item.symbol}</span>
            <span className="text-xs font-num text-white">{item.price}</span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-num font-medium ${
                item.change >= 0 ? "text-market-bull" : "text-market-bear"
              }`}
            >
              {item.change >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {item.change >= 0 ? "+" : ""}
              {item.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
