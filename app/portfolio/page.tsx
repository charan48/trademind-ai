"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { TrendingUp, TrendingDown, Briefcase, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { usePortfolioStore, useLiveMarketStore } from "@/lib/store/store";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { formatINR, formatPercent, getChangeColor } from "@/lib/utils";

const SECTOR_COLORS = ["#8B5CF6", "#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

export default function PortfolioPage() {
  const { holdings, trades, stats } = usePortfolioStore();
  const { quotes, isLoading: quotesLoading } = useLiveMarketStore();

  // ── Compute live values from real market prices ──────────────────────────
  const liveHoldings = holdings.map((h) => {
    const lq = quotes[h.symbol];
    const livePrice        = lq?.price         ?? h.currentPrice;
    const liveCurrentValue = livePrice * h.quantity;
    const livePnl          = (livePrice - h.avgBuyPrice) * h.quantity;
    const livePnlPct       = h.avgBuyPrice > 0 ? ((livePrice - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0;
    const liveDayChangePct = lq?.changePercent ?? h.dayChangePercent;
    return { ...h, currentPrice: livePrice, currentValue: liveCurrentValue, pnl: livePnl, pnlPercent: livePnlPct, dayChangePercent: liveDayChangePct };
  });

  const liveTotalValue  = liveHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const liveTotalInvested = liveHoldings.reduce((sum, h) => sum + h.avgBuyPrice * h.quantity, 0);
  const liveTotalPnL    = liveTotalValue - liveTotalInvested;
  const liveTotalPnLPct = liveTotalInvested > 0 ? (liveTotalPnL / liveTotalInvested) * 100 : 0;
  const liveDayPnL      = liveHoldings.reduce((sum, h) => sum + (h.dayChangePercent / 100) * h.currentValue, 0);
  const livePortfolioValue = liveTotalValue + stats.cash;
  const liveDayPnLPct   = livePortfolioValue > 0 ? (liveDayPnL / (livePortfolioValue - liveDayPnL)) * 100 : 0;

  // ── Sector allocation from live values ────────────────────────────────────
  const sectorAlloc = liveHoldings.reduce<Record<string, number>>((acc, h) => {
    acc[h.sector] = (acc[h.sector] ?? 0) + h.currentValue;
    return acc;
  }, {});
  const totalSectorVal = Object.values(sectorAlloc).reduce((a, b) => a + b, 0);
  const pieData = Object.entries(sectorAlloc).map(([name, value]) => ({
    name, value, pct: totalSectorVal > 0 ? ((value / totalSectorVal) * 100).toFixed(1) : "0.0",
  }));

  // ── Portfolio performance chart from trade history + live final point ─────
  const performanceData = (() => {
    if (trades.length === 0) return [];
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    // Accumulate cost basis per date
    const byDate: Record<string, number> = {};
    let runningValue = stats.cash;
    for (const t of sorted) {
      runningValue += t.type === "BUY" ? t.total : -t.total;
      byDate[t.date] = runningValue;
    }
    const datePoints = Object.entries(byDate).map(([date, val]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      value: Math.round(val),
    }));
    // Append today's live value as final point
    const todayLabel = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (datePoints.at(-1)?.date !== todayLabel) {
      datePoints.push({ date: todayLabel, value: Math.round(livePortfolioValue) });
    } else {
      datePoints[datePoints.length - 1].value = Math.round(livePortfolioValue);
    }
    return datePoints;
  })();

  const totalPnLPositive = liveTotalPnL >= 0;
  const dayPnLPositive   = liveDayPnL >= 0;
  const quotesReady      = Object.keys(quotes).length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <p className="text-sm text-gray-400">
          Virtual holdings · Live NSE prices
          {quotesLoading && <span className="ml-2 text-brand-purple animate-pulse">Updating…</span>}
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Portfolio Value",
            value: quotesReady ? formatINR(livePortfolioValue) : <div className="h-8 w-28 skeleton rounded" />,
            sub: `Invested: ${formatINR(liveTotalInvested)}`,
            color: "text-white", big: true,
          },
          {
            label: "Total P&L",
            value: quotesReady
              ? (totalPnLPositive ? "+" : "") + formatINR(liveTotalPnL)
              : <div className="h-8 w-24 skeleton rounded" />,
            sub: quotesReady ? formatPercent(liveTotalPnLPct) : "",
            color: totalPnLPositive ? "text-market-bull" : "text-market-bear",
            big: true,
          },
          {
            label: "Day's P&L",
            value: quotesReady
              ? (dayPnLPositive ? "+" : "") + formatINR(liveDayPnL)
              : <div className="h-7 w-20 skeleton rounded" />,
            sub: quotesReady ? formatPercent(liveDayPnLPct) : "",
            color: dayPnLPositive ? "text-market-bull" : "text-market-bear",
            big: false,
          },
          {
            label: "Available Cash",
            value: formatINR(stats.cash),
            sub: `XIRR: ${stats.xirr}%`,
            color: "text-brand-cyan", big: false,
          },
        ].map(({ label, value, sub, color, big }) => (
          <div key={label} className="glass rounded-2xl p-5">
            <p className="text-xs text-gray-400 mb-2 font-semibold">{label}</p>
            <p className={`${big ? "text-2xl" : "text-xl"} font-black font-num ${color}`}>{value}</p>
            <p className={`text-xs font-num mt-1 ${color === "text-white" ? "text-gray-400" : color}`}>{sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Charts + holdings */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Performance chart — trade history + live endpoint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 glass rounded-2xl p-6"
        >
          <h2 className="text-sm font-bold text-white mb-5">Portfolio Value History</h2>
          <ClientOnly fallback={<div className="h-56 skeleton rounded-xl" />}>
            {performanceData.length < 2 ? (
              <div className="h-56 flex items-center justify-center text-gray-500 text-sm">
                Make your first trade to see performance chart
              </div>
            ) : (
              <div className="h-56">
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
                    <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "12px" }}
                      formatter={(v: number) => [formatINR(v), "Portfolio Value"]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#portfolioGrad)" dot={{ fill: "#8B5CF6", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ClientOnly>
        </motion.div>

        {/* Allocation pie */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-6"
        >
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
                    <Tooltip contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "11px" }}
                      formatter={(v: number) => [formatINR(v)]} />
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

      {/* Holdings table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-bold text-white">Holdings ({liveHoldings.length})</h2>
        </div>
        {liveHoldings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Briefcase className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No holdings yet — buy stocks from any stock page</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Stock", "Qty", "Avg Buy", "LTP", "Invested", "Current", "P&L", "Day Change", ""].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-semibold px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveHoldings.map((h, i) => (
                  <motion.tr
                    key={h.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="border-b border-border/50 last:border-0 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-bold text-white">{h.symbol}</p>
                        <p className="text-xs text-gray-500">{h.sector}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-num text-white">{h.quantity}</td>
                    <td className="px-5 py-4 text-sm font-num text-gray-300">{formatINR(h.avgBuyPrice)}</td>
                    <td className="px-5 py-4 text-sm font-num text-white font-semibold">
                      {quotesReady ? formatINR(h.currentPrice) : <div className="w-16 h-4 skeleton rounded" />}
                    </td>
                    <td className="px-5 py-4 text-sm font-num text-gray-300">{formatINR(h.avgBuyPrice * h.quantity)}</td>
                    <td className="px-5 py-4 text-sm font-num text-white">
                      {quotesReady ? formatINR(h.currentValue) : <div className="w-16 h-4 skeleton rounded" />}
                    </td>
                    <td className="px-5 py-4">
                      {quotesReady ? (
                        <div className={h.pnl >= 0 ? "text-market-bull" : "text-market-bear"}>
                          <p className="text-sm font-num font-semibold flex items-center gap-1">
                            {h.pnl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {formatINR(Math.abs(h.pnl))}
                          </p>
                          <p className="text-xs font-num">{formatPercent(h.pnlPercent)}</p>
                        </div>
                      ) : <div className="w-20 h-8 skeleton rounded" />}
                    </td>
                    <td className="px-5 py-4">
                      {quotesReady ? (
                        <span className={`text-xs font-num font-semibold ${h.dayChangePercent >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                          {h.dayChangePercent >= 0 ? "+" : ""}{h.dayChangePercent.toFixed(2)}%
                        </span>
                      ) : <div className="w-12 h-4 skeleton rounded" />}
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/stock/${h.symbol}`} className="text-xs text-brand-purple hover:text-brand-blue transition-colors">
                        View
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Trade History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-white">Trade History</h2>
        </div>
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <p className="text-sm">No trades yet</p>
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
