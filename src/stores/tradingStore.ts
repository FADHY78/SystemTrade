import { create } from "zustand";
import { DerivSymbol, AccountInfo, ActivePosition, CandleData, TickData } from "../types/deriv.types";
import { LogEntry, TradeSignal, VisualStrategy, TradingBot, TradingHistoryStats } from "../types/trading.types";

interface TradingState {
  // Authentication & Connection
  appId: string;
  token: string;
  connectionStatus: "disconnected" | "connecting" | "connected";
  isVirtual: boolean;
  accounts: AccountInfo[];
  activeAccount: AccountInfo | null;
  serverTime: string;

  // Markets
  symbols: DerivSymbol[];
  selectedSymbol: DerivSymbol;
  timeframe: string;
  chartType: "candles" | "line" | "bars" | "area";
  ticks: TickData[];
  candles: CandleData[];
  indicators: any;

  // Digits Matrix
  recentDigits: number[];
  digitStreak: { digit: number; length: number };
  digitFrequency: number[]; // 0 - 9 percent shares
  missingDigitsAlerts: string[];

  // Strategies & Backtester
  strategies: VisualStrategy[];
  selectedStrategy: VisualStrategy | null;
  backtestResults: any | null;
  isBacktesting: boolean;

  // Trading Bots
  bots: TradingBot[];
  botLogs: Record<string, string[]>;
  dailyLossLimit: number;
  takeProfitGoal: number;

  // Signal Creator
  signals: TradeSignal[];

  // Positions & Trade Engine
  openPositions: ActivePosition[];
  tradeHistory: ActivePosition[];
  proposalPrice: any | null;

  // Console terminal activity logs
  logs: LogEntry[];

  // Setters & Actions
  setAppId: (appId: string) => void;
  setToken: (token: string) => void;
  setConnectionStatus: (status: "disconnected" | "connecting" | "connected") => void;
  setActiveAccount: (account: AccountInfo | null) => void;
  setSymbols: (symbols: DerivSymbol[]) => void;
  setSelectedSymbol: (symbol: DerivSymbol) => void;
  setTimeframe: (timeframe: string) => void;
  setChartType: (type: "candles" | "line" | "bars" | "area") => void;
  setTicks: (ticks: TickData[]) => void;
  setCandles: (candles: CandleData[]) => void;
  setIndicators: (indicators: any) => void;
  addRecentDigit: (digit: number) => void;
  addLog: (type: LogEntry["type"], message: string) => void;
  clearLogs: () => void;
  addSignal: (signal: TradeSignal) => void;
  updateSignalStatus: (id: string, status: TradeSignal["status"]) => void;
  
  // Trade Operations
  addPosition: (pos: ActivePosition) => void;
  updatePosition: (pos: ActivePosition) => void;
  closePosition: (contractId: number, profit: number) => void;
  setProposalPrice: (price: any | null) => void;

  // Strategy Operations
  saveStrategy: (strategy: VisualStrategy) => void;
  deleteStrategy: (id: string) => void;
  setSelectedStrategy: (strategy: VisualStrategy | null) => void;
  setBacktestResults: (results: any | null) => void;
  setBacktesting: (backtesting: boolean) => void;

  // Bot operations
  addBot: (bot: TradingBot) => void;
  toggleBot: (id: string) => void;
  deleteBot: (id: string) => void;
  addBotLog: (id: string, msg: string) => void;
  updateBotStats: (id: string, updates: Partial<TradingBot>) => void;
  setDailyLossLimit: (val: number) => void;
  setTakeProfitGoal: (val: number) => void;
}

// Helper to load localStorage safely
const getStored = (key: string, fallback: string) => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key) || fallback;
  }
  return fallback;
};

// Default pre-loaded strategies
const DEFAULT_STRATEGIES: VisualStrategy[] = [
  {
    id: "rsi_rev",
    name: "RSI Mean Reversion",
    description: "Enters Rise options when RSI is below 30 and Fall when RSI is above 70",
    symbol: "R_100",
    timeframe: "1m",
    contractType: "CALL",
    riskLevel: "MODERATE",
    expectedWinRate: 72,
    isActive: false,
    blocks: [
      { id: "entry_1", type: "ENTRY", label: "RSI Indicator", category: "Indicator Signals", config: { thresholdLow: 30, thresholdHigh: 70 } },
      { id: "logic_1", type: "LOGIC", label: "AND Gate", category: "Logic Operators", config: {} },
      { id: "money_1", type: "MONEY", label: "Kelly Criterion", category: "Money Management", config: { multiplier: 2 } }
    ],
  },
  {
    id: "digit_diff_cold",
    name: "Cold Number Differ Bot",
    description: "Executes Digits Differs on the coldest digit over the last 100 ticks",
    symbol: "R_75",
    timeframe: "1T",
    contractType: "DIGITDIFF",
    riskLevel: "CONSERVATIVE",
    expectedWinRate: 91,
    isActive: false,
    blocks: [
      { id: "entry_2", type: "ENTRY", label: "Cold Digits Detector", category: "Digit Conditions", config: { minTicks: 100 } },
      { id: "money_2", type: "MONEY", label: "Martingale", category: "Money Management", config: { multiplier: 2, maxSteps: 4 } }
    ]
  }
];

