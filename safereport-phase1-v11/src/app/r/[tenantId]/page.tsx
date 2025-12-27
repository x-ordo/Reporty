"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function IntakePage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params?.tenantId as string;

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("workplace_harassment");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch("/api/public/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, subject, category, message, location })
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "failed");
      setResult(j);
      setMessage("");
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0b0b0f", color: "#eaeaf2", padding: 24 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ margin: 0 }}>Anonymous Report</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          This page does not collect IP addresses at the app level. Your report body is encrypted before storage.
        </p>

        <div style={{ marginTop: 18, padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (optional)"
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.35)", color: "#eaeaf2", outline: "none" }}
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.35)", color: "#eaeaf2", outline: "none" }}
            >
              <option value="workplace_harassment">Workplace harassment</option>
              <option value="bullying">Bullying</option>
              <option value="sexual_harassment">Sexual harassment</option>
              <option value="retaliation">Retaliation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what happened (min 10 chars)"
            rows={9}
            style={{ marginTop: 12, width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.35)", color: "#eaeaf2", outline: "none", resize: "vertical" }}
          />

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            style={{ marginTop: 12, width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.35)", color: "#eaeaf2", outline: "none" }}
          />

          <button
            onClick={submit}
            disabled={loading || message.trim().length < 10}
            style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#eaeaf2", cursor: "pointer" }}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>

          {err && <div style={{ marginTop: 10, color: "#ffb4b4", fontSize: 13 }}>Error: {err}</div>}
        </div>

        {result?.ok && (
          <div style={{ marginTop: 18, padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ fontWeight: 900 }}>Submitted</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Your tracking code:{" "}
              <code style={{ color: "#b7f0ff" }}>{result.code}</code>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
              Save this code to later check status (Phase 1).
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
