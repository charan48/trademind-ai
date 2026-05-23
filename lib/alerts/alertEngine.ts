import { STOCKS } from "@/lib/data/mockData";
import { computeAIScore } from "@/lib/market/calculations";
import { PortfolioHolding } from "@/lib/types";

export interface StockPick {
  symbol: string;
  name: string;
  price: number;
  aiScore: number;
  entryScore: number; // 0-100 — how good the ENTRY is right now
  sentiment: string;
  rsi: number;
  changePercent: number;
  reason: string;
  entryZone: string;
  target: number;
  stopLoss: number;
  expectedReturn: number; // % expected gain to target
  strategy: string;       // momentum / reversal / breakout
}

export interface SellSignal {
  symbol: string;
  name: string;
  currentPrice: number;
  avgBuyPrice: number;
  pnlPercent: number;
  rsi: number;
  reason: string;
  urgency: "HIGH" | "MEDIUM";
  action: string;
}

export interface BuySignal {
  symbol: string;
  name: string;
  price: number;
  rsi: number;
  aiScore: number;
  reason: string;
  entryZone: string;
  target: number;
  stopLoss: number;
  confidence: "HIGH" | "MEDIUM";
}

export interface HoldingHealth {
  symbol: string;
  status: "SELL" | "WATCH" | "HOLD";
  urgency?: "HIGH" | "MEDIUM";
  reason: string;
  action: string;
  target: number;
  stopLoss: number;
  pnlPercent: number;
}

// Minimal live data shapes — compatible with LiveQuote/LiveTechnicals from store
export interface LiveQuoteInput {
  price: number;
  changePercent: number;
}
export interface LiveTechInput {
  rsi: number;
  macd: number;
  macdSignal: number;
  ema20: number;
  ema50: number;
  ema200?: number;
  support: number;
  resistance: number;
  trend?: string;
  sentiment?: string;
}

// ── Entry quality score (0-100) — separate from AI score ─────────────────────
// Measures how good the CURRENT PRICE is as an entry point.
// High = great time to buy. Low = poor entry (overbought / downtrend).
function computeEntryScore(lt: LiveTechInput, price: number): number {
  let score = 0;

  // RSI component (0-30): ideal entry RSI is 35-50
  if      (lt.rsi >= 25 && lt.rsi < 35) score += 30; // oversold — strong reversal zone
  else if (lt.rsi >= 35 && lt.rsi < 45) score += 25; // near oversold — good entry
  else if (lt.rsi >= 45 && lt.rsi < 55) score += 18; // neutral — ok entry
  else if (lt.rsi >= 55 && lt.rsi < 62) score += 10; // slightly extended
  else if (lt.rsi >= 62 && lt.rsi < 70) score += 5;  // getting overbought
  else if (lt.rsi < 25)  score += 20;                 // extremely oversold (reversal risk)
  else    score += 0;                                  // overbought — bad entry

  // MACD component (0-20)
  if (lt.macd > lt.macdSignal) {
    score += lt.macd > 0 ? 20 : 14; // bullish crossover above/below zero line
  } else {
    score += lt.macd > -2 ? 6 : 0;  // bearish but close to cross = slight credit
  }

  // EMA trend stack component (0-30): best entry = full uptrend stack
  const ema200 = lt.ema200 ?? 0;
  if (price > lt.ema20 && lt.ema20 > lt.ema50 && (ema200 === 0 || lt.ema50 > ema200)) {
    score += 30; // price > EMA20 > EMA50 > EMA200 — full uptrend
  } else if (price > lt.ema20 && lt.ema20 > lt.ema50) {
    score += 22; // strong short-term uptrend
  } else if (price > lt.ema20) {
    score += 12; // above short EMA only
  } else if (price > lt.ema50) {
    score += 8;  // pulled back to mid-term support area — potential bounce
  } else if (ema200 > 0 && price > ema200) {
    score += 4;  // still above long-term trend
  }

  // Support proximity component (0-15): near support = low-risk entry
  if (lt.support > 0 && price > 0) {
    const pct = (price - lt.support) / lt.support;
    if      (pct >= 0 && pct < 0.01) score += 15; // <1% above support = perfect entry
    else if (pct < 0.03) score += 10;
    else if (pct < 0.05) score += 6;
    else if (pct < 0.08) score += 3;
  }

  // Trend component (0-5)
  if      (lt.trend === "Uptrend")   score += 5;
  else if (lt.trend === "Sideways")  score += 2;
  else    score += 0;

  return Math.min(100, Math.round(score));
}

