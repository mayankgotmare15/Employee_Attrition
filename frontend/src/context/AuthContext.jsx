import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const SEEDED_ACCOUNTS = [
  { role: "HR_ANALYST", label: "HR Analyst (Mayank)", email: "hranalyst@company.com" },
  { role: "HR_MANAGER", label: "HR Manager (Pooja)", email: "hrmanager@company.com" },
  { role: "DEPT_MANAGER", label: "Sales Dept Manager (Pranav)", email: "deptmanager@company.com" },
  { role: "ADMIN", label: "System Admin", email: "admin@company.com" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(api.auth.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      const token = localStorage.getItem("attrition_token");
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          }
        } catch (err) {
          console.warn("Session expired or invalid, logging out");
          api.auth.logout();
          setUser(null);
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  const quickSwitchUser = async (email) => {
    return await login(email, "Password@123");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        quickSwitchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
