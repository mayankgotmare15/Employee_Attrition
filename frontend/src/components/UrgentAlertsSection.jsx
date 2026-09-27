import React from "react";
import { AlertCircle, User, ArrowRight, ShieldAlert, Clock, Sparkles } from "lucide-react";
import { formatPercent, formatCurrency } from "../lib/utils";

export default function UrgentAlertsSection({ alerts, onSelectEmployee }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 relative border-rose-500/30 overflow-hidden bg-gradient-to-b from-rose-950/10 via-slate-900/60 to-slate-900/80">
      <div className="flex items-center justify-between pb-4 border-b border-rose-900/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Priority Retention Alerts</h3>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                {alerts.length} High-Risk Personnel
              </span>
            </div>
            <p className="text-xs text-slate-400">Employees with attrition risk &gt; 70% requiring immediate proactive intervention</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {alerts.slice(0, 3).map((emp) => (
          <div
            key={emp.employeeId}
            onClick={() => onSelectEmployee(emp.employeeId)}
            className="group relative cursor-pointer rounded-xl border border-rose-500/20 bg-slate-900/80 p-4 transition-all hover:-translate-y-1 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                  {emp.name}
                </h4>
                <p className="text-xs text-slate-400">{emp.jobRole} • {emp.department}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-black text-rose-400 border border-rose-500/40">
                  {formatPercent(emp.attritionProbability)}
                </span>
                <span className="text-[10px] text-rose-400/80 font-medium mt-0.5">High Risk</span>
              </div>
            </div>

            {/* Top SHAP Drivers */}
            <div className="mt-3 rounded-lg bg-slate-950/60 p-2.5 text-[11px] text-slate-300 border border-slate-800">
              <p className="font-semibold text-slate-400 flex items-center gap-1 mb-1">
                <Sparkles className="h-3 w-3 text-amber-400" /> Primary Risk Drivers:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(emp.topFactors || []).slice(0, 2).map((factor, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300 border border-rose-500/20"
                  >
                    {factor.feature} ({factor.importance > 0 ? "+" : ""}{factor.importance.toFixed(2)})
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">Comp: {formatCurrency(emp.monthlyIncome)}/mo</span>
              <span className="flex items-center gap-1 font-semibold text-indigo-400 group-hover:text-indigo-300">
                Intervention Plan <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