// ── Determine strategy type ───────────────────────────────────────────────────
function getStrategy(lt: LiveTechInput, price: number): string {
  if (lt.rsi < 35 && lt.macd < lt.macdSignal) return "reversal";
  if (lt.rsi < 50 && lt.macd > lt.macdSignal && price > lt.ema20) return "momentum";
  if (lt.support > 0 && (price - lt.support) / lt.support < 0.03) return "support-bounce";
  if (price > lt.ema20 && lt.ema20 > lt.ema50) return "trend-continuation";
  return "swing";
}

// ── Morning top picks — ranked by entry score ─────────────────────────────────
export function getTopStockPicks(
  excludeSymbols: string[] = [],
  liveQuotes?: Record<string, LiveQuoteInput>,
  liveTech?: Record<string, LiveTechInput>
): StockPick[] {
  return STOCKS
    .filter((s) => !excludeSymbols.includes(s.symbol))
    .map((s) => {
      const price         = liveQuotes?.[s.symbol]?.price         ?? s.price;
      const changePercent = liveQuotes?.[s.symbol]?.changePercent ?? s.changePercent;
      const rsi           = liveTech?.[s.symbol]?.rsi             ?? s.rsi;
      const support       = liveTech?.[s.symbol]?.support         ?? s.technicals?.support    ?? 0;
      const resistance    = liveTech?.[s.symbol]?.resistance      ?? s.technicals?.resistance ?? 0;
      const macd          = liveTech?.[s.symbol]?.macd            ?? s.macd;
      const macdSignal    = liveTech?.[s.symbol]?.macdSignal      ?? s.macdSignal;
      const ema20         = liveTech?.[s.symbol]?.ema20           ?? s.ema20;
      const ema50         = liveTech?.[s.symbol]?.ema50           ?? s.ema50;
      const ema200        = liveTech?.[s.symbol]?.ema200;
      const trend         = liveTech?.[s.symbol]?.trend;
      const sentiment     = liveTech?.[s.symbol]?.sentiment       ?? s.sentiment;

      const lt: LiveTechInput = { rsi, macd, macdSignal, ema20, ema50, ema200, trend, support, resistance };
      const aiScore    = liveTech?.[s.symbol] ? computeAIScore({ rsi, macd, macdSignal, ema20, ema50, ema200, trend, support }, price) : s.aiScore;
      const entryScore = liveTech?.[s.symbol] ? computeEntryScore(lt, price) : Math.round(s.aiScore * 0.8);
      const strategy   = getStrategy(lt, price);

      const target   = resistance > 0 ? resistance : parseFloat((price * 1.12).toFixed(2));
      const stopLoss = parseFloat((Math.max(support > 0 ? support * 0.99 : 0, price * 0.93)).toFixed(2));
      const expectedReturn = price > 0 ? parseFloat(((target - price) / price * 100).toFixed(1)) : 12;

      const reason =
        strategy === "reversal"           ? `RSI ${rsi.toFixed(0)} — oversold reversal zone. MACD approaching bullish cross` :
        strategy === "support-bounce"     ? `Price at support ₹${support.toLocaleString("en-IN")} — high-probability bounce entry` :
        strategy === "momentum"           ? `MACD bullish + price above EMA20. RSI ${rsi.toFixed(0)} — momentum entry` :
        strategy === "trend-continuation" ? `EMA20 > EMA50 uptrend intact. RSI ${rsi.toFixed(0)} — add on dip` :
        `RSI ${rsi.toFixed(0)} · ${macd > macdSignal ? "MACD bullish" : "MACD watch"}`;

      return {
        symbol: s.symbol,
        name: s.name,
        price,
        aiScore,
        entryScore,
        sentiment,
        rsi,
        changePercent,
        reason,
        entryZone:
          support > 0
            ? `₹${support.toLocaleString("en-IN")} – ₹${(support * 1.02).toLocaleString("en-IN")}`
            : `₹${(price * 0.99).toLocaleString("en-IN")} – ₹${(price * 1.01).toLocaleString("en-IN")}`,
        target,
        stopLoss,
        expectedReturn,
        strategy,
      };
    })
    .sort((a, b) => (b.entryScore + b.aiScore * 0.3) - (a.entryScore + a.aiScore * 0.3))
    .slice(0, 3);
}

