"use client";

import { useEffect, useRef } from "react";
import { useNotifStore, usePortfolioStore } from "@/lib/store/store";
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
  } catch {
    // silent — background scheduler
  }
}

export function useAlertScheduler() {
  const {
    telegramToken, telegramChatId, connected,
    morningAlertEnabled, sellAlertEnabled,
    lastMorningAlertDate, setLastMorningAlertDate,
  } = useNotifStore();
  const { holdings, stats } = usePortfolioStore();

  // Deduplicate sell/buy alerts per symbol per day within session
  const sentSell = useRef<Set<string>>(new Set());
  const sentBuy  = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!connected || !telegramToken || !telegramChatId) return;

    const tick = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const day = now.getDay();
      const isWeekday = day >= 1 && day <= 5;
      const mins = now.getHours() * 60 + now.getMinutes();

      // ── Morning brief (picks + portfolio sell alerts bundled) ──
      if (
        morningAlertEnabled &&
        isWeekday &&
        mins >= MORNING_START &&
        mins < MORNING_END &&
        lastMorningAlertDate !== todayStr
      ) {
        const portfolioSymbols = holdings.map((h) => h.symbol);
        const picks = getTopStockPicks(portfolioSymbols);
        const sellSignals = getSellSignals(holdings);
        const portfolioValue = holdings.reduce((sum, h) => sum + h.currentValue, 0) + stats.cash;
        await sendTg(telegramToken, telegramChatId, formatMorningBrief(picks, portfolioValue, sellSignals));
        setLastMorningAlertDate(todayStr);
      }

      // ── Portfolio sell signals (live monitoring) ──
      if (sellAlertEnabled && holdings.length > 0) {
        const heldSymbols = holdings.map((h) => h.symbol);
        const signals = getSellSignals(holdings);
        for (const s of signals) {
          const key = `sell-${s.symbol}-${todayStr}`;
          if (!sentSell.current.has(key)) {
            sentSell.current.add(key);
            await sendTg(telegramToken, telegramChatId, formatSellAlert(s));
          }
        }

        // ── Buy opportunities for non-portfolio stocks ──
        const buySignals = getBuySignals(heldSymbols);
        for (const b of buySignals) {
          const key = `buy-${b.symbol}-${todayStr}`;
          if (!sentBuy.current.has(key)) {
            sentBuy.current.add(key);
            await sendTg(telegramToken, telegramChatId, formatBuyAlert(b));
          }
        }
      }
    };

    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [
    connected, telegramToken, telegramChatId,
    morningAlertEnabled, sellAlertEnabled,
    holdings, stats.cash, lastMorningAlertDate, setLastMorningAlertDate,
  ]);
}
