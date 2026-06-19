import { useState, useEffect } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { useDerivWS } from "../hooks/useDerivWS";
import { Zap, ShieldCheck, HelpCircle, TrendingUp, TrendingDown, ClipboardCheck, History, Clock } from "lucide-react";

export default function TradeExecution() {
  const {
    activeAccount,
    selectedSymbol,
    openPositions,
    tradeHistory,
    proposalPrice,
    setProposalPrice,
    addLog,
  } = useTradingStore();

  const { requestProposal, buyContract } = useDerivWS();

  // Ticket fields state variables
  const [contractCategory, setContractCategory] = useState<"standard" | "barriers" | "digits" | "cfds">("standard");
  const [contractType, setContractType] = useState("CALL");
  const [stake, setStake] = useState(10);
  const [duration, setDuration] = useState(5);
  const [durationUnit, setDurationUnit] = useState("t");

  // Extras state options
  const [barrierOffset, setBarrierOffset] = useState("+0.5");
  const [barrier2Offset, setBarrier2Offset] = useState("-0.5");
  const [selectedDigit, setSelectedDigit] = useState(5);
  const [selectedMultiplier, setSelectedMultiplier] = useState(50);
  const [selectedGrowthRate, setSelectedGrowthRate] = useState(0.01); // 1% for Accumulators

  // Sync / poll proposals
  useEffect(() => {
    // Reset pricing
    setProposalPrice(null);

    const timer = setTimeout(() => {
      let resolvedType = contractType;
      let barrierVal: string | undefined = undefined;
      let barrier2Val: string | undefined = undefined;

      if (contractCategory === "barriers") {
        resolvedType = "CALL_BARRIER";
        barrierVal = barrierOffset;
        if (contractType === "EXPIRYMISS") {
          barrierVal = barrierOffset;
          barrier2Val = barrier2Offset;
        }
      } else if (contractCategory === "digits") {
        resolvedType = contractType; // Matches or Differs
        barrierVal = selectedDigit.toString();
      } else if (contractCategory === "cfds") {
        resolvedType = contractType === "BUY" ? "MULTUP" : "MULTDOWN";
      }

      requestProposal({
        amount: stake,
        basis: "stake",
        contractType: resolvedType,
        currency: activeAccount?.currency || "USD",
        duration,
        durationUnit,
        ...(barrierVal && { barrier: barrierVal }),
        ...(barrier2Val && { barrier2: barrier2Val }),
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [contractCategory, contractType, stake, duration, durationUnit, barrierOffset, barrier2Offset, selectedDigit, selectedMultiplier, selectedGrowthRate, requestProposal, activeAccount, setProposalPrice]);

  const handlePlaceBuyContract = () => {
    if (proposalPrice && !proposalPrice.error) {
      buyContract(proposalPrice.id, proposalPrice.ask_price);
    } else {
      addLog("error", "Trade Placement Denied: Proposal is empty or contains active broker errors. Verify token settings.");
    }
  };

  return (
    <div id="execution-engine-panel" className="flex-1 bg-[#04060A] flex flex-col xl:flex-row h-full overflow-y-auto select-none p-4 gap-4">
      
      {/* 1. Left Column: Ticket Execution parameters */}
      <div className="w-full xl:w-96 bg-[#05070D]/95 border-2 border-[#15233D] p-5 rounded-3xl shrink-0 flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-[#15233D] pb-2.5 font-mono">
            <Zap className="w-4 h-4 text-[#00D1FF] animate-pulse" />
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">COGNITIVE TICKET ENGINE</h4>
          </div>

          {/* Ticket categories tabs grids */}
          <div className="grid grid-cols-4 gap-1.5 shrink-0 bg-[#080C16] p-1.5 rounded-2xl border border-[#15233D] font-mono">
            {[
              { id: "standard", label: "Rise/Fall" },
              { id: "barriers", label: "Barriers" },
              { id: "digits", label: "Digits" },
              { id: "cfds", label: "Mult" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setContractCategory(tab.id as any);
                  if (tab.id === "standard") setContractType("CALL");
                  if (tab.id === "barriers") setContractType("CALL_BARRIER");
                  if (tab.id === "digits") setContractType("DIGITDIFF");
                  if (tab.id === "cfds") setContractType("BUY");
                }}
                className={`py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase cursor-pointer whitespace-nowrap text-center text-ellipsis overflow-hidden border leading-tight ${
                  contractCategory === tab.id 
                    ? "bg-[#0A1220] text-[#00D1FF] border-[#00D1FF]/30" 
                    : "bg-transparent text-slate-500 hover:text-white border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Direction inputs */}
          <div className="flex flex-col gap-3.5 text-xs font-mono mt-1">
            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] text-slate-500 font-bold tracking-widest uppercase">CONTRACT DIRECTIVE</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setContractType(contractCategory === "cfds" ? "BUY" : contractCategory === "barriers" ? "CALL_BARRIER" : "CALL")}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer border leading-none ${
                    ["CALL", "CALL_BARRIER", "BUY"].includes(contractType)
                      ? "bg-[#00E676]/10 border-[#00E676] text-[#00E676] jarvis-glow-green"
                      : "bg-[#080C16] border-[#15233D] text-slate-400 hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> BUY CALL
                </button>
                <button
                  onClick={() => setContractType(contractCategory === "cfds" ? "SELL" : contractCategory === "barriers" ? "PUT_BARRIER" : "PUT")}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer border leading-none ${
                    ["PUT", "PUT_BARRIER", "SELL"].includes(contractType)
                      ? "bg-[#FF1744]/15 border-[#FF1744] text-[#FF1744]"
                      : "bg-[#080C16] border-[#15233D] text-slate-400 hover:text-white"
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" /> BUY PUT
                </button>
              </div>
            </div>

            {/* Condition Specifics panels */}
            {contractCategory === "barriers" && (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-200">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase">BARRIER HIGH</span>
                  <input
                    type="text"
                    value={barrierOffset}
                    onChange={(e) => setBarrierOffset(e.target.value)}
                    className="px-3 py-2 bg-[#080C16] border border-[#15233D] rounded-xl text-white outline-none focus:border-[#00D1FF] font-bold text-center"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase">BARRIER LOW</span>
                  <input
                    type="text"
                    value={barrier2Offset}
                    onChange={(e) => setBarrier2Offset(e.target.value)}
                    className="px-3 py-2 bg-[#080C16] border border-[#15233D] rounded-xl text-white outline-none focus:border-[#00D1FF] font-bold text-center"
                  />
                </div>
              </div>
            )}

            {contractCategory === "digits" && (
              <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
                <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase">TARGET VALUE DIGIT (0-9)</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 10 }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDigit(idx)}
                      className={`py-1 rounded font-bold transition-colors cursor-pointer border text-[10px] ${
                        selectedDigit === idx 
                          ? "bg-[#00D1FF] text-black border-[#00D1FF]" 
                          : "bg-[#080C16] text-slate-400 border-[#15233D] hover:bg-[#121F35]"
                      }`}
                    >
                      {idx}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* General Stake + Durations parameters selections */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase">STAKE (USD)</span>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(parseFloat(e.target.value) || 10)}
                  className="px-3 py-2 bg-[#080C16] border border-[#15233D] rounded-xl text-white outline-none focus:border-[#00D1FF] font-bold text-center"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-slate-500 font-black tracking-widest uppercase">EXPIRY DURATIONS</span>
                <div className="flex bg-[#080C16] border border-[#15233D] rounded-xl overflow-hidden focus-within:border-[#00D1FF]">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10) || 5)}
                    className="w-16 px-2 py-2 bg-transparent text-white outline-none border-none text-center font-bold"
                  />
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value)}
                    className="flex-1 bg-transparent border-none text-[9px] text-[#00D1FF] font-bold outline-none pr-1.5 uppercase tracking-widest cursor-pointer font-mono"
                  >
                    <option value="t">Ticks</option>
                    <option value="s">Secs</option>
                    <option value="m">Mins</option>
                    <option value="h">Hours</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Real-time proposal cost layout parameters */}
            <div className="mt-2.5 p-3.5 bg-[#04060A]/60 border-2 border-[#15233D] rounded-2xl">
              {proposalPrice ? (
                proposalPrice.error ? (
                  <p className="text-[9px] text-rose-500 leading-normal uppercase font-bold tracking-wide">{proposalPrice.error.message}</p>
                ) : (
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between items-center bg-[#080C16] p-1.5 px-2.5 rounded-xl border border-[#15233D]">
                      <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">PROPOSAL BID PRICE</span>
                      <span className="font-bold font-mono text-white text-[11px]">${parseFloat(proposalPrice.ask_price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#080C16] p-1.5 px-2.5 rounded-xl border border-[#15233D]">
                      <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">POTENTIAL PAYOUT</span>
                      <span className="font-bold font-mono text-[#00E676] text-[11px] jarvis-glow-green">${parseFloat(proposalPrice.payout).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[8px] text-slate-500 font-sans tracking-wide uppercase">REVENUE ROI:</span>
                      <span className="text-[10px] font-black text-[#00D1FF] tracking-wider font-mono">
                        {((proposalPrice.payout / proposalPrice.ask_price) * 100).toFixed(0)}% EST
                      </span>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center font-mono py-4 text-[9px] text-slate-500 flex items-center justify-center gap-2 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-[#00D1FF] animate-spin" /> SYNCHRONIZING PROPOSALS...
                </div>
              )}
            </div>

          </div>
        </div>

        <button
          onClick={handlePlaceBuyContract}
          className="w-full mt-4 py-4 bg-[#00D1FF] hover:bg-[#00B4DB] text-black font-extrabold font-mono text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_16px_rgba(0,209,255,0.25)] hover:scale-[1.01]"
        >
          <ShieldCheck className="w-4 h-4 text-black font-extrabold" /> DISPATCH BROKER UPLINK
        </button>
      </div>

      {/* 2. Main Content tab Column: Open Positions + Histories Lists */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Open Positions List Block */}
        <div className="p-4 bg-[#05070D]/95 border-2 border-[#15233D] rounded-3xl flex-1 flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-[#15233D] pb-2 font-mono">
              <Clock className="w-4 h-4 text-[#00D1FF] animate-pulse" />
              <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">NEURAL ACTIVE POSITION REGISTRY</h4>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#15233D] max-h-[160px] overflow-y-auto no-scrollbar">
              <table className="w-full text-xs font-mono text-left bg-[#080C16]/50">
                <thead>
                  <tr className="border-b border-[#15233D] text-slate-500 text-[8px] tracking-widest uppercase">
                    <th className="p-3">CONTRACT GUID</th>
                    <th className="p-3">ASSET ID</th>
                    <th className="p-3">DIRECTION TYPE</th>
                    <th className="p-3">PURCHASE STAKE</th>
                    <th className="p-3">MARK SPOT</th>
                    <th className="p-3">CURRENT VAL</th>
                    <th className="p-3 text-right">RETURN P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#15233D] text-[10px]">
                  {openPositions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[9px] text-[#00D1FF]/40 uppercase tracking-widest">
                        NO ACTIVE QUANTUM POSITIONS TRADING. SUBMIT COGNITIVE TICKET TO LAUNCH.
                      </td>
                    </tr>
                  ) : (
                    openPositions.map((pos) => (
                      <tr key={pos.contract_id} className="hover:bg-[#121F35]/20 font-bold font-mono">
                        <td className="p-3 text-[#00D1FF]">{pos.contract_id}</td>
                        <td className="p-3 text-white">{pos.symbol}</td>
                        <td className="p-3 uppercase text-slate-300">{pos.contract_type}</td>
                        <td className="p-3 text-white">${pos.buy_price.toFixed(2)}</td>
                        <td className="p-3 text-slate-500">{pos.entry_spot.toFixed(4)}</td>
                        <td className="p-3 text-white">{pos.current_spot.toFixed(4)}</td>
                        <td className={`p-3 text-right font-black ${pos.profit >= 0 ? "text-[#00E676] jarvis-glow-green" : "text-rose-500"}`}>
                          ${pos.profit >= 0 ? "+" : ""}{pos.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Trade Transactions History list Block */}
        <div className="p-4 bg-[#05070D]/95 border-2 border-[#15233D] rounded-3xl flex-1 flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-[#15233D] pb-2 font-mono">
              <History className="w-4 h-4 text-[#00E676] animate-pulse" />
              <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00E676] jarvis-glow-green">AUTONOMIC DECISION HISTORY AUDIT</h4>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#15233D] max-h-[160px] overflow-y-auto no-scrollbar">
              <table className="w-full text-xs font-mono text-left bg-[#080C16]/50">
                <thead>
                  <tr className="border-b border-[#15233D] text-slate-500 text-[8px] tracking-widest uppercase">
                    <th className="p-3">CONTRACT GUID</th>
                    <th className="p-3">ASSET ID</th>
                    <th className="p-3">DIRECTION TYPE</th>
                    <th className="p-3">PURCHASE COST</th>
                    <th className="p-3">SETTLED PAYOUT</th>
                    <th className="p-3 text-right">NET RETURN P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#15233D] text-[10px]">
                  {tradeHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[9px] text-[#00E676]/40 uppercase tracking-widest">
                        NO CLOSED ARCHIVES FOUND IN LOCAL STREAM COGNITION BUFFER.
                      </td>
                    </tr>
                  ) : (
                    tradeHistory.map((hist) => (
                      <tr key={hist.contract_id} className="hover:bg-[#121F35]/15 font-mono">
                        <td className="p-3 text-slate-500">{hist.contract_id}</td>
                        <td className="p-3 text-white font-bold">{hist.symbol}</td>
                        <td className="p-3 uppercase text-slate-400">{hist.contract_type}</td>
                        <td className="p-3 text-slate-400">${hist.buy_price.toFixed(2)}</td>
                        <td className="p-3 text-slate-400">${hist.payout.toFixed(2)}</td>
                        <td className={`p-3 text-right font-black ${hist.profit >= 0 ? "text-[#00E676] jarvis-glow-green" : "text-rose-500"}`}>
                          ${hist.profit >= 0 ? "+" : ""}{hist.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
