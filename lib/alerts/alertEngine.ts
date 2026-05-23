import { STOCKS } from "@/lib/data/mockData";
import { PortfolioHolding } from "@/lib/types";

export interface StockPick {
  symbol: string;
  name: string;
  price: number;
  aiScore: number;
  sentiment: string;
  rsi: number;
  changePercent: number;
  reason: string;
  entryZone: string;
  target: number;
  stopLoss: number;
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
  support: number;
  resistance: number;
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

    const reasons: string[] = [];
    let confidence: "HIGH" | "MEDIUM" = "MEDIUM";

    const rsiOversold = rsi < 40;
    if (rsiOversold) reasons.push(`RSI ${rsi.toFixed(0)} — oversold, reversal likely`);

    const macdBull = macd > macdSignal;
    if (macdBull) reasons.push("MACD bullish crossover");

    const nearSupport = support > 0 && ((price - support) / support) < 0.03;
    if (nearSupport) reasons.push(`Price near support ₹${support.toLocaleString("en-IN")}`);

    const strongAI = s.aiScore >= 80;
    if (strongAI) reasons.push(`AI Score ${s.aiScore}/100 — strongly bullish`);

    const uptrend = ema20 && ema50 && price > ema20 && ema20 > ema50;
    if (uptrend) reasons.push("Price above EMA20 > EMA50 — uptrend confirmed");

    if (reasons.length < 2) continue;

    if (reasons.length >= 3 || (rsiOversold && strongAI) || (macdBull && nearSupport)) {
      confidence = "HIGH";
    }

    const target   = parseFloat((price * 1.12).toFixed(2));
    const stopLoss = parseFloat((price * 0.93).toFixed(2));

    signals.push({
      symbol: s.symbol,
      name: s.name,
      price,
      rsi,
      aiScore: s.aiScore,
      reason: reasons.slice(0, 2).join(" · "),
      entryZone: `₹${(price * 0.99).toLocaleString("en-IN")} – ₹${(price * 1.01).toLocaleString("en-IN")}`,
      target,
      stopLoss,
      confidence,
    });
  }

  return signals.sort((a, b) => (b.confidence === "HIGH" ? 1 : 0) - (a.confidence === "HIGH" ? 1 : 0));
}

// ── Morning top picks ─────────────────────────────────────────────────────────
export function getTopStockPicks(
  excludeSymbols: string[] = [],
  liveQuotes?: Record<string, LiveQuoteInput>,
  liveTech?: Record<string, LiveTechInput>
): StockPick[] {
  return STOCKS
    .filter((s) => !excludeSymbols.includes(s.symbol))
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3)
    .map((s) => {
      const price        = liveQuotes?.[s.symbol]?.price         ?? s.price;
      const changePercent = liveQuotes?.[s.symbol]?.changePercent ?? s.changePercent;
      const rsi          = liveTech?.[s.symbol]?.rsi             ?? s.rsi;
      const support      = liveTech?.[s.symbol]?.support         ?? s.technicals?.support    ?? 0;
      const resistance   = liveTech?.[s.symbol]?.resistance      ?? s.technicals?.resistance ?? 0;

      return {
        symbol: s.symbol,
        name: s.name,
        price,
        aiScore: s.aiScore,
        sentiment: s.sentiment,
        rsi,
        changePercent,
        reason:
          s.aiScore >= 80
            ? "Strong AI bullish signal + price momentum"
            : rsi < 45
            ? "Oversold — potential reversal entry"
            : "Positive sector outlook + technical strength",
        entryZone:
          support > 0
            ? `₹${support.toLocaleString("en-IN")} – ₹${(support * 1.02).toLocaleString("en-IN")}`
            : `Near ₹${price.toLocaleString("en-IN")}`,
        target:   resistance > 0 ? resistance : parseFloat((price * 1.1).toFixed(2)),
        stopLoss: parseFloat((price * 0.93).toFixed(2)),
      };
    });
}

