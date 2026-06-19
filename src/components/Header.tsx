import React, { useState, useMemo } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { useAccount } from "../hooks/useAccount";
import { CandidateSymbols } from "../utils/mockData";
import { Signal, RefreshCw, LogIn, Award, Menu, Bell, BellOff } from "lucide-react";
import { NotificationManager } from "../utils/notifier";

interface HeaderProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function Header({ mobileMenuOpen, setMobileMenuOpen }: HeaderProps = {}) {
  const {
    selectedSymbol,
    setSelectedSymbol,
    setToken,
    token,
    symbols,
  } = useTradingStore();

  const {
    activeAccount,
    accounts,
    connectionStatus,
    switchAccount,
    isVirtual,
    balance,
    currency,
    loginId
  } = useAccount();

  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tempToken, setTempToken] = useState("");

  const hasNotification = typeof window !== "undefined" && "Notification" in window;
  const [notifPermission, setNotifPermission] = useState(
    hasNotification ? Notification.permission : "default"
  );

  const actualSymbols = useMemo(() => {
    return symbols.length > 0 ? symbols : CandidateSymbols;
  }, [symbols]);

  // Unique listed market types
  const categories = [
    { id: "all", label: "All Assets" },
    { id: "synthetic_index", label: "Synthetics" },
    { id: "forex", label: "Forex Pairs" },
    { id: "cryptocurrency", label: "Crypto" },
    { id: "commodities", label: "Commodities" },
    { id: "indices", label: "Stock Indices" },
  ];

  const filteredSymbols = useMemo(() => {
    return actualSymbols.filter((s) => {
      const matchSearch = s.display_name.toLowerCase().includes(search.toLowerCase()) || 
                          s.symbol.toLowerCase().includes(search.toLowerCase());
      const matchCat = filter === "all" || s.market === filter;
      return matchSearch && matchCat;
    });
  }, [actualSymbols, search, filter]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempToken.trim()) {
      setToken(tempToken.trim());
      // Re-trigger connecting by resetting
      window.location.reload();
    }
  };

  return (
    <header id="terminal-header" className="min-h-16 h-auto py-2 sm:py-0 sm:h-16 border-b border-[#15233D] bg-[#06080D]/90 px-2 sm:px-4 flex items-center justify-between select-none relative z-30 backdrop-blur-md w-full gap-2 flex-nowrap overflow-x-auto no-scrollbar">
      {/* Visual cybernetic accent decoration lines on top of header */}
      <div className="absolute top-0 right-4 left-4 h-[1px] bg-gradient-to-r from-transparent via-[#00D1FF]/40 to-transparent" />

      {/* Container holding hamburger and selection picker */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {setMobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-xl border border-[#1E2E4A] hover:border-[#00D1FF]/50 bg-[#080B13] text-[#00D1FF] cursor-pointer transition-all active:scale-95 duration-200 shrink-0 shadow-lg"
            title="Toggle Menu Navigation"
          >
            <Menu className="w-4 h-4 text-[#00D1FF]" />
          </button>
        )}

        {/* Symbol Picker dropdown click target */}
        <div className="relative">
          <div className="flex flex-col">
            <span className="text-[7px] font-mono tracking-widest text-[#00D1FF]/60 uppercase flex items-center gap-1 mb-0.5 px-0.5">
              <span className="w-1 h-1 rounded-full bg-[#00D1FF] animate-pulse" />
              <span>ACTIVE SCANNER</span>
            </span>
            <select
              value={selectedSymbol?.symbol || "R_100"}
              onChange={(e) => {
                const found = actualSymbols.find((s) => s.symbol === e.target.value);
                if (found) {
                  setSelectedSymbol(found);
                }
              }}
              className="px-2 py-1.5 bg-[#080B13] hover:bg-[#101625] border-2 border-[#1E2E4A]/80 hover:border-[#00D1FF]/60 rounded-xl transition-all duration-300 cursor-pointer text-[#00D1FF] font-bold font-mono text-[9px] sm:text-xs outline-none focus:border-[#00D1FF] shadow-[0_2px_15px_rgba(0,209,255,0.05)] shrink-0"
            >
              {actualSymbols.map((s) => (
                <option key={s.symbol} value={s.symbol} className="bg-[#080C16] text-[#00D1FF] font-mono py-1">
                  {s.display_name || s.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Right Column: Server status indicators, account specs, balance logs */}
      <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
        {/* Connection status pills */}
        <div className="flex items-center gap-1.5 md:gap-2.5 bg-[#080B13] border border-[#1E2E4A]/60 px-1.5 py-1 md:px-3 md:py-1.5 rounded-xl font-mono shrink-0">
          <div className="h-1.5 w-1.5 rounded-full relative">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              connectionStatus === "connected" ? "animate-ping bg-[#00E676]" : "bg-red-500"
            }`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              connectionStatus === "connected" ? "bg-[#00E676]" : "bg-red-500"
            }`}></span>
          </div>

          <span className="text-[8px] font-mono tracking-widest font-black text-slate-400 uppercase hidden md:inline">
            CORE SYNC:{" "}
            <span className={connectionStatus === "connected" ? "text-[#00E676] jarvis-glow-green" : "text-red-500"}>
              {connectionStatus}
            </span>
          </span>
        </div>

        {/* Real-time browser notifications permission control */}
        {hasNotification && (
          <button
            onClick={async () => {
              const res = await NotificationManager.requestPermission();
              setNotifPermission(Notification.permission);
              if (res) {
                NotificationManager.send(
                  "ALERTS UPLINK ACTIVE 🔔",
                  "Browser alerts fully synchronized with your algorithmic trading core.",
                  "success"
                );
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 bg-[#080B13] border rounded-xl transition-all font-mono text-[8px] cursor-pointer shrink-0 ${
              notifPermission === "granted"
                ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60"
                : notifPermission === "denied"
                ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                : "border-[#1E2E4A] text-amber-400 hover:border-[#00D1FF]/50"
            }`}
            title="Browser push notifications permission status"
          >
            {notifPermission === "granted" ? (
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
            ) : notifPermission === "denied" ? (
              <BellOff className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            )}
            <span className="hidden md:inline uppercase tracking-widest font-black leading-none">
              ALERTS: {notifPermission}
            </span>
          </button>
        )}

        {/* PROMINENT DIRECT HEADER BALANCE & DETAILS SYSTEM */}
        {activeAccount && (
          <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 bg-[#080B14] border-2 border-[#1E2E4A] rounded-xl font-mono shadow-[0_2px_15px_rgba(0,0,0,0.4)]">
            <span className="text-slate-500 font-extrabold uppercase tracking-widest leading-none text-[8px]">BALANCE:</span>
            <span className="text-xs font-black text-[#00E676] tracking-widest leading-none jarvis-glow-green whitespace-nowrap">
              {activeAccount.currency} {activeAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`px-1.5 py-0.5 rounded leading-none text-[7.5px] font-black tracking-widest uppercase ${
              activeAccount.is_virtual 
                ? "bg-amber-400/10 text-amber-500 border border-amber-400/20" 
                : "bg-emerald-400/10 text-[#00E676] border border-[#00E676]/20"
            }`}>
              {activeAccount.is_virtual ? "DEMO" : "LIVE"}
            </span>
            <span className="text-[8px] text-slate-500 font-bold leading-none select-text">({activeAccount.loginid})</span>
          </div>
        )}

        {/* Account indicator details */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* SECURE DIRECT AUTH UPLINK BUTTON */}
          <div className="relative">
            <button
              id="btn-key-uplink"
              onClick={() => {
                setIsOpen(false);
                setIsAccountOpen(false);
                // Open a mini token setup dropdown
                const overlayEl = document.getElementById("deriv-token-dialog");
                if (overlayEl) overlayEl.classList.toggle("hidden");
              }}
              className={`flex items-center justify-center p-1.5 md:p-2 rounded-xl border transition-all cursor-pointer ${
                token 
                  ? "bg-[#00E676]/10 border-[#00E676]/30 text-[#00E676] hover:bg-[#00E676]/25 hover:border-[#00E676]/50 shadow-[0_0_10px_rgba(0,230,118,0.1)]" 
                  : "bg-[#080B13] border-[#1E2E4A] text-[#00D1FF] hover:border-[#00D1FF]/50 hover:bg-[#101625]"
              }`}
              title={token ? "UPLINK DECRYPTED & CONNECTED" : "UPLINK CLIENT SECURITY KEY"}
            >
              <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-[8px] font-mono tracking-widest font-black uppercase ml-1.5 hidden lg:inline">
                {token ? "SECURE UPLINK KEY" : "DECRYPT COGNITIVE LOCK"}
              </span>
            </button>

            {/* Inline Token form dropdown overlay */}
            <div 
              id="deriv-token-dialog" 
              className="absolute top-12 right-0 w-80 bg-[#080C16] border-2 border-[#1E2E4A] rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.95)] z-50 p-4 shrink-0 hidden flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 duration-200"
            >
              <div className="flex items-center gap-2 border-b border-[#15233D] pb-2 font-mono">
                <LogIn className="w-4 h-4 text-[#00D1FF] animate-pulse" />
                <span className="text-[9px] font-black tracking-widest text-[#00D1FF] uppercase jarvis-glow-blue">API SECURITY DECRYPTOR</span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono leading-relaxed uppercase">
                Insert raw client authentication handshake key to establish full-duplex broker data feed.
              </p>
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3.5">
                <input
                  type="password"
                  placeholder="PASTE DERIV TOKEN KEY..."
                  value={tempToken}
                  onChange={(e) => setTempToken(e.target.value)}
                  className="px-3 py-2.5 text-xs bg-[#03060E] border-2 border-[#1E3048] focus:border-[#00D1FF] rounded-xl text-white font-mono outline-none uppercase placeholder:text-slate-600 font-bold"
                />
                <div className="flex items-center gap-2 justify-end">
                  {token && (
                    <button
                      type="button"
                      onClick={() => {
                        setToken("");
                        window.location.reload();
                      }}
                      className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 rounded-md text-[9px] font-black tracking-widest uppercase cursor-pointer transition-all"
                    >
                      PURGE KEY
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4.5 py-2 bg-[#00D1FF] hover:bg-[#00B4DB] text-black text-[9px] font-black font-mono uppercase tracking-widest rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    ESTABLISH LINK
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                const overlayEl = document.getElementById("deriv-token-dialog");
                if (overlayEl) overlayEl.classList.add("hidden");
                setIsAccountOpen(!isAccountOpen);
              }}
              className="flex items-center gap-1.5 md:gap-3 px-2 py-1 md:px-3.5 md:py-1.5 bg-[#080B13] hover:bg-[#101625] border-2 border-[#1E2E4A]/80 hover:border-[#00D1FF]/40 rounded-xl cursor-pointer transition-all duration-300 text-[#E8EAF0] shadow-[0_4px_20px_rgba(0,0,0,0.5)] font-mono"
            >
              <Award className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeAccount ? "text-[#00E676] animate-pulse" : "text-amber-500"}`} />
              <div className="flex flex-col items-end select-none leading-none">
                <span className="text-[7px] font-mono text-slate-500 tracking-widest font-black uppercase leading-none mb-1 hidden sm:block">
                  {activeAccount ? (activeAccount.is_virtual ? "DEMO CORE" : "LIVE CAPITAL") : "COGNITIVE SIMULATOR"} ({activeAccount ? activeAccount.loginid : "VRTC-SIMULATOR"})
                </span>
                <span className="text-[10px] md:text-xs font-black font-mono text-[#00E676] leading-none tracking-widest jarvis-glow-green">
                  {activeAccount ? activeAccount.currency : "USD"} {(activeAccount ? activeAccount.balance : 10000.00).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[7px] md:text-[7.5px] text-[#00D1FF] ml-0.5 md:ml-1">▼</span>
            </button>

            {isAccountOpen && (
              <div className="absolute top-14 right-0 w-72 bg-[#080C16] border-2 border-[#1E2E4A] rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.95)] z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-3 duration-300 font-mono">
                <div className="px-3.5 py-2 border-b border-[#1E2E4A] bg-[#05070C] text-[8px] font-mono font-black tracking-widest text-[#00D1FF]/70 uppercase">
                  {activeAccount ? `SECURED ACCOUNT NODE REGISTRY (${accounts.length})` : "COGNITIVE LEDGER STATE"}
                </div>
                <div className="p-1.5 space-y-1 bg-[#080C16]">
                  {activeAccount ? (
                    accounts.map((acc) => (
                      <button
                        key={acc.loginid}
                        onClick={() => {
                          switchAccount(acc.loginid);
                          setIsAccountOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all duration-200 flex items-center justify-between cursor-pointer border-2 ${
                          activeAccount.loginid === acc.loginid
                            ? "bg-[#0A1A30]/50 border-[#00D1FF] text-[#00D1FF] font-bold"
                            : "bg-transparent border-transparent hover:bg-[#101625] text-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${acc.is_virtual ? "bg-amber-400" : "bg-[#00E676] animate-pulse"}`}></span>
                            <span className="font-mono font-bold">{acc.loginid}</span>
                          </div>
                          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mt-0.5">
                            {acc.is_virtual ? "DEMO LEDGER" : "REAL ACTIVE NODE"}
                          </span>
                        </div>
                        <div className="text-right font-mono text-[10px] font-bold text-white tracking-widest">
                          {acc.currency} {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center">
                      <div className="flex flex-col items-center gap-2 py-4">
                        <Award className="w-8 h-8 text-amber-500 animate-pulse" />
                        <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider block">RUNNING SAMPLE LOCAL LEDGER</span>
                        <p className="text-[8px] text-slate-500 leading-normal max-w-[210px] uppercase">
                          No active account handshake key detected. Using default 10,000 USD virtual sandbox balance buffer.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsAccountOpen(false);
                          const overlayEl = document.getElementById("deriv-token-dialog");
                          if (overlayEl) overlayEl.classList.remove("hidden");
                        }}
                        className="w-full py-2 bg-[#00D1FF] hover:bg-[#00B4DB] text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        CONNECT LIVE DECRYPTOR
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
