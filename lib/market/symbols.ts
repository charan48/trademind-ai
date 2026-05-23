// Internal symbol → Yahoo Finance NSE symbol
export const STOCK_SYMBOLS: Record<string, string> = {
  RELIANCE:   "RELIANCE.NS",
  TCS:        "TCS.NS",
  HDFC:       "HDFCBANK.NS",
  INFY:       "INFY.NS",
  BAJFINANCE: "BAJFINANCE.NS",
  WIPRO:      "WIPRO.NS",
  ADANIENT:   "ADANIENT.NS",
  SBIN:       "SBIN.NS",
};

// Index display name → Yahoo Finance symbol
export const INDEX_SYMBOLS: Record<string, string> = {
  "NIFTY 50":   "^NSEI",
  "BSE SENSEX": "^BSESN",
  "NIFTY IT":   "^CNXIT",
  "NIFTY BANK": "^NSEBANK",
};

export const ALL_STOCK_YF = Object.values(STOCK_SYMBOLS);
export const ALL_INDEX_YF = Object.values(INDEX_SYMBOLS);
export const ALL_YF = [...ALL_STOCK_YF, ...ALL_INDEX_YF];

export function toYF(symbol: string): string {
  return STOCK_SYMBOLS[symbol] ?? `${symbol}.NS`;
}

export function fromYF(yfSymbol: string): string {
  // Stock reverse lookup
  const stockEntry = Object.entries(STOCK_SYMBOLS).find(([, v]) => v === yfSymbol);
  if (stockEntry) return stockEntry[0];
  // Index reverse lookup
  const idxEntry = Object.entries(INDEX_SYMBOLS).find(([, v]) => v === yfSymbol);
  if (idxEntry) return idxEntry[0];
  return yfSymbol.replace(".NS", "").replace("^", "");
}
