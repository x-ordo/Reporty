import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SafeReport",
  description: "Iron Dome - Legal Shield"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}