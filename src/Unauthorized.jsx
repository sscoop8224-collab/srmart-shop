// src/pages/Unauthorized.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <p style={{ fontSize: "48px", marginBottom: "1rem" }}>🔒</p>
      <h2>접근 권한이 없습니다</h2>
      <p style={{ color: "#666", marginTop: "0.5rem" }}>
        현재 등급: <strong>{user?.role === "owner" ? "대표자" : user?.role === "manager" ? "매장관리자" : "직원"}</strong>
      </p>
      <p style={{ color: "#999", fontSize: "14px" }}>
        이 페이지에 접근하려면 관리자에게 권한을 요청하세요.
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginTop: "1.5rem",
          padding: "10px 24px",
          background: "#534AB7",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        이전 페이지로
      </button>
    </div>
  );
}