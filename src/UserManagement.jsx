// src/components/admin/UserManagement.jsx
import { useState, useEffect } from "react";
import { useAuth, ROLES } from "./AuthContext";

const ROLE_LABELS = {
  staff: "직원",
  manager: "매장관리자",
  owner: "대표자",
};

const ROLE_COLORS = {
  staff: "#854F0B",
  manager: "#0F6E56",
  owner: "#534AB7",
};

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // 실제 연결 시 API로 교체: fetch("/api/users")
    const stored = JSON.parse(localStorage.getItem("srmart_users") || "[]");
    setUsers(stored);
  }, []);

  const updateRole = (targetId, newRole) => {
    // 대표자 자신의 등급은 변경 불가
    if (targetId === user.id) {
      alert("본인의 등급은 변경할 수 없습니다.");
      return;
    }
    const updated = users.map((u) =>
      u.id === targetId ? { ...u, role: newRole } : u
    );
    setUsers(updated);
    localStorage.setItem("srmart_users", JSON.stringify(updated));
    // 실제 DB 연결 시: fetch(`/api/users/${targetId}/role`, { method: "PATCH", body: JSON.stringify({ role: newRole }) })
    alert(`권한이 [${ROLE_LABELS[newRole]}]으로 변경되었습니다.`);
  };

  const deleteUser = (targetId) => {
    if (targetId === user.id) {
      alert("본인 계정은 삭제할 수 없습니다.");
      return;
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const updated = users.filter((u) => u.id !== targetId);
    setUsers(updated);
    localStorage.setItem("srmart_users", JSON.stringify(updated));
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1.5rem" }}>직원 권한 관리</h2>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #eee", textAlign: "left" }}>
            <th style={{ padding: "10px 12px", color: "#666" }}>이름</th>
            <th style={{ padding: "10px 12px", color: "#666" }}>이메일</th>
            <th style={{ padding: "10px 12px", color: "#666" }}>현재 등급</th>
            <th style={{ padding: "10px 12px", color: "#666" }}>등급 변경</th>
            <th style={{ padding: "10px 12px", color: "#666" }}>관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
              <td style={{ padding: "12px" }}>{u.name}</td>
              <td style={{ padding: "12px", color: "#666" }}>{u.email}</td>
              <td style={{ padding: "12px" }}>
                <span style={{
                  background: ROLE_COLORS[u.role] + "20",
                  color: ROLE_COLORS[u.role],
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 500,
                }}>
                  {ROLE_LABELS[u.role]}
                </span>
              </td>
              <td style={{ padding: "12px" }}>
                <select
                  defaultValue={u.role}
                  disabled={u.id === user.id}
                  onChange={(e) => updateRole(u.id, e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "13px" }}
                >
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "12px" }}>
                {u.id !== user.id && (
                  <button
                    onClick={() => deleteUser(u.id)}
                    style={{
                      background: "none",
                      border: "1px solid #fca5a5",
                      color: "#ef4444",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    삭제
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <p style={{ textAlign: "center", color: "#999", marginTop: "2rem" }}>
          등록된 직원이 없습니다.
        </p>
      )}
    </div>
  );
}