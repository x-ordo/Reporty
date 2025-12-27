"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminKeyGate from "./AdminKeyGate";

type PartnerRow = {
  id: string;
  name: string;
  inviteCode: string;
  keyPrefix: string;
  revenueShareRate: string | null;
  createdAt: string;
};

function fmt(dt?: string | null) {
  if (!dt) return "-";
  const d = new Date(dt);
  return d.toLocaleString();
}

export default function AdminPartnersClient() {
  const [items, setItems] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [rev, setRev] = useState("0.00");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<string | null>(null);

  async function load(key: string) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/partners", { headers: { "x-admin-key": key } });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "failed");
      setItems(j.items || []);
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function create(key: string) {
    setLoading(true);
    setErr(null);
    setCreatedKey(null);
    setCreatedInvite(null);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ name, revenueShareRate: rev })
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "failed");
      setCreatedKey(j.partnerKey);
      setCreatedInvite(j.partner?.inviteCode || null);
      setName("");
      await load(key);
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Passing children as an explicit prop to resolve TypeScript's missing children error */
    <AdminKeyGate children={(key: string) => (
        <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Admin</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>Partners</div>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                Create partner → issue Partner Key (one-time) + Invite Code (shareable).
              </div>
              <div style={{ marginTop: 8 }}>
                <a style={{ color: "#b7f0ff" }} href="/admin">← Back</a>
              </div>
            </div>

            <button
              onClick={() => load(key)}
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

          <div style={{ marginTop: 14, padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ fontWeight: 900, fontSize: 13 }}>Create Partner</div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr 0.4fr", gap: 10, marginTop: 10 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Partner name (e.g. ABC Labor Attorney)"
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.35)", color: "#eaeaf2", outline: "none" }}
              />
              <input
                value={rev}
                onChange={(e) => setRev(e.target.value)}
                placeholder="Revenue share rate"
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.35)", color: "#eaeaf2", outline: "none" }}
              />
              <button
                onClick={() => create(key)}
                disabled={loading || name.trim().length < 2}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#eaeaf2", cursor: "pointer" }}
              >
                Create
              </button>
            </div>

            {createdKey && (
              <div style={{ marginTop: 12, fontSize: 13 }}>
                <div style={{ fontWeight: 900 }}>Issued</div>
                <div style={{ marginTop: 6 }}>
                  Invite Code: <code style={{ color: "#b7f0ff" }}>{createdInvite}</code>
                </div>
                <div style={{ marginTop: 6 }}>
                  Partner Key (one-time): <code style={{ color: "#b7f0ff" }}>{createdKey}</code>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                  Save Partner Key now. We only store its hash.
                </div>
              </div>
            )}

            {err && <div style={{ marginTop: 10, color: "#ffb4b4", fontSize: 13 }}>Error: {err}</div>}
          </div>

          <div style={{ marginTop: 14, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr 0.8fr 0.7fr", padding: 12, gap: 12, background: "rgba(255,255,255,0.06)", fontSize: 12, opacity: 0.9 }}>
              <div>Partner</div>
              <div>Invite</div>
              <div>Key prefix</div>
              <div>Created</div>
            </div>

            {items.length === 0 && (
              <div style={{ padding: 14, fontSize: 13, opacity: 0.8 }}>
                No partners yet. Hit Refresh.
              </div>
            )}

            {items.map((p) => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr 0.8fr 0.7fr", padding: 12, gap: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>
                  {p.name} <span style={{ opacity: 0.6, fontWeight: 500 }}>— {p.id.slice(0, 8)}</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  <code style={{ color: "#b7f0ff" }}>{p.inviteCode}</code>
                </div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  <code style={{ color: "#b7f0ff" }}>{p.keyPrefix}</code>
                </div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>{fmt(p.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )} />
  );
}