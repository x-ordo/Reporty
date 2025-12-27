"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function OnboardPage() {
  const search = useSearchParams();
  const [inviteCode, setInviteCode] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const code = search.get("code");
    if (code) setInviteCode(code);
  }, [search]);

  async function submit() {
    setErr(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/public/onboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inviteCode, tenantName })
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "failed");
      setResult(j);
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0b0b0f", color: "#eaeaf2", padding: 24 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ margin: 0 }}>Company Onboarding</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Enter the invite code provided by your labor attorney partner, then create your company tenant.
        </p>

        <div style={{ marginTop: 18, padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 12 }}>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite Code (e.g. IRON...)"
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.35)", color: "#eaeaf2", outline: "none" }}
            />
            <input
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="Company name"
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.35)", color: "#eaeaf2", outline: "none" }}
            />
          </div>
          <button
            onClick={submit}
            disabled={loading}
            style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#eaeaf2", cursor: "pointer" }}
          >
            {loading ? "Creating..." : "Create Tenant"}
          </button>
          {err && <div style={{ marginTop: 10, color: "#ffb4b4", fontSize: 13 }}>Error: {err}</div>}
        </div>

        {result && (
          <div style={{ marginTop: 18, padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Created</div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>
              Partner: <b>{result.partnerName}</b>
            </div>
            <div style={{ marginTop: 6, fontSize: 13 }}>
              Tenant ID: <code style={{ color: "#b7f0ff" }}>{result.tenantId}</code>
            </div>
            <div style={{ marginTop: 10 }}>
              Employee intake URL:{" "}
              <a style={{ color: "#b7f0ff" }} href={result.intakeUrl}>
                {result.intakeUrl}
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}