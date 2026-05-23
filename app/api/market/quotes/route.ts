import { NextRequest, NextResponse } from "next/server";
import { ALL_YF, fromYF } from "@/lib/market/symbols";

// Yahoo v7 quote endpoint is rate-limited/blocked.
// v8 chart endpoint works — extract quote data from chart meta.
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
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) continue;

      const sym = fromYF(yfSymbol);
      const prevClose = meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? 0;
      const price     = meta.regularMarketPrice ?? 0;
      const change    = price - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

      return {
        symbol: sym,
        price,
        change,
        changePercent: meta.regularMarketChangePercent ?? changePct,
        volume:    meta.regularMarketVolume    ?? 0,
        marketCap: meta.marketCap              ?? 0,
        pe:        meta.trailingPE             ?? 0,
        high52w:   meta.fiftyTwoWeekHigh       ?? 0,
        low52w:    meta.fiftyTwoWeekLow        ?? 0,
        open:      meta.regularMarketOpen      ?? 0,
        dayHigh:   meta.regularMarketDayHigh   ?? 0,
        dayLow:    meta.regularMarketDayLow    ?? 0,
        prevClose,
        name: meta.shortName ?? meta.longName ?? sym,
      };
    } catch { continue; }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("symbols");
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
