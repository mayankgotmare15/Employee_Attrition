import React from "react";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Bot,
  FileText,
  Settings,
  Sparkles,
  X,
  Shield,
  Activity,
} from "lucide-react";

export default function Sidebar({
  activeTab = "dashboard",
  onSelectTab,
  highRiskCount = 2,
  isOpen = false,
  onClose,
  onOpenChatbot,
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "workforce", label: "Workforce", icon: Users },
    {
      id: "risk-alerts",
      label: "Risk Alerts",
      icon: ShieldAlert,
      badge: highRiskCount > 0 ? highRiskCount : null,
      badgeColor: "bg-rose-500 text-white",
    },
    { id: "ai-advisor", label: "AI Advisor", icon: Bot, isAdvisor: true },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleItemClick = (item) => {
    if (item.isAdvisor && onOpenChatbot) {
      onOpenChatbot();
    } else if (onSelectTab) {
      onSelectTab(item.id);
    }
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-[#1a233d] bg-[#0c1527] text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#18233d]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6366f1] via-[#8b5cf6] to-[#ec4899] shadow-lg shadow-indigo-500/25">
                <Shield className="h-5 w-5 text-white" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-white leading-tight">
                  RetainIQ
                </h1>
                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                  Employee Attrition &amp; Retention Intelligence
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-indigo-600/25"
                      : "text-slate-300 hover:bg-[#131e36] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                        item.badgeColor || "bg-rose-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Promo Card (Matches Screenshot!) */}
        <div className="p-4">
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-[#121b36] via-[#0f172f] to-[#1e1b4b] p-4 shadow-xl">
            {/* Ambient Star / Wave Effect */}
            <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
            <div className="relative z-10 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-white tracking-tight leading-snug">
                  Smarter People Decisions
                </p>
                <p className="text-[11px] text-indigo-300 font-medium mt-0.5">
                  Better Tomorrow
                </p>
              </div>
            </div>

            {/* Glowing Accent Curve */}
            <div className="mt-3 h-1 w-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60" />
          </div>
        </div>
      </aside>
    </>
  );
}
