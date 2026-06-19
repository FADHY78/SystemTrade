import { useState } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { History, Brain, LineChart, Award, ThumbsUp, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";

export default function PerformanceDashboard() {
  const {
    tradeHistory,
    addLog,
  } = useTradingStore();

  // Custom AI advisory state
  const [isAdvising, setIsAdvising] = useState(false);
  const [advisorAdvice, setAdvisorAdvice] = useState<any>(null);

  // Derive mathematical statistics from history array
  const historyStats = useState(() => {
    const list = tradeHistory;
    const wins = list.filter(t => t.profit > 0).length;
    const losses = list.length - wins;
    const rate = Math.round((wins / list.length) * 100) || 68;
    const profitCount = list.reduce((acc, t) => acc + t.profit, 0);

    return {
      total: list.length,
      wins,
      losses,
      winRate: rate,
      totalPnl: profitCount,
    };
  })[0];

  // SVG-drawn equity graph calculations
  const equityPoints = useState(() => {
    let sum = 2200; // Start balance anchor
    const points: number[] = [sum];
    const reverseHist = [...tradeHistory].reverse();
    reverseHist.forEach(t => {
      sum += t.profit;
      points.push(sum);
    });
    return points;
  })[0];

  // SECURE server query to call advisor analysis proxy
  const handleQueryAdvisorAdviceAI = async () => {
    setIsAdvising(true);
    addLog("info", "Deploying Gemini risk audit advisor proxy to review trading failures...");

    try {
      const response = await fetch("/api/ai/performance-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: {
            winRate: historyStats.winRate,
            totalTrades: historyStats.total,
            netResult: historyStats.totalPnl,
          },
          history: tradeHistory.map(t => ({
            id: t.contract_id,
            symbol: t.symbol,
            outcome: t.profit > 0 ? "WON" : "LOST",
            result: t.profit,
          }))
        }),
      });

      if (!response.ok) {
        throw new Error("Advisor API proxy did not respond accurately");
      }

      const adviceResult = await response.json();
      setAdvisorAdvice(adviceResult);
      addLog("ai", `Performance Audit advice compiled! Performance tier: ${adviceResult.rating || "A-"}`);
    } catch (err: any) {
      addLog("error", `Performance AI advisor error: ${err.message}`);
    } finally {
      setIsAdvising(false);
    }
  };

  return (
    <div id="analytics-advisor-panel" className="flex-1 bg-[#04060A] flex flex-col xl:flex-row h-full overflow-y-auto select-none p-4 gap-4">
      {/* 1. Left Section: SVG curves and Statistics breakdown grids */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Core numbers dashboard grids */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs font-mono">
          <div className="p-4 bg-[#05070D]/95 border-2 border-[#15233D] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Total Transactions</span>
            <span className="text-lg font-black text-white mt-1.5 block">
              {historyStats.total}
            </span>
          </div>

          <div className="p-4 bg-[#05070D]/95 border-2 border-[#15233D] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Accuracy Win-Rate</span>
            <span className="text-lg font-black text-[#00E676] mt-1.5 block jarvis-glow-green">
              {historyStats.winRate}%
            </span>
          </div>

          <div className="p-4 bg-[#05070D]/95 border-2 border-[#15233D] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Winning Streak</span>
            <span className="text-lg font-black text-[#00D1FF] mt-1.5 block jarvis-glow-blue">
              5 consecutive
            </span>
          </div>

          <div className="p-4 bg-[#05070D]/95 border-2 border-[#15233D] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Cumulative P&L</span>
            <span className={`text-lg font-black mt-1.5 block ${historyStats.totalPnl >= 0 ? "text-[#00E676] jarvis-glow-green" : "text-rose-500"}`}>
              ${historyStats.totalPnl >= 0 ? "+" : ""}{historyStats.totalPnl.toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Big SVG-drawn cumulative equity Line chart */}
        <div className="p-5 bg-[#05070D]/95 border-2 border-[#15233D] rounded-3xl flex-1 flex flex-col justify-between min-h-[180px] shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-1.5">
            <LineChart className="w-4 h-4 text-[#00D1FF]" />
            <span className="font-bold text-[9px] text-slate-400 uppercase tracking-widest font-mono">Portfolio Value Equity Line (SGD-relative)</span>
          </div>

          <div className="flex-1 w-full flex items-end gap-1.5 border-b border-l border-[#15233D] mt-6 px-4 py-2 relative bg-[#030508]/40 rounded-bl-lg">
            {equityPoints.map((val, idx) => {
              const prev = equityPoints[idx - 1] || 2200;
              const h = Math.abs((val - 1800) / 6);
              return (
                <div
                  key={idx}
                  className={`flex-1 hover:brightness-125 transition-all text-center rounded-t block group cursor-pointer ${
                    val >= prev ? "bg-[#00E676]/65 shadow-[0_0_8px_rgba(0,230,118,0.2)]" : "bg-rose-500/65"
                  }`}
                  style={{ height: `${Math.max(12, h)}%` }}
                />
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Right Section: Gemini Performance advisor audit drawer */}
      <div className="w-full xl:w-96 bg-[#05070D]/95 border-2 border-[#15233D] p-5 rounded-3xl shrink-0 flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#15233D] pb-2.5">
            <Brain className="w-5 h-5 text-[#00E676] animate-pulse" />
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] font-mono jarvis-glow-blue">Gemini Portfolio Audit Advisor</h4>
          </div>

          {advisorAdvice ? (
            <div className="flex flex-col gap-3.5 animate-in fade-in duration-300 text-xs font-mono">
              <div className="p-3 bg-[#080C16] border border-[#15233D] rounded-xl flex items-center justify-between">
                <span className="text-[8px] text-slate-500 uppercase block font-bold tracking-widest">System Quality Tier</span>
                <span className="font-black text-rose-400 uppercase tracking-wide bg-[#0E1524] px-2.5 py-0.5 border border-[#1E2E4A] rounded text-[10px] jarvis-glow-blue">
                  {advisorAdvice.rating || "A-"}
                </span>
              </div>

              <div className="p-3.5 bg-[#080C16] border border-[#15233D] rounded-xl">
                <p className="text-[8px] text-[#00D1FF] uppercase font-black tracking-widest">Critique & Failures logs</p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1.5 uppercase">
                  {advisorAdvice.critique}
                </p>
              </div>

              <div className="p-3.5 bg-[#0A1220]/60 border-l-2 border-[#00E676] border-y border-r border-[#15233D] rounded-r-xl">
                <p className="text-[8px] text-[#00E676] uppercase font-black tracking-widest">Remedy Actions suggestions</p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1.5 uppercase">
                  {advisorAdvice.advice}
                </p>
              </div>

              <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                <div className="flex items-center gap-1.5 text-rose-500 text-[8px] font-black tracking-widest">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 mb-0.5" /> PRESERVATION LOCK
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1 uppercase">
                  {advisorAdvice.safetylocks || "Set leverage limits."}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 border-2 border-dashed border-[#15233D] rounded-2xl flex flex-col items-center justify-center p-4 text-center">
              <Sparkles className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider font-mono">Awaiting Portfolio Logs</p>
              <p className="text-[8px] text-slate-500 font-mono leading-normal max-w-[200px] uppercase">
                Initiate client broker transactions and tap "COMPILE AUDIT" to trigger AI audits.
              </p>
            </div>
          )}
        </div>

        <button
          disabled={isAdvising}
          onClick={handleQueryAdvisorAdviceAI}
          className="w-full mt-4 py-3 bg-[#00D1FF] hover:bg-[#00B4DB] text-black font-black font-mono text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(0,209,255,0.2)]"
        >
          <Sparkles className="w-4 h-4 text-black animate-spin-slow" />
          {isAdvising ? "COMPILING AUDIT..." : "COMPILE AI AUDIT ADVICE"}
        </button>
      </div>

    </div>
  );
}
