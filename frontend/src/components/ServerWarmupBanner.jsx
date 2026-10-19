import React, { useState, useEffect } from "react";
import { Activity, CheckCircle2, RefreshCw, X, Globe, Settings } from "lucide-react";
import { api } from "../services/api";

export default function ServerWarmupBanner() {
  const [status, setStatus] = useState("checking"); // 'checking' | 'waking_up' | 'online' | 'offline'
  const [details, setDetails] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState(api.system.getBaseUrl().replace(/\/api\/v1$/, ""));

  useEffect(() => {
    // Initial health check probe
    api.system.checkHealth().then((res) => {
      if (res.ok) {
        setStatus("online");
      } else {
        setStatus("waking_up");
      }
    });

    // Listen to live status events from api.js resilient fetcher
    const handleStatusEvent = (e) => {
      const data = e.detail;
      setStatus(data.status);
      setDetails(data);
      if (data.status === "online") {
        // Auto-dismiss after 3 seconds of being online
        setTimeout(() => {
          setDismissed(true);
        }, 3000);
      } else {
        setDismissed(false);
      }
    };

    window.addEventListener("retainiq:backend-status", handleStatusEvent);
    return () => {
      window.removeEventListener("retainiq:backend-status", handleStatusEvent);
    };
  }, []);

  const handleSaveCustomUrl = (e) => {
    e.preventDefault();
    if (customUrl.trim()) {
      api.system.setCustomBaseUrl(customUrl.trim());
    }
  };

  const handleResetUrl = () => {
    api.system.resetCustomBaseUrl();
  };

  if (dismissed && status === "online") return null;

  return (
    <>
      {status === "waking_up" && !dismissed && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-indigo-950/90 border-b border-amber-500/30 backdrop-blur-md px-4 py-2 text-xs text-amber-200 shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 max-w-4xl mx-auto">
            <RefreshCw className="h-4 w-4 text-amber-400 animate-spin flex-shrink-0" />
            <div>
              <span className="font-bold text-amber-300">Waking up cloud server: </span>
              <span className="text-slate-300">
                Render free-tier instances sleep when inactive. Waking up takes ~30-45s. Automatic retries are active...
              </span>
              {details?.attempt && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                  Attempt {details.attempt} / {details.maxRetries || 3}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-[11px] underline text-indigo-300 hover:text-white transition-colors"
            >
              Configure URL
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {status === "online" && !dismissed && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-950/90 border-b border-emerald-500/30 backdrop-blur-md px-4 py-1.5 text-xs text-emerald-200 shadow-md flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-semibold text-emerald-300">Backend Connected & Active</span>
          <span className="text-[11px] text-emerald-400/80 font-mono">({api.system.getBaseUrl()})</span>
        </div>
      )}

      {/* Backend URL Customization Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Globe className="h-4 w-4 text-indigo-400" />
                Backend Connection Settings
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              If your Render backend URL is different from the default, paste it here. It will be stored in your browser session.
            </p>

            <form onSubmit={handleSaveCustomUrl} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                  Render Backend Base URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://retainiq-backend.onrender.com"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/30"
                >
                  Save & Reload
                </button>
                <button
                  type="button"
                  onClick={handleResetUrl}
                  className="rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 px-3 py-2 text-xs text-slate-300 transition-all"
                >
                  Reset Default
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