// ── Portfolio sell signal scanner ─────────────────────────────────────────────
export function getSellSignals(
  holdings: PortfolioHolding[],
  liveQuotes?: Record<string, LiveQuoteInput>,
  liveTech?: Record<string, LiveTechInput>
): SellSignal[] {
  const signals: SellSignal[] = [];

  for (const h of holdings) {
    const stock = STOCKS.find((s) => s.symbol === h.symbol);
    if (!stock) continue;

    const price      = liveQuotes?.[h.symbol]?.price    ?? stock.price;
    const rsi        = liveTech?.[h.symbol]?.rsi        ?? stock.rsi;
    const macd       = liveTech?.[h.symbol]?.macd       ?? stock.macd;
    const macdSig    = liveTech?.[h.symbol]?.macdSignal ?? stock.macdSignal;
    const resistance = liveTech?.[h.symbol]?.resistance ?? stock.technicals?.resistance ?? 0;

    const pnlPct = ((price - h.avgBuyPrice) / h.avgBuyPrice) * 100;

    if (rsi > 72) {
      signals.push({
        symbol: h.symbol, name: h.name,
        currentPrice: price, avgBuyPrice: h.avgBuyPrice,
        pnlPercent: pnlPct, rsi,
        reason: `RSI ${rsi.toFixed(0)} — overbought, momentum likely to reverse`,
        urgency: rsi > 80 ? "HIGH" : "MEDIUM",
        action: pnlPct > 0 ? "Book partial profits (50%)" : "Exit to limit losses",
      });
    } else if (pnlPct < -8) {
      signals.push({
        symbol: h.symbol, name: h.name,
        currentPrice: price, avgBuyPrice: h.avgBuyPrice,
        pnlPercent: pnlPct, rsi,
        reason: `Stop-loss triggered — down ${Math.abs(pnlPct).toFixed(1)}% from avg buy`,
        urgency: "HIGH",
        action: "Exit position immediately to limit loss",
      });
    } else if (resistance > 0 && price >= resistance * 0.98 && stock.aiScore < 65) {
      signals.push({
        symbol: h.symbol, name: h.name,
        currentPrice: price, avgBuyPrice: h.avgBuyPrice,
        pnlPercent: pnlPct, rsi,
        reason: `Price near resistance ₹${resistance.toLocaleString("en-IN")} — AI score weakening`,
        urgency: "MEDIUM",
        action: pnlPct > 5 ? "Book profits at resistance" : "Watch closely, set stop",
      });
    } else if (pnlPct > 15 && stock.aiScore < 65) {
      signals.push({
        symbol: h.symbol, name: h.name,
        currentPrice: price, avgBuyPrice: h.avgBuyPrice,
        pnlPercent: pnlPct, rsi,
        reason: `Up ${pnlPct.toFixed(1)}% — AI momentum weakening, consider booking`,
        urgency: "MEDIUM",
        action: "Book 50–75% profits, trail stop on remainder",
      });
    } else if (macd < macdSig && pnlPct > 3) {
      signals.push({
        symbol: h.symbol, name: h.name,
        currentPrice: price, avgBuyPrice: h.avgBuyPrice,
        pnlPercent: pnlPct, rsi,
        reason: "MACD bearish crossover — selling pressure building",
        urgency: "MEDIUM",
        action: "Tighten stop-loss, prepare to exit if continues",
      });
    }
  }

  return signals;
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
  return holdings.map((h) => {
    const stock = STOCKS.find((s) => s.symbol === h.symbol);
    if (!stock) return { symbol: h.symbol, name: h.name, pnlPercent: 0, rsi: 0, status: "HOLD" as const, note: "Data unavailable" };

    const price  = liveQuotes?.[h.symbol]?.price    ?? stock.price;
    const rsi    = liveTech?.[h.symbol]?.rsi        ?? stock.rsi;
    const macd   = liveTech?.[h.symbol]?.macd       ?? stock.macd;
    const macdSig = liveTech?.[h.symbol]?.macdSignal ?? stock.macdSignal;
    const pnlPct = ((price - h.avgBuyPrice) / h.avgBuyPrice) * 100;

    if (rsi > 72 || pnlPct < -8) {
      return { symbol: h.symbol, name: h.name, pnlPercent: pnlPct, rsi, status: "SELL", note: "Sell signal active" };
    }
    if (rsi > 60 || (macd < macdSig && pnlPct > 3)) {
      return { symbol: h.symbol, name: h.name, pnlPercent: pnlPct, rsi, status: "WATCH", note: "Monitor closely" };
    }
    return { symbol: h.symbol, name: h.name, pnlPercent: pnlPct, rsi, status: "HOLD", note: "Looking good, hold position" };
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
    return (
      `\n${i + 1}. ${arrow} <b>${p.symbol}</b> — ₹${p.price.toLocaleString("en-IN")}\n` +
      `   AI: <b>${p.aiScore}/100</b> | RSI: ${p.rsi.toFixed(0)} | ${sign}${p.changePercent.toFixed(2)}%\n` +
      `   Entry: ${p.entryZone} | Target: ₹${p.target.toLocaleString("en-IN")}\n` +
      `   📌 ${p.reason}`
    );
  }).join("\n");

  const sellLines = sellSignals.length > 0
    ? `\n\n🚨 <b>Portfolio Sell Alerts</b>\n` +
      sellSignals.map((s) => {
        const sign = s.pnlPercent >= 0 ? "+" : "";
        return `• <b>${s.symbol}</b> (${sign}${s.pnlPercent.toFixed(1)}%) — ${s.reason}`;
      }).join("\n")
    : "\n\n✅ <b>Portfolio</b> — No sell signals, all holdings healthy";

  return (
    `🌅 <b>TradeMind Morning Brief</b>\n📅 ${today}\n` +
    `\n🤖 <b>Top AI Picks Today</b>${pickLines}` +
    sellLines +
    `\n\n💼 Portfolio Value: ₹${portfolioValue.toLocaleString("en-IN")}\n` +
    `\n<i>⚠️ Educational only. Not financial advice.</i>`
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
    `🎯 Target: ₹${signal.target.toLocaleString("en-IN")} (+12%)\n` +
    `🛡 Stop Loss: ₹${signal.stopLoss.toLocaleString("en-IN")} (-7%)\n\n` +
    `<i>Educational only. Do your own research.</i>`
  );
}
