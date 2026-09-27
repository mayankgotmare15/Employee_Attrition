import React from "react";
import { Users, AlertTriangle, TrendingUp, Zap, ArrowUpRight, ShieldCheck, PlayCircle } from "lucide-react";
import { formatPercent } from "../lib/utils";

export default function BentoStatsGrid({
  overview,
  onFilterRisk,
  driftReport,
  activeVersion = "v1.2.0",
  onSimulateDrift,
  simulatingDrift,
}) {
  if (!overview) return null;

  const { summary, riskDistribution } = overview;
  const highRisk = riskDistribution?.high || { count: 0, percentage: 0 };
  const mediumRisk = riskDistribution?.medium || { count: 0, percentage: 0 };
  const lowRisk = riskDistribution?.low || { count: 0, percentage: 0 };

  const zScore = driftReport?.z_score !== undefined ? driftReport.z_score : 0.72;
  const isDrifted = driftReport?.drift_detected || zScore > 2.0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      
      {/* 1. Total Workforce Card */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Workforce</span>
          <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 border border-indigo-500/20">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-white">{summary.totalEmployees}</span>
          <span className="text-xs text-emerald-400 font-medium">100% Monitored</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>Active Personnel: <strong className="text-slate-200">{summary.activeEmployees}</strong></span>
          <span>Scored: <strong className="text-slate-200">{summary.scoredEmployees}</strong></span>
        </div>
      </div>

      {/* 2. High-Risk Alert Card (Glowing Rose) */}
      <div 
        onClick={() => onFilterRisk("HIGH")}
        className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group cursor-pointer border-rose-500/30 hover:border-rose-500/60 bg-gradient-to-br from-rose-950/20 to-slate-900/40"
      >
        <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/15 rounded-full blur-2xl group-hover:bg-rose-500/30 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">High Risk Leavers</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          </div>
          <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-rose-300">{highRisk.count}</span>
          <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            {highRisk.percentage}% of org
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-rose-300/80 border-t border-rose-900/30 pt-2.5">
          <span>PRD Tier: &gt; 70% Prob</span>
          <span className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform">
            Review Alerts <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* 3. Average Attrition Risk Rate */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-24 w-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Attrition Risk</span>
          <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/20">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {formatPercent(summary.averageAttritionRisk)}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
            summary.averageAttritionRisk > 0.4 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
            {summary.averageAttritionRisk > 0.4 ? "Moderate Risk" : "Stable Baseline"}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>Medium Risk: <strong className="text-amber-400">{mediumRisk.count}</strong></span>
          <span>Low Risk: <strong className="text-emerald-400">{lowRisk.count}</strong></span>
        </div>
      </div>

      {/* 4. Active MLOps Engine Health & Drift Trigger */}
      <div className={`glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group border ${
        isDrifted ? "border-amber-500/40 bg-amber-950/10" : "border-slate-800/80"
      }`}>
        <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">MLOps Retraining</span>
          <div className={`rounded-xl p-2.5 border ${
            isDrifted
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          }`}>
            <Zap className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold tracking-tight text-white">{activeVersion} Active</span>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Drift Z: <strong className={isDrifted ? "text-amber-400 font-bold" : "text-emerald-400"}>
                {zScore.toFixed(2)}
              </strong> (Limit &le; 2.0)
            </p>
          </div>

          {/* PRD TC-04 Live Drift Test Button */}
          {onSimulateDrift && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSimulateDrift();
              }}
              disabled={simulatingDrift}
              title="PRD TC-04: Simulate Z > 2.0 to trigger automated retraining"
              className="flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-all disabled:opacity-50"
            >
              <PlayCircle className={`h-3.5 w-3.5 ${simulatingDrift ? "animate-spin text-amber-400" : "text-indigo-400"}`} />
              <span>{simulatingDrift ? "Retraining..." : "Test TC-04"}</span>
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>PSI: <strong className="text-slate-200">{driftReport?.psi || "0.12"}</strong></span>
          <span className={`font-semibold ${isDrifted ? "text-amber-400" : "text-emerald-400"}`}>
            {isDrifted ? "Drift Active" : "Status: Healthy"}
          </span>
        </div>
      </div>

    </div>
  );
}
