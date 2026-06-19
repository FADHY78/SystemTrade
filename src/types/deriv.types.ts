export interface DerivSymbol {
  symbol: string;
  display_name: string;
  market: string;
  market_display_name: string;
  submarket: string;
  submarket_display_name: string;
}

export type ContractCategory = 
  | "options" 
  | "digits" 
  | "multipliers" 
  | "accumulators" 
  | "vanillas" 
  | "turbos";

export type DerivContractType =
  // Options
  | "CALL" | "PUT" // Rise/Fall
  | "CALL_BARRIER" | "PUT_BARRIER" // Higher/Lower
  | "ONETOUCH" | "NOTOUCH" // Touch/No Touch
  | "EXPIRYMISS" | "EXPIRYRANGE" // Stays Between/Goes Outside
  | "RANGE" | "UPORDOWN" // In Range / Out of Range
  | "ASIANU" | "ASIAND" // Asian
  | "LBHC" | "LBCL" | "LBHL" // Lookbacks
  | "RESETCALL" | "RESETPUT" // Reset Options
  | "RUNHIGH" | "RUNLOW" // Sprint Markets
  | "TICKHIGH" | "TICKLOW" // High/Low Tick
  | "UPORDOWN_ONLYUPS" | "UPORDOWN_ONLYDOWNS"
  // Digits
  | "DIGITMATCH" | "DIGITDIFF"
  | "DIGITEVEN" | "DIGITODD"
  | "DIGITOVER" | "DIGITUNDER"
  // Multipliers
  | "MULTUP" | "MULTDOWN"
  // Accumulator
  | "ACCU"
  // Vanillas
  | "VANILLALONGCALL" | "VANILLALONGPUT"
  // Turbos
  | "TURBOSLONG" | "TURBOSSHORT";

export interface AccountInfo {
  loginid: string;
  balance: number;
  currency: string;
  email: string;
  is_virtual: boolean;
  token: string;
  app_id: string;
}

export interface DerivProposal {
  id: string;
  ask_price: number;
  payout: number;
  spot: number;
  barrier?: string;
  barrier2?: string;
  display_value?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ActivePosition {
  contract_id: number;
  symbol: string;
  display_name: string;
  contract_type: DerivContractType;
  buy_price: number;
  entry_spot: number;
  current_spot: number;
  payout: number;
  profit: number;
  date_expiry: number;
  status: "open" | "won" | "lost";
}

export interface TickData {
  epoch: number;
  pip_size: number;
  quote: number;
  raw_value?: number;
}

export interface CandleData {
  epoch: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
