import React from "react";

export const runtime = "nodejs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0f", color: "#eaeaf2" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900 }}>SafeReport Admin</div>
        <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
          <a href="/admin" style={{ color: "#b7f0ff" }}>/admin</a>
          <a href="/admin/partners" style={{ color: "#b7f0ff" }}>/partners</a>
          <a href="/admin/tenants" style={{ color: "#b7f0ff" }}>/tenants</a>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}