"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Brain, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { STOCKS, INDICES } from "@/lib/data/mockData";
import { useWatchlistStore, useLiveMarketStore, usePortfolioStore, LiveTechnicals } from "@/lib/store/store";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { formatINR, formatPercent, getSentimentColor } from "@/lib/utils";
import { generateIntraday } from "@/lib/utils";
import { LiveClock } from "@/components/shared/LiveClock";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ── Live AI score computed from real technicals ───────────────────────────────
function computeAIScore(lt: LiveTechnicals, price: number): number {
  let score = 50;
  if (lt.rsi < 30) score += 20; else if (lt.rsi < 40) score += 12;
  else if (lt.rsi < 50) score += 5; else if (lt.rsi > 80) score -= 15;
  else if (lt.rsi > 70) score -= 10; else if (lt.rsi > 60) score -= 3;
  if (lt.macd > lt.macdSignal) score += 12; else score -= 8;
  if (lt.ema20 > 0) { if (price > lt.ema20) score += 8; else score -= 6; }
  if (lt.ema50 > 0) { if (price > lt.ema50) score += 8; else score -= 6; }
  if (lt.ema200 > 0) { if (price > lt.ema200) score += 8; else score -= 6; }
  if (lt.trend === "Uptrend") score += 5; else if (lt.trend === "Downtrend") score -= 5;
  if (lt.support > 0 && price > 0 && (price - lt.support) / lt.support < 0.03) score += 7;
  return Math.max(5, Math.min(100, Math.round(score)));
}

function buildReason(lt: LiveTechnicals, price: number, stockName: string): string {
  const pts: string[] = [];
  if (lt.rsi < 40) pts.push(`RSI ${lt.rsi.toFixed(0)} — oversold entry`);
  if (lt.macd > lt.macdSignal) pts.push("MACD bullish crossover");
  if (lt.ema20 > 0 && price > lt.ema20 && lt.ema20 > lt.ema50) pts.push("Price above EMA20 > EMA50");
  else if (lt.ema200 > 0 && price > lt.ema200) pts.push("Holding above 200-day EMA");
  if (lt.support > 0 && price > 0 && (price - lt.support) / lt.support < 0.03) pts.push(`Near support ₹${lt.support.toLocaleString("en-IN")}`);
  if (lt.trend === "Uptrend" && pts.length < 1) pts.push("Uptrend confirmed across EMAs");
  if (pts.length === 0) {
    return lt.trend === "Downtrend"
      ? `${stockName} in downtrend — wait for reversal confirmation`
      : `${stockName} consolidating near key levels`;
  }
  return pts.slice(0, 2).join(" · ");
}

const scoreColor = (s: number) => s >= 70 ? "#10B981" : s >= 50 ? "#8B5CF6" : "#EF4444";

const SECTOR_COLORS: Record<string, string> = {
  Banking: "#6366F1", Energy: "#8B5CF6", IT: "#06B6D4",
  NBFC: "#10B981", Conglomerate: "#F59E0B", Infrastructure: "#EC4899",
};

