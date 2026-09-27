import React, { useState } from "react";
import { Activity, Lock, Mail, Shield, User, ArrowRight } from "lucide-react";
import { useAuth, SEEDED_ACCOUNTS } from "../context/AuthContext";

export default function LoginModal() {
  const { login, quickSwitchUser } = useAuth();
  const [email, setEmail] = useState("hranalyst@company.com");
  const [password, setPassword] = useState("Password@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (accountEmail) => {
    setLoading(true);
    setError(null);
    try {
      await quickSwitchUser(accountEmail);
    } catch (err) {
      setError(err.message || "Quick login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl p-8 overflow-hidden">
        
        {/* Glow Orb */}
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/25 mb-4">
            <Activity className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white">RetainIQ Intelligence</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Employee Attrition & Retention Analytics Platform
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-shimmer w-full rounded-xl py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In with Credentials"}
          </button>
        </form>

        {/* 1-Click Role Switcher for Evaluator Convenience */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center mb-3">
            Quick 1-Click Demo Personas (PRD Roles)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SEEDED_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickLogin(acc.email)}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-left transition-all hover:border-indigo-500/40 hover:bg-slate-800/80"
              >
                <div>
                  <p className="text-[11px] font-bold text-slate-200">{acc.label}</p>
                  <p className="text-[9px] text-slate-500">{acc.role}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-500" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
