"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WatchlistItem, PortfolioHolding, Trade, AIMessage, PortfolioStats } from "@/lib/types";

// ─── Watchlist Store ──────────────────────────────────────────────────────────
interface WatchlistStore {
  items: WatchlistItem[];
  addItem: (item: WatchlistItem) => void;
  removeItem: (symbol: string) => void;
  hasItem: (symbol: string) => boolean;
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((s) => ({ items: s.items.some((i) => i.symbol === item.symbol) ? s.items : [...s.items, item] })),
      removeItem: (symbol) =>
        set((s) => ({ items: s.items.filter((i) => i.symbol !== symbol) })),
      hasItem: (symbol) => get().items.some((i) => i.symbol === symbol),
    }),
    { name: "trademind-watchlist-v2" }
  )
);

// ─── Empty initial portfolio stats ───────────────────────────────────────────
const EMPTY_STATS: PortfolioStats = {
  totalInvested: 0,
  currentValue: 0,
  totalPnL: 0,
  totalPnLPercent: 0,
  dayPnL: 0,
  dayPnLPercent: 0,
  cash: 1_000_000, // ₹10,00,000 virtual starting balance
  xirr: 0,
  holdings: 0,
};

// ─── Portfolio Store ──────────────────────────────────────────────────────────
interface PortfolioStore {
  holdings: PortfolioHolding[];
  trades: Trade[];
  stats: PortfolioStats;
  buyStock: (symbol: string, name: string, sector: string, quantity: number, price: number) => void;
  sellStock: (symbol: string, quantity: number, price: number) => void;
  resetPortfolio: () => void;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      holdings: [],
      trades: [],
      stats: EMPTY_STATS,

      buyStock: (symbol, name, sector, quantity, price) => {
        const total = quantity * price;
        const existing = get().holdings.find((h) => h.symbol === symbol);

        if (existing) {
          const newQty = existing.quantity + quantity;
          const newAvg = (existing.avgBuyPrice * existing.quantity + price * quantity) / newQty;
          set((s) => ({
            holdings: s.holdings.map((h) =>
              h.symbol === symbol
                ? { ...h, quantity: newQty, avgBuyPrice: newAvg, invested: newQty * newAvg }
                : h
            ),
          }));
        } else {
          const newHolding: PortfolioHolding = {
            id: Date.now().toString(),
            symbol, name, sector,
            quantity, avgBuyPrice: price, currentPrice: price,
            invested: total, currentValue: total,
            pnl: 0, pnlPercent: 0,
            dayChange: 0, dayChangePercent: 0,
            allocation: 0,
          };
          set((s) => ({ holdings: [...s.holdings, newHolding] }));
        }

        const trade: Trade = {
          id: Date.now().toString(),
          symbol, name, type: "BUY",
          quantity, price, total,
          date: new Date().toISOString().split("T")[0],
          status: "EXECUTED",
        };
        set((s) => ({
          trades: [trade, ...s.trades],
          stats: {
            ...s.stats,
            totalInvested: s.stats.totalInvested + total,
            cash: s.stats.cash - total,
          },
        }));
      },

      sellStock: (symbol, quantity, price) => {
        const holding = get().holdings.find((h) => h.symbol === symbol);
        if (!holding) return;

        const total = quantity * price;
        const pnl = (price - holding.avgBuyPrice) * quantity;

        if (holding.quantity <= quantity) {
          set((s) => ({ holdings: s.holdings.filter((h) => h.symbol !== symbol) }));
        } else {
          set((s) => ({
            holdings: s.holdings.map((h) =>
              h.symbol === symbol
                ? { ...h, quantity: h.quantity - quantity, invested: (h.quantity - quantity) * h.avgBuyPrice }
                : h
            ),
          }));
        }

        const trade: Trade = {
          id: Date.now().toString(),
          symbol, name: holding.name, type: "SELL",
          quantity, price, total,
          date: new Date().toISOString().split("T")[0],
          status: "EXECUTED",
        };
        set((s) => ({
          trades: [trade, ...s.trades],
          stats: {
            ...s.stats,
            cash: s.stats.cash + total,
            totalPnL: s.stats.totalPnL + pnl,
          },
        }));
      },

