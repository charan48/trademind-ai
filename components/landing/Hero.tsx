"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, Zap, Shield, Star } from "lucide-react";

const floatingCards = [
  { symbol: "RELIANCE", price: "₹2,847", change: "+1.61%", bull: true, x: "left-8", y: "top-32", delay: 0 },
  { symbol: "HDFC Bank", price: "₹1,623", change: "+1.81%", bull: true, x: "right-12", y: "top-24", delay: 0.5 },
  { symbol: "TCS", price: "₹3,748", change: "-0.86%", bull: false, x: "right-8", y: "bottom-32", delay: 1 },
  { symbol: "BAJFINANCE", price: "₹6,842", change: "+1.90%", bull: true, x: "left-12", y: "bottom-24", delay: 1.5 },
];

const stats = [
  { label: "Active Traders", value: "50K+", icon: "👥" },
  { label: "Stocks Tracked", value: "5,000+", icon: "📈" },
  { label: "AI Accuracy", value: "87%", icon: "🧠" },
  { label: "Daily Volume", value: "₹2L Cr", icon: "💰" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Animated background */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 dot-grid opacity-30" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-cyan/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-3xl" />

      {/* Floating stock cards */}
      {floatingCards.map((card, i) => (
        <motion.div
          key={i}
          className={`absolute hidden lg:flex ${card.x} ${card.y} items-center gap-3 glass rounded-xl px-4 py-3 shadow-glass`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { delay: card.delay + 0.5, duration: 0.5 },
            scale: { delay: card.delay + 0.5, duration: 0.5 },
            y: { delay: card.delay + 1, duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bull ? "bg-market-bull/20" : "bg-market-bear/20"}`}>
            {card.bull ? (
              <TrendingUp className="w-4 h-4 text-market-bull" />
            ) : (
              <TrendingDown className="w-4 h-4 text-market-bear" />
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">{card.symbol}</p>
            <p className="text-sm font-bold font-num text-white">{card.price}</p>
          </div>
          <span className={`text-xs font-num font-semibold ${card.bull ? "text-market-bull" : "text-market-bear"}`}>
            {card.change}
          </span>
        </motion.div>
      ))}

      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass neon-border mb-8"
        >
          <span className="w-2 h-2 bg-market-bull rounded-full animate-pulse" />
          <span className="text-sm text-gray-300">Markets Open · NIFTY 50</span>
          <span className="text-sm font-num font-semibold text-market-bull">22,847 +0.83%</span>
          <Zap className="w-3 h-3 text-brand-purple ml-1" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6"
        >
          The Future of{" "}
          <span className="gradient-text block mt-1">Stock Intelligence</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          AI-powered stock analysis, real-time market data, and intelligent portfolio management — built for India's next generation of investors.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-white font-semibold text-lg shadow-glow-purple hover:shadow-glow-blue transition-all duration-300 hover:scale-[1.02]"
          >
            Start Trading Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl glass neon-border text-white font-semibold text-lg hover:bg-white/8 transition-all duration-300"
          >
            <Star className="w-5 h-5 text-brand-purple" />
            Learn Markets
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mb-16"
        >
          {["Free to start", "No real money needed", "AI-powered insights", "NSE & BSE data"].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-market-bull" />
              {item}
            </div>
          ))}
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {stats.map(({ label, value, icon }) => (
            <div key={label} className="glass rounded-xl p-4 text-center glass-hover">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-black gradient-text font-num">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
    </section>
  );
}
