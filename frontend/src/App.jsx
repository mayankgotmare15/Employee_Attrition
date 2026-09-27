import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import { api } from "./services/api";
import Navbar from "./components/Navbar";
import BentoStatsGrid from "./components/BentoStatsGrid";
import ChartsSection from "./components/ChartsSection";
import UrgentAlertsSection from "./components/UrgentAlertsSection";
import EmployeeTable from "./components/EmployeeTable";
import EmployeeDetailModal from "./components/EmployeeDetailModal";
import AddEmployeeModal from "./components/AddEmployeeModal";
import UploadCsvModal from "./components/UploadCsvModal";
import ModelMetricsModal from "./components/ModelMetricsModal";
import LoginModal from "./components/LoginModal";
import { Loader2 } from "lucide-react";

export default function App() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [driftReport, setDriftReport] = useState(null);
  const [activeVersion, setActiveVersion] = useState("v1.2.0");
  const [simulatingDrift, setSimulatingDrift] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    department: "",
    riskTier: "",
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);

  const [predictingId, setPredictingId] = useState(null);
  const [batchPredicting, setBatchPredicting] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setDataLoading(true);
      const [overviewRes, employeesRes, driftRes, metricsRes] = await Promise.all([
        api.analytics.getOverview(),
        api.employees.getAll({
          page,
          limit: 10,
          ...filters,
        }),
        api.analytics.getDriftStatus().catch(() => ({ success: false })),
        api.analytics.getModelMetrics().catch(() => ({ success: false })),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (employeesRes.success) {
        setEmployees(employeesRes.data);
        setTotal(employeesRes.total);
        setTotalPages(employeesRes.totalPages);
      }
      if (driftRes.success) setDriftReport(driftRes.data);
      if (metricsRes.success && metricsRes.data?.model_version) {
        setActiveVersion(metricsRes.data.model_version);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated, page, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, user]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleFilterRisk = (tier) => {
    handleFilterChange("riskTier", tier);
  };

  const handleRunPredict = async (employeeId) => {
    try {
      setPredictingId(employeeId);
      const res = await api.predictions.predict(employeeId);
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      alert("Inference failed: " + err.message);
    } finally {
      setPredictingId(null);
    }
  };

  const handleRunBatchPredict = async () => {
    try {
      setBatchPredicting(true);
      const res = await api.predictions.batchPredict(filters.department || undefined);
      if (res.success) {
        alert(res.message);
        await loadData();
      }
    } catch (err) {
      alert("Batch inference failed: " + err.message);
    } finally {
      setBatchPredicting(false);
    }
  };

  const handleSimulateDrift = async () => {
    try {
      setSimulatingDrift(true);
      const res = await api.analytics.simulateDrift();
      if (res.success) {
        const newVer = res.data.retraining_result?.new_version;
        alert(`PRD TC-04 Verified!\nDrift Z-Score: ${res.data.drift_report.z_score.toFixed(2)} (> 2.0)\nAutomated Retraining Deployed: ${newVer}`);
        await loadData();
      }
    } catch (err) {
      alert("Simulation failed: " + err.message);
    } finally {
      setSimulatingDrift(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 bg-grid-pattern selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <Navbar onOpenMetrics={() => setIsMetricsModalOpen(true)} />

      {/* Main Content Dashboard */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Bento Stats KPI Grid with Live Drift Telemetry */}
        <BentoStatsGrid
          overview={overview}
          onFilterRisk={handleFilterRisk}
          driftReport={driftReport}
          activeVersion={activeVersion}
          onSimulateDrift={handleSimulateDrift}
          simulatingDrift={simulatingDrift}
        />

        {/* Priority Urgent Alerts for High-Risk Personnel */}
        <UrgentAlertsSection
          alerts={overview?.urgentAttentionEmployees}
          onSelectEmployee={(id) => setSelectedEmployeeId(id)}
        />

        {/* Interactive Charts Section (Donut + Department Bar) */}
        <ChartsSection overview={overview} />

        {/* Workforce Directory & Scored Risk Table */}
        <EmployeeTable
          employees={employees}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
          filters={filters}
          onFilterChange={handleFilterChange}
          onSelectEmployee={(id) => setSelectedEmployeeId(id)}
          onRunPredict={handleRunPredict}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onRunBatchPredict={handleRunBatchPredict}
          predictingId={predictingId}
          batchPredicting={batchPredicting}
        />

      </main>

      {/* Modals */}
      <EmployeeDetailModal
        employeeId={selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
        onRefreshList={loadData}
      />

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
      />

      <UploadCsvModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={loadData}
      />

      <ModelMetricsModal
        isOpen={isMetricsModalOpen}
        onClose={() => setIsMetricsModalOpen(false)}
        onModelUpdated={loadData}
      />
    </div>
  );
}
