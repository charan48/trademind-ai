"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Plus, Minus, Brain,
  ArrowLeft, BarChart2, Star, StarOff, ExternalLink
} from "lucide-react";
import { ClientOnly } from "@/components/shared/ClientOnly";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar
} from "recharts";
import { STOCKS } from "@/lib/data/mockData";
import { usePortfolioStore, useWatchlistStore } from "@/lib/store/store";
import { formatINR, formatPercent, getAIScoreColor, getSentimentColor, generateChartData } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const TABS = ["Overview", "Chart", "AI Analysis", "News", "Technicals"];

export default function StockPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const stock = STOCKS.find((s) => s.symbol === symbol) ?? STOCKS[0];
  const [tab, setTab] = useState("Overview");
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState(1);
  const [period, setPeriod] = useState("3M");

  const { buyStock, sellStock } = usePortfolioStore();
  const { hasItem, addItem, removeItem } = useWatchlistStore();
  const watched = hasItem(stock.symbol);

  const bull = stock.changePercent >= 0;
  const scoreColor = getAIScoreColor(stock.aiScore);

  const chartData = stock.chartData.slice(period === "1M" ? -30 : period === "1W" ? -7 : period === "6M" ? -90 : -90);

  const handleTrade = () => {
    const total = formatINR(stock.price * qty);
    if (tradeType === "BUY") {
      buyStock(stock.symbol, stock.name, stock.sector, qty, stock.price);
      toast.success(`Bought ${qty} × ${stock.symbol}`, {
        description: `${total} deducted from virtual cash`,
        duration: 4000,
      });
    } else {
      const holding = usePortfolioStore.getState().holdings.find(h => h.symbol === stock.symbol);
      if (!holding) {
        toast.error(`No ${stock.symbol} in portfolio`, {
          description: "Buy this stock first before selling",
        });
        return;
      }
      if (holding.quantity < qty) {
        toast.error(`Only ${holding.quantity} shares available`, {
          description: `You tried to sell ${qty} but hold only ${holding.quantity}`,
        });
        return;
      }
      sellStock(stock.symbol, qty, stock.price);
      toast.success(`Sold ${qty} × ${stock.symbol}`, {
        description: `${total} added to virtual cash`,
        duration: 4000,
      });
    }
  };

  const toggleWatch = () => {
    if (watched) {
      removeItem(stock.symbol);
      toast(`${stock.symbol} removed from watchlist`);
    } else {
      addItem({
        symbol: stock.symbol, name: stock.name,
        price: stock.price, change: stock.change,
        changePercent: stock.changePercent,
        aiScore: stock.aiScore, sector: stock.sector,
      });
      toast.success(`${stock.symbol} added to watchlist`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Stock header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-purple/30 to-brand-blue/30 border border-brand-purple/20 flex items-center justify-center">
                <span className="text-lg font-black text-white">{stock.symbol[0]}</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">{stock.symbol}</h1>
                <p className="text-sm text-gray-400">{stock.name} · {stock.exchange}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                {stock.sector}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-4xl font-black font-num text-white">
                {formatINR(stock.price)}
              </span>
              <div className={`flex items-center gap-1 ${bull ? "text-market-bull" : "text-market-bear"}`}>
                {bull ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span className="text-lg font-bold font-num">
                  {bull ? "+" : ""}{formatINR(stock.change)} ({formatPercent(stock.changePercent)})
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Today · NSE · As of 14:32 IST</p>
          </div>

          {/* AI Score + Actions */}
          <div className="flex items-center gap-4">
            {/* AI Score */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center" style={{ borderColor: scoreColor + "60", background: scoreColor + "15" }}>
                <div>
                  <p className="text-xl font-black" style={{ color: scoreColor }}>{stock.aiScore}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-semibold">AI Score</p>
              <p className={`text-xs font-semibold ${getSentimentColor(stock.sentiment)}`}>{stock.sentiment}</p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={toggleWatch}
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-border hover:border-brand-purple/40 text-sm text-gray-300 hover:text-white transition-all"
              >
                {watched ? <StarOff className="w-4 h-4 text-brand-purple" /> : <Star className="w-4 h-4" />}
                {watched ? "Watching" : "Watchlist"}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-border text-sm text-gray-400 hover:text-white transition-all">
                <ExternalLink className="w-4 h-4" />
                NSE Page
              </button>
            </div>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-6 pt-6 border-t border-border">
          {[
            { label: "Open", value: formatINR(stock.open) },
            { label: "Day High", value: formatINR(stock.dayHigh) },
            { label: "Day Low", value: formatINR(stock.dayLow) },
            { label: "52W High", value: formatINR(stock.high52w) },
            { label: "52W Low", value: formatINR(stock.low52w) },
            { label: "Volume", value: (stock.volume / 100000).toFixed(1) + "L" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-sm font-semibold font-num text-white">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: chart + tabs */}
        <div className="xl:col-span-2 space-y-5">
          {/* Tabs */}
          <div className="flex gap-1 bg-white/3 rounded-xl p-1 w-fit">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-brand-purple/20 text-brand-purple" : "text-gray-400 hover:text-white"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Overview" || tab === "Chart" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5">
              {/* Period selector */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white">Price Chart</h2>
                <div className="flex gap-1">
                  {["1W", "1M", "3M", "6M"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? "bg-brand-purple/20 text-brand-purple" : "text-gray-500 hover:text-white"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area chart */}
              <ClientOnly fallback={<div className="h-64 skeleton rounded-xl" />}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={bull ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={bull ? "#10B981" : "#EF4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(v) => `₹${(v/1).toLocaleString("en-IN")}`} width={70} />
                    <Tooltip
                      contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: "12px" }}
                      formatter={(v: number) => [formatINR(v), "Close"]}
                      labelFormatter={(l) => `Date: ${l}`}
                    />
                    <Area type="monotone" dataKey="close" stroke={bull ? "#10B981" : "#EF4444"} strokeWidth={2} fill="url(#stockGrad)" dot={false} activeDot={{ r: 5, fill: bull ? "#10B981" : "#EF4444" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              </ClientOnly>

              {/* Volume */}
              <ClientOnly fallback={<div className="h-20 mt-2 skeleton rounded" />}>
              <div className="h-20 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(-20)} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <Bar dataKey="volume" fill="rgba(139,92,246,0.3)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              </ClientOnly>
              <p className="text-xs text-gray-600 text-center">Volume</p>
            </motion.div>
          ) : null}

          {tab === "AI Analysis" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-5 h-5 text-brand-purple" />
                <h2 className="text-base font-bold text-white">TradeMind AI Analysis</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getSentimentColor(stock.sentiment)} bg-current/10 border border-current/20`}>
                  {stock.sentiment}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-brand-purple/5 border border-brand-purple/15">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <strong className="text-white">{stock.name}</strong> is showing a{" "}
                  <strong className={getSentimentColor(stock.sentiment)}>{stock.sentiment.toLowerCase()}</strong> trend.
                  Price is trading above its 20-day EMA (₹{stock.ema20.toLocaleString("en-IN")}),
                  50-day EMA (₹{stock.ema50.toLocaleString("en-IN")}), and {stock.price > stock.ema200 ? "above" : "below"} the 200-day EMA (₹{stock.ema200.toLocaleString("en-IN")}).
                  RSI at <strong className="text-white">{stock.rsi}</strong> suggests {stock.rsi > 70 ? "overbought" : stock.rsi < 30 ? "oversold" : "neutral"} momentum.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "RSI (14)", value: stock.rsi.toFixed(1), status: stock.rsi > 70 ? "Overbought" : stock.rsi < 30 ? "Oversold" : "Neutral" },
                  { label: "MACD", value: stock.macd.toFixed(2), status: stock.macd > stock.macdSignal ? "Bullish" : "Bearish" },
                  { label: "EMA 20", value: `₹${stock.ema20.toLocaleString("en-IN")}`, status: stock.price > stock.ema20 ? "Above" : "Below" },
                  { label: "EMA 50", value: `₹${stock.ema50.toLocaleString("en-IN")}`, status: stock.price > stock.ema50 ? "Above" : "Below" },
                ].map(({ label, value, status }) => (
                  <div key={label} className="p-3 rounded-xl bg-white/3 border border-border/50">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-bold font-num text-white mt-0.5">{value}</p>
                    <p className={`text-xs font-semibold mt-1 ${status.includes("Bull") || status === "Above" ? "text-market-bull" : status.includes("Bear") || status === "Below" ? "text-market-bear" : "text-yellow-400"}`}>
                      {status}
                    </p>
                  </div>
                ))}
              </div>

              {/* Signals summary */}
              <div className="p-4 rounded-xl bg-white/3 border border-border">
                <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">Signal Summary</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-black text-market-bull">{stock.technicals.buySignals}</p>
                    <p className="text-xs text-gray-500">Buy Signals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-yellow-400">{stock.technicals.neutralSignals}</p>
                    <p className="text-xs text-gray-500">Neutral</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-market-bear">{stock.technicals.sellSignals}</p>
                    <p className="text-xs text-gray-500">Sell Signals</p>
                  </div>
                </div>
              </div>

              {/* Support/Resistance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-market-bull/8 border border-market-bull/20">
                  <p className="text-xs text-market-bull/70">Key Support</p>
                  <p className="text-lg font-black font-num text-market-bull">₹{stock.technicals.support.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-3 rounded-xl bg-market-bear/8 border border-market-bear/20">
                  <p className="text-xs text-market-bear/70">Key Resistance</p>
                  <p className="text-lg font-black font-num text-market-bear">₹{stock.technicals.resistance.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "News" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white mb-4">Latest News</h2>
              {stock.news.map((n) => (
                <div key={n.id} className="p-4 rounded-xl bg-white/3 border border-border hover:border-brand-purple/20 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white leading-snug mb-2">{n.title}</p>
                      <p className="text-xs text-gray-400 mb-3">{n.summary}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{n.source}</span>
                        <span className="text-xs text-gray-600">·</span>
                        <span className="text-xs text-gray-500">{n.time}</span>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                      n.sentiment === "positive" ? "bg-market-bull/15 text-market-bull" :
                      n.sentiment === "negative" ? "bg-market-bear/15 text-market-bear" :
                      "bg-yellow-400/15 text-yellow-400"
                    }`}>
                      {n.sentiment}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {tab === "Technicals" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-4">Technical Indicators</h2>
              <div className="space-y-3">
                {[
                  { name: "RSI (14)", value: stock.rsi, type: "range", min: 0, max: 100, bull: stock.rsi < 70 && stock.rsi > 30 },
                  { name: "P/E Ratio", value: stock.pe, type: "text", display: stock.pe.toFixed(1), bull: stock.pe < 35 },
                  { name: "EPS (₹)", value: stock.eps, type: "text", display: stock.eps.toFixed(2), bull: true },
                  { name: "Market Cap", value: 0, type: "text", display: stock.marketCap, bull: true },
                  { name: "52W High", value: 0, type: "text", display: formatINR(stock.high52w), bull: true },
                  { name: "52W Low", value: 0, type: "text", display: formatINR(stock.low52w), bull: true },
                ].map(({ name, value, type, min, max, bull, display }) => (
                  <div key={name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-gray-400">{name}</span>
                    <div className="flex items-center gap-3">
                      {type === "range" && (
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${bull ? "bg-market-bull" : "bg-market-bear"}`} style={{ width: `${(value / (max ?? 100)) * 100}%` }} />
                        </div>
                      )}
                      <span className={`text-sm font-num font-semibold ${bull ? "text-white" : "text-market-bear"}`}>
                        {display ?? value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Trade panel + About */}
        <div className="space-y-5">
          {/* Trade panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-5"
          >
            <h2 className="text-sm font-bold text-white mb-4">Virtual Trade</h2>

            {/* Buy/Sell toggle */}
            <div className="flex rounded-xl bg-white/5 p-1 mb-4">
              {(["BUY", "SELL"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTradeType(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    tradeType === t
                      ? t === "BUY"
                        ? "bg-market-bull text-white"
                        : "bg-market-bear text-white"
                      : "text-gray-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Price */}
            <div className="p-3 rounded-xl bg-white/3 border border-border mb-4">
              <p className="text-xs text-gray-500 mb-1">Market Price</p>
              <p className="text-xl font-black font-num text-white">{formatINR(stock.price)}</p>
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                >
                  <Minus className="w-4 h-4 text-white" />
                </button>
                <input
                  type="number"
                  value={qty}
                  min={1}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center bg-white/5 border border-border rounded-lg py-2 text-white font-num font-bold text-lg outline-none focus:border-brand-purple/50"
                />
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="p-3 rounded-xl bg-brand-purple/8 border border-brand-purple/20 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total Amount</span>
                <span className="text-lg font-black font-num gradient-text">{formatINR(stock.price * qty)}</span>
              </div>
            </div>

            <button
              onClick={handleTrade}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] ${
                tradeType === "BUY"
                  ? "bg-gradient-to-r from-market-bull to-emerald-600 shadow-glow-green"
                  : "bg-gradient-to-r from-market-bear to-red-600 shadow-glow-red"
              }`}
            >
              {tradeType === "BUY" ? "Buy" : "Sell"} {stock.symbol}
            </button>

            <p className="text-xs text-gray-600 text-center mt-3">
              Virtual trading · No real money involved
            </p>
          </motion.div>

          {/* Company about */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5"
          >
            <h2 className="text-sm font-bold text-white mb-3">About</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{stock.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Sector</p>
                <p className="text-sm font-semibold text-white">{stock.sector}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Industry</p>
                <p className="text-sm font-semibold text-white">{stock.industry}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Market Cap</p>
                <p className="text-sm font-semibold font-num text-white">{stock.marketCap}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">P/E Ratio</p>
                <p className="text-sm font-semibold font-num text-white">{stock.pe.toFixed(1)}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
