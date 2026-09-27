import React, { useState } from "react";
import { X, Plus, UserPlus, Zap } from "lucide-react";
import { api } from "../services/api";

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    employeeNumber: Math.floor(1000 + Math.random() * 9000),
    firstName: "",
    lastName: "",
    email: "",
    age: 32,
    gender: "Male",
    maritalStatus: "Single",
    department: "Sales",
    jobRole: "Sales Executive",
    jobLevel: 2,
    businessTravel: "Travel_Rarely",
    monthlyIncome: 5500,
    dailyRate: 800,
    hourlyRate: 65,
    monthlyRate: 15000,
    percentSalaryHike: 14,
    stockOptionLevel: 1,
    totalWorkingYears: 8,
    yearsAtCompany: 4,
    yearsInCurrentRole: 2,
    yearsSinceLastPromotion: 1,
    yearsWithCurrManager: 2,
    numCompaniesWorked: 2,
    distanceFromHome: 10,
    environmentSatisfaction: 3,
    jobSatisfaction: 3,
    jobInvolvement: 3,
    relationshipSatisfaction: 3,
    workLifeBalance: 3,
    education: 3,
    educationField: "Life Sciences",
    performanceRating: 3,
    trainingTimesLastYear: 2,
    overTime: "No",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.employees.create(formData);
      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 my-8">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Enroll New Employee</h3>
            <p className="text-xs text-slate-400">Creates profile and automatically runs ML attrition risk assessment</p>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">First Name</label>
              <input
                required
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Last Name</label>
              <input
                required
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Age */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-slate-400 mb-1">Work Email</label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Department & Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Sales">Sales</option>
                <option value="Research & Development">Research & Development</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Job Role</label>
              <select
                name="jobRole"
                value={formData.jobRole}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Sales Executive">Sales Executive</option>
                <option value="Sales Representative">Sales Representative</option>
                <option value="Research Scientist">Research Scientist</option>
                <option value="Laboratory Technician">Laboratory Technician</option>
                <option value="Manufacturing Director">Manufacturing Director</option>
                <option value="Manager">Manager</option>
                <option value="Healthcare Representative">Healthcare Representative</option>
              </select>
            </div>
          </div>

          {/* Monthly Income & OverTime */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Monthly Salary ($)</label>
              <input
                type="number"
                name="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Mandatory OverTime</label>
              <select
                name="overTime"
                value={formData.overTime}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Years at Company</label>
              <input
                type="number"
                name="yearsAtCompany"
                value={formData.yearsAtCompany}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Satisfaction Gauges */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1">Job Satisfaction (1-4)</label>
              <input
                type="number"
                min="1"
                max="4"
                name="jobSatisfaction"
                value={formData.jobSatisfaction}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Env Satisfaction (1-4)</label>
              <input
                type="number"
                min="1"
                max="4"
                name="environmentSatisfaction"
                value={formData.environmentSatisfaction}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Work-Life Balance (1-4)</label>
              <input
                type="number"
                min="1"
                max="4"
                name="workLifeBalance"
                value={formData.workLifeBalance}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              <Zap className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Enrolling & Scoring..." : "Enroll & Score Risk"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
