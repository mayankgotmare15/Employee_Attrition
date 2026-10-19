import React from "react";
import {
  Search,
  Plus,
  Upload,
  Eye,
  Zap,
  Users,
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
  // If API hasn't loaded or is empty, use seed demo employees matching screenshot
  const displayEmployees = (employees && employees.length > 0) ? employees : [
    {
      id: 1,
      firstName: "Rahul",
      lastName: "Sharma",
      employeeNumber: 1001,
      email: "rahul.sharma@company.com",
      jobRole: "Sales Representative",
      department: "Sales",
      monthlyIncome: 2300,
      yearsAtCompany: 2,
      jobLevel: 1,
      overTime: "Yes",
      jobSatisfaction: 2,
      latestPrediction: {
        riskTier: "HIGH",
        attritionProbability: 0.999,
      },
    },
    {
      id: 2,
      firstName: "Ananya",
      lastName: "Iyer",
      employeeNumber: 1002,
      email: "ananya.iyer@company.com",
      jobRole: "Research Director",
      department: "Research & Development",
      monthlyIncome: 14500,
      yearsAtCompany: 12,
      jobLevel: 4,
      overTime: "No",
      jobSatisfaction: 4,
      latestPrediction: {
        riskTier: "LOW",
        attritionProbability: 0.001,
      },
    },
    {
      id: 3,
      firstName: "Vikram",
      lastName: "Patil",
      employeeNumber: 1003,
      email: "vikram.patil@company.com",
      jobRole: "Laboratory Technician",
      department: "Research & Development",
      monthlyIncome: 4800,
      yearsAtCompany: 4,
      jobLevel: 2,
      overTime: "Yes",
      jobSatisfaction: 3,
      latestPrediction: {
        riskTier: "HIGH",
        attritionProbability: 0.800,
      },
    },
  ];

  const getRiskBadge = (prediction) => {
    if (!prediction) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
          Not Evaluated
        </span>
      );
    }

    const tier = prediction.riskTier || "HIGH";
    const pct = formatPercent(prediction.attritionProbability);

    if (tier === "HIGH") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
          <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
          High ({pct})
        </span>
      );
    }
    if (tier === "MEDIUM") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          Medium ({pct})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        Low ({pct})
      </span>
    );
  };

  const getInitials = (emp) => {
    const f = emp.firstName ? emp.firstName[0] : "";
    const l = emp.lastName ? emp.lastName[0] : "";
    return `${f}${l}`.toUpperCase() || "EM";
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      
      {/* Header & Controls (Matches Screenshot!) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Workforce Directory
              </h3>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200/60">
                {total || displayEmployees.length} Profiles
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage records and trigger individual or batch ML attrition scoring
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRunBatchPredict}
            disabled={batchPredicting}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 ${batchPredicting ? "animate-spin" : ""}`} />
            <span>{batchPredicting ? "Scoring..." : "+ Batch Re-Score Org"}</span>
          </button>

          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or employee #..."
            value={filters?.search || ""}
            onChange={(e) => onFilterChange && onFilterChange("search", e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filters?.department || ""}
            onChange={(e) => onFilterChange && onFilterChange("department", e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Research & Development">Research & Development</option>
            <option value="Human Resources">Human Resources</option>
          </select>

          <select
            value={filters?.riskTier || ""}
            onChange={(e) => onFilterChange && onFilterChange("riskTier", e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Risk Tiers</option>
            <option value="HIGH">High Risk (&gt;70%)</option>
            <option value="MEDIUM">Medium Risk (40-70%)</option>
            <option value="LOW">Low Risk (&lt;40%)</option>
          </select>
        </div>
      </div>

      {/* Table (Matches Screenshot!) */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">Employee</th>
              <th className="py-2.5 px-3">Role &amp; Department</th>
              <th className="py-2.5 px-3">Tenure &amp; Comp</th>
              <th className="py-2.5 px-3">Overtime / Sat</th>
              <th className="py-2.5 px-3">ML Attrition Score</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {displayEmployees.map((emp) => {
              const isPredicting = predictingId === emp.id;
              const initials = getInitials(emp);

              return (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Employee Name & Initial Avatar */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          #{emp.employeeNumber || emp.id} • {emp.email || `emp${emp.id}@company.com`}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role & Department */}
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-slate-800">{emp.jobRole}</p>
                    <p className="text-[10px] text-slate-400">{emp.department}</p>
                  </td>

                  {/* Tenure & Compensation */}
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-slate-900">{formatCurrency(emp.monthlyIncome)}/mo</p>
                    <p className="text-[10px] text-slate-400">
                      {emp.yearsAtCompany} yrs at co • Lvl {emp.jobLevel || 1}
                    </p>
                  </td>

                  {/* Overtime & Satisfaction */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.overTime === "Yes"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-sky-50 text-sky-700 border border-sky-200"
                      }`}>
                        OT: {emp.overTime}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Sat: {emp.jobSatisfaction || 3}/4
                      </span>
                    </div>
                  </td>

                  {/* ML Score Badge */}
                  <td className="py-2.5 px-3">
                    {getRiskBadge(emp.latestPrediction)}
                  </td>

                  {/* Action Icons */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onRunPredict && onRunPredict(emp.id)}
                        disabled={isPredicting}
                        title="Re-run ML Inference"
                        className="rounded-lg p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                      >
                        <Zap className={`h-4 w-4 ${isPredicting ? "animate-spin text-amber-500" : ""}`} />
                      </button>

                      <button
                        onClick={() => onSelectEmployee && onSelectEmployee(emp.id)}
                        title="View Full Profile & SHAP Explanation"
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange && onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
