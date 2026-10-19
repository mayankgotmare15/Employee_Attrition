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
  const high = overview?.riskDistribution?.high?.count ?? 2;
  const medium = overview?.riskDistribution?.medium?.count ?? 1;
  const low = overview?.riskDistribution?.low?.count ?? 0;
  const total = high + medium + low || 3;

  const highPct = ((high / total) * 100).toFixed(1);
  const medPct = ((medium / total) * 100).toFixed(1);
  const lowPct = ((low / total) * 100).toFixed(1);

  // Doughnut Chart Data (Matches Screenshot!)
  const doughnutData = {
    labels: ["High Risk (>70%)", "Medium Risk (40-70%)", "Low Risk (<40%)"],
    datasets: [
      {
        data: [high, medium, low],
        backgroundColor: [
          "#f43f5e", // Rose-500
          "#f59e0b", // Amber-500
          "#10b981", // Emerald-500
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  // Department Bar Chart Data
  const deptData = overview?.departmentBreakdown || [
    { department: "Sales", avgRiskProbability: 0.92 },
    { department: "Customer Support", avgRiskProbability: 0.65 },
    { department: "Research & Development", avgRiskProbability: 0.35 },
  ];

  const barData = {
    labels: deptData.map((d) => d.department),
    datasets: [
      {
        label: "Avg Risk %",
        data: deptData.map((d) => Math.round(d.avgRiskProbability * 100)),
        backgroundColor: "#6366f1",
        borderRadius: 8,
        hoverBackgroundColor: "#4f46e5",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (item) => `Avg Risk: ${item.raw}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 11, weight: "500" } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#64748b",
          font: { size: 11 },
          callback: (val) => `${val}%`,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      
      {/* 1. Workforce Risk Distribution Donut */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <PieChart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Workforce Risk Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Categorized by PRD FR-3 Calibration Tiers
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-600">
            PRD FR-3
          </span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Doughnut Canvas with Centered Count */}
          <div className="relative h-48 w-48 flex-shrink-0 flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 leading-none">
                {total}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                Employees
              </span>
            </div>
          </div>

          {/* Custom Legend (Matches Screenshot!) */}
          <div className="w-full sm:flex-1 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500 flex-shrink-0" />
                <span className="font-medium text-slate-700">High Risk (&gt;70%)</span>
              </div>
              <span className="font-bold text-slate-900">{high} ({highPct}%)</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="font-medium text-slate-700">Medium Risk (40–70%)</span>
              </div>
              <span className="font-bold text-slate-900">{medium} ({medPct}%)</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="font-medium text-slate-700">Low Risk (&lt;40%)</span>
              </div>
              <span className="font-bold text-slate-900">{low} ({lowPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Department Attrition Vulnerability Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Department Attrition Vulnerability
              </h3>
              <p className="text-xs text-slate-500">
                Average predicted probability across business units
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 h-48 w-full">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

    </div>
  );
}
