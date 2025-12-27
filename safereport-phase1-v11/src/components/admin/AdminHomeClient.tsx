"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminKeyGate from "./AdminKeyGate";

type ReportRow = {
  id: string;
  tenantId: string;
  status: string;
  subject: string | null;
  category: string | null;
  createdAt: string;
  lastViewedAt: string | null;
};

function fmt(dt?: string | null) {
  if (!dt) return "-";
  try { return new Date(dt).toLocaleString(); } catch (_) { return dt; }
}

export default function AdminHomeClient() {
  return (
    /* Passing children as an explicit prop to resolve TypeScript's missing children error */
    <AdminKeyGate children={(key: string) => <ReportsView adminKey={key} />} />
  );
}

function ReportsView({ adminKey }: { adminKey: string }) {
  const [items, setItems] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const headers = useMemo(() => ({ "x-admin-key": adminKey }), [adminKey]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/reports?limit=50", { headers });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "failed");
      setItems(j.items || []);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [adminKey]);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Reports</div>
        <button
          onClick={load}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.06)",
            color: "#eaeaf2",
            cursor: "pointer"
          }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err && <div style={{ marginTop: 10, color: "#ffb4b4", fontSize: 13 }}>Error: {err}</div>}

      <div style={{ marginTop: 12, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.4fr 0.8fr 1.2fr 1.2fr 1.2fr", gap: 0, padding: "10px 12px", background: "rgba(255,255,255,0.06)", fontSize: 12, opacity: 0.9 }}>
          <div>Report</div>
          <div>Status</div>
          <div>Category</div>
          <div>Created</div>
          <div>Last viewed</div>
        </div>

        {items.length === 0 && (
          <div style={{ padding: 14, fontSize: 13, opacity: 0.8 }}>No reports yet.</div>
        )}

        {items.map((r) => (
          <a
            key={r.id}
            href={`/admin/reports/${r.id}`}
            style={{
              display: "grid",
              gridTemplateColumns: "2.4fr 0.8fr 1.2fr 1.2fr 1.2fr",
              gap: 0,
              padding: "12px 12px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              textDecoration: "none",
              color: "#eaeaf2"
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.subject || "(no subject)"} <span style={{ opacity: 0.6, fontWeight: 500 }}>— {r.id.slice(0, 8)}</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{r.status}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{r.category || "-"}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{fmt(r.createdAt)}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{fmt(r.lastViewedAt)}</div>
          </a>
        ))}
      </div>
    </div>
  );
}