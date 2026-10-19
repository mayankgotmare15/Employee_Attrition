import React from "react";
import { Users, AlertTriangle, TrendingUp, ChevronsRight, ArrowRight } from "lucide-react";
import { formatPercent } from "../lib/utils";

export default function BentoStatsGrid({
  overview,
  onFilterRisk,
  onScrollToAlerts,
}) {
  if (!overview) return null;

  const { summary, riskDistribution } = overview;
  const highRisk = riskDistribution?.high || { count: 0, percentage: 0 };
  const mediumRisk = riskDistribution?.medium || { count: 0, percentage: 0 };
  const lowRisk = riskDistribution?.low || { count: 0, percentage: 0 };

  const totalCount = summary?.totalEmployees ?? 3;
  const activeCount = summary?.activeEmployees ?? totalCount;
  const avgRisk = summary?.averageAttritionRisk ?? 0.60;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      
      {/* 1. TOTAL WORKFORCE (Matches Screenshot!) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Workforce
            </span>
          </div>
          <ChevronsRight className="h-4 w-4 text-sky-400" />
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {totalCount}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
            100% Monitored
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Active Personnel: <strong className="text-slate-800">{activeCount}</strong></span>
          <span>Scoped: <strong className="text-slate-800">{totalCount}</strong></span>
        </div>
      </div>

      {/* 2. HIGH RISK LEAVERS (Matches Screenshot!) */}
      <div 
        onClick={() => {
          if (onFilterRisk) onFilterRisk("HIGH");
          if (onScrollToAlerts) onScrollToAlerts();
        }}
        className="rounded-2xl border border-rose-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              High Risk Leavers
            </span>
          </div>
          <ChevronsRight className="h-4 w-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {highRisk.count}
          </span>
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/60">
            {highRisk.percentage}% of org
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="text-slate-500">PRD Tier &gt; 70% Prob</span>
          <span className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800">
            Review Alerts <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* 3. AVG ATTRITION RISK (Matches Screenshot!) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Avg Attrition Risk
            </span>
          </div>
          <ChevronsRight className="h-4 w-4 text-emerald-400" />
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {formatPercent(avgRisk)}
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60">
            Medium Risk: {mediumRisk.count}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Medium Risk: <strong className="text-amber-700">{mediumRisk.count}</strong></span>
          <span>Low Risk: <strong className="text-emerald-700">{lowRisk.count}</strong></span>
        </div>
      </div>

    </div>
  );
}
