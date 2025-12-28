"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PartnerKeyGate from "./PartnerKeyGate";

type TenantRow = {
  id: string;
  name: string;
  isPremium: boolean;
  createdAt: string;

  tags: string[];
  adminNotes: string | null;
  partnerNotes: string | null;
  slaPolicy: Record<string, any>;

  openCount: number;
  urgentCount: number;
  lastAt: string | null;
  traffic: "green" | "yellow" | "red";
};

type Partner = { id: string; name: string; inviteCode: string; keyPrefix: string };

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

function trafficDot(color: "green" | "yellow" | "red") {
  const map: Record<string, string> = {
    green: "rgba(115, 255, 184, 0.85)",
    yellow: "rgba(255, 223, 115, 0.9)",
    red: "rgba(255, 120, 120, 0.9)"
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: 999,
        background: map[color],
        boxShadow: `0 0 0 3px rgba(255,255,255,0.06)`
      }}
    />
  );
}

export default function PartnerHomeClient() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pollAfterMs, setPollAfterMs] = useState<number>(15000);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [newName, setNewName] = useState("");

  const [expanded, setExpanded] = useState<string | null>(null);
  const expandedTenant = useMemo(() => tenants.find((t) => t.id === expanded) || null, [tenants, expanded]);

  const [editTags, setEditTags] = useState("");
  const [editPartnerNotes, setEditPartnerNotes] = useState("");

  const keyRef = useRef<string>("");
  const [partnerKey, setPartnerKey] = useState("");

  // Initialize partnerKey from localStorage on component mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("PARTNER_KEY") || "" : "";
    setPartnerKey(saved);
  }, []);

  useEffect(() => {
    if (!partnerKey) return;
    load(partnerKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerKey]);

  useEffect(() => {
    if (!expandedTenant) return;
    setEditTags((expandedTenant.tags || []).join(", "));
    setEditPartnerNotes(expandedTenant.partnerNotes || "");
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(key: string) {
    keyRef.current = key;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/partner/tenants", { headers: { "x-partner-key": key } });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "failed");
      setPartner(j.partner);
      setTenants(j.items || []);
      if (typeof j.pollAfterMs === "number") setPollAfterMs(j.pollAfterMs);
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function createTenant(key: string) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/partner/tenants", {
        method: "POST",
        headers: { "content-type": "application/json", "x-partner-key": key },
        body: JSON.stringify({ name: newName })
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "failed");
      setNewName("");
      await load(key);
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveTenantMeta(key: string) {
    if (!expandedTenant) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/partner/tenants/${expandedTenant.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-partner-key": key },
        body: JSON.stringify({
          tags: parseCsvTags(editTags),
          partnerNotes: editPartnerNotes ? editPartnerNotes : null
        })
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "failed");
      await load(key);
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      const k = keyRef.current;
      if (!k) return;
      load(k);
    }, pollAfterMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, pollAfterMs]);

  return (
    /* Passing children as an explicit prop to resolve TypeScript's missing children error */
    <PartnerKeyGate children={(key: string) => {
        // Correctly update internal state when Gate provides a key
        if (key && key !== partnerKey) {
          setPartnerKey(key);
        }
        return (
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyItems: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>Partner Dashboard</div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                  {partner ? (
                    <>
                      <span style={{ fontWeight: 800 }}>{partner.name}</span>{" "}
                      <span style={{ opacity: 0.7 }}>(key: {partner.keyPrefix}…)</span>
                    </>
                  ) : (
                    <span style={{ opacity: 0.7 }}>Enter Partner Key to load</span>
                  )}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                  Invite Code: <code style={{ color: "#b7f0ff" }}>{partner?.inviteCode || "-"}</code>{" "}
                  <span style={{ opacity: 0.6 }}>(Onboard URL: </span>
                  <a style={{ color: "#b7f0ff" }} href={`/onboard?code=${partner?.inviteCode || ""}`}>{`/onboard?code=${partner?.inviteCode || ""}`}</a>
                  <span style={{ opacity: 0.6 }}> )</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, opacity: 0.85 }}>
                  <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                  Auto refresh ({Math.round(pollAfterMs / 1000)}s)
                </label>
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
            </div>

            {err && <div style={{ marginTop: 14, color: "#ffb4b4", fontSize: 13 }}>Error: {err}</div>}

            <div style={{ marginTop: 18, padding: 14, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>Create Tenant</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Used when you want to pre-create a tenant manually.</div>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Tenant name"
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#eaeaf2"
                  }}
                />
                <button
                  disabled={!newName.trim()}
                  onClick={() => createTenant(key)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(183,240,255,0.12)",
                    color: "#eaeaf2",
                    cursor: newName.trim() ? "pointer" : "not-allowed",
                    fontWeight: 800
                  }}
                >
                  Create
                </button>
              </div>
            </div>

            <div style={{ marginTop: 18, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 0.8fr 0.8fr 1fr 0.6fr",
                  padding: 12,
                  gap: 12,
                  background: "rgba(255,255,255,0.06)",
                  fontSize: 12,
                  opacity: 0.9
                }}
              >
                <div>Tenant</div>
                <div>Traffic</div>
                <div>Open / Urgent</div>
                <div>Last report</div>
                <div>Actions</div>
              </div>

              {tenants.length === 0 && <div style={{ padding: 14, fontSize: 13, opacity: 0.8 }}>No tenants yet.</div>}

              {tenants.map((t) => (
                <div key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 0.8fr 0.8fr 1fr 0.6fr",
                      padding: 12,
                      gap: 12
                    }}
                  >
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ fontSize: 13, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.name} <span style={{ fontWeight: 500, opacity: 0.6 }}>— {t.id.slice(0, 8)}</span>
                      </div>
                      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {(t.tags || []).slice(0, 6).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "1px solid rgba(255,255,255,0.14)",
                              background: "rgba(255,255,255,0.04)",
                              opacity: 0.9
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {(t.tags || []).length > 6 && (
                          <span style={{ fontSize: 11, opacity: 0.7 }}>+{(t.tags || []).length - 6}</span>
                        )}
                      </div>
                      {t.partnerNotes ? (
                        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          Note: {t.partnerNotes}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {trafficDot(t.traffic)}
                      <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 800 }}>{t.traffic.toUpperCase()}</div>
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      {t.openCount} / <span style={{ color: t.urgentCount ? "#ffb4b4" : "inherit" }}>{t.urgentCount}</span>
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>Created: {fmt(t.createdAt)}</div>
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.85 }}>{fmt(t.lastAt)}</div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <a
                        href={`/r/${t.id}`}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.14)",
                          color: "#b7f0ff",
                          textDecoration: "none",
                          fontSize: 12
                        }}
                      >
                        Intake
                      </a>
                      <button
                        onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,255,255,0.05)",
                          color: "#eaeaf2",
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        {expanded === t.id ? "Close" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {expanded === t.id && expandedTenant && (
                    <div style={{ padding: "0 12px 12px 12px" }}>
                      <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Tags</div>
                            <input
                              value={editTags}
                              onChange={(e) => setEditTags(e.target.value)}
                              placeholder="vip, high-risk"
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
                            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>SLA policy (admin-managed)</div>
                            <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
                              {JSON.stringify(expandedTenant.slaPolicy || {})}
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Partner Notes</div>
                          <textarea
                            value={editPartnerNotes}
                            onChange={(e) => setEditPartnerNotes(e.target.value)}
                            rows={3}
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

                        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                          <button
                            onClick={() => saveTenantMeta(key)}
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
                          {expandedTenant.adminNotes ? (
                            <div style={{ fontSize: 12, opacity: 0.75, alignSelf: "center" }}>
                              Admin note: {expandedTenant.adminNotes}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }} />
  );
}