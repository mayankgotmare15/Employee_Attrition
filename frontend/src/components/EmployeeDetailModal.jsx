import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Zap,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Briefcase,
  DollarSign,
  Heart,
  CheckCircle,
} from "lucide-react";
import { api } from "../services/api";
import { formatPercent, formatCurrency } from "../lib/utils";

export default function EmployeeDetailModal({ employeeId, onClose, onRefreshList }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("explainability"); // explainability | profile | history
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!employeeId) return;
      try {
        setLoading(true);
        const res = await api.employees.getById(employeeId);
        if (res.success) {
          setEmployee(res.data);
        }
      } catch (err) {
        console.error("Failed to load employee:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [employeeId]);

  const handlePredict = async () => {
    try {
      setPredicting(true);
      const res = await api.predictions.predict(employeeId);
      if (res.success) {
        // Refresh details
        const refreshed = await api.employees.getById(employeeId);
        setEmployee(refreshed.data);
        if (onRefreshList) onRefreshList();
      }
    } catch (err) {
      alert("Prediction failed: " + err.message);
    } finally {
      setPredicting(false);
    }
  };

  if (!employeeId) return null;

  const latestPred = employee?.latestPrediction;
  const history = employee?.history || [];
  const topFactors = latestPred?.topRiskFactors || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl p-6 overflow-hidden my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            <Zap className="h-6 w-6 animate-spin text-indigo-400 mr-2" />
            <span>Loading employee telemetry...</span>
          </div>
        ) : !employee ? (
          <p className="text-center text-rose-400 py-8">Employee not found.</p>
        ) : (
          <div>
            {/* Header Profile */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg">
                  {employee.firstName[0]}{employee.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">
                      {employee.firstName} {employee.lastName}
                    </h2>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-400">
                      ID #{employee.employeeNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {employee.jobRole} • {employee.department} • {employee.email}
                  </p>
                </div>
              </div>

              {/* Live Risk Badge & Predict Button */}
              <div className="flex items-center gap-3">
                {latestPred ? (
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                      latestPred.riskTier === "HIGH"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                        : latestPred.riskTier === "MEDIUM"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}>
                      {latestPred.riskTier} Risk ({formatPercent(latestPred.attritionProbability)})
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Model {latestPred.modelVersion?.version || "v1.0.0"}</p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Unscored</span>
                )}

                <button
                  onClick={handlePredict}
                  disabled={predicting}
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <Zap className={`h-3.5 w-3.5 ${predicting ? "animate-spin text-amber-400" : ""}`} />
                  <span>{predicting ? "Analyzing..." : "Re-Calculate"}</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-4 mt-4 border-b border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab("explainability")}
                className={`flex items-center gap-1.5 pb-2.5 font-semibold transition-colors border-b-2 ${
                  activeTab === "explainability"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Explainable AI (SHAP Drivers)</span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-1.5 pb-2.5 font-semibold transition-colors border-b-2 ${
                  activeTab === "profile"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>HR Profile & Sentiment</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 pb-2.5 font-semibold transition-colors border-b-2 ${
                  activeTab === "history"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Prediction History ({history.length})</span>
              </button>
            </div>

            {/* Tab 1: SHAP Explainability & Recommendations */}
            {activeTab === "explainability" && (
              <div className="mt-5 space-y-5">
                {/* Recommended HR Action Banner */}
                {latestPred && (
                  <div className={`rounded-xl p-4 border ${
                    latestPred.riskTier === "HIGH"
                      ? "bg-rose-950/20 border-rose-500/40 text-rose-200"
                      : latestPred.riskTier === "MEDIUM"
                      ? "bg-amber-950/20 border-amber-500/40 text-amber-200"
                      : "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Tailored HR Retention Strategy
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{latestPred.recommendedAction}</p>
                  </div>
                )}

                {/* Local SHAP Feature Contributions Chart */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      Local Feature Contributions (SHAP TreeExplainer)
                    </span>
                    <span className="text-[10px] text-slate-500">Positive = Increases Risk • Negative = Retains</span>
                  </div>

                  {topFactors.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3">No SHAP explainability factors tracked yet. Click Re-Calculate above.</p>
                  ) : (
                    <div className="space-y-3">
                      {topFactors.map((factor, idx) => {
                        const isRiskIncrease = factor.impact === "Increases Risk" || factor.importance > 0;
                        const absScore = Math.abs(factor.importance);
                        const widthPct = Math.min(Math.round((absScore / 0.8) * 100), 100);

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-300">{factor.feature}</span>
                              <span className={`font-mono text-[11px] font-bold ${
                                isRiskIncrease ? "text-rose-400" : "text-emerald-400"
                              }`}>
                                {isRiskIncrease ? "+" : "-"}{absScore.toFixed(3)} ({factor.impact})
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                              <div
                                style={{ width: `${widthPct}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isRiskIncrease
                                    ? "bg-gradient-to-r from-rose-500 to-rose-400"
                                    : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Full HR Profile & Sentiment Ratings */}
            {activeTab === "profile" && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Employment & Comp */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
                  <h4 className="font-bold text-white flex items-center gap-1.5 pb-2 border-b border-slate-800">
                    <Briefcase className="h-4 w-4 text-indigo-400" />
                    Employment & Experience
                  </h4>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Monthly Compensation:</span>
                    <strong className="text-white">{formatCurrency(employee.monthlyIncome)}/mo</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Job Level:</span>
                    <span>Level {employee.jobLevel} of 5</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Tenure at Company:</span>
                    <span>{employee.yearsAtCompany} years</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Years in Current Role:</span>
                    <span>{employee.yearsInCurrentRole} years</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Years Since Last Promotion:</span>
                    <span className={employee.yearsSinceLastPromotion > 3 ? "text-amber-400 font-bold" : ""}>
                      {employee.yearsSinceLastPromotion} years
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Mandatory OverTime:</span>
                    <strong className={employee.overTime === "Yes" ? "text-rose-400" : "text-emerald-400"}>
                      {employee.overTime}
                    </strong>
                  </div>
                </div>

                {/* Sentiment & Satisfaction */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
                  <h4 className="font-bold text-white flex items-center gap-1.5 pb-2 border-b border-slate-800">
                    <Heart className="h-4 w-4 text-purple-400" />
                    Sentiment & Satisfaction Gauges
                  </h4>
                  {[
                    { label: "Job Satisfaction", val: employee.jobSatisfaction },
                    { label: "Environment Satisfaction", val: employee.environmentSatisfaction },
                    { label: "Work-Life Balance", val: employee.workLifeBalance },
                    { label: "Relationship Satisfaction", val: employee.relationshipSatisfaction },
                    { label: "Job Involvement", val: employee.jobInvolvement },
                  ].map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">{s.label}:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4].map((star) => (
                          <span
                            key={star}
                            className={`h-2 w-4 rounded-sm ${
                              star <= s.val ? (s.val <= 2 ? "bg-rose-500" : "bg-emerald-500") : "bg-slate-800"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-[11px] font-bold text-slate-300">{s.val}/4</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between text-slate-300 pt-1">
                    <span className="text-slate-500">Performance Rating:</span>
                    <strong className="text-indigo-400">{employee.performanceRating}/4</strong>
                  </div>
                </div>

              </div>
            )}

            {/* Tab 3: PRD FR-4 Prediction History Trajectory */}
            {activeTab === "history" && (
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Evaluation Date</th>
                        <th className="py-2.5 px-3">Model Version</th>
                        <th className="py-2.5 px-3">Probability</th>
                        <th className="py-2.5 px-3">Risk Tier</th>
                        <th className="py-2.5 px-3">Primary Factor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-slate-500">
                            No historical evaluations recorded yet.
                          </td>
                        </tr>
                      ) : (
                        history.map((record) => (
                          <tr key={record.id} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                              {new Date(record.predictedAt).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {record.modelVersion?.version || "v1.0.0"} ({record.modelVersion?.algorithm || "LogisticRegression"})
                            </td>
                            <td className="py-2.5 px-3 font-bold font-mono">
                              {formatPercent(record.attritionProbability)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                record.riskTier === "HIGH"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : record.riskTier === "MEDIUM"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-emerald-500/20 text-emerald-300"
                              }`}>
                                {record.riskTier}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-400">
                              {record.topRiskFactors?.[0]?.feature || "N/A"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
