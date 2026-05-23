"use client";

import { motion } from "framer-motion";
import { Brain, TrendingUp, Shield, LineChart, BookOpen, Zap, Bell, Globe } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Stock Analysis",
    description: "Get instant AI-powered insights on any stock — technical analysis, sentiment scoring, and plain-English explanations.",
    gradient: "from-purple-500/20 to-violet-600/20",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    tag: "AI-Powered",
  },
  {
    icon: TrendingUp,
    title: "Live Market Data",
    description: "Real-time NSE & BSE prices, indices, top gainers/losers, and market depth — updated every second.",
    gradient: "from-cyan-500/20 to-blue-600/20",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    tag: "Real-Time",
  },
  {
    icon: Shield,
    title: "Virtual Trading",
    description: "Practice with ₹10L virtual money. Buy, sell, and build your portfolio without any real risk.",
    gradient: "from-green-500/20 to-emerald-600/20",
    border: "border-green-500/20",
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    tag: "Risk-Free",
  },
  {
    icon: LineChart,
    title: "Advanced Charting",
    description: "Professional-grade candlestick charts with RSI, MACD, Bollinger Bands, and 20+ technical indicators.",
    gradient: "from-orange-500/20 to-amber-600/20",
    border: "border-orange-500/20",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
    tag: "Pro Charts",
  },
  {
    icon: BookOpen,
    title: "Learn to Invest",
    description: "Visual lessons on candlestick patterns, RSI, MACD, and trading strategies — from beginner to advanced.",
    gradient: "from-pink-500/20 to-rose-600/20",
    border: "border-pink-500/20",
    iconBg: "bg-pink-500/20",
    iconColor: "text-pink-400",
    tag: "Education",
  },
  {
    icon: Zap,
    title: "AI Chat Assistant",
    description: '"Best swing stocks under ₹500?" — Ask anything about markets and get intelligent, data-backed answers.',
    gradient: "from-yellow-500/20 to-amber-600/20",
    border: "border-yellow-500/20",
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    tag: "Chat AI",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Price alerts, breakout notifications, and AI-triggered signals delivered to your device instantly.",
    gradient: "from-indigo-500/20 to-blue-600/20",
    border: "border-indigo-500/20",
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
    tag: "Alerts",
  },
  {
    icon: Globe,
    title: "Global Ready",
    description: "India-first with built-in architecture to expand to US, EU, and crypto markets as you grow.",
    gradient: "from-teal-500/20 to-cyan-600/20",
    border: "border-teal-500/20",
    iconBg: "bg-teal-500/20",
    iconColor: "text-teal-400",
    tag: "Scalable",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Features() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 mb-4">
            Everything You Need
          </span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Built for{" "}
            <span className="gradient-text">Smarter Investing</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            From beginner-friendly explanations to professional-grade tools — TradeMind AI has everything you need to invest confidently.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {FEATURES.map(({ icon: Icon, title, description, gradient, border, iconBg, iconColor, tag }) => (
            <motion.div
              key={title}
              variants={item}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${gradient} border ${border} glass-hover cursor-default`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${iconBg} ${iconColor} border border-current/20`}>
                  {tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
