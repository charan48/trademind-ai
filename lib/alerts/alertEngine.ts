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

// ── Buy opportunity scanner ───────────────────────────────────────────────────
export function getBuySignals(excludeSymbols: string[] = []): BuySignal[] {
  const signals: BuySignal[] = [];

  for (const s of STOCKS) {
    if (excludeSymbols.includes(s.symbol)) continue;

    const reasons: string[] = [];
    let confidence: "HIGH" | "MEDIUM" = "MEDIUM";

    // RSI oversold
    const rsiOversold = s.rsi < 40;
    if (rsiOversold) reasons.push(`RSI ${s.rsi.toFixed(0)} — oversold, reversal likely`);

    // MACD bullish crossover (macd > macdSignal)
    const macdBull = s.macd > s.macdSignal;
    if (macdBull) reasons.push("MACD bullish crossover");

    // Price near support (within 3%)
    const support = s.technicals?.support ?? 0;
    const nearSupport = support > 0 && ((s.price - support) / support) < 0.03;
    if (nearSupport) reasons.push(`Price near support ₹${support.toLocaleString("en-IN")}`);

    // Strong AI score
    const strongAI = s.aiScore >= 80;
    if (strongAI) reasons.push(`AI Score ${s.aiScore}/100 — strongly bullish`);

    // Price above EMA20 and EMA50 (uptrend confirmation)
    const uptrend = s.ema20 && s.ema50 && s.price > s.ema20 && s.ema20 > s.ema50;
    if (uptrend) reasons.push("Price above EMA20 > EMA50 — uptrend confirmed");

    // Need at least 2 signals to qualify
    if (reasons.length < 2) continue;

    // HIGH confidence = 3+ signals OR (RSI oversold + strong AI)
    if (reasons.length >= 3 || (rsiOversold && strongAI) || (macdBull && nearSupport)) {
      confidence = "HIGH";
    }

    const target = parseFloat((s.price * 1.12).toFixed(2));   // 12% target
    const stopLoss = parseFloat((s.price * 0.93).toFixed(2)); // 7% stop loss

    signals.push({
      symbol: s.symbol,
      name: s.name,
      price: s.price,
      rsi: s.rsi,
      aiScore: s.aiScore,
      reason: reasons.slice(0, 2).join(" · "),
      entryZone: `₹${(s.price * 0.99).toLocaleString("en-IN")} – ₹${(s.price * 1.01).toLocaleString("en-IN")}`,
      target,
      stopLoss,
      confidence,
    });
  }

  return signals.sort((a, b) => (b.confidence === "HIGH" ? 1 : 0) - (a.confidence === "HIGH" ? 1 : 0));
}

// ── Morning top picks ─────────────────────────────────────────────────────────
export function getTopStockPicks(excludeSymbols: string[] = []): StockPick[] {
  return STOCKS
    .filter((s) => !excludeSymbols.includes(s.symbol))
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3)
    .map((s) => {
      const support = s.technicals?.support ?? 0;
      const resistance = s.technicals?.resistance ?? 0;
      return {
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        aiScore: s.aiScore,
        sentiment: s.sentiment,
        rsi: s.rsi,
        changePercent: s.changePercent,
        reason:
          s.aiScore >= 80
            ? "Strong AI bullish signal + price momentum"
            : s.rsi < 45
            ? "Oversold — potential reversal entry"
            : "Positive sector outlook + technical strength",
        entryZone:
          support > 0
            ? `₹${support.toLocaleString("en-IN")} – ₹${(support * 1.02).toLocaleString("en-IN")}`
            : `Near ₹${s.price.toLocaleString("en-IN")}`,
        target: resistance > 0 ? resistance : parseFloat((s.price * 1.1).toFixed(2)),
        stopLoss: parseFloat((s.price * 0.93).toFixed(2)),
      };
    });
}

