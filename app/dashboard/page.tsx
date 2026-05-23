"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Brain, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { STOCKS, INDICES, TOP_GAINERS, TOP_LOSERS, PORTFOLIO_STATS } from "@/lib/data/mockData";
import { useWatchlistStore } from "@/lib/store/store";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { formatINR, formatPercent } from "@/lib/utils";
import { generateIntraday } from "@/lib/utils";
import { LiveClock } from "@/components/shared/LiveClock";
import { useEffect, useState } from "react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const AI_RECS = [
  { symbol: "HDFC", name: "HDFC Bank", reason: "RSI breakout + strong Q3 NIM expansion. Institutions accumulating.", score: 91, sentiment: "Strongly Bullish", change: 1.81 },
  { symbol: "RELIANCE", name: "Reliance Industries", reason: "Above all EMAs. Jio subscriber growth beats estimates.", score: 87, sentiment: "Bullish", change: 1.61 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", reason: "AUM record + consumer demand recovery in NBFC space.", score: 82, sentiment: "Bullish", change: 1.90 },
  { symbol: "SBIN", name: "State Bank of India", reason: "Cheap valuation, credit growth momentum, RBI tailwind.", score: 79, sentiment: "Bullish", change: 2.09 },
];

const portfolioDonutData = [
  { name: "Energy", value: 28.5, color: "#8B5CF6" },
  { name: "Banking", value: 39.5, color: "#6366F1" },
  { name: "IT", value: 18.7, color: "#06B6D4" },
  { name: "NBFC", value: 20.5, color: "#10B981" },
];

// Simulated live prices — slight random drift every few seconds
function useSimPrice(base: number, volatility = 0.0008) {
  const [price, setPrice] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setPrice(p => parseFloat((p + (Math.random() - 0.5) * volatility * p).toFixed(2)));
    }, 2500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, [base, volatility]);
  return price;
}

