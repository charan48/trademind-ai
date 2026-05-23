"use client";

import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Plus, Minus, Brain,
  ArrowLeft, BarChart2, Star, StarOff, ExternalLink, RefreshCw
} from "lucide-react";
import { ClientOnly } from "@/components/shared/ClientOnly";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar
} from "recharts";
import { STOCKS } from "@/lib/data/mockData";
import { usePortfolioStore, useWatchlistStore, useLiveMarketStore } from "@/lib/store/store";
import { formatINR, formatPercent, getAIScoreColor, getSentimentColor } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const TABS = ["Overview", "Chart", "AI Analysis", "News", "Technicals"];

interface ChartPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

function computeSignalCounts(
  price: number, rsi: number, macd: number, macdSig: number,
  ema20: number, ema50: number, support: number, resistance: number
) {
  let buy = 0, sell = 0;
  if (rsi < 40) buy++; else if (rsi > 70) sell++;
  if (macd > macdSig) buy++; else sell++;
  if (ema20 > 0 && price > ema20) buy++; else if (ema20 > 0) sell++;
  if (ema20 > 0 && ema50 > 0 && ema20 > ema50) buy++; else sell++;
  if (support > 0 && (price - support) / support < 0.03) buy++;
  if (resistance > 0 && (resistance - price) / resistance < 0.02) sell++;
  return { buySignals: buy, sellSignals: sell, neutralSignals: Math.max(0, 7 - buy - sell) };
}

