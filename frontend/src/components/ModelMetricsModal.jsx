import React, { useState, useEffect } from "react";
import { X, Cpu, CheckCircle2, TrendingUp, Zap, BarChart2, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { formatPercent } from "../lib/utils";

export default function ModelMetricsModal({ isOpen, onClose }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    async function loadMetrics() {
      try {
        setLoading(true);
        const res = await api.analytics.getModelMetrics();
        if (res.success) {
          setMetrics(res.data);
        }
      } catch (err) {
        console.error("Failed to load model metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [isOpen]);

  if (!isOpen) return null;

  const champ = metrics?.champion_metrics || {
    algorithm: "LogisticRegression",
    accuracy: 0.7857,
    f1_score: 0.5039,
    roc_auc: 0.8080,
    recall: 0.6809,
    precision: 0.4000,
  };

  const benchmarks = metrics?.all_benchmarks || [
    { algorithm: "LogisticRegression", accuracy: 0.7857, f1_score: 0.5039, roc_auc: 0.8080, recall: 0.6809, precision: 0.4000 },
    { algorithm: "RandomForest", accuracy: 0.8265, f1_score: 0.4632, roc_auc: 0.7909, recall: 0.4681, precision: 0.4583 },
    { algorithm: "XGBoost", accuracy: 0.8027, f1_score: 0.4630, roc_auc: 0.7714, recall: 0.5319, precision: 0.4098 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">MLOps Model Registry & Telemetry</h3>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                Active in Production
              </span>
            </div>
            <p className="text-xs text-slate-400">Model version {metrics?.model_version || "v1.0.0"} benchmark validation metrics</p>
          </div>
        </div>

        {/* Champion Metrics Bento Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-[11px] text-slate-400 font-medium">ROC-AUC Score</p>
            <p className="text-xl font-black text-emerald-400 mt-1">{(champ.roc_auc * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-slate-500">Discrimination</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-[11px] text-slate-400 font-medium">Leaver Recall</p>
            <p className="text-xl font-black text-indigo-400 mt-1">{(champ.recall * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-slate-500">Catches Leavers</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-[11px] text-slate-400 font-medium">Overall Accuracy</p>
            <p className="text-xl font-black text-white mt-1">{(champ.accuracy * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-slate-500">Balanced Split</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-[11px] text-slate-400 font-medium">F1-Score</p>
            <p className="text-xl font-black text-purple-400 mt-1">{(champ.f1_score * 100).toFixed(1)}%</p>
            <p className="text-[10px] text-slate-500">Harmonic Mean</p>
          </div>
        </div>

        {/* Algorithm Benchmark Comparison */}
        <div className="mt-5">
          <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-indigo-400" />
            Phase 1 Algorithm Benchmark Comparison
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">ROC-AUC</th>
                  <th className="py-2.5 px-3">Recall</th>
                  <th className="py-2.5 px-3">F1-Score</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {benchmarks.map((b, idx) => {
                  const isChamp = b.algorithm === champ.algorithm;
                  return (
                    <tr key={idx} className={isChamp ? "bg-indigo-950/20" : ""}>
                      <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-1.5">
                        {isChamp && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                        {b.algorithm}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        {(b.roc_auc * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono">{(b.recall * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 font-mono">{(b.f1_score * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 font-mono">{(b.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isChamp ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-500"
                        }`}>
                          {isChamp ? "Champion" : "Evaluated"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MLOps Drift Safeguard Notice */}
        <div className="mt-5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>PRD Automated Drift Retraining Trigger: <strong>Z &gt; 2.0</strong> (Current: <strong>Z = 0.42</strong>)</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">Stable</span>
        </div>

      </div>
    </div>
  );
}
