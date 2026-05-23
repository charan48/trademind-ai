"use client";

import { useEffect, useState } from "react";

const MARKET_START = { h: 9, m: 15 };
const MARKET_END   = { h: 15, m: 30 };

function isMarketOpen(d: Date) {
  const day = d.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const h = d.getHours(), m = d.getMinutes();
  const mins = h * 60 + m;
  return mins >= MARKET_START.h * 60 + MARKET_START.m &&
         mins <  MARKET_END.h   * 60 + MARKET_END.m;
}

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <span className="text-sm text-gray-400">Loading...</span>;

  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  const open = isMarketOpen(now);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400">{dateStr} · {timeStr} IST</span>
      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
        open ? "bg-market-bull/15 text-market-bull" : "bg-market-bear/15 text-market-bear"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${open ? "bg-market-bull animate-pulse" : "bg-market-bear"}`} />
        {open ? "Market Open" : "Market Closed"}
      </span>
    </div>
  );
}
