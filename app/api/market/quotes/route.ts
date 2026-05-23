import { NextRequest, NextResponse } from "next/server";
import { ALL_YF, fromYF } from "@/lib/market/symbols";

// Yahoo v7 blocked. Use v8/chart — extract OHLCV from actual candle data
// so prev-close and open are correct even when market is closed.
async function fetchQuoteViaChart(yfSymbol: string): Promise<Record<string, unknown> | null> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
  };

  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=1d&range=5d`;
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const meta  = result.meta;
      const q     = result.indicators?.quote?.[0] ?? {};
      const closes: number[] = (q.close  ?? []).filter((v: number | null) => v != null);
      const opens:  number[] = (q.open   ?? []).filter((v: number | null) => v != null);
      const highs:  number[] = (q.high   ?? []).filter((v: number | null) => v != null);
      const lows:   number[] = (q.low    ?? []).filter((v: number | null) => v != null);
      const vols:   number[] = (q.volume ?? []).filter((v: number | null) => v != null);

      const r2 = (n: number) => Math.round(n * 100) / 100;
      const sym   = fromYF(yfSymbol);
      // Latest candle = most recent trading day
      const price     = r2(closes.at(-1) ?? meta.regularMarketPrice ?? 0);
      const prevClose = r2(closes.at(-2) ?? meta.chartPreviousClose ?? 0); // true previous day
      const open      = r2(opens.at(-1)  ?? meta.regularMarketOpen  ?? 0);
      const dayHigh   = r2(highs.at(-1)  ?? meta.regularMarketDayHigh ?? 0);
      const dayLow    = r2(lows.at(-1)   ?? meta.regularMarketDayLow  ?? 0);
      const volume    = vols.at(-1) ?? meta.regularMarketVolume ?? 0;

      // During live session meta has real-time price; prefer it
      const livePrice = r2(meta.regularMarketPrice ?? price);
      const change    = r2(livePrice - prevClose);
      const changePct = prevClose > 0 ? Math.round((change / prevClose) * 10000) / 100 : 0;

      return {
        symbol: sym,
        price:         livePrice,
        change,
        changePercent: changePct,
        volume,
        marketCap: meta.marketCap        ?? 0,
        pe:        meta.trailingPE       ?? 0,
        high52w:   meta.fiftyTwoWeekHigh ?? 0,
        low52w:    meta.fiftyTwoWeekLow  ?? 0,
        open,
        dayHigh,
        dayLow,
        prevClose,
        name: meta.shortName ?? meta.longName ?? sym,
      };
    } catch { continue; }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const param    = req.nextUrl.searchParams.get("symbols");
  const yfSymbols = param ? param.split(",") : ALL_YF;

  const results = await Promise.allSettled(
    yfSymbols.map((sym) => fetchQuoteViaChart(sym))
  );

  const quotes: Record<string, unknown> = {};
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      const q = r.value as { symbol: string };
      quotes[q.symbol] = q;
    }
  }

  if (Object.keys(quotes).length === 0) {
    return NextResponse.json({ ok: false, error: "All Yahoo Finance requests failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, quotes, timestamp: Date.now() });
}
