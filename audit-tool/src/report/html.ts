/**
 * HTML report generator — self-contained single file with inline CSS.
 */
import fs from "fs";
import type { AuditReport, CheckResult, CheckStatus } from "../types";

const STATUS_BADGE: Record<CheckStatus, string> = {
  PASS: '<span class="badge pass">✓ PASS</span>',
  FAIL: '<span class="badge fail">✗ FAIL</span>',
  WARN: '<span class="badge warn">⚠ WARN</span>',
  SKIP: '<span class="badge skip">– SKIP</span>',
};

const ROW_CLASS: Record<CheckStatus, string> = {
  PASS: "",
  FAIL: "row-fail",
  WARN: "row-warn",
  SKIP: "row-skip",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderRows(results: CheckResult[], category: "A" | "B" | "C"): string {
  return results
    .filter((r) => r.category === category)
    .map(
      (r) => `
    <tr class="${ROW_CLASS[r.status]}">
      <td class="id">${esc(r.id)}</td>
      <td>${esc(r.description)}</td>
      <td class="docs">${r.docsInvolved.map(esc).join(", ")}</td>
      <td>${STATUS_BADGE[r.status]}</td>
      <td class="detail">${esc(r.detail ?? "")}</td>
    </tr>`
    )
    .join("");
}

function renderSection(
  results: CheckResult[],
  category: "A" | "B" | "C",
  title: string
): string {
  const rows = renderRows(results, category);
  if (!rows) return "";
  return `
  <details open>
    <summary class="section-header">${esc(title)}</summary>
    <table>
      <thead>
        <tr>
          <th style="width:90px">ID</th>
          <th>Description</th>
          <th style="width:100px">Documents</th>
          <th style="width:90px">Status</th>
          <th>Detail</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </details>`;
}

export function generate(report: AuditReport, outputPath: string): void {
  const { passed, failed, warned, skipped, total } = report.summary;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Utah Captive Insurance Regulatory Audit</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 14px; background: #f8f9fa; color: #212529; }
  header { background: #1a237e; color: white; padding: 24px 32px; }
  header h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
  header p { font-size: 12px; opacity: 0.75; }
  .summary-bar { display: flex; gap: 16px; padding: 16px 32px; background: white; border-bottom: 1px solid #dee2e6; }
  .summary-item { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
  .summary-item .count { font-size: 24px; font-weight: 700; }
  .count-pass { color: #28a745; }
  .count-fail { color: #dc3545; }
  .count-warn { color: #ffc107; }
  .count-skip { color: #6c757d; }
  main { padding: 24px 32px; }
  details { margin-bottom: 20px; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
  .section-header { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 14px 16px; background: #f1f3f5; cursor: pointer; list-style: none; border-bottom: 1px solid #dee2e6; color: #495057; }
  .section-header::-webkit-details-marker { display: none; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #f8f9fa; }
  th { padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; color: #6c757d; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #dee2e6; }
  td { padding: 10px 14px; border-bottom: 1px solid #f1f3f5; vertical-align: top; font-size: 13px; }
  td.id { font-family: monospace; font-size: 12px; color: #6c757d; white-space: nowrap; }
  td.docs { font-size: 11px; color: #6c757d; font-family: monospace; }
  td.detail { font-size: 12px; color: #495057; }
  .row-fail td { background: #fff5f5; }
  .row-warn td { background: #fffbf0; }
  .row-skip td { opacity: 0.55; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .badge.pass { background: #d4edda; color: #155724; }
  .badge.fail { background: #f8d7da; color: #721c24; }
  .badge.warn { background: #fff3cd; color: #856404; }
  .badge.skip { background: #e2e3e5; color: #383d41; }
  footer { text-align: center; padding: 24px; color: #adb5bd; font-size: 12px; }
</style>
</head>
<body>
<header>
  <h1>Utah Captive Insurance Regulatory Audit</h1>
  <p>Run: ${esc(report.runAt)} &nbsp;|&nbsp; Documents: ${esc(report.docsDir)}</p>
</header>

<div class="summary-bar">
  <div class="summary-item"><span class="count count-pass">${passed}</span> Passed</div>
  <div class="summary-item"><span class="count count-fail">${failed}</span> Failed</div>
  <div class="summary-item"><span class="count count-warn">${warned}</span> Warned</div>
  <div class="summary-item"><span class="count count-skip">${skipped}</span> Skipped</div>
  <div class="summary-item" style="margin-left:auto;color:#6c757d;font-weight:400">${total} total checks</div>
</div>

<main>
  ${renderSection(report.results, "A", "Category A — Cross-Document Consistency")}
  ${renderSection(report.results, "B", "Category B — Intra-Document Math & Logic")}
  ${renderSection(report.results, "C", "Category C — Utah Regulatory Compliance")}
</main>

<footer>Utah Captive Insurance Regulatory Audit Tool &nbsp;|&nbsp; Generated ${esc(report.runAt)}</footer>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, "utf-8");
}
