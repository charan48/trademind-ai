"use client";

import { useEffect, useRef } from "react";
import { useNotifStore, usePortfolioStore, useLiveMarketStore } from "@/lib/store/store";
import {
  getTopStockPicks,
  getSellSignals,
  getBuySignals,
  getHoldingHealth,
  formatMorningBrief,
  formatSellAlert,
  formatBuyAlert,
} from "@/lib/alerts/alertEngine";

const MORNING_START = 9 * 60 + 15;  // 9:15 AM IST
const MORNING_END   = 9 * 60 + 45;  // 9:45 AM IST
const TICK_MS       = 5 * 60 * 1000; // 5 min

// Profit target levels — alert when crossing each
const PROFIT_TARGETS = [10, 20, 30]; // %

async function sendTg(token: string, chatId: string, message: string) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, chatId, message }),
    });
  } catch { /* silent */ }
}

function sendChromeNotif(title: string, body: string, enabled: boolean) {
  if (!enabled) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png" });
  } catch { /* some browsers block in certain contexts */ }
}

export function useAlertScheduler() {
  const {
    telegramToken, telegramChatId, connected,
    morningAlertEnabled, sellAlertEnabled, chromeNotifEnabled,
    lastMorningAlertDate, setLastMorningAlertDate,
  } = useNotifStore();
  const { holdings, stats } = usePortfolioStore();
  const { quotes, technicals } = useLiveMarketStore();

  // Track which alerts have fired today to avoid duplicates
  const sentSell    = useRef<Set<string>>(new Set());
  const sentBuy     = useRef<Set<string>>(new Set());
  const sentProfit  = useRef<Set<string>>(new Set()); // profit target alerts
  const sentStop    = useRef<Set<string>>(new Set()); // stop-loss alerts

  // Track peak prices for trailing stop detection
  const peakPrices = useRef<Record<string, number>>({});

  const canNotify = connected && (
    (telegramToken && telegramChatId) || chromeNotifEnabled
  );

  useEffect(() => {
    if (!canNotify) return;

    const tick = async () => {
      const now      = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const day      = now.getDay();
      const isWeekday = day >= 1 && day <= 5;
      const mins     = now.getHours() * 60 + now.getMinutes();

      // ── Morning brief (9:15–9:45 AM weekdays, once per day) ──────────────
      if (
        morningAlertEnabled && isWeekday &&
        mins >= MORNING_START && mins < MORNING_END &&
        lastMorningAlertDate !== todayStr
      ) {
        const portfolioSymbols = holdings.map((h) => h.symbol);
        const picks = getTopStockPicks(portfolioSymbols, quotes, technicals);
        const sellSignals = getSellSignals(holdings, quotes, technicals);
        const portfolioValue = holdings.reduce((sum, h) => {
          const lp = quotes[h.symbol]?.price ?? h.avgBuyPrice;
          return sum + lp * h.quantity;
        }, 0) + stats.cash;
        const message = formatMorningBrief(picks, portfolioValue, sellSignals);

        if (telegramToken && telegramChatId) await sendTg(telegramToken, telegramChatId, message);
        sendChromeNotif(
          "📊 TradeMind Morning Brief",
          picks.length > 0
            ? `Top pick: ${picks[0].symbol} · Entry Score ${picks[0].entryScore}/100 · ${picks[0].strategy}`
            : "Today's market analysis ready",
          chromeNotifEnabled
        );
        setLastMorningAlertDate(todayStr);
      }

      // ── Portfolio monitoring — runs every tick ────────────────────────────
      if (sellAlertEnabled && holdings.length > 0) {
        // Update peak prices for trailing stop
        for (const h of holdings) {
          const livePrice = quotes[h.symbol]?.price ?? h.avgBuyPrice;
          if (!peakPrices.current[h.symbol] || livePrice > peakPrices.current[h.symbol]) {
            peakPrices.current[h.symbol] = livePrice;
          }
        }

        // ── Sell signal alerts ──────────────────────────────────────────────
        const sellSignals = getSellSignals(holdings, quotes, technicals);
        for (const s of sellSignals) {
          const key = `sell-${s.symbol}-${todayStr}-${s.urgency}`;
          if (!sentSell.current.has(key)) {
            sentSell.current.add(key);
            if (telegramToken && telegramChatId) await sendTg(telegramToken, telegramChatId, formatSellAlert(s));
            sendChromeNotif(
              `${s.urgency === "HIGH" ? "🚨" : "⚠️"} SELL: ${s.symbol}`,
              `${s.reason} — ${s.action}`,
              chromeNotifEnabled
            );
          }
        }

        // ── Profit target alerts (10%, 20%, 30%) ────────────────────────────
        for (const h of holdings) {
          const livePrice = quotes[h.symbol]?.price ?? h.avgBuyPrice;
          const pnlPct = h.avgBuyPrice > 0 ? ((livePrice - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0;

          for (const target of PROFIT_TARGETS) {
            if (pnlPct >= target) {
              const key = `profit-${h.symbol}-${target}-${todayStr}`;
              if (!sentProfit.current.has(key)) {
                sentProfit.current.add(key);
                const profitAmt = (livePrice - h.avgBuyPrice) * h.quantity;
                const msg =
                  `🎯 <b>PROFIT TARGET HIT — ${h.symbol}</b>\n\n` +
                  `📊 <b>${h.name}</b>\n` +
                  `Buy Price: ₹${h.avgBuyPrice.toLocaleString("en-IN")}\n` +
                  `Current: ₹${livePrice.toLocaleString("en-IN")}\n` +
                  `P&amp;L: <b>+${pnlPct.toFixed(1)}% (₹${profitAmt.toLocaleString("en-IN", { maximumFractionDigits: 0 })})</b>\n\n` +
                  `✅ Consider booking ${target >= 20 ? "75%" : "50%"} profits\n` +
                  `<i>Raise stop-loss to protect gains.</i>`;
                if (telegramToken && telegramChatId) await sendTg(telegramToken, telegramChatId, msg);
                sendChromeNotif(
                  `🎯 ${h.symbol} +${target}% target hit!`,
                  `P&L ₹${profitAmt.toLocaleString("en-IN", { maximumFractionDigits: 0 })} — book ${target >= 20 ? "75%" : "50%"} profits`,
                  chromeNotifEnabled
                );
              }
            }
          }

          // ── Trailing stop alert: if peak was hit and now 7% below peak ───
          const peak = peakPrices.current[h.symbol] ?? livePrice;
          const pnlFromPeak = peak > 0 ? ((livePrice - peak) / peak) * 100 : 0;
          const peakGain = h.avgBuyPrice > 0 ? ((peak - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0;
          if (peakGain >= 12 && pnlFromPeak <= -7) {
            const key = `trail-${h.symbol}-${todayStr}`;
            if (!sentStop.current.has(key)) {
              sentStop.current.add(key);
              const msg =
                `⚡ <b>TRAILING STOP — ${h.symbol}</b>\n\n` +
                `Peak: ₹${peak.toLocaleString("en-IN")} | Now: ₹${livePrice.toLocaleString("en-IN")}\n` +
                `Pulled back <b>${Math.abs(pnlFromPeak).toFixed(1)}%</b> from peak\n` +
                `Peak gain was +${peakGain.toFixed(1)}%\n\n` +
                `⚠️ Momentum reversing — review position\n` +
                `<i>Consider exiting to protect peak gains.</i>`;
              if (telegramToken && telegramChatId) await sendTg(telegramToken, telegramChatId, msg);
              sendChromeNotif(
                `⚡ ${h.symbol} trailing stop triggered`,
                `Pulled back ${Math.abs(pnlFromPeak).toFixed(1)}% from peak ₹${peak.toLocaleString("en-IN")}`,
                chromeNotifEnabled
              );
            }
          }
        }

        // ── Buy opportunity alerts (for non-held stocks) ──────────────────
        const heldSymbols = holdings.map((h) => h.symbol);
        const buySignals  = getBuySignals(heldSymbols, quotes, technicals);
        for (const b of buySignals) {
          const key = `buy-${b.symbol}-${todayStr}`;
          if (!sentBuy.current.has(key)) {
            sentBuy.current.add(key);
            if (telegramToken && telegramChatId) await sendTg(telegramToken, telegramChatId, formatBuyAlert(b));
            sendChromeNotif(
              `${b.confidence === "HIGH" ? "🟢" : "🔵"} BUY: ${b.symbol}`,
              `${b.reason} · AI Score ${b.aiScore}/100`,
              chromeNotifEnabled
            );
          }
        }
      }
    };

    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [
    canNotify, connected, telegramToken, telegramChatId,
    morningAlertEnabled, sellAlertEnabled, chromeNotifEnabled,
    holdings, stats.cash, lastMorningAlertDate, setLastMorningAlertDate,
    quotes, technicals,
  ]);
}