export default function DashboardPage() {
  const { items: watchlist } = useWatchlistStore();
  const niftyChart = generateIntraday(22847.90);
  const sensexChart = generateIntraday(75623.57);

  // Live-simulated index values
  const niftyLive   = useSimPrice(22847.90, 0.0005);
  const sensexLive  = useSimPrice(75623.57, 0.0005);
  const niftyITLive = useSimPrice(38247.65, 0.0006);
  const niftyBKLive = useSimPrice(48923.40, 0.0005);

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <LiveClock />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg glass glass-hover text-sm text-gray-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>

      {/* Indices row */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {INDICES.map((index, i) => {
          const chartData = i === 0 ? niftyChart : i === 1 ? sensexChart : generateIntraday(index.value);
          const liveVal = i === 0 ? niftyLive : i === 1 ? sensexLive : i === 2 ? niftyITLive : niftyBKLive;
          const liveChange = parseFloat((liveVal - index.prevClose).toFixed(2));
          const livePct   = parseFloat(((liveChange / index.prevClose) * 100).toFixed(2));
          const bull = livePct >= 0;
          return (
            <motion.div key={index.name} variants={item} className="glass rounded-xl p-4 glass-hover">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400">{index.displayName}</p>
                <span className={`text-xs font-num font-bold px-2 py-0.5 rounded-full transition-colors ${bull ? "bg-market-bull/15 text-market-bull" : "bg-market-bear/15 text-market-bear"}`}>
                  {bull ? "+" : ""}{livePct.toFixed(2)}%
                </span>
              </div>
              <p className="text-xl font-black font-num text-white mb-1 tabular-nums">{liveVal.toLocaleString("en-IN")}</p>
              <div className="flex items-center gap-1 mb-3">
                {bull ? <TrendingUp className="w-3 h-3 text-market-bull" /> : <TrendingDown className="w-3 h-3 text-market-bear" />}
                <span className={`text-xs font-num ${bull ? "text-market-bull" : "text-market-bear"}`}>
                  {bull ? "+" : ""}{liveChange.toFixed(2)}
                </span>
              </div>
              <div className="h-12">
                <ClientOnly fallback={<div className="h-12 skeleton rounded" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={bull ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={bull ? "#10B981" : "#EF4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke={bull ? "#10B981" : "#EF4444"} strokeWidth={1.5} fill={`url(#grad-${i})`} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                </ClientOnly>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: AI Recommendations + Gainers/Losers */}
        <div className="xl:col-span-2 space-y-6">
          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-brand-purple" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">AI Recommendations</h2>
                  <p className="text-xs text-gray-500">Updated 2 min ago</p>
                </div>
              </div>
              <Link href="/assistant" className="text-xs text-brand-purple hover:text-brand-blue flex items-center gap-1 transition-colors">
                Ask AI <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {AI_RECS.map(({ symbol, name, reason, score, sentiment, change }) => (
                <Link
                  key={symbol}
                  href={`/stock/${symbol}`}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/3 hover:bg-white/6 border border-border/50 hover:border-brand-purple/20 transition-all group"
                >
                  {/* AI Score */}
                  <div className="flex-shrink-0 text-center">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-purple/30 to-brand-blue/30 flex items-center justify-center border border-brand-purple/20">
                      <span className="text-sm font-black text-brand-purple">{score}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">AI</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{symbol}</span>
                      <span className="text-xs text-gray-500">{name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{reason}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-semibold text-market-bull">+{change.toFixed(2)}%</p>
                    <p className="text-xs text-market-bull/60">{sentiment}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-purple transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Gainers & Losers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Gainers */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-market-bull" />
                <h2 className="text-sm font-bold text-white">Top Gainers</h2>
              </div>
              <div className="space-y-2">
                {TOP_GAINERS.map(({ symbol, name, price, changePercent }) => (
                  <Link
                    key={symbol}
                    href={`/stock/${symbol}`}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:opacity-80 transition-opacity"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{symbol}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[120px]">{name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-num font-semibold text-white">₹{price.toLocaleString("en-IN")}</p>
                      <p className="text-xs font-num font-semibold text-market-bull">+{changePercent.toFixed(2)}%</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Top Losers */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-market-bear" />
                <h2 className="text-sm font-bold text-white">Top Losers</h2>
              </div>
              <div className="space-y-2">
                {TOP_LOSERS.map(({ symbol, name, price, changePercent }) => (
                  <Link
                    key={symbol}
                    href={`/stock/${symbol}`}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:opacity-80 transition-opacity"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{symbol}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[120px]">{name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-num font-semibold text-white">₹{price.toLocaleString("en-IN")}</p>
                      <p className="text-xs font-num font-semibold text-market-bear">{changePercent.toFixed(2)}%</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right: Portfolio + Watchlist */}
        <div className="space-y-6">
          {/* Portfolio summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Portfolio</h2>
              <Link href="/portfolio" className="text-xs text-brand-purple hover:text-brand-blue flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-4">
              {/* Donut */}
              <div className="w-24 h-24 flex-shrink-0">
                <ClientOnly fallback={<div className="w-24 h-24 skeleton rounded-full" />}>
                  <PieChart width={96} height={96}>
                    <Pie data={portfolioDonutData} cx={44} cy={44} innerRadius={28} outerRadius={44} dataKey="value" strokeWidth={0}>
                      {portfolioDonutData.map(({ color }, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                  </PieChart>
                </ClientOnly>
              </div>
              <div>
                <p className="text-2xl font-black font-num text-white">
                  {formatINR(PORTFOLIO_STATS.currentValue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5 text-market-bull" />
                  <span className="text-sm font-semibold text-market-bull">
                    +{formatPercent(PORTFOLIO_STATS.totalPnLPercent)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Invested: {formatINR(PORTFOLIO_STATS.totalInvested)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div className="bg-market-bull/8 rounded-lg p-3">
                <p className="text-xs text-gray-500">Day P&L</p>
                <p className="text-sm font-bold font-num text-market-bull">+{formatINR(PORTFOLIO_STATS.dayPnL)}</p>
              </div>
              <div className="bg-brand-purple/8 rounded-lg p-3">
                <p className="text-xs text-gray-500">XIRR</p>
                <p className="text-sm font-bold font-num text-brand-purple">{PORTFOLIO_STATS.xirr}%</p>
              </div>
            </div>
          </motion.div>

          {/* Watchlist */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Watchlist</h2>
              <span className="text-xs text-gray-500">{watchlist.length} stocks</span>
            </div>
            <div className="space-y-1">
              {watchlist.map(({ symbol, name, price, changePercent, aiScore }) => (
                <Link
                  key={symbol}
                  href={`/stock/${symbol}`}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-purple/30 to-brand-blue/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-brand-purple">{symbol[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">{symbol}</p>
                    <p className="text-xs text-gray-600 truncate">{name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-num font-semibold text-white">₹{price.toLocaleString("en-IN")}</p>
                    <p className={`text-xs font-num ${changePercent >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                      {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
