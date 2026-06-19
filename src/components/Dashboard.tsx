import { useState } from "react";
import { useTradingStore } from "../stores/tradingStore";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MainDashboard from "./MainDashboard";
import ChartModule from "./ChartModule";
import DigitMatrix from "./DigitMatrix";
import StrategyBuilder from "./StrategyBuilder";
import TradingBots from "./TradingBots";
import SignalsCreator from "./SignalsCreator";
import MarketHub from "./MarketHub";
import TradeExecution from "./TradeExecution";
import PerformanceDashboard from "./PerformanceDashboard";
import SettingsPanel from "./SettingsPanel";
import Authentication from "./Authentication";
import { useDerivWS } from "../hooks/useDerivWS";
import { useAccount } from "../hooks/useAccount";
import { useBotOrchestrator } from "../hooks/useBotOrchestrator";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, 
  Activity, 
  AlertCircle, 
  X, 
  Sparkles, 
  Cpu, 
  TrendingUp, 
  Coins, 
  ShieldAlert,
  ChevronUp,
  ChevronDown
} from "lucide-react";

export default function Dashboard() {
  const { logs, clearLogs, token } = useTradingStore();
  const [activeTab, setActiveTab] = useState(token ? "dashboard" : "auth");
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSetActiveTabChange = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Initialize live Deriv connection
  useDerivWS();

  // Initialize automated digital-AI agent brainwave orchestrator
  useBotOrchestrator();

  const {
    balance,
    currency,
    loginId,
    isVirtual,
    connectionStatus,
    isAuthorized
  } = useAccount();

  // Render child modules dynamically based on active Zustand navigational state
  const renderMainView = () => {
    switch (activeTab) {
      case "dashboard":
        return <MainDashboard />;
      case "chart":
        return <ChartModule />;
      case "digits":
        return <DigitMatrix />;
      case "strategies":
        return <StrategyBuilder />;
      case "bots":
        return <TradingBots />;
      case "signals":
        return <SignalsCreator />;
      case "markets":
        return <MarketHub />;
      case "performance":
        return <PerformanceDashboard />;
      case "settings":
        return <SettingsPanel />;
      case "auth":
        return <Authentication onBypassSimulator={() => handleSetActiveTabChange("dashboard")} />;
      default:
        return <MainDashboard />;
    }
  };

  return (
    <div id="deriv-dashboard-wrapper" className="flex h-screen w-screen bg-[#030508] text-gray-300 overflow-hidden font-sans antialiased selection:bg-[#00D1FF]/30 select-none relative">
      <div className="pointer-events-none absolute inset-0 bg-[#00D1FF]/[0.015] z-[1]" />

      {/* Sidebar Layout */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleSetActiveTabChange} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* Backdrop overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-45 md:hidden backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
        />
      )}

      {/* Main Workspace Frame panel */}
      <div className="flex-grow flex flex-col h-full overflow-hidden min-w-0 relative">
        
        {/* Top Asset Select + User Details bar */}
        <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

        {/* Dynamic component workspace content */}
        <div id="viewport-container" className="flex-grow min-h-0 bg-[#04060A] overflow-hidden relative">
          {renderMainView()}

          {/* FUTURISTIC FLOATING HOLOGRAM AI BALANCE HUD */}
          <div className="absolute right-3 bottom-3 sm:right-5 sm:bottom-5 z-40 max-w-sm pointer-events-auto">
            <AnimatePresence mode="wait">
              {hudCollapsed ? (
                <motion.button
                  key="collapsed-hud"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => setHudCollapsed(false)}
                  className="p-2 md:p-3 jarvis-glass border-[#00D1FF]/40 hover:border-[#00D1FF] rounded-2xl cursor-pointer text-[#00D1FF] flex items-center gap-2 hover:shadow-[0_0_15px_rgba(0,209,255,0.3)] transition-all font-mono text-[8px] md:text-[9px] font-black tracking-widest uppercase"
                >
                  <Cpu className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#00D1FF] animate-spin-slow-reverse" />
                  <span>EQUITY COGNITION</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </motion.button>
              ) : (
                <motion.div
                  key="expanded-hud"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="jarvis-glass animate-scan-cyan rounded-3xl p-4 md:p-5 w-64 sm:w-72 md:w-80 shadow-[0_12px_40px_rgba(0,0,0,0.95)] relative overflow-hidden"
                >
                  {/* Neon target line scanning */}
                  <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#00D1FF] to-transparent absolute top-0 left-0 animate-pulse" />

                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[#15233D] pb-2 sm:pb-3 mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-[#00D1FF]" />
                      <span className="text-[8px] md:text-[9px] font-black tracking-widest text-[#00D1FF] uppercase jarvis-glow-blue">
                        J.A.R.V.I.S. COGNITION HUD
                      </span>
                    </div>
                    <button
                      onClick={() => setHudCollapsed(true)}
                      className="text-slate-500 hover:text-[#00D1FF] transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body telemetry stats */}
                  <div className="space-y-3.5 font-mono">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[7.5px] font-mono text-slate-500 uppercase block tracking-widest">
                          IDENTITY ASSIGNMENT
                        </span>
                        <span className="text-[8.5px] md:text-[10px] font-mono font-bold text-slate-300">
                          {isAuthorized ? `AUTHORIZED NODE (${loginId})` : "UNAUTHORIZED ACCESS"}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-mono font-extrabold uppercase ${
                        isVirtual ? "bg-amber-400/10 text-amber-500 border border-amber-400/20" : "bg-emerald-400/10 text-emerald-500 border border-emerald-400/20"
                      }`}>
                        {isVirtual ? "Virtual Spec" : "Live capital"}
                      </span>
                    </div>

                    <div className="bg-[#03060E]/80 border border-[#1E2E4A]/60 rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between relative overflow-hidden">
                      <div className="absolute right-2 top-2">
                        <Coins className="w-10 h-10 text-slate-900 absolute -right-4 -top-4 opacity-15 select-none pointer-events-none" />
                      </div>
                      <div>
                        <span className="text-[7.5px] font-mono text-[#00D1FF] font-black uppercase tracking-widest block mb-1">
                          SECURED TELEMETRY BALANCE
                        </span>
                        <span className="text-sm md:text-base font-mono font-black text-[#00E676] tracking-widest block leading-none jarvis-glow-green">
                          {currency} {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      {/* Connection radar ping */}
                      <div className="flex flex-col items-end">
                        <span className={`h-2 w-2 rounded-full ${connectionStatus === "connected" ? "bg-[#00E676] animate-pulse shadow-[0_0_10px_rgb(0,230,118)]" : "bg-red-500 animate-pulse"}`} />
                        <span className="text-[7px] text-[#5B6D8A] font-mono mt-1 font-bold uppercase tracking-widest">
                          {connectionStatus}
                        </span>
                      </div>
                    </div>

                    {/* Interactive quick action */}
                    {!isAuthorized && (
                      <button
                        onClick={() => setActiveTab("auth")}
                        className="w-full py-2 bg-[#00D1FF]/10 hover:bg-[#00D1FF] text-[#00D1FF] hover:text-black font-extrabold font-mono text-[8px] md:text-[9px] uppercase tracking-widest rounded-xl transition-all border border-[#00D1FF]/30 cursor-pointer text-center duration-300"
                      >
                        DECRYPT FULL TRADING TERMINAL
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Real-time Terminal system logs layout overlay */}
        <footer id="dashboard-system-footer" className="h-20 sm:h-28 border-t border-[#15233D] bg-[#05070D]/80 backdrop-blur-md p-2 sm:p-3 flex flex-col shrink-0 relative">
          <div className="flex items-center justify-between border-b border-[#121F35] pb-1 mb-1.5 shrink-0">
            <div className="flex items-center gap-2 text-gray-400">
              <Terminal className="w-3.5 h-3.5 text-[#00D1FF] animate-pulse" />
              <span className="text-[8px] md:text-[9px] font-mono tracking-widest font-black text-[#00D1FF] uppercase jarvis-glow-blue">SYSTEM TELEMETRY CONSOLE FEED</span>
            </div>
            
            <button
              onClick={clearLogs}
              className="text-[7.5px] md:text-[8px] font-mono font-black tracking-widest text-[#00D1FF] bg-[#00D1FF]/10 border border-[#00D1FF]/20 px-2 py-0.5 sm:py-1 rounded-lg uppercase cursor-pointer transition-all hover:bg-[#00D1FF] hover:text-black duration-300"
            >
              PURGE CONSOLE BUFFER
            </button>
          </div>

          {/* Scrolling log text contents */}
          <div className="flex-grow overflow-y-auto font-mono text-[10px] space-y-1.5 pr-1 max-w-[1400px]">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic uppercase text-[7.5px] tracking-widest">No interactive handshake operations logged inside telemetry buffer.</p>
            ) : (
              logs.map((log) => {
                let color = "text-slate-400";
                if (log.type === "success") color = "text-[#00E676] font-bold jarvis-glow-green";
                if (log.type === "warning") color = "text-amber-500 font-bold";
                if (log.type === "error") color = "text-[#FF1744] font-bold";
                if (log.type === "ai") color = "text-[#00D1FF] font-bold jarvis-glow-blue";

                return (
                  <div key={log.id} className="flex gap-2 items-start justify-start select-text leading-normal">
                    <span className="text-slate-600 select-none text-[7.5px]">[{log.timestamp}]</span>
                    <span className="text-[#00D1FF] select-none bg-[#091523] border border-[#162C4E] px-1 py-[1px] text-[6.5px] font-black uppercase rounded tracking-widest">
                      {log.type}
                    </span>
                    <span className={`flex-1 break-words select-text ${color} tracking-wide text-[8px] md:text-[9px]`}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </footer>

      </div>
    </div>
  );
}