export default function DashboardPage() {
  const { items: watchlist } = useWatchlistStore();
  const { quotes, technicals, isLoading, lastUpdated } = useLiveMarketStore();
  const { holdings, stats } = usePortfolioStore();

  const quotesLoaded = Object.keys(quotes).length > 0;
  const techLoaded   = Object.keys(technicals).length > 0;

  // ── AI Recommendations — sorted by live score ──────────────────────────────
  const aiRecs = STOCKS
    .filter((s) => quotes[s.symbol] && technicals[s.symbol])
    .map((s) => {
      const lq = quotes[s.symbol];
      const lt = technicals[s.symbol];
      const score = computeAIScore(lt, lq.price);
      return { symbol: s.symbol, name: s.name, score, sentiment: lt.sentiment, price: lq.price, changePercent: lq.changePercent, reason: buildReason(lt, lq.price, s.name) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  // ── Gainers / Losers — only from live quotes, no mock fallback ─────────────
  const liveStocks = STOCKS
    .filter((s) => quotes[s.symbol])
    .map((s) => ({ symbol: s.symbol, name: s.name, price: quotes[s.symbol].price, changePercent: quotes[s.symbol].changePercent }));
  const topGainers = [...liveStocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  const topLosers  = [...liveStocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);

  // ── Portfolio — use real store values ──────────────────────────────────────
  const portfolioValue = holdings.reduce((sum, h) => {
    const livePrice = quotes[h.symbol]?.price ?? h.currentPrice;
    return sum + livePrice * h.quantity;
  }, 0) + stats.cash;
  const totalInvested  = holdings.reduce((sum, h) => sum + h.invested, 0);
  const totalPnL       = portfolioValue - totalInvested - stats.cash;
  const totalPnLPct    = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Sector donut from real holdings
  const sectorMap: Record<string, number> = {};
  holdings.forEach((h) => {
    const price = quotes[h.symbol]?.price ?? h.currentPrice;
    sectorMap[h.sector] = (sectorMap[h.sector] ?? 0) + price * h.quantity;
  });
  const donutData = Object.entries(sectorMap).map(([name, value]) => ({ name, value, color: SECTOR_COLORS[name] ?? "#8B5CF6" }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <LiveClock />
        </div>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />}
          {lastUpdated && !isLoading && (
            <span className="text-xs text-gray-600">
              Live · {new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 rounded-lg glass glass-hover text-sm text-gray-400 hover:text-white">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Indices */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {INDICES.map((index, i) => {
          const live = quotes[index.displayName];
          if (!live && isLoading) {
            return (
              <motion.div key={index.name} variants={item} className="glass rounded-xl p-4 h-32 skeleton" />
            );
          }
          const liveVal    = live?.price         ?? index.value;
          const liveChange = live?.change        ?? index.change;
          const livePct    = live?.changePercent ?? index.changePercent;
          const bull = livePct >= 0;
          const chartData = generateIntraday(liveVal);
          return (
            <motion.div key={index.name} variants={item} className="glass rounded-xl p-4 glass-hover">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400">{index.displayName}</p>
                <span className={`text-xs font-num font-bold px-2 py-0.5 rounded-full ${bull ? "bg-market-bull/15 text-market-bull" : "bg-market-bear/15 text-market-bear"}`}>
                  {bull ? "+" : ""}{livePct.toFixed(2)}%
                </span>
              </div>
              <p className="text-xl font-black font-num text-white mb-1 tabular-nums">{liveVal.toLocaleString("en-IN")}</p>
              <div className="flex items-center gap-1 mb-3">
                {bull ? <TrendingUp className="w-3 h-3 text-market-bull" /> : <TrendingDown className="w-3 h-3 text-market-bear" />}
                <span className={`text-xs font-num ${bull ? "text-market-bull" : "text-market-bear"}`}>{bull ? "+" : ""}{liveChange.toFixed(2)}</span>
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
        <div className="xl:col-span-2 space-y-6">

          {/* AI Recommendations — 100% live */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-purple/20 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-brand-purple" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">AI Recommendations</h2>
                  <p className="text-xs text-gray-500">
                    {techLoaded ? "Live technical analysis" : "Loading live data…"}
                  </p>
                </div>
              </div>
              <Link href="/assistant" className="text-xs text-brand-purple hover:text-brand-blue flex items-center gap-1 transition-colors">
                Ask AI <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Loading skeleton */}
            {!techLoaded && (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-16 skeleton rounded-xl" />
                ))}
              </div>
            )}

            {/* Live recs */}
            {techLoaded && aiRecs.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No live data available — retrying…</p>
            )}
            <div className="space-y-3">
              {aiRecs.map(({ symbol, name, score, sentiment, price, changePercent, reason }) => {
                const bull = changePercent >= 0;
                const sc   = scoreColor(score);
                return (
                  <Link key={symbol} href={`/stock/${symbol}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/3 hover:bg-white/6 border border-border/50 hover:border-brand-purple/20 transition-all group"
                  >
                    <div className="flex-shrink-0 text-center">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center border-2" style={{ borderColor: sc + "60", background: sc + "18" }}>
                        <span className="text-sm font-black" style={{ color: sc }}>{score}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">AI</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{symbol}</span>
                        <span className="text-xs font-num text-gray-300">₹{price.toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{reason}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-xs font-semibold ${bull ? "text-market-bull" : "text-market-bear"}`}>
                        {bull ? "+" : ""}{changePercent.toFixed(2)}%
                      </p>
                      <p className={`text-xs font-semibold ${getSentimentColor(sentiment)}`}>{sentiment}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-purple transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Gainers & Losers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gainers */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-market-bull" />
                <h2 className="text-sm font-bold text-white">Top Gainers</h2>
              </div>
              {!quotesLoaded ? (
                <div className="space-y-2">{[0,1,2,3].map(i => <div key={i} className="h-10 skeleton rounded-lg" />)}</div>
              ) : (
                <div className="space-y-2">
                  {topGainers.map(({ symbol, name, price, changePercent }) => (
                    <Link key={symbol} href={`/stock/${symbol}`}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:opacity-80 transition-opacity">
                      <div><p className="text-sm font-semibold text-white">{symbol}</p><p className="text-xs text-gray-500 truncate max-w-[120px]">{name}</p></div>
                      <div className="text-right">
                        <p className="text-sm font-num font-semibold text-white">₹{price.toLocaleString("en-IN")}</p>
                        <p className="text-xs font-num font-semibold text-market-bull">+{changePercent.toFixed(2)}%</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Losers */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-market-bear" />
                <h2 className="text-sm font-bold text-white">Top Losers</h2>
              </div>
              {!quotesLoaded ? (
                <div className="space-y-2">{[0,1,2,3].map(i => <div key={i} className="h-10 skeleton rounded-lg" />)}</div>
              ) : (
                <div className="space-y-2">
                  {topLosers.map(({ symbol, name, price, changePercent }) => (
                    <Link key={symbol} href={`/stock/${symbol}`}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:opacity-80 transition-opacity">
                      <div><p className="text-sm font-semibold text-white">{symbol}</p><p className="text-xs text-gray-500 truncate max-w-[120px]">{name}</p></div>
                      <div className="text-right">
                        <p className="text-sm font-num font-semibold text-white">₹{price.toLocaleString("en-IN")}</p>
                        <p className="text-xs font-num font-semibold text-market-bear">{changePercent.toFixed(2)}%</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Right: Portfolio + Watchlist */}
        <div className="space-y-6">
          {/* Portfolio — real store data */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Portfolio</h2>
              <Link href="/portfolio" className="text-xs text-brand-purple hover:text-brand-blue flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-24 h-24 flex-shrink-0">
                <ClientOnly fallback={<div className="w-24 h-24 skeleton rounded-full" />}>
                  {donutData.length > 0 ? (
                    <PieChart width={96} height={96}>
                      <Pie data={donutData} cx={44} cy={44} innerRadius={28} outerRadius={44} dataKey="value" strokeWidth={0}>
                        {donutData.map(({ color }, i) => <Cell key={i} fill={color} />)}
                      </Pie>
                    </PieChart>
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center">
                      <span className="text-xs text-gray-600">Empty</span>
                    </div>
                  )}
                </ClientOnly>
              </div>
              <div>
                <p className="text-2xl font-black font-num text-white">{formatINR(portfolioValue)}</p>
                {holdings.length > 0 ? (
                  <>
                    <div className="flex items-center gap-1 mt-1">
                      {totalPnLPct >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-market-bull" /> : <TrendingDown className="w-3.5 h-3.5 text-market-bear" />}
                      <span className={`text-sm font-semibold ${totalPnLPct >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                        {totalPnLPct >= 0 ? "+" : ""}{formatPercent(totalPnLPct)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Invested: {formatINR(totalInvested)}</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">No holdings yet</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div className="bg-brand-purple/8 rounded-lg p-3">
                <p className="text-xs text-gray-500">Cash</p>
                <p className="text-sm font-bold font-num text-brand-purple">{formatINR(stats.cash)}</p>
              </div>
              <div className={`rounded-lg p-3 ${totalPnL >= 0 ? "bg-market-bull/8" : "bg-market-bear/8"}`}>
                <p className="text-xs text-gray-500">Total P&L</p>
                <p className={`text-sm font-bold font-num ${totalPnL >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                  {totalPnL >= 0 ? "+" : ""}{formatINR(Math.abs(totalPnL))}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Watchlist — live prices only */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white">Watchlist</h2>
              <span className="text-xs text-gray-500">{watchlist.length} stocks</span>
            </div>
            <div className="space-y-1">
              {watchlist.map(({ symbol, name }) => {
                const live = quotes[symbol];
                return (
                  <Link key={symbol} href={`/stock/${symbol}`}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 transition-colors group">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-purple/30 to-brand-blue/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-brand-purple">{symbol[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">{symbol}</p>
                      <p className="text-xs text-gray-600 truncate">{name}</p>
                    </div>
                    <div className="text-right">
                      {live ? (
                        <>
                          <p className="text-xs font-num font-semibold text-white">₹{live.price.toLocaleString("en-IN")}</p>
                          <p className={`text-xs font-num ${live.changePercent >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                            {live.changePercent >= 0 ? "+" : ""}{live.changePercent.toFixed(2)}%
                          </p>
                        </>
                      ) : (
                        <div className="w-16 h-8 skeleton rounded" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
