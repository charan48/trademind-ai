import { STOCK_SYMBOLS } from "@/lib/market/symbols";
import { calcRSI, calcMACD, calcEMA, lastValid } from "@/lib/market/calculations";
import type { LiveQuoteInput, LiveTechInput } from "@/lib/alerts/alertEngine";

export async function fetchLiveQuotesServer(): Promise<Record<string, LiveQuoteInput>> {
  const entries = Object.entries(STOCK_SYMBOLS);
  const results = await Promise.allSettled(
    entries.map(async ([sym, yfSym]) => {
      for (const host of ["query1", "query2"]) {
        try {
          const res = await fetch(
            `https://${host}.finance.yahoo.com/v8/finance/chart/${yfSym}?interval=1d&range=5d`,
            { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
          );
          if (!res.ok) continue;
          const data = await res.json();
          const result = data?.chart?.result?.[0];
          if (!result) continue;
          const meta   = result.meta;
          const closes = (result.indicators?.quote?.[0]?.close ?? []).filter((v: number | null) => v != null);
          const price     = meta.regularMarketPrice ?? closes.at(-1) ?? 0;
          const prevClose = closes.at(-2) ?? meta.chartPreviousClose ?? 0;
          const changePct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
          return { sym, price, changePercent: Math.round(changePct * 100) / 100 };
        } catch { continue; }
      }
      return null;
    })
  );

  const result: Record<string, LiveQuoteInput> = {};
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      result[r.value.sym] = { price: r.value.price, changePercent: r.value.changePercent };
    }
  }
  return result;
}

export async function fetchAllTechnicalsServer(): Promise<Record<string, LiveTechInput>> {
  const symbols   = Object.keys(STOCK_SYMBOLS);
  const yfSymbols = Object.values(STOCK_SYMBOLS);

  const results = await Promise.allSettled(
    yfSymbols.map(async (yfSym, i) => {
      // 2y gives 500+ candles — required for valid EMA200
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yfSym}?interval=1d&range=2y`,
        { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data  = await res.json();
      const chart = data.chart?.result?.[0];
      if (!chart) throw new Error("no data");

      const closes: number[] = (chart.indicators?.quote?.[0]?.close ?? [])
        .filter((v: number | null) => v != null && !isNaN(v));

      const rsi            = calcRSI(closes);
      const { macd, signal } = calcMACD(closes);
      const ema20          = lastValid(calcEMA(closes, 20));
      const ema50          = lastValid(calcEMA(closes, 50));
      const recent         = closes.slice(-20);
      const support        = parseFloat(Math.min(...recent).toFixed(2));
      const resistance     = parseFloat(Math.max(...recent).toFixed(2));

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
