export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: string;
  marketCapRaw: number;
  pe: number;
  eps: number;
  high52w: number;
  low52w: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  prevClose: number;
  sector: string;
  industry: string;
  exchange: "NSE" | "BSE";
  aiScore: number; // 0-100
  sentiment: "Strongly Bullish" | "Bullish" | "Neutral" | "Bearish" | "Strongly Bearish";
  rsi: number;
  macd: number;
  macdSignal: number;
  ema20: number;
  ema50: number;
  ema200: number;
  description: string;
  chartData: ChartPoint[];
  news: NewsItem[];
  technicals: TechnicalSummary;
}

export interface ChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
  url: string;
}

export interface TechnicalSummary {
  trend: "Uptrend" | "Downtrend" | "Sideways";
  support: number;
  resistance: number;
  buySignals: number;
  sellSignals: number;
  neutralSignals: number;
  strength: "Strong" | "Moderate" | "Weak";
}

export interface MarketIndex {
  name: string;
  displayName: string;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  chartData: { time: string; value: number }[];
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  allocation: number; // percentage of portfolio
}

export interface Trade {
  id: string;
  symbol: string;
  name: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  date: string;
  status: "EXECUTED" | "PENDING" | "CANCELLED";
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  stocks?: Stock[];
  chart?: ChartPoint[];
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  aiScore: number;
  sector: string;
}

export interface LearnTopic {
  id: string;
  title: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  description: string;
  icon: string;
  color: string;
  completed: boolean;
}

export interface PortfolioStats {
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
  cash: number;
  xirr: number;
  holdings: number;
}
