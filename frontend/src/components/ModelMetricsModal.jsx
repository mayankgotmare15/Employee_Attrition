import React, { useState, useEffect } from "react";
import { X, Cpu, CheckCircle2, TrendingUp, Zap, BarChart2, ShieldCheck, PlayCircle, History } from "lucide-react";
import { api } from "../services/api";

export default function ModelMetricsModal({ isOpen, onClose, onModelUpdated }) {
  const [metrics, setMetrics] = useState(null);
  const [driftReport, setDriftReport] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const loadData = async () => {
    try {
      const [metricsRes, driftRes] = await Promise.all([
        api.analytics.getModelMetrics(),
        api.analytics.getDriftStatus(),
      ]);
      if (metricsRes.success) setMetrics(metricsRes.data);
      if (driftRes.success) setDriftReport(driftRes.data);
    } catch (err) {
      console.error("Failed to load MLOps metrics:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSimulationResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateDrift = async () => {
    try {
      setSimulating(true);
      const res = await api.analytics.simulateDrift();
      if (res.success) {
        setSimulationResult(res.data);
        await loadData();
        if (onModelUpdated) onModelUpdated();
      }
    } catch (err) {
      alert("Simulation failed: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

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

  const versionHistory = metrics?.version_history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 overflow-hidden my-8">
        
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
              <h3 className="text-base font-bold text-white">MLOps Model Registry & Continuous Deployment</h3>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                {metrics?.model_version || "v1.2.0"} Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Model versioning, drift thresholds, and automated retraining loop</p>
          </div>
        </div>

        {/* PRD TC-04 Simulation Action Banner */}
        <div className="mt-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <PlayCircle className="h-4 w-4 text-indigo-400" />
                <span>Test PRD TC-04: Automated Retraining Trigger</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Simulates macro workforce stress, drives Z &gt; 2.0, triggers retraining, and deploys new version.
              </p>
            </div>
            <button
              onClick={handleSimulateDrift}
              disabled={simulating}
              className="btn-shimmer flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 shrink-0"
            >
              <Zap className={`h-3.5 w-3.5 ${simulating ? "animate-spin" : ""}`} />
              <span>{simulating ? "Executing Loop..." : "Simulate Z > 2.0"}</span>
            </button>
          </div>

          {/* Simulation Outcome Feedback */}
          {simulationResult && (
            <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-300">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                TC-04 Verified: Drift Z={simulationResult.drift_report.z_score.toFixed(2)} detected! Retraining triggered!
              </p>
              <p className="text-[11px] text-emerald-400/90 mt-1">
                Deployed: <strong>{simulationResult.retraining_result.new_version}</strong> ({simulationResult.retraining_result.champion_algorithm}) • ROC-AUC: <strong>{(simulationResult.retraining_result.metrics.roc_auc * 100).toFixed(1)}%</strong>
              </p>
            </div>
          )}
        </div>

        {/* Champion Metrics Bento Grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
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
            <p className="text-[11px] text-slate-400 font-medium">Accuracy</p>
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
        <div className="mt-4">
          <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-indigo-400" />
            Model Benchmark Performance
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
                      <td className="py-2 px-3 font-semibold text-white flex items-center gap-1.5">
                        {isChamp && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                        {b.algorithm}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                        {(b.roc_auc * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 font-mono">{(b.recall * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3 font-mono">{(b.f1_score * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3 font-mono">{(b.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-2 px-3">
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

        {/* Model Version History Timeline (PRD FR-8) */}
        {versionHistory.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <History className="h-4 w-4 text-purple-400" />
              Model Version Registry & Rollback History
            </h4>
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {versionHistory.map((v, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-950/50 p-2 text-xs text-slate-300 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-400">{v.version}</span>
                    <span className="text-slate-400">{v.algorithm}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>ROC-AUC: {((v.metrics?.roc_auc || 0.8) * 100).toFixed(1)}%</span>
                    <span>Archived: {new Date(v.retired_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