export default function StockPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const stock = STOCKS.find((s) => s.symbol === symbol) ?? STOCKS[0];
  const [tab, setTab] = useState("Overview");
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState(1);
  const [period, setPeriod] = useState("3M");
  const [liveChartData, setLiveChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const { buyStock, sellStock } = usePortfolioStore();
  const { hasItem, addItem, removeItem } = useWatchlistStore();
  const { quotes, technicals } = useLiveMarketStore();
  const watched = hasItem(stock.symbol);

  // Live price data
  const lq = quotes[symbol] ?? quotes[stock.symbol];
  const lt = technicals[symbol] ?? technicals[stock.symbol];

  const livePrice         = lq?.price         ?? stock.price;
  const liveChange        = lq?.change        ?? stock.change;
  const liveChangePercent = lq?.changePercent ?? stock.changePercent;
  const liveOpen          = lq?.open          ?? stock.open;
  const liveDayHigh       = lq?.dayHigh       ?? stock.dayHigh;
  const liveDayLow        = lq?.dayLow        ?? stock.dayLow;
  const liveHigh52w       = lq?.high52w       ?? stock.high52w;
  const liveLow52w        = lq?.low52w        ?? stock.low52w;
  const liveVolume        = lq?.volume        ?? stock.volume;

  const rsi        = lt?.rsi        ?? stock.rsi;
  const macd       = lt?.macd       ?? stock.macd;
  const macdSignal = lt?.macdSignal ?? stock.macdSignal;
  const ema20      = lt?.ema20      ?? stock.ema20;
  const ema50      = lt?.ema50      ?? stock.ema50;
  const ema200     = lt?.ema200     ?? stock.ema200;
  const support    = lt?.support    ?? stock.technicals.support;
  const resistance = lt?.resistance ?? stock.technicals.resistance;
  const trend      = lt?.trend      ?? "Sideways";

  const signals = lt
    ? computeSignalCounts(livePrice, rsi, macd, macdSignal, ema20, ema50, support, resistance)
    : { buySignals: stock.technicals.buySignals, sellSignals: stock.technicals.sellSignals, neutralSignals: stock.technicals.neutralSignals };

  const bull       = liveChangePercent >= 0;
  const scoreColor = getAIScoreColor(stock.aiScore);

  // Fetch live chart data
  useEffect(() => {
    setChartLoading(true);
    fetch(`/api/market/chart/${symbol}?range=6mo`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.chartData?.length) {
          setLiveChartData(
            d.chartData.map((p: { date: string; price: number; open?: number; high?: number; low?: number; volume?: number }) => ({
              date: p.date,
              close: p.price,
              open: p.open,
              high: p.high,
              low: p.low,
              volume: p.volume,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [symbol]);

  const baseChartData = liveChartData.length > 0
    ? liveChartData
    : (stock.chartData as unknown as ChartPoint[]);

  const chartData = baseChartData.slice(
    period === "1W" ? -7 : period === "1M" ? -22 : period === "6M" ? -126 : -63
  );

  const handleTrade = () => {
    const total = formatINR(livePrice * qty);
    if (tradeType === "BUY") {
      buyStock(stock.symbol, stock.name, stock.sector, qty, livePrice);
      toast.success(`Bought ${qty} × ${stock.symbol}`, {
        description: `${total} deducted from virtual cash`,
        duration: 4000,
      });
    } else {
      const holding = usePortfolioStore.getState().holdings.find(h => h.symbol === stock.symbol);
      if (!holding) {
        toast.error(`No ${stock.symbol} in portfolio`, { description: "Buy this stock first before selling" });
        return;
      }
      if (holding.quantity < qty) {
        toast.error(`Only ${holding.quantity} shares available`, { description: `You tried to sell ${qty} but hold only ${holding.quantity}` });
        return;
      }
      sellStock(stock.symbol, qty, livePrice);
      toast.success(`Sold ${qty} × ${stock.symbol}`, { description: `${total} added to virtual cash`, duration: 4000 });
    }
  };

  const toggleWatch = () => {
    if (watched) {
      removeItem(stock.symbol);
      toast(`${stock.symbol} removed from watchlist`);
    } else {
      addItem({
        symbol: stock.symbol, name: stock.name,
        price: livePrice, change: liveChange,
        changePercent: liveChangePercent,
        aiScore: stock.aiScore, sector: stock.sector,
      });
      toast.success(`${stock.symbol} added to watchlist`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Stock header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
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
              {lq && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-market-bull/10 text-market-bull border border-market-bull/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-market-bull rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-4xl font-black font-num text-white">{formatINR(livePrice)}</span>
              <div className={`flex items-center gap-1 ${bull ? "text-market-bull" : "text-market-bear"}`}>
                {bull ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span className="text-lg font-bold font-num">
                  {bull ? "+" : ""}{formatINR(liveChange)} ({formatPercent(liveChangePercent)})
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {lq ? "Live NSE · Yahoo Finance" : "Today · NSE · Mock data"} · As of {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center" style={{ borderColor: scoreColor + "60", background: scoreColor + "15" }}>
                <p className="text-xl font-black" style={{ color: scoreColor }}>{stock.aiScore}</p>
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

        {/* Key stats — live */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-6 pt-6 border-t border-border">
          {[
            { label: "Open",     value: formatINR(liveOpen) },
            { label: "Day High", value: formatINR(liveDayHigh) },
            { label: "Day Low",  value: formatINR(liveDayLow) },
            { label: "52W High", value: formatINR(liveHigh52w) },
            { label: "52W Low",  value: formatINR(liveLow52w) },
            { label: "Volume",   value: liveVolume > 0 ? (liveVolume / 100000).toFixed(1) + "L" : "—" },
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

          {(tab === "Overview" || tab === "Chart") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Price Chart</h2>
                  {chartLoading && <RefreshCw className="w-3 h-3 text-gray-500 animate-spin" />}
                  {!chartLoading && liveChartData.length > 0 && (
                    <span className="text-xs text-market-bull font-semibold">Live</span>
                  )}
                </div>
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
                        formatter={(v: number) => [formatINR(v), "Price"]}
                        labelFormatter={(l) => `Date: ${l}`}
                      />
                      <Area type="monotone" dataKey="close" stroke={bull ? "#10B981" : "#EF4444"} strokeWidth={2} fill="url(#stockGrad)" dot={false} activeDot={{ r: 5, fill: bull ? "#10B981" : "#EF4444" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ClientOnly>

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
          )}

          {tab === "AI Analysis" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-5 h-5 text-brand-purple" />
                <h2 className="text-base font-bold text-white">TradeMind AI Analysis</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getSentimentColor(stock.sentiment)} bg-current/10 border border-current/20`}>
                  {stock.sentiment}
                </span>
                {lt && <span className="text-xs text-market-bull font-semibold px-2 py-0.5 rounded-full bg-market-bull/10">Live Data</span>}
              </div>

              <div className="p-4 rounded-xl bg-brand-purple/5 border border-brand-purple/15">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <strong className="text-white">{stock.name}</strong> is showing a{" "}
                  <strong className={getSentimentColor(trend === "Uptrend" ? "Bullish" : trend === "Downtrend" ? "Bearish" : "Neutral")}>
                    {trend.toLowerCase()}
                  </strong> trend.
                  Price is {livePrice > ema20 ? "above" : "below"} its 20-day EMA (₹{ema20.toLocaleString("en-IN")}),{" "}
                  {livePrice > ema50 ? "above" : "below"} the 50-day EMA (₹{ema50.toLocaleString("en-IN")}), and{" "}
                  {livePrice > ema200 ? "above" : "below"} the 200-day EMA (₹{ema200.toLocaleString("en-IN")}).
                  RSI at <strong className="text-white">{rsi.toFixed(1)}</strong> suggests {rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral"} momentum.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "RSI (14)",   value: rsi.toFixed(1),        status: rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral" },
                  { label: "MACD",       value: macd.toFixed(2),       status: macd > macdSignal ? "Bullish" : "Bearish" },
                  { label: "EMA 20",     value: `₹${ema20.toLocaleString("en-IN")}`, status: livePrice > ema20 ? "Above" : "Below" },
                  { label: "EMA 50",     value: `₹${ema50.toLocaleString("en-IN")}`, status: livePrice > ema50 ? "Above" : "Below" },
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

              <div className="p-4 rounded-xl bg-white/3 border border-border">
                <p className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">Signal Summary</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-black text-market-bull">{signals.buySignals}</p>
                    <p className="text-xs text-gray-500">Buy Signals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-yellow-400">{signals.neutralSignals}</p>
                    <p className="text-xs text-gray-500">Neutral</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-market-bear">{signals.sellSignals}</p>
                    <p className="text-xs text-gray-500">Sell Signals</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-market-bull/8 border border-market-bull/20">
                  <p className="text-xs text-market-bull/70">Key Support</p>
                  <p className="text-lg font-black font-num text-market-bull">₹{support.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-3 rounded-xl bg-market-bear/8 border border-market-bear/20">
                  <p className="text-xs text-market-bear/70">Key Resistance</p>
                  <p className="text-lg font-black font-num text-market-bear">₹{resistance.toLocaleString("en-IN")}</p>
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
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-bold text-white">Technical Indicators</h2>
                {lt && <span className="text-xs text-market-bull font-semibold">Live</span>}
              </div>
              <div className="space-y-3">
                {[
                  { name: "RSI (14)",  value: rsi,         type: "range", min: 0, max: 100, bull: rsi < 70 && rsi > 30, display: rsi.toFixed(1) },
                  { name: "P/E Ratio", value: lq?.pe ?? stock.pe, type: "text", display: (lq?.pe ?? stock.pe).toFixed(1), bull: (lq?.pe ?? stock.pe) < 35 },
                  { name: "EMA 200",   value: 0,           type: "text", display: `₹${ema200.toLocaleString("en-IN")}`, bull: livePrice > ema200 },
                  { name: "Support",   value: 0,           type: "text", display: `₹${support.toLocaleString("en-IN")}`, bull: true },
                  { name: "52W High",  value: 0,           type: "text", display: formatINR(liveHigh52w), bull: true },
                  { name: "52W Low",   value: 0,           type: "text", display: formatINR(liveLow52w), bull: true },
                ].map(({ name, value, type, min, max, bull: b, display }) => (
                  <div key={name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-gray-400">{name}</span>
                    <div className="flex items-center gap-3">
                      {type === "range" && (
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${b ? "bg-market-bull" : "bg-market-bear"}`} style={{ width: `${(value / (max ?? 100)) * 100}%` }} />
                        </div>
                      )}
                      <span className={`text-sm font-num font-semibold ${b ? "text-white" : "text-market-bear"}`}>
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
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4">Virtual Trade</h2>

            <div className="flex rounded-xl bg-white/5 p-1 mb-4">
              {(["BUY", "SELL"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTradeType(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    tradeType === t
                      ? t === "BUY" ? "bg-market-bull text-white" : "bg-market-bear text-white"
                      : "text-gray-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-white/3 border border-border mb-4">
              <p className="text-xs text-gray-500 mb-1">
                {lq ? "Live Market Price" : "Market Price"}
              </p>
              <p className="text-xl font-black font-num text-white">{formatINR(livePrice)}</p>
              {lq && (
                <p className={`text-xs font-num font-semibold mt-0.5 ${bull ? "text-market-bull" : "text-market-bear"}`}>
                  {bull ? "+" : ""}{formatPercent(liveChangePercent)} today
                </p>
              )}
            </div>

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

            <div className="p-3 rounded-xl bg-brand-purple/8 border border-brand-purple/20 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total Amount</span>
                <span className="text-lg font-black font-num gradient-text">{formatINR(livePrice * qty)}</span>
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

            <p className="text-xs text-gray-600 text-center mt-3">Virtual trading · No real money involved</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5">
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
                <p className="text-sm font-semibold font-num text-white">{(lq?.pe ?? stock.pe).toFixed(1)}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
