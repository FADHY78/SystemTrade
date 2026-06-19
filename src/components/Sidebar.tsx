import { 
  TrendingUp, 
  Grid3X3, 
  Cpu, 
  Bot, 
  Radio, 
  BarChart4, 
  History, 
  Settings,
  BrainCircuit,
  Fingerprint,
  Sparkles,
  Zap,
  X,
  LayoutDashboard
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const items = [
    { id: "dashboard", label: "COGNITIVE DASHBOARD", icon: LayoutDashboard },
    { id: "chart", label: "A.I. HOLOGRAPH PATH", icon: TrendingUp },
    { id: "digits", label: "DIGIT MATRIX ANALYZER", icon: Grid3X3 },
    { id: "strategies", label: "NEURAL LOGIC BUILDER", icon: BrainCircuit },
    { id: "bots", label: "AUTONOMOUS BOTS", icon: Bot },
    { id: "signals", label: "DEEP SPACE SIGNALS", icon: Radio },
    { id: "markets", label: "QUANT INDEX FEED", icon: BarChart4 },
    { id: "performance", label: "ARCHIVE TELEMETRY", icon: History },
    { id: "auth", label: "SECURITY DECRYPTOR", icon: Fingerprint },
    { id: "settings", label: "JARVIS PARAMS", icon: Settings },
  ];

  return (
    <aside 
      id="terminal-sidebar" 
      className={`
        fixed inset-y-0 left-0 w-64 md:relative md:w-56 h-full bg-[#06080D]/95 border-r border-[#15233D] flex flex-col justify-between select-none z-50 backdrop-blur-md transition-transform duration-300 ease-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Background Matrix-like Hex/Digital Ambient layout hint */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#00D1FF,transparent_150px)] opacity-5 pointer-events-none" />

      <div className="flex flex-col py-5">
        {/* Holographic Spinning JARVIS Logo */}
        <div className="flex items-center justify-between gap-3 px-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              {/* Outermost rotating targeting ring */}
              <div className="absolute inset-0 border border-dashed border-[#00D1FF]/50 rounded-full animate-spin-slow" />
              
              {/* Inner inverse rotating targeting ring */}
              <div className="absolute w-6 h-6 border-2 border-dotted border-[#00E676]/40 rounded-full animate-spin-slow-reverse" />
              
              {/* Central energy core */}
              <div className="w-3.5 h-3.5 bg-gradient-to-r from-[#00D1FF] to-[#0055FF] rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,209,255,1)]">
                <span className="text-[7px] text-black font-black font-mono">JV</span>
              </div>
            </div>
            
            <div className="flex flex-col">
              <h1 className="font-display font-black tracking-[0.14em] text-[#E8EAF0] text-[12px] uppercase flex items-center gap-1 leading-none">
                J.A.R.V.I.S. <span className="text-[#00D1FF] font-light text-[8px] font-mono tracking-widest animate-pulse">v4.0</span>
              </h1>
              <p className="text-[7px] text-slate-500 font-mono tracking-widest uppercase mt-1 leading-none">
                BROKER MATRIX
              </p>
            </div>
          </div>

          {/* Close button for mobile menu */}
          {setMobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg bg-[#0E1524] hover:bg-[#152035] text-slate-400 hover:text-[#00D1FF] border border-[#1C2E49] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dynamic Holographic Options List */}
        <nav className="flex flex-col gap-1 px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-start gap-3.5 px-3 py-3 rounded-xl text-[10px] font-mono font-bold tracking-widest transition-all duration-300 relative ${
                  isSelected 
                    ? "bg-[#0A1A30]/50 text-[#00D1FF] border-r-2 border-[#00D1FF] shadow-[0_0_15px_rgba(0,209,255,0.15)] jarvis-border-cyan" 
                    : "text-[#5B6D8A] hover:text-[#00D1FF] hover:bg-[#0A1A30]/20"
                }`}
              >
                {/* Visual scanner glowing horizontal bar when item selected */}
                {isSelected && (
                  <div className="absolute inset-x-0 top-0 h-[1.5px] bg-[#00D1FF]/40 animate-pulse" />
                )}

                <Icon className={`w-4 h-4 transition-transform duration-300 ${isSelected ? "text-[#00D1FF] scale-105" : "text-[#5B6D8A]"}`} />
                <span className="inline text-left text-ellipsis overflow-hidden whitespace-nowrap uppercase">
                  {item.label}
                </span>

                {isSelected && (
                  <Sparkles className="w-3 h-3 text-[#00D1FF] absolute right-3 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Futuristic Cybernetic HUD Info System */}
      <div className="p-4 border-t border-[#15233D] hidden md:block relative bg-[#04060A]/80">
        <div className="flex items-center justify-between text-[8px] font-mono mb-2">
          <span className="text-[#5B6D8A]">SYS PROCESSOR</span>
          <span className="text-[#00E676] flex items-center gap-0.5 font-bold">
            <Zap className="w-2.5 h-2.5 animate-bounce" /> ONLINE
          </span>
        </div>
        
        {/* Progress grid representation */}
        <div className="flex gap-0.5 h-1 mb-3">
          <div className="flex-1 bg-[#00D1FF] h-full" />
          <div className="flex-1 bg-[#00D1FF] h-full" />
          <div className="flex-1 bg-[#00D1FF]/70 h-full" />
          <div className="flex-1 bg-[#00E676]/90 h-full animate-pulse" />
          <div className="flex-1 bg-[#15233D] h-full" />
          <div className="flex-1 bg-[#15233D] h-full" />
        </div>

        <p className="text-[8px] font-mono text-slate-500 tracking-wider uppercase leading-none">
          SYSTEM MATRIX ACTIVE
        </p>
      </div>
    </aside>
  );
}

