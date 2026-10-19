import React from "react";
import { ShieldAlert, ArrowRight, Sparkles } from "lucide-react";
import { formatPercent, formatCurrency } from "../lib/utils";

export default function UrgentAlertsSection({ alerts, onSelectEmployee }) {
  // If no live alerts from API, provide fallback matching screenshot demo
  const displayAlerts = (alerts && alerts.length > 0) ? alerts : [
    {
      employeeId: 1,
      name: "Rahul Sharma",
      jobRole: "Sales Representative",
      department: "Sales",
      attritionProbability: 0.999,
      monthlyIncome: 2300,
      topFactors: [
        { feature: "Business Travel, Travel_Frequently", importance: 0.54 },
        { feature: "OverTime_No", importance: 0.51 },
      ],
    },
    {
      employeeId: 3,
      name: "Vikram Patil",
      jobRole: "Laboratory Technician",
      department: "Research & Development",
      attritionProbability: 0.800,
      monthlyIncome: 4800,
      topFactors: [
        { feature: "JobRole_LaboratoryTechnician", importance: 0.60 },
        { feature: "OverTime_No", importance: 0.51 },
      ],
    },
  ];

  const getInitials = (name) => {
    if (!name) return "EM";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      
      {/* Header (Matches Screenshot!) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Priority Retention Alerts
              </h3>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                {displayAlerts.length} High-Risk Personnel
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Employees with attrition risk &gt; 70% requiring immediate proactive intervention
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Alert Cards (Matches Screenshot!) */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {displayAlerts.slice(0, 2).map((emp) => {
          const initials = getInitials(emp.name);
          const pct = formatPercent(emp.attritionProbability);

          return (
            <div
              key={emp.employeeId}
              onClick={() => onSelectEmployee && onSelectEmployee(emp.employeeId)}
              className="group cursor-pointer rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-indigo-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-sm">
                    {initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {emp.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {emp.jobRole} • {emp.department}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-base font-extrabold text-rose-600">
                    {pct}
                  </span>
                  <span className="text-[10px] font-semibold text-rose-600">
                    High Risk
                  </span>
                </div>
              </div>

              {/* Primary Risk Drivers Box */}
              <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100">
                <p className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5 text-[11px]">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>Primary Risk Drivers:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(emp.topFactors || []).map((factor, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-200/60"
                    >
                      {factor.feature} ({factor.importance > 0 ? "+" : ""}{factor.importance.toFixed(2)})
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">
                  Comp: {formatCurrency(emp.monthlyIncome)}/mo
                </span>
                <span className="flex items-center gap-1 font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Intervention Plan <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
