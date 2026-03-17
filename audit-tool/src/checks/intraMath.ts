/**
 * Category B — Intra-Document Math & Logic Checks (12 checks)
 */
import type { FilingPackage, CheckResult, ExtractedDoc } from "../types";

function skip(id: string, description: string, docs: string[], reason: string): CheckResult {
  return { id, category: "B", description, status: "SKIP", detail: reason, docsInvolved: docs };
}
function pass(id: string, description: string, docs: string[]): CheckResult {
  return { id, category: "B", description, status: "PASS", docsInvolved: docs };
}
function fail(id: string, description: string, docs: string[], detail: string): CheckResult {
  return { id, category: "B", description, status: "FAIL", detail, docsInvolved: docs };
}
function warn(id: string, description: string, docs: string[], detail: string): CheckResult {
  return { id, category: "B", description, status: "WARN", detail, docsInvolved: docs };
}
function docAvailable<T>(doc: ExtractedDoc<T>): doc is ExtractedDoc<T> & { data: T } {
  return !doc.missing && doc.data !== null;
}

// Known SEIC coverage lines for Doc 6 completeness check
const REQUIRED_LINES = [
  "commercial general liability",
  "participant legal liability",
  "coach",
  "accident medical",
  "equipment",
  "cyber",
  "abuse",
  "directors",
  "event cancellation",
];

function lineMatches(lineName: string, keyword: string): boolean {
  return lineName.toLowerCase().includes(keyword.toLowerCase());
}

// ─── MATH-001: Doc 4 capitalization math ────────────────────────────────────

function math001(pkg: FilingPackage): CheckResult {
  const id = "MATH-001";
  const desc = "Doc 4: paid-in capital + surplus + LOC = total capitalization";
  if (!docAvailable(pkg.doc4)) return skip(id, desc, ["doc4"], "Document 4 not available");

  const { paidInCapital, paidInSurplus, locAmount, totalCapitalization } = pkg.doc4.data;
  const computed = (paidInCapital ?? 0) + (paidInSurplus ?? 0) + (locAmount ?? 0);
  const stated = totalCapitalization ?? 0;

  if (!stated) return skip(id, desc, ["doc4"], "Total capitalization not extracted");
  if (Math.abs(computed - stated) > 1)
    return fail(id, desc, ["doc4"],
      `Computed: $${computed.toLocaleString()} (paid-in $${(paidInCapital??0).toLocaleString()} + surplus $${(paidInSurplus??0).toLocaleString()} + LOC $${(locAmount??0).toLocaleString()}) ≠ stated: $${stated.toLocaleString()}`);
  return pass(id, desc, ["doc4"]);
}

// ─── MATH-002: Issued shares ≤ authorized shares ─────────────────────────────

function math002(pkg: FilingPackage): CheckResult {
  const id = "MATH-002";
  const desc = "Doc 4: issued shares ≤ authorized shares";
  if (!docAvailable(pkg.doc4)) return skip(id, desc, ["doc4"], "Document 4 not available");

  const { issuedShares, authorizedShares } = pkg.doc4.data;
  if (!issuedShares || !authorizedShares) return skip(id, desc, ["doc4"], "Share counts not extracted");

  if (issuedShares > authorizedShares)
    return fail(id, desc, ["doc4"],
      `Issued shares (${issuedShares.toLocaleString()}) exceed authorized shares (${authorizedShares.toLocaleString()})`);
  return pass(id, desc, ["doc4"]);
}

// ─── MATH-003: Gross premium ≥ net premium per line ─────────────────────────

function math003(pkg: FilingPackage): CheckResult {
  const id = "MATH-003";
  const desc = "Doc 6: gross premium ≥ net premium for every coverage line";
  if (!docAvailable(pkg.doc6)) return skip(id, desc, ["doc6"], "Document 6 not available");

  const violations: string[] = [];
  for (const line of pkg.doc6.data.lines) {
    if (line.grossPremium < line.netPremium)
      violations.push(`"${line.lineName}": gross $${line.grossPremium.toLocaleString()} < net $${line.netPremium.toLocaleString()}`);
  }

  if (violations.length > 0)
    return fail(id, desc, ["doc6"], violations.join("; "));
  return pass(id, desc, ["doc6"]);
}

// ─── MATH-004: All 9 required coverage lines present ─────────────────────────

