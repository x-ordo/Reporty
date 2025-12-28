"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminKeyGate from "./AdminKeyGate";

type Report = {
  id: string;
  tenantId: string;
  status: string;
  subject: string | null;
  category: string | null;
  createdAt: string;
  lastViewedAt: string | null;
};

type Pack = {
  id: string;
  status: string;
  reasonCode: string | null;
  htmlKey: string;
  pdfPath: string | null;
  verifyOk: boolean;
  storedHead: string;
  computedHead: string;
  eventsCount: number;
  signature: string;
  generatedAt: string | null;
  createdAt: string;
};

function fmt(dt?: string | null) {
  if (!dt) return "-";
  try { return new Date(dt).toLocaleString(); } catch (_) { return dt; }
}

export default function AdminReportClient({ reportId }: { reportId: string }) {
  return (
    /* Passing children as an explicit prop to resolve TypeScript's missing children error */
    <AdminKeyGate children={(key: string) => <ReportView adminKey={key} reportId={reportId} />} />
  );
}

function ReportView({ adminKey, reportId }: { adminKey: string; reportId: string }) {
  const headers = useMemo(() => ({ "x-admin-key": adminKey }), [adminKey]);
  const [report, setReport] = useState<Report | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [reason, setReason] = useState("audit");

const pendingPack = useMemo(() => {
  return packs.some((p) => p.status === "queued" || p.status === "generating");
}, [packs]);

const canRetry = useMemo(() => {
  const latest = packs[0];
  return !!latest && latest.status === "failed" && !pendingPack;
}, [packs, pendingPack]);


  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const [rRes, pRes] = await Promise.all([
        fetch(`/api/admin/reports/${reportId}`, { headers }),
        fetch(`/api/admin/reports/${reportId}/packs`, { headers })
      ]);

      const rj = await rRes.json();
      if (!rRes.ok) throw new Error(rj?.error || "report_load_failed");
      setReport(rj.report);

      const pj = await pRes.json();
      if (!pRes.ok) throw new Error(pj?.error || "packs_load_failed");
      setPacks(pj.packs || []);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [adminKey, reportId]);

  async function enqueuePack(reasonOverride?: string) {
    setErr(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/pdf`, {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ reason: reasonOverride ?? reason })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "pdf_enqueue_failed");
      await loadAll();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  async function generatePack() {
    return enqueuePack();
  }

  async function retryPack() {
    const base = (reason || "audit").trim();
    const next = base.endsWith(":retry") ? base : `${base}:retry`;
    return enqueuePack(next);
  }

  async function download(packId: string) {
    setErr(null);
    try {
      const res = await fetch(`/api/admin/packs/${packId}/download`, { headers });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "download_failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DefensePack_${packId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <a href="/admin" style={{ color: "#9ad", textDecoration: "none", fontSize: 13 }}>← Reports</a>
        <button
          onClick={loadAll}
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

      <div style={{ marginTop: 14, padding: 16, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>Report</div>
        {report ? (
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 8, columnGap: 12, fontSize: 13 }}>
            <div style={{ opacity: 0.75 }}>id</div><div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{report.id}</div>
            <div style={{ opacity: 0.75 }}>tenantId</div><div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{report.tenantId}</div>
            <div style={{ opacity: 0.75 }}>status</div><div>{report.status}</div>
            <div style={{ opacity: 0.75 }}>subject</div><div>{report.subject || "-"}</div>
            <div style={{ opacity: 0.75 }}>category</div><div>{report.category || "-"}</div>
            <div style={{ opacity: 0.75 }}>createdAt</div><div>{fmt(report.createdAt)}</div>
            <div style={{ opacity: 0.75 }}>lastViewedAt</div><div>{fmt(report.lastViewedAt)}</div>
          </div>
        ) : (
          <div style={{ marginTop: 10, opacity: 0.85, fontSize: 13 }}>Loading...</div>
        )}
      </div>

      <div style={{ marginTop: 16, padding: 16, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 900 }}>Defense Packs</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="reason (audit)"
              style={{
                width: 180,
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.35)",
                color: "#eaeaf2",
                outline: "none",
                fontSize: 13
              }}
            />
            <button
              onClick={generatePack}
              disabled={loading || pendingPack}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(120,180,255,0.18)",
                color: "#eaeaf2",
                cursor: (loading || pendingPack) ? "not-allowed" : "pointer",
                fontWeight: 800
              }}
            >
              {pendingPack ? "Generating…" : "Generate"}
            </button>
            <button
              onClick={retryPack}
              disabled={loading || pendingPack || !canRetry}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,120,120,0.16)",
                color: "#eaeaf2",
                cursor: (loading || pendingPack || !canRetry) ? "not-allowed" : "pointer",
                fontWeight: 800
              }}
            >
              Retry
            </button>
            {pendingPack ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>Already queued. Please wait for Lambda callback.</div> : null}
          </div>
        </div>

        {err && <div style={{ marginTop: 10, color: "#ffb4b4", fontSize: 13 }}>Error: {err}</div>}

        <div style={{ marginTop: 12, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.9fr 0.8fr 1.2fr 1.0fr", padding: "10px 12px", background: "rgba(255,255,255,0.06)", fontSize: 12, opacity: 0.9 }}>
            <div>Pack</div>
            <div>Status</div>
            <div>Verify</div>
            <div>Events</div>
            <div>Created</div>
            <div>Action</div>
          </div>

          {packs.length === 0 && (
            <div style={{ padding: 14, fontSize: 13, opacity: 0.8 }}>No packs yet. Generate one.</div>
          )}

          {packs.map((p) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.9fr 0.8fr 1.2fr 1.0fr", padding: "12px 12px", borderTop: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                {p.id.slice(0, 8)}
                <div style={{ fontSize: 11, opacity: 0.7, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", marginTop: 4 }}>
                  sig: {p.signature.slice(0, 12)}…
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {p.status}
                {p.reasonCode ? <div style={{ fontSize: 11, opacity: 0.7 }}>reason: {p.reasonCode}</div> : null}
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                {p.verifyOk ? "OK" : "FAIL"}
                <div style={{ fontSize: 11, opacity: 0.7, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", marginTop: 4 }}>
                  {p.storedHead.slice(0, 10)} / {p.computedHead.slice(0, 10)}
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>{p.eventsCount}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {fmt(p.createdAt)}
                {p.generatedAt ? <div style={{ fontSize: 11, opacity: 0.7 }}>gen: {fmt(p.generatedAt)}</div> : null}
              </div>
              <div>
                <button
                  disabled={p.status !== "generated" || !p.pdfPath}
                  onClick={() => download(p.id)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: p.status === "generated" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                    color: "#eaeaf2",
                    cursor: p.status === "generated" ? "pointer" : "not-allowed",
                    opacity: p.status === "generated" ? 1 : 0.5,
                    fontSize: 12,
                    fontWeight: 800
                  }}
                >
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          Note: Download uses authenticated fetch (x-admin-key). It will not open as a direct link.
        </div>
      </div>
    </div>
  );
}