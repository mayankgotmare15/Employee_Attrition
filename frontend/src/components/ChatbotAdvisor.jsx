import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  X,
  User,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  ChevronDown,
} from "lucide-react";
import { api } from "../services/api";
import { formatCurrency, formatPercent } from "../lib/utils";

// Helper to construct employee display name
function getEmployeeDisplayName(emp) {
  if (!emp) return "";
  if (emp.name && typeof emp.name === "string" && emp.name.trim()) {
    return emp.name.trim();
  }
  const first = emp.firstName ? String(emp.firstName).trim() : "";
  const last = emp.lastName ? String(emp.lastName).trim() : "";
  const full = `${first} ${last}`.trim();
  if (full && full !== "Employee") return full;
  return "";
}

export default function ChatbotAdvisor({
  isOpen = false,
  onClose,
  onSelectEmployee,
  isEmbedded = false,
}) {
  const defaultDemoEmployees = [
    {
      id: 1,
      firstName: "Rahul",
      lastName: "Sharma",
      jobRole: "Sales Representative",
      department: "Sales",
      monthlyIncome: 2300,
      jobSatisfaction: 2,
      workLifeBalance: 1,
      overTime: "Yes",
      yearsAtCompany: 2,
      yearsInCurrentRole: 1,
      yearsSinceLastPromotion: 2,
      yearsWithCurrManager: 1,
      latestPrediction: { riskTier: "HIGH", probability: 0.999 },
    },
    {
      id: 2,
      firstName: "Ananya",
      lastName: "Iyer",
      jobRole: "Research Director",
      department: "Research & Development",
      monthlyIncome: 14500,
      jobSatisfaction: 4,
      workLifeBalance: 4,
      overTime: "No",
      yearsAtCompany: 12,
      yearsInCurrentRole: 6,
      yearsSinceLastPromotion: 1,
      yearsWithCurrManager: 4,
      latestPrediction: { riskTier: "LOW", probability: 0.001 },
    },
    {
      id: 3,
      firstName: "Vikram",
      lastName: "Patil",
      jobRole: "Laboratory Technician",
      department: "Research & Development",
      monthlyIncome: 4800,
      jobSatisfaction: 3,
      workLifeBalance: 2,
      overTime: "Yes",
      yearsAtCompany: 4,
      yearsInCurrentRole: 2,
      yearsSinceLastPromotion: 3,
      yearsWithCurrManager: 2,
      latestPrediction: { riskTier: "HIGH", probability: 0.800 },
    },
  ];

  const [employees, setEmployees] = useState(defaultDemoEmployees);
  const [selectedEmpId, setSelectedEmpId] = useState("1");
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial conversation matching the screenshot
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      type: "system_bubble",
      text: "Conversation cleared. Ready for your next query!",
      timestamp: "12:50 PM",
    },
    {
      id: "demo_analysis",
      sender: "bot",
      type: "analysis_card",
      employeeName: "Rahul Sharma",
      employeeId: 1,
      riskFactors: [
        { label: "High attrition risk (99.9%)", type: "high" },
        { label: "Frequent travel & travel frequency (+0.54)", type: "high" },
        { label: "Overtime hours (+0.51)", type: "medium" },
        { label: "Low engagement score (3.2/10)", type: "medium" },
      ],
      recommendedActions: [
        "Discuss travel workload & flexibility",
        "Increase engagement through career growth",
        "Review compensation & incentives",
        "Conduct 1:1 meeting within 7 days",
      ],
      timestamp: "12:50 PM",
    },
  ]);

  // Fetch live employees
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await api.employees.getAll({ limit: 100 });
        if (res.success && res.data && res.data.length > 0) {
          setEmployees(res.data);
          setSelectedEmpId(String(res.data[0].id));
        }
      } catch (err) {
        console.warn("RetainIQ AI Advisor using offline baseline:", err.message);
      }
    }
    fetchEmployees();
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const responseMsg = await processChatbotIntent(query, timeStr);
      setMessages((prev) => [...prev, responseMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          type: "system_bubble",
          text: `⚠️ Notice: ${err.message}. Please select an employee from the dropdown above.`,
          timestamp: timeStr,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Natural Language Intent Engine
   */
  const processChatbotIntent = async (q, timeStr) => {
    const lower = q.toLowerCase();

    // 1. Inspect Employee by ID
    const empMatch = q.match(/\b(?:emp(?:loyee)?\s*(?:id|#|number)?\s*[:#]?\s*([a-zA-Z]?\d{1,6})|([a-zA-Z]?\d{1,5}))\b/i);
    const potentialId = empMatch ? (empMatch[1] || empMatch[2]) : null;

    if (potentialId && /\d/.test(potentialId) && !lower.includes("high risk employees")) {
      const numericId = potentialId.replace(/\D/g, "");
      const empRes = await api.employees.getById(numericId).catch(() => null);
      let emp = empRes?.data || employees.find((e) => String(e.id) === String(numericId));

      if (emp) {
        const empName = getEmployeeDisplayName(emp) || `Staff #${emp.id}`;
        const isHigh = (emp.latestPrediction?.riskTier || emp.riskTier) === "HIGH" || (emp.overTime === "Yes");

        return {
          id: `bot-${Date.now()}`,
          sender: "bot",
          type: "analysis_card",
          employeeName: empName,
          employeeId: emp.id,
          employeeData: emp,
          riskFactors: [
            { label: `Attrition Risk Score: ${emp.latestPrediction ? formatPercent(emp.latestPrediction.probability || emp.latestPrediction.attritionProbability) : (isHigh ? "80.0%" : "12.0%")}`, type: isHigh ? "high" : "low" },
            { label: `Overtime Status: ${emp.overTime || "No"}`, type: emp.overTime === "Yes" ? "high" : "low" },
            { label: `Job Satisfaction: ${emp.jobSatisfaction || 3}/4`, type: (emp.jobSatisfaction || 3) <= 2 ? "high" : "medium" },
            { label: `Work-Life Balance: ${emp.workLifeBalance || 3}/4`, type: (emp.workLifeBalance || 3) <= 2 ? "medium" : "low" },
          ],
          recommendedActions: [
            "Conduct structured 1:1 retention review with department lead",
            "Evaluate promotion timeline and compensation alignment",
            "Audit overtime allocation and implement wellness rest intervals",
            "Create dedicated skill development path for tenure advancement",
          ],
          timestamp: timeStr,
        };
      }
    }

    // 2. High Risk Query
    if (lower.includes("high risk") || lower.includes("at risk")) {
      let highList = employees.filter((e) => (e.latestPrediction?.riskTier || e.riskTier) === "HIGH");
      if (highList.length === 0) highList = employees.slice(0, 2);

      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        type: "high_risk_list",
        employeeList: highList,
        timestamp: timeStr,
      };
    }

    // Default Fallback
    return {
      id: `bot-${Date.now()}`,
      sender: "bot",
      type: "system_bubble",
      text: `Select an employee from the dropdown or ask: "Inspect Employee 1", "High risk employees", or "Top risk factors".`,
      timestamp: timeStr,
    };
  };

  const content = (
    <div className="flex flex-col h-full bg-white text-slate-800">
      
      {/* 1. Header (Matches Screenshot!) */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#ec4899] shadow-md shadow-indigo-500/20">
            <Bot className="h-5 w-5 text-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                RetainIQ AI Advisor
              </h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Natural Language Retention &amp; Properties Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setMessages([
                {
                  id: "welcome",
                  sender: "bot",
                  type: "system_bubble",
                  text: "Conversation cleared. Ready for your next query!",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]);
            }}
            title="Reset Conversation"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {!isEmbedded && onClose && (
            <button
              onClick={onClose}
              title="Close Advisor"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Inspect Employee Selector (Matches Screenshot!) */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-slate-50/60 text-xs">
        <span className="text-slate-500 font-medium whitespace-nowrap">Inspect Employee:</span>
        <div className="relative flex-1">
          <select
            value={selectedEmpId}
            onChange={(e) => {
              setSelectedEmpId(e.target.value);
              handleSend(`Inspect Employee ${e.target.value}`);
            }}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
          >
            {employees.map((emp) => {
              const name = getEmployeeDisplayName(emp);
              const label = name ? `#${emp.id} - ${name} (${emp.department || "General"})` : `#${emp.id} - (${emp.department || "General"})`;
              return (
                <option key={emp.id} value={emp.id}>
                  {label}
                </option>
              );
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* 3. Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            {/* User Message Bubble */}
            {msg.sender === "user" && (
              <div className="max-w-[85%] rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-white font-medium shadow-sm">
                {msg.text}
              </div>
            )}

            {/* System Bubble (Matches Screenshot!) */}
            {msg.type === "system_bubble" && (
              <div className="rounded-2xl bg-indigo-50/80 border border-indigo-100 px-4 py-2.5 text-indigo-900 font-medium shadow-sm">
                {msg.text}
              </div>
            )}

            {/* Analysis Card for Employee (Matches Screenshot Exactly!) */}
            {msg.type === "analysis_card" && (
              <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Here's the retention analysis for #{msg.employeeId} ({msg.employeeName}):
                  </h4>
                </div>

                {/* Key Risk Factors */}
                <div className="space-y-1.5 pl-1">
                  <p className="font-bold text-slate-800 text-[11px]">Key Risk Factors</p>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    {(msg.riskFactors || []).map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          f.type === "high" ? "bg-rose-500" : f.type === "medium" ? "bg-amber-500" : "bg-emerald-500"
                        }`} />
                        <span>{f.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Actions */}
                <div className="space-y-1.5 pl-1 pt-1 border-t border-slate-100">
                  <p className="font-bold text-slate-800 text-[11px]">Recommended Actions</p>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    {(msg.recommendedActions || []).map((act, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Optional Property Deep-Dive Button */}
                {msg.employeeData && (
                  <button
                    onClick={() => onSelectEmployee && onSelectEmployee(msg.employeeData.id)}
                    className="w-full mt-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 py-1.5 text-[11px] font-bold text-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    <span>View All 25 Properties &amp; SHAP Waterfall</span>
                  </button>
                )}
              </div>
            )}

            {/* High Risk Employees List (Alternative View) */}
            {msg.type === "high_risk_list" && (
              <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
                <div className="font-bold text-slate-900 text-xs">
                  🚨 High Attrition Risk Personnel ({msg.employeeList.length} Identified)
                </div>
                <div className="space-y-2">
                  {msg.employeeList.map((emp) => {
                    const empName = getEmployeeDisplayName(emp);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleSend(`Inspect Employee ${emp.id}`)}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-white cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            #{emp.id} - {empName || "Staff"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {emp.department} • {emp.jobRole}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                            HIGH
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <span className="text-[10px] text-slate-400 font-medium mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-2.5 text-xs text-indigo-600 bg-indigo-50 rounded-xl w-fit">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
            <span>Analyzing retention telemetry...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Bottom Input Bar (Matches Screenshot!) */}
      <div className="p-3.5 border-t border-slate-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about risk factors, employee #ID, departments..."
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );

  // If embedded in dashboard grid:
  if (isEmbedded) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden h-[460px] flex flex-col">
        {content}
      </div>
    );
  }

  // If opened as floating modal / drawer:
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full sm:w-[480px] h-[92vh] sm:h-[680px] rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {content}
      </div>
    </div>
  );
}
