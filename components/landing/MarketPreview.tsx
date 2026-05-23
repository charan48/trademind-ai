"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { useEffect, useState } from "react";
import { INDICES, STOCKS } from "@/lib/data/mockData";

interface LiveQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  prevClose?: number;
}

interface ChartPoint { date: string; value: number }

export function MarketPreview() {
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [niftyChart, setNiftyChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch live quotes (stocks + indices in one call)
    fetch("/api/market/quotes")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.quotes) setQuotes(d.quotes as Record<string, LiveQuote>);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch NIFTY 50 chart data
    fetch("/api/market/chart/NIFTY+50?range=5d")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.chartData?.length) {
          setNiftyChart(d.chartData.map((p: { date: string; price: number }) => ({
            date: p.date,
            value: p.price,
          })));
        }
      })
      .catch(() => {});
  }, []);

  // NIFTY 50 live data
  const niftyLive = quotes["NIFTY 50"];
  const niftyPrice = niftyLive?.price ?? INDICES[0].value;
  const niftyChangePct = niftyLive?.changePercent ?? INDICES[0].changePercent;
  const niftyChange = niftyLive?.change ?? INDICES[0].change;
  const niftyOpen = niftyLive?.open ?? INDICES[0].open;
  const niftyHigh = niftyLive?.dayHigh ?? INDICES[0].high;
  const niftyLow  = niftyLive?.dayLow  ?? INDICES[0].low;
  const niftyPrevClose = niftyLive?.prevClose ?? INDICES[0].prevClose;
  const niftyBull = niftyChangePct >= 0;

  // Other indices (SENSEX, NIFTY IT, NIFTY BANK)
  const sideIndices = INDICES.slice(1).map((idx) => {
    const live = quotes[idx.displayName];
    return {
      ...idx,
      value: live?.price ?? idx.value,
      change: live?.change ?? idx.change,
      changePercent: live?.changePercent ?? idx.changePercent,
    };
  });

  // Top movers from live quotes
  const liveStocks = STOCKS.map((s) => {
    const live = quotes[s.symbol];
    return { ...s, price: live?.price ?? s.price, changePercent: live?.changePercent ?? s.changePercent };
  }).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 3);

  return (
    <section className="py-24 px-6 relative">
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
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-purple" />
                    <span className="text-gray-500 text-sm">Loading live data…</span>
                  </div>
                ) : (
                  <>
                    <p className="text-4xl font-black font-num text-white">
                      {niftyPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {niftyBull
                        ? <TrendingUp className="w-4 h-4 text-market-bull" />
                        : <TrendingDown className="w-4 h-4 text-market-bear" />}
                      <span className={`font-semibold font-num ${niftyBull ? "text-market-bull" : "text-market-bear"}`}>
                        {niftyChange >= 0 ? "+" : ""}{niftyChange.toFixed(2)} ({niftyChangePct >= 0 ? "+" : ""}{niftyChangePct.toFixed(2)}%)
                      </span>
                      <span className="text-xs text-gray-500">Today</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {loading && <Loader2 className="w-3 h-3 animate-spin text-brand-purple opacity-50" />}
                <span className="text-xs text-gray-500 font-semibold">NSE · Yahoo Finance</span>
              </div>
            </div>

            <ClientOnly fallback={<div className="h-48 skeleton rounded-xl" />}>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={niftyChart.length > 0 ? niftyChart : INDICES[0].chartData.map(d => ({ date: String(d.time), value: d.value }))}>
                    <defs>
                      <linearGradient id="niftyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={niftyBull ? "#10B981" : "#EF4444"} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={niftyBull ? "#10B981" : "#EF4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={niftyBull ? "#10B981" : "#EF4444"}
                      strokeWidth={2}
                      fill="url(#niftyGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: niftyBull ? "#10B981" : "#EF4444" }}
                    />
                    <Tooltip
                      contentStyle={{ background: "#0D1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                      formatter={(v: number) => [v.toLocaleString("en-IN", { maximumFractionDigits: 2 }), "NIFTY"]}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ClientOnly>

            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              {[
                { label: "Open",       value: niftyOpen },
                { label: "High",       value: niftyHigh },
                { label: "Low",        value: niftyLow  },
                { label: "Prev Close", value: niftyPrevClose },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold font-num text-white">
                    {loading
                      ? <span className="text-gray-600">—</span>
                      : (value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Index cards + top movers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {sideIndices.map((index) => (
              <div key={index.name} className="glass rounded-xl p-4 glass-hover">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-300">{index.displayName}</p>
                  <span className={`text-xs font-num font-semibold px-2 py-0.5 rounded-full ${index.changePercent >= 0 ? "bg-market-bull/15 text-market-bull" : "bg-market-bear/15 text-market-bear"}`}>
                    {index.changePercent >= 0 ? "+" : ""}{index.changePercent.toFixed(2)}%
                  </span>
                </div>
                {loading ? (
                  <div className="h-7 w-32 skeleton rounded" />
                ) : (
                  <p className="text-2xl font-black font-num text-white">{index.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {index.changePercent >= 0
                    ? <TrendingUp className="w-3.5 h-3.5 text-market-bull" />
                    : <TrendingDown className="w-3.5 h-3.5 text-market-bear" />}
                  <span className={`text-xs font-num ${index.changePercent >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                    {index.change >= 0 ? "+" : ""}{index.change.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Top movers — live */}
            <div className="glass rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">Top Movers Today</p>
              {liveStocks.map((s) => (
                <div key={s.symbol} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{s.symbol}</p>
                    <p className="text-xs text-gray-500">{s.sector}</p>
                  </div>
                  <div className="text-right">
                    {loading ? (
                      <div className="w-16 h-8 skeleton rounded" />
                    ) : (
                      <>
                        <p className="text-sm font-num font-semibold text-white">₹{s.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                        <p className={`text-xs font-num ${s.changePercent >= 0 ? "text-market-bull" : "text-market-bear"}`}>
                          {s.changePercent >= 0 ? "+" : ""}{s.changePercent.toFixed(2)}%
                        </p>
                      </>
                    )}
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
