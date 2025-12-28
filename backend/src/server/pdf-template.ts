
export function buildDefensePackHtml(input: {
  tenantName: string;
  reportId: string;
  packId: string;
  status: string;
  subject?: string | null;
  category?: string | null;
  createdAtISO: string;
  events: Array<{ type: string; createdAtISO: string; actorRole: string; data: any }>;
  evidenceHeadHash: string;
  verify: {
    ok: boolean;
    storedHead: string;
    computedHead: string | null;
    events: number;
    mismatch: any | null;
  };
  signature: string; // HMAC of snapshot payload (server-side)
  generatedAtISO: string;
}) {
  const rows = input.events.map((e) => {
    const data = JSON.stringify(e.data ?? {}, null, 2);
    return `
      <tr>
        <td>${escapeHtml(e.createdAtISO)}</td>
        <td>${escapeHtml(e.type)}</td>
        <td>${escapeHtml(e.actorRole)}</td>
        <td><pre>${escapeHtml(data)}</pre></td>
      </tr>
    `;
  }).join("");

  const verifyBadge = input.verify.ok ? "PASS" : "FAIL";
  const mismatchBlock = input.verify.mismatch
    ? `<pre>${escapeHtml(JSON.stringify(input.verify.mismatch, null, 2))}</pre>`
    : `<span>-</span>`;

  const statement = `본 증빙서는 사건 처리 타임라인의 무결성 스냅샷을 포함합니다.
각 이벤트는 이전 해시(prev_hash)를 포함하여 HMAC-SHA256 체인으로 연결됩니다.
System Signature는 생성 시점의 스냅샷 payload에 대한 HMAC이며, 위·변조 여부를 점검하는 기준값입니다.
This document includes an integrity snapshot (HMAC chain + system signature) for audit/inspection.`;

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 18mm 15mm 22mm 15mm; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
    h1 { margin: 0 0 10px; }
    h2 { margin: 18px 0 10px; }
    .meta { margin: 0 0 8px; color: #444; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; }
    .pass { background: #e8fff3; border: 1px solid #b9f3d3; }
    .fail { background: #fff1f1; border: 1px solid #ffc2c2; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 7px; font-size: 11px; vertical-align: top; }
    th { background: #fafafa; text-align: left; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
    .box { border: 1px solid #eee; border-radius: 12px; padding: 12px; }
    .small { font-size: 11px; color: #555; line-height: 1.45; }
    .titlebar { display:flex; justify-content: space-between; gap: 12px; align-items: baseline; }
    .right { text-align:right; }
    .footer {
      position: fixed;
      bottom: -14mm;
      left: 0;
      right: 0;
      font-size: 10px;
      color: #666;
      display:flex;
      justify-content: space-between;
      border-top: 1px solid #eee;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="titlebar">
    <div>
      <h1>Defense Pack (증빙 패키지)</h1>
      <p class="meta"><b>Tenant</b>: ${escapeHtml(input.tenantName)}</p>
    </div>
    <div class="right">
      <p class="meta mono"><b>Pack ID</b>: ${escapeHtml(input.packId)}</p>
      <p class="meta mono"><b>Report</b>: ${escapeHtml(input.reportId)}</p>
      <p class="meta"><b>Generated</b>: ${escapeHtml(input.generatedAtISO)}</p>
    </div>
  </div>

  <p class="meta"><b>Status</b>: ${escapeHtml(input.status)} &nbsp; | &nbsp; <b>Created</b>: ${escapeHtml(input.createdAtISO)}</p>
  <p class="meta"><b>Category</b>: ${escapeHtml(input.category ?? "-")} &nbsp; | &nbsp; <b>Subject</b>: ${escapeHtml(input.subject ?? "-")}</p>

  <h2>Integrity Verification</h2>
  <div class="box">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
      <span class="badge ${input.verify.ok ? "pass" : "fail"}">${verifyBadge}</span>
      <span class="small">Recomputed chain from events and compared to DB head hash (at generation time).</span>
    </div>
    <div class="mono"><b>Stored Head</b>: ${escapeHtml(input.verify.storedHead)}</div>
    <div class="mono"><b>Computed Head</b>: ${escapeHtml(input.verify.computedHead ?? "null")}</div>
    <div class="mono"><b>Events</b>: ${escapeHtml(String(input.verify.events))}</div>
    <div class="mono"><b>System Signature (HMAC)</b>: ${escapeHtml(input.signature)}</div>
    <div class="small" style="margin-top:10px;"><b>Mismatch</b>: ${mismatchBlock}</div>
  </div>

  <h2>Defense Log (타임라인)</h2>
  <table>
    <thead>
      <tr>
        <th>Time</th>
        <th>Event</th>
        <th>Actor</th>
        <th>Data</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="4">No events</td></tr>`}
    </tbody>
  </table>

  <h2>Evidence Head</h2>
  <p class="mono">Evidence Head Hash (HMAC chain): ${escapeHtml(input.evidenceHeadHash)}</p>

  <div class="footer">
    <div class="mono">SafeReport • Defense Pack • ${escapeHtml(input.packId)}</div>
    <div class="mono">Sig: ${escapeHtml(input.signature.slice(0, 16))}… • ${escapeHtml(input.generatedAtISO)}</div>
  </div>

  <p class="small" style="margin-top:18px;">
    ${escapeHtml(statement)}
  </p>
</body>
</html>
`;
}

function escapeHtml(s: string) {
  // Using .replace with global regex flag /g to replace all occurrences efficiently
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
