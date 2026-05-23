import { NextRequest, NextResponse } from "next/server";
import { ALL_YF, fromYF } from "@/lib/market/symbols";

const YF_FIELDS = [
  "regularMarketPrice", "regularMarketChange", "regularMarketChangePercent",
  "regularMarketVolume", "marketCap", "trailingPE",
  "fiftyTwoWeekHigh", "fiftyTwoWeekLow",
  "regularMarketOpen", "regularMarketDayHigh", "regularMarketDayLow",
  "regularMarketPreviousClose", "shortName",
].join(",");

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("symbols");
  const symbols = param ? param.split(",") : ALL_YF;

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}&fields=${YF_FIELDS}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      // Try alternate endpoint on failure
      const alt = await fetch(
        `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}&fields=${YF_FIELDS}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      if (!alt.ok) throw new Error(`Yahoo Finance ${res.status}`);
      const altData = await alt.json();
      return buildResponse(altData);
    }

    const data = await res.json();
    return buildResponse(data);
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}

function buildResponse(data: Record<string, unknown>) {
  const quotes = (data.quoteResponse as { result: Record<string, unknown>[] })?.result ?? [];
  const result: Record<string, unknown> = {};

  for (const q of quotes) {
    const sym = fromYF(q.symbol as string);
    result[sym] = {
      symbol: sym,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      volume: q.regularMarketVolume ?? 0,
      marketCap: q.marketCap ?? 0,
      pe: q.trailingPE ?? 0,
      high52w: q.fiftyTwoWeekHigh ?? 0,
      low52w: q.fiftyTwoWeekLow ?? 0,
      open: q.regularMarketOpen ?? 0,
      dayHigh: q.regularMarketDayHigh ?? 0,
      dayLow: q.regularMarketDayLow ?? 0,
      prevClose: q.regularMarketPreviousClose ?? 0,
      name: q.shortName ?? sym,
    };
  }

  return NextResponse.json({ ok: true, quotes: result, timestamp: Date.now() });
}
