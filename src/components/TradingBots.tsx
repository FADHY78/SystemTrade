import { useState } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { 
  Bot, Play, Pause, ChevronRight, Settings, CircuitBoard, 
  ShieldAlert, Sparkles, Cpu, Plus, Trash2, ArrowRight, Check 
} from "lucide-react";

export default function TradingBots() {
  const {
    bots,
    toggleBot,
    addLog,
    botLogs,
    addBotLog,
    updateBotStats,
    dailyLossLimit,
    takeProfitGoal,
    setDailyLossLimit,
    setTakeProfitGoal,
    addBot,
    deleteBot,
    symbols,
  } = useTradingStore();

  const SYSTEM_ASSETS = [
    { symbol: "R_100", display_name: "Volatility 100 Index" },
    { symbol: "R_75", display_name: "Volatility 75 Index" },
    { symbol: "R_50", display_name: "Volatility 50 Index" },
    { symbol: "R_25", display_name: "Volatility 25 Index" },
    { symbol: "R_10", display_name: "Volatility 10 Index" },
    { symbol: "frxEURUSD", display_name: "EUR/USD Forex" },
    { symbol: "frxGBPUSD", display_name: "GBP/USD Forex" },
  ];

  const SYSTEM_CONTRACT_TYPES = [
    { id: "CALL", name: "Rise (CALL)" },
    { id: "PUT", name: "Fall (PUT)" },
    { id: "DIGITDIFF", name: "Digits (DIGITDIFF)" },
    { id: "DIGITMATCH", name: "Digits (DIGITMATCH)" },
    { id: "DIGITEVEN", name: "Digits (DIGITEVEN)" },
    { id: "DIGITODD", name: "Digits (DIGITODD)" },
    { id: "DIGITOVER", name: "Digits (DIGITOVER)" },
    { id: "DIGITUNDER", name: "Digits (DIGITUNDER)" },
  ];

  const [showConfigId, setShowConfigId] = useState<string | null>(null);

  // AI Bot Builder state
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewBot, setPreviewBot] = useState<any>(null);
  const [errorText, setErrorText] = useState("");

  const SUGGESTIONS = [
    { label: "High-yield Scalper", text: "A scalp trading bot on Volatility 100 Index (R_100) that buys Rise (CALL) with starting stake of $15 and moderate safety buffers." },
    { label: "Safe Digit Differ", text: "A secure digital option differ bot using $5 stake on Volatility 75 index targeting digit 7 with a mini stop profit target of $30." },
    { label: "Conservative EUR/USD", text: "A highly risk-averse EUR/USD forex binary option trend-rider seeking CALL options with solid stop losses." },
  ];

  const handleAISynthesis = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setErrorText("");
    setPreviewBot(null);

    try {
      const response = await fetch("/api/ai/refine-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: prompt })
      });
      if (!response.ok) {
        throw new Error("Neural server busy. Refinement core offline.");
      }
      const data = await response.json();
      setPreviewBot(data);
    } catch (err: any) {
      setErrorText(err.message || "Synthesis pipeline timed out. Standard backup loaded.");
    } finally {
      setLoading(false);
    }
  };

  const deployAIBot = () => {
    if (!previewBot) return;
    const botId = `bot_custom_${Date.now()}`;
    addBot({
      id: botId,
      name: previewBot.name || "Custom Neural Agent",
      symbol: previewBot.symbol || "R_100",
      contractType: previewBot.contractType || "CALL",
      strategyId: "custom",
      stake: previewBot.stake || 10,
      maxStake: previewBot.maxStake || 100,
      profitTarget: previewBot.profitTarget || 50,
      stopLoss: previewBot.stopLoss || 25,
      isRunning: false,
      tradesCount: 0,
      winCount: 0,
      profit: 0,
      logs: [`Compiled pathways: "${previewBot.rationale}"`],
      config: previewBot.config || { multiplier: 2.2, durationTicks: 5 },
      phase: "idle"
    });
    setPrompt("");
    setPreviewBot(null);
    addLog("success", `AI Algotrader "${previewBot.name || "Custom Bot"}" compiled & initialized inside grid.`);
  };

  const handleToggleBotRunner = (id: string, name: string) => {
    toggleBot(id);
    const targetBot = bots.find((b) => b.id === id);
    const isNowRunning = targetBot ? !targetBot.isRunning : false;

    if (isNowRunning && targetBot) {
      updateBotStats(id, {
        config: { ...targetBot.config, baseStake: targetBot.stake },
        phase: "analyzing"
      });
      addLog("success", `Bot initialized: ${name} is now actively running cognitive strategies.`);
      addBotLog(id, "Deploying algorithm pathways... Analyzing live data streams...");
    } else {
      updateBotStats(id, { phase: "idle" });
      addLog("warning", `Deactivated Bot: ${name}`);
      addBotLog(id, "Agent processing paused. Awaiting next dispatch call.");
    }
  };

  return (
    <div id="bot-engine-panel" className="flex-1 bg-[#04060A] flex flex-col xl:flex-row h-full overflow-y-auto select-none p-4 gap-4">
      {/* List column */}
      <div className="flex-1 flex flex-col gap-4">

        {/* Gemini constructor widget */}
        <div className="p-5 bg-gradient-to-br from-[#0c1424] to-[#060912] border-2 border-cyan-500/20 rounded-3xl font-mono relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.6)]">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Cpu className="w-24 h-24 text-cyan-400" />
          </div>

          <div className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] tracking-widest uppercase mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            <span>GEMINI NEURAL CONSTRUCTOR CORES</span>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-slate-400 leading-relaxed uppercase">
              DEVISE A CUSTOM ALGOMINIC ALGORITHM IN PLAIN ENGLISH. GEMINI WIRES THE RISK TARGETS, SIZINGS, CONTRACT TYPE AND DESCRIPTOR MATHEMATICS DIRECTLY.
            </p>

            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(s.text)}
                  className="px-2.5 py-1 text-[8px] font-bold text-slate-400 bg-[#04060A] border border-[#15233D] hover:border-cyan-500/40 rounded-lg hover:text-white transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-stretch mt-1.5">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="PROMPT DESCRIPTION (E.G. 'I WANT A HIGH RISK VOLATILITY 100 SCALPER USING $20 BASE STAKE USING DOUBLE SCALING COERCIONS...')"
                className="flex-1 bg-[#04060A] border-2 border-[#15233D] focus:border-cyan-500/40 outline-none px-3 py-2 text-[10px] h-12 uppercase rounded-xl text-white placeholder-slate-600 resize-none font-bold"
              />
              <button
                disabled={loading || !prompt.trim()}
                onClick={handleAISynthesis}
                className="px-4 bg-cyan-500 text-black border-2 border-cyan-500 hover:bg-cyan-400 font-black text-[9px] tracking-widest uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" /> REFINE ALGO
                  </>
                )}
              </button>
            </div>

            {errorText && (
              <p className="text-red-500 text-[9px] uppercase font-bold animate-pulse">{errorText}</p>
            )}

            {previewBot && (
              <div className="mt-3 p-4 bg-[#04060A]/90 border border-cyan-500/30 rounded-2xl animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex justify-between items-center border-b border-[#15233D]/60 pb-2 mb-2.5">
                  <span className="text-[#00D1FF] font-black text-[10px] uppercase">COGNITIVE COMPILATION READY</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] bg-cyan-700/25 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded-lg font-black uppercase">
                      READY TO INSTANTIATE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[9px] text-slate-300">
                  <div>
                    <span className="text-slate-500 text-[8px] block uppercase font-bold">NAME</span>
                    <span className="font-extrabold text-[#00E676]">{previewBot.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[8px] block uppercase font-bold">SYMBOL / ASSET</span>
                    <span className="font-extrabold text-white">{previewBot.symbol}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[8px] block uppercase font-bold">STRIKE TYPE</span>
                    <span className="font-extrabold text-white text-[8.5px]">{previewBot.contractType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[8px] block uppercase font-bold">RISK CEILINGS</span>
                    <span className="font-extrabold text-orange-400">STAKE: ${previewBot.stake} / SL: ${previewBot.stopLoss}</span>
                  </div>
                </div>

                <p className="mt-2.5 pt-2 border-t border-[#15233D]/40 text-[9px] text-slate-400 leading-normal italic uppercase">
                  AI RECOMMENDATION: {previewBot.rationale}
                </p>

                <button
                  onClick={deployAIBot}
                  className="mt-3.5 w-full bg-[#00E676] hover:bg-[#00D46A] text-black font-black py-2 rounded-xl text-[9px] tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3px]" /> PROVISION & DEPLOY BOT
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Safety locks top indicator row */}
        <div className="p-4 bg-amber-500/5 border-2 border-amber-500/20 rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-xs font-mono shadow-[0_4px_20px_rgba(245,158,11,0.05)]">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-[9px] tracking-widest uppercase">
            <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            <span>J.A.R.V.I.S. RISK PROTOCOLS</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[9px] font-black tracking-widest text-slate-400 border-t sm:border-t-0 border-[#15233D] pt-2 sm:pt-0 justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span>MAX PORTFOLIO LOSS LIMIT:</span>
              <input
                type="number"
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(Number(e.target.value))}
                className="w-16 bg-[#080C16] text-[#FF1744] font-bold border border-[#FF1744]/30 px-1.5 py-0.5 rounded text-center outline-none focus:border-[#FF1744]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>TAKE PROFIT GOAL:</span>
              <input
                type="number"
                value={takeProfitGoal}
                onChange={(e) => setTakeProfitGoal(Number(e.target.value))}
                className="w-16 bg-[#080C16] text-[#00E676] font-bold border border-[#00E676]/30 px-1.5 py-0.5 rounded text-center outline-none focus:border-[#00E676]"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Card rendering */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bots.map((bot) => (
            <div 
              key={bot.id} 
              className={`p-5 bg-[#05070D]/95 border-2 rounded-3xl transition-all flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)] ${
                bot.isRunning ? "border-[#00E676] shadow-[0_4px_25px_rgba(0,230,118,0.12)]" : "border-[#15233D]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#15233D] font-mono">
                  <div className="flex items-center gap-2.5">
                    <Bot className={`w-4 h-4 ${bot.isRunning ? "text-[#00E676] animate-pulse" : "text-slate-500"}`} />
                    <span className="font-bold text-[10px] text-slate-200 uppercase tracking-widest block">{bot.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono font-black bg-[#080C16] border border-[#15233D] px-2 py-0.5 rounded-lg text-[#00D1FF] uppercase tracking-widest">
                      {bot.contractType}
                    </span>
                    {bot.id.startsWith("bot_custom") && !bot.isRunning && (
                      <button 
                        onClick={() => deleteBot(bot.id)}
                        className="p-1 text-slate-500 hover:text-[#FF1744] hover:bg-[#FF1744]/15 rounded transition-all cursor-pointer"
                        title="Dismantle agent algorithm pathways."
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Algorithmic Phase HUD */}
                {bot.isRunning && (
                  <div className="mt-2 text-[8px] font-mono font-black flex items-center justify-between border-b border-[#15233D]/50 pb-2">
                    <span className="text-slate-500 uppercase tracking-wider">Cognitive Phase:</span>
                    {(!bot.phase || bot.phase === "idle") && (
                      <span className="text-slate-400 animate-pulse uppercase tracking-[2px]">● SYSTEM STANDBY</span>
                    )}
                    {bot.phase === "analyzing" && (
                      <span className="text-amber-500 animate-pulse uppercase tracking-[2px] flex items-center gap-1 font-black">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping inline-block" />
                        ● AI ANALYTICS ACTIVE
                      </span>
                    )}
                    {bot.phase === "proposal" && (
                      <span className="text-cyan-400 animate-pulse uppercase tracking-[2px] flex items-center gap-1 font-black">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping inline-block" />
                        ● PRICING PROPOSAL LOCKED
                      </span>
                    )}
                    {bot.phase === "buying" && (
                      <span className="text-[#FF1744] animate-pulse uppercase tracking-[2px] flex items-center gap-1 font-black">
                        <span className="w-1.5 h-1.5 bg-[#FF1744] rounded-full animate-ping inline-block" />
                        ● INJECTING STRIKE BUY
                      </span>
                    )}
                    {bot.phase === "trading" && (
                      <span className="text-[#00E676] animate-pulse uppercase tracking-[2px] flex items-center gap-1 font-black jarvis-glow-green">
                        <span className="w-1.5 h-1.5 bg-[#00E676] rounded-full animate-ping inline-block" />
                        ● CONTRACT POSITION LIVE
                      </span>
                    )}
                    {bot.phase === "cooldown" && (
                      <span className="text-indigo-400 uppercase tracking-[2px] flex items-center gap-1 font-black">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full inline-block animate-pulse" />
                        ● PORTAL COOL DOWN COOLING
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 py-3.5 text-xs font-mono">
                  <div className="bg-[#080C16] border border-[#15233D]/50 p-2.5 rounded-xl text-center">
                    <span className="text-[8px] text-slate-500 block uppercase tracking-wider font-bold">STAKE</span>
                    <span className="font-extrabold text-white mt-0.5 block text-[11px]">${bot.stake}</span>
                  </div>
                  <div className="bg-[#080C16] border border-[#15233D]/50 p-2.5 rounded-xl text-center">
                    <span className="text-[8px] text-slate-500 block uppercase tracking-wider font-bold">TRADES (W/L)</span>
                    <span className="font-extrabold text-white mt-0.5 block text-[11px]">
                      {bot.tradesCount} ({bot.winCount}/{bot.tradesCount - bot.winCount})
                    </span>
                  </div>
                  <div className="bg-[#080C16] border border-[#15233D]/50 p-2.5 rounded-xl text-center font-bold">
                    <span className="text-[8px] text-slate-500 block uppercase tracking-wider font-bold">PNL (USD)</span>
                    <span className={`mt-0.5 block text-[11px] font-extrabold ${bot.profit >= 0 ? "text-[#00E676] jarvis-glow-green" : "text-rose-500"}`}>
                      ${bot.profit >= 0 ? "+" : ""}{bot.profit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action triggers */}
              <div className="mt-4 border-t border-[#15233D] pt-3 flex items-center justify-between gap-2.5">
                <button
                  onClick={() => setShowConfigId(showConfigId === bot.id ? null : bot.id)}
                  className="p-1 px-3 border border-[#15233D] hover:border-[#00D1FF]/40 text-slate-400 font-mono text-[9px] font-extrabold tracking-widest uppercase rounded-xl hover:text-white cursor-pointer flex items-center gap-1 bg-[#080C16]"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" /> DIALS & LOGIC &alpha;
                </button>

                <button
                  onClick={() => handleToggleBotRunner(bot.id, bot.name)}
                  className={`px-4 py-2 font-black font-mono text-[9px] tracking-widest uppercase rounded-xl cursor-pointer flex items-center gap-1 transition-colors leading-none ${
                    bot.isRunning 
                      ? "bg-rose-500/10 border-2 border-rose-500/30 text-rose-400 hover:bg-rose-500/20" 
                      : "bg-[#00E676] hover:bg-[#00D46A] border-2 border-[#00E676] text-black"
                  }`}
                >
                  {bot.isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-rose-400" /> PAUSE AGENT
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-black fill-black" /> DISPATCH AGENT
                    </>
                  )}
                </button>
              </div>

              {/* Interactive inline config details */}
              {showConfigId === bot.id && (
                <div className="mt-3.5 p-3.5 bg-[#080C16] border-2 border-[#15233D] rounded-2xl text-[10px] font-mono flex flex-col gap-3.5 animate-in slide-in-from-top-3 duration-200">
                  <span className="text-[#00D1FF] font-black text-[9px] uppercase tracking-widest border-b border-[#15233D]/60 pb-1.5 flex items-center justify-between">
                    <span>COGNITIVE DIALS CONTROL</span>
                    <span className="text-slate-500 text-[8px] font-normal uppercase">ASSET: {bot.symbol}</span>
                  </span>

                  {/* Market & Contract Selecors as requested by user */}
                  <div className="grid grid-cols-2 gap-3 pb-2 border-b border-[#15233D]/40">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-[8px] font-black tracking-widest uppercase">TARGET MARKET / SYMBOL</span>
                      <select
                        disabled={bot.isRunning}
                        value={bot.symbol}
                        onChange={(e) => updateBotStats(bot.id, { symbol: e.target.value })}
                        className="w-full px-2 py-1.5 bg-[#04060A] border border-[#15233D] rounded-xl text-white font-bold outline-none focus:border-[#00D1FF] disabled:opacity-50 text-[10px]"
                      >
                        {(symbols && symbols.length > 0 ? symbols : SYSTEM_ASSETS).map((asset: any) => (
                          <option key={asset.symbol} value={asset.symbol}>
                            {asset.display_name || asset.symbol}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-[8px] font-black tracking-widest uppercase">STRATEGY CONTRACT TYPE</span>
                      <select
                        disabled={bot.isRunning}
                        value={bot.contractType}
                        onChange={(e) => updateBotStats(bot.id, { contractType: e.target.value as any })}
                        className="w-full px-2 py-1.5 bg-[#04060A] border border-[#15233D] rounded-xl text-white font-bold outline-none focus:border-[#00D1FF] disabled:opacity-50 text-[10px]"
                      >
                        {SYSTEM_CONTRACT_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-[8px] font-black tracking-widest uppercase">STAKE QUANTITY ($)</span>
                      <input
                        type="number"
                        disabled={bot.isRunning}
                        value={bot.stake}
                        onChange={(e) => updateBotStats(bot.id, { stake: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-[#04060A] border border-[#15233D] rounded-xl text-white font-bold outline-none focus:border-[#00D1FF] disabled:opacity-50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-[8px] font-black tracking-widest uppercase">MARTINGALE SCALING (x)</span>
                      <input
                        type="number"
                        step="0.1"
                        disabled={bot.isRunning}
                        value={bot.config.multiplier || 2.2}
                        onChange={(e) => updateBotStats(bot.id, { config: { ...bot.config, multiplier: Number(e.target.value) } })}
                        className="w-full px-2.5 py-1.5 bg-[#04060A] border border-[#15233D] rounded-xl text-white font-bold outline-none focus:border-[#00D1FF] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-[8px] font-black tracking-widest uppercase">PROFIT LOCK CEILING ($)</span>
                      <input
                        type="number"
                        disabled={bot.isRunning}
                        value={bot.profitTarget}
                        onChange={(e) => updateBotStats(bot.id, { profitTarget: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-[#04060A] border border-[#15233D] rounded-xl text-white font-bold outline-none focus:border-[#00D1FF] disabled:opacity-50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-[8px] font-black tracking-widest uppercase">STOP LOSS FLOOR ($)</span>
                      <input
                        type="number"
                        disabled={bot.isRunning}
                        value={bot.stopLoss}
                        onChange={(e) => updateBotStats(bot.id, { stopLoss: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 bg-[#04060A] border border-[#15233D] rounded-xl text-white font-bold outline-none focus:border-[#00D1FF] disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {(bot.contractType === "DIGITDIFF" || bot.contractType === "DIGITMATCH") && (
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-[8px] font-black tracking-widest uppercase">PREDICTED DIGIT TARGET</span>
                      <select
                        disabled={bot.isRunning}
                        value={bot.config.digitsValue !== undefined ? bot.config.digitsValue : 7}
                        onChange={(e) => updateBotStats(bot.id, { config: { ...bot.config, digitsValue: Number(e.target.value) } })}
                        className="w-full px-2.5 py-1.5 bg-[#04060A] border border-[#15233D] rounded-xl text-white font-bold outline-none focus:border-[#00D1FF] disabled:opacity-50"
                      >
                        {[0,1,2,3,4,5,6,7,8,9].map(digit => (
                          <option key={digit} value={digit}>Digit {digit}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {bot.isRunning && (
                    <span className="text-amber-500 text-[8px] font-black text-center mt-1 animate-pulse uppercase tracking-widest">
                      * DISARM BOT TO RE-CONFIGURE COGNITIVE DIALS
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ticker logs column on current runner */}
      <div className="w-full xl:w-[420px] bg-[#05070D]/95 border-2 border-[#15233D] p-4 rounded-3xl flex flex-col shrink-0 overflow-y-auto shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 border-b border-[#15233D] pb-2 mb-3 font-mono">
          <CircuitBoard className="w-4 h-4 text-[#00D1FF] animate-pulse" />
          <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">COGNITIVE BOT TELEMETRY</h4>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {bots.map(bot => (
            <div key={bot.id} className="p-3 bg-[#080C16] border border-[#15233D] rounded-2xl">
              <span className="text-[8px] font-mono text-[#00D1FF] font-black block mb-1.5 uppercase tracking-widest flex items-center justify-between">
                <span>{bot.name} TELEMETRY FLOWS</span>
                {bot.isRunning && <span className="text-[#00E676] animate-pulse font-extrabold text-[7px] bg-[#00E676]/15 border border-[#00E676]/30 px-1 py-0.5 rounded-lg">● ACTIVE LOGGING</span>}
              </span>

              <div className="h-28 overflow-y-auto font-mono text-[9px] leading-relaxed text-slate-400 flex flex-col gap-1.5 pr-1 max-w-[390px] break-all select-text uppercase">
                {(botLogs[bot.id] || []).map((log, i) => (
                  <p key={i} className="flex gap-1.5 items-start">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                    <span className="flex-1">{log}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
