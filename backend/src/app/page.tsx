export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ margin: 0 }}>SafeReport — Phase 1 Skeleton</h1>
      <p style={{ marginTop: 12 }}>
        API-only skeleton. Use API routes to create reports, log events, generate defense pack.
      </p>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Health</h2>
        <ul>
          <li><a href="/api/health">/api/health</a></li>
          <li><a href="/admin">/admin (UI)</a></li>
          <li><a href="/admin/partners">/admin/partners (create partner)</a></li>
          <li><a href="/partner">/partner (partner portal)</a></li>
          <li><a href="/onboard">/onboard (invite onboarding)</a></li>
        </ul>
      </section>
    </main>
  );
}
