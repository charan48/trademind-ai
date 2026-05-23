"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Brain, Send, Sparkles, Trash2, Copy, ThumbsUp } from "lucide-react";
import { useChatStore, useLiveMarketStore } from "@/lib/store/store";
import { AI_SUGGESTED_QUERIES } from "@/lib/data/mockData";
import { AIMessage } from "@/lib/types";
import { STOCKS } from "@/lib/data/mockData";
import { computeAIScore } from "@/lib/market/calculations";

// ── Dynamic response generator using live market data ────────────────────────
function buildLiveResponse(
  input: string,
  quotes: Record<string, { price: number; changePercent: number; change: number }>,
  technicals: Record<string, { rsi: number; macd: number; macdSignal: number; ema20: number; ema50: number; ema200?: number; trend?: string; support?: number; sentiment?: string }>
): string {
  const lower = input.toLowerCase();
  const hasLiveData = Object.keys(quotes).length > 0;

  // ── Stock-specific query ────────────────────────────────────────────────────
  const matchedStock = STOCKS.find(
    (s) => lower.includes(s.symbol.toLowerCase()) || lower.includes(s.name.toLowerCase().split(" ")[0].toLowerCase())
  );

  if (matchedStock) {
    const lq = quotes[matchedStock.symbol];
    const lt = technicals[matchedStock.symbol];
    const price = lq?.price ?? matchedStock.price;
    const changePct = lq?.changePercent ?? matchedStock.changePercent;
    const rsi = lt?.rsi ?? matchedStock.rsi;
    const macd = lt?.macd ?? matchedStock.macd;
    const macdSig = lt?.macdSignal ?? matchedStock.macdSignal;
    const ema20 = lt?.ema20 ?? matchedStock.ema20;
    const ema50 = lt?.ema50 ?? matchedStock.ema50;
    const sentiment = lt?.sentiment ?? matchedStock.sentiment;
    const aiScore = lt ? computeAIScore({ rsi, macd, macdSignal: macdSig, ema20, ema50, ema200: lt.ema200, trend: lt.trend, support: lt.support }, price) : matchedStock.aiScore;
    const trend = lt?.trend ?? matchedStock.technicals?.trend ?? "Sideways";
    const support = lt?.support ?? matchedStock.technicals?.support ?? 0;
    const resistance = (lt as { resistance?: number } | undefined)?.resistance ?? matchedStock.technicals?.resistance ?? 0;

    const rsiNote = rsi < 30 ? "Oversold — strong reversal zone" :
      rsi < 40 ? "Near oversold — watch for bounce" :
      rsi > 80 ? "Overbought — consider booking profits" :
      rsi > 70 ? "Extended — caution on new entry" :
      "Neutral zone";

    const macdNote = macd > macdSig ? "Bullish crossover — buying pressure" : "Bearish crossover — selling pressure";
    const emaNote = price > ema20 && ema20 > ema50 ? "Above EMA20 > EMA50 — uptrend confirmed" :
      price < ema20 ? "Below EMA20 — short-term bearish" : "Mixed EMA signals";

    return `## ${matchedStock.name} (${matchedStock.symbol})

**Live Price:** ₹${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${changePct >= 0 ? "📈" : "📉"} ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%

**AI Score: ${aiScore}/100 — ${sentiment}**${lq ? " (Live)" : " (Estimated)"}

---

**Technical Analysis:**
- **RSI (14):** ${rsi.toFixed(1)} — ${rsiNote}
- **MACD:** ${macd.toFixed(2)} vs Signal ${macdSig.toFixed(2)} — ${macdNote}
- **EMA:** ${emaNote}
- **Trend:** ${trend}
${support > 0 ? `- **Support:** ₹${support.toLocaleString("en-IN")} | **Resistance:** ₹${resistance.toLocaleString("en-IN")}` : ""}

**Sector:** ${matchedStock.sector} · **Exchange:** NSE

**Key Insight:**
${aiScore >= 70 ? `${matchedStock.symbol} shows strong bullish signals. RSI at ${rsi.toFixed(0)} with ${macd > macdSig ? "bullish" : "bearish"} MACD. ${trend === "Uptrend" ? "Uptrend intact across EMAs." : ""}` :
  aiScore >= 50 ? `${matchedStock.symbol} is neutral — wait for clearer direction. Watch ${macd > macdSig ? "RSI for overbought levels" : "support at ₹" + support.toLocaleString("en-IN")}.` :
  `${matchedStock.symbol} showing weakness. RSI ${rsi.toFixed(0)}, ${trend.toLowerCase()} trend. Exercise caution.`}

⚠️ Educational only · Not financial advice`;
  }

  // ── RSI / Technical concept queries ─────────────────────────────────────────
  if (lower.includes("rsi") || lower.includes("relative strength")) {
    const rsiExamples = STOCKS.slice(0, 3).map((s) => {
      const lt = technicals[s.symbol];
      const rsi = lt?.rsi ?? s.rsi;
      const lq = quotes[s.symbol];
      const price = lq?.price ?? s.price;
      const zone = rsi < 30 ? "🟢 Oversold" : rsi > 70 ? "🔴 Overbought" : "⚪ Neutral";
      return `- **${s.symbol}** ₹${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })} · RSI ${rsi.toFixed(1)} — ${zone}`;
    }).join("\n");

    return `## RSI — Relative Strength Index

RSI measures momentum on a **0–100 scale**:
- **< 30** — Oversold (potential buy zone)
- **30–40** — Approaching oversold (watch for bounce)
- **40–60** — Neutral
- **60–70** — Strong momentum
- **> 70** — Overbought (consider taking profits)

**Current Live RSI Values:**
${rsiExamples}

**How to trade it:** Don't buy just because RSI < 30 — wait for confirmation like MACD crossover or price above EMA20. RSI divergence (price making new highs but RSI falling) = strong reversal signal.

⚠️ Educational only · Not financial advice`;
  }

  // ── Swing trade / buy under ₹500 query ──────────────────────────────────────
  if (lower.includes("swing") || lower.includes("under ₹") || lower.includes("under 500")) {
    const threshold = (() => {
      const match = lower.match(/₹(\d+)|under\s+(\d+)/);
      return match ? parseInt(match[1] ?? match[2]) : 2000;
    })();

    const affordable = STOCKS
      .filter((s) => (quotes[s.symbol]?.price ?? s.price) < threshold)
      .map((s) => {
        const lt = technicals[s.symbol];
        const lq = quotes[s.symbol];
        const price = lq?.price ?? s.price;
        const rsi = lt?.rsi ?? s.rsi;
        const score = lt ? computeAIScore({ rsi, macd: lt.macd, macdSignal: lt.macdSignal, ema20: lt.ema20, ema50: lt.ema50, ema200: lt.ema200, trend: lt.trend, support: lt.support }, price) : s.aiScore;
        const sentiment = lt?.sentiment ?? s.sentiment;
        return { s, price, rsi, score, sentiment };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (affordable.length === 0) {
      return `No stocks in the portfolio universe priced under ₹${threshold.toLocaleString("en-IN")} right now.`;
    }

    const lines = affordable.map(({ s, price, rsi, score, sentiment }) =>
      `- **${s.symbol}** ₹${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })} · AI Score ${score}/100 · RSI ${rsi.toFixed(1)} · ${sentiment}`
    ).join("\n");

    return `## Stocks Under ₹${threshold.toLocaleString("en-IN")} — Swing Candidates

**Live picks ranked by AI score:**
${lines}

**Swing trade checklist:**
1. RSI < 50 (room to run)
2. MACD bullish crossover or about to cross
3. Price near support level
4. Broad market not in correction

Set **7% stop-loss** from entry. Target **10–15% returns** within 2–4 weeks.

⚠️ Educational only · Not financial advice`;
  }

  // ── Portfolio / market overview ──────────────────────────────────────────────
  if (lower.includes("portfolio") || lower.includes("market") || lower.includes("best") || lower.includes("buy") || lower.includes("recommend")) {
    const ranked = STOCKS
      .map((s) => {
        const lt = technicals[s.symbol];
        const lq = quotes[s.symbol];
        const price = lq?.price ?? s.price;
        const rsi = lt?.rsi ?? s.rsi;
        const sentiment = lt?.sentiment ?? s.sentiment;
        const score = lt ? computeAIScore({ rsi, macd: lt.macd, macdSignal: lt.macdSignal, ema20: lt.ema20, ema50: lt.ema50, ema200: lt.ema200, trend: lt.trend, support: lt.support }, price) : s.aiScore;
        return { s, price, score, sentiment, rsi, changePct: lq?.changePercent ?? s.changePercent };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const dataLabel = hasLiveData ? "Live NSE data" : "Estimated data";
    const lines = ranked.map(({ s, price, score, sentiment, rsi, changePct }) =>
      `- **${s.symbol}** ₹${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%) — AI Score ${score}/100 · ${sentiment} · RSI ${rsi.toFixed(1)}`
    ).join("\n");

    return `## Market Overview — Top AI Picks

**Top stocks by AI score (${dataLabel}):**
${lines}

**Current Market Signals:**
${ranked[0]?.sentiment === "Strongly Bullish" || ranked[0]?.sentiment === "Bullish"
  ? "Market showing bullish momentum. Large-cap leaders holding key technical levels."
  : ranked[0]?.sentiment === "Strongly Bearish" || ranked[0]?.sentiment === "Bearish"
  ? "Caution advised. Broad weakness in technicals — wait for confirmation before entering."
  : "Markets consolidating. Mixed signals — selective stock-picking approach recommended."}

**Quick strategy:**
- Enter near support levels
- Keep 7% hard stop-loss
- Don't fight the broader trend

⚠️ Educational only · Not financial advice`;
  }

  // ── MACD explanation ─────────────────────────────────────────────────────────
  if (lower.includes("macd")) {
    const examples = STOCKS.slice(0, 3).map((s) => {
      const lt = technicals[s.symbol];
      const macd = lt?.macd ?? s.macd;
      const sig = lt?.macdSignal ?? s.macdSignal;
      const status = macd > sig ? "🟢 Bullish" : "🔴 Bearish";
      return `- **${s.symbol}** · MACD ${macd.toFixed(2)} vs Signal ${sig.toFixed(2)} — ${status}`;
    }).join("\n");

    return `## MACD — Moving Average Convergence Divergence

MACD uses two EMAs (12-day and 26-day) to show momentum shifts:
- **MACD line > Signal line** → Bullish momentum → potential entry
- **MACD line < Signal line** → Bearish momentum → caution/exit
- **Histogram growing** → Momentum strengthening

**Live MACD readings:**
${examples}

**Best use:** Combine with RSI confirmation. MACD bullish crossover + RSI < 50 = strong entry signal.

⚠️ Educational only · Not financial advice`;
  }

  // ── EMA explanation ──────────────────────────────────────────────────────────
  if (lower.includes("ema") || lower.includes("moving average")) {
    const examples = STOCKS.slice(0, 3).map((s) => {
      const lt = technicals[s.symbol];
      const lq = quotes[s.symbol];
      const price = lq?.price ?? s.price;
      const ema20 = lt?.ema20 ?? s.ema20;
      const ema50 = lt?.ema50 ?? s.ema50;
      const ema200 = lt?.ema200 ?? s.ema200;
      const status = price > ema20 && ema20 > ema50 ? "🟢 Uptrend" : price < ema20 ? "🔴 Weak" : "⚪ Mixed";
      return `- **${s.symbol}** ₹${price.toLocaleString("en-IN", { maximumFractionDigits: 2 })} · EMA20 ₹${ema20.toFixed(0)} · EMA50 ₹${ema50.toFixed(0)} · EMA200 ₹${ema200?.toFixed(0) ?? "—"} — ${status}`;
    }).join("\n");

    return `## EMA — Exponential Moving Average

EMA gives more weight to recent prices, making it more responsive than SMA:
- **Price > EMA20 > EMA50** → Uptrend — bullish entry
- **Price < EMA20** → Short-term weakness
- **Price < EMA200** → Long-term bearish (don't fight it)
- **Golden Cross** (EMA50 crosses above EMA200) → Major buy signal

**Live EMA data:**
${examples}

⚠️ Educational only · Not financial advice`;
  }

  // ── Fallback: generic market overview ────────────────────────────────────────
  const topPick = STOCKS.map((s) => {
    const lt = technicals[s.symbol];
    const lq = quotes[s.symbol];
    const price = lq?.price ?? s.price;
    const rsi = lt?.rsi ?? s.rsi;
    const score = lt ? computeAIScore({ rsi, macd: lt.macd, macdSignal: lt.macdSignal, ema20: lt.ema20, ema50: lt.ema50, ema200: lt.ema200, trend: lt.trend, support: lt.support }, price) : s.aiScore;
    return { s, score };
  }).sort((a, b) => b.score - a.score)[0];

  const topLq = quotes[topPick?.s.symbol ?? ""];
  const topLt = technicals[topPick?.s.symbol ?? ""];
  const topSentiment = topLt?.sentiment ?? topPick?.s.sentiment ?? "Neutral";

  return `## TradeMind AI Analysis

**Your query:** "${input}"

${hasLiveData ? "**Live NSE Data Active**" : "⚠️ Loading live data…"}

**Top AI Pick right now:**
${topPick ? `**${topPick.s.symbol}** · AI Score ${topPick.score}/100 · ${topSentiment}
₹${(topLq?.price ?? topPick.s.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })} (${(topLq?.changePercent ?? topPick.s.changePercent) >= 0 ? "+" : ""}${(topLq?.changePercent ?? topPick.s.changePercent).toFixed(2)}%)` : "Loading…"}

**Try asking about:**
- A specific stock: "Analyze HDFC Bank" or "Should I buy RELIANCE?"
- Concepts: "What is RSI?", "Explain MACD", "How to use EMA?"
- Portfolio: "What should I buy today?"
- Screeners: "Best stocks under ₹1000"

⚠️ Educational only · Not financial advice`;
}

export default function AssistantPage() {
  const { messages, isLoading, addMessage, setLoading, clearChat } = useChatStore();
  const { quotes, technicals } = useLiveMarketStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const query = text ?? input.trim();
    if (!query || isLoading) return;
    setInput("");

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    addMessage(userMsg);
    setLoading(true);

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const aiMsg: AIMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: buildLiveResponse(query, quotes, technicals),
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    addMessage(aiMsg);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center shadow-glow-purple">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">TradeMind AI</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-market-bull rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">
                Active · {Object.keys(quotes).length > 0 ? "Live NSE data" : "Loading market data…"}
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-market-bear transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-purple/30 to-brand-blue/30 border border-brand-purple/20 flex items-center justify-center mb-6 shadow-glow-purple">
              <Brain className="w-10 h-10 text-brand-purple" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Ask TradeMind AI</h2>
            <p className="text-gray-400 text-sm max-w-md mb-10">
              Get AI-powered insights using live NSE prices, RSI, MACD, and EMA signals — all in plain English.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full">
              {AI_SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left p-4 rounded-xl glass glass-hover text-sm text-gray-300 hover:text-white border border-border hover:border-brand-purple/30 transition-all group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-purple mb-2 group-hover:text-brand-cyan transition-colors" />
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-brand-purple to-brand-blue"
                  : "bg-gradient-to-br from-brand-purple/30 to-brand-blue/30 border border-brand-purple/20"
              }`}>
                {msg.role === "user" ? (
                  <span className="text-xs font-bold text-white">U</span>
                ) : (
                  <Brain className="w-4 h-4 text-brand-purple" />
                )}
              </div>

              <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "chat-bubble-user text-white rounded-tr-sm"
                    : "chat-bubble-ai text-gray-200 rounded-tl-sm"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-bold prose-strong:text-white prose-code:text-brand-cyan">
                      <FormattedMessage content={msg.content} />
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                <div className={`flex items-center gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span className="text-xs text-gray-600">{msg.timestamp}</span>
                  {msg.role === "assistant" && (
                    <div className="flex gap-2">
                      <button className="text-gray-600 hover:text-white transition-colors">
                        <Copy className="w-3 h-3" />
                      </button>
                      <button className="text-gray-600 hover:text-market-bull transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-purple/30 to-brand-blue/30 border border-brand-purple/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-brand-purple" />
            </div>
            <div className="chat-bubble-ai rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-brand-purple/60 rounded-full"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6 flex-shrink-0">
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {AI_SUGGESTED_QUERIES.slice(0, 3).map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple/20 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-3 glass rounded-2xl p-3 border border-border focus-within:border-brand-purple/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any stock, market concept, or trading strategy..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none resize-none max-h-32"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-purple"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-700 mt-2">
          TradeMind AI · Live NSE data · For educational purposes only · Not financial advice
        </p>
      </div>
    </div>
  );
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} className="text-base font-bold text-white">{line.replace("## ", "")}</h3>;
        if (line.startsWith("---")) return <hr key={i} className="border-white/10" />;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold text-white">{line.replace(/\*\*/g, "")}</p>;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-brand-purple flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: line.replace(/^[•-] /, "").replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>") }} />
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>") }} />
        );
      })}
    </div>
  );
}
