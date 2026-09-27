import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Upload,
  RefreshCw,
  Eye,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatPercent, formatCurrency } from "../lib/utils";

export default function EmployeeTable({
  employees,
  total,
  page,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
  onSelectEmployee,
  onRunPredict,
  onOpenAddModal,
  onOpenUploadModal,
  onRunBatchPredict,
  predictingId,
  batchPredicting,
}) {
  const getRiskBadge = (prediction) => {
    if (!prediction) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          <Clock className="h-3 w-3" /> Not Evaluated
        </span>
      );
    }

    const { riskTier, attritionProbability } = prediction;
    const pct = formatPercent(attritionProbability);

    if (riskTier === "HIGH") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
          High ({pct})
        </span>
      );
    }
    if (riskTier === "MEDIUM") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          Medium ({pct})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        Low ({pct})
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative">
      
      {/* Table Header & Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Workforce Directory
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400 font-mono">
              {total} Profiles
            </span>
          </h3>
          <p className="text-xs text-slate-400">Manage records and trigger individual or batch ML attrition scoring</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRunBatchPredict}
            disabled={batchPredicting}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20 disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 text-indigo-400 ${batchPredicting ? "animate-spin" : ""}`} />
            <span>{batchPredicting ? "Evaluating Batch..." : "Batch Re-Score Org"}</span>
          </button>

          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white"
          >
            <Upload className="h-3.5 w-3.5 text-slate-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="btn-shimmer flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or employee #..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={filters.department || ""}
            onChange={(e) => onFilterChange("department", e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Research & Development">Research & Development</option>
            <option value="Human Resources">Human Resources</option>
          </select>

          {/* Risk Tier Filter */}
          <select
            value={filters.riskTier || ""}
            onChange={(e) => onFilterChange("riskTier", e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Risk Tiers</option>
            <option value="HIGH">High Risk (&gt;70%)</option>
            <option value="MEDIUM">Medium Risk (40-70%)</option>
            <option value="LOW">Low Risk (&lt;40%)</option>
          </select>
        </div>

      </div>

      {/* Employees Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Role & Department</th>
              <th className="py-3 px-4">Tenure & Comp</th>
              <th className="py-3 px-4">Overtime / Sat</th>
              <th className="py-3 px-4">ML Attrition Score</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {employees.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  No employee records matched your filter criteria.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const isPredicting = predictingId === emp.id;
                return (
                  <tr key={emp.id} className="hover:bg-slate-900/50 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[11px] text-slate-500">#{emp.employeeNumber} • {emp.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department & Role */}
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-200">{emp.jobRole}</p>
                      <p className="text-[11px] text-slate-500">{emp.department}</p>
                    </td>

                    {/* Tenure & Comp */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200">{formatCurrency(emp.monthlyIncome)}/mo</p>
                      <p className="text-[11px] text-slate-500">{emp.yearsAtCompany} yrs at co • Lvl {emp.jobLevel}</p>
                    </td>

                    {/* Sentiment & Overtime */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          emp.overTime === "Yes" 
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}>
                          OT: {emp.overTime}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Sat: <strong className="text-slate-200">{emp.jobSatisfaction}/4</strong>
                        </span>
                      </div>
                    </td>

                    {/* Attrition Risk Badge */}
                    <td className="py-3 px-4">
                      {getRiskBadge(emp.latestPrediction)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Instant Risk Re-Evaluate */}
                        <button
                          onClick={() => onRunPredict(emp.id)}
                          disabled={isPredicting}
                          title="Run Real-time ML Prediction"
                          className="rounded-lg p-1.5 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors disabled:opacity-50"
                        >
                          <Zap className={`h-4 w-4 ${isPredicting ? "animate-spin text-amber-400" : ""}`} />
                        </button>

                        {/* View Drill-Down */}
                        <button
                          onClick={() => onSelectEmployee(emp.id)}
                          title="View Drill-down Profile & SHAP Explanation"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-slate-800 px-3 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-800 px-3 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
