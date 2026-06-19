import { DerivContractType } from "./deriv.types";

export interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "ai" | "trade";
  message: string;
}

export interface TradeSignal {
  id: string;
  symbol: string;
  display_name: string;
  contract_type: DerivContractType;
  direction: "BUY" | "SELL" | "HOLD";
  timeframe: string;
  confidence: number;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  rationale: string;
  timestamp: string;
  status: "pending" | "won" | "lost" | "ignored";
}

// Strategy Builder Blocks
export type BlockType = "ENTRY" | "LOGIC" | "CONTRACT" | "MANAGEMENT" | "MONEY";

export interface StrategyBlock {
  id: string;
  type: BlockType;
  label: string;
  category: string;
  config: Record<string, any>;
}

export interface VisualStrategy {
  id: string;
  name: string;
  description: string;
  symbol: string;
  timeframe: string;
  contractType: DerivContractType;
  blocks: StrategyBlock[];
  riskLevel: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
  expectedWinRate: number;
  isActive: boolean;
  code?: string; // Standard TypeScript or custom strategy compiled JS
}

export interface TradingBot {
  id: string;
  name: string;
  symbol: string;
  contractType: DerivContractType;
  strategyId: string; // "rsi_rev", "ema_cross", "martingale", "custom", etc.
  stake: number;
  maxStake: number;
  profitTarget: number;
  stopLoss: number;
  isRunning: boolean;
  tradesCount: number;
  winCount: number;
  profit: number;
  logs: string[];
  config: {
    multiplier?: number;
    digitsValue?: number;
    durationTicks?: number;
    growthRate?: number;
    cancellationPeriod?: string;
    baseStake?: number;
  };
  phase?: "idle" | "analyzing" | "proposal" | "buying" | "trading" | "cooldown";
}

export interface MarketStats {
  volatility: number; // calculated from tick fluctuation
  sentiment: "BULLISH" | "BEARISH" | "RANGING";
  sentimentScore: number; // 0 - 100
  correlation: Record<string, number>;
}

export interface TradingHistoryStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
  maxWinStreak: number;
  maxLossStreak: number;
}