function math004(pkg: FilingPackage): CheckResult {
  const id = "MATH-004";
  const desc = "Doc 6: all 9 required SEIC coverage lines present";
  if (!docAvailable(pkg.doc6)) return skip(id, desc, ["doc6"], "Document 6 not available");

  const lineNames = pkg.doc6.data.lines.map((l) => l.lineName);
  const missing: string[] = [];

  for (const keyword of REQUIRED_LINES) {
    const found = lineNames.some((name) => lineMatches(name, keyword));
    if (!found) missing.push(keyword);
  }

  if (missing.length > 0)
    return fail(id, desc, ["doc6"], `Missing coverage lines matching: ${missing.join(", ")}`);
  return pass(id, desc, ["doc6"]);
}

// ─── MATH-005: Claims-made lines have retroactive dates ──────────────────────

function math005(pkg: FilingPackage): CheckResult {
  const id = "MATH-005";
  const desc = "Doc 6: all claims-made coverage lines have a retroactive date";
  if (!docAvailable(pkg.doc6)) return skip(id, desc, ["doc6"], "Document 6 not available");

  const missing: string[] = [];
  for (const line of pkg.doc6.data.lines) {
    if (line.claimsBasis?.toLowerCase().includes("claims-made") && !line.retroactiveDate)
      missing.push(`"${line.lineName}"`);
  }

  if (missing.length > 0)
    return fail(id, desc, ["doc6"], `Claims-made lines without retroactive date: ${missing.join(", ")}`);
  return pass(id, desc, ["doc6"]);
}

// ─── MATH-006: Doc 8 loss ratio = losses / NEP ──────────────────────────────

function math006(pkg: FilingPackage): CheckResult {
  const id = "MATH-006";
  const desc = "Doc 8: loss ratio = losses incurred / net earned premium per year";
  if (!docAvailable(pkg.doc8)) return skip(id, desc, ["doc8"], "Document 8 not available");
  if (!pkg.doc8.data.projections?.length) return skip(id, desc, ["doc8"], "No projection data extracted");

  const errors: string[] = [];
  for (const yr of pkg.doc8.data.projections) {
    if (!yr.netEarnedPremium) continue;
    const computed = yr.lossesIncurred / yr.netEarnedPremium;
    if (Math.abs(computed - yr.lossRatio) > 0.02)
      errors.push(`Year ${yr.year}: stated ${(yr.lossRatio * 100).toFixed(1)}% vs computed ${(computed * 100).toFixed(1)}%`);
  }

  if (errors.length > 0)
    return fail(id, desc, ["doc8"], errors.join("; "));
  return pass(id, desc, ["doc8"]);
}

// ─── MATH-007: Combined ratio = loss ratio + expense ratio ───────────────────

function math007(pkg: FilingPackage): CheckResult {
  const id = "MATH-007";
  const desc = "Doc 8: combined ratio = loss ratio + expense ratio per year";
  if (!docAvailable(pkg.doc8)) return skip(id, desc, ["doc8"], "Document 8 not available");
  if (!pkg.doc8.data.projections?.length) return skip(id, desc, ["doc8"], "No projection data extracted");

  const errors: string[] = [];
  for (const yr of pkg.doc8.data.projections) {
    const computed = (yr.lossRatio ?? 0) + (yr.expenseRatio ?? 0);
    if (Math.abs(computed - (yr.combinedRatio ?? 0)) > 0.02)
      errors.push(`Year ${yr.year}: stated ${((yr.combinedRatio ?? 0) * 100).toFixed(1)}% vs computed ${(computed * 100).toFixed(1)}%`);
  }

  if (errors.length > 0)
    return fail(id, desc, ["doc8"], errors.join("; "));
  return pass(id, desc, ["doc8"]);
}

// ─── MATH-008: Surplus never below Utah minimum ($250,000) ───────────────────

function math008(pkg: FilingPackage): CheckResult {
  const id = "MATH-008";
  const desc = "Doc 8: projected surplus never falls below Utah minimum ($250,000)";
  if (!docAvailable(pkg.doc8)) return skip(id, desc, ["doc8"], "Document 8 not available");
  if (!pkg.doc8.data.projections?.length) return skip(id, desc, ["doc8"], "No projection data extracted");

  const violations: string[] = [];
  for (const yr of pkg.doc8.data.projections) {
    if (yr.surplusEndOfYear !== undefined && yr.surplusEndOfYear < 250000)
      violations.push(`Year ${yr.year}: $${yr.surplusEndOfYear.toLocaleString()}`);
  }

  if (violations.length > 0)
    return fail(id, desc, ["doc8"], `Surplus below $250,000 minimum: ${violations.join("; ")}`);
  return pass(id, desc, ["doc8"]);
}

