import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Sparkles,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  User,
  Building,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronRight,
  Info,
  Briefcase,
  Heart,
  DollarSign,
  Clock,
  Shield,
  FileText,
  Search,
} from "lucide-react";
import { api } from "../services/api";
import { formatCurrency, formatPercent } from "../lib/utils";

// Knowledge Base for General Retention Inquiries
const GENERAL_KB = {
  attrition: {
    title: "Understanding Employee Attrition",
    content:
      "Employee attrition is the reduction in workforce size when employees leave voluntarily or involuntarily and are not immediately backfilled. Unlike acute turnover spikes, sustained attrition reveals systemic friction in culture, management advocacy, compensation equity, or work-life balance.",
  },
  reasons: {
    title: "Top 5 Organizational Drivers of Attrition",
    content:
      "1. Supervisory Friction & Low Manager Support (leading indicator)\n2. Excessive Overtime & Work-Life Burnout (>48 hrs/wk)\n3. Career Stagnation & Stalled Promotions (>=3 years without advancement)\n4. Uncompetitive Compensation Parity relative to responsibilities\n5. Low Role Satisfaction & Disengagement",
  },
  retention: {
    title: "Strategic HR Retention Blueprint",
    content:
      "1. Implement Proactive Stay Interviews before high-performers disengage\n2. Enforce Work-Hour Caps to prevent sustained overtime exhaustion\n3. Establish Clear Competency Ladders with measurable milestones\n4. Coach First-Line Managers on empathy and psychological safety\n5. Offer Hybrid Flexibility to mitigate commute friction",
  },
};