      resetPortfolio: () => set({ holdings: [], trades: [], stats: EMPTY_STATS }),
    }),
    { name: "trademind-portfolio-v3" } // v3 = fresh empty start
  )
);

// ─── AI Chat Store ────────────────────────────────────────────────────────────
interface ChatStore {
  messages: AIMessage[];
  isLoading: boolean;
  addMessage: (msg: AIMessage) => void;
  setLoading: (loading: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (loading) => set({ isLoading: loading }),
  clearChat: () => set({ messages: [] }),
}));

// ─── UI Store ─────────────────────────────────────────────────────────────────
interface UIStore {
  sidebarOpen: boolean;
  activeTab: string;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarOpen: true,
  activeTab: "dashboard",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

// ─── Live Market Store ────────────────────────────────────────────────────────
export interface LiveQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  high52w: number;
  low52w: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  prevClose: number;
  name?: string;
}

export interface LiveTechnicals {
  rsi: number;
  macd: number;
  macdSignal: number;
  ema20: number;
  ema50: number;
  ema200: number;
  support: number;
  resistance: number;
  trend: string;
  sentiment: string;
}

interface LiveMarketStore {
  quotes: Record<string, LiveQuote>;
  technicals: Record<string, LiveTechnicals>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  setQuotes: (q: Record<string, LiveQuote>) => void;
  setTechnicals: (symbol: string, t: LiveTechnicals) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setLastUpdated: (ts: number) => void;
}

export const useLiveMarketStore = create<LiveMarketStore>()((set) => ({
  quotes: {},
  technicals: {},
  isLoading: true,
  error: null,
  lastUpdated: null,
  setQuotes: (quotes) => set({ quotes }),
  setTechnicals: (symbol, t) => set((s) => ({ technicals: { ...s.technicals, [symbol]: t } })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),
}));

// ─── Notification / Telegram Store ───────────────────────────────────────────
export interface AlertConfig {
  id: string;
  symbol: string;
  type: "PRICE_ABOVE" | "PRICE_BELOW" | "AI_SCORE" | "DAILY_SUMMARY";
  value: number;
  active: boolean;
  label: string;
}

interface NotifStore {
  telegramToken: string;
  telegramChatId: string;
  connected: boolean;
  alerts: AlertConfig[];
  morningAlertEnabled: boolean;
  sellAlertEnabled: boolean;
  chromeNotifEnabled: boolean;
  lastMorningAlertDate: string;
  setCredentials: (token: string, chatId: string) => void;
  setConnected: (v: boolean) => void;
  addAlert: (a: AlertConfig) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  setMorningAlertEnabled: (v: boolean) => void;
  setSellAlertEnabled: (v: boolean) => void;
  setChromeNotifEnabled: (v: boolean) => void;
  setLastMorningAlertDate: (date: string) => void;
}

export const useNotifStore = create<NotifStore>()(
  persist(
    (set) => ({
      telegramToken: "",
      telegramChatId: "",
      connected: false,
      alerts: [],
      morningAlertEnabled: true,
      sellAlertEnabled: true,
      chromeNotifEnabled: false,
      lastMorningAlertDate: "",
      setCredentials: (token, chatId) => set({ telegramToken: token, telegramChatId: chatId }),
      setConnected: (v) => set({ connected: v }),
      addAlert: (a) => set((s) => ({ alerts: [...s.alerts, a] })),
      removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
      toggleAlert: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
        })),
      setMorningAlertEnabled: (v) => set({ morningAlertEnabled: v }),
      setSellAlertEnabled: (v) => set({ sellAlertEnabled: v }),
      setChromeNotifEnabled: (v) => set({ chromeNotifEnabled: v }),
      setLastMorningAlertDate: (date) => set({ lastMorningAlertDate: date }),
    }),
    { name: "trademind-notifications" }
  )
);
