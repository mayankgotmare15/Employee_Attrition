import React, { useState } from "react";
import { useAuth, SEEDED_ACCOUNTS } from "../context/AuthContext";
import {
  Activity,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";

export default function Navbar({ onOpenMetrics }) {
  const { user, logout, quickSwitchUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25">
            <Activity className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                RetainIQ <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">MLOps</span>
              </span>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                SDLC v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Employee Attrition & Retention Intelligence</p>
          </div>
        </div>

        {/* Center / Model Telemetry Indicator */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3.5 py-1 text-xs text-slate-300">
          <Cpu className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>Active Champion:</span>
          <span className="font-semibold text-emerald-400">LogisticRegression</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-slate-400">ROC-AUC: 80.8%</span>
          <button
            onClick={onOpenMetrics}
            className="ml-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            Telemetry
          </button>
        </div>

        {/* Right Section: Role Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher for Mentor/Evaluator Demo */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:border-slate-700 hover:bg-slate-800"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Role: <strong className="text-indigo-300">{user?.role}</strong></span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl z-50">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Switch Role Persona (PRD RBAC)
                </div>
                {SEEDED_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => {
                      quickSwitchUser(acc.email);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      user?.email === acc.email
                        ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                        : "text-slate-300 hover:bg-slate-800/80"
                    }`}
                  >
                    <span>{acc.label}</span>
                    <span className="text-[10px] text-slate-500">{acc.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
              <p className="text-[10px] text-slate-400">{user?.department ? `${user.department} Dept` : "All Org"}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
