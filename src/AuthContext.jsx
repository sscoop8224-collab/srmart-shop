// src/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const ROLES = {
  STAFF: "staff",
  MANAGER: "manager",
  OWNER: "owner",
};

// 기존 App.js의 grade/email 방식을 role로 변환
export function getUserRole(user) {
  if (!user) return null;
  if (user.role) return user.role; // 이미 role이 있으면 그대로
  if (user.email === "admin@srmart.com") return "owner";
  if (user.grade === "관리자") return "manager";
  return "staff";
}

export const ROLE_PERMISSIONS = {
  staff: ["pos", "products.view", "receipt", "schedule.own", "kakaopay"],
  manager: [
    "pos", "products.view", "products.edit", "inventory",
    "sales.daily", "discount", "order", "receipt", "schedule.own", "kakaopay",
  ],
  owner: [
    "pos", "products.view", "products.edit", "inventory",
    "sales.daily", "sales.all", "discount", "order", "receipt",
    "schedule.own", "schedule.all", "kakaopay",
    "users.manage", "roles.manage", "settings", "payroll",
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("srmart_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (userData) => {
    const enriched = { ...userData, role: getUserRole(userData) };
    setUser(enriched);
    localStorage.setItem("srmart_user", JSON.stringify(enriched));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("srmart_user");
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const role = getUserRole(user);
    return (ROLE_PERMISSIONS[role] || []).includes(permission);
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    const hierarchy = [ROLES.STAFF, ROLES.MANAGER, ROLES.OWNER];
    const userLevel = hierarchy.indexOf(getUserRole(user));
    const requiredLevel = hierarchy.indexOf(requiredRole);
    return userLevel >= requiredLevel;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}