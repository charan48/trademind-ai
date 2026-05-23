"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { TrendingUp, TrendingDown, Briefcase, ArrowUpRight, ArrowDownRight, Clock, RotateCcw, Brain, Target } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { usePortfolioStore, useLiveMarketStore } from "@/lib/store/store";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { formatINR, formatPercent } from "@/lib/utils";
import { getHoldingHealth } from "@/lib/alerts/alertEngine";
import { useState } from "react";

const SECTOR_COLORS = ["#8B5CF6", "#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

const STATUS_CONFIG = {
  SELL:  { bg: "bg-market-bear/15",   text: "text-market-bear",   border: "border-market-bear/30",   dot: "bg-market-bear",   label: "SELL"  },
  WATCH: { bg: "bg-amber-500/15",     text: "text-amber-400",     border: "border-amber-500/30",     dot: "bg-amber-400",     label: "WATCH" },
  HOLD:  { bg: "bg-market-bull/10",   text: "text-market-bull",   border: "border-market-bull/20",   dot: "bg-market-bull",   label: "HOLD"  },
};

export default function PortfolioPage() {
  const { holdings, trades, stats, resetPortfolio } = usePortfolioStore();
  const { quotes, technicals, isLoading: quotesLoading } = useLiveMarketStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [showHealth, setShowHealth] = useState(true);

  // ── Live values computed from real market prices ─────────────────────────
  const liveHoldings = holdings.map((h) => {
    const lq = quotes[h.symbol];
    const livePrice        = lq?.price         ?? h.avgBuyPrice;
    const liveCurrentValue = livePrice * h.quantity;
    const livePnl          = (livePrice - h.avgBuyPrice) * h.quantity;
    const livePnlPct       = h.avgBuyPrice > 0 ? ((livePrice - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0;
    const liveDayChangePct = lq?.changePercent ?? 0;
    return { ...h, livePrice, liveCurrentValue, livePnl, livePnlPct, liveDayChangePct };
  });

  const liveTotalValue     = liveHoldings.reduce((sum, h) => sum + h.liveCurrentValue, 0);
  const liveTotalInvested  = liveHoldings.reduce((sum, h) => sum + h.avgBuyPrice * h.quantity, 0);
  const liveTotalPnL       = liveTotalValue - liveTotalInvested;
  const liveTotalPnLPct    = liveTotalInvested > 0 ? (liveTotalPnL / liveTotalInvested) * 100 : 0;
  const liveDayPnL         = liveHoldings.reduce((sum, h) => sum + (h.liveDayChangePct / 100) * h.liveCurrentValue, 0);
  const livePortfolioValue = liveTotalValue + stats.cash;
  const liveDayPnLPct      = livePortfolioValue > 0 ? (liveDayPnL / (livePortfolioValue - liveDayPnL)) * 100 : 0;

  // ── Holding health from alert engine ────────────────────────────────────
  const healthMap = Object.fromEntries(
    getHoldingHealth(holdings, quotes as Record<string, { price: number; changePercent: number }>, technicals).map((h) => [h.symbol, h])
  );

  // ── Sector allocation ────────────────────────────────────────────────────
  const sectorAlloc = liveHoldings.reduce<Record<string, number>>((acc, h) => {
    acc[h.sector] = (acc[h.sector] ?? 0) + h.liveCurrentValue;
    return acc;
  }, {});
  const totalSectorVal = Object.values(sectorAlloc).reduce((a, b) => a + b, 0);
  const pieData = Object.entries(sectorAlloc).map(([name, value]) => ({
    name, value, pct: totalSectorVal > 0 ? ((value / totalSectorVal) * 100).toFixed(1) : "0.0",
  }));

  // ── Portfolio value history chart from trade history ─────────────────────
  const performanceData = (() => {
    if (trades.length === 0) return [];
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    const byDate: Record<string, number> = {};
    let runningValue = stats.cash;
    for (const t of sorted) {
      runningValue += t.type === "BUY" ? t.total : -t.total;
      byDate[t.date] = runningValue;
    }
    const pts = Object.entries(byDate).map(([date, val]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      value: Math.round(val),
    }));
    const todayLabel = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (pts.at(-1)?.date !== todayLabel) {
      pts.push({ date: todayLabel, value: Math.round(livePortfolioValue) });
    } else {
      pts[pts.length - 1].value = Math.round(livePortfolioValue);
    }
    return pts;
  })();

  const totalPnLPositive = liveTotalPnL >= 0;
  const dayPnLPositive   = liveDayPnL >= 0;
  const quotesReady      = Object.keys(quotes).length > 0;

  const sellCount  = Object.values(healthMap).filter((h) => h.status === "SELL").length;
  const watchCount = Object.values(healthMap).filter((h) => h.status === "WATCH").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-sm text-gray-400">
            Virtual holdings · ₹10L starting balance · Live NSE prices
            {quotesLoading && <span className="ml-2 text-brand-purple animate-pulse">Updating…</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Alert summary badges */}
          {sellCount > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-market-bear/15 border border-market-bear/30 text-market-bear text-xs font-bold animate-pulse">
              {sellCount} SELL Signal{sellCount > 1 ? "s" : ""}
            </span>
          )}
          {watchCount > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
              {watchCount} Watch
            </span>
          )}
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Reset portfolio to ₹0?</span>
              <button onClick={() => { resetPortfolio(); setConfirmReset(false); }} className="px-3 py-1.5 rounded-lg bg-market-bear/20 text-market-bear text-xs font-bold hover:bg-market-bear/30">Confirm</button>
              <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 rounded-lg glass text-gray-400 text-xs">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-border text-gray-500 hover:text-white text-xs transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Portfolio Value", value: quotesReady ? formatINR(livePortfolioValue) : null, sub: `Invested: ${formatINR(liveTotalInvested)}`, color: "text-white", big: true },
          { label: "Total P&L", value: quotesReady ? (totalPnLPositive ? "+" : "") + formatINR(liveTotalPnL) : null, sub: quotesReady ? formatPercent(liveTotalPnLPct) : "", color: liveTotalPnL >= 0 ? "text-market-bull" : "text-market-bear", big: true },
          { label: "Day's P&L", value: quotesReady ? (dayPnLPositive ? "+" : "") + formatINR(liveDayPnL) : null, sub: quotesReady ? formatPercent(liveDayPnLPct) : "", color: liveDayPnL >= 0 ? "text-market-bull" : "text-market-bear", big: false },
          { label: "Available Cash", value: formatINR(stats.cash), sub: `${holdings.length} holding${holdings.length !== 1 ? "s" : ""}`, color: "text-brand-cyan", big: false },
        ].map(({ label, value, sub, color, big }) => (
          <div key={label} className="glass rounded-2xl p-5">
            <p className="text-xs text-gray-400 mb-2 font-semibold">{label}</p>
            <p className={`${big ? "text-2xl" : "text-xl"} font-black font-num ${color}`}>
              {value ?? <span className="inline-block w-24 h-7 skeleton rounded" />}
            </p>
            <p className={`text-xs font-num mt-1 ${color === "text-white" ? "text-gray-400" : color}`}>{sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Charts row */}
      {(holdings.length > 0 || trades.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-2 glass rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-5">Portfolio Value History</h2>
            <ClientOnly fallback={<div className="h-48 skeleton rounded-xl" />}>
              {performanceData.length < 2 ? (
                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">Buy stocks to see performance chart</div>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={0} />
                      <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "12px" }} formatter={(v: number) => [formatINR(v), "Portfolio Value"]} />
                      <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#portfolioGrad)" dot={{ fill: "#8B5CF6", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ClientOnly>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-5">Sector Allocation</h2>
            <ClientOnly fallback={<div className="h-40 skeleton rounded-full mx-auto w-40" />}>
              {pieData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No holdings yet</div>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <PieChart width={160} height={160}>
                      <Pie data={pieData} cx={76} cy={76} innerRadius={45} outerRadius={76} dataKey="value" strokeWidth={0}>
                        {pieData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "11px" }} formatter={(v: number) => [formatINR(v)]} />
                    </PieChart>
                  </div>
                  <div className="space-y-2">
                    {pieData.map(({ name, pct }, i) => (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                          <span className="text-xs text-gray-300">{name}</span>
                        </div>
                        <span className="text-xs font-num font-semibold text-gray-300">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ClientOnly>
          </motion.div>
        </div>
      )}

      {/* Holdings table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white">Holdings ({liveHoldings.length})</h2>
            {liveHoldings.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-brand-purple">
                <Brain className="w-3 h-3" /> AI health monitoring active
              </span>
            )}
          </div>
          {liveHoldings.length > 0 && (
            <button
              onClick={() => setShowHealth(!showHealth)}
              className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <Target className="w-3 h-3" /> {showHealth ? "Hide" : "Show"} targets
            </button>
          )}
        </div>

        {liveHoldings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Briefcase className="w-12 h-12 mb-4 opacity-20 text-brand-purple" />
            <p className="text-white font-bold mb-2">No holdings yet</p>
            <p className="text-sm text-gray-500 mb-6">Start by buying stocks from any stock detail page. TradeMind AI will then monitor them 24/7 for optimal exit signals.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg w-full">
              {["RELIANCE", "HDFC", "TCS", "SBIN"].map((sym) => (
                <Link key={sym} href={`/stock/${sym}`} className="px-4 py-2.5 rounded-xl glass border border-border text-sm text-gray-300 hover:text-white hover:border-brand-purple/40 text-center transition-all">
                  {sym}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Stock", "Qty", "Avg Buy", "LTP", "P&L", "Day", showHealth ? "AI Health" : "", showHealth ? "Target / Stop" : ""].filter(Boolean).map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-semibold px-4 py-3">{h}</th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {liveHoldings.map((h, i) => {
                  const health = healthMap[h.symbol];
                  const sc = STATUS_CONFIG[health?.status ?? "HOLD"];
                  return (
                    <motion.tr
                      key={h.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="border-b border-border/50 last:border-0 hover:bg-white/2 transition-colors"
                    >
                      {/* Stock */}
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-bold text-white">{h.symbol}</p>
                          <p className="text-xs text-gray-500">{h.sector}</p>
                        </div>
                      </td>
                      {/* Qty */}
                      <td className="px-4 py-4 text-sm font-num text-white">{h.quantity}</td>
                      {/* Avg Buy */}
                      <td className="px-4 py-4 text-sm font-num text-gray-300">{formatINR(h.avgBuyPrice)}</td>
                      {/* LTP */}
                      <td className="px-4 py-4 text-sm font-num text-white font-semibold">
                        {quotesReady ? formatINR(h.livePrice) : <div className="w-16 h-4 skeleton rounded" />}
                      </td>
                      {/* P&L */}
                      <td className="px-4 py-4">
                        {quotesReady ? (
                          <div className={h.livePnl >= 0 ? "text-market-bull" : "text-market-bear"}>
                            <p className="text-sm font-num font-semibold flex items-center gap-0.5">
                              {h.livePnl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              {formatINR(Math.abs(h.livePnl))}
                            </p>
                            <p className="text-xs font-num">{formatPercent(h.livePnlPct)}</p>
                          </div>
                        ) : <div className="w-20 h-8 skeleton rounded" />}
                      </td>
                      {/* Day change */}
                      <td className="px-4 py-4">
                        {quotesReady ? (
                          <span className={`text-xs font-num font-semibold ${h.liveDayChangePct >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                            {h.liveDayChangePct >= 0 ? "+" : ""}{h.liveDayChangePct.toFixed(2)}%
                          </span>
                        ) : <div className="w-12 h-4 skeleton rounded" />}
                      </td>
                      {/* AI Health */}
                      {showHealth && (
                        <td className="px-4 py-4">
                          {health ? (
                            <div>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${health.status === "SELL" ? "animate-pulse" : ""}`} />
                                {sc.label}
                              </span>
                              <p className="text-xs text-gray-500 mt-1 max-w-[140px] leading-tight">{health.reason.split(" — ")[0]}</p>
                            </div>
                          ) : <div className="w-16 h-8 skeleton rounded" />}
                        </td>
                      )}
                      {/* Target / Stop */}
                      {showHealth && (
                        <td className="px-4 py-4">
                          {health ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-market-bull" />
                                <span className="text-xs font-num text-market-bull">{formatINR(health.target)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingDown className="w-3 h-3 text-market-bear" />
                                <span className="text-xs font-num text-market-bear">{formatINR(health.stopLoss)}</span>
                              </div>
                            </div>
                          ) : <div className="w-16 h-8 skeleton rounded" />}
                        </td>
                      )}
                      {/* View */}
                      <td className="px-4 py-4">
                        <Link href={`/stock/${h.symbol}`} className="text-xs text-brand-purple hover:text-brand-blue transition-colors">
                          View
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            {/* Health legend */}
            {showHealth && (
              <div className="px-4 py-3 border-t border-border/50 flex items-center gap-6 flex-wrap">
                <p className="text-xs text-gray-600 font-semibold">AI Health:</p>
                {(["SELL", "WATCH", "HOLD"] as const).map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <div key={s} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                      <span className="text-xs text-gray-600">
                        {s === "SELL" ? "— exit signal triggered" : s === "WATCH" ? "— monitor closely" : "— hold for target"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Trade History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-white">Trade History ({trades.length})</h2>
        </div>
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <p className="text-sm">No trades yet — buy your first stock to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {trades.slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${trade.type === "BUY" ? "bg-market-bull/15 text-market-bull" : "bg-market-bear/15 text-market-bear"}`}>
                    {trade.type}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{trade.symbol}</p>
                    <p className="text-xs text-gray-500">{trade.quantity} shares @ {formatINR(trade.price)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-num font-semibold text-white">{formatINR(trade.total)}</p>
                  <p className="text-xs text-gray-500">{trade.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