export default function ChatbotAdvisor({ isOpen, onClose, onSelectEmployee }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Hello! I am your **RetainIQ AI Retention Advisor**.\n\nI can analyze individual employees, display all 25+ workplace properties, evaluate attrition risks, and provide actionable retention strategies.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      quickActions: [
        "🚨 High Risk Employees",
        "🏢 Department Breakdown",
        "📊 Top Risk Factors",
        "💡 HR Retention Blueprint",
        "📋 Inspect Employee 1001",
      ],
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [activePropertyTab, setActivePropertyTab] = useState("all"); // 'all' | 'sentiment' | 'tenure' | 'comp'
  const messagesEndRef = useRef(null);

  // Load employee list for dropdown auto-lookup
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await api.employees.getAll({ limit: 100 });
        if (res.success && res.data) {
          setEmployees(res.data);
          if (res.data.length > 0) {
            setSelectedEmpId(String(res.data[0].id));
          }
        }
      } catch (err) {
        console.warn("Could not load employee directory for chatbot:", err.message);
      }
    }
    fetchEmployees();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const responseMsg = await processChatbotIntent(query);
      setMessages((prev) => [...prev, responseMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: `⚠️ Error evaluating request: ${err.message}. Please try rephrasing or pick from the quick prompts.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Main Intent Router
   */
  const processChatbotIntent = async (q) => {
    const lower = q.toLowerCase();
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Check for Specific Employee Query (e.g. "1001", "E001", "employee 1003", "analyze 1004")
    const empMatch = q.match(/\b(?:emp(?:loyee)?\s*(?:id|#|number)?\s*[:#]?\s*([a-zA-Z]?\d{1,6})|([a-zA-Z]?\d{3,5}))\b/i);
    const potentialId = empMatch ? (empMatch[1] || empMatch[2]) : null;

    if (potentialId && /\d/.test(potentialId) && !lower.includes("high risk employees")) {
      const numericId = potentialId.replace(/\D/g, "");
      // Fetch full employee details
      const empRes = await api.employees.getById(numericId).catch(() => null);

      if (empRes?.success && empRes.data) {
        const emp = empRes.data;
        return {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `### 📋 Comprehensive Profile & Retention Analysis for **${emp.name} (ID: #${emp.id})**\n` +
            `**Department:** ${emp.department} • **Role:** ${emp.jobRole} • **Status:** ${emp.status || "ACTIVE"}`,
          employeeData: emp,
          timestamp,
        };
      } else {
        // Fallback: check if local employee exists
        const found = employees.find((e) => String(e.id) === String(numericId) || e.name.toLowerCase().includes(potentialId.toLowerCase()));
        if (found) {
          const detailRes = await api.employees.getById(found.id).catch(() => null);
          const fullEmp = detailRes?.data || found;
          return {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: `### 📋 Comprehensive Profile & Retention Analysis for **${fullEmp.name} (ID: #${fullEmp.id})**`,
            employeeData: fullEmp,
            timestamp,
          };
        }
        return {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `⚠️ Employee with ID or keyword \`${potentialId}\` was not found in the directory. You can pick an employee from the dropdown above to inspect their properties.`,
          timestamp,
        };
      }
    }

    // 2. High Risk Employees List Query
    if (lower.includes("high risk") || lower.includes("at risk") || lower.includes("who is at risk") || lower.includes("urgent")) {
      const highRiskList = employees.filter((e) => e.latestPrediction?.riskTier === "HIGH" || e.riskTier === "HIGH");
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `### 🚨 High Attrition Risk Personnel (${highRiskList.length} Identified)\n` +
          `These team members exhibit critical indicators (low satisfaction, chronic overtime, or low engagement).`,
        employeeList: highRiskList.length > 0 ? highRiskList : employees.slice(0, 5),
        timestamp,
      };
    }

    // 3. Department Breakdown Query
    if (lower.includes("department") || lower.includes("dept") || lower.includes("highest risk department")) {
      const overviewRes = await api.analytics.getOverview().catch(() => null);
      const deptData = overviewRes?.data?.departmentRiskBreakdown || [];

      let deptTable = "| Department | Headcount | Avg Risk Probability | Risk Tier |\n| :--- | :---: | :---: | :---: |\n";
      deptData.forEach((d) => {
        deptTable += `| **${d.department}** | ${d.headcount} | **${(d.avgProbability * 100).toFixed(1)}%** | ${d.riskTier} |\n`;
      });

      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `### 🏢 Departmental Attrition Risk Overview\n\n` +
          deptTable +
          `\n💡 *Action Tip: Departments with >50% average risk probability should initiate emergency workload and manager feedback audits.*`,
        timestamp,
      };
    }

    // 4. Common Risk Factors Query
    if (lower.includes("factor") || lower.includes("common") || lower.includes("why people leave") || lower.includes("frequent")) {
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `### 📊 Most Frequent Workplace Risk Factors Across the Company\n\n` +
          `| Factor | Prevalence | Primary Driver | Recommended Intervention |\n` +
          `| :--- | :---: | :--- | :--- |\n` +
          `| **Poor Work-Life Balance** | **60%** | Excessive after-hours communication | Enforce strict weekend email blackout |\n` +
          `| **Low Job Satisfaction** | **58%** | Misaligned tasks / lack of autonomy | Conduct 1-on-1 role crafting interview |\n` +
          `| **Excessive Overtime** | **52%** | Surge deliverables without contractor buffers | Capacity rebalancing & comp time |\n` +
          `| **Low Manager Support** | **38%** | Absence of weekly coaching cadence | Implement mandatory skip-level check-ins |\n` +
          `| **Stagnant Promotion** | **35%** | >=3 years in role without advancement | Career roadmap with target milestones |\n`,
        timestamp,
      };
    }

    // 5. General Retention Blueprint / How to reduce attrition
    if (lower.includes("reduce") || lower.includes("prevent") || lower.includes("strategy") || lower.includes("blueprint") || lower.includes("retention")) {
      return {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `### 💡 Strategic HR Retention Blueprint\n\n` +
          `1. **Conduct Proactive Stay Interviews:** Interview high-impact employees before they initiate external applications.\n` +
          `2. **Enforce Overtime Limits:** Cap consecutive 50+ hour work weeks with automatic alert triggers.\n` +
          `3. **Transparent Career Ladders:** Clarify exact promotion milestones and review intervals.\n` +
          `4. **Manager Coaching Cadence:** Coach first-line supervisors to prioritize weekly unblocking 1-on-1s.\n` +
          `5. **Hybrid & Commute Flexibility:** Mitigate daily transit fatigue by allowing 2 days remote work where operationally feasible.`,
        timestamp,
      };
    }

    // Default Fallback
    return {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: `I'm here to assist with **Employee Retention & Properties Exploration**.\n\n` +
        `You can ask me:\n` +
        `• *"Inspect Employee 1001"* (Displays all 25 properties & retention plan)\n` +
        `• *"Which employees have high attrition risk?"*\n` +
        `• *"Department risk summary"*\n` +
        `• *"What are the most common risk factors?"*\n` +
        `• *"How can HR reduce employee attrition?"*`,
      timestamp,
      quickActions: [
        "🚨 High Risk Employees",
        "🏢 Department Breakdown",
        "📊 Top Risk Factors",
        "💡 HR Retention Blueprint",
      ],
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end p-2 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full sm:w-[500px] h-[92vh] sm:h-[720px] rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl overflow-hidden backdrop-blur-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/25">
              <Bot className="h-5 w-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-white">RetainIQ AI Advisor</h3>
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/20">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Natural Language Retention & Properties Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: "reset",
                    sender: "bot",
                    text: "Conversation cleared. Ready for your next query!",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    quickActions: ["🚨 High Risk Employees", "🏢 Department Breakdown", "📊 Top Risk Factors"],
                  },
                ]);
              }}
              title="Clear Chat"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              title="Close Chatbot"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Employee Selector Bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 text-xs">
          <User className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
          <span className="text-slate-400 text-[11px] font-semibold">Inspect Employee:</span>
          <select
            value={selectedEmpId}
            onChange={(e) => {
              setSelectedEmpId(e.target.value);
              handleSend(`Inspect Employee ${e.target.value}`);
            }}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                #{emp.id} - {emp.name} ({emp.department})
              </option>
            ))}
          </select>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl p-3.5 leading-relaxed shadow-md ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none font-medium"
                    : "bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none"
                }`}
              >
                {/* Text Content */}
                <div className="space-y-2 whitespace-pre-wrap">
                  {msg.text.split("\n\n").map((para, i) => (
                    <div key={i}>{formatMessageMarkdown(para)}</div>
                  ))}
                </div>

                {/* Render Full Employee Properties Card if attached */}
                {msg.employeeData && (
                  <EmployeePropertiesCard
                    employee={msg.employeeData}
                    onOpenDetailModal={() => {
                      if (onSelectEmployee) onSelectEmployee(msg.employeeData.id);
                    }}
                  />
                )}

                {/* Render Employee List Card if attached */}
                {msg.employeeList && (
                  <div className="mt-3 space-y-2">
                    {msg.employeeList.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => handleSend(`Inspect Employee ${emp.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 hover:border-indigo-500/50 hover:bg-slate-800/80 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-bold text-white text-xs">#{emp.id} - {emp.name}</p>
                          <p className="text-[10px] text-slate-400">{emp.department} • {emp.jobRole}</p>
                        </div>
                        <div className="text-right flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.latestPrediction?.riskTier === "HIGH" || emp.riskTier === "HIGH"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}>
                            {emp.latestPrediction?.riskTier || emp.riskTier || "HIGH"}
                          </span>
                          <ChevronRight className="h-3 w-3 text-slate-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>

              {/* Quick Actions / Prompt Pills */}
              {msg.quickActions && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {msg.quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(action)}
                      className="rounded-full border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1 text-[11px] text-indigo-300 transition-all font-medium"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl w-fit">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              <span>Analyzing organizational knowledge base...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80">
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
              className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white transition-all hover:scale-105 disabled:opacity-40 shadow-lg shadow-indigo-600/30"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

/**
 * 25-Property Inspector Card inside Chatbot Bubble
 */
function EmployeePropertiesCard({ employee, onOpenDetailModal }) {
  const [activeTab, setActiveTab] = useState("all");

  const latest = employee.latestPrediction;
  const riskTier = latest?.riskTier || employee.riskTier || "MEDIUM";
  const probability = latest?.probability ?? employee.probability ?? 0.45;

  const riskColor =
    riskTier === "HIGH"
      ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
      : riskTier === "MEDIUM"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

  return (
    <div className="mt-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3.5 text-xs">
      
      {/* Top Banner: Risk & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Predicted Attrition Risk</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskColor}`}>
              {riskTier} RISK ({formatPercent(probability)})
            </span>
          </div>
        </div>

        <button
          onClick={onOpenDetailModal}
          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
        >
          Open Full Modal
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto text-[11px]">
        {["all", "sentiment", "tenure", "compensation", "actions"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
              activeTab === tab
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Property Key-Value Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {/* Core & Demographics */}
        {(activeTab === "all" || activeTab === "tenure") && (
          <>
            <PropItem label="Employee ID" value={`#${employee.id}`} />
            <PropItem label="Department" value={employee.department} />
            <PropItem label="Job Role" value={employee.jobRole} />
            <PropItem label="Age & Gender" value={`${employee.age || 30} yrs • ${employee.gender || "N/A"}`} />
            <PropItem label="Years at Company" value={`${employee.yearsAtCompany} yrs`} />
            <PropItem label="Years in Current Role" value={`${employee.yearsInCurrentRole} yrs`} />
            <PropItem label="Years Since Promotion" value={`${employee.yearsSinceLastPromotion} yrs`} highlight={employee.yearsSinceLastPromotion >= 3} />
            <PropItem label="Years with Manager" value={`${employee.yearsWithCurrManager || employee.yearsWithCurrentManager || 2} yrs`} />
          </>
        )}

        {/* Compensation & Working Hours */}
        {(activeTab === "all" || activeTab === "compensation") && (
          <>
            <PropItem label="Monthly Salary" value={formatCurrency(employee.monthlyIncome || 5000)} highlight />
            <PropItem label="Job Level" value={`Level ${employee.jobLevel || 2} of 5`} />
            <PropItem label="Salary Hike %" value={`${employee.percentSalaryHike || 14}%`} />
            <PropItem label="OverTime Status" value={employee.overTime || "No"} highlight={employee.overTime === "Yes"} />
            <PropItem label="Commute Distance" value={`${employee.distanceFromHome || 10} km/miles`} />
            <PropItem label="Training Times" value={`${employee.trainingTimesLastYear || 2} sessions`} />
          </>
        )}

        {/* Sentiment & Satisfaction (1-4 scale) */}
        {(activeTab === "all" || activeTab === "sentiment") && (
          <>
            <PropRating label="Job Satisfaction" rating={employee.jobSatisfaction || 2} />
            <PropRating label="Work-Life Balance" rating={employee.workLifeBalance || 2} />
            <PropRating label="Environment Sat." rating={employee.environmentSatisfaction || 3} />
            <PropRating label="Relationship Sat." rating={employee.relationshipSatisfaction || 3} />
            <PropRating label="Performance Rating" rating={employee.performanceRating || 3} />
            <PropItem label="Business Travel" value={employee.businessTravel || "Travel_Rarely"} />
          </>
        )}
      </div>

      {/* Action Plan & Recommendations */}
      {(activeTab === "all" || activeTab === "actions") && (
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            AI Retention Action Plan:
          </span>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
            <p><strong>HR Priority:</strong> {latest?.retentionPlan?.recommendedActions?.[0] || "Schedule confidential stay interview; review salary parity and workload balance."}</p>
            <p><strong>Manager Focus:</strong> Conduct weekly 1-on-1 unblocking sessions; address project bottlenecks.</p>
            <p className="text-[10px] text-indigo-300"><strong>Review Timeline:</strong> 14-day check-in milestone.</p>
          </div>
        </div>
      )}

    </div>
  );
}

function PropItem({ label, value, highlight }) {
  return (
    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex flex-col">
      <span className="text-[10px] text-slate-500 font-medium">{label}</span>
      <span className={`font-semibold mt-0.5 truncate ${highlight ? "text-amber-300" : "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

function PropRating({ label, rating }) {
  const isLow = rating <= 2;
  return (
    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex flex-col">
      <span className="text-[10px] text-slate-500 font-medium">{label}</span>
      <div className="flex items-center gap-1 mt-0.5">
        <span className={`font-bold ${isLow ? "text-rose-400" : "text-emerald-400"}`}>
          {rating}/4
        </span>
        <div className="flex gap-0.5 ml-1">
          {[1, 2, 3, 4].map((star) => (
            <span
              key={star}
              className={`h-1.5 w-2.5 rounded-sm ${
                star <= rating
                  ? isLow
                    ? "bg-rose-500"
                    : "bg-emerald-500"
                  : "bg-slate-800"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Basic Markdown formatting converter
 */
function formatMessageMarkdown(content) {
  // If line starts with ###
  if (content.startsWith("### ")) {
    return <h4 className="text-xs font-bold text-indigo-300 mt-1">{content.replace("### ", "")}</h4>;
  }
  // Table detection
  if (content.includes("|")) {
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const headers = lines[0]?.split("|").map((h) => h.trim()).filter(Boolean);
    const rows = lines.slice(2).map((l) => l.split("|").map((c) => c.trim()).filter(Boolean));

    if (headers && headers.length > 0) {
      return (
        <div className="my-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} className="p-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/40">
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 text-slate-300">{cell.replace(/\*\*/g, "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  // Standard line with bold tags
  return <span>{content}</span>;
}
