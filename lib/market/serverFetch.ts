import { STOCK_SYMBOLS, fromYF } from "@/lib/market/symbols";
import { calcRSI, calcMACD, calcEMA, lastValid } from "@/lib/market/calculations";
import type { LiveQuoteInput, LiveTechInput } from "@/lib/alerts/alertEngine";

const YF_FIELDS = [
  "regularMarketPrice", "regularMarketChangePercent",
].join(",");

export async function fetchLiveQuotesServer(): Promise<Record<string, LiveQuoteInput>> {
  const yfSymbols = Object.values(STOCK_SYMBOLS).join(",");
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yfSymbols}&fields=${YF_FIELDS}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const result: Record<string, LiveQuoteInput> = {};
    for (const q of (data.quoteResponse?.result ?? [])) {
      const sym = fromYF(q.symbol as string);
      result[sym] = {
        price: (q.regularMarketPrice as number) ?? 0,
        changePercent: (q.regularMarketChangePercent as number) ?? 0,
      };
    }
    return result;
  } catch {
    return {};
  }
}

export async function fetchAllTechnicalsServer(): Promise<Record<string, LiveTechInput>> {
  const symbols = Object.keys(STOCK_SYMBOLS);
  const yfSymbols = Object.values(STOCK_SYMBOLS);

  const results = await Promise.allSettled(
    yfSymbols.map(async (yfSym, i) => {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yfSym}?interval=1d&range=6mo`,
        { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const chart = data.chart?.result?.[0];
      if (!chart) throw new Error("no data");

      const closes: number[] = (chart.indicators?.quote?.[0]?.close ?? [])
        .filter((v: number | null) => v != null && !isNaN(v));

      const rsi     = calcRSI(closes);
      const { macd, signal } = calcMACD(closes);
      const ema20   = lastValid(calcEMA(closes, 20));
      const ema50   = lastValid(calcEMA(closes, 50));
      const recent  = closes.slice(-20);
      const support    = parseFloat(Math.min(...recent).toFixed(2));
      const resistance = parseFloat(Math.max(...recent).toFixed(2));

      return { sym: symbols[i], tech: { rsi, macd, macdSignal: signal, ema20, ema50, support, resistance } };
    })
  );

  const techMap: Record<string, LiveTechInput> = {};
  for (const r of results) {
    if (r.status === "fulfilled") {
      techMap[r.value.sym] = r.value.tech;
    }
  }
  return techMap;
}
