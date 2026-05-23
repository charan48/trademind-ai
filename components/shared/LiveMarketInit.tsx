"use client";

import { useLiveMarket } from "@/lib/hooks/useLiveMarket";

// Invisible — mounts once in dashboard layout to start live price polling
export function LiveMarketInit() {
  useLiveMarket();
  return null;
}
