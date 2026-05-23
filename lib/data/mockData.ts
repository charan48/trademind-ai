import { Stock, MarketIndex, WatchlistItem, Trade, LearnTopic, PortfolioHolding, PortfolioStats } from "@/lib/types";
import { generateChartData, generateIntraday } from "@/lib/utils";

// ─── Indian Stocks ────────────────────────────────────────────────────────────
export const STOCKS: Stock[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    price: 2847.35,
    change: 45.20,
    changePercent: 1.61,
    volume: 8542310,
    avgVolume: 7200000,
    marketCap: "₹19.3L Cr",
    marketCapRaw: 19300000000000,
    pe: 28.4,
    eps: 100.26,
    high52w: 3024.90,
    low52w: 2220.30,
    dayHigh: 2858.70,
    dayLow: 2810.45,
    open: 2815.60,
    prevClose: 2802.15,
    sector: "Energy",
    industry: "Oil & Gas Refining",
    exchange: "NSE",
    aiScore: 87,
    sentiment: "Bullish",
    rsi: 62.4,
    macd: 18.5,
    macdSignal: 12.3,
    ema20: 2798.4,
    ema50: 2745.8,
    ema200: 2650.2,
    description: "Reliance Industries Limited is India's largest private sector corporation with businesses across energy, petrochemicals, retail, and telecommunications.",
    chartData: generateChartData(2847.35, 90, 0.018),
    news: [
      { id: "1", title: "Reliance Q3 profit rises 12% on strong Jio, Retail performance", source: "Economic Times", time: "2h ago", sentiment: "positive", summary: "Reliance Industries posted strong Q3 results with 12% profit growth driven by Jio and Retail segments.", url: "#" },
      { id: "2", title: "RIL acquires stake in renewable energy startup", source: "Mint", time: "5h ago", sentiment: "positive", summary: "Reliance expands green energy portfolio with new acquisition.", url: "#" },
      { id: "3", title: "Crude oil prices impact RIL margins", source: "Business Standard", time: "1d ago", sentiment: "negative", summary: "Rising crude prices may compress refining margins in Q4.", url: "#" },
    ],
    technicals: { trend: "Uptrend", support: 2780, resistance: 2920, buySignals: 8, sellSignals: 2, neutralSignals: 3, strength: "Strong" },
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    price: 3748.90,
    change: -32.45,
    changePercent: -0.86,
    volume: 4123680,
    avgVolume: 3800000,
    marketCap: "₹13.6L Cr",
    marketCapRaw: 13600000000000,
    pe: 31.2,
    eps: 120.15,
    high52w: 4255.65,
    low52w: 3311.00,
    dayHigh: 3795.40,
    dayLow: 3731.20,
    open: 3782.30,
    prevClose: 3781.35,
    sector: "IT",
    industry: "IT Services",
    exchange: "NSE",
    aiScore: 74,
    sentiment: "Neutral",
    rsi: 48.7,
    macd: -5.2,
    macdSignal: 2.1,
    ema20: 3768.5,
    ema50: 3810.3,
    ema200: 3750.1,
    description: "TCS is a global IT services, consulting and business solutions organization that has been partnering with the world's largest businesses for 50 years.",
    chartData: generateChartData(3748.90, 90, 0.016),
    news: [
      { id: "4", title: "TCS wins $1.5B deal with European bank", source: "CNBC TV18", time: "3h ago", sentiment: "positive", summary: "TCS secures mega deal strengthening European presence.", url: "#" },
      { id: "5", title: "IT sector faces headwinds from US slowdown", source: "Economic Times", time: "6h ago", sentiment: "negative", summary: "Analysts warn of demand softness in key US markets.", url: "#" },
    ],
    technicals: { trend: "Sideways", support: 3680, resistance: 3850, buySignals: 5, sellSignals: 5, neutralSignals: 3, strength: "Moderate" },
  },
  {
    symbol: "HDFC",
    name: "HDFC Bank Ltd",
    price: 1623.45,
    change: 28.90,
    changePercent: 1.81,
    volume: 12847350,
    avgVolume: 11000000,
    marketCap: "₹12.4L Cr",
    marketCapRaw: 12400000000000,
    pe: 18.7,
    eps: 86.82,
    high52w: 1794.00,
    low52w: 1363.55,
    dayHigh: 1631.20,
    dayLow: 1598.65,
    open: 1600.10,
    prevClose: 1594.55,
    sector: "Banking",
    industry: "Private Sector Bank",
    exchange: "NSE",
    aiScore: 91,
    sentiment: "Strongly Bullish",
    rsi: 67.8,
    macd: 22.4,
    macdSignal: 15.7,
    ema20: 1598.2,
    ema50: 1545.7,
    ema200: 1510.4,
    description: "HDFC Bank is India's largest private sector bank by assets. It offers a wide range of banking and financial services including banking, investment banking, insurance, and more.",
    chartData: generateChartData(1623.45, 90, 0.015),
    news: [
      { id: "6", title: "HDFC Bank NIM expands to 4.3% in Q3", source: "Bloomberg Quint", time: "1h ago", sentiment: "positive", summary: "HDFC Bank shows strong margin expansion beating analyst estimates.", url: "#" },
      { id: "7", title: "RBI grants HDFC Bank approval for new branch expansion", source: "Financial Express", time: "4h ago", sentiment: "positive", summary: "Bank to open 500+ new branches in tier-2 and tier-3 cities.", url: "#" },
    ],
    technicals: { trend: "Uptrend", support: 1580, resistance: 1680, buySignals: 10, sellSignals: 1, neutralSignals: 2, strength: "Strong" },
  },
  {
    symbol: "INFY",
    name: "Infosys Ltd",
    price: 1847.25,
    change: -18.60,
    changePercent: -1.00,
    volume: 6234780,
    avgVolume: 5800000,
    marketCap: "₹7.7L Cr",
    marketCapRaw: 7700000000000,
    pe: 26.3,
    eps: 70.24,
    high52w: 1974.80,
    low52w: 1351.35,
    dayHigh: 1872.30,
    dayLow: 1840.00,
    open: 1866.50,
    prevClose: 1865.85,
    sector: "IT",
    industry: "IT Services",
    exchange: "NSE",
    aiScore: 68,
    sentiment: "Neutral",
    rsi: 44.2,
    macd: -8.7,
    macdSignal: -4.1,
    ema20: 1858.4,
    ema50: 1882.1,
    ema200: 1750.6,
    description: "Infosys is a global leader in next-generation digital services and consulting. It provides consulting, technology, and outsourcing services.",
    chartData: generateChartData(1847.25, 90, 0.017),
    news: [
      { id: "8", title: "Infosys cuts FY24 revenue guidance citing weak demand", source: "Reuters", time: "2h ago", sentiment: "negative", summary: "Infosys reduces full-year outlook amid challenging IT environment.", url: "#" },
    ],
    technicals: { trend: "Downtrend", support: 1800, resistance: 1900, buySignals: 3, sellSignals: 7, neutralSignals: 3, strength: "Moderate" },
  },
  {
    symbol: "BAJFINANCE",
    name: "Bajaj Finance Ltd",
    price: 6842.70,
    change: 127.35,
    changePercent: 1.90,
    volume: 2134560,
    avgVolume: 1900000,
    marketCap: "₹4.2L Cr",
    marketCapRaw: 4200000000000,
    pe: 34.5,
    eps: 198.33,
    high52w: 8192.30,
    low52w: 6187.80,
    dayHigh: 6880.40,
    dayLow: 6735.25,
    open: 6750.00,
    prevClose: 6715.35,
    sector: "NBFC",
    industry: "Consumer Finance",
    exchange: "NSE",
    aiScore: 82,
    sentiment: "Bullish",
    rsi: 59.3,
    macd: 45.8,
    macdSignal: 30.2,
    ema20: 6780.3,
    ema50: 6620.5,
    ema200: 6450.8,
    description: "Bajaj Finance is one of India's largest non-banking financial companies, offering diverse financial products including consumer loans, SME lending, and deposits.",
    chartData: generateChartData(6842.70, 90, 0.022),
    news: [
      { id: "9", title: "Bajaj Finance AUM crosses ₹3 lakh crore milestone", source: "Moneycontrol", time: "30m ago", sentiment: "positive", summary: "Record AUM growth driven by strong consumer and SME lending.", url: "#" },
    ],
    technicals: { trend: "Uptrend", support: 6650, resistance: 7000, buySignals: 7, sellSignals: 3, neutralSignals: 3, strength: "Strong" },
  },
  {
    symbol: "WIPRO",
    name: "Wipro Ltd",
    price: 487.35,
    change: -5.40,
    changePercent: -1.10,
    volume: 8923450,
    avgVolume: 7500000,
    marketCap: "₹2.5L Cr",
    marketCapRaw: 2500000000000,
    pe: 22.1,
    eps: 22.05,
    high52w: 568.45,
    low52w: 395.20,
    dayHigh: 495.80,
    dayLow: 483.20,
    open: 492.50,
    prevClose: 492.75,
    sector: "IT",
    industry: "IT Services",
    exchange: "NSE",
    aiScore: 55,
    sentiment: "Bearish",
    rsi: 38.5,
    macd: -4.2,
    macdSignal: -1.8,
    ema20: 492.5,
    ema50: 505.8,
    ema200: 480.2,
    description: "Wipro is a global information technology, consulting and business process services company.",
    chartData: generateChartData(487.35, 90, 0.019),
    news: [
      { id: "10", title: "Wipro faces headcount pressure amid margin focus", source: "Economic Times", time: "4h ago", sentiment: "negative", summary: "Wipro continues cost optimization with selective hiring.", url: "#" },
    ],
    technicals: { trend: "Downtrend", support: 470, resistance: 510, buySignals: 2, sellSignals: 8, neutralSignals: 3, strength: "Weak" },
  },
  {
    symbol: "ADANIENT",
    name: "Adani Enterprises Ltd",
    price: 2420.80,
    change: 78.45,
    changePercent: 3.35,
    volume: 3847920,
    avgVolume: 3200000,
    marketCap: "₹2.8L Cr",
    marketCapRaw: 2800000000000,
    pe: 68.4,
    eps: 35.39,
    high52w: 3743.90,
    low52w: 1900.15,
    dayHigh: 2445.20,
    dayLow: 2362.50,
    open: 2370.00,
    prevClose: 2342.35,
    sector: "Conglomerate",
    industry: "Diversified",
    exchange: "NSE",
    aiScore: 63,
    sentiment: "Bullish",
    rsi: 58.7,
    macd: 32.6,
    macdSignal: 18.4,
    ema20: 2380.5,
    ema50: 2290.7,
    ema200: 2520.3,
    description: "Adani Enterprises is the flagship company of the Adani Group, engaged in businesses spanning energy, infrastructure, logistics, agri-business, and real estate.",
    chartData: generateChartData(2420.80, 90, 0.028),
    news: [
      { id: "11", title: "Adani Group wins ₹15,000 Cr airport upgrade contract", source: "Business Line", time: "1h ago", sentiment: "positive", summary: "Adani Group expands airport infrastructure portfolio.", url: "#" },
    ],
    technicals: { trend: "Uptrend", support: 2300, resistance: 2550, buySignals: 6, sellSignals: 4, neutralSignals: 3, strength: "Moderate" },
  },
  {
    symbol: "SBIN",
    name: "State Bank of India",
    price: 762.40,
    change: 15.65,
    changePercent: 2.09,
    volume: 22384750,
    avgVolume: 18000000,
    marketCap: "₹6.8L Cr",
    marketCapRaw: 6800000000000,
    pe: 10.2,
    eps: 74.75,
    high52w: 912.05,
    low52w: 625.60,
    dayHigh: 768.90,
    dayLow: 748.20,
    open: 750.00,
    prevClose: 746.75,
    sector: "Banking",
    industry: "Public Sector Bank",
    exchange: "NSE",
    aiScore: 79,
    sentiment: "Bullish",
    rsi: 61.2,
    macd: 12.8,
    macdSignal: 8.4,
    ema20: 748.5,
    ema50: 725.3,
    ema200: 698.7,
    description: "State Bank of India is the largest government-owned banking and financial services company in India by revenue, assets and market capitalisation.",
    chartData: generateChartData(762.40, 90, 0.02),
    news: [
      { id: "12", title: "SBI raises ₹10,000 Cr via bonds at competitive rates", source: "Mint", time: "3h ago", sentiment: "positive", summary: "SBI successfully raises capital to fund credit growth.", url: "#" },
    ],
    technicals: { trend: "Uptrend", support: 730, resistance: 800, buySignals: 7, sellSignals: 2, neutralSignals: 4, strength: "Strong" },
  },
];

