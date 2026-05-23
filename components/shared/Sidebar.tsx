"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Briefcase, Bot, BookOpen,
  Settings, HelpCircle, Zap, ChevronLeft, ChevronRight,
  Star, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/store";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stock/RELIANCE", label: "Markets", icon: TrendingUp },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/assistant", label: "AI Assistant", icon: Bot, badge: "AI" },
  { href: "/learn", label: "Learn", icon: BookOpen },
];

const BOTTOM_NAV = [
  { href: "#", label: "Notifications", icon: Bell },
  { href: "#", label: "Settings", icon: Settings },
  { href: "#", label: "Help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 220 : 64 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-full bg-bg-secondary border-r border-border z-40 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center shadow-glow-purple">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 min-w-max"
            >
              <span className="text-base font-bold gradient-text">TradeMind</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-brand-purple/20 text-brand-purple font-semibold border border-brand-purple/30">AI</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href.split("/")[1] ? `/${href.split("/")[1]}` : href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                active
                  ? "bg-brand-purple/15 text-brand-purple border border-brand-purple/25"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {badge && !sidebarOpen && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-purple rounded-full" />
                )}
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between flex-1 min-w-max"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    {badge && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-brand-purple/20 text-brand-purple font-semibold border border-brand-purple/30">
                        {badge}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {sidebarOpen && (
          <div className="pt-4">
            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 mb-2">Market</p>
          </div>
        )}

        {/* Quick stock links */}
        {sidebarOpen && (
          <div className="space-y-1">
            {["RELIANCE", "TCS", "HDFC", "INFY"].map((sym) => (
              <Link
                key={sym}
                href={`/stock/${sym}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <Star className="w-3 h-3" />
                {sym}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-border py-3 px-2 space-y-1 flex-shrink-0">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium min-w-max">{label}</span>}
          </Link>
        ))}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all"
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm min-w-max">Collapse</span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
