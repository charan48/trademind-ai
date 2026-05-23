"use client";

import { useEffect, useCallback, useRef } from "react";
import { useLiveMarketStore, LiveQuote } from "@/lib/store/store";

const REFRESH_OPEN   = 30_000;       // 30s during market hours
const REFRESH_CLOSED = 5 * 60_000;   // 5 min outside hours

function isMarketHours(): boolean {
  const d = new Date();
  const day = d.getDay();
  if (day === 0 || day === 6) return false;
  const mins = d.getHours() * 60 + d.getMinutes();
  return mins >= 9 * 60 + 15 && mins < 15 * 60 + 30;
}

export function useLiveMarket() {
  const { setQuotes, setLoading, setError, setLastUpdated } = useLiveMarketStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    setLoading(true);
    fetchQuotes();

    const schedule = () => {
      const delay = isMarketHours() ? REFRESH_OPEN : REFRESH_CLOSED;
      timerRef.current = setTimeout(() => { fetchQuotes(); schedule(); }, delay);
    };
    schedule();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fetchQuotes, setLoading]);
}
