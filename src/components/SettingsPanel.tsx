import React, { useState } from "react";
import { useTradingStore } from "../stores/tradingStore";
import { Settings, ShieldCheck, Landmark, Key, HelpCircle, HardDrive, RefreshCw } from "lucide-react";

export default function SettingsPanel() {
  const {
    appId,
    setAppId,
    token,
    setToken,
    activeAccount,
    connectionStatus,
    addLog,
  } = useTradingStore();

  const [tempAppId, setTempAppId] = useState(appId);
  const [tempToken, setTempToken] = useState(token);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setAppId(tempAppId);
    setToken(tempToken);
    addLog("success", "Trading settings successfully saved to LocalStorage persistent memory buffers.");
    
    // Refresh connection by reloading the applet
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleClearPersistence = () => {
    localStorage.clear();
    addLog("warning", "Local cache buffers cleared. Restoring default app parameters.");
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div id="settings-workbench-panel" className="flex-1 bg-[#04060A] flex flex-col xl:flex-row h-full overflow-y-auto select-none p-4 gap-4">
      {/* 1. Left parameter configure form Column */}
      <div className="flex-1 bg-[#05070D]/95 border-2 border-[#15233D] p-5 rounded-3xl flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-[#15233D] pb-2.5 font-mono">
            <Settings className="w-4 h-4 text-[#00D1FF] animate-pulse" />
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-[#00D1FF] jarvis-glow-blue">J.A.R.V.I.S. INTERFACE CREDENTIALS</h4>
          </div>

          <p className="text-xs text-slate-400 font-mono leading-normal">
            Configure your custom App ID and Client Auth Token to link your virtual/real broker accounts.
          </p>

          <div className="flex flex-col gap-4 text-xs font-mono">
            {/* App ID parameter input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-bold uppercase">DERIV APPLICATION ID (APP_ID)</label>
              <input
                type="text"
                placeholder="Defaults to 86454 demo..."
                value={tempAppId}
                onChange={(e) => setTempAppId(e.target.value)}
                className="px-3 py-2.5 bg-[#080C16] border border-[#15233D] text-white rounded-xl focus:border-[#00D1FF] outline-none"
              />
              <span className="text-[9px] text-[#6B7280]">
                If you have a custom Deriv application registration, enter its ID. Custom apps enable tick and transaction flow limits.
              </span>
            </div>

            {/* Token parameter input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-500 font-bold uppercase">AUTHORIZATION SECRET TOKEN</label>
              <input
                type="password"
                placeholder="Enter live/demo client API token..."
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                className="px-3 py-2.5 bg-[#080C16] border border-[#15233D] text-white rounded-xl focus:border-[#00D1FF] outline-none"
              />
              <span className="text-[9px] text-[#6B7280]">
                API tokens are acquired inside your Deriv layout Profile settings (Security and limits tab). Ensure token permissions allow "Trade", "Read" and "Payments".
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#00D1FF] hover:bg-[#00B4DB] text-black font-black font-mono text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(0,209,255,0.25)]"
          >
            <ShieldCheck className="w-4 h-4 text-black" /> SAVE PARAMETERS & REBOOT
          </button>
        </form>
      </div>

      {/* 2. Right Diagnostic summary info rail */}
      <div className="w-full xl:w-96 bg-[#05070D]/95 border-2 border-[#15233D] p-5 rounded-3xl shrink-0 flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 border-b border-[#15233D] pb-2.5">
            <Landmark className="w-5 h-5 text-[#00E676]" />
            <span className="font-bold text-xs uppercase tracking-wider text-white font-sans">Broker Status & Diagnostics</span>
          </div>

          <div className="p-3 bg-black/40 border border-[#1C1E26] rounded-xl text-[11px] leading-relaxed">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[#6B7280] text-[10px]">NETWORK STATE</span>
              <span className={`font-bold uppercase ${connectionStatus === "connected" ? "text-[#00E676]" : "text-rose-500"}`}>
                {connectionStatus}
              </span>
            </div>

            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[#6B7280] text-[10px]">AUTH TOKEN LOADED</span>
              <span className="text-white font-mono">{token ? "YES (MASKED)" : "NO (Awaiting)"}</span>
            </div>

            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[#6B7280] text-[10px]">REGISTERED USER</span>
              <span className="text-white font-bold">{activeAccount ? activeAccount.loginid : "VIRTUAL_USER"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#6B7280] text-[10px]">BALANCE HOLD</span>
              <span className="text-[#00E676] font-bold">
                {activeAccount ? `${activeAccount.currency} ${activeAccount.balance.toFixed(2)}` : "USD 10,000.00 (Demo)"}
              </span>
            </div>
          </div>

          {/* Quick Clear persistence buttons */}
          <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase">
              <HardDrive className="w-4 h-4 text-rose-500" /> Diagnostics storage reset
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">
              If client WebSocket subscriptions freeze or UI locks, clearing Local Cache buffers restores initial template states.
            </p>
            <button
              onClick={handleClearPersistence}
              className="w-full py-2 border border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/15 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
            >
              CLEAR PERSISTED CACHE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
