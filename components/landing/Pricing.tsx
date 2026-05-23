"use client";

import { motion } from "framer-motion";
import { Check, Zap, Star, Crown } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for beginners learning the market",
    icon: Star,
    gradient: "from-gray-700/30 to-gray-800/30",
    border: "border-white/10",
    buttonClass: "bg-white/10 hover:bg-white/15 text-white",
    popular: false,
    features: [
      "₹10L virtual trading balance",
      "5 stocks in watchlist",
      "Basic AI stock summaries",
      "Live NSE & BSE prices",
      "5 learn modules",
      "Portfolio tracker",
      "Market news feed",
    ],
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "For serious investors and swing traders",
    icon: Zap,
    gradient: "from-brand-purple/20 to-brand-blue/20",
    border: "border-brand-purple/40",
    buttonClass: "bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 text-white shadow-glow-purple",
    popular: true,
    features: [
      "Unlimited virtual balance",
      "Unlimited watchlist",
      "Full AI analysis & insights",
      "Advanced charts (20+ indicators)",
      "All 50+ learn modules",
      "AI chat assistant",
      "Price & breakout alerts",
      "Sector & industry analysis",
      "Portfolio risk analysis",
      "Priority support",
    ],
  },
  {
    name: "Elite",
    price: "₹999",
    period: "/month",
    description: "For professional traders & institutions",
    icon: Crown,
    gradient: "from-amber-500/15 to-orange-600/15",
    border: "border-amber-500/30",
    buttonClass: "bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white",
    popular: false,
    features: [
      "Everything in Pro",
      "Real broker integration (Zerodha, Angel)",
      "Automated trading signals",
      "AI portfolio advisor",
      "Option chain analysis",
      "F&O analytics dashboard",
      "Custom AI strategies",
      "Dedicated account manager",
      "API access",
      "White-glove onboarding",
    ],
  },
];

export function Pricing() {
  return (
    <section className="py-24 px-6 relative" id="pricing">
      <div className="absolute inset-0 bg-gradient-radial from-brand-blue/5 via-transparent to-transparent" />

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 mb-4">
            Simple Pricing
          </span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Start Free,{" "}
            <span className="gradient-text">Grow Smarter</span>
          </h2>
          <p className="text-gray-400 text-lg">No credit card required. Cancel anytime.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(({ name, price, period, description, icon: Icon, gradient, border, buttonClass, popular, features }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${gradient} border ${border} ${popular ? "shadow-glow-purple" : ""}`}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue text-xs font-bold text-white shadow-glow-purple">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${popular ? "bg-brand-purple/30" : "bg-white/10"}`}>
                  <Icon className={`w-5 h-5 ${popular ? "text-brand-purple" : "text-gray-300"}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{name}</h3>
                  <p className="text-xs text-gray-400">{description}</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black text-white">{price}</span>
                <span className="text-gray-400 text-sm ml-1">{period}</span>
              </div>

              <Link
                href="/dashboard"
                className={`w-full block text-center py-3 rounded-xl font-semibold text-sm transition-all mb-6 ${buttonClass}`}
              >
                Get Started
              </Link>

              <ul className="space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-market-bull flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-gray-500 mt-8"
        >
          All plans include SSL encryption, data privacy, and 99.9% uptime guarantee.
        </motion.p>
      </div>
    </section>
  );
}
