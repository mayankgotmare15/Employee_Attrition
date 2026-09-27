import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { PieChart, BarChart3 } from "lucide-react";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function ChartsSection({ overview }) {
  if (!overview) return null;

  const { riskDistribution, departmentBreakdown } = overview;
  const high = riskDistribution?.high?.count || 0;
  const medium = riskDistribution?.medium?.count || 0;
  const low = riskDistribution?.low?.count || 0;

  // Doughnut Chart Data
  const doughnutData = {
    labels: ["High Risk (>70%)", "Medium Risk (40-70%)", "Low Risk (<40%)"],
    datasets: [
      {
        data: [high, medium, low],
        backgroundColor: [
          "rgba(244, 63, 94, 0.85)",   // Rose
          "rgba(245, 158, 11, 0.85)",  // Amber
          "rgba(16, 185, 129, 0.85)",  // Emerald
        ],
        borderColor: [
          "rgba(244, 63, 94, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(16, 185, 129, 1)",
        ],
        borderWidth: 1.5,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "74%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#94a3b8",
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
  };

  // Department Bar Chart Data
  const deptLabels = (departmentBreakdown || []).map((d) => d.department);
  const deptAvgRisk = (departmentBreakdown || []).map((d) => Math.round(d.avgRiskProbability * 100));

  const barData = {
    labels: deptLabels.length > 0 ? deptLabels : ["Sales", "R&D", "Human Resources"],
    datasets: [
      {
        label: "Avg Attrition Risk (%)",
        data: deptAvgRisk.length > 0 ? deptAvgRisk : [65, 25, 40],
        backgroundColor: "rgba(99, 102, 241, 0.65)",
        borderColor: "rgba(129, 140, 248, 1)",
        borderWidth: 1.5,
        borderRadius: 8,
        hoverBackgroundColor: "rgba(129, 140, 248, 0.85)",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (item) => `Avg Risk: ${item.raw}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: {
          color: "#94a3b8",
          font: { size: 11 },
          callback: (val) => `${val}%`,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      
      {/* Risk Distribution Donut */}
      <div className="glass-panel rounded-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <PieChart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Workforce Risk Distribution</h3>
              <p className="text-xs text-slate-400">Categorized by PRD FR-3 Calibration Tiers</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400">PRD FR-3</span>
        </div>

        <div className="relative mt-4 h-64 flex items-center justify-center">
          <Doughnut data={doughnutData} options={doughnutOptions} />
          {/* Centered Total Indicator */}
          <div className="absolute flex flex-col items-center pointer-events-none pb-8">
            <span className="text-2xl font-black text-white">{high + medium + low}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Employees</span>
          </div>
        </div>
      </div>

      {/* Department Risk Comparison Bar */}
      <div className="glass-panel rounded-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Department Attrition Vulnerability</h3>
              <p className="text-xs text-slate-400">Average predicted probability across business units</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-indigo-400">Real-time Model</span>
        </div>

        <div className="mt-4 h-64">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

    </div>
  );
}
