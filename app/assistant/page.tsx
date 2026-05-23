"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Brain, Send, Sparkles, Trash2, Copy, ThumbsUp } from "lucide-react";
import { useChatStore } from "@/lib/store/store";
import { AI_SUGGESTED_QUERIES, AI_RESPONSES } from "@/lib/data/mockData";
import { AIMessage } from "@/lib/types";

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("rsi") || lower.includes("relative strength")) return AI_RESPONSES.rsi;
  if (lower.includes("swing") || lower.includes("under ₹500") || lower.includes("under 500")) return AI_RESPONSES.swing;
  return `## AI Analysis: "${input}"

Based on current market conditions and technical indicators:

**Market Overview:**
The Indian equity markets are showing mixed signals today. NIFTY 50 is up **+0.83%** at 22,847 while IT sector faces minor headwinds.

**Relevant Stocks to Watch:**
- **HDFC Bank** — AI Score 91 · Strongly Bullish · RSI 67.8
- **Reliance Industries** — AI Score 87 · Bullish · Strong EMA breakout
- **Bajaj Finance** — AI Score 82 · Bullish · AUM record growth

**Key Insight:**
Focus on large-cap financials and energy stocks in the current market environment. Banking sector shows strong momentum with NIM expansion and credit growth.

**Risk Note:** Always invest based on your risk tolerance. This is educational content, not financial advice.

*Want me to do a deep dive on any specific stock?*`;
}

export default function AssistantPage() {
  const { messages, isLoading, addMessage, setLoading, clearChat } = useChatStore();
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

    // Simulate AI thinking delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));

    const aiMsg: AIMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: getAIResponse(query),
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
              <span className="text-xs text-gray-400">Active · Powered by Claude</span>
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
              Get AI-powered stock insights, learn market concepts, and discover trading opportunities — all in plain English.
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
              {/* Avatar */}
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

              {/* Bubble */}
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

        {/* Typing indicator */}
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
          TradeMind AI · For educational purposes only · Not financial advice
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
