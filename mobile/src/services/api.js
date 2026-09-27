/**
 * Mobile API Service Client.
 * Connects React Native client to Phase 2 Node.js API Gateway.
 */
import { Platform } from 'react-native';

// Android Emulator uses 10.0.2.2 to access host localhost; iOS simulator / web uses localhost
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE = `http://${HOST}:5000/api/v1`;

let authToken = null;
let currentUser = null;

export const authStorage = {
  setToken: (token, user) => {
    authToken = token;
    currentUser = user;
  },
  getToken: () => authToken,
  getUser: () => currentUser,
  clear: () => {
    authToken = null;
    currentUser = null;
  },
};

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (err) {
    console.warn(`[Mobile API Error]: ${endpoint}`, err.message);
    throw err;
  }
}

export const mobileApi = {
  auth: {
    login: async (email, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.token) {
        authStorage.setToken(data.token, data.user);
      }
      return data;
    },
    getMe: () => request('/auth/me'),
    logout: () => authStorage.clear(),
  },

  analytics: {
    getOverview: () => request('/analytics/overview'),
    getDriftStatus: () => request('/analytics/drift-status'),
  },

  employees: {
    getAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/employees?${q}`);
    },
    getById: (id) => request(`/employees/${id}`),
  },

  predictions: {
    predict: (employeeId) =>
      request(`/predictions/predict/${employeeId}`, {
        method: 'POST',
      }),
    getHistory: (employeeId) => request(`/predictions/history/${employeeId}`),
  },
};
