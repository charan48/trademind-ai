export function calcEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return prices.map(() => NaN);
  const k = 2 / (period + 1);
  const emas: number[] = new Array(period - 1).fill(NaN);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  emas.push(ema);
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    emas.push(ema);
  }
  return emas;
}

export function calcRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return parseFloat((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));
}

export function calcMACD(prices: number[]): { macd: number; signal: number } {
  if (prices.length < 35) return { macd: 0, signal: 0 };
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  const macdLine = ema12
    .map((v, i) => (isNaN(v) || isNaN(ema26[i]) ? NaN : v - ema26[i]))
    .filter((v) => !isNaN(v));
  if (macdLine.length < 9) return { macd: 0, signal: 0 };
  const signalLine = calcEMA(macdLine, 9);
  return {
    macd: parseFloat(macdLine[macdLine.length - 1].toFixed(2)),
    signal: parseFloat(signalLine[signalLine.length - 1].toFixed(2)),
  };
}

export function lastValid(arr: number[]): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (!isNaN(arr[i])) return parseFloat(arr[i].toFixed(2));
  }
  return 0;
}

// Derive sentiment from live technicals — replaces hardcoded mock sentiment
export function deriveSentiment(
  price: number, rsi: number, macd: number, macdSignal: number,
  ema20: number, ema50: number, ema200: number
): string {
  let bull = 0, bear = 0;
  if (rsi >= 60) bull++; else if (rsi <= 40) bear++;
  if (macd > macdSignal) bull++; else bear++;
  if (ema20 > 0) { if (price > ema20) bull++; else bear++; }
  if (ema50 > 0) { if (price > ema50) bull++; else bear++; }
  if (ema200 > 0) { if (price > ema200) bull++; else bear++; }
  if (bull >= 4) return "Strongly Bullish";
  if (bull >= 3) return "Bullish";
  if (bear >= 4) return "Strongly Bearish";
  if (bear >= 3) return "Bearish";
  return "Neutral";
}
