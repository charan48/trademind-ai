"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { STOCKS, INDICES } from "@/lib/data/mockData";
import { generateIntraday } from "@/lib/utils";
import { ClientOnly } from "@/components/shared/ClientOnly";

const miniChartData = generateIntraday(22847);

export function MarketPreview() {
  return (
    <section className="py-24 px-6 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-radial from-brand-purple/5 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 mb-4">
            Live Market Data
          </span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Markets at a{" "}
            <span className="gradient-text">Glance</span>
          </h2>
          <p className="text-gray-400 text-lg">Real-time NSE & BSE data with AI-powered insights</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main NIFTY chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">NIFTY 50</p>
                <p className="text-4xl font-black font-num text-white">22,847.90</p>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-market-bull" />
                  <span className="text-market-bull font-semibold font-num">+187.45 (+0.83%)</span>
                  <span className="text-xs text-gray-500">Today</span>
                </div>
              </div>
              <div className="flex gap-2">
                {["1D","1W","1M","3M"].map((t) => (
                  <button key={t} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${t === "1D" ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <ClientOnly fallback={<div className="h-48 skeleton rounded-xl" />}>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={miniChartData}>
                  <defs>
                    <linearGradient id="niftyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#niftyGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#10B981" }}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    labelStyle={{ color: "#9CA3AF" }}
                    formatter={(v: number) => [v.toLocaleString("en-IN"), "NIFTY"]}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            </ClientOnly>
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              {[
                { label: "Open", value: "22,712" },
                { label: "High", value: "22,915" },
                { label: "Low", value: "22,680" },
                { label: "Prev Close", value: "22,660" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold font-num text-white">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Index cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {INDICES.slice(1).map((index, i) => (
              <div key={index.name} className="glass rounded-xl p-4 glass-hover">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-300">{index.displayName}</p>
                  <span className={`text-xs font-num font-semibold px-2 py-0.5 rounded-full ${index.changePercent >= 0 ? "bg-market-bull/15 text-market-bull" : "bg-market-bear/15 text-market-bear"}`}>
                    {index.changePercent >= 0 ? "+" : ""}{index.changePercent.toFixed(2)}%
                  </span>
                </div>
                <p className="text-2xl font-black font-num text-white">{index.value.toLocaleString("en-IN")}</p>
                <div className="flex items-center gap-1 mt-1">
                  {index.changePercent >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-market-bull" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-market-bear" />
                  )}
                  <span className={`text-xs font-num ${index.changePercent >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                    {index.changePercent >= 0 ? "+" : ""}{index.change.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Top stock preview */}
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">Top Movers Today</p>
              {STOCKS.slice(0, 3).map((s) => (
                <div key={s.symbol} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{s.symbol}</p>
                    <p className="text-xs text-gray-500">{s.sector}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-num font-semibold text-white">₹{s.price.toLocaleString("en-IN")}</p>
                    <p className={`text-xs font-num ${s.changePercent >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                      {s.changePercent >= 0 ? "+" : ""}{s.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass neon-border text-white font-semibold hover:bg-white/8 transition-all"
          >
            Explore Full Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
