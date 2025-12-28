"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export default function PartnerKeyGate({ children }: { children: (key: string) => ReactNode }) {
  const [key, setKey] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("PARTNER_KEY") || "";
      setKey(saved);
    } finally {
      setLoaded(true);
    }
  }, []);

  const view = useMemo(() => {
    if (!loaded) return <div style={{ padding: 24, opacity: 0.8 }}>Loading...</div>;

    return (
      <div style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ margin: 0 }}>Partner Portal</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Paste your Partner Key to access your customer dashboard.
        </p>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <input
            value={key}
            onChange={(e) => {
              const v = e.target.value;
              setKey(v);
              try { localStorage.setItem("PARTNER_KEY", v); } catch (_) {}
            }}
            placeholder="paste partner key (prk_...)"
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
            onClick={() => {
              setKey("");
              try { localStorage.removeItem("PARTNER_KEY"); } catch (_) {}
            }}
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

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          Key is stored in this browser only (localStorage). Rotate by reissuing keys from Admin.
        </div>

        <div style={{ marginTop: 18 }}>
          {key ? children(key) : null}
        </div>
      </div>
    );
  }, [children, key, loaded]);

  return view;
}