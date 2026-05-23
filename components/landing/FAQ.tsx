"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "Is TradeMind AI free to use?",
    a: "Yes! Our Free plan gives you access to virtual trading with ₹10L balance, live market prices, basic AI insights, and 5 learn modules — forever free with no credit card required.",
  },
  {
    q: "Does the platform use real money for trading?",
    a: "No. TradeMind AI uses virtual paper money for all trades. You can practice buying and selling stocks with simulated funds to build confidence without any financial risk. Real broker integration is coming for Pro/Elite users.",
  },
  {
    q: "How accurate is the AI stock analysis?",
    a: "Our AI achieves ~87% accuracy on directional predictions in backtesting. It combines technical indicators (RSI, MACD, EMA), volume analysis, and news sentiment. However, stock markets are inherently uncertain — always do your own research.",
  },
  {
    q: "Which exchanges are supported?",
    a: "We support NSE (National Stock Exchange) and BSE (Bombay Stock Exchange) covering all NIFTY 50, NIFTY 500 stocks, and major indices including SENSEX, NIFTY Bank, NIFTY IT, and more.",
  },
  {
    q: "Can beginners use TradeMind AI?",
    a: "Absolutely! TradeMind AI is designed with beginners in mind. Our Learn section explains concepts like RSI, MACD, and candlesticks with simple visuals. The AI assistant answers any market question in plain English.",
  },
  {
    q: "Will real broker integration be available?",
    a: "Yes, broker integration with Zerodha Kite Connect, Angel One SmartAPI, and Groww is planned for Elite users. This will allow real-money trading directly from the TradeMind AI interface.",
  },
  {
    q: "How often is market data updated?",
    a: "Market prices are updated in real-time via WebSocket connections during market hours (9:15 AM – 3:30 PM IST on trading days). After-hours data shows the closing prices.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit (SSL/TLS) and at rest. We never store your financial credentials. Virtual portfolio data is stored securely in encrypted PostgreSQL databases.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 px-6" id="faq">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 mb-4">
            FAQ
          </span>
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Common{" "}
            <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-gray-400 text-lg">Everything you need to know about TradeMind AI</p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
              >
                <span className="text-base font-semibold text-white pr-4">{q}</span>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                  {open === i ? (
                    <Minus className="w-3.5 h-3.5 text-brand-purple" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </span>
              </button>

              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <div className="w-full h-px bg-border mb-4" />
                      <p className="text-gray-400 leading-relaxed text-sm">{a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
