"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { StockTicker } from "@/components/shared/StockTicker";
import { NotificationSettings } from "@/components/shared/NotificationSettings";
import { AlertScheduler } from "@/components/shared/AlertScheduler";
import { useUIStore } from "@/lib/store/store";
import { motion } from "framer-motion";
import { Search, User, Menu } from "lucide-react";
import { useEffect, useState } from "react";

function useMarketOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const check = () => {
      const d = new Date();
      const day = d.getDay();
      if (day === 0 || day === 6) { setOpen(false); return; }
      const mins = d.getHours() * 60 + d.getMinutes();
      setOpen(mins >= 9 * 60 + 15 && mins < 15 * 60 + 30);
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);
  return open;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const marketOpen = useMarketOpen();

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <AlertScheduler />
      <Sidebar />

      {/* Main content */}
      <motion.div
        animate={{ marginLeft: sidebarOpen ? 220 : 64 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
      >
        {/* Top bar */}
        <header className="h-14 bg-bg-secondary border-b border-border flex items-center justify-between px-6 flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-white/5 border border-border rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search stocks, indices..."
                className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none flex-1"
              />
              <kbd className="text-xs text-gray-600">⌘K</kbd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              marketOpen
                ? "bg-market-bull/10 border-market-bull/20"
                : "bg-market-bear/10 border-market-bear/20"
            }`}>
              <span className={`w-2 h-2 rounded-full ${marketOpen ? "bg-market-bull animate-pulse" : "bg-market-bear"}`} />
              <span className={`text-xs font-semibold ${marketOpen ? "text-market-bull" : "text-market-bear"}`}>
                {marketOpen ? "Market Open" : "Market Closed"}
              </span>
            </div>
            <NotificationSettings />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center cursor-pointer">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

        <StockTicker />

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