// ── Per-holding health check — SELL / WATCH / HOLD ───────────────────────────
export function getHoldingHealth(
  holdings: PortfolioHolding[],
  liveQuotes?: Record<string, LiveQuoteInput>,
  liveTech?: Record<string, LiveTechInput>
): HoldingHealth[] {
  return holdings.map((h) => {
    const stock = STOCKS.find((s) => s.symbol === h.symbol);
    const price  = liveQuotes?.[h.symbol]?.price ?? stock?.price ?? h.avgBuyPrice;
    const rsi    = liveTech?.[h.symbol]?.rsi        ?? stock?.rsi        ?? 50;
    const macd   = liveTech?.[h.symbol]?.macd       ?? stock?.macd       ?? 0;
    const macdSig = liveTech?.[h.symbol]?.macdSignal ?? stock?.macdSignal ?? 0;
    const resistance = liveTech?.[h.symbol]?.resistance ?? stock?.technicals?.resistance ?? 0;
    const support    = liveTech?.[h.symbol]?.support    ?? stock?.technicals?.support    ?? 0;
    const ema20  = liveTech?.[h.symbol]?.ema20 ?? stock?.ema20 ?? 0;
    const ema50  = liveTech?.[h.symbol]?.ema50 ?? stock?.ema50 ?? 0;
    const ema200 = liveTech?.[h.symbol]?.ema200;
    const trend  = liveTech?.[h.symbol]?.trend;
    const pnlPct = h.avgBuyPrice > 0 ? ((price - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0;

    // Dynamic target = resistance (or +12%) and stop = support (or -7%)
    const target   = resistance > 0 ? resistance : h.avgBuyPrice * 1.12;
    const stopLoss = support > 0 ? support * 0.99 : h.avgBuyPrice * 0.93;

    // ── SELL conditions ──────────────────────────────────────────────────────
    if (price <= stopLoss && pnlPct < -5) {
      return { symbol: h.symbol, status: "SELL", urgency: "HIGH", reason: `Stop-loss hit — down ${Math.abs(pnlPct).toFixed(1)}%`, action: "Exit full position to cut loss", target, stopLoss, pnlPercent: pnlPct };
    }
    if (rsi > 78) {
      return { symbol: h.symbol, status: "SELL", urgency: "HIGH", reason: `RSI ${rsi.toFixed(0)} — heavily overbought`, action: pnlPct > 0 ? "Book 50–75% profits now" : "Exit to avoid reversal", target, stopLoss, pnlPercent: pnlPct };
    }
    if (pnlPct >= 25 && macd < macdSig) {
      return { symbol: h.symbol, status: "SELL", urgency: "HIGH", reason: `Up ${pnlPct.toFixed(1)}% + MACD turning bearish — book profits`, action: "Book 75% profits, trail stop on rest", target, stopLoss, pnlPercent: pnlPct };
    }
    if (resistance > 0 && price >= resistance * 0.98 && rsi > 65) {
      return { symbol: h.symbol, status: "SELL", urgency: "MEDIUM", reason: `At resistance ₹${resistance.toLocaleString("en-IN")} with high RSI`, action: pnlPct > 0 ? "Book profits at resistance" : "Exit before breakdown", target, stopLoss, pnlPercent: pnlPct };
    }
    if (ema20 > 0 && ema50 > 0 && price < ema20 && ema20 < ema50 && pnlPct < -3) {
      return { symbol: h.symbol, status: "SELL", urgency: "MEDIUM", reason: "EMA20 crossed below EMA50 — downtrend starting", action: "Exit or set tight stop at EMA20", target, stopLoss, pnlPercent: pnlPct };
    }

    // ── WATCH conditions ─────────────────────────────────────────────────────
    if (pnlPct >= 15) {
      return { symbol: h.symbol, status: "WATCH", reason: `Up ${pnlPct.toFixed(1)}% — protect profits with trailing stop`, action: `Raise stop to ₹${(price * 0.95).toLocaleString("en-IN")} (5% trailing)`, target, stopLoss: price * 0.95, pnlPercent: pnlPct };
    }
    if (rsi > 68 && rsi <= 78) {
      return { symbol: h.symbol, status: "WATCH", reason: `RSI ${rsi.toFixed(0)} — extended, monitor for reversal`, action: "Partial book if RSI > 72, hold rest", target, stopLoss, pnlPercent: pnlPct };
    }
    if (macd < macdSig && pnlPct > 5) {
      return { symbol: h.symbol, status: "WATCH", reason: "MACD bearish crossover — momentum slowing", action: "Tighten stop, be ready to exit", target, stopLoss, pnlPercent: pnlPct };
    }
    if (price < ema20 && pnlPct < 0 && pnlPct > -5) {
      return { symbol: h.symbol, status: "WATCH", reason: `Below EMA20 — short-term weakness. Down ${Math.abs(pnlPct).toFixed(1)}%`, action: "Hold if above stop-loss, watch EMA20 reclaim", target, stopLoss, pnlPercent: pnlPct };
    }
    if (pnlPct < -5 && pnlPct > -8) {
      return { symbol: h.symbol, status: "WATCH", reason: `Down ${Math.abs(pnlPct).toFixed(1)}% — approaching stop-loss zone`, action: `Stop-loss at ₹${stopLoss.toLocaleString("en-IN")}. Exit if breached`, target, stopLoss, pnlPercent: pnlPct };
    }
    if (trend === "Downtrend" && pnlPct < 0) {
      return { symbol: h.symbol, status: "WATCH", reason: "Stock in downtrend while in loss", action: "Review stop-loss level", target, stopLoss, pnlPercent: pnlPct };
    }

    // ── HOLD ─────────────────────────────────────────────────────────────────
    const holdReason = pnlPct >= 10
      ? `Up ${pnlPct.toFixed(1)}% — strong gain, trend intact`
      : pnlPct >= 0
      ? `Positive ${pnlPct.toFixed(1)}% — hold for target ₹${target.toLocaleString("en-IN")}`
      : `Small loss ${pnlPct.toFixed(1)}% — above stop-loss, wait for recovery`;
    return { symbol: h.symbol, status: "HOLD", reason: holdReason, action: `Target ₹${target.toLocaleString("en-IN")} · Stop ₹${stopLoss.toLocaleString("en-IN")}`, target, stopLoss, pnlPercent: pnlPct };
  });
}

// ── Buy opportunity scanner ───────────────────────────────────────────────────
export function getBuySignals(
  excludeSymbols: string[] = [],
  liveQuotes?: Record<string, LiveQuoteInput>,
  liveTech?: Record<string, LiveTechInput>
): BuySignal[] {
  const signals: BuySignal[] = [];

  for (const s of STOCKS) {
    if (excludeSymbols.includes(s.symbol)) continue;

    const price      = liveQuotes?.[s.symbol]?.price         ?? s.price;
    const rsi        = liveTech?.[s.symbol]?.rsi             ?? s.rsi;
    const macd       = liveTech?.[s.symbol]?.macd            ?? s.macd;
    const macdSignal = liveTech?.[s.symbol]?.macdSignal      ?? s.macdSignal;
    const support    = liveTech?.[s.symbol]?.support         ?? s.technicals?.support    ?? 0;
    const resistance = liveTech?.[s.symbol]?.resistance      ?? s.technicals?.resistance ?? 0;
    const ema20      = liveTech?.[s.symbol]?.ema20           ?? s.ema20;
    const ema50      = liveTech?.[s.symbol]?.ema50           ?? s.ema50;
    const ema200     = liveTech?.[s.symbol]?.ema200;
    const trend      = liveTech?.[s.symbol]?.trend;

    const lt: LiveTechInput = { rsi, macd, macdSignal, ema20, ema50, ema200, trend, support, resistance };
    const liveScore  = liveTech?.[s.symbol] ? computeAIScore({ rsi, macd, macdSignal, ema20, ema50, ema200, trend, support }, price) : s.aiScore;
    const entryScore = liveTech?.[s.symbol] ? computeEntryScore(lt, price) : 0;

    const reasons: string[] = [];
    let confidence: "HIGH" | "MEDIUM" = "MEDIUM";

    if (rsi < 40) reasons.push(`RSI ${rsi.toFixed(0)} — oversold reversal zone`);
    if (macd > macdSignal) reasons.push("MACD bullish crossover");
    if (support > 0 && (price - support) / support < 0.03) reasons.push(`Near support ₹${support.toLocaleString("en-IN")}`);
    if (liveScore >= 70) reasons.push(`AI Score ${liveScore}/100`);
    if (ema20 && ema50 && price > ema20 && ema20 > ema50) reasons.push("EMA20 > EMA50 uptrend");

    if (reasons.length < 2) continue;
    if (entryScore >= 60 || reasons.length >= 3) confidence = "HIGH";

    signals.push({
      symbol: s.symbol, name: s.name, price, rsi,
      aiScore: liveScore,
      reason: reasons.slice(0, 2).join(" · "),
      entryZone: `₹${(price * 0.99).toLocaleString("en-IN")} – ₹${(price * 1.01).toLocaleString("en-IN")}`,
      target:   resistance > 0 ? resistance : parseFloat((price * 1.12).toFixed(2)),
      stopLoss: parseFloat((Math.max(support > 0 ? support * 0.99 : 0, price * 0.93)).toFixed(2)),
      confidence,
    });
  }

  return signals.sort((a, b) => (b.confidence === "HIGH" ? 1 : 0) - (a.confidence === "HIGH" ? 1 : 0));
}

// ── Portfolio sell signal scanner ─────────────────────────────────────────────
export function getSellSignals(
  holdings: PortfolioHolding[],
  liveQuotes?: Record<string, LiveQuoteInput>,
  liveTech?: Record<string, LiveTechInput>
): SellSignal[] {
  return getHoldingHealth(holdings, liveQuotes, liveTech)
    .filter((h) => h.status === "SELL")
    .map((h) => {
      const holding = holdings.find((hold) => hold.symbol === h.symbol)!;
      const price = liveQuotes?.[h.symbol]?.price ?? holding.avgBuyPrice;
      const rsi   = liveTech?.[h.symbol]?.rsi     ?? 50;
      return {
        symbol: h.symbol,
        name: holding.name,
        currentPrice: price,
        avgBuyPrice: holding.avgBuyPrice,
        pnlPercent: h.pnlPercent,
        rsi,
        reason: h.reason,
        urgency: h.urgency ?? "MEDIUM",
        action: h.action,
      };
    });
}

// ── Portfolio health check ────────────────────────────────────────────────────
export interface HoldingStatus {
  symbol: string;
  name: string;
  pnlPercent: number;
  rsi: number;
  status: "HOLD" | "WATCH" | "SELL";
  note: string;
}

export function getPortfolioHealth(
  holdings: PortfolioHolding[],
  liveQuotes?: Record<string, LiveQuoteInput>,
  liveTech?: Record<string, LiveTechInput>
): HoldingStatus[] {
  const health = getHoldingHealth(holdings, liveQuotes, liveTech);
  return holdings.map((h) => {
    const hh = health.find((x) => x.symbol === h.symbol);
    const rsi = liveTech?.[h.symbol]?.rsi ?? 50;
    return {
      symbol: h.symbol, name: h.name,
      pnlPercent: hh?.pnlPercent ?? 0, rsi,
      status: hh?.status ?? "HOLD",
      note: hh?.reason ?? "Monitoring",
    };
  });
}

// ── Telegram message formatters ───────────────────────────────────────────────
export function formatMorningBrief(
  picks: StockPick[],
  portfolioValue: number,
  sellSignals: SellSignal[]
): string {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "short", year: "numeric",
  });

  const pickLines = picks.map((p, i) => {
    const arrow = p.changePercent >= 0 ? "📈" : "📉";
    const sign  = p.changePercent >= 0 ? "+" : "";
    const stratLabel = p.strategy === "reversal" ? "Reversal" : p.strategy === "support-bounce" ? "Support Bounce" : p.strategy === "momentum" ? "Momentum" : "Trend";
    return (
      `\n${i + 1}. ${arrow} <b>${p.symbol}</b> — ₹${p.price.toLocaleString("en-IN")}\n` +
      `   AI: <b>${p.aiScore}/100</b> | Entry Score: <b>${p.entryScore}/100</b> | RSI: ${p.rsi.toFixed(0)}\n` +
      `   Strategy: ${stratLabel} | ${sign}${p.changePercent.toFixed(2)}%\n` +
      `   Entry: ${p.entryZone} | Target: ₹${p.target.toLocaleString("en-IN")} (+${p.expectedReturn}%)\n` +
      `   Stop Loss: ₹${p.stopLoss.toLocaleString("en-IN")}\n` +
      `   📌 ${p.reason}`
    );
  }).join("\n");

  const sellLines = sellSignals.length > 0
    ? `\n\n🚨 <b>Portfolio Sell Alerts</b>\n` +
      sellSignals.map((s) => {
        const sign = s.pnlPercent >= 0 ? "+" : "";
        return `• <b>${s.symbol}</b> (${sign}${s.pnlPercent.toFixed(1)}%) — ${s.reason}\n  ✅ ${s.action}`;
      }).join("\n")
    : "\n\n✅ <b>Portfolio</b> — All holdings healthy, no sell signals";

  return (
    `🌅 <b>TradeMind Morning Brief</b>\n📅 ${today}\n` +
    `\n🤖 <b>Top 3 AI Entry Picks</b>${pickLines}` +
    sellLines +
    `\n\n💼 Portfolio Value: ₹${portfolioValue.toLocaleString("en-IN")}\n` +
    `\n<i>⚠️ Educational only. Not financial advice. Do your own research.</i>`
  );
}