// ── Portfolio sell signal scanner ─────────────────────────────────────────────
export function getSellSignals(holdings: PortfolioHolding[]): SellSignal[] {
  const signals: SellSignal[] = [];

  for (const h of holdings) {
    const stock = STOCKS.find((s) => s.symbol === h.symbol);
    if (!stock) continue;

    const pnlPct = ((stock.price - h.avgBuyPrice) / h.avgBuyPrice) * 100;
    const resistance = stock.technicals?.resistance ?? 0;

    // 1. RSI overbought
    if (stock.rsi > 72) {
      signals.push({
        symbol: h.symbol,
        name: h.name,
        currentPrice: stock.price,
        avgBuyPrice: h.avgBuyPrice,
        pnlPercent: pnlPct,
        rsi: stock.rsi,
        reason: `RSI ${stock.rsi.toFixed(0)} — overbought, momentum likely to reverse`,
        urgency: stock.rsi > 80 ? "HIGH" : "MEDIUM",
        action: pnlPct > 0 ? "Book partial profits (50%)" : "Exit to limit losses",
      });
    }

    // 2. Stop-loss: down 8%
    else if (pnlPct < -8) {
      signals.push({
        symbol: h.symbol,
        name: h.name,
        currentPrice: stock.price,
        avgBuyPrice: h.avgBuyPrice,
        pnlPercent: pnlPct,
        rsi: stock.rsi,
        reason: `Stop-loss triggered — down ${Math.abs(pnlPct).toFixed(1)}% from avg buy`,
        urgency: "HIGH",
        action: "Exit position immediately to limit loss",
      });
    }

    // 3. Near resistance with weak AI score
    else if (resistance > 0 && stock.price >= resistance * 0.98 && stock.aiScore < 65) {
      signals.push({
        symbol: h.symbol,
        name: h.name,
        currentPrice: stock.price,
        avgBuyPrice: h.avgBuyPrice,
        pnlPercent: pnlPct,
        rsi: stock.rsi,
        reason: `Price near resistance ₹${resistance.toLocaleString("en-IN")} — AI score weakening`,
        urgency: "MEDIUM",
        action: pnlPct > 5 ? "Book profits at resistance" : "Watch closely, set stop",
      });
    }

    // 4. Profit target 15%+ with weakening momentum
    else if (pnlPct > 15 && stock.aiScore < 65) {
      signals.push({
        symbol: h.symbol,
        name: h.name,
        currentPrice: stock.price,
        avgBuyPrice: h.avgBuyPrice,
        pnlPercent: pnlPct,
        rsi: stock.rsi,
        reason: `Up ${pnlPct.toFixed(1)}% — AI momentum weakening, consider booking`,
        urgency: "MEDIUM",
        action: "Book 50–75% profits, trail stop on remainder",
      });
    }

    // 5. MACD bearish crossover while in profit
    else if (stock.macd < stock.macdSignal && pnlPct > 3) {
      signals.push({
        symbol: h.symbol,
        name: h.name,
        currentPrice: stock.price,
        avgBuyPrice: h.avgBuyPrice,
        pnlPercent: pnlPct,
        rsi: stock.rsi,
        reason: "MACD bearish crossover — selling pressure building",
        urgency: "MEDIUM",
        action: "Tighten stop-loss, prepare to exit if continues",
      });
    }
  }

  return signals;
}

// ── Portfolio health check (hold/watch status) ────────────────────────────────
export interface HoldingStatus {
  symbol: string;
  name: string;
  pnlPercent: number;
  rsi: number;
  status: "HOLD" | "WATCH" | "SELL";
  note: string;
}

export function getPortfolioHealth(holdings: PortfolioHolding[]): HoldingStatus[] {
  return holdings.map((h) => {
    const stock = STOCKS.find((s) => s.symbol === h.symbol);
    if (!stock) return { symbol: h.symbol, name: h.name, pnlPercent: 0, rsi: 0, status: "HOLD" as const, note: "Data unavailable" };

    const pnlPct = ((stock.price - h.avgBuyPrice) / h.avgBuyPrice) * 100;

    if (stock.rsi > 72 || pnlPct < -8) {
      return { symbol: h.symbol, name: h.name, pnlPercent: pnlPct, rsi: stock.rsi, status: "SELL", note: "Sell signal active" };
    }
    if (stock.rsi > 60 || (stock.macd < stock.macdSignal && pnlPct > 3)) {
      return { symbol: h.symbol, name: h.name, pnlPercent: pnlPct, rsi: stock.rsi, status: "WATCH", note: "Monitor closely" };
    }
    return { symbol: h.symbol, name: h.name, pnlPercent: pnlPct, rsi: stock.rsi, status: "HOLD", note: "Looking good, hold position" };
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
    const sign = p.changePercent >= 0 ? "+" : "";
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
  const emoji = signal.urgency === "HIGH" ? "🚨" : "⚠️";
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
