"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, BookOpen, ChevronRight, Trophy, Flame } from "lucide-react";
import { LEARN_TOPICS } from "@/lib/data/mockData";
import { LearnTopic } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

const CATEGORIES = ["All", "Technical Analysis", "Technical Indicators", "Strategy", "Fundamental", "Beginner", "Advanced"];

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: "text-market-bull bg-market-bull/10 border-market-bull/20",
  Intermediate: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Advanced: "text-market-bear bg-market-bear/10 border-market-bear/20",
};

function TopicCard({ topic }: { topic: LearnTopic }) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "relative p-5 rounded-2xl bg-gradient-to-br border cursor-pointer transition-all",
        topic.color,
        topic.completed ? "border-market-bull/30" : "border-white/8 hover:border-white/15"
      )}
    >
      {topic.completed && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-5 h-5 text-market-bull" />
        </div>
      )}

      <div className="text-3xl mb-3">{topic.icon}</div>

      <div className="flex items-center gap-2 mb-2">
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", DIFFICULTY_COLOR[topic.difficulty])}>
          {topic.difficulty}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {topic.duration}
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-1.5">{topic.title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed mb-4">{topic.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{topic.category}</span>
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
          topic.completed ? "bg-market-bull/20" : "bg-white/5 hover:bg-brand-purple/20"
        )}>
          <ChevronRight className={cn("w-4 h-4", topic.completed ? "text-market-bull" : "text-gray-400")} />
        </div>
      </div>
    </motion.div>
  );
}

const LEARN_LESSON_PREVIEW = {
  "RSI - Relative Strength Index": {
    concept: "RSI measures the speed and magnitude of price changes to identify overbought or oversold conditions.",
    visual: [
      { label: "Overbought Zone (70+)", color: "#EF4444", range: "70-100", action: "Consider Selling" },
      { label: "Neutral Zone", color: "#F59E0B", range: "30-70", action: "Hold / Watch" },
      { label: "Oversold Zone (<30)", color: "#10B981", range: "0-30", action: "Consider Buying" },
    ],
  },
};

export default function LearnPage() {
  const [category, setCategory] = useState("All");
  const [activeTopic, setActiveTopic] = useState<LearnTopic | null>(null);

  const filtered = category === "All" ? LEARN_TOPICS : LEARN_TOPICS.filter((t) => t.category === category || t.difficulty === category);
  const completed = LEARN_TOPICS.filter((t) => t.completed).length;
  const progress = Math.round((completed / LEARN_TOPICS.length) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Learn Markets</h1>
          <p className="text-sm text-gray-400">Master stock market concepts step by step</p>
        </div>

        {/* Progress */}
        <div className="glass rounded-xl px-5 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-purple" />
            <div>
              <p className="text-xs text-gray-500">Progress</p>
              <p className="text-sm font-bold text-white">{completed}/{LEARN_TOPICS.length} lessons</p>
            </div>
          </div>
          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan rounded-full"
            />
          </div>
          <span className="text-sm font-bold gradient-text">{progress}%</span>
        </div>
      </motion.div>

      {/* Streak */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 flex items-center gap-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 border border-orange-500/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Learning Streak</p>
            <p className="text-2xl font-black text-white">7 Days 🔥</p>
          </div>
        </div>
        <div className="flex-1 hidden sm:block">
          <p className="text-sm text-gray-400">Keep it up! You're on a 7-day streak. Complete 1 lesson today to extend it.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Next milestone</p>
          <p className="text-sm font-semibold text-brand-purple">14 Day Streak 🏆</p>
        </div>
      </motion.div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              category === cat
                ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30"
                : "text-gray-400 hover:text-white bg-white/3 hover:bg-white/8 border border-border"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lesson Modal */}
      {activeTopic && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setActiveTopic(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-bg-secondary border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="text-4xl mb-3">{activeTopic.icon}</div>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", DIFFICULTY_COLOR[activeTopic.difficulty])}>
                {activeTopic.difficulty}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" /> {activeTopic.duration}
              </div>
            </div>
            <h2 className="text-xl font-black text-white mb-2">{activeTopic.title}</h2>
            <p className="text-sm text-gray-400 mb-5">{activeTopic.description}</p>

            {LEARN_LESSON_PREVIEW[activeTopic.title as keyof typeof LEARN_LESSON_PREVIEW] && (
              <div className="space-y-3 mb-5">
                <p className="text-sm text-gray-300">
                  {LEARN_LESSON_PREVIEW[activeTopic.title as keyof typeof LEARN_LESSON_PREVIEW].concept}
                </p>
                {LEARN_LESSON_PREVIEW[activeTopic.title as keyof typeof LEARN_LESSON_PREVIEW].visual.map((v) => (
                  <div key={v.label} className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: v.color }} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-white">{v.label}</p>
                      <p className="text-xs text-gray-500">RSI: {v.range}</p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: v.color }}>{v.action}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Start Lesson
              </button>
              <button
                onClick={() => setActiveTopic(null)}
                className="px-4 py-3 rounded-xl glass border border-border text-gray-400 hover:text-white text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Topics grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {filtered.map((topic, i) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setActiveTopic(topic)}
          >
            <TopicCard topic={topic} />
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-purple/20 border border-brand-purple/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-brand-purple" />
          </div>
          <div>
            <p className="font-bold text-white">Have a concept question?</p>
            <p className="text-sm text-gray-400">Ask TradeMind AI to explain any topic in simple terms</p>
          </div>
        </div>
        <a
          href="/assistant"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue text-white text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Ask AI Assistant →
        </a>
      </motion.div>
    </div>
  );
}
