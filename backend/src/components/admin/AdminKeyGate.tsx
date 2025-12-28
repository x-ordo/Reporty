"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function AdminKeyGate({ children }: { children: (key: string) => React.ReactNode }) {
  const [key, setKey] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ADMIN_API_KEY") || "";
      setKey(saved);
    } finally {
      setLoaded(true);
    }
  }, []);

  const ok = useMemo(() => key.trim().length >= 8, [key]);

  if (!loaded) return null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>SafeReport Admin</div>
          <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>
            Admin API key is stored in localStorage (browser only). It is sent as <code>x-admin-key</code>.
          </div>
        </div>
        <a href="/" style={{ color: "#9ad", textDecoration: "none", fontSize: 13 }}>← Public</a>
      </div>

      <div style={{ marginTop: 18, padding: 16, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>ADMIN_API_KEY</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={key}
            onChange={(e) => {
              const v = e.target.value;
              setKey(v);
              try { localStorage.setItem("ADMIN_API_KEY", v); } catch (_) {}
            }}
            placeholder="paste ADMIN_API_KEY"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.35)",
              color: "#eaeaf2",
              outline: "none"
            }}
          />
          <button
            onClick={() => { try { localStorage.removeItem("ADMIN_API_KEY"); } catch (_) {} setKey(""); }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "#eaeaf2",
              cursor: "pointer"
            }}
          >
            Clear
          </button>
        </div>
        {!ok && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            Enter a valid key to load admin data.
          </div>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        {ok ? children(key.trim()) : null}
      </div>
    </div>
  );
}