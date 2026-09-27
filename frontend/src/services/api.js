/**
 * API Service for interacting with Node.js Backend API Gateway.
 */
const RAW_API_URL = import.meta.env.VITE_API_URL || "";
const API_BASE = RAW_API_URL
  ? `${RAW_API_URL.replace(/\/$/, "")}/api/v1`
  : typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ? "http://localhost:5000/api/v1"
  : "/api/v1";


function getAuthHeader() {
  const token = localStorage.getItem("attrition_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  auth: {
    login: async (email, password) => {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.token) {
        localStorage.setItem("attrition_token", data.token);
        localStorage.setItem("attrition_user", JSON.stringify(data.user));
      }
      return data;
    },
    getMe: () => request("/auth/me"),
    logout: () => {
      localStorage.removeItem("attrition_token");
      localStorage.removeItem("attrition_user");
    },
    getCurrentUser: () => {
      const u = localStorage.getItem("attrition_user");
      return u ? JSON.parse(u) : null;
    },
  },

  analytics: {
    getOverview: () => request("/analytics/overview"),
    getModelMetrics: () => request("/analytics/model-metrics"),
    getDriftStatus: () => request("/analytics/drift-status"),
    simulateDrift: () =>
      request("/analytics/simulate-drift", {
        method: "POST",
      }),
    triggerRetrain: () =>
      request("/analytics/trigger-retrain", {
        method: "POST",
      }),
  },

  employees: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/employees?${query}`);
    },
    getById: (id) => request(`/employees/${id}`),
    create: (data) =>
      request("/employees", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/employees/${id}`, {
        method: "DELETE",
      }),
    uploadCSV: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("attrition_token");

      const res = await fetch(`${API_BASE}/employees/upload-csv`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "CSV upload failed");
      return data;
    },
    downloadSampleCSV: () => {
      window.open(`${API_BASE}/employees/sample-csv`, "_blank");
    },
  },


  predictions: {
    predict: (employeeId) =>
      request(`/predictions/predict/${employeeId}`, {
        method: "POST",
      }),
    getHistory: (employeeId) => request(`/predictions/history/${employeeId}`),
    batchPredict: (department) =>
      request("/predictions/batch-predict", {
        method: "POST",
        body: JSON.stringify({ department }),
      }),
  },
};