export function formatSellAlert(signal: SellSignal): string {
  const emoji   = signal.urgency === "HIGH" ? "🚨" : "⚠️";
  const pnlSign = signal.pnlPercent >= 0 ? "+" : "";
  return (
    `${emoji} <b>SELL SIGNAL — ${signal.symbol}</b>\n\n` +
    `📊 <b>${signal.name}</b>\n` +
    `Current: ₹${signal.currentPrice.toLocaleString("en-IN")}\n` +
    `Avg Buy: ₹${signal.avgBuyPrice.toLocaleString("en-IN")}\n` +
    `P&amp;L: <b>${pnlSign}${signal.pnlPercent.toFixed(2)}%</b> | RSI: ${signal.rsi.toFixed(0)}\n\n` +
    `🔔 ${signal.reason}\n` +
    `✅ Action: <b>${signal.action}</b>\n\n` +
    `<i>Review on TradeMind before acting.</i>`
  );
}

export function formatBuyAlert(signal: BuySignal): string {
  const emoji = signal.confidence === "HIGH" ? "🟢" : "🔵";
  return (
    `${emoji} <b>BUY OPPORTUNITY — ${signal.symbol}</b>\n\n` +
    `📊 <b>${signal.name}</b>\n` +
    `Price: ₹${signal.price.toLocaleString("en-IN")} | AI: ${signal.aiScore}/100 | RSI: ${signal.rsi.toFixed(0)}\n\n` +
    `📌 ${signal.reason}\n\n` +
    `💰 Entry Zone: <b>${signal.entryZone}</b>\n` +
    `🎯 Target: ₹${signal.target.toLocaleString("en-IN")}\n` +
    `🛡 Stop Loss: ₹${signal.stopLoss.toLocaleString("en-IN")}\n\n` +
    `<i>Educational only. Do your own research.</i>`
  );
}
