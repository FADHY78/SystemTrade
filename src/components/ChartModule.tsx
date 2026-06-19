import { useEffect, useRef, useState, useMemo } from "react";
import { createChart, ColorType, ISeriesApi, CandlestickSeries } from "lightweight-charts";
import { useTradingStore } from "../stores/tradingStore";
import { calculateEMA, calculateRSI, generateSyntheticCandles } from "../utils/mockData";
import { Brain, TrendingUp, Compass, Settings2, Play, AlertCircle } from "lucide-react";

export default function ChartModule() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const seriesInstanceRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const {
    selectedSymbol,
    timeframe,
    setTimeframe,
    candles,
    chartType,
    setChartType,
    addLog,
  } = useTradingStore();

  const [indicatorEma, setIndicatorEma] = useState(true);
  const [indicatorBB, setIndicatorBB] = useState(false);
  const [indicatorRsi, setIndicatorRsi] = useState(true);

  // AI states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Timeframes list
  const timeframes = ["1T", "1m", "5m", "15m", "1H", "4H", "1d"];

  // Ensure candles data is never empty (use robust mock dataset if server buffer starts blank)
  const chartData = useMemo(() => {
    if (candles.length > 0) return candles;
    return generateSyntheticCandles(selectedSymbol.symbol, 120);
  }, [candles, selectedSymbol]);

  // Derived indicator values for display & AI prompt
  const indicatorsData = useMemo(() => {
    const closes = chartData.map(c => c.close);
    const ema9 = calculateEMA(closes, 9);
    const ema20 = calculateEMA(closes, 20);
    const rsiVal = calculateRSI(closes, 14);

    return {
      ema9: ema9[ema9.length - 1] || 0,
      ema20: ema20[ema20.length - 1] || 0,
      rsi: rsiVal.rsi,
    };
  }, [chartData]);

  // 1. Initialize Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Reset container contents
    chartContainerRef.current.innerHTML = "";

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#04060A" },
        textColor: "#5B6D8A",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#0B1526", style: 1 },
        horzLines: { color: "#0B1526", style: 1 },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#00D1FF", width: 1 as any, labelBackgroundColor: "#080C16" },
        horzLine: { color: "#00D1FF", width: 1 as any, labelBackgroundColor: "#080C16" },
      },
      timeScale: {
        borderColor: "#15233D",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00E676",
      downColor: "#FF1744",
      borderVisible: false,
      wickUpColor: "#00E676",
      wickDownColor: "#FF1744",
    });

    chartInstanceRef.current = chart;
    seriesInstanceRef.current = candlestickSeries as any;

    // Resize Observer to handle container ref scales with requestAnimationFrame to prevent loop errors
    let resizeFrameId: number | null = null;
    const handleResize = () => {
      if (resizeFrameId) {
        cancelAnimationFrame(resizeFrameId);
      }
      resizeFrameId = requestAnimationFrame(() => {
        if (chartContainerRef.current && chartInstanceRef.current) {
          try {
            chartInstanceRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
              height: chartContainerRef.current.clientHeight,
            });
          } catch (e) {
            console.warn("Soft chart resize reset:", e);
          }
        }
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      if (resizeFrameId) {
        cancelAnimationFrame(resizeFrameId);
      }
      resizeObserver.disconnect();
      chart.removeSeries(candlestickSeries);
      chartInstanceRef.current = null;
    };
  }, []);

  // 2. Feed updates whenever chartData changes
  useEffect(() => {
    if (seriesInstanceRef.current && chartData.length > 0) {
      // Map properties to match lightweight chart parameters exactly
      const formatted = chartData.map(c => ({
        time: c.epoch as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })).sort((a: any, b: any) => a.time - b.time);

      seriesInstanceRef.current.setData(formatted);
    }
  }, [chartData]);

  // 3. SECURE AI Chart analysis route proxy
  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    addLog("info", `Initiating server-side AI chart analysis for ${selectedSymbol.display_name}...`);
    try {
      const response = await fetch("/api/ai/analyze-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedSymbol.symbol,
          timeframe,
          candles: chartData.map(c => ({
            time: new Date(c.epoch * 1000).toLocaleTimeString(),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })).slice(-15),
          indicators: {
            ema: [
              { index: "EMA9", value: indicatorsData.ema9 },
              { index: "EMA20", value: indicatorsData.ema20 }
            ],
            rsi: indicatorsData.rsi
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to contact AI analysis endpoint");
      }

      const parsedResult = await response.json();
      setAiAnalysis(parsedResult);
      addLog("ai", `AI analysis retrieved! Entry recommendation: ${parsedResult.entry_signal || "HOLD"}, Trend bias: ${parsedResult.trend || "NEUTRAL"}`);
    } catch (err: any) {
      addLog("error", `AI analyzer setback: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="ai-chart-panel" className="flex-1 bg-[#04060A] flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden select-none relative">
      
      {/* Chart Canvas Content Section */}
      <div className="flex-1 flex flex-col h-[380px] lg:h-full relative border-b lg:border-b-0 lg:border-r border-[#15233D]">
        
        {/* Controls bar */}
        <div className="h-12 border-b border-[#15233D] bg-[#06080D]/90 p-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
            {timeframes.map(tf => (
              <button
                key={tf}
                id={`tf-select-${tf}`}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-[9px] font-mono font-bold tracking-widest cursor-pointer transition-all ${
                  timeframe === tf 
                    ? "bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]" 
                    : "text-slate-400 hover:text-white hover:bg-[#101625]"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIndicatorEma(!indicatorEma)}
              className={`p-1 px-2.5 border rounded-lg text-[8px] font-mono font-bold tracking-widest transition-all cursor-pointer ${
                indicatorEma ? "bg-[#00D1FF]/10 border-[#00D1FF] text-[#00D1FF]" : "border-[#15233D] text-slate-500 hover:text-slate-300"
              }`}
            >
              EMA 9/20
            </button>
            <button
              onClick={() => setIndicatorBB(!indicatorBB)}
              className={`p-1 px-2.5 border rounded-lg text-[8px] font-mono font-bold tracking-widest transition-all cursor-pointer ${
                indicatorBB ? "bg-[#00D1FF]/10 border-[#00D1FF] text-[#00D1FF]" : "border-[#15233D] text-slate-500 hover:text-slate-300"
              }`}
            >
              BOLLINGER
            </button>
            <button
              onClick={() => setIndicatorRsi(!indicatorRsi)}
              className={`p-1 px-2.5 border rounded-lg text-[8px] font-mono font-bold tracking-widest transition-all cursor-pointer ${
                indicatorRsi ? "bg-[#00D1FF]/10 border-[#00D1FF] text-[#00D1FF]" : "border-[#15233D] text-slate-500 hover:text-slate-300"
              }`}
            >
              RSI (14)
            </button>
          </div>
        </div>

        {/* Lightweight chart element wrapper */}
        <div ref={chartContainerRef} className="flex-grow w-full bg-[#04060A] relative min-h-[250px]" />

        {/* Dynamic Technical Strip display footer overlay */}
        <div className="h-10 px-4 border-t border-[#15233D] bg-[#06080D]/95 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-4 text-slate-400">
            <span>
              EMA 9: <span className="text-[#00D1FF] font-bold">{indicatorsData.ema9.toFixed(4)}</span>
            </span>
            <span>
              EMA 20: <span className="text-amber-400 font-bold">{indicatorsData.ema20.toFixed(4)}</span>
            </span>
            <span>
              RSI: <span className="text-[#00E676] font-bold">{indicatorsData.rsi}</span>
            </span>
          </div>
          <span className="text-[9px] text-[#5B6D8A] font-bold tracking-widest">
            TICK UPDATE VALUE: {(chartData[chartData.length - 1]?.close || 0).toFixed(4)}
          </span>
        </div>
      </div>

      {/* AI Analysers Right Rail Workspace */}
      <div className="w-full lg:w-80 lg:h-full jarvis-glass animate-scan-cyan border-t lg:border-t-0 lg:border-l border-[#15233D] flex flex-col overflow-y-auto z-10">
        <div className="p-4 border-b border-[#15233D] bg-[#080C16] flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <Brain className="w-4 h-4 text-[#00D1FF] animate-pulse" />
            <span className="font-bold text-[10px] tracking-widest text-[#00D1FF] uppercase jarvis-glow-blue">
              J.A.R.V.I.S. QUANTUM ANALYZER
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4 font-mono">
          <button
            id="btn-analyze-with-ai"
            disabled={isAnalyzing}
            onClick={handleAnalyzeWithAI}
            className={`w-full py-3 rounded-xl font-bold font-mono text-[9px] tracking-widest border-2 cursor-pointer border-[#00D1FF] hover:bg-[#00D1FF]/15 text-[#00D1FF] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,209,255,0.1)] duration-300 ${
              isAnalyzing ? "opacity-55 cursor-not-allowed text-gray-400" : ""
            }`}
          >
            <Settings2 className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
            {isAnalyzing ? "COMPILE QUANTUM TELEMETRY..." : "ENGAGE J.A.R.V.I.S. ANALYSIS"}
          </button>

          {aiAnalysis ? (
            <div className="flex flex-col gap-3.5 animate-in fade-in duration-300">
              <div className="p-3 bg-[#080C16]/60 border-2 border-[#1E2E4A] rounded-2xl relative overflow-hidden">
                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">RECOMMENDED RESOLUTION</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-base font-black font-mono tracking-widest ${
                    aiAnalysis.entry_signal === "BUY" ? "text-[#00E676] jarvis-glow-green" : aiAnalysis.entry_signal === "SELL" ? "text-[#FF1744]" : "text-amber-400"
                  }`}>
                    {aiAnalysis.entry_signal || "HOLD"}
                  </span>
                  <span className="text-[10px] bg-[#121F35] border border-[#162C4E] px-2 py-0.5 rounded-lg font-mono text-[#00D1FF] font-bold">
                    CONFIDENCE: {aiAnalysis.confidence || 0}%
                  </span>
                </div>
              </div>

              {/* Targets detail */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#080C16]/60 border border-[#15233D] rounded-xl text-center">
                  <span className="text-[7px] font-mono text-slate-500 block uppercase tracking-widest">TAKE PROFIT TARGET</span>
                  <span className="text-xs font-mono font-black text-[#00E676] mt-1 block tracking-wider">
                    {aiAnalysis.take_profit || "—"}
                  </span>
                </div>
                <div className="p-2.5 bg-[#080C16]/60 border border-[#15233D] rounded-xl text-center">
                  <span className="text-[7px] font-mono text-slate-500 block uppercase tracking-widest">STOP LOSS LIMIT</span>
                  <span className="text-xs font-mono font-black text-[#FF1744] mt-1 block tracking-wider">
                    {aiAnalysis.stop_loss || "—"}
                  </span>
                </div>
              </div>

              {/* Sentiment block */}
              <div className="p-3.5 bg-[#080C16]/60 border border-[#15233D] rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">TREND STATE</p>
                  <p className="text-[10px] font-bold font-mono text-white mt-0.5 uppercase tracking-wide">{aiAnalysis.trend || "RANGING"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">MOMENTUM RATE</p>
                  <p className="text-[10px] font-bold font-mono text-white mt-0.5 uppercase tracking-wide">{aiAnalysis.momentum || "WEAK"}</p>
                </div>
              </div>

              {/* Advice */}
              <div className="p-3.5 bg-[#0A1220]/60 border-l-2 border-[#00D1FF] rounded-r-2xl border-y border-r border-[#15233D]">
                <p className="text-[8px] font-mono text-[#00D1FF] uppercase font-black tracking-widest">COGNITIVE OBSERVATION</p>
                <p className="text-[10px] text-slate-300 mt-2 leading-relaxed font-mono">
                  {aiAnalysis.commentary}
                </p>
              </div>

              {/* Recommended contract */}
              <div className="p-3.5 bg-[#080C16]/60 border border-[#15233D] rounded-2xl flex items-center justify-between">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">OPTIMAL TICKET SPEC</span>
                <span className="text-[9px] font-mono font-black bg-[#10182D] px-2.5 py-1 border border-[#162744] rounded text-[#00D1FF] uppercase tracking-widest">
                  {aiAnalysis.contract_type || "CALL_BARRIER"}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 border-2 border-dashed border-[#1E2E4A] rounded-3xl flex flex-col items-center justify-center p-4 text-center">
              <Compass className="w-8 h-8 text-slate-600 mb-3 animate-pulse" />
              <p className="text-[9px] text-[#00D1FF] font-black mb-1 uppercase tracking-widest">Awaiting Probe Link</p>
              <p className="text-[8px] font-mono text-slate-500 leading-normal max-w-[200px] uppercase tracking-wider">
                ENGAGE JARVIS ENGINE RADAR SYSTEM TO EXTRACT SERVER ESTIMATIONS AND SUPPORT PATHWAYS.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