// ─── Market Indices ───────────────────────────────────────────────────────────
export const INDICES: MarketIndex[] = [
  {
    name: "NIFTY50",
    displayName: "NIFTY 50",
    value: 22847.90,
    change: 187.45,
    changePercent: 0.83,
    high: 22915.60,
    low: 22680.30,
    open: 22712.50,
    prevClose: 22660.45,
    chartData: generateIntraday(22847.90).map(d => ({ time: d.time, value: d.value })),
  },
  {
    name: "SENSEX",
    displayName: "BSE SENSEX",
    value: 75623.57,
    change: 624.18,
    changePercent: 0.83,
    high: 75842.30,
    low: 75098.45,
    open: 75110.00,
    prevClose: 74999.39,
    chartData: generateIntraday(75623.57).map(d => ({ time: d.time, value: d.value })),
  },
  {
    name: "NIFTYIT",
    displayName: "NIFTY IT",
    value: 38247.65,
    change: -142.30,
    changePercent: -0.37,
    high: 38490.20,
    low: 38120.40,
    open: 38392.00,
    prevClose: 38389.95,
    chartData: generateIntraday(38247.65).map(d => ({ time: d.time, value: d.value })),
  },
  {
    name: "NIFTYBANK",
    displayName: "NIFTY BANK",
    value: 48923.40,
    change: 287.65,
    changePercent: 0.59,
    high: 49045.80,
    low: 48680.20,
    open: 48700.00,
    prevClose: 48635.75,
    chartData: generateIntraday(48923.40).map(d => ({ time: d.time, value: d.value })),
  },
];

