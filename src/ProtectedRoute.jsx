// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// requiredRole: 최소 필요 등급 ("staff" | "manager" | "owner")
// requiredPermission: 특정 기능 권한 문자열 (선택)
export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
}) {
  const { user, hasRole, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}