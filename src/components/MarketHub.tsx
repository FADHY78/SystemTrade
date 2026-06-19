import { useState } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { BarChart4, Globe, Activity, TrendingUp, AlertCircle, Compass, RefreshCw, FileText } from "lucide-react";

export default function MarketHub() {
  const {
    appId,
    selectedSymbol,
    addLog,
  } = useTradingStore();

  const [activeSession, setActiveSession] = useState("NEW YORK / LONDON OVERLAP");

  // Market volatility indices status
  const volatilityIndexes = [
    { name: "Volatility 10 Index", symbol: "R_10", level: "Low", pct: 10 },
    { name: "Volatility 50 Index", symbol: "R_50", level: "Moderate", pct: 45 },
    { name: "Volatility 75 Index", symbol: "R_75", level: "High", pct: 75 },
    { name: "Volatility 100 Index", symbol: "R_100", level: "Extreme", pct: 95 },
  ];

  // Correlation Coefficient Matrix table
  const correlationMatrix = [
    { row: "R_100", col1: 1.0, col2: 0.12, col3: -0.05, col4: 0.44 },
    { row: "frxEURUSD", col1: 0.12, col2: 1.0, col3: -0.73, col4: 0.19 },
    { row: "frxUSDCHF", col1: -0.05, col2: -0.73, col3: 1.0, col4: -0.22 },
    { row: "OTC_US500", col1: 0.44, col2: 0.19, col3: -0.22, col4: 1.0 },
  ];

  const columns = ["R_100", "EUR/USD", "USD/CHF", "US 500"];

  // AI Market Digest
  const [isBriefing, setIsBriefing] = useState(false);
  const [briefSummary, setBriefSummary] = useState<any>(null);

  // SECURE request to query server-side gemini market analyst proxy
  const handleQueryMarketBriefAI = async () => {
    setIsBriefing(true);
    addLog("info", "Deploying Gemini hedge-fund briefing proxy to fetch global aggregates...");
    try {
      const response = await fetch("/api/ai/market-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markets: [
            { asset: "Synthetics Volatility Index", focus: "Volatility 100 demonstrates high range continuation" },
            { asset: "Forex Sessions", overlap: "London & New York overlaps show strong directional flow on majors" },
            { asset: "Crypto / Metals Gold", trends: "Bullish consolidation wedge patterns forming" }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error("Briefing endpoint did not respond accurately");
      }

      const parsedOutcome = await response.json();
      setBriefSummary(parsedOutcome);
      addLog("ai", "Gemini portfolio summary brief successfully fetched into panel.");
    } catch (err: any) {
      addLog("error", `Hedge-fund brief query failure: ${err.message}`);
    } finally {
      setIsBriefing(false);
    }
  };

  return (
    <div id="market-hub-panel" className="flex-1 bg-[#04060A] flex flex-col xl:flex-row h-full overflow-y-auto select-none p-4 gap-4">
      {/* Volatility trackers and Correlation tables */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Volatility meters index layout */}
        <div className="p-4 bg-[#05070D]/95 border-2 border-[#15233D] rounded-3xl flex flex-col gap-3.5 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 border-b border-[#15233D] pb-2 font-mono">
            <Activity className="w-4 h-4 text-[#00D1FF] animate-pulse" />
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">J.A.R.V.I.S. VOLATILITY SCANNERS</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {volatilityIndexes.map(item => (
              <div key={item.symbol} className="p-3.5 bg-[#080C16] rounded-2xl border border-[#15233D] flex flex-col justify-between transition-all hover:border-[#00D1FF]/30">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[11px] font-bold text-slate-200">{item.name}</span>
                  <span className={`text-[8px] font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded border leading-none ${
                    item.level === "Extreme" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : item.level === "High" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  }`}>
                    {item.level} VOL
                  </span>
                </div>

                <div className="mt-3.5 h-1.5 bg-[#04060A] rounded-full overflow-hidden border border-[#121F32]">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.level === "Extreme" ? "bg-gradient-to-r from-orange-500 to-rose-500" : item.level === "High" ? "bg-gradient-to-r from-yellow-500 to-orange-400" : "bg-gradient-to-r from-emerald-500 to-[#00D1FF]"
                    }`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assets Correlation coefficient matrix block */}
        <div className="p-4 bg-[#05070D]/95 border-2 border-[#15233D] rounded-3xl flex flex-col gap-3 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 border-b border-[#15233D] pb-2 font-mono">
            <BarChart4 className="w-4 h-4 text-[#00E676]" />
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00E676] jarvis-glow-green">CROSS-ASSET COEFFICIENT MATRIX</h4>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#15233D]">
            <table className="w-full text-xs font-mono text-left border-collapse bg-[#080C16]/60">
              <thead>
                <tr className="border-b border-[#15233D] text-slate-500 uppercase">
                  <th className="p-3 bg-[#080C16] text-[8px] tracking-widest font-black">ASSET IDENTIFIER</th>
                  {columns.map(col => (
                    <th key={col} className="p-3 text-center text-[8px] tracking-widest font-black">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15233D]">
                {correlationMatrix.map((rowArr, outerIdx) => (
                  <tr key={rowArr.row} className="hover:bg-[#121F35]/20">
                    <td className="p-3 bg-[#080C16] font-bold text-slate-300 font-mono text-[10px]">{rowArr.row}</td>
                    {[rowArr.col1, rowArr.col2, rowArr.col3, rowArr.col4].map((v, valIdx) => {
                      const positiveCoeff = v >= 0.3;
                      const negativeCoeff = v <= -0.3;
                      return (
                        <td 
                          key={valIdx} 
                          className={`p-3 text-center font-bold text-[10px] ${
                            positiveCoeff ? "text-[#00E676] jarvis-glow-green" : negativeCoeff ? "text-rose-500" : "text-slate-500"
                          }`}
                        >
                          {v >= 0 ? "+" : ""}{v.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Global Clocks & AI hedge brief sidebar */}
      <div className="w-full xl:w-96 flex flex-col gap-4 shrink-0">
        
        {/* Global Trading Sessions Overlaps highlight clock */}
        <div className="p-4 bg-[#05070D]/95 border-2 border-[#15233D] rounded-3xl flex flex-col gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 pb-2 border-b border-[#15233D] font-mono">
            <Globe className="w-4 h-4 text-[#00D1FF]" />
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">CHRONO-SESSION CHRONICLES</h4>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs">
            {[
              { id: "syd", name: "Sydney, AU Open Time", hours: "17:00 - 02:00 UTC", status: "CLOSED", color: "text-slate-600 border-slate-800" },
              { id: "tok", name: "Tokyo, JP Open Time", hours: "19:00 - 04:00 UTC", status: "CLOSED", color: "text-slate-600 border-slate-800" },
              { id: "lon", name: "London, UK Open Time", hours: "08:00 - 17:00 UTC", status: "OVERLAP (ACTIVE)", color: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
              { id: "ny", name: "New York, US Open Time", hours: "13:00 - 22:00 UTC", status: "ONLINE LIVE (ACTIVE)", color: "text-[#00E676] border-emerald-500/30 bg-emerald-500/5" }
            ].map(session => (
              <div key={session.id} className="p-3 bg-[#080C16] border border-[#15233D] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block text-[11px]">{session.name}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">{session.hours}</span>
                </div>
                <span className={`text-[8px] font-mono font-black border px-2 py-0.5 rounded tracking-widest uppercase ${session.color}`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Express Server Gemini market analyst brief widget */}
        <div className="p-4 bg-[#05070D]/95 border-2 border-[#15233D] rounded-3xl flex flex-col gap-3 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#15233D] mb-1 font-mono">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#00E676]" />
              <span className="font-bold text-[10px] uppercase tracking-widest text-[#00E676] jarvis-glow-green">COGNITIVE DIGEST</span>
            </div>
            
            <button
              onClick={handleQueryMarketBriefAI}
              disabled={isBriefing}
              className={`text-[8px] font-mono font-black tracking-widest uppercase text-[#00D1FF] cursor-pointer hover:underline disabled:opacity-55 ${isBriefing ? "animate-pulse" : ""}`}
            >
              {isBriefing ? "GENERATING..." : "GENERATE SUMMARY"}
            </button>
          </div>

          {briefSummary ? (
            <div className="flex flex-col gap-3 animate-in fade-in duration-300 font-mono text-xs">
              <span className="bg-[#0A1A30]/50 text-[#00D1FF] font-bold border border-[#15233D] py-1 px-2.5 text-[9px] tracking-widest flex items-center gap-1 uppercase rounded-lg">
                GLOBAL SENTIMENT MODE: <b className="text-[#00E676]">{briefSummary.sentiment || "RISK_ON"}</b>
              </span>
              <p className="text-slate-300 text-[10px] leading-relaxed font-sans whitespace-pre-line uppercase tracking-wide">
                {briefSummary.brief}
              </p>
            </div>
          ) : (
            <div className="py-8 font-mono text-[9px] text-center text-slate-500">
              <Compass className="w-6 h-6 text-slate-600 mx-auto mb-2 animate-bounce" />
              ANALYZE SYNTHETICS PRICE DISTRIBUTION AND OVERLAPS. CLICK "GENERATE SUMMARY" TO ACCESS INTUITIVE INTEL.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
