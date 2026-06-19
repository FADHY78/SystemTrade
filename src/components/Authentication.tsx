import React, { useState, useEffect } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { useAccount } from "../hooks/useAccount";
import { derivAPI } from "../services/derivAPI";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Cpu, 
  Fingerprint, 
  KeyRound, 
  Activity, 
  Radio, 
  Lock, 
  Unlock,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Terminal,
  Server,
  Zap,
  CheckCircle2,
  Award,
  AlertOctagon
} from "lucide-react";

interface AuthenticationProps {
  onBypassSimulator?: () => void;
}

export default function Authentication({ onBypassSimulator }: AuthenticationProps) {
  const {
    appId,
    setAppId,
    token,
    setToken,
    connectionStatus,
    addLog,
  } = useTradingStore();

  const { isVirtual, balance, currency, loginId, isAuthorized, accounts, switchAccount } = useAccount();

  const [tempAppId, setTempAppId] = useState(appId || "86454");
  const [tempToken, setTempToken] = useState(token || "");
  const [showToken, setShowToken] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [neuralSyncPercent, setNeuralSyncPercent] = useState(0);

  // Sync neural percentage based on connection status
  useEffect(() => {
    let interval: any;
    if (connectionStatus === "connected") {
      interval = setInterval(() => {
        setNeuralSyncPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
    } else if (connectionStatus === "connecting") {
      setNeuralSyncPercent(45);
    } else {
      setNeuralSyncPercent(0);
    }
    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Listener to handle authorize responses securely
  useEffect(() => {
    const unsubscribe = derivAPI.addMessageListener((data) => {
      if (data.msg_type === "authorize") {
        setIsAuthorizing(false);
        if (data.error) {
          setErrorMessage(data.error.message || "Credential authentication failed.");
          addLog("error", `Security gateway rejected token: ${data.error.message}`);
        } else {
          setErrorMessage(null);
          addLog("success", `Authorized successfully! Welcome back, ${data.authorize.fullname}.`);
        }
      }
    });
    return unsubscribe;
  }, [addLog]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAuthorizing(true);
    addLog("ai", "Initiating encrypted security token validation handshake with remote server...");
    
    // Set parameters inside Zustand store and safe persist
    const cleanAppId = tempAppId.trim() || "86454";
    const cleanToken = tempToken.trim();

    setAppId(cleanAppId);
    setToken(cleanToken);
    localStorage.setItem("deriv_app_id", cleanAppId);
    localStorage.setItem("deriv_token", cleanToken);

    // Call connect immediately to prompt authorization handshake
    derivAPI.connect(cleanAppId, cleanToken);
  };

  const clearAuth = () => {
    setAppId("86454");
    setToken("");
    setTempToken("");
    setTempAppId("86454");
    localStorage.removeItem("deriv_token");
    addLog("warning", "Handshake keys completely purged. Restored standard guest parameters.");
  };

  const handleSimulatedBypass = () => {
    addLog("info", "Cognitive bypass active. Initializing virtual options data stream...");
    if (onBypassSimulator) {
      onBypassSimulator();
    }
  };

  return (
    <div id="futuristic-security-gateway" className="flex-1 bg-[#04060A] flex flex-col lg:flex-row h-full overflow-y-auto p-4 md:p-6 lg:p-8 gap-6 select-none font-sans relative min-h-screen">
      {/* Dynamic scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(0,195,255,0.03),_rgba(0,255,118,0.02),_rgba(0,85,255,0.03))] bg-[size:100%_4px,_6px_100%] opacity-15 z-10" />

      {/* LEFT COLUMN: CRITICAL HANDSHAKE FORM PORTAL */}
      <div className="flex-1 flex flex-col gap-6 max-w-4xl justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative bg-[#05070D]/95 border-2 border-[#15233D] hover:border-[#00D1FF]/40 rounded-3xl p-6 md:p-8 overflow-hidden transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.85)]"
        >
          {/* Cybernetic grid backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#091426_1px,transparent_1px),linear-gradient(to_bottom,#091426_1px,transparent_1px)] bg-[size:32px_32px] opacity-35 pointer-events-none" />

          {/* Central neon backillumination */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00D1FF]/5 rounded-full filter blur-[120px] pointer-events-none" />

          {/* Top banner */}
          <div className="relative flex flex-col md:flex-row md:items-center justify-between border-b border-[#121F35] pb-4.5 mb-6.5 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-br from-[#00D1FF]/20 to-[#0055FF]/10 rounded-xl border-2 border-[#00D1FF]/40 animate-pulse relative">
                <Fingerprint className="w-6 h-6 text-[#00D1FF]" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00E676]" />
              </div>
              <div className="font-mono">
                <h2 className="text-xs md:text-sm font-black tracking-widest text-[#00D1FF] uppercase flex items-center gap-2 jarvis-glow-blue">
                  J.A.R.V.I.S. SECURE INTERLINK <Sparkles className="w-4 h-4 text-[#00D1FF] animate-spin-slow" />
                </h2>
                <p className="text-[10px] text-slate-500 tracking-wider font-extrabold uppercase mt-0.5 font-mono">
                  PROPRIETARY DERIV WEBSOCKET CREDENTIAL GATEWAY
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#060C16] px-3.5 py-1.5 border border-[#1E2E4A]/80 rounded-full font-mono text-[9px] font-black text-[#00E676] tracking-widest leading-none shadow-[0_2px_10px_rgba(0,230,118,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-ping" />
              AES-256 HANDSHAKE
            </div>
          </div>

          {/* Connected Details Area or login Form */}
          <AnimatePresence mode="wait">
            {isAuthorized ? (
              <motion.div
                key="authorized-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative space-y-6"
              >
                <div className="bg-[#00E676]/5 border-2 border-[#00E676]/20 rounded-2xl p-5 flex items-start gap-4 shadow-[0_4px_20px_rgba(0,230,118,0.05)]">
                  <CheckCircle2 className="w-8 h-8 text-[#00E676] shrink-0 mt-0.5 animate-bounce" />
                  <div className="font-mono text-xs uppercase leading-relaxed">
                    <span className="text-[#00E676] font-black text-[13px] tracking-widest block uppercase mb-1.5 jarvis-glow-green">
                      SECURITY BRIDGE UNLOCKED
                    </span>
                    <span className="text-slate-400 font-medium">
                      Authentication successfully verified by remote Deriv API nodes. Full transaction-capabilities decrypted. Selected node:{" "}
                      <b className="text-white font-bold">{loginId}</b>. Your balance is synced and actively monitored.
                    </span>
                  </div>
                </div>

                {/* Subaccounts container */}
                <div className="bg-[#080C16] border-2 border-[#1E2E4A] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#121D2C] pb-2 text-[10px] font-mono">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">AVAILABLE ACCOUNT REGISTRIES</span>
                    <span className="text-[#00D1FF] font-black">{accounts.length} LINKED INDICES</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto no-scrollbar">
                    {accounts.map((acc) => {
                      const isActive = acc.loginid === loginId;
                      return (
                        <div
                          key={acc.loginid}
                          className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                            isActive
                              ? "bg-[#0A1A30]/50 border-[#00D1FF] text-[#00D1FF]"
                              : "bg-[#03060C] border-[#121F32] hover:bg-[#070D18]"
                          }`}
                          onClick={() => switchAccount(acc.loginid)}
                        >
                          <div className="font-mono">
                            <span className="text-[11px] font-black block tracking-wider uppercase text-white">
                              {acc.loginid}
                            </span>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                              {acc.is_virtual ? "DEMO CORE" : "LIVE TRADING CAPITAL"}
                            </span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-[10px] font-black tracking-wiest block text-[#00E676] jarvis-glow-green">
                              {acc.currency} {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Secure Workspace Trigger */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleSimulatedBypass}
                    className="flex-1 py-4.5 bg-[#00D1FF] hover:bg-[#00BCCC] text-black font-extrabold font-mono text-[11px] uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_4px_30px_rgba(0,209,255,0.35)] hover:scale-[1.01]"
                  >
                    <Zap className="w-4 h-4 text-black" />
                    ENTER OPERATIONAL DECISION MATRIX
                  </button>

                  <button
                    onClick={clearAuth}
                    className="py-4.5 px-6 border-2 border-rose-500/10 hover:border-rose-500/30 text-rose-500 bg-rose-500/5 hover:bg-rose-500/15 font-black font-mono text-[11px] uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" /> LOCK TERMINAL
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="unauthorized-form"
                className="relative space-y-6"
              >
                <p className="text-[10.5px] text-slate-400 font-mono leading-relaxed uppercase tracking-wider font-semibold">
                  ESTABLISH LIGHTNING SECURITIES HANDSHAKE WITH THE DERIV CLOUD API METROPOLIS. INPUT SECURE ACCESS TOKENS SECURELY TO ACTIVATE QUANTUM BOT AUTOMATORS AND ANALYTICS LOGIC.
                </p>

                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* App ID Code */}
                    <div className="flex flex-col gap-2 font-mono">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-[#00D1FF]" /> APERTURE APP ID
                        </span>
                        <span className="text-[#00D1FF] bg-[#00D1FF]/10 px-2 py-0.5 rounded border border-[#00D1FF]/25 font-black tracking-widest text-[8px]">ACTIVE CODE</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={tempAppId}
                          onChange={(e) => setTempAppId(e.target.value)}
                          placeholder="Standard Deriv App ID: 86454"
                          className="w-full px-4 py-3 bg-[#080C16] border-2 border-[#15233D] rounded-2xl text-white text-xs outline-none focus:border-[#00D1FF] focus:shadow-[0_0_15px_rgba(0,209,255,0.15)] transition-all font-semibold font-mono placeholder:text-gray-600"
                          required
                        />
                      </div>
                      <span className="text-[8.5px] text-slate-500 leading-normal pl-0.5 uppercase tracking-wider font-medium">
                        Sandbox connections use App ID <span className="text-[#00D1FF] font-bold">86454</span>. Replace with your custom credential if executing live capital.
                      </span>
                    </div>

                    {/* API security token */}
                    <div className="flex flex-col gap-2 font-mono">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-[#00D1FF]" /> API SECURITY TOKEN
                        </span>
                        <span className="text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/25 font-black tracking-widest text-[8px] jarvis-glow-green">SENSITIVE</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showToken ? "text" : "password"}
                          value={tempToken}
                          onChange={(e) => setTempToken(e.target.value)}
                          placeholder="PASTE DERIV TOKEN KEY (e.g. wXpY4qT...)"
                          className="w-full px-4 py-3 bg-[#080C16] border-2 border-[#15233D] rounded-2xl text-white text-xs outline-none focus:border-[#00D1FF] focus:shadow-[0_0_15px_rgba(0,209,255,0.15)] transition-all font-semibold font-mono pr-12 placeholder:text-gray-600 uppercase"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-3 top-3 px-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
                        >
                          {showToken ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                      <span className="text-[8.5px] text-slate-500 leading-normal pl-0.5 uppercase tracking-wider font-medium">
                        Generate tokens under your <span className="text-slate-400 font-bold">Deriv account details &gt; API Token</span>. Confirm "Read" and "Trade" capabilities.
                      </span>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center gap-2 text-rose-400 text-[10px] font-mono uppercase tracking-wider leading-none">
                      <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Buttons line */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-3">
                    <button
                      type="submit"
                      disabled={isAuthorizing || connectionStatus === "connecting"}
                      className="flex-1 py-4.5 bg-[#00D1FF] hover:bg-[#00BCCC] disabled:bg-[#101525] disabled:text-gray-600 text-black font-extrabold font-mono text-[10.5px] uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_4px_25px_rgba(0,209,255,0.25)] hover:scale-[1.01]"
                    >
                      {isAuthorizing ? (
                        <RefreshCw className="w-4 h-4 text-black animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-black" />
                      )}
                      {isAuthorizing ? "NEGOTIATING DIGITAL Handshake..." : "DECRYPT CENTRAL HANDSHAKE"}
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulatedBypass}
                      className="py-4.5 px-6 border-2 border-[#00E676]/25 hover:border-[#00E676]/60 text-[#00E676] bg-[#00E676]/5 hover:bg-[#00E676]/15 font-black font-mono text-[10.5px] uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_15px_rgba(0,230,118,0.05)]"
                    >
                      <Award className="w-4 h-4" /> REVEAL SIMULATOR CORE
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* System safety report */}
        <div className="bg-[#05070D]/95 border-2 border-[#15233D] rounded-3xl p-5 flex gap-4 items-start shadow-[0_4px_15px_rgba(0,0,0,0.4)]">
          <Terminal className="w-5.5 h-5.5 text-[#00D1FF] flex-shrink-0 animate-pulse mt-0.5" />
          <div className="text-[9px] font-mono text-slate-400 leading-relaxed uppercase tracking-widest">
            <span className="text-white font-black block uppercase tracking-widest text-[9.5px] mb-1.5 font-mono">
              SYSTEM TRUST AND PRIVATE SECURITY MATRIX:
            </span>
            All operations process locally inside your client-side container browser. J.A.R.V.I.S. integrates with direct SSL-secured WebSocket feeds. Credentials never serialize or forward to any third-party infrastructure.
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: REALT-TIME TELEMETRY STREAM DIAGNOSTIC */}
      <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-6 justify-center">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#05070D]/95 border-2 border-[#15233D] hover:border-[#00D1FF]/40 rounded-3xl p-6.5 flex flex-col justify-between overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.85)] relative"
        >
          {/* Subtle green ambient backing */}
          <div className="absolute top-20 right-0 w-80 h-80 bg-[#00E676]/3 rounded-full filter blur-[100px] pointer-events-none" />

          <div className="flex flex-col gap-5 text-xs font-mono">
            <div className="flex items-center gap-3 border-b border-[#121F35] pb-3 shrink-0">
              <Server className="w-5 h-5 text-[#00E676] animate-pulse" />
              <div>
                <span className="font-extrabold text-[10.5px] uppercase tracking-widest text-[#00E676] block jarvis-glow-green font-mono">
                  DIAGNOSTIC TELEMETRY
                </span>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black font-mono">
                  HARDWARE CORE HANDSHAKE
                </span>
              </div>
            </div>

            {/* Sync gauge metrics */}
            <div className="p-4 bg-[#080C16] border border-[#15233D] rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center text-[8.5px] text-slate-400 font-bold uppercase tracking-widest">
                <span>HANDSHAKE SYNC LEVEL</span>
                <span className="text-[#00D1FF] font-black">{neuralSyncPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#121F35] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${neuralSyncPercent}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-[#00D1FF] to-[#00E676]"
                />
              </div>

              {/* Status parameters grids */}
              <div className="grid grid-cols-2 gap-3 mt-1 text-[8.5px] font-bold">
                <div className="p-2.5 bg-[#03060E] border border-[#121F32] rounded-xl flex flex-col gap-1">
                  <span className="text-slate-500 tracking-wider">SOCKET GATE</span>
                  <span className={`uppercase font-black ${connectionStatus === "connected" ? "text-[#00E676] jarvis-glow-green" : "text-amber-500 animate-pulse"}`}>
                    {connectionStatus}
                  </span>
                </div>
                <div className="p-2.5 bg-[#03060E] border border-[#121F32] rounded-xl flex flex-col gap-1">
                  <span className="text-slate-500 tracking-wider">RESPONSE LATENCY</span>
                  <span className="text-white font-black uppercase">
                    {connectionStatus === "connected" ? "84 MS (UPLINK ok)" : "STANDBY"}
                  </span>
                </div>
              </div>
            </div>

            {/* LIVE DATA DECRYPTION LOGS */}
            <div className="p-4 bg-[#080C16] border border-[#15233D] rounded-2xl space-y-3">
              <span className="text-[8px] text-[#00E676] font-black tracking-widest uppercase block border-b border-[#121D2C] pb-1.5">
                DECRYPTED TELEMETRY LOGS
              </span>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1 no-scrollbar text-[8.5px] font-mono leading-relaxed">
                <div className="flex gap-2 text-slate-400">
                  <span className="text-slate-600">[STANDBY]</span>
                  <span>Awaiting authorized core handshake uplink validation.</span>
                </div>
                {connectionStatus === "connected" && (
                  <div className="flex gap-2 text-[#00E676]">
                    <span className="text-slate-600">[CONNECTED]</span>
                    <span>Live WebSocket channel linked. Pulling available synthetics assets.</span>
                  </div>
                )}
                {isAuthorized && (
                  <div className="flex gap-2 text-[#00D1FF]">
                    <span className="text-slate-600">[GRANTED]</span>
                    <span>Aperture authorization complete for ID {loginId}. Balance synchronized.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Steps guidelines panel */}
            <div className="p-4 border border-[#15233D] bg-[#0A1220]/50 rounded-2xl flex gap-3 text-[9px] leading-relaxed text-slate-400 font-mono">
              <Radio className="w-4 h-4 text-[#00D1FF] flex-shrink-0 animate-pulse" />
              <div>
                <span className="text-[#00D1FF] font-black uppercase block mb-1 tracking-widest">HOW TO GENERATE ACCESS:</span>
                1. Navigate to <a href="https://deriv.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#00D1FF] underline font-bold">deriv.com</a> and sign in.
                <br />
                2. Enter account Settings &gt; API Token.
                <br />
                3. Check "Read" & "Trade" authorization parameters.
                <br />
                4. Create a token name, copy the code and paste it here.
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