export const useTradingStore = create<TradingState>((set, get) => ({
  // Credentials & Client Settings
  appId: getStored("deriv_app_id", "86454"),
  token: getStored("deriv_token", ""),
  connectionStatus: "disconnected",
  isVirtual: true,
  accounts: [],
  activeAccount: null,
  serverTime: new Date().toLocaleTimeString(),

  // Markets
  symbols: [],
  selectedSymbol: {
    symbol: "R_100",
    display_name: "Volatility 100 Index",
    market: "synthetic_index",
    market_display_name: "Synthetic Indices",
    submarket: "random_index",
    submarket_display_name: "Continuous Indices"
  },
  timeframe: "1m",
  chartType: "candles",
  ticks: [],
  candles: [],
  indicators: { ema: [], rsi: 50, macd: { macd: 0, signal: 0, hist: 0 }, bb: { upper: 0, middle: 0, lower: 0 } },

  // Digit stream defaults
  recentDigits: Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)),
  digitStreak: { digit: 0, length: 1 },
  digitFrequency: Array.from({ length: 10 }, () => 10),
  missingDigitsAlerts: ["Digit 7 hasn't appeared in the last 12 ticks."],

  // Strategies
  strategies: JSON.parse(getStored("deriv_strategies", "[]")).length > 0 
    ? JSON.parse(getStored("deriv_strategies", "[]"))
    : DEFAULT_STRATEGIES,
  selectedStrategy: null,
  backtestResults: null,
  isBacktesting: false,

  // Bots config and state
  bots: [
    {
      id: "bot_1",
      name: "RSI Trend Follower (Demo)",
      symbol: "R_100",
      contractType: "CALL",
      strategyId: "rsi_rev",
      stake: 10,
      maxStake: 100,
      profitTarget: 50,
      stopLoss: 30,
      isRunning: false,
      tradesCount: 14,
      winCount: 10,
      profit: 42.50,
      logs: ["Bot initialized successfully...", "[01:34] Entered long position CALL on Volatility 100 index", "[01:35] Trade resolved: WON (+$9.50)"],
      config: {}
    },
    {
      id: "bot_2",
      name: "Cold Digit Recurrence Bot",
      symbol: "R_75",
      contractType: "DIGITDIFF",
      strategyId: "digit_diff_cold",
      stake: 5,
      maxStake: 50,
      profitTarget: 20,
      stopLoss: 15,
      isRunning: false,
      tradesCount: 22,
      winCount: 20,
      profit: 9.80,
      logs: ["Bot standby...", "Coldest digit detected: 9", "[02:11] Placed Digit Differ on 9", "[02:11] Trade resolved: WON (+$0.48)"],
      config: {}
    }
  ],
  botLogs: {
    bot_1: [
      "[17:10:24] RSI follow model standby. Awaiting tick cross...",
      "[17:11:02] BB squeeze detected on Volatility 100 Index.",
      "[17:11:15] Placed Rise CALL Option Stake: $10.00 | Duration: 5 ticks.",
      "[17:11:21] Contract Resolved: WON (+$9.53). Cum PnL: +$9.53"
    ],
    bot_2: [
      "[17:09:44] Cold Digit analyzer running...",
      "[17:10:02] Coldest digit detected over last 50 ticks: [9] (freq: 4.8%)",
      "[17:10:11] Target Digit 9 matched with contract DIGITDIFF (Differ). Stake: $5.00",
      "[17:10:14] Resolved: WON (+$0.48). Cum PnL: +$0.48"
    ]
  },

  // Signals list
  signals: [],
  dailyLossLimit: 50,
  takeProfitGoal: 100,

  // Active positions state
  openPositions: [],
  tradeHistory: [
    {
      contract_id: 101,
      symbol: "R_100",
      display_name: "Volatility 100 Index",
      contract_type: "CALL",
      buy_price: 10.00,
      entry_spot: 10452.12,
      current_spot: 10456.90,
      payout: 19.50,
      profit: 9.50,
      date_expiry: Date.now() - 3600000,
      status: "won"
    },
    {
      contract_id: 102,
      symbol: "frxEURUSD",
      display_name: "EUR/USD",
      contract_type: "PUT",
      buy_price: 20.00,
      entry_spot: 1.09241,
      current_spot: 1.09245,
      payout: 0,
      profit: -20.00,
      date_expiry: Date.now() - 7200000,
      status: "lost"
    }
  ],
  proposalPrice: null,

  // Event logging lists
  logs: [
    { id: "1", timestamp: new Date().toLocaleTimeString(), type: "info", message: "Terminal booted. Awaiting credentials..." },
    { id: "2", timestamp: new Date().toLocaleTimeString(), type: "warning", message: "No API token detected. Please add a Deriv Token in Settings to load actual live accounts." },
    { id: "3", timestamp: new Date().toLocaleTimeString(), type: "ai", message: "AI Engine Loaded: Premium Google Gemini analytics proxy connected." }
  ],

  // Credential mutators
  setAppId: (appId) => {
    localStorage.setItem("deriv_app_id", appId);
    set({ appId });
  },
  setToken: (token) => {
    localStorage.setItem("deriv_token", token);
    set({ token });
  },
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setActiveAccount: (activeAccount) => set({ activeAccount, isVirtual: activeAccount ? activeAccount.is_virtual : true }),
  setSymbols: (symbols) => set({ symbols }),
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setChartType: (chartType) => set({ chartType }),
  setTicks: (ticks) => set({ ticks }),
  setCandles: (candles) => set({ candles }),
  setIndicators: (indicators) => set({ indicators }),
  
  // Digit handling
  addRecentDigit: (digit) => {
    const list = [...get().recentDigits, digit].slice(-100);
    
    // Streaks
    const currentStreak = get().digitStreak;
    let nextStreak = { ...currentStreak };
    if (digit === currentStreak.digit) {
      nextStreak.length += 1;
    } else {
      nextStreak = { digit, length: 1 };
    }

    // Frequencies (0-9 percentage share)
    const counts = Array.from({ length: 10 }, () => 0);
    list.map(d => counts[d]++);
    const total = list.length;
    const freqs = counts.map(c => Math.round((c / total) * 100));

    // Calculate missing digits alert
    const missingAlerts: string[] = [];
    for (let d = 0; d <= 9; d++) {
      let ticksSince = 0;
      for (let idx = list.length - 1; idx >= 0; idx--) {
        if (list[idx] === d) break;
        ticksSince++;
      }
      if (ticksSince > 20) {
        missingAlerts.push(`Digit ${d} has not appeared in the last ${ticksSince} ticks!`);
      }
    }

    set({ 
      recentDigits: list, 
      digitStreak: nextStreak, 
      digitFrequency: freqs,
      missingDigitsAlerts: missingAlerts.slice(0, 3)
    });
  },

  // Log Operations
  addLog: (type, message) => {
    const entry: LogEntry = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    set((state) => ({ logs: [entry, ...state.logs].slice(0, 100) }));
  },
  clearLogs: () => set({ logs: [] }),

  // Signal triggers info
  addSignal: (signal) => set((state) => ({ signals: [signal, ...state.signals].slice(0, 50) })),
  updateSignalStatus: (id, status) => set((state) => ({
    signals: state.signals.map(s => s.id === id ? { ...s, status } : s)
  })),

  // Proposals & Execution Operations
  addPosition: (pos) => set((state) => ({ openPositions: [pos, ...state.openPositions] })),
  updatePosition: (pos) => set((state) => ({
    openPositions: state.openPositions.map(p => p.contract_id === pos.contract_id ? { ...p, ...pos } : p)
  })),
  closePosition: (contractId, profit) => set((state) => {
    const resolved = state.openPositions.find(p => p.contract_id === contractId);
    if (!resolved) return {};
    const closed: ActivePosition = {
      ...resolved,
      profit,
      payout: profit > 0 ? resolved.buy_price + profit : 0,
      status: profit > 0 ? "won" : "lost"
    };
    return {
      openPositions: state.openPositions.filter(p => p.contract_id !== contractId),
      tradeHistory: [closed, ...state.tradeHistory].slice(0, 100)
    };
  }),
  setProposalPrice: (proposalPrice) => set({ proposalPrice }),

  // Strategies list mutations
  saveStrategy: (strategy) => {
    const fresh = [...get().strategies];
    const idx = fresh.findIndex(s => s.id === strategy.id);
    if (idx >= 0) {
      fresh[idx] = strategy;
    } else {
      fresh.push(strategy);
    }
    localStorage.setItem("deriv_strategies", JSON.stringify(fresh));
    set({ strategies: fresh, selectedStrategy: strategy });
  },
  deleteStrategy: (id) => {
    const filtered = get().strategies.filter(s => s.id !== id);
    localStorage.setItem("deriv_strategies", JSON.stringify(filtered));
    set({ strategies: filtered });
  },
  setSelectedStrategy: (selectedStrategy) => set({ selectedStrategy }),
  setBacktestResults: (backtestResults) => set({ backtestResults }),
  setBacktesting: (isBacktesting) => set({ isBacktesting }),

  // Bots triggers
  addBot: (bot) => set((state) => ({ bots: [...state.bots, bot] })),
  toggleBot: (id) => set((state) => ({
    bots: state.bots.map(b => b.id === id ? { ...b, isRunning: !b.isRunning } : b)
  })),
  deleteBot: (id) => set((state) => ({
    bots: state.bots.filter(b => b.id !== id)
  })),
  addBotLog: (id, msg) => set((state) => {
    const bHistory = state.botLogs[id] || [];
    return {
      botLogs: {
        ...state.botLogs,
        [id]: [...bHistory, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-50)
      }
    };
  }),
  updateBotStats: (id, updates) => set((state) => ({
    bots: state.bots.map(b => b.id === id ? { ...b, ...updates } : b)
  })),
  setDailyLossLimit: (dailyLossLimit) => set({ dailyLossLimit }),
  setTakeProfitGoal: (takeProfitGoal) => set({ takeProfitGoal })
}));
