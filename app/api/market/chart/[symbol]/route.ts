import { NextRequest, NextResponse } from "next/server";
import { toYF } from "@/lib/market/symbols";
import { calcRSI, calcMACD, calcEMA, lastValid } from "@/lib/market/calculations";

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const yfSymbol = toYF(params.symbol);
  const range = req.nextUrl.searchParams.get("range") ?? "6mo";

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

    // Valid closes only for calculations
    const validCloses = closes.filter((c) => !isNaN(c));

    // Technical indicators
    const rsi = calcRSI(validCloses);
    const { macd, signal } = calcMACD(validCloses);
    const ema20Arr  = calcEMA(validCloses, 20);
    const ema50Arr  = calcEMA(validCloses, 50);
    const ema200Arr = calcEMA(validCloses, 200);

    // Support = recent 20-day low, Resistance = recent 20-day high
    const recent = validCloses.slice(-20);
    const support    = parseFloat(Math.min(...recent).toFixed(2));
    const resistance = parseFloat(Math.max(...recent).toFixed(2));

    // Trend direction
    const ema20 = lastValid(ema20Arr);
    const ema50 = lastValid(ema50Arr);
    const lastPrice = validCloses[validCloses.length - 1] ?? 0;
    const trend = lastPrice > ema20 && ema20 > ema50 ? "Uptrend"
                : lastPrice < ema20 && ema20 < ema50 ? "Downtrend"
                : "Sideways";

    // Chart data for display (date + price)
    const chartData = timestamps
      .map((ts, i) => ({
        date:   new Date(ts * 1000).toISOString().split("T")[0],
        price:  closes[i] ?? null,
        open:   opens[i]  ?? null,
        high:   highs[i]  ?? null,
        low:    lows[i]   ?? null,
        volume: vols[i]   ?? null,
      }))
      .filter((d) => d.price !== null);

    return NextResponse.json({
      ok: true,
      symbol: params.symbol,
      technicals: {
        rsi,
        macd,
        macdSignal: signal,
        ema20,
        ema50,
        ema200: lastValid(ema200Arr),
        support,
        resistance,
        trend,
      },
      chartData,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
