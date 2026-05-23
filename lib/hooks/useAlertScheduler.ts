"use client";

import { useEffect, useRef } from "react";
import { useNotifStore, usePortfolioStore, useLiveMarketStore } from "@/lib/store/store";
import {
  getTopStockPicks,
  getSellSignals,
  getBuySignals,
  formatMorningBrief,
  formatSellAlert,
  formatBuyAlert,
} from "@/lib/alerts/alertEngine";

const MORNING_START = 9 * 60 + 15; // 9:15 AM IST
const MORNING_END   = 9 * 60 + 45; // 9:45 AM IST
const TICK_MS       = 5 * 60 * 1000; // 5 min

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

  const sentSell = useRef<Set<string>>(new Set());
  const sentBuy  = useRef<Set<string>>(new Set());

  const canNotify = connected && (telegramToken && telegramChatId || chromeNotifEnabled);

  useEffect(() => {
    if (!canNotify) return;

    const tick = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const day = now.getDay();
      const isWeekday = day >= 1 && day <= 5;
      const mins = now.getHours() * 60 + now.getMinutes();

      // ── Morning brief ──────────────────────────────────────────────────────
      if (
        morningAlertEnabled &&
        isWeekday &&
        mins >= MORNING_START &&
        mins < MORNING_END &&
        lastMorningAlertDate !== todayStr
      ) {
        const portfolioSymbols = holdings.map((h) => h.symbol);
        const picks       = getTopStockPicks(portfolioSymbols, quotes, technicals);
        const sellSignals = getSellSignals(holdings, quotes, technicals);
        const portfolioValue = holdings.reduce((sum, h) => sum + h.currentValue, 0) + stats.cash;
        const message = formatMorningBrief(picks, portfolioValue, sellSignals);

        if (telegramToken && telegramChatId) {
          await sendTg(telegramToken, telegramChatId, message);
        }
        sendChromeNotif(
          "📊 TradeMind Morning Brief",
          `Top picks: ${picks.map((p) => p.symbol).join(", ")} · Portfolio ₹${portfolioValue.toLocaleString("en-IN")}`,
          chromeNotifEnabled
        );
        setLastMorningAlertDate(todayStr);
      }

      // ── Portfolio sell + buy signals ───────────────────────────────────────
      if (sellAlertEnabled && holdings.length > 0) {
        const heldSymbols = holdings.map((h) => h.symbol);
        const signals = getSellSignals(holdings, quotes, technicals);
        for (const s of signals) {
          const key = `sell-${s.symbol}-${todayStr}`;
          if (!sentSell.current.has(key)) {
            sentSell.current.add(key);
            if (telegramToken && telegramChatId) {
              await sendTg(telegramToken, telegramChatId, formatSellAlert(s));
            }
            sendChromeNotif(
              `${s.urgency === "HIGH" ? "🚨" : "⚠️"} SELL: ${s.symbol}`,
              s.reason,
              chromeNotifEnabled
            );
          }
        }

        const buySignals = getBuySignals(heldSymbols, quotes, technicals);
        for (const b of buySignals) {
          const key = `buy-${b.symbol}-${todayStr}`;
          if (!sentBuy.current.has(key)) {
            sentBuy.current.add(key);
            if (telegramToken && telegramChatId) {
              await sendTg(telegramToken, telegramChatId, formatBuyAlert(b));
            }
            sendChromeNotif(
              `${b.confidence === "HIGH" ? "🟢" : "🔵"} BUY: ${b.symbol}`,
              b.reason,
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
