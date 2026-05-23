"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { TrendingUp, TrendingDown, Briefcase, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { usePortfolioStore } from "@/lib/store/store";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { formatINR, formatPercent, getChangeColor } from "@/lib/utils";

const SECTOR_COLORS = ["#8B5CF6", "#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

const performanceData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  value: 95000 + Math.sin(i * 0.3) * 8000 + i * 450 + Math.random() * 3000,
}));

export default function PortfolioPage() {
  const { holdings, trades, stats } = usePortfolioStore();

  const sectorAlloc = holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.sector] = (acc[h.sector] ?? 0) + h.currentValue;
    return acc;
  }, {});
  const totalVal = Object.values(sectorAlloc).reduce((a, b) => a + b, 0);
  const pieData = Object.entries(sectorAlloc).map(([name, value]) => ({
    name, value, pct: ((value / totalVal) * 100).toFixed(1),
  }));

  const totalPnLPositive = stats.totalPnL >= 0;
  const dayPnLPositive = stats.dayPnL >= 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <p className="text-sm text-gray-400">Virtual holdings · ₹10L starting balance</p>
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
            value: formatINR(stats.currentValue),
            sub: `Invested: ${formatINR(stats.totalInvested)}`,
            bull: true, color: "text-white", big: true,
          },
          {
            label: "Total P&L",
            value: (totalPnLPositive ? "+" : "") + formatINR(stats.totalPnL),
            sub: formatPercent(stats.totalPnLPercent),
            bull: totalPnLPositive,
            color: totalPnLPositive ? "text-market-bull" : "text-market-bear",
            big: true,
          },
          {
            label: "Day's P&L",
            value: (dayPnLPositive ? "+" : "") + formatINR(stats.dayPnL),
            sub: formatPercent(stats.dayPnLPercent),
            bull: dayPnLPositive,
            color: dayPnLPositive ? "text-market-bull" : "text-market-bear",
            big: false,
          },
          {
            label: "Available Cash",
            value: formatINR(stats.cash),
            sub: `XIRR: ${stats.xirr}%`,
            bull: true, color: "text-brand-cyan", big: false,
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
        {/* Performance chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 glass rounded-2xl p-6"
        >
          <h2 className="text-sm font-bold text-white mb-5">Portfolio Performance (30 Days)</h2>
          <ClientOnly fallback={<div className="h-56 skeleton rounded-xl" />}>
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
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "12px" }}
                  formatter={(v: number) => [formatINR(v), "Portfolio Value"]}
                />
                <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#portfolioGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
          <div className="flex justify-center mb-4">
            <PieChart width={160} height={160}>
              <Pie data={pieData} cx={76} cy={76} innerRadius={45} outerRadius={76} dataKey="value" strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(v: number) => [formatINR(v)]} />
            </PieChart>
          </div>
          </ClientOnly>
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
          <h2 className="text-sm font-bold text-white">Holdings ({holdings.length})</h2>
        </div>
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
              {holdings.map((h, i) => (
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
                  <td className="px-5 py-4 text-sm font-num text-white font-semibold">{formatINR(h.currentPrice)}</td>
                  <td className="px-5 py-4 text-sm font-num text-gray-300">{formatINR(h.invested)}</td>
                  <td className="px-5 py-4 text-sm font-num text-white">{formatINR(h.currentValue)}</td>
                  <td className="px-5 py-4">
                    <div className={h.pnl >= 0 ? "text-market-bull" : "text-market-bear"}>
                      <p className="text-sm font-num font-semibold flex items-center gap-1">
                        {h.pnl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {formatINR(Math.abs(h.pnl))}
                      </p>
                      <p className="text-xs font-num">{formatPercent(h.pnlPercent)}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-num font-semibold ${h.dayChangePercent >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                      {h.dayChangePercent >= 0 ? "+" : ""}{h.dayChangePercent.toFixed(2)}%
                    </span>
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
        <div className="divide-y divide-border/50">
          {trades.slice(0, 8).map((trade) => (
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
      </motion.div>
    </div>
  );
}
