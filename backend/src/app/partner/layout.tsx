import React from "react";

export const runtime = "nodejs";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0b0f", color: "#eaeaf2" }}>
      {children}
    </div>
  );
}