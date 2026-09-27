import React from "react";
import { Users, AlertTriangle, TrendingUp, ShieldCheck, ArrowUpRight, Zap } from "lucide-react";
import { formatPercent } from "../lib/utils";

export default function BentoStatsGrid({ overview, onFilterRisk }) {
  if (!overview) return null;

  const { summary, riskDistribution } = overview;
  const highRisk = riskDistribution?.high || { count: 0, percentage: 0 };
  const mediumRisk = riskDistribution?.medium || { count: 0, percentage: 0 };
  const lowRisk = riskDistribution?.low || { count: 0, percentage: 0 };

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

      {/* 4. Active MLOps Engine Health */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">MLOps Retraining</span>
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-400">v1.0.0 Active</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>Drift Z-Score: <strong className="text-emerald-400">0.42 (&le; 2.0)</strong></span>
          <span className="text-slate-400">Status: Healthy</span>
        </div>
      </div>

    </div>
  );
}
