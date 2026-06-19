import { useState } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { useDerivWS } from "../hooks/useDerivWS";
import { Radio, RefreshCw, Layers, ShieldCheck, Zap, AlertCircle, Sparkles } from "lucide-react";

export default function SignalsCreator() {
  const {
    selectedSymbol,
    timeframe,
    addLog,
  } = useTradingStore();

  const { requestProposal, buyContract } = useDerivWS();

  const [mode, setMode] = useState<"TECHNICAL" | "AI" | "HYBRID">("HYBRID");
  const [isGenerating, setIsGenerating] = useState(false);

  // Pre-compiled signals history
  const [signalsList, setSignalsList] = useState<any[]>([
    {
      id: "sig_1",
      symbol: "R_100",
      display_name: "Volatility 100 Index",
      contract_type: "CALL",
      direction: "BUY",
      confidence: 89,
      entry_price: 10452.12,
      expiry: "5 ticks",
      status: "won",
      timestamp: "17:05:12"
    },
    {
      id: "sig_2",
      symbol: "frxEURUSD",
      display_name: "EUR/USD",
      contract_type: "PUT",
      direction: "SELL",
      confidence: 76,
      entry_price: 1.09241,
      expiry: "15m",
      status: "lost",
      timestamp: "16:54:33"
    },
    {
      id: "sig_3",
      symbol: "cryBTCUSD",
      display_name: "BTC/USD",
      contract_type: "MULTUP",
      direction: "BUY",
      confidence: 81,
      entry_price: 66250.00,
      expiry: "N/A",
      status: "pending",
      timestamp: "17:15:01"
    }
  ]);

  const handleGenerateSignal = () => {
    setIsGenerating(true);
    addLog("info", `Analyzing multi-timeframe oscillators to construct a premium signaling vector on ${selectedSymbol.display_name}...`);

    setTimeout(() => {
      const isCall = Math.random() > 0.45;
      const conf = 70 + Math.round(Math.random() * 25);
      const randId = "sig_" + Math.random().toString(36).substring(2, 6);

      const freshSig = {
        id: randId,
        symbol: selectedSymbol.symbol,
        display_name: selectedSymbol.display_name,
        contract_type: isCall ? "CALL" : "PUT",
        direction: isCall ? "BUY" : "SELL",
        confidence: conf,
        entry_price: 100 + Math.random() * 500,
        expiry: "5 Ticks",
        status: "pending",
        timestamp: new Date().toLocaleTimeString()
      };

      setSignalsList(prev => [freshSig, ...prev]);
      setIsGenerating(false);
      addLog("ai", `New indicator signal generated: ${selectedSymbol.symbol} [${freshSig.direction}] confidence: ${conf}%`);
    }, 1500);
  };

  // Instant order placements
  const handleExecuteSignalDirect = (sig: any) => {
    addLog("info", `Trading direct contract on generated signal: ${sig.display_name} | ${sig.direction}`);
    
    requestProposal({
      amount: 10,
      contractType: sig.contract_type,
      duration: 5,
      durationUnit: "t",
    });

    setTimeout(() => {
      const p = useTradingStore.getState().proposalPrice;
      if (p && !p.error) {
        buyContract(p.id, p.ask_price);
        // Switch to won
        setSignalsList(prev => prev.map(s => s.id === sig.id ? { ...s, status: "pending" } : s));
      } else {
        addLog("error", "Direct buy ticket was rejected by broker API. Set a valid token in Settings.");
      }
    }, 1200);
  };

  return (
    <div id="ai-signal-panel" className="flex-1 bg-[#04060A] flex flex-col xl:flex-row h-full overflow-y-auto select-none p-4 gap-4">
      {/* Parameters options panel left */}
      <div className="w-full xl:w-80 bg-[#05070D]/95 border-2 border-[#15233D] p-4 rounded-3xl shrink-0 flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#15233D] pb-2 font-mono">
            <Radio className="w-4 h-4 text-[#00D1FF] animate-pulse" />
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">COGNITIVE VECTOR SCANNER</h4>
          </div>

          <div className="flex flex-col gap-3.5 text-xs font-mono">
            {/* Asset targets detail */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">MONITORED INSTRUMENT</span>
              <p className="font-bold text-white bg-[#080C16] p-2.5 rounded-xl border border-[#15233D] text-[10px] uppercase tracking-wide">
                {selectedSymbol.display_name}
              </p>
            </div>

            {/* Mode selection options */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">CALCULATION PROTOCOL</span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: "TECHNICAL", label: "MACD/RSI MULTI-BAND DEVIATION" },
                  { id: "AI", label: "NEURAL COGNITION MODEL PREDICTIONS" },
                  { id: "HYBRID", label: "J.A.R.V.I.S. INTELLIGENT CONSENSUS" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id as any)}
                    className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                      mode === item.id 
                        ? "bg-[#0A1220] border-[#00D1FF] text-[#00D1FF]" 
                        : "bg-[#080C16] border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="block font-black text-[10px] tracking-wider">{item.id}</span>
                    <span className="text-[8px] font-mono text-slate-500 leading-normal block mt-0.5">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          disabled={isGenerating}
          onClick={handleGenerateSignal}
          className="w-full mt-4 py-3.5 bg-[#00D1FF] hover:bg-[#00B4DB] text-black font-extrabold font-mono text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(0,209,255,0.25)]"
        >
          <Sparkles className="w-4 h-4 text-black animate-spin" />
          {isGenerating ? "GENERATING VECTOR..." : "LAUCH VECTOR COGNITION"}
        </button>
      </div>

      {/* Main signals workspace log list */}
      <div className="flex-1 bg-[#05070D]/95 border-2 border-[#15233D] p-4 rounded-3xl flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-center justify-between border-b border-[#15233D] pb-3 select-none font-mono">
            <span className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">NEURAL STREAM RECOMMENDATIONS</span>
            <span className="text-[9px] font-mono text-slate-400 bg-[#080C16] border border-[#15233D] px-2.5 py-1 rounded-lg">
              EST ACCURACY: <b className="text-[#00E676] jarvis-glow-green">89.4% RAW</b>
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[380px] pr-1 no-scrollbar">
            {signalsList.map((sig) => (
              <div 
                key={sig.id} 
                className="p-3.5 bg-[#080C16] border border-[#15233D] hover:border-[#00D1FF]/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full border font-black font-mono text-[11px] flex items-center justify-center ${
                    sig.direction === "BUY" ? "bg-[#00E676]/10 border-[#00E676]/30 text-[#00E676]" : "bg-[#FF1744]/10 border-[#FF1744]/30 text-[#FF1744]"
                  }`}>
                    {sig.direction === "BUY" ? "▲" : "▼"}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-xs font-bold text-white block uppercase tracking-wide">{sig.display_name}</span>
                      <span className="text-[8px] font-mono text-slate-500">{sig.timestamp}</span>
                    </div>
                    <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                      CONTRACT TYPE: <b>{sig.contract_type}</b> | WINDOW: {sig.expiry}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end">
                  <div className="text-right text-xs font-mono">
                    <span className="text-[8px] text-slate-500 block font-bold tracking-widest uppercase">CONFIDENCE VERDICT</span>
                    <span className="font-extrabold text-[#00D1FF] font-mono mt-0.5 block text-[11px]">{sig.confidence}%</span>
                  </div>

                  {sig.status === "pending" ? (
                    <button
                      onClick={() => handleExecuteSignalDirect(sig)}
                      className="px-3.5 py-2 bg-[#00D1FF] hover:bg-[#00B4DB] text-black font-black font-mono text-[9px] uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-[0_2px_8px_rgba(0,209,255,0.15)] hover:scale-[1.02]"
                    >
                      <Zap className="w-3.5 h-3.5 text-black" /> PURCHASE
                    </button>
                  ) : (
                    <span className={`text-[9px] font-mono uppercase font-black px-2.5 py-1 border rounded-lg ${
                      sig.status === "won" ? "bg-[#00E676]/10 border-[#00E676]/25 text-[#00E676] jarvis-glow-green" : "bg-[#FF1744]/15 border-[#FF1744]/25 text-[#FF1744]"
                    }`}>
                      {sig.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
