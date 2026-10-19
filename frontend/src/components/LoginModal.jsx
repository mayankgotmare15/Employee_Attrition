import React, { useState, useEffect } from "react";
import { Activity, Lock, Mail, Shield, User, ArrowRight, RefreshCw, CheckCircle2, Globe } from "lucide-react";
import { useAuth, SEEDED_ACCOUNTS } from "../context/AuthContext";
import { api } from "../services/api";

export default function LoginModal() {
  const { login, quickSwitchUser } = useAuth();
  const [email, setEmail] = useState("hranalyst@company.com");
  const [password, setPassword] = useState("Password@123");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [showConfig, setShowConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(api.system.getBaseUrl().replace(/\/api\/v1$/, ""));

  useEffect(() => {
    // Check initial health
    api.system.checkHealth().then((res) => {
      setBackendStatus(res.ok ? "online" : "waking_up");
    });

    const handleStatus = (e) => {
      setBackendStatus(e.detail.status);
      if (e.detail.status === "waking_up") {
        setLoadingMsg(`Waking up Render backend (Attempt ${e.detail.attempt || 1}/3)...`);
      }
    };
    window.addEventListener("retainiq:backend-status", handleStatus);
    return () => window.removeEventListener("retainiq:backend-status", handleStatus);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMsg("Authenticating with cloud backend...");
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const handleQuickLogin = async (accountEmail) => {
    setLoading(true);
    setLoadingMsg("Signing in via quick role switch...");
    setError(null);
    try {
      await quickSwitchUser(accountEmail);
    } catch (err) {
      setError(err.message || "Quick login failed.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const handleSaveUrl = (e) => {
    e.preventDefault();
    if (customUrl.trim()) {
      api.system.setCustomBaseUrl(customUrl.trim());
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

          {/* Backend Cloud Status Pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border bg-slate-950/60 backdrop-blur-sm">
            {backendStatus === "online" ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300">Cloud Backend Active</span>
              </>
            ) : backendStatus === "waking_up" ? (
              <>
                <RefreshCw className="h-3 w-3 text-amber-400 animate-spin" />
                <span className="text-amber-300">Waking up server (~30s)...</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <span className="text-indigo-300">Connecting to API Gateway...</span>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        {loadingMsg && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-2.5 text-[11px] text-indigo-300">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            <span>{loadingMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
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
            className="btn-shimmer w-full rounded-xl py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              "Sign In with Credentials"
            )}
          </button>
        </form>

        {/* 1-Click Role Switcher for Evaluator Convenience */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center mb-2.5">
            Quick 1-Click Demo Personas (PRD Roles)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SEEDED_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin(acc.email)}
                className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-left transition-all hover:border-indigo-500/40 hover:bg-slate-800/80 disabled:opacity-50"
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

        {/* API Endpoint Config Toggle */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-indigo-300 transition-colors"
          >
            <Globe className="h-3 w-3" />
            <span>Backend: {api.system.getBaseUrl()}</span>
          </button>

          {showConfig && (
            <form onSubmit={handleSaveUrl} className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-left space-y-2 animate-in fade-in duration-200">
              <label className="block text-[10px] text-slate-400 font-semibold">
                Override Render URL (stores in browser)
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://retainiq-backend.onrender.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-1 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px]"
                >
                  Save & Reload
                </button>
                <button
                  type="button"
                  onClick={() => api.system.resetCustomBaseUrl()}
                  className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                >
                  Reset
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
