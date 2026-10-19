/**
 * API Service for interacting with Node.js Backend API Gateway.
 * Includes URL normalization, cold-start auto-retry for free-tier hosting (Render),
 * and backend connectivity status dispatching.
 */

// Helper to normalize and resolve API Gateway base URL
function resolveApiBase() {
  // 1. Allow runtime override from localStorage (helpful for instant live testing)
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("retainiq_api_url");
    if (override && override.trim()) {
      return cleanApiUrl(override);
    }
  }

  // 2. Vite environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return cleanApiUrl(envUrl);
  }

  // 3. Localhost development fallback
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000/api/v1";
    }
  }

  // 4. Default production fallback (Render deployment)
  return "https://retainiq-backend.onrender.com/api/v1";
}

function cleanApiUrl(url) {
  let cleaned = url.trim().replace(/\/+$/, "");
  // Strip trailing /api/v1 or /api to prevent double-pathing (e.g. /api/v1/api/v1)
  cleaned = cleaned.replace(/\/api\/v1$/, "").replace(/\/api$/, "");
  return `${cleaned}/api/v1`;
}

export const API_BASE = resolveApiBase();

// Custom event notifier for UI components (ServerWarmupBanner, LoginModal, etc.)
export function notifyBackendStatus(status, details = {}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("retainiq:backend-status", {
        detail: { status, ...details, timestamp: Date.now() },
      })
    );
  }
}

function getAuthHeader() {
  const token = localStorage.getItem("attrition_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Resilient request wrapper with automatic retries for cold-start wakeups (502, 503, 504, Network Error)
 */
async function request(endpoint, options = {}, retries = 3, backoff = 2000) {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const controller = new AbortController();
      // 35s timeout for Render cold-starts
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle successful or client-side responses
      if (response.ok) {
        notifyBackendStatus("online", { url: API_BASE });
        return await response.json().catch(() => ({}));
      }

      // If server returns cold-start or gateway errors (502, 503, 504)
      if ([502, 503, 504].includes(response.status) && attempt <= retries) {
        notifyBackendStatus("waking_up", { attempt, maxRetries: retries, status: response.status });
        await new Promise((resolve) => setTimeout(resolve, backoff * attempt));
        continue;
      }

      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Request failed with status ${response.status}`);
    } catch (err) {
      const isNetworkError =
        err.name === "AbortError" ||
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("NetworkError");

      if (isNetworkError && attempt <= retries) {
        notifyBackendStatus("waking_up", { attempt, maxRetries: retries, reason: err.message });
        await new Promise((resolve) => setTimeout(resolve, backoff * attempt));
        continue;
      }

      // If all retries exhausted on cold start
      if (attempt > retries && isNetworkError) {
        notifyBackendStatus("offline", { reason: "Backend server is sleeping or unreachable." });
        throw new Error(
          "Cloud backend is waking up (Render free tier takes ~30-40s). Please wait a moment and try again."
        );
      }

      throw err;
    }
  }
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

  system: {
    getBaseUrl: () => API_BASE,
    setCustomBaseUrl: (url) => {
      if (url && url.trim()) {
        localStorage.setItem("retainiq_api_url", url.trim());
      } else {
        localStorage.removeItem("retainiq_api_url");
      }
      window.location.reload();
    },
    resetCustomBaseUrl: () => {
      localStorage.removeItem("retainiq_api_url");
      window.location.reload();
    },
    checkHealth: async () => {
      // Determine root URL from API_BASE
      const rootUrl = API_BASE.replace(/\/api\/v1$/, "");
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(`${rootUrl}/api/health`, {
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          notifyBackendStatus("online", { url: API_BASE, data });
          return { ok: true, data };
        }
        notifyBackendStatus("waking_up", { status: res.status });
        return { ok: false, status: res.status };
      } catch (err) {
        notifyBackendStatus("waking_up", { error: err.message });
        return { ok: false, error: err.message };
      }
    },
  },
};

