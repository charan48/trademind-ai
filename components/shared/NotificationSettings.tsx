"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Send, CheckCircle2, XCircle, Loader2,
  Trash2, Plus, ChevronDown, ExternalLink, AlertCircle,
  Sunrise, TrendingDown, Zap
} from "lucide-react";
import { toast } from "sonner";
import { useNotifStore, usePortfolioStore, AlertConfig } from "@/lib/store/store";
import { STOCKS } from "@/lib/data/mockData";
import { getTopStockPicks, getSellSignals, getBuySignals, formatMorningBrief, formatSellAlert, formatBuyAlert } from "@/lib/alerts/alertEngine";

// ─── Telegram sender helper ───────────────────────────────────────────────────
async function sendTelegram(token: string, chatId: string, message: string) {
  const res = await fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, chatId, message }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Failed to send");
  return data;
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
        enabled ? "bg-brand-purple" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Setup step UI ────────────────────────────────────────────────────────────
function SetupGuide({ onConnected }: { onConnected: () => void }) {
  const [token, setToken]   = useState("");
  const [chatId, setChatId] = useState("");
  const [step, setStep]     = useState(1);
  const [testing, setTesting] = useState(false);
  const [autoFetching, setAutoFetching] = useState(false);
  const { setCredentials, setConnected } = useNotifStore();

  const fetchChatId = async () => {
    if (!token.trim()) { toast.error("Enter bot token first"); return; }
    setAutoFetching(true);
    try {
      const res = await fetch(`/api/notify?token=${encodeURIComponent(token.trim())}`);
      const data = await res.json();
      if (data.chatId) {
        setChatId(String(data.chatId));
        toast.success("Chat ID found automatically!");
      } else {
        toast.error("No messages found. Send any message to your bot first, then retry.");
      }
    } catch {
      toast.error("Could not reach Telegram. Check token.");
    } finally {
      setAutoFetching(false);
    }
  };

  const testAndSave = async () => {
    if (!token.trim() || !chatId.trim()) {
      toast.error("Fill both Token and Chat ID");
      return;
    }
    setTesting(true);
    try {
      await sendTelegram(
        token.trim(),
        chatId.trim(),
        `🤖 <b>TradeMind AI Connected!</b>\n\n` +
        `✅ Notifications are now active.\n` +
        `📈 You'll receive stock alerts, AI signals, and portfolio updates here.\n\n` +
        `<i>Powered by TradeMind AI</i>`
      );
      setCredentials(token.trim(), chatId.trim());
      setConnected(true);
      toast.success("Connected! Test message sent to Telegram.");
      onConnected();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Connection failed: ${msg}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s ? "bg-brand-purple text-white" : "bg-white/10 text-gray-500"
            }`}>{s}</div>
            {s < 3 && <div className={`w-8 h-0.5 transition-all ${step > s ? "bg-brand-purple" : "bg-white/10"}`} />}
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-2">
          {step === 1 ? "Create Bot" : step === 2 ? "Get Token" : "Enter Details"}
        </span>
      </div>

      {/* Step 1: Create bot */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="p-4 rounded-xl bg-brand-purple/8 border border-brand-purple/20">
            <p className="text-sm font-semibold text-white mb-3">Step 1: Create a Telegram Bot (free, 2 min)</p>
            <ol className="space-y-2.5 text-sm text-gray-300">
              <li className="flex gap-2">
                <span className="text-brand-purple font-bold flex-shrink-0">1.</span>
                Open Telegram → search <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-xs text-brand-cyan">@BotFather</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-purple font-bold flex-shrink-0">2.</span>
                Send <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-xs text-market-bull">/newbot</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-purple font-bold flex-shrink-0">3.</span>
                Give it any name (e.g. <i>MyTradeAlert</i>)
              </li>
              <li className="flex gap-2">
                <span className="text-brand-purple font-bold flex-shrink-0">4.</span>
                BotFather gives you a <b className="text-white">token</b> like <span className="font-mono text-xs text-brand-cyan">123456:ABC-DEF...</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-purple font-bold flex-shrink-0">5.</span>
                Click your bot&apos;s link → send it <b className="text-white">any message</b> (e.g. "hi")
              </li>
            </ol>
          </div>
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] text-sm font-semibold hover:bg-[#229ED9]/25 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
            Open @BotFather on Telegram
            <ExternalLink className="w-3.5 h-3.5 ml-auto" />
          </a>
          <button
            onClick={() => setStep(2)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            I created the bot →
          </button>
        </motion.div>
      )}

      {/* Step 2: Get credentials */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Bot Token (from BotFather)</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklmno..."
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-purple/50 font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-gray-400 font-semibold">Your Chat ID</label>
                <button
                  onClick={fetchChatId}
                  disabled={autoFetching || !token.trim()}
                  className="flex items-center gap-1.5 text-xs text-brand-purple hover:text-brand-cyan disabled:opacity-40 transition-colors"
                >
                  {autoFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <></>}
                  Auto-detect →
                </button>
              </div>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. 987654321"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-purple/50 font-mono"
              />
              <p className="text-xs text-gray-600 mt-1">
                Paste your token above then click "Auto-detect", OR manually find ID at{" "}
                <span className="font-mono text-brand-cyan">api.telegram.org/bot&#123;token&#125;/getUpdates</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-3 rounded-xl glass border border-border text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={testAndSave}
              disabled={testing || !token.trim() || !chatId.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {testing ? "Sending test..." : "Connect & Test"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Alert row ────────────────────────────────────────────────────────────────
function AlertRow({ alert, onRemove, onToggle }: {
  alert: AlertConfig;
  onRemove: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-border/50">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.active ? "bg-market-bull" : "bg-gray-600"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{alert.label}</p>
        <p className="text-xs text-gray-500">{alert.symbol} · {alert.type.replace(/_/g, " ")}</p>
      </div>
      <button
        onClick={onToggle}
        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
          alert.active
            ? "bg-market-bull/15 text-market-bull hover:bg-market-bull/25"
            : "bg-white/10 text-gray-400 hover:bg-white/15"
        }`}
      >
        {alert.active ? "ON" : "OFF"}
      </button>
      <button onClick={onRemove} className="text-gray-600 hover:text-market-bear transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Add alert form ───────────────────────────────────────────────────────────
function AddAlertForm({ onAdd }: { onAdd: (a: AlertConfig) => void }) {
  const [sym, setSym]       = useState("RELIANCE");
  const [type, setType]     = useState<AlertConfig["type"]>("PRICE_ABOVE");
  const [value, setValue]   = useState("");
  const [open, setOpen]     = useState(false);

  const typeLabels: Record<AlertConfig["type"], string> = {
    PRICE_ABOVE: "Price rises above ₹",
    PRICE_BELOW: "Price drops below ₹",
    AI_SCORE:    "AI Score drops below",
    DAILY_SUMMARY: "Daily portfolio summary",
  };

  const submit = () => {
    if (type !== "DAILY_SUMMARY" && !value) { toast.error("Enter threshold value"); return; }
    const numVal = type === "DAILY_SUMMARY" ? 0 : parseFloat(value);
    const label = type === "DAILY_SUMMARY"
      ? "Daily portfolio summary (9 AM)"
      : `${sym} — ${typeLabels[type]}${numVal}`;
    onAdd({ id: Date.now().toString(), symbol: sym, type, value: numVal, active: true, label });
    setValue("");
    setOpen(false);
    toast.success("Alert created!");
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-brand-purple hover:text-brand-cyan transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add alert
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-xl bg-white/3 border border-border space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Stock</label>
                  <select
                    value={sym}
                    onChange={(e) => setSym(e.target.value)}
                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-purple/50"
                  >
                    {STOCKS.map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol}</option>)}
                    <option value="PORTFOLIO">PORTFOLIO</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Alert Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AlertConfig["type"])}
                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-purple/50"
                  >
                    {(Object.keys(typeLabels) as AlertConfig["type"][]).map((t) => (
                      <option key={t} value={t}>{typeLabels[t].replace("₹", "").replace(" below", "").replace(" above", "")}</option>
                    ))}
                  </select>
                </div>
              </div>
              {type !== "DAILY_SUMMARY" && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    {type === "AI_SCORE" ? "Score threshold (0–100)" : "Price (₹)"}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === "AI_SCORE" ? "e.g. 70" : "e.g. 1700"}
                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-purple/50"
                  />
                </div>
              )}
              <button
                onClick={submit}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Create Alert
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function NotificationSettings() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingMorning, setSendingMorning] = useState(false);
  const {
    telegramToken, telegramChatId, connected, alerts,
    morningAlertEnabled, sellAlertEnabled, lastMorningAlertDate,
    setConnected, addAlert, removeAlert, toggleAlert,
    setCredentials, setMorningAlertEnabled, setSellAlertEnabled,
    setLastMorningAlertDate,
  } = useNotifStore();
  const { holdings, stats } = usePortfolioStore();

  const sendTestAlert = async () => {
    setSending(true);
    try {
      await sendTelegram(
        telegramToken,
        telegramChatId,
        `📊 <b>TradeMind AI — Market Alert</b>\n\n` +
        `🟢 HDFC Bank: <b>₹1,623</b> (+1.81%) — AI Score 91\n` +
        `🟢 RELIANCE: <b>₹2,847</b> (+1.61%) — AI Score 87\n` +
        `🔴 WIPRO: <b>₹487</b> (-1.10%) — AI Score 55\n\n` +
        `💼 Portfolio: <b>₹1,07,345</b> (+₹1,418 today)\n\n` +
        `<i>TradeMind AI · ${new Date().toLocaleString("en-IN")}</i>`
      );
      toast.success("Test alert sent to Telegram!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  const sendMorningBriefNow = async () => {
    setSendingMorning(true);
    try {
      const portfolioSymbols = holdings.map((h) => h.symbol);
      const picks = getTopStockPicks(portfolioSymbols);
      const sellSignals = getSellSignals(holdings);
      const portfolioValue = holdings.reduce((sum, h) => sum + h.currentValue, 0) + stats.cash;
      await sendTelegram(telegramToken, telegramChatId, formatMorningBrief(picks, portfolioValue, sellSignals));
      setLastMorningAlertDate(new Date().toISOString().split("T")[0]);
      toast.success("Morning brief sent to Telegram!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed: ${msg}`);
    } finally {
      setSendingMorning(false);
    }
  };

  const sendSellSignalsNow = async () => {
    const portfolioSymbols = holdings.map((h) => h.symbol);
    const sellSignals = getSellSignals(holdings);
    const buySignals = getBuySignals(portfolioSymbols);

    if (sellSignals.length === 0 && buySignals.length === 0) {
      toast("No signals right now — portfolio healthy, no new buy opportunities.");
      return;
    }
    setSending(true);
    try {
      for (const s of sellSignals) {
        await sendTelegram(telegramToken, telegramChatId, formatSellAlert(s));
      }
      for (const b of buySignals) {
        await sendTelegram(telegramToken, telegramChatId, formatBuyAlert(b));
      }
      const total = sellSignals.length + buySignals.length;
      toast.success(`${total} signal(s) sent — ${sellSignals.length} sell, ${buySignals.length} buy`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  const disconnect = () => {
    setCredentials("", "");
    setConnected(false);
    toast("Telegram disconnected");
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
          connected
            ? "bg-market-bull/10 border border-market-bull/30 text-market-bull hover:bg-market-bull/20"
            : "glass border border-border text-gray-400 hover:text-white"
        }`}
      >
        <Bell className="w-4 h-4" />
        {connected ? "Alerts Active" : "Set Alerts"}
        {connected && (
          <span className="w-2 h-2 bg-market-bull rounded-full animate-pulse" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-end p-4 pt-16"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[420px] max-h-[85vh] overflow-y-auto bg-bg-secondary border border-border rounded-2xl shadow-glass"
            >
              {/* Header */}
              <div className="sticky top-0 bg-bg-secondary border-b border-border px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    connected ? "bg-market-bull/20" : "bg-brand-purple/20"
                  }`}>
                    {connected ? <Bell className="w-4 h-4 text-market-bull" /> : <Bell className="w-4 h-4 text-brand-purple" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Telegram Alerts</h2>
                    <p className="text-xs text-gray-500">
                      {connected ? "Connected · Alerts active" : "Not connected"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {!connected ? (
                  <SetupGuide onConnected={() => {}} />
                ) : (
                  <>
                    {/* Connected status */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-market-bull/8 border border-market-bull/20">
                      <CheckCircle2 className="w-5 h-5 text-market-bull flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-market-bull">Telegram Connected</p>
                        <p className="text-xs text-gray-500 font-mono">Chat ID: {telegramChatId}</p>
                      </div>
                      <button
                        onClick={sendTestAlert}
                        disabled={sending}
                        className="flex items-center gap-1.5 text-xs text-brand-purple hover:text-brand-cyan disabled:opacity-50 transition-colors"
                      >
                        {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Test
                      </button>
                    </div>

                    {/* Automated alerts */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Automated Alerts</p>

                      {/* Morning picks */}
                      <div className="p-4 rounded-xl bg-white/3 border border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                              <Sunrise className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">Morning Stock Picks</p>
                              <p className="text-xs text-gray-500">Daily 9:15 AM — top 3 AI picks</p>
                            </div>
                          </div>
                          <Toggle enabled={morningAlertEnabled} onChange={setMorningAlertEnabled} />
                        </div>
                        {morningAlertEnabled && (
                          <div className="flex items-center justify-between pt-1 border-t border-border/50">
                            <p className="text-xs text-gray-600">
                              {lastMorningAlertDate
                                ? `Last sent: ${lastMorningAlertDate}`
                                : "Not sent today yet"}
                            </p>
                            <button
                              onClick={sendMorningBriefNow}
                              disabled={sendingMorning}
                              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50 transition-colors"
                            >
                              {sendingMorning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              Send now
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Sell + Buy signal monitor */}
                      <div className="p-4 rounded-xl bg-white/3 border border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-market-bear/15 flex items-center justify-center">
                              <TrendingDown className="w-4 h-4 text-market-bear" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">Live Signal Monitor</p>
                              <p className="text-xs text-gray-500">Sell: RSI/stop-loss · Buy: oversold/MACD/support</p>
                            </div>
                          </div>
                          <Toggle enabled={sellAlertEnabled} onChange={setSellAlertEnabled} />
                        </div>
                        {sellAlertEnabled && (
                          <div className="flex items-center justify-between pt-1 border-t border-border/50">
                            <p className="text-xs text-gray-600">Checks every 5 min while app open</p>
                            <button
                              onClick={sendSellSignalsNow}
                              disabled={sending}
                              className="flex items-center gap-1.5 text-xs text-brand-cyan hover:text-white disabled:opacity-50 transition-colors"
                            >
                              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                              Check now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manual alerts list */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Price Alerts ({alerts.filter((a) => a.active).length}/{alerts.length})
                        </p>
                      </div>

                      {alerts.length === 0 ? (
                        <div className="text-center py-6 text-gray-600">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">No alerts yet. Add one below.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {alerts.map((a) => (
                            <AlertRow
                              key={a.id}
                              alert={a}
                              onRemove={() => removeAlert(a.id)}
                              onToggle={() => toggleAlert(a.id)}
                            />
                          ))}
                        </div>
                      )}

                      <AddAlertForm onAdd={addAlert} />
                    </div>

                    {/* What gets sent section */}
                    <div className="p-4 rounded-xl bg-white/3 border border-border/50">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Alert Preview</p>
                      <div className="font-mono text-xs text-gray-300 bg-black/30 rounded-lg p-3 leading-relaxed">
                        📊 <span className="text-white font-bold">TradeMind AI Alert</span><br />
                        🟢 HDFC: <span className="text-market-bull">₹1,623 (+1.81%)</span><br />
                        💼 Portfolio: <span className="text-brand-purple">+₹1,418 today</span><br />
                        🤖 AI Score: <span className="text-brand-cyan">91 — Strongly Bullish</span>
                      </div>
                    </div>

                    {/* Disconnect */}
                    <button
                      onClick={disconnect}
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-market-bear transition-colors"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                      Disconnect Telegram
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
