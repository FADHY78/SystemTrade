import { useState, useMemo } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { useDerivWS } from "../hooks/useDerivWS";
import { Grid3X3, Hash, Zap, AlertTriangle, HelpCircle, Activity, TrendingUp } from "lucide-react";

export default function DigitMatrix() {
  const {
    selectedSymbol,
    recentDigits,
    digitFrequency,
    missingDigitsAlerts,
    digitStreak,
    addLog,
    symbols,
    setSelectedSymbol,
  } = useTradingStore();

  const SYSTEM_ASSETS = [
    { symbol: "R_100", display_name: "Volatility 100 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
    { symbol: "R_75", display_name: "Volatility 75 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
    { symbol: "R_50", display_name: "Volatility 50 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
    { symbol: "R_25", display_name: "Volatility 25 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
    { symbol: "R_10", display_name: "Volatility 10 Index", market: "synthetic_index", market_display_name: "Synthetic Indices", submarket: "random_index", submarket_display_name: "Continuous Indices" },
    { symbol: "frxEURUSD", display_name: "EUR/USD Forex", market: "forex", market_display_name: "Forex", submarket: "major_pairs", submarket_display_name: "Major Pairs" },
    { symbol: "frxGBPUSD", display_name: "GBP/USD Forex", market: "forex", market_display_name: "Forex", submarket: "major_pairs", submarket_display_name: "Major Pairs" },
  ];

  const handleSymbolChange = (symbolValue: string) => {
    const list = symbols && symbols.length > 0 ? symbols : SYSTEM_ASSETS;
    const found = list.find((s: any) => s.symbol === symbolValue);
    if (found) {
      setSelectedSymbol(found);
      addLog("info", `Digit Matrix asset switched to ${found.display_name}. Tracking live ticks stream...`);
    }
  };

  const { requestProposal, buyContract } = useDerivWS();

  const [tickRange, setTickRange] = useState(100);
  const [contractType, setContractType] = useState("DIGITDIFF");
  const [selectedDigit, setSelectedDigit] = useState(7);
  const [stake, setStake] = useState(10);
  const [duration, setDuration] = useState(5);

  // AI digit prediction states
  const [isAnalyzingDigits, setIsAnalyzingDigits] = useState(false);
  const [aiDigitPrediction, setAiDigitPrediction] = useState<any>(null);

  // Even / Odd percentage indicators
  const evenOddStats = useMemo(() => {
    const slice = recentDigits.slice(-tickRange);
    const evens = slice.filter(d => d % 2 === 0).length;
    const odds = slice.length - evens;
    return {
      evenPct: Math.round((evens / slice.length) * 100) || 50,
      oddPct: Math.round((odds / slice.length) * 100) || 50,
    };
  }, [recentDigits, tickRange]);

  // Over / Under percentage indicators
  const overUnderStats = useMemo(() => {
    const slice = recentDigits.slice(-tickRange);
    const overs = slice.filter(d => d > 4).length;
    const unders = slice.length - overs;
    return {
      overPct: Math.round((overs / slice.length) * 100) || 50,
      underPct: Math.round((unders / slice.length) * 100) || 50,
    };
  }, [recentDigits, tickRange]);

  // Digit frequency breakdown for range selections
  const rangeDigitFreqs = useMemo(() => {
    const slice = recentDigits.slice(-tickRange);
    const counts = Array.from({ length: 10 }, () => 0);
    slice.forEach(d => counts[d]++);
    const total = slice.length;

    // Hot vs Cold labels
    const mapped = counts.map((cnt, digit) => {
      const pct = Math.round((cnt / total) * 100);
      return {
        digit,
        count: cnt,
        pct,
      };
    });

    const maxPct = Math.max(...mapped.map(m => m.pct));
    const minPct = Math.min(...mapped.map(m => m.pct));

    return mapped.map(item => ({
      ...item,
      label: item.pct === maxPct ? "HOT 🔥" : item.pct === minPct ? "COLD ❄️" : "NEUTRAL",
      colorClass: item.pct === maxPct 
        ? "bg-emerald-500/80 text-emerald-100" 
        : item.pct === minPct 
          ? "bg-rose-500/80 text-rose-100" 
          : "bg-[#1E2028] text-gray-400"
    }));
  }, [recentDigits, tickRange]);

  // SECURE server query to call digit analysis proxy
  const handleAnalyzeDigitsAI = async () => {
    setIsAnalyzingDigits(true);
    addLog("info", `Launching server-side AI digit prediction for ${selectedSymbol.display_name}...`);
    try {
      const response = await fetch("/api/ai/analyze-digits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedSymbol.symbol,
          digits: recentDigits.slice(-25),
          stats: rangeDigitFreqs,
        }),
      });

      if (!response.ok) {
        throw new Error("API call error on server digit parser");
      }

      const outcome = await response.json();
      setAiDigitPrediction(outcome);
      addLog("ai", `AI Prediction for digits retrieved: recommended structure is ${outcome.recommended_contract || "DIGITDIFF"} on target ${outcome.hot_digits?.[0] || 7}`);
    } catch (err: any) {
      addLog("error", `Digit AI helper failure: ${err.message}`);
    } finally {
      setIsAnalyzingDigits(false);
    }
  };

  // Instant order execution for matches/differs digits contracts
  const handlePlaceDigitOrder = () => {
    addLog("info", `Initiating digit proposal logic: ${contractType} on target number [${selectedDigit}]`);
    requestProposal({
      amount: stake,
      contractType,
      barrier: selectedDigit.toString(),
      duration: duration,
      durationUnit: "t",
    });

    // Buy in sequence slightly later once proposal ID populates in the central hook
    addLog("info", "Subscribed contract proposal. Executing trade ticket...");
    setTimeout(() => {
      const latestProposal = useTradingStore.getState().proposalPrice;
      if (latestProposal && !latestProposal.error) {
        buyContract(latestProposal.id, latestProposal.ask_price);
      } else {
        addLog("error", "Proposal acquisition failed or is unauthorized. Connect a Deriv token.");
      }
    }, 1200);
  };

  return (
    <div id="digit-matrix-panel" className="flex-1 bg-[#04060A] flex flex-col xl:flex-row select-none p-3 sm:p-4 gap-4 overflow-y-auto">
      {/* 1. Left Section: Stream, Matrix Analysis, and Live alerts */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        
        {/* Color-coded recent decimal digit tiles */}
        <div className="p-4 jarvis-glass animate-scan-cyan rounded-3xl flex flex-col gap-3 relative overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-mono">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00D1FF] animate-pulse" />
              <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">LIVE TICKET DECIMALS STREAM</h4>
            </div>

            {/* Active Symbol Switcher Selector */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[8px] text-slate-500 font-bold uppercase">ASSET:</span>
              <select
                value={selectedSymbol?.symbol || "R_100"}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="bg-[#080C16] text-[10px] text-[#00D1FF] font-black border border-[#15233D] rounded-xl px-2.5 py-1 outline-none font-mono focus:border-[#00D1FF]"
              >
                {(symbols && symbols.length > 0 ? symbols : SYSTEM_ASSETS).map((s: any) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.display_name || s.symbol}
                  </option>
                ))}
              </select>
            </div>

            {digitStreak.length > 2 && (
              <span className="text-[8px] font-mono tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded uppercase animate-pulse self-start sm:self-auto">
                STREAK DETECTED: DIGIT {digitStreak.digit} SPOTTED {digitStreak.length} TIMES!
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 md:gap-2">
            {recentDigits.slice(-20).map((digit, idx) => {
              const even = digit % 2 === 0;
              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl flex items-center justify-center font-mono font-bold text-xs shadow-md transition-all duration-300 transform hover:scale-105 ${
                    even 
                      ? "bg-[#00D1FF]/10 text-[#00D1FF] border-2 border-[#00D1FF]/30" 
                      : "bg-[#FF3B6B]/10 text-[#FF3B6B] border-2 border-[#FF3B6B]/30"
                  }`}
                >
                  {digit}
                </div>
              );
            })}
          </div>
        </div>

        {/* Digit Frequency bars grid and hot/cold filters */}
        <div className="p-4 jarvis-glass rounded-3xl flex flex-col gap-4 relative overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between border-b border-[#15233D] pb-3 font-mono">
            <span className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">DIGIT RECURRENCE HEAT MATRIX</span>
            
            <div className="flex gap-1.5 items-center">
              <span className="text-[8px] text-slate-500 font-mono tracking-wider font-bold">DEPTH INDEX:</span>
              {[25, 50, 100, 250].map(sz => (
                <button
                  key={sz}
                  onClick={() => setTickRange(sz)}
                  className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border transition-all cursor-pointer ${
                    tickRange === sz 
                      ? "bg-[#00D1FF]/10 border-[#00D1FF] text-[#00D1FF] shadow-[0_0_8px_rgba(0,209,255,0.2)]" 
                      : "border-transparent text-slate-500 hover:text-white"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Frequencies items list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {rangeDigitFreqs.map(item => (
              <div key={item.digit} className="flex items-center gap-3 bg-[#080C16] p-2.5 rounded-2xl border border-[#15233D] transition-all hover:border-[#00D1FF]/30">
                <span className="font-bold font-mono text-xs text-[#00D1FF] w-4">
                  {item.digit}
                </span>

                <div className="flex-1 h-2 bg-[#04060A] rounded-full overflow-hidden relative border border-[#121F32]">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00D1FF] to-[#FF3B6B] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, item.pct * 3.5)}%` }} // Multiply to fill scale nicely, safely clamped to 100% max
                  />
                </div>

                <div className="flex items-center gap-2 w-24 justify-end shrink-0">
                  <span className="text-xs font-bold font-mono text-slate-300">
                    {item.pct}%
                  </span>
                  <span className={`text-[8px] font-mono select-none px-1.5 py-0.5 rounded border tracking-widest font-bold leading-none ${item.colorClass}`}>
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auxiliary Stats breakdown (Evens/Odds and Over/Under ratios) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Evens odds ratio panel */}
          <div className="p-4 jarvis-glass rounded-3xl flex flex-col gap-3 relative overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
            <span className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-widest block">EVEN / ODD DISTRIBUTION</span>
            <div className="h-6 flex rounded-xl overflow-hidden border-2 border-[#15233D] font-mono font-black text-[9px]">
              <div className="bg-[#00D1FF]/15 text-[#00D1FF] border-r border-[#15233D] flex items-center justify-center transition-all duration-300" style={{ width: `${evenOddStats.evenPct}%` }}>
                EVENS: {evenOddStats.evenPct}%
              </div>
              <div className="bg-[#FF3B6B]/15 text-[#FF3B6B] flex items-center justify-center transition-all duration-300" style={{ width: `${evenOddStats.oddPct}%` }}>
                ODDS: {evenOddStats.oddPct}%
              </div>
            </div>
          </div>

          {/* Over Under ratio panel */}
          <div className="p-4 jarvis-glass rounded-3xl flex flex-col gap-3 relative overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
            <span className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-widest block">OVER / UNDER PATTERN DEPTH</span>
            <div className="h-6 flex rounded-xl overflow-hidden border-2 border-[#15233D] font-mono font-black text-[9px]">
              <div className="bg-[#00E676]/15 text-[#00E676] border-r border-[#15233D] flex items-center justify-center transition-all duration-300" style={{ width: `${overUnderStats.overPct}%` }}>
                OVER (5-9): {overUnderStats.overPct}%
              </div>
              <div className="bg-[#9c27b0]/15 text-[#ff61ff] flex items-center justify-center transition-all duration-300" style={{ width: `${overUnderStats.underPct}%` }}>
                UNDER (0-4): {overUnderStats.underPct}%
              </div>
            </div>
          </div>
        </div>

        {/* Live Missing digit status alert widgets */}
        <div className="flex flex-col gap-2 p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-2xl">
          <div className="flex items-center gap-2 text-rose-500 text-[10px] font-bold font-mono tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5" /> J.A.R.V.I.S. REJECTION BIAS CONSOLE
          </div>
          <div className="flex flex-col gap-1 text-[9px] font-mono text-slate-400 tracking-wide uppercase">
            {missingDigitsAlerts.length > 0 ? (
              missingDigitsAlerts.map((alert, index) => (
                <p key={index} className="flex items-center gap-1.5 text-rose-400">
                  <span className="h-1 w-1 bg-rose-500 rounded-full inline-block"></span>
                  {alert}
                </p>
              ))
            ) : (
              <p className="text-slate-500">Poisson standard distribution limits active. All digits detected within active sliding frame.</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Right Section: Quick Ticket, Gemini Digit Model insights */}
      <div className="w-full xl:w-96 flex flex-col gap-4 shrink-0">
        
        {/* Quick order panel parameters selection */}
        <div className="p-5 jarvis-glass animate-scan-green rounded-3xl flex flex-col gap-4 relative overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#15233D]">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-[10px] uppercase font-mono tracking-widest text-[#00D1FF] jarvis-glow-blue">DIRECT MATRIX EXECUTION TICKET</span>
          </div>

          <div className="flex flex-col gap-3.5 font-mono">
            {/* Options Categories */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">DECISION CONTRACT TYPE</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "DIGITMATCH", name: "Matches" },
                  { id: "DIGITDIFF", name: "Differs" },
                  { id: "DIGITEVEN", name: "Even" },
                  { id: "DIGITODD", name: "Odd" },
                  { id: "DIGITOVER", name: "Over" },
                  { id: "DIGITUNDER", name: "Under" }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setContractType(item.id)}
                    className={`p-2 rounded-xl text-left text-[9px] font-bold tracking-widest uppercase transition-all border-2 cursor-pointer ${
                      contractType === item.id 
                        ? "bg-[#0A1A30]/50 border-[#00D1FF] text-[#00D1FF] shadow-[0_0_12px_rgba(0,209,255,0.1)]" 
                        : "bg-[#080C16] border-[#15233D] text-slate-500 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Number selector (where applicable) */}
            {["DIGITMATCH", "DIGITDIFF", "DIGITOVER", "DIGITUNDER"].includes(contractType) && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">PREDICTION MATRIX target (0-9)</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 10 }, (_, d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDigit(d)}
                      className={`py-1.5 rounded-lg text-[9px] font-bold font-mono transition-all cursor-pointer ${
                        selectedDigit === d 
                          ? "bg-[#00E676] text-black border border-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.3)]" 
                          : "bg-[#080C16] text-slate-400 hover:bg-[#121E32]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stakes and Ticks duration settings */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[7px] font-mono text-slate-500 tracking-widest uppercase font-black">SOLVENT STAKE (USD)</label>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(parseFloat(e.target.value) || 10)}
                  className="px-3 py-2 text-xs bg-[#080C16] border border-[#15233D] rounded-xl text-white outline-none focus:border-[#00D1FF] font-mono font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[7px] font-mono text-slate-500 tracking-widest uppercase font-black">TICK PROBES (1-10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10) || 5)}
                  className="px-3 py-2 text-xs bg-[#080C16] border border-[#15233D] rounded-xl text-white outline-none focus:border-[#00D1FF] font-mono font-bold"
                />
              </div>
            </div>

            {/* Placement execution triggers */}
            <button
              id="btn-quick-digit-trade"
              onClick={handlePlaceDigitOrder}
              className="w-full mt-2 py-3 bg-[#00D1FF] hover:bg-[#00B4DB] text-black font-black font-mono text-[9px] tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(0,209,255,0.3)] flex items-center justify-center gap-2 cursor-pointer uppercase hover:scale-[1.03] duration-300"
            >
              <Zap className="w-3.5 h-3.5 text-black fill-black" /> EXPEND PROPOSAL UNIT
            </button>
          </div>
        </div>

        {/* Gemini Digital structures predictor insights */}
        <div className="p-4 jarvis-glass rounded-3xl flex flex-col gap-3 relative overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between pb-1 border-b border-[#15233D] font-mono">
            <span className="font-bold text-[10px] uppercase tracking-widest text-[#00E676] jarvis-glow-green">J.A.R.V.I.S. POISSON PREDICTIONS</span>
            <button
              disabled={isAnalyzingDigits}
              onClick={handleAnalyzeDigitsAI}
              className={`text-[8px] font-mono font-black tracking-widest uppercase text-[#00D1FF] cursor-pointer hover:underline disabled:opacity-50 ${isAnalyzingDigits ? "animate-pulse" : ""}`}
            >
              {isAnalyzingDigits ? "FETCHING..." : "QUERY PROXY"}
            </button>
          </div>

          {aiDigitPrediction ? (
            <div className="flex flex-col gap-3 animate-in fade-in duration-300 font-mono">
              <div className="p-3 bg-[#080C16]/60 border border-[#15233D] rounded-xl text-[10px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 uppercase text-[8px] tracking-widest">PROBABILISTIC BIAS</span>
                  <span className="font-black text-rose-400 uppercase tracking-wider">{aiDigitPrediction.bias || "NEUTRAL"}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-500 uppercase text-[8px] tracking-widest">COLD DIGITS INDEX</span>
                  <span className="font-bold text-[#00D1FF]">{aiDigitPrediction.cold_digits?.join(", ") || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase text-[8px] tracking-widest">PREDICTION RULES</span>
                  <span className="font-bold text-[#00E676]">{aiDigitPrediction.prediction_rules || "Differs on 8"}</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#0A1220]/60 border-l-2 border-[#00E676] rounded-r-2xl border-y border-r border-[#15233D]">
                <p className="text-[8px] font-black text-[#00E676] uppercase tracking-widest">Poisson convergence breakdown</p>
                <p className="text-[10px] text-slate-300 leading-normal mt-1.5 leading-relaxed">
                  {aiDigitPrediction.commentary || "Awaiting sequence parameters to compile Poisson rules guidelines."}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[10px] text-slate-500 font-mono">
              <HelpCircle className="w-6 h-6 text-slate-600 mx-auto mb-2 animate-bounce" />
              AWAITING STREAM PARAMETERS... CLICK "QUERY PROXY" TO CALCULATE BINOMIAL RULES USING COGNITIVE CORE.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
