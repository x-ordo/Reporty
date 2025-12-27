"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminKeyGate from "./AdminKeyGate";

type TenantRow = {
  id: string;
  name: string;
  partnerId: string | null;
  partnerName: string | null;
  isPremium: boolean;
  tags: string[];
  adminNotes: string | null;
  partnerNotes: string | null;
  slaPolicy: {
    receivedHours?: number;
    openDays?: number;
    receivedHoursStrict?: number;
    openDaysStrict?: number;
    strictHints?: string[];
  };
  createdAt: string;
  updatedAt: string;
};

function fmt(dt?: string | null) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

function parseCsvTags(s: string): string[] {
  return s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export default function AdminTenantsClient() {
  const [adminKey, setAdminKey] = useState("");
  const [items, setItems] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => items.find((t) => t.id === selectedId) || null, [items, selectedId]);

  // edit state
  const [editName, setEditName] = useState("");
  const [editPremium, setEditPremium] = useState(false);
  const [editTags, setEditTags] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [editReceivedHours, setEditReceivedHours] = useState<number | "">("");
  const [editOpenDays, setEditOpenDays] = useState<number | "">("");
  const [editReceivedHoursStrict, setEditReceivedHoursStrict] = useState<number | "">("");
  const [editOpenDaysStrict, setEditOpenDaysStrict] = useState<number | "">("");
  const [editStrictHints, setEditStrictHints] = useState("");

  useEffect(() => {
    if (!selected) return;
    setEditName(selected.name);
    setEditPremium(selected.isPremium);
    setEditTags((selected.tags || []).join(", "));
    setEditAdminNotes(selected.adminNotes || "");
    setEditReceivedHours(selected.slaPolicy?.receivedHours ?? "");
    setEditOpenDays(selected.slaPolicy?.openDays ?? "");
    setEditReceivedHoursStrict(selected.slaPolicy?.receivedHoursStrict ?? "");
    setEditOpenDaysStrict(selected.slaPolicy?.openDaysStrict ?? "");
    setEditStrictHints((selected.slaPolicy?.strictHints || []).join(", "));
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    if (!adminKey) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/tenants", { headers: { "x-admin-key": adminKey } });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "failed");
      setItems(j.items || []);
      if (selectedId && !(j.items || []).some((t: any) => t.id === selectedId)) setSelectedId(null);
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!adminKey || !selected) return;
    setLoading(true);
    setErr(null);
    try {
      const payload: any = {
        name: editName,
        isPremium: editPremium,
        tags: parseCsvTags(editTags),
        adminNotes: editAdminNotes ? editAdminNotes : null,
        slaPolicy: {
          ...(editReceivedHours !== "" ? { receivedHours: Number(editReceivedHours) } : {}),
          ...(editOpenDays !== "" ? { openDays: Number(editOpenDays) } : {}),
          ...(editReceivedHoursStrict !== "" ? { receivedHoursStrict: Number(editReceivedHoursStrict) } : {}),
          ...(editOpenDaysStrict !== "" ? { openDaysStrict: Number(editOpenDaysStrict) } : {}),
          ...(editStrictHints.trim() ? { strictHints: parseCsvTags(editStrictHints) } : {})
        }
      };

      const res = await fetch(`/api/admin/tenants/${selected.id}`, {
        method: "PATCH",
        headers: { "x-admin-key": adminKey, "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "failed");
      await load();
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!adminKey) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  return (
    /* Passing children as an explicit prop to resolve TypeScript's missing children error */
    <AdminKeyGate children={(key: string) => {
        if (key !== adminKey) setAdminKey(key);
        return (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Tenants</div>
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

            <div style={{ marginTop: 14, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1.1fr 0.7fr 1.2fr",
                  padding: 12,
                  gap: 12,
                  background: "rgba(255,255,255,0.06)",
                  fontSize: 12,
                  opacity: 0.9
                }}
              >
                <div>Tenant</div>
                <div>Partner</div>
                <div>Premium</div>
                <div>Created</div>
              </div>

              {items.length === 0 && (
                <div style={{ padding: 14, fontSize: 13, opacity: 0.8 }}>No tenants yet.</div>
              )}

              {items.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 1.1fr 0.7fr 1.2fr",
                    padding: 12,
                    gap: 12,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    background: selectedId === t.id ? "rgba(183,240,255,0.08)" : "transparent"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.name} <span style={{ fontWeight: 500, opacity: 0.6 }}>— {t.id.slice(0, 8)}</span>
                    <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                      Tags: {(t.tags || []).join(", ") || "-"}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.partnerName || "-"}{" "}
                    <span style={{ opacity: 0.6 }}>{t.partnerId ? `(${t.partnerId.slice(0, 8)})` : ""}</span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>{t.isPremium ? "Yes" : "No"}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>{fmt(t.createdAt)}</div>
                </div>
              ))}
            </div>

            {selected && (
              <div style={{ marginTop: 18, padding: 14, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>Edit Tenant</div>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                  Intake URL: <a style={{ color: "#b7f0ff" }} href={`/r/${selected.id}`}>{`/r/${selected.id}`}</a>
                </div>

                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Name</div>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#eaeaf2"
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Tags (comma separated)</div>
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="vip, high-risk, union"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.04)",
                        color: "#eaeaf2"
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" checked={editPremium} onChange={(e) => setEditPremium(e.target.checked)} />
                  <div style={{ fontSize: 13 }}>Premium</div>
                  <div style={{ fontSize: 12, opacity: 0.65 }}>Updated: {fmt(selected.updatedAt)}</div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Admin Notes</div>
                  <textarea
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#eaeaf2",
                      resize: "vertical"
                    }}
                  />
                </div>

                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800 }}>Partner Dashboard SLA</div>
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <NumberBox label="Received (hours)" value={editReceivedHours} onChange={setEditReceivedHours} />
                  <NumberBox label="Open (days)" value={editOpenDays} onChange={setEditOpenDays} />
                  <NumberBox label="Received strict (hours)" value={editReceivedHoursStrict} onChange={setEditReceivedHoursStrict} />
                  <NumberBox label="Open strict (days)" value={editOpenDaysStrict} onChange={setEditOpenDaysStrict} />
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Strict hints (comma separated)</div>
                  <input
                    value={editStrictHints}
                    onChange={(e) => setEditStrictHints(e.target.value)}
                    placeholder="성, 성희롱, 폭언, 폭행"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#eaeaf2"
                    }}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                    Strict hint match ⇒ tighter SLA thresholds apply for traffic-light (red faster).
                  </div>
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                  <button
                    onClick={save}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(183,240,255,0.12)",
                      color: "#eaeaf2",
                      cursor: "pointer",
                      fontWeight: 800
                    }}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setSelectedId(null)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#eaeaf2",
                      cursor: "pointer"
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }} />
  );
}

function NumberBox({
  label,
  value,
  onChange
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? "" : Number(v));
        }}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.04)",
          color: "#eaeaf2"
        }}
      />
    </div>
  );
}