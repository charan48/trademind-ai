"use client";

import { useEffect, useCallback, useRef } from "react";
import { useLiveMarketStore, LiveQuote, LiveTechnicals } from "@/lib/store/store";
import { STOCK_SYMBOLS } from "@/lib/market/symbols";

const REFRESH_OPEN    = 30_000;           // 30s during market hours
const REFRESH_CLOSED  = 5 * 60_000;       // 5 min outside hours
const TECH_REFRESH_MS = 6 * 60 * 60_000;  // 6h

function isMarketHours(): boolean {
  const d = new Date();
  const day = d.getDay();
  if (day === 0 || day === 6) return false;
  const mins = d.getHours() * 60 + d.getMinutes();
  return mins >= 9 * 60 + 15 && mins < 15 * 60 + 30;
}

const ALL_STOCK_SYMBOLS = Object.keys(STOCK_SYMBOLS);

export function useLiveMarket() {
  const { setQuotes, setTechnicals, setLoading, setError, setLastUpdated } = useLiveMarketStore();
  const timerRef     = useRef<NodeJS.Timeout | null>(null);
  const techTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/market/quotes", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && data.quotes) {
        setQuotes(data.quotes as Record<string, LiveQuote>);
        setLastUpdated(data.timestamp);
        setError(null);
      } else {
        setError(data.error ?? "Failed to fetch");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [setQuotes, setLoading, setError, setLastUpdated]);

  const fetchTechnicals = useCallback(async () => {
    await Promise.allSettled(
      ALL_STOCK_SYMBOLS.map(async (sym) => {
        try {
          const res = await fetch(`/api/market/chart/${sym}?range=2y`, { cache: "no-store" });
          const data = await res.json();
          if (data.ok && data.technicals) {
            setTechnicals(sym, data.technicals as LiveTechnicals);
          }
        } catch { /* silent */ }
      })
    );
  }, [setTechnicals]);

  useEffect(() => {
    setLoading(true);
    fetchQuotes();
    fetchTechnicals();

    const schedule = () => {
      const delay = isMarketHours() ? REFRESH_OPEN : REFRESH_CLOSED;
      timerRef.current = setTimeout(() => { fetchQuotes(); schedule(); }, delay);
    };
    schedule();

    techTimerRef.current = setInterval(fetchTechnicals, TECH_REFRESH_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (techTimerRef.current) clearInterval(techTimerRef.current);
    };
  }, [fetchQuotes, fetchTechnicals, setLoading]);
}
