import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { api } from "./services/api";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import BentoStatsGrid from "./components/BentoStatsGrid";
import UrgentAlertsSection from "./components/UrgentAlertsSection";
import ChartsSection from "./components/ChartsSection";
import EmployeeTable from "./components/EmployeeTable";
import ChatbotAdvisor from "./components/ChatbotAdvisor";
import EmployeeDetailModal from "./components/EmployeeDetailModal";
import AddEmployeeModal from "./components/AddEmployeeModal";
import UploadCsvModal from "./components/UploadCsvModal";
import ModelMetricsModal from "./components/ModelMetricsModal";
import LoginModal from "./components/LoginModal";
import ServerWarmupBanner from "./components/ServerWarmupBanner";
import { Loader2, Bot } from "lucide-react";

export default function App() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [driftReport, setDriftReport] = useState(null);
  const [activeChampion, setActiveChampion] = useState("LogisticRegression");
  const [rocAuc, setRocAuc] = useState(0.898);

  const [filters, setFilters] = useState({
    search: "",
    department: "",
    riskTier: "",
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isChatbotModalOpen, setIsChatbotModalOpen] = useState(false);

  const [predictingId, setPredictingId] = useState(null);
  const [batchPredicting, setBatchPredicting] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const alertsSectionRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setDataLoading(true);
      const [overviewRes, employeesRes, driftRes, metricsRes] = await Promise.all([
        api.analytics.getOverview().catch(() => ({ success: false })),
        api.employees.getAll({
          page,
          limit: 10,
          ...filters,
        }).catch(() => ({ success: false })),
        api.analytics.getDriftStatus().catch(() => ({ success: false })),
        api.analytics.getModelMetrics().catch(() => ({ success: false })),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (employeesRes.success && employeesRes.data) {
        setEmployees(employeesRes.data);
        setTotal(employeesRes.total || employeesRes.data.length);
        setTotalPages(employeesRes.totalPages || 1);
      }
      if (driftRes.success && driftRes.data) {
        setDriftReport(driftRes.data);
      }
      if (metricsRes.success && metricsRes.data) {
        if (metricsRes.data.model_name) setActiveChampion(metricsRes.data.model_name);
        if (metricsRes.data.test_roc_auc) setRocAuc(metricsRes.data.test_roc_auc);
      }
    } catch (err) {
      console.warn("RetainIQ Dashboard loaded with offline baseline:", err);
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

  const scrollToAlerts = () => {
    alertsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRunPredict = async (employeeId) => {
    try {
      setPredictingId(employeeId);
      const res = await api.predictions.predict(employeeId);
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      alert("Inference notice: " + err.message);
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
      alert("Batch inference notice: " + err.message);
    } finally {
      setBatchPredicting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0c1527] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <ServerWarmupBanner />
        <LoginModal />
      </>
    );
  }

  const highRiskCount = overview?.riskDistribution?.high?.count ?? 2;

  return (
    <div className="flex min-h-screen bg-[#f3f6fc] text-slate-800">
      <ServerWarmupBanner />

      {/* Left Sidebar (Desktop Fixed & Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === "risk-alerts") scrollToAlerts();
        }}
        highRiskCount={highRiskCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenChatbot={() => setIsChatbotModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Header Bar */}
        <Navbar
          onOpenMetrics={() => setIsMetricsModalOpen(true)}
          onOpenChatbot={() => setIsChatbotModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeChampion={activeChampion}
          rocAuc={rocAuc}
        />

        {/* Dashboard Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Row 1: KPI Stat Cards */}
          <BentoStatsGrid
            overview={overview}
            onFilterRisk={handleFilterRisk}
            onScrollToAlerts={scrollToAlerts}
          />

          {/* Row 2: Priority Retention Alerts */}
          <div ref={alertsSectionRef}>
            <UrgentAlertsSection
              alerts={overview?.urgentAttentionEmployees}
              onSelectEmployee={(id) => setSelectedEmployeeId(id)}
            />
          </div>

          {/* Row 3: Charts Section (Donut + Department Bar) */}
          <ChartsSection overview={overview} />

          {/* Row 4: Workforce Directory & RetainIQ AI Advisor (Side-by-Side on Desktop, Stacked on Mobile!) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Workforce Directory (7 cols on desktop) */}
            <div className="lg:col-span-7 w-full">
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
            </div>

            {/* RetainIQ AI Advisor (5 cols on desktop, matches screenshot!) */}
            <div className="lg:col-span-5 w-full">
              <ChatbotAdvisor
                isEmbedded={true}
                onSelectEmployee={(id) => setSelectedEmployeeId(id)}
              />
            </div>
          </div>

        </main>
      </div>

      {/* Floating AI Advisor Launch Button (for quick access / mobile) */}
      <button
        onClick={() => setIsChatbotModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-3 sm:px-4 sm:py-3 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all group lg:hidden"
        title="Open RetainIQ AI Advisor"
      >
        <Bot className="h-5 w-5 text-white animate-pulse" />
        <span className="text-xs font-bold tracking-wide">AI Advisor</span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
      </button>

      {/* Full Floating / Drawer Modal for AI Advisor (when opened on mobile or via button) */}
      <ChatbotAdvisor
        isOpen={isChatbotModalOpen}
        onClose={() => setIsChatbotModalOpen(false)}
        onSelectEmployee={(id) => setSelectedEmployeeId(id)}
      />

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
