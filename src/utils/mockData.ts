import { DerivSymbol } from "../types/deriv.types";

export const CandidateSymbols: DerivSymbol[] = [
  // Synthetic Continuous
  { symbol: "R_10", display_name: "Volatility 10 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
  { symbol: "1HZ10V", display_name: "Volatility 10 (1s) Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
  { symbol: "R_25", display_name: "Volatility 25 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
  { symbol: "1HZ25V", display_name: "Volatility 25 (1s) Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
  { symbol: "R_50", display_name: "Volatility 50 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
  { symbol: "1HZ50V", display_name: "Volatility 50 (1s) Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
  { symbol: "R_75", display_name: "Volatility 75 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
  { symbol: "1HZ75V", display_name: "Volatility 75 (1s) Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
  { symbol: "R_100", display_name: "Volatility 100 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
  { symbol: "1HZ100V", display_name: "Volatility 100 (1s) Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
  // Crash / Boom
  { symbol: "CRASH300N", display_name: "Crash 300 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "crash_boom", submarket_display_name: "Crash/Boom" },
  { symbol: "CRASH500", display_name: "Crash 500 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "crash_boom", submarket_display_name: "Crash/Boom" },
  { symbol: "CRASH1000", display_name: "Crash 1000 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "crash_boom", submarket_display_name: "Crash/Boom" },
  { symbol: "BOOM300N", display_name: "Boom 300 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "crash_boom", submarket_display_name: "Crash/Boom" },
  { symbol: "BOOM500", display_name: "Boom 500 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "crash_boom", submarket_display_name: "Crash/Boom" },
  { symbol: "BOOM1000", display_name: "Boom 1000 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "crash_boom", submarket_display_name: "Crash/Boom" },
  // Step / Jump
  { symbol: "STPIDX", display_name: "Step Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "step_index", submarket_display_name: "Step" },
  { symbol: "JD10", display_name: "Jump 10 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "jump_index", submarket_display_name: "Jump Continuous" },
  { symbol: "JD50", display_name: "Jump 50 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "jump_index", submarket_display_name: "Jump Continuous" },
  { symbol: "JD100", display_name: "Jump 100 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "jump_index", submarket_display_name: "Jump Continuous" },
  // Bear / Bull
  { symbol: "BEAR", display_name: "Bear Market Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "bear_bull", submarket_display_name: "Bear/Bull" },
  { symbol: "BULL", display_name: "Bull Market Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "bear_bull", submarket_display_name: "Bear/Bull" },

  // Forex Major
  { symbol: "frxEURUSD", display_name: "EUR/USD", market: "forex", market_display_name: "Forex Pairs", submarket: "major_pairs", submarket_display_name: "Major Pairs" },
  { symbol: "frxGBPUSD", display_name: "GBP/USD", market: "forex", market_display_name: "Forex Pairs", submarket: "major_pairs", submarket_display_name: "Major Pairs" },
  { symbol: "frxUSDJPY", display_name: "USD/JPY", market: "forex", market_display_name: "Forex Pairs", submarket: "major_pairs", submarket_display_name: "Major Pairs" },
  { symbol: "frxUSDCHF", display_name: "USD/CHF", market: "forex", market_display_name: "Forex Pairs", submarket: "major_pairs", submarket_display_name: "Major Pairs" },
  { symbol: "frxAUDUSD", display_name: "AUD/USD", market: "forex", market_display_name: "Forex Pairs", submarket: "major_pairs", submarket_display_name: "Major Pairs" },
  // Forex Minor
  { symbol: "frxEURGBP", display_name: "EUR/GBP", market: "forex", market_display_name: "Forex Pairs", submarket: "minor_pairs", submarket_display_name: "Minor Pairs" },
  { symbol: "frxEURJPY", display_name: "EUR/JPY", market: "forex", market_display_name: "Forex Pairs", submarket: "minor_pairs", submarket_display_name: "Minor Pairs" },
  { symbol: "frxGBPJPY", display_name: "GBP/JPY", market: "forex", market_display_name: "Forex Pairs", submarket: "minor_pairs", submarket_display_name: "Minor Pairs" },

  // Crypto
  { symbol: "cryBTCUSD", display_name: "BTC/USD", market: "cryptocurrency", market_display_name: "Cryptocurrencies", submarket: "crypto_pairs", submarket_display_name: "Pairs" },
  { symbol: "cryETHUSD", display_name: "ETH/USD", market: "cryptocurrency", market_display_name: "Cryptocurrencies", submarket: "crypto_pairs", submarket_display_name: "Pairs" },
  { symbol: "cryLTCUSD", display_name: "LTC/USD", market: "cryptocurrency", market_display_name: "Cryptocurrencies", submarket: "crypto_pairs", submarket_display_name: "Pairs" },

  // Commodities
  { symbol: "frxXAUUSD", display_name: "Gold/USD", market: "commodities", market_display_name: "Commodities", submarket: "metals", submarket_display_name: "Metals" },
  { symbol: "frxXAGUSD", display_name: "Silver/USD", market: "commodities", market_display_name: "Commodities", submarket: "metals", submarket_display_name: "Metals" },
  { symbol: "OIL_BRENT", display_name: "Oil/USD Brent", market: "commodities", market_display_name: "Commodities", submarket: "energy", submarket_display_name: "Energy" },

  // Indices
  { symbol: "OTC_US500", display_name: "US 500", market: "indices", market_display_name: "Stock Indices", submarket: "americas", submarket_display_name: "Americas" },
  { symbol: "OTC_NDX", display_name: "US Tech 100", market: "indices", market_display_name: "Stock Indices", submarket: "americas", submarket_display_name: "Americas" },
  { symbol: "OTC_DAX", display_name: "German 40", market: "indices", market_display_name: "Stock Indices", submarket: "europe", submarket_display_name: "Europe" },
  { symbol: "OTC_JP225", display_name: "Japan 225", market: "indices", market_display_name: "Stock Indices", submarket: "asia_oceania", submarket_display_name: "Asia/Oceania" },
];

// Helper to calculate EMA
export function calculateEMA(data: number[], length: number): number[] {
  if (data.length < length) return Array(data.length).fill(0);
  const ema: number[] = [];
  const k = 2 / (length + 1);
  let sum = 0;
  for (let i = 0; i < length; i++) {
    sum += data[i];
  }
  let prevEma = sum / length;
  for (let i = 0; i < data.length; i++) {
    if (i < length - 1) {
      ema.push(0);
    } else if (i === length - 1) {
      ema.push(prevEma);
    } else {
      const curEma = data[i] * k + prevEma * (1 - k);
      ema.push(curEma);
      prevEma = curEma;
    }
  }
  return ema;
}

// Helper to calculate RSI
export function calculateRSI(data: number[], length: number = 14): { rsi: number; overbought: number; oversold: number } {
  if (data.length <= length) return { rsi: 50, overbought: 70, oversold: 30 };
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= length; i++) {
    const diff = data[i] - data[i -  1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / length;
  let avgLoss = losses / length;

  for (let i = length + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (length - 1) + gain) / length;
    avgLoss = (avgLoss * (length - 1) + loss) / length;
  }

  if (avgLoss === 0) return { rsi: 100, overbought: 70, oversold: 30 };
  const rs = avgGain / avgLoss;
  const val = 100 - (100 / (1 + rs));
  return {
    rsi: Math.round(val),
    overbought: 70,
    oversold: 30
  };
}

// Generate backup candles
export function generateSyntheticCandles(symbol: string, count: number = 100): any[] {
  let basePrice = 10000;
  if (symbol.includes("R_10")) basePrice = 100;
  if (symbol.includes("R_25")) basePrice = 250;
  if (symbol.includes("R_50")) basePrice = 500;
  if (symbol.includes("R_75")) basePrice = 750;
  if (symbol.includes("R_100")) basePrice = 1000;
  if (symbol.includes("frx")) basePrice = 1.1025;
  if (symbol.includes("cry")) basePrice = 65000;

  const arr: any[] = [];
  let currentClose = basePrice;
  let now = Math.floor(Date.now() / 1000) - count * 60;

  for (let i = 0; i < count; i++) {
    const change = currentClose * (Math.random() - 0.5) * 0.005;
    const open = currentClose;
    const close = currentClose + change;
    const high = Math.max(open, close) + Math.random() * (open * 0.002);
    const low = Math.min(open, close) - Math.random() * (open * 0.002);
    arr.push({
      epoch: now,
      open,
      high,
      low,
      close,
    });
    currentClose = close;
    now += 60;
  }
  return arr;
}
