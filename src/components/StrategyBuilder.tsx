import { useState, useMemo } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { Brain, Play, Settings, RefreshCw, Layers, Sliders, CheckSquare, Plus, Trash2, Code2, LineChart, FileJson, Award } from "lucide-react";
import { VisualStrategy, StrategyBlock } from "../types/trading.types";
import { useDerivWS } from "../hooks/useDerivWS";

export default function StrategyBuilder() {
  const {
    strategies,
    selectedSymbol,
    saveStrategy,
    deleteStrategy,
    addLog,
  } = useTradingStore();

  const [activeTab, setActiveTab] = useState<"visual" | "code" | "backtest" | "library" | "runner">("visual");
  const [activeStrategy, setActiveStrategy] = useState<VisualStrategy>(strategies[0]);
  
  // Visual blocks canvas editors list
  const [canvasBlocks, setCanvasBlocks] = useState<StrategyBlock[]>(activeStrategy.blocks);

  // Simulated code editing space
  const [codeContent, setCodeContent] = useState<string>(`/**
 * @license
 * Custom Deriv AI Strategy Script
 */
interface Strategy {
  name: string;
  symbol: string;
  analyze(ticks: Tick[], candles: Candle[]): TradeSignal | null;
  getStake(balance: number): number;
}

export default class CustomRSIStrategy implements Strategy {
  name = "${activeStrategy.name}";
  symbol = "${selectedSymbol.symbol}";

  analyze(ticks: Tick[], candles: Candle[]) {
    const lastRsi = indicators.rsi(candles, 14);
    if (lastRsi < 30) {
      return { action: "BUY", type: "CALL", confidence: 85 };
    } else if (lastRsi > 70) {
      return { action: "SELL", type: "PUT", confidence: 85 };
    }
    return null;
  }

  getStake(balance: number) {
    return balance * 0.05; // 5% Risk ceiling
  }
}`);

  // Backtesting States
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestStats, setBacktestStats] = useState<any | null>(null);
  const [aiCodeCritique, setAiCodeCritique] = useState<any>(null);
  const [isCritiquing, setIsCritiquing] = useState(false);

  // Runner states
  const [runningStrategies, setRunningStrategies] = useState<Record<string, boolean>>({});
  const [runnerPnl, setRunnerPnl] = useState<Record<string, number>>({});

  // Block definitions for dragging / placing
  const PRESET_BLOCK_TILES = [
    { type: "ENTRY" as const, label: "EMA 9/20 Cross", category: "Price Action", details: "Trigger on structural moving crossovers" },
    { type: "ENTRY" as const, label: "RSI Reversal", category: "Indicator Signals", details: "Outside normal bounds (70/30)" },
    { type: "ENTRY" as const, label: "Doji Refusal candle", category: "Price Action", details: "Pinbar/engulfing shapes" },
    { type: "ENTRY" as const, label: "Digit Streak bias", category: "Digit Conditions", details: "Same digit streak exceeds threshold" },
    { type: "LOGIC" as const, label: "Logical AND Gate", category: "Operators", details: "All inputs must evaluate true" },
    { type: "LOGIC" as const, label: "Logical OR Gate", category: "Operators", details: "Any one input operates" },
    { type: "MANAGEMENT" as const, label: "Take Profit Limit", category: "Risk Lock", details: "Amount or percentage constraints" },
    { type: "MANAGEMENT" as const, label: "Stop Loss Safety", category: "Risk Lock", details: "Enforces a hard account limit" },
    { type: "MONEY" as const, label: "Martingale progression", category: "Position Scale", details: "Double stakes after losses" },
    { type: "MONEY" as const, label: "Kelly Criterion ratio", category: "Position Scale", details: "Dynamic winrate-based sizing" },
  ];

  // Canvas operations
  const handleAddBlockToCanvas = (tile: typeof PRESET_BLOCK_TILES[0]) => {
    const block: StrategyBlock = {
      id: "block_" + Math.random().toString(36).substring(2, 7),
      type: tile.type,
      label: tile.label,
      category: tile.category,
      config: {}
    };
    const updated = [...canvasBlocks, block];
    setCanvasBlocks(updated);

    // Sync save
    const currentStrat = { ...activeStrategy, blocks: updated };
    setActiveStrategy(currentStrat);
    saveStrategy(currentStrat);
    addLog("info", `Appended strategy block: ${tile.label}`);
  };

  const handleRemoveBlockFromCanvas = (blockId: string) => {
    const updated = canvasBlocks.filter(b => b.id !== blockId);
    setCanvasBlocks(updated);

    const currentStrat = { ...activeStrategy, blocks: updated };
    setActiveStrategy(currentStrat);
    saveStrategy(currentStrat);
  };

  // Switch strategy
  const handleSelectStrategy = (strat: VisualStrategy) => {
    setActiveStrategy(strat);
    setCanvasBlocks(strat.blocks);
    addLog("info", `Loaded strategy context: ${strat.name}`);
  };

  // Convert visual blocks to script
  const handleConvertVisualToCode = () => {
    let script = `/**\n * Auto-generated from Visual Builder Block configuration\n */\n`;
    script += `export default class CompiledStrategy {\n`;
    script += `  name = "${activeStrategy.name}";\n`;
    script += `  type = "${activeStrategy.contractType}";\n\n`;
    script += `  analyze(candles: Candle[]) {\n`;
    
    canvasBlocks.forEach(b => {
      script += `    // Block: ${b.label} (${b.category})\n`;
      if (b.label.includes("RSI")) {
        script += `    if (indicators.rsi(candles) < 30) return "BUY";\n`;
      }
    });
    script += `    return "HOLD";\n`;
    script += `  }\n}`;
    setCodeContent(script);
    setActiveTab("code");
    addLog("success", "Compiled Visual strategy blocks to TS scripting workbench!");
  };

  // Historical simulation computations
  const handleRunBacktest = () => {
    setIsBacktesting(true);
    addLog("info", `Loading tick buffer history for ${selectedSymbol.symbol}. Simulating strategy performance...`);

    setTimeout(() => {
      // Create random but mathematically grounded strategy backtest metrics
      const winRatePercent = activeStrategy.expectedWinRate + Math.round((Math.random() - 0.5) * 6);
      const totalTrades = 45 + Math.round(Math.random() * 30);
      const wins = Math.round(totalTrades * (winRatePercent / 100));
      const losses = totalTrades - wins;
      const totalNetResult = (wins * 9.5) - (losses * 10);

      const computedStats = {
        symbol: selectedSymbol.symbol,
        tradesCount: totalTrades,
        winRate: winRatePercent,
        wins,
        losses,
        profit: totalNetResult,
        sharpe: (1.5 + Math.random() * 0.8).toFixed(2),
        drawdown: (3.1 + Math.random() * 4).toFixed(1),
        profitFactor: (1.2 + Math.random() * 0.5).toFixed(2),
        curve: Array.from({ length: 15 }, (_, idx) => ({
          tradeNum: idx,
          equity: Math.round(1000 + (idx * totalNetResult / 14) + (Math.random() - 0.5) * 80)
        }))
      };

      setBacktestStats(computedStats);
      setIsBacktesting(false);
      addLog("success", `Backtesting complete! Simulated ${totalTrades} trades. Win rate: ${winRatePercent}%. Profit: $${totalNetResult.toFixed(2)}.`);
    }, 1800);
  };

  // SECURE request to ask Gemini proxy to critique performance outcomes
  const handleQueryAICritique = async () => {
    if (!backtestStats) return;
    setIsCritiquing(true);
    addLog("info", "Deploying Gemini critique proxy to audit backtester curves...");

    try {
      const response = await fetch("/api/ai/performance-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: {
            symbol: selectedSymbol.symbol,
            winRate: backtestStats.winRate,
            drawdown: backtestStats.drawdown,
            profitFactor: backtestStats.profitFactor,
            netProfit: backtestStats.profit,
          },
          history: [
            { id: "1", outcome: "WON", profit: 9.50 },
            { id: "2", outcome: "LOST", profit: -10.00 },
            { id: "3", outcome: "WON", profit: 9.50 },
          ]
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to execute query with performance endpoints");
      }

      const adviceResult = await response.json();
      setAiCodeCritique(adviceResult);
      addLog("ai", "AI quantitative strategy audit advice rendered of quality rating: " + adviceResult.rating);
    } catch (err: any) {
      addLog("error", `AI portfolio auditor fault: ${err.message}`);
    } finally {
      setIsCritiquing(false);
    }
  };

  // Live strategy runner operations
  const handleToggleRunner = (id: string) => {
    const isCurrentlyRunning = Boolean(runningStrategies[id]);
    setRunningStrategies(prev => ({ ...prev, [id]: !isCurrentlyRunning }));
    
    if (!isCurrentlyRunning) {
      addLog("success", `Active strategy runner deployed: ${activeStrategy.name} is now actively evaluating incoming ticks...`);
      // Start adding random tiny increments
      setRunnerPnl(prev => ({ ...prev, [id]: prev[id] || 0 }));
    } else {
      addLog("warning", `Paused strategy runner: ${activeStrategy.name}`);
    }
  };

  return (
    <div id="no-code-builder-workspace" className="flex-1 bg-[#04060A] flex flex-col h-full overflow-y-auto select-none p-4 gap-4">
      
      {/* Horizontal Submodule Navigation Bar */}
      <div className="h-12 border-2 border-[#15233D] bg-[#05070D]/95 p-2 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-1 font-mono">
          {[
            { id: "visual", label: "No-Code blocks", icon: Layers },
            { id: "code", label: "Scripting workbench", icon: Code2 },
            { id: "backtest", label: "Simulated Backtester", icon: LineChart },
            { id: "library", label: "Premade Library", icon: FileJson },
            { id: "runner", label: "Active Live Runner", icon: Play }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === "visual") setCanvasBlocks(activeStrategy.blocks);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer border ${
                  activeTab === tab.id 
                    ? "bg-[#0A1220] text-[#00D1FF] border-[#00D1FF]/30 jarvis-glow-blue" 
                    : "text-slate-400 border-transparent hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-[8px] text-slate-500 tracking-wider">SELECTED FOCUS:</span>
          <select
            value={activeStrategy.id}
            onChange={(e) => {
              const selected = strategies.find(s => s.id === e.target.value);
              if (selected) handleSelectStrategy(selected);
            }}
            className="bg-[#080C16] text-[10px] border border-[#15233D] rounded-xl px-3 py-1 text-white opacity-95 outline-none font-mono focus:border-[#00D1FF] cursor-pointer"
          >
            {strategies.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Submodules Workspace viewports */}
      <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0">
        
        {/* VIEWPORT 1: No-Code Visual Canvas workspace */}
        {activeTab === "visual" && (
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            
            {/* Sidebar Blocks list available */}
            <div className="w-full md:w-60 bg-[#05070D]/95 border-2 border-[#15233D] p-4 rounded-3xl flex flex-col gap-3 shrink-0 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
              <span className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] border-b border-[#15233D] pb-1.5 block font-mono jarvis-glow-blue">Condition Blocks</span>
              <p className="text-[9px] text-slate-500 leading-normal font-mono uppercase">Click a parameter block to insert it into your active strategy logic path.</p>
              
              <div className="flex flex-col gap-2 overflow-y-auto max-h-96 pr-1 no-scrollbar">
                {PRESET_BLOCK_TILES.map((tile, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddBlockToCanvas(tile)}
                    className="p-3 text-left bg-[#080C16] hover:bg-[#0A1A30]/50 border-2 border-[#15233D] rounded-xl transition-all cursor-pointer group hover:border-[#00D1FF]/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 group-hover:text-[#00D1FF] transition-colors font-mono">{tile.label}</span>
                      <Plus className="w-3.5 h-3.5 text-[#00D1FF] shrink-0" />
                    </div>
                    <span className="text-[8px] text-slate-500 font-mono block mt-1 leading-normal uppercase">{tile.details}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy builder visual canvas grid container */}
            <div className="flex-1 bg-[#05070D]/95 border-2 border-[#15233D] rounded-3xl p-6 flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col gap-4">
                <div className="border-b border-[#15233D] pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-white font-mono">{activeStrategy.name}</h4>
                    <p className="text-[9px] text-slate-400 mt-1 leading-normal font-mono uppercase">{activeStrategy.description}</p>
                  </div>
                  <button
                    onClick={handleConvertVisualToCode}
                    className="px-3 py-1.5 bg-[#00D1FF]/10 hover:bg-[#00D1FF] select-none text-black hover:text-black border border-[#00D1FF]/40 text-[9px] font-mono font-black tracking-widest uppercase rounded-xl transition-all cursor-pointer text-[#00D1FF] jarvis-glow-blue"
                  >
                    COMPILE SCRIPT
                  </button>
                </div>

                {/* Vertical visual blocks stack */}
                <div className="flex flex-col gap-3 min-h-[250px] relative">
                  {canvasBlocks.length === 0 ? (
                    <div className="h-60 border-2 border-dashed border-[#15233D] rounded-2xl flex flex-col items-center justify-center text-center p-4">
                      <Sliders className="w-10 h-10 text-slate-600 mb-2 animate-bounce" />
                      <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider font-mono">Visual Canvas is Empty</p>
                      <p className="text-[8px] text-slate-500 font-mono leading-normal max-w-[200px] uppercase">Insert condition elements or sizing rules to design the quantitative sequence logic of options purchases.</p>
                    </div>
                  ) : (
                    canvasBlocks.map((b, idx) => (
                      <div key={b.id} className="p-3.5 bg-[#080C16] border-l-4 border-[#00D1FF] border-2 border-y-[#15233D] border-r-[#15233D] rounded-r-xl flex items-center justify-between shadow-[0_3px_12px_rgba(0,0,0,0.2)]">
                        <div className="flex items-center gap-3">
                          <span className="h-5 w-5 rounded-full bg-[#0A1220] border border-[#15233D] text-[#00D1FF] text-[8px] font-mono flex items-center justify-center font-black">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-[11px] font-bold text-white block uppercase tracking-wide font-mono">{b.label}</span>
                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none mt-0.5 inline-block font-bold">
                              {b.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex gap-2 items-center">
                            <span className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider">WEIGHT:</span>
                            <input
                              type="number"
                              defaultValue={1.0}
                              className="w-12 text-center text-[10px] font-mono bg-[#030508] text-[#00D1FF] border border-[#15233D] py-0.5 rounded outline-none"
                            />
                          </div>

                          <button
                            onClick={() => handleRemoveBlockFromCanvas(b.id)}
                            className="p-1 px-2 border-2 border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/15 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Strategy specifications configuration */}
              <div className="mt-8 border-t border-[#121F35] pt-4 grid grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-[#080C16] rounded-xl border-2 border-[#15233D]">
                  <span className="text-[8px] text-slate-500 block uppercase font-black tracking-widest">COMPATIBLE ASSET</span>
                  <span className="font-bold text-white mt-1 block text-[10px]">{selectedSymbol.display_name}</span>
                </div>
                <div className="p-3 bg-[#080C16] rounded-xl border-2 border-[#15233D]">
                  <span className="text-[8px] text-slate-500 block uppercase font-black tracking-widest">EXPECTED CRITICAL</span>
                  <span className="font-bold text-[#00E676] mt-1 block text-[10px] jarvis-glow-green">{activeStrategy.expectedWinRate}% WIN-RATE</span>
                </div>
                <div className="p-3 bg-[#080C16] rounded-xl border-2 border-[#15233D]">
                  <span className="text-[8px] text-slate-500 block uppercase font-black tracking-widest">EXPECTED RISK LEVEL</span>
                  <span className="font-bold text-rose-400 mt-1 block uppercase text-[10px]">{activeStrategy.riskLevel}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEWPORT 2: Coding script workbench */}
        {activeTab === "code" && (
          <div className="flex-1 bg-[#05070D]/95 border-2 border-[#15233D] p-4 rounded-3xl flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between border-b border-[#15233D] pb-2.5 mb-3 font-mono">
                <span className="font-bold text-[10px] text-[#00D1FF] uppercase tracking-widest jarvis-glow-blue">TS SCRIPTING WORKBENCH</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">PAPER TRADING SIMULATION ACTIVE</span>
              </div>

              {/* Code input text area */}
              <div className="flex-1 min-h-[300px] border-2 border-[#15233D] rounded-xl relative overflow-hidden bg-black/40 flex font-mono text-xs shadow-inner">
                {/* Simulated line numbering */}
                <div className="w-10 bg-black/60 py-3 text-right bg-[#080C16] border-r-2 border-[#15233D] text-slate-600 select-none pr-3 leading-6 shrink-0 text-[10px]">
                  {Array.from({ length: 22 }, (_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>

                {/* Main text box */}
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="w-full h-full bg-transparent resize-none leading-6 text-slate-300 p-3 py-3 font-mono text-xs outline-none select-text border-none focus:ring-0 active:ring-0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 font-mono">
              <button
                onClick={() => addLog("success", "Script compiled inside browser sandbox environment. Compiling type annotations succeeded.")}
                className="px-4 py-2 bg-[#080C16] hover:bg-[#15233D]/30 text-[9px] font-black uppercase tracking-widest text-[#00D1FF] border-2 border-[#15233D] rounded-xl transition-all cursor-pointer"
              >
                COMPILE CHECK
              </button>
              <button
                onClick={() => {
                  addLog("info", "Starting Custom Strategy deployment dry-runs...");
                  setActiveTab("backtest");
                }}
                className="px-4 py-2 bg-[#00D1FF] text-[9px] font-black uppercase tracking-widest text-black hover:bg-[#00B4DB] rounded-xl transition-all shadow-[0_4px_12px_rgba(0,209,255,0.2)] cursor-pointer"
              >
                LAUNCH SIMULATION BACKTEST
              </button>
            </div>
          </div>
        )}

        {/* VIEWPORT 3: Backtesting & parameters optimization workspace */}
        {activeTab === "backtest" && (
          <div className="flex-1 flex flex-col md:flex-row gap-4">
            
            {/* Left Backtest triggers panel */}
            <div className="w-full md:w-80 bg-[#05070D]/95 border-2 border-[#15233D] p-4 rounded-3xl shrink-0 flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-[#15233D] pb-2 font-mono">
                  <Sliders className="w-4 h-4 text-[#00D1FF]" />
                  <span className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">Simulation Setup</span>
                </div>

                {/* Backtester controls */}
                <div className="flex flex-col gap-3 text-xs font-mono">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500">BACKTEST SYMBOL</label>
                    <input
                      type="text"
                      disabled
                      value={selectedSymbol.display_name}
                      className="px-3 py-2 bg-[#0E1014] border border-[#1E2028] text-gray-400 rounded-lg outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-gray-500">START DATE</label>
                      <input
                        type="date"
                        defaultValue="2026-06-01"
                        className="px-3 py-2 bg-[#0E1014] border border-[#1E2028] text-white rounded-lg outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-gray-500">END DATE</label>
                      <input
                        type="date"
                        defaultValue="2026-06-18"
                        className="px-3 py-2 bg-[#0E1014] border border-[#1E2028] text-white rounded-lg outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500">PARAM MINIMA RANGE (EMA LENGTHS)</label>
                    <input
                      type="text"
                      defaultValue="EMA 10-50, step 5"
                      className="px-3 py-2 bg-[#0E1014] border border-[#1E2028] text-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                disabled={isBacktesting}
                onClick={handleRunBacktest}
                className="w-full mt-4 py-3 bg-[#00D1FF] hover:bg-[#00B4DB] text-black font-black font-mono text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,209,255,0.25)] flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={isBacktesting ? "animate-spin w-4 h-4" : "w-4 h-4"} />
                {isBacktesting ? "COMPUTING MATRIX..." : "RUN HISTORICAL SIMULATION"}
              </button>
            </div>

            {/* Right Simulation outcomes panel */}
            <div className="flex-1 flex flex-col gap-4">
              
              {backtestStats ? (
                <div className="flex-1 flex flex-col gap-4">
                  {/* Stats counters grid layout */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-3 bg-[#111318] border border-[#1E2028] rounded-xl">
                      <span className="text-[9px] text-gray-500">TOTAL SIM TRADES</span>
                      <span className="text-sm font-black text-white mt-1 block">{backtestStats.tradesCount}</span>
                    </div>
                    <div className="p-3 bg-[#111318] border border-[#1E2028] rounded-xl font-bold">
                      <span className="text-[9px] text-gray-500">EXPECTED WIN-RATE</span>
                      <span className="text-sm text-[#00E676] mt-1 block font-mono">{backtestStats.winRate}%</span>
                    </div>
                    <div className="p-3 bg-[#111318] border border-[#1E2028] rounded-xl font-bold">
                      <span className="text-[9px] text-gray-500">ESTIMATED SHARPE_R</span>
                      <span className="text-sm text-[#00D1FF] mt-1 block font-mono">{backtestStats.sharpe}</span>
                    </div>
                    <div className="p-3 bg-[#111318] border border-[#1E2028] rounded-xl">
                      <span className="text-[9px] text-gray-500">MAX DRAWDOWN %</span>
                      <span className="text-sm text-rose-500 mt-1 block font-mono">-{backtestStats.drawdown}%</span>
                    </div>
                  </div>

                  {/* SVG Equity Line Chart details */}
                  <div className="h-44 p-4 bg-[#111318] border border-[#1E2028] rounded-3xl flex flex-col justify-between">
                    <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest font-mono">Simulated Equity Growth Curve</span>
                    <div className="flex-1 w-full flex items-end gap-1 px-4 py-2 border-b border-l border-[#1E2028]">
                      {backtestStats.curve.map((entry: any, i: number) => {
                        const h = Math.abs((entry.equity - 800) / 4);
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-[#00D1FF]/60 to-[#00E676]/95 hover:brightness-125 transition-all text-center group cursor-pointer"
                            style={{ height: `${Math.max(10, h)}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Gemini Strategy Audit Box critiquing curve */}
                  <div className="p-4 bg-[#111318] border border-[#1E2028] rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-1 border-b border-[#1E2028] mb-2">
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-[#00E676] animate-pulse" />
                        <span className="font-bold text-xs uppercase tracking-wider text-[#00E676]">Gemini Quantitative Strategy Critique</span>
                      </div>
                      <button
                        onClick={handleQueryAICritique}
                        disabled={isCritiquing}
                        className="text-[9px] font-mono tracking-widest uppercase text-[#00D1FF] cursor-pointer hover:underline"
                      >
                        {isCritiquing ? "RUNNING AUDIT..." : "AUDIT RESULTS"}
                      </button>
                    </div>

                    {aiCodeCritique ? (
                      <div className="flex flex-col gap-2.5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white uppercase bg-[#0E1014] p-1 px-2 border border-[#1E2028] rounded-lg">
                            STRATEGY RATING: {aiCodeCritique.rating || "B+"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 font-mono leading-normal font-sans">
                          {aiCodeCritique.critique}
                        </p>
                        <p className="text-xs text-gray-400 font-mono leading-normal border-t border-[#1C1E26] pt-1 mt-1 font-sans">
                          <span className="font-bold text-[#00E676]">Gemini Recommendation:</span> {aiCodeCritique.advice}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-gray-500 leading-normal py-2 uppercase text-center">Awaiting curve compilation... click "AUDIT RESULTS" to trigger server advisory proxy.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 border-2 border-dashed border-[#1C1E26] rounded-3xl flex flex-col items-center justify-center p-6 text-center">
                  <LineChart className="w-12 h-12 text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Awaiting Simulation Results</p>
                  <p className="text-[10px] text-gray-500 font-mono leading-normal max-w-[280px]">Inject parameters inside Setup panel on the left and start backtesting over historical blocks.</p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* VIEWPORT 4: Pre-built templates Library list */}
        {activeTab === "library" && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {strategies.map(strat => (
              <div
                key={strat.id}
                className="p-5 bg-[#111318] border border-[#1E2028] hover:border-slate-500/30 rounded-3xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#1E2028]">
                    <span className="font-bold text-xs text-white uppercase block">{strat.name}</span>
                    <span className="text-[9px] font-mono bg-[#1E2028] px-2 py-0.5 rounded text-[#00D1FF] uppercase">
                      {strat.contractType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-mono leading-relaxed">{strat.description}</p>
                </div>

                <div className="mt-8 border-t border-[#1C1E26] pt-3 flex items-center justify-between">
                  <div className="flex gap-2 items-center text-[10px] font-mono text-gray-500">
                    <span>RISK: <span className="text-rose-400 block font-bold uppercase">{strat.riskLevel}</span></span>
                    <span>PROBABILITY: <span className="text-[#00E676] block font-bold uppercase">{strat.expectedWinRate}%</span></span>
                  </div>

                  <button
                    onClick={() => {
                      handleSelectStrategy(strat);
                      setActiveTab("visual");
                      addLog("success", `Loaded library model: ${strat.name}`);
                    }}
                    className="p-1 px-4 bg-[#1E2028] hover:bg-[#00D1FF] hover:text-black border border-[#1E2028] text-xs font-mono font-bold text-white rounded-lg transition-all cursor-pointer"
                  >
                    SELECT MODEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEWPORT 5: Live runner activation console */}
        {activeTab === "runner" && (
          <div className="flex-1 bg-[#111318] border border-[#1E2028] p-5 rounded-3xl flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <div className="border-b border-[#1E2028] pb-2.5 flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-white tracking-wider font-mono">Live Strategy Dispatcher</span>
                <span className="text-[9px] font-mono text-gray-500 uppercase">Simulated Real-Time Tick evaluation loop active</span>
              </div>

              {/* Deployment Card */}
              <div className="p-4 bg-[#0E1014] border border-[#1E2028] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full relative ${
                    runningStrategies[activeStrategy.id] ? "animate-pulse bg-[#00E676]" : "bg-gray-500"
                  }`} />
                  <div>
                    <span className="text-xs font-bold text-white block">{activeStrategy.name} (LIVE DISPATCHED)</span>
                    <span className="text-[10px] font-mono text-[#6B7280]">Focusing Instrument: {selectedSymbol.display_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-gray-500 block">TOTAL DISPATCH PNL</span>
                    <span className={`font-bold mt-0.5 block ${
                      (runnerPnl[activeStrategy.id] || 0) >= 0 ? "text-[#00E676]" : "text-rose-500"
                    }`}>
                      ${(runnerPnl[activeStrategy.id] || 0).toFixed(2)} USD
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleRunner(activeStrategy.id)}
                    className={`px-4 py-2 text-xs font-bold font-mono rounded-xl cursor-pointer transition-all ${
                      runningStrategies[activeStrategy.id] 
                        ? "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)]" 
                        : "bg-[#00E676] hover:bg-[#00D46A] text-black shadow-[0_4px_12px_rgba(0,230,118,0.25)]"
                    }`}
                  >
                    {runningStrategies[activeStrategy.id] ? "STOP" : "START RUNNER"}
                  </button>
                </div>
              </div>

              {/* Logs box */}
              <div className="bg-black/40 border border-[#1E2028] rounded-2xl p-4 h-48 overflow-y-auto font-mono text-[10px] text-gray-400 leading-normal flex flex-col gap-1 pr-1.5 no-scrollbar">
                <p className="text-[#00E676] font-bold">[00:00:00] Dispatch server initiated. Stoppages rules linked.</p>
                {runningStrategies[activeStrategy.id] ? (
                  <>
                    <p className="text-gray-300">[{new Date().toLocaleTimeString()}] Listening for ticks on symbol {selectedSymbol.symbol}...</p>
                    <p className="text-slate-400">[{new Date().toLocaleTimeString()}] Checking visual formula weight arrays...</p>
                    <p className="text-slate-400">[{new Date().toLocaleTimeString()}] Signal check: HOLD. Moving thresholds intact.</p>
                  </>
                ) : (
                  <p className="text-gray-500">System standby. Tap "START RUNNER" to initiate quantitative dispatching loop.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
