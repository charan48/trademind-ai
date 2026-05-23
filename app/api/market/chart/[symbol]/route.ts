import { NextRequest, NextResponse } from "next/server";
import { toYF } from "@/lib/market/symbols";
import { calcRSI, calcMACD, calcEMA, lastValid, deriveSentiment } from "@/lib/market/calculations";

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const yfSymbol = toYF(params.symbol);
  // Use 2y to get 500+ candles — required for valid EMA200 calculation
  const range = req.nextUrl.searchParams.get("range") ?? "2y";

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSymbol}?interval=1d&range=${range}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`Chart fetch ${res.status}`);
    const data = await res.json();
    const chart = data.chart?.result?.[0];
    if (!chart) throw new Error("No chart data returned");

    const timestamps: number[] = chart.timestamp ?? [];
    const q = chart.indicators?.quote?.[0] ?? {};
    const closes: number[] = (q.close ?? []).map((v: number | null) => v ?? NaN);
    const opens:  number[] = q.open   ?? [];
    const highs:  number[] = q.high   ?? [];
    const lows:   number[] = q.low    ?? [];
    const vols:   number[] = q.volume ?? [];

    const validCloses = closes.filter((c) => !isNaN(c));

    // Technical indicators — needs 2y data for EMA200 to be valid
    const rsi = calcRSI(validCloses);
    const { macd, signal } = calcMACD(validCloses);
    const ema20Arr  = calcEMA(validCloses, 20);
    const ema50Arr  = calcEMA(validCloses, 50);
    const ema200Arr = calcEMA(validCloses, 200);

    const recent     = validCloses.slice(-20);
    const support    = parseFloat(Math.min(...recent).toFixed(2));
    const resistance = parseFloat(Math.max(...recent).toFixed(2));

    const ema20  = lastValid(ema20Arr);
    const ema50  = lastValid(ema50Arr);
    const ema200 = lastValid(ema200Arr);
    const lastPrice = validCloses.at(-1) ?? 0;

    const trend = lastPrice > ema20 && ema20 > ema50 ? "Uptrend"
                : lastPrice < ema20 && ema20 < ema50 ? "Downtrend"
                : "Sideways";

    const sentiment = deriveSentiment(lastPrice, rsi, macd, signal, ema20, ema50, ema200);

    // Return last 6 months for chart display (keeps payload small)
    const sixMonthsAgo = Date.now() / 1000 - 180 * 24 * 3600;
    const chartData = timestamps
      .map((ts, i) => ({
        date:   new Date(ts * 1000).toISOString().split("T")[0],
        price:  closes[i] ?? null,
        open:   opens[i]  ?? null,
        high:   highs[i]  ?? null,
        low:    lows[i]   ?? null,
        volume: vols[i]   ?? null,
      }))
      .filter((d, i) => d.price !== null && timestamps[i] >= sixMonthsAgo);

    return NextResponse.json({
      ok: true,
      symbol: params.symbol,
      technicals: { rsi, macd, macdSignal: signal, ema20, ema50, ema200, support, resistance, trend, sentiment },
      chartData,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