// ─── Default Watchlist ────────────────────────────────────────────────────────
export const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2847.35, change: 45.20, changePercent: 1.61, aiScore: 87, sector: "Energy" },
  { symbol: "TCS", name: "Tata Consultancy", price: 3748.90, change: -32.45, changePercent: -0.86, aiScore: 74, sector: "IT" },
  { symbol: "HDFC", name: "HDFC Bank", price: 1623.45, change: 28.90, changePercent: 1.81, aiScore: 91, sector: "Banking" },
  { symbol: "INFY", name: "Infosys", price: 1847.25, change: -18.60, changePercent: -1.00, aiScore: 68, sector: "IT" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", price: 6842.70, change: 127.35, changePercent: 1.90, aiScore: 82, sector: "NBFC" },
  { symbol: "SBIN", name: "State Bank of India", price: 762.40, change: 15.65, changePercent: 2.09, aiScore: 79, sector: "Banking" },
];

// ─── Portfolio Holdings ───────────────────────────────────────────────────────
export const PORTFOLIO_HOLDINGS: PortfolioHolding[] = [
  { id: "1", symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", quantity: 10, avgBuyPrice: 2650.00, currentPrice: 2847.35, invested: 26500, currentValue: 28473.50, pnl: 1973.50, pnlPercent: 7.45, dayChange: 452.00, dayChangePercent: 1.61, allocation: 28.5 },
  { id: "2", symbol: "HDFC", name: "HDFC Bank", sector: "Banking", quantity: 15, avgBuyPrice: 1520.00, currentPrice: 1623.45, invested: 22800, currentValue: 24351.75, pnl: 1551.75, pnlPercent: 6.81, dayChange: 433.50, dayChangePercent: 1.81, allocation: 24.3 },
  { id: "3", symbol: "TCS", name: "Tata Consultancy", sector: "IT", quantity: 5, avgBuyPrice: 3900.00, currentPrice: 3748.90, invested: 19500, currentValue: 18744.50, pnl: -755.50, pnlPercent: -3.87, dayChange: -162.25, dayChangePercent: -0.86, allocation: 18.7 },
  { id: "4", symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC", quantity: 3, avgBuyPrice: 6200.00, currentPrice: 6842.70, invested: 18600, currentValue: 20528.10, pnl: 1928.10, pnlPercent: 10.37, dayChange: 382.05, dayChangePercent: 1.90, allocation: 20.5 },
  { id: "5", symbol: "SBIN", name: "State Bank of India", sector: "Banking", quantity: 20, avgBuyPrice: 720.00, currentPrice: 762.40, invested: 14400, currentValue: 15248.00, pnl: 848.00, pnlPercent: 5.89, dayChange: 313.00, dayChangePercent: 2.09, allocation: 15.2 },
];

export const PORTFOLIO_STATS: PortfolioStats = {
  totalInvested: 101800,
  currentValue: 107345.85,
  totalPnL: 5545.85,
  totalPnLPercent: 5.45,
  dayPnL: 1418.30,
  dayPnLPercent: 1.34,
  cash: 48654.15,
  xirr: 18.7,
  holdings: 5,
};

// ─── Trade History ────────────────────────────────────────────────────────────
export const TRADE_HISTORY: Trade[] = [
  { id: "t1", symbol: "RELIANCE", name: "Reliance Industries", type: "BUY", quantity: 10, price: 2650.00, total: 26500, date: "2024-01-15", status: "EXECUTED" },
  { id: "t2", symbol: "HDFC", name: "HDFC Bank", type: "BUY", quantity: 15, price: 1520.00, total: 22800, date: "2024-01-20", status: "EXECUTED" },
  { id: "t3", symbol: "TCS", name: "TCS", type: "BUY", quantity: 5, price: 3900.00, total: 19500, date: "2024-02-01", status: "EXECUTED" },
  { id: "t4", symbol: "INFY", name: "Infosys", type: "BUY", quantity: 8, price: 1780.00, total: 14240, date: "2024-02-10", status: "EXECUTED" },
  { id: "t5", symbol: "INFY", name: "Infosys", type: "SELL", quantity: 8, price: 1920.00, total: 15360, date: "2024-03-05", status: "EXECUTED" },
  { id: "t6", symbol: "BAJFINANCE", name: "Bajaj Finance", type: "BUY", quantity: 3, price: 6200.00, total: 18600, date: "2024-03-15", status: "EXECUTED" },
  { id: "t7", symbol: "SBIN", name: "SBI", type: "BUY", quantity: 20, price: 720.00, total: 14400, date: "2024-04-01", status: "EXECUTED" },
];

// ─── Top Gainers / Losers ─────────────────────────────────────────────────────
export const TOP_GAINERS = [
  { symbol: "ADANIENT", name: "Adani Enterprises", price: 2420.80, change: 78.45, changePercent: 3.35, volume: "38.5L" },
  { symbol: "SBIN", name: "State Bank of India", price: 762.40, change: 15.65, changePercent: 2.09, volume: "2.2Cr" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", price: 6842.70, change: 127.35, changePercent: 1.90, volume: "21.3L" },
  { symbol: "HDFC", name: "HDFC Bank", price: 1623.45, change: 28.90, changePercent: 1.81, volume: "1.3Cr" },
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2847.35, change: 45.20, changePercent: 1.61, volume: "85.4L" },
];

export const TOP_LOSERS = [
  { symbol: "WIPRO", name: "Wipro Ltd", price: 487.35, change: -5.40, changePercent: -1.10, volume: "89.2L" },
  { symbol: "INFY", name: "Infosys", price: 1847.25, change: -18.60, changePercent: -1.00, volume: "62.3L" },
  { symbol: "TCS", name: "TCS", price: 3748.90, change: -32.45, changePercent: -0.86, volume: "41.2L" },
  { symbol: "HCLTECH", name: "HCL Technologies", price: 1342.60, change: -9.80, changePercent: -0.73, volume: "28.7L" },
  { symbol: "TECHM", name: "Tech Mahindra", price: 1487.25, change: -7.20, changePercent: -0.48, volume: "19.4L" },
];

// ─── Learn Topics ─────────────────────────────────────────────────────────────
export const LEARN_TOPICS: LearnTopic[] = [
  { id: "1", title: "Candlestick Patterns", category: "Technical Analysis", difficulty: "Beginner", duration: "15 min", description: "Learn to read candlestick charts and identify key patterns like Doji, Hammer, Engulfing.", icon: "🕯️", color: "from-amber-500/20 to-orange-500/20", completed: true },
  { id: "2", title: "RSI - Relative Strength Index", category: "Technical Indicators", difficulty: "Beginner", duration: "12 min", description: "Understand RSI to identify overbought/oversold conditions and potential reversals.", icon: "📊", color: "from-blue-500/20 to-indigo-500/20", completed: true },
  { id: "3", title: "MACD - Moving Average Convergence Divergence", category: "Technical Indicators", difficulty: "Intermediate", duration: "18 min", description: "Master MACD to spot trend changes, momentum shifts, and trade signals.", icon: "📈", color: "from-purple-500/20 to-pink-500/20", completed: false },
  { id: "4", title: "Support & Resistance Levels", category: "Technical Analysis", difficulty: "Beginner", duration: "10 min", description: "Identify key price levels where stocks tend to reverse or consolidate.", icon: "🎯", color: "from-green-500/20 to-emerald-500/20", completed: false },
  { id: "5", title: "Moving Averages Explained", category: "Technical Indicators", difficulty: "Beginner", duration: "14 min", description: "Learn EMA, SMA and how crossovers generate buy/sell signals.", icon: "〰️", color: "from-cyan-500/20 to-teal-500/20", completed: false },
  { id: "6", title: "Long-Term Investing Strategy", category: "Strategy", difficulty: "Beginner", duration: "20 min", description: "Build wealth with compounding through long-term equity investing strategies.", icon: "⏳", color: "from-yellow-500/20 to-amber-500/20", completed: false },
  { id: "7", title: "Swing Trading Basics", category: "Strategy", difficulty: "Intermediate", duration: "22 min", description: "Capture short to medium term price swings using technical analysis.", icon: "🔄", color: "from-rose-500/20 to-red-500/20", completed: false },
  { id: "8", title: "Risk Management", category: "Strategy", difficulty: "Intermediate", duration: "16 min", description: "Protect your capital with stop losses, position sizing, and diversification.", icon: "🛡️", color: "from-slate-500/20 to-gray-500/20", completed: false },
  { id: "9", title: "Fundamental Analysis", category: "Fundamental", difficulty: "Intermediate", duration: "25 min", description: "Evaluate stocks using P/E ratio, EPS, ROE, and balance sheet analysis.", icon: "🔍", color: "from-violet-500/20 to-purple-500/20", completed: false },
  { id: "10", title: "IPO Investing Guide", category: "Beginner", difficulty: "Beginner", duration: "10 min", description: "Everything you need to know about investing in IPOs in India.", icon: "🚀", color: "from-orange-500/20 to-amber-500/20", completed: false },
  { id: "11", title: "Derivatives & Options", category: "Advanced", difficulty: "Advanced", duration: "35 min", description: "Introduction to futures and options trading in Indian markets.", icon: "⚡", color: "from-red-500/20 to-rose-500/20", completed: false },
  { id: "12", title: "Sector Rotation Strategy", category: "Strategy", difficulty: "Advanced", duration: "20 min", description: "Rotate capital between sectors based on economic cycles for superior returns.", icon: "🔃", color: "from-indigo-500/20 to-blue-500/20", completed: false },
];

// ─── AI Suggested Queries ─────────────────────────────────────────────────────
export const AI_SUGGESTED_QUERIES = [
  "Best swing trading stocks under ₹500",
  "Explain RSI in simple terms",
  "Should I hold Infosys right now?",
  "Top AI-related Indian stocks",
  "What is the difference between NIFTY 50 and SENSEX?",
  "How to read a candlestick chart?",
  "Best banking stocks for long-term investment",
  "Which stocks have strong support levels today?",
];

// ─── AI Responses (mock) ──────────────────────────────────────────────────────
export const AI_RESPONSES: Record<string, string> = {
  default: `I'm TradeMind AI, your intelligent stock market assistant. I can help you:

• **Analyze stocks** — technical & fundamental analysis
• **Discover opportunities** — top gainers, swing trades, value picks
• **Explain concepts** — RSI, MACD, candlesticks, and more
• **Track your portfolio** — performance, risk, rebalancing advice

What would you like to explore today?`,

  rsi: `## RSI (Relative Strength Index) — Explained Simply

RSI measures **momentum** — how fast and how much a stock price is changing.

**Scale: 0 to 100**
| RSI Value | Meaning | Action |
|-----------|---------|--------|
| Above 70 | 🔴 Overbought | Consider selling / avoid buying |
| 50–70 | 🟡 Bullish Zone | Price trending up |
| 30–50 | 🟡 Bearish Zone | Price trending down |
| Below 30 | 🟢 Oversold | Potential buy opportunity |

**Pro Tip:** RSI divergence (price going up but RSI going down) often signals a reversal before it happens.

**Current RSI readings:**
- RELIANCE: 62.4 (Bullish)
- HDFC Bank: 67.8 (Bullish)
- INFY: 44.2 (Neutral/Weak)`,

  swing: `## Best Swing Trading Stocks Under ₹500 (Today's AI Pick)

Based on technical analysis and momentum signals:

### 🟢 Strong Buy Signals
1. **SBIN** ₹762 — RSI 61, EMA20 > EMA50, strong volume surge
2. **WIPRO** ₹487 — Near strong support ₹470, RSI oversold bounce likely

### 🔵 Watch Zone
3. **BPCL** ₹480 — Breakout from 3-week consolidation
4. **TATAMOTORS** ₹436 — EV momentum, strong institutional buying

**Risk Management:**
- Keep stop-loss 3–5% below entry
- Target 8–15% profit in 5–15 trading days
- Never invest more than 5% portfolio in single swing trade

⚠️ *This is educational. Always do your own research.*`,
};