// ─── MATH-009: Member count growth ≤ 300% YoY ───────────────────────────────

function math009(pkg: FilingPackage): CheckResult {
  const id = "MATH-009";
  const desc = "Doc 8: projected member count growth is reasonable (≤ 300% YoY)";
  if (!docAvailable(pkg.doc8)) return skip(id, desc, ["doc8"], "Document 8 not available");

  const projections = pkg.doc8.data.projections;
  if (!projections?.length) return skip(id, desc, ["doc8"], "No projection data extracted");

  const warnings: string[] = [];
  for (let i = 1; i < projections.length; i++) {
    const prev = projections[i - 1].memberCount;
    const curr = projections[i].memberCount;
    if (prev > 0 && curr / prev > 4) // 4x = 300% growth
      warnings.push(`Year ${projections[i].year}: ${prev} → ${curr} members (${((curr / prev - 1) * 100).toFixed(0)}% growth)`);
  }

  if (warnings.length > 0)
    return warn(id, desc, ["doc8"], `Unusually high member growth: ${warnings.join("; ")}`);
  return pass(id, desc, ["doc8"]);
}

// ─── MATH-010: Asset class allocations each ≤ 100% ──────────────────────────

function math010(pkg: FilingPackage): CheckResult {
  const id = "MATH-010";
  const desc = "Doc 11: each permitted asset class allocation is between 0% and 100%";
  if (!docAvailable(pkg.doc11)) return skip(id, desc, ["doc11"], "Document 11 not available");

  const invalid: string[] = [];
  for (const cls of pkg.doc11.data.permittedAssetClasses) {
    if (cls.maxAllocationPct < 0 || cls.maxAllocationPct > 100)
      invalid.push(`"${cls.name}": ${cls.maxAllocationPct}%`);
  }

  if (invalid.length > 0)
    return fail(id, desc, ["doc11"], `Invalid allocation percentages: ${invalid.join(", ")}`);
  return pass(id, desc, ["doc11"]);
}

// ─── MATH-011: At least 3 directors ─────────────────────────────────────────

function math011(pkg: FilingPackage): CheckResult {
  const id = "MATH-011";
  const desc = "Doc 2: at least 3 directors on the board";
  if (!docAvailable(pkg.doc2)) return skip(id, desc, ["doc2"], "Document 2 not available");

  const count = pkg.doc2.data.directors.length;
  if (count < 3)
    return fail(id, desc, ["doc2"], `Only ${count} director(s) found; minimum is 3`);
  return pass(id, desc, ["doc2"]);
}

// ─── MATH-012: All 4 officer positions filled ─────────────────────────────────

function math012(pkg: FilingPackage): CheckResult {
  const id = "MATH-012";
  const desc = "Doc 2: all required officer positions filled (President, VP/Secretary, Treasurer, Asst Secretary)";
  if (!docAvailable(pkg.doc2)) return skip(id, desc, ["doc2"], "Document 2 not available");

  const titles = pkg.doc2.data.all.map((p) => p.title.toLowerCase());
  const required = [
    { label: "President", keywords: ["president"] },
    { label: "Vice President or Secretary", keywords: ["vice president", "vp", "secretary"] },
    { label: "Treasurer", keywords: ["treasurer"] },
  ];

  const missing: string[] = [];
  for (const { label, keywords } of required) {
    const found = titles.some((t) => keywords.some((k) => t.includes(k)));
    if (!found) missing.push(label);
  }

  if (missing.length > 0)
    return fail(id, desc, ["doc2"], `Missing officer positions: ${missing.join(", ")}`);
  return pass(id, desc, ["doc2"]);
}

// ─── Run all ─────────────────────────────────────────────────────────────────

export function runAllChecks(pkg: FilingPackage): CheckResult[] {
  return [
    math001(pkg),
    math002(pkg),
    math003(pkg),
    math004(pkg),
    math005(pkg),
    math006(pkg),
    math007(pkg),
    math008(pkg),
    math009(pkg),
    math010(pkg),
    math011(pkg),
    math012(pkg),
  ];
}
