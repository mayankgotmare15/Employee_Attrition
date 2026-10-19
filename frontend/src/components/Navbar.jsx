import React, { useState } from "react";
import { useAuth, SEEDED_ACCOUNTS } from "../context/AuthContext";
import {
  Menu,
  Activity,
  Cpu,
  ChevronDown,
  ShieldCheck,
  LogOut,
  Bot,
  Layers,
  Sparkles,
} from "lucide-react";

export default function Navbar({
  onOpenMetrics,
  onOpenChatbot,
  onToggleSidebar,
  activeChampion = "LogisticRegression",
  rocAuc = 0.898,
}) {
  const { user, logout, quickSwitchUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const rocAucPct = (rocAuc * 100).toFixed(1);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      
      {/* Left: Mobile Menu Toggle & Brand Pills (Matches Screenshot!) */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleSidebar}
          className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* MLOps Pill Badge */}
        <div className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-white">
            <Activity className="h-2.5 w-2.5" />
          </div>
          <span>MLOps</span>
        </div>

        {/* SDLC v1.0 Pill Badge */}
        <div className="hidden sm:inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          SDLC v1.0
        </div>
      </div>

      {/* Right: Champion Pill, ROC-AUC Pill, Telemetry Button & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Champion Pill (Matches Screenshot!) */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Active Champion: <strong className="font-bold text-emerald-900">{activeChampion}</strong></span>
        </div>

        {/* ROC-AUC Metric Pill (Matches Screenshot!) */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-800">
          <span className="h-2 w-2 rounded-full bg-purple-500"></span>
          <span>ROC-AUC: <strong className="font-bold text-purple-900">{rocAucPct}%</strong></span>
        </div>

        {/* Telemetry Modal Button (Matches Screenshot!) */}
        <button
          onClick={onOpenMetrics}
          className="flex items-center gap-1.5 rounded-full border border-purple-300 bg-white hover:bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 transition-colors shadow-sm"
        >
          <Cpu className="h-3.5 w-3.5 text-purple-600" />
          <span>Telemetry</span>
        </button>

        {/* Mobile AI Advisor Quick Button */}
        <button
          onClick={onOpenChatbot}
          className="flex lg:hidden items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700"
          title="Open AI Retention Advisor"
        >
          <Bot className="h-3.5 w-3.5 text-indigo-600" />
          <span className="hidden xs:inline">Advisor</span>
        </button>

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Role: </span>
            <strong className="text-indigo-700">{user?.role || "ADMIN"}</strong>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Role Persona
              </div>
              {SEEDED_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => {
                    quickSwitchUser(acc.email);
                    setDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors ${
                    user?.email === acc.email
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{acc.label}</span>
                  <span className="text-[10px] text-slate-400">{acc.role}</span>
                </button>
              ))}
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
