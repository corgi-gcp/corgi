/**
 * Category A — Cross-Document Consistency Checks (14 checks)
 */
import type { FilingPackage, CheckResult, ExtractedDoc } from "../types";
import { bestFuzzyScore, scoreToStrength, nameSimScore } from "../utils";

function skip(id: string, description: string, docs: string[], reason: string): CheckResult {
  return { id, category: "A", description, status: "SKIP", detail: reason, docsInvolved: docs };
}

function pass(id: string, description: string, docs: string[], detail?: string): CheckResult {
  return { id, category: "A", description, status: "PASS", detail, docsInvolved: docs };
}

function fail(id: string, description: string, docs: string[], detail: string): CheckResult {
  return { id, category: "A", description, status: "FAIL", detail, docsInvolved: docs };
}

function warn(id: string, description: string, docs: string[], detail: string): CheckResult {
  return { id, category: "A", description, status: "WARN", detail, docsInvolved: docs };
}

function docAvailable<T>(doc: ExtractedDoc<T>): doc is ExtractedDoc<T> & { data: T } {
  return !doc.missing && doc.data !== null;
}

// ─── CROSS-001: Legal entity name consistent everywhere ──────────────────────

function cross001(pkg: FilingPackage): CheckResult {
  const id = "CROSS-001";
  const desc = "Legal entity name consistent across all documents";
  const docs = ["doc1", "doc12"];

  if (!docAvailable(pkg.doc1)) return skip(id, desc, docs, "Document 1 not available");
  const canonical = pkg.doc1.data.legalName;
  if (!canonical) return skip(id, desc, docs, "Legal name not extracted from Document 1");

  const checks: Array<{ label: string; name: string | undefined }> = [
    { label: "Doc 12 (Articles)", name: pkg.doc12.data?.legalName },
  ];

  const mismatches: string[] = [];
  const warnings: string[] = [];

  for (const { label, name } of checks) {
    if (!name) continue;
    const score = nameSimScore(canonical, name);
    const strength = scoreToStrength(score);
    if (strength === "none") mismatches.push(`${label}: "${name}"`);
    else if (strength === "weak") warnings.push(`${label}: "${name}" (score ${(score * 100).toFixed(0)}%)`);
  }

  if (mismatches.length > 0)
    return fail(id, desc, docs, `Name mismatch vs "${canonical}": ${mismatches.join("; ")}`);
  if (warnings.length > 0)
    return warn(id, desc, docs, `Possible name variation vs "${canonical}": ${warnings.join("; ")}`);
  return pass(id, desc, docs);
}

// ─── CROSS-002: Directors in Doc 2 match Doc 12 initial directors ────────────

function cross002(pkg: FilingPackage): CheckResult {
  const id = "CROSS-002";
  const desc = "Directors in Doc 2 match Doc 12 initial directors";
  const docs = ["doc2", "doc12"];

  if (!docAvailable(pkg.doc2)) return skip(id, desc, docs, "Document 2 not available");
  if (!docAvailable(pkg.doc12)) return skip(id, desc, docs, "Document 12 not available");

  const doc2Directors = pkg.doc2.data.directors.map((d) => d.fullName);
  const doc12Directors = pkg.doc12.data.initialDirectors.map((d) => d.fullName);

  if (doc12Directors.length === 0)
    return skip(id, desc, docs, "No initial directors extracted from Doc 12");

  const missing: string[] = [];
  for (const d12 of doc12Directors) {
    const score = bestFuzzyScore(d12, doc2Directors);
    if (scoreToStrength(score) === "none") missing.push(`"${d12}"`);
  }

  if (missing.length > 0)
    return fail(id, desc, docs, `Doc 12 directors not found in Doc 2: ${missing.join(", ")}`);
  return pass(id, desc, docs);
}

// ─── CROSS-003: Biographical affidavit names match Doc 2 roster ─────────────

function cross003(pkg: FilingPackage): CheckResult {
  const id = "CROSS-003";
  const desc = "Biographical affidavit names match Doc 2 director/officer roster";
  const docs = ["doc2", "doc7"];

  if (!docAvailable(pkg.doc2)) return skip(id, desc, docs, "Document 2 not available");
  if (!docAvailable(pkg.doc7)) return skip(id, desc, docs, "Document 7 (biographical affidavits) not available");

  const doc2Names = pkg.doc2.data.all.map((p) => p.fullName);
  const affidavitNames = pkg.doc7.data.affidavits.map((a) => a.subjectName);

  const unmatched: string[] = [];
  for (const name of doc2Names) {
    const score = bestFuzzyScore(name, affidavitNames);
    if (scoreToStrength(score) === "none") unmatched.push(`"${name}"`);
  }

  if (unmatched.length > 0)
    return fail(id, desc, docs, `No affidavit found for: ${unmatched.join(", ")}`);
  return pass(id, desc, docs);
}

// ─── CROSS-004: Registered agent: Doc 1 matches Doc 12 ──────────────────────

function cross004(pkg: FilingPackage): CheckResult {
  const id = "CROSS-004";
  const desc = "Registered agent consistent: Doc 1 matches Doc 12 (Articles)";
  const docs = ["doc1", "doc12"];

  if (!docAvailable(pkg.doc1)) return skip(id, desc, docs, "Document 1 not available");
  if (!docAvailable(pkg.doc12)) return skip(id, desc, docs, "Document 12 not available");

  const name1 = pkg.doc1.data.registeredAgentName;
  const name12 = pkg.doc12.data.registeredAgentName;

  if (!name1 || !name12) return skip(id, desc, docs, "Registered agent name not extracted from one or both documents");

  const score = nameSimScore(name1, name12);
  const strength = scoreToStrength(score);

  if (strength === "none")
    return fail(id, desc, docs, `Doc 1: "${name1}" vs Doc 12: "${name12}"`);
  if (strength === "weak")
    return warn(id, desc, docs, `Possible variation: Doc 1: "${name1}" vs Doc 12: "${name12}"`);
  return pass(id, desc, docs);
}

// ─── CROSS-005: Total capitalization Doc 4 = opening surplus Doc 8 ──────────

function cross005(pkg: FilingPackage): CheckResult {
  const id = "CROSS-005";
  const desc = "Total capitalization (Doc 4) matches opening surplus (Doc 8)";
  const docs = ["doc4", "doc8"];

  if (!docAvailable(pkg.doc4)) return skip(id, desc, docs, "Document 4 not available");
  if (!docAvailable(pkg.doc8)) return skip(id, desc, docs, "Document 8 not available");

  const cap = pkg.doc4.data.totalCapitalization;
  const surplus = pkg.doc8.data.openingSurplus;

  if (!cap || !surplus) return skip(id, desc, docs, "Capitalization or surplus value not extracted");

  const diff = Math.abs(cap - surplus);
  const pctDiff = diff / Math.max(cap, 1);

  if (pctDiff > 0.05)
    return fail(id, desc, docs, `Doc 4 total cap: $${cap.toLocaleString()} vs Doc 8 opening surplus: $${surplus.toLocaleString()} (diff: $${diff.toLocaleString()})`);
  if (pctDiff > 0.01)
    return warn(id, desc, docs, `Minor discrepancy: Doc 4: $${cap.toLocaleString()} vs Doc 8: $${surplus.toLocaleString()}`);
  return pass(id, desc, docs);
}

// ─── CROSS-006: All 9 coverage lines: Doc 6 matches Doc 8 ───────────────────

function cross006(pkg: FilingPackage): CheckResult {
  const id = "CROSS-006";
  const desc = "All coverage lines in Doc 6 are referenced in Doc 8 (Business Plan)";
  const docs = ["doc6", "doc8"];

  if (!docAvailable(pkg.doc6)) return skip(id, desc, docs, "Document 6 not available");
  if (!docAvailable(pkg.doc8)) return skip(id, desc, docs, "Document 8 not available");

  const doc6Lines = pkg.doc6.data.lines.map((l) => l.lineName);
  const doc8Lines = pkg.doc8.data.linesOfCoverage;

  const missing: string[] = [];
  for (const line of doc6Lines) {
    const score = bestFuzzyScore(line, doc8Lines);
    if (scoreToStrength(score) === "none") missing.push(`"${line}"`);
  }

  if (missing.length > 0)
    return fail(id, desc, docs, `Lines in Doc 6 not found in Doc 8: ${missing.join(", ")}`);
  return pass(id, desc, docs);
}

// ─── CROSS-007: All 9 coverage lines: Doc 6 matches Membership Agreement ────

function cross007(pkg: FilingPackage): CheckResult {
  const id = "CROSS-007";
  const desc = "All coverage lines in Doc 6 are referenced in the Membership Agreement";
  const docs = ["doc6", "membership"];

  if (!docAvailable(pkg.doc6)) return skip(id, desc, docs, "Document 6 not available");
  if (!docAvailable(pkg.membership)) return skip(id, desc, docs, "Membership Agreement not available");

  const doc6Lines = pkg.doc6.data.lines.map((l) => l.lineName);
  const maLines = pkg.membership.data.linesOfCoverage;

  const missing: string[] = [];
  for (const line of doc6Lines) {
    const score = bestFuzzyScore(line, maLines);
    if (scoreToStrength(score) === "none") missing.push(`"${line}"`);
  }

  if (missing.length > 0)
    return fail(id, desc, docs, `Lines in Doc 6 not found in Membership Agreement: ${missing.join(", ")}`);
  return pass(id, desc, docs);
}

// ─── CROSS-008: Captive manager: Doc 3 matches Doc 8 reference ──────────────

function cross008(pkg: FilingPackage): CheckResult {
  const id = "CROSS-008";
  const desc = "Captive manager name: Doc 3 matches Doc 8 reference";
  const docs = ["doc3", "doc8"];

  if (!docAvailable(pkg.doc3)) return skip(id, desc, docs, "Document 3 not available");
  if (!docAvailable(pkg.doc8)) return skip(id, desc, docs, "Document 8 not available");

  const mgr3 = pkg.doc3.data.captiveManager?.companyName;
  const mgr8 = pkg.doc8.data.captiveManagerReference;

  if (!mgr3 || !mgr8) return skip(id, desc, docs, "Captive manager name not extracted from one or both documents");

  const score = nameSimScore(mgr3, mgr8);
  const strength = scoreToStrength(score);

  if (strength === "none")
    return fail(id, desc, docs, `Doc 3: "${mgr3}" vs Doc 8: "${mgr8}"`);
  if (strength === "weak")
    return warn(id, desc, docs, `Possible variation: Doc 3: "${mgr3}" vs Doc 8: "${mgr8}"`);
  return pass(id, desc, docs);
}

// ─── CROSS-009: Actuary: Doc 3 matches Doc 8 reference ──────────────────────

function cross009(pkg: FilingPackage): CheckResult {
  const id = "CROSS-009";
  const desc = "Actuarial firm name: Doc 3 matches Doc 8 reference";
  const docs = ["doc3", "doc8"];

  if (!docAvailable(pkg.doc3)) return skip(id, desc, docs, "Document 3 not available");
  if (!docAvailable(pkg.doc8)) return skip(id, desc, docs, "Document 8 not available");

  const act3 = pkg.doc3.data.actuary?.companyName;
  const act8 = pkg.doc8.data.actuaryReference;

  if (!act3 || !act8) return skip(id, desc, docs, "Actuary name not extracted from one or both documents");

  const score = nameSimScore(act3, act8);
  const strength = scoreToStrength(score);

  if (strength === "none")
    return fail(id, desc, docs, `Doc 3: "${act3}" vs Doc 8: "${act8}"`);
  if (strength === "weak")
    return warn(id, desc, docs, `Possible variation: Doc 3: "${act3}" vs Doc 8: "${act8}"`);
  return pass(id, desc, docs);
}

// ─── CROSS-010: Fiscal year end: Doc 4, 8, 13 agree ─────────────────────────

function cross010(pkg: FilingPackage): CheckResult {
  const id = "CROSS-010";
  const desc = "Fiscal year end consistent across Doc 4, Doc 8, and Doc 13 (Bylaws)";
  const docs = ["doc4", "doc8", "doc13"];

  const values: Array<{ label: string; value: string | undefined }> = [
    { label: "Doc 4", value: pkg.doc4.data?.fiscalYearEnd },
    { label: "Doc 8", value: pkg.doc8.data?.fiscalYearEnd },
    { label: "Doc 13", value: pkg.doc13.data?.fiscalYearEnd },
  ];

  const present = values.filter((v) => v.value);
  if (present.length < 2) return skip(id, desc, docs, "Fiscal year end not extracted from enough documents");

  const normalized = present.map((v) => ({ label: v.label, value: v.value!.toLowerCase().replace(/[^a-z0-9]/g, "") }));
  const base = normalized[0].value;
  const mismatches = normalized.slice(1).filter((v) => v.value !== base);

  if (mismatches.length > 0)
    return fail(id, desc, docs, `Mismatch: ${present[0].label}: "${present[0].value}" vs ${mismatches.map((m) => `${m.label}: "${m.value}"`).join(", ")}`);
  return pass(id, desc, docs);
}

// ─── CROSS-011: Investment custodian: Doc 11 matches Doc 3 bank ──────────────

function cross011(pkg: FilingPackage): CheckResult {
  const id = "CROSS-011";
  const desc = "Investment custodian (Doc 11) matches banking institution (Doc 3)";
  const docs = ["doc11", "doc3"];

  if (!docAvailable(pkg.doc11)) return skip(id, desc, docs, "Document 11 not available");
  if (!docAvailable(pkg.doc3)) return skip(id, desc, docs, "Document 3 not available");

  const custodian = pkg.doc11.data.custodianName;
  const bank = pkg.doc3.data.bank?.companyName;

  if (!custodian || !bank) return skip(id, desc, docs, "Custodian or bank name not extracted");

  const score = nameSimScore(custodian, bank);
  const strength = scoreToStrength(score);

  if (strength === "none")
    return warn(id, desc, docs, `Custodian "${custodian}" does not match bank "${bank}" — verify if different entities are expected`);
  return pass(id, desc, docs);
}

// ─── CROSS-012: Authorized shares: Doc 4 matches Doc 12 ─────────────────────

function cross012(pkg: FilingPackage): CheckResult {
  const id = "CROSS-012";
  const desc = "Authorized shares: Doc 4 matches Doc 12 (Articles of Incorporation)";
  const docs = ["doc4", "doc12"];

  if (!docAvailable(pkg.doc4)) return skip(id, desc, docs, "Document 4 not available");
  if (!docAvailable(pkg.doc12)) return skip(id, desc, docs, "Document 12 not available");

  const shares4 = pkg.doc4.data.authorizedShares;
  const shares12 = pkg.doc12.data.authorizedShares;

  if (!shares4 || !shares12) return skip(id, desc, docs, "Authorized shares not extracted from one or both documents");

  if (shares4 !== shares12)
    return fail(id, desc, docs, `Doc 4: ${shares4.toLocaleString()} shares vs Doc 12: ${shares12.toLocaleString()} shares`);
  return pass(id, desc, docs);
}

// ─── CROSS-013: Governing law = Utah in Doc 15 ──────────────────────────────

function cross013(pkg: FilingPackage): CheckResult {
  const id = "CROSS-013";
  const desc = "Governing law is Utah in Doc 15 (Operating Agreement)";
  const docs = ["doc15"];

  if (!docAvailable(pkg.doc15)) return skip(id, desc, docs, "Document 15 not available");

  const law = pkg.doc15.data.governingLaw?.toLowerCase() ?? "";
  if (!law.includes("utah"))
    return fail(id, desc, docs, `Governing law is "${pkg.doc15.data.governingLaw}" — expected Utah`);
  return pass(id, desc, docs);
}

// ─── CROSS-014: Governing law = Utah in Membership Agreement ─────────────────

function cross014(pkg: FilingPackage): CheckResult {
  const id = "CROSS-014";
  const desc = "Governing law is Utah in Membership Agreement";
  const docs = ["membership"];

  if (!docAvailable(pkg.membership)) return skip(id, desc, docs, "Membership Agreement not available");

  const law = pkg.membership.data.governingLaw?.toLowerCase() ?? "";
  if (!law.includes("utah"))
    return fail(id, desc, docs, `Governing law is "${pkg.membership.data.governingLaw}" — expected Utah`);
  return pass(id, desc, docs);
}

// ─── Run all ─────────────────────────────────────────────────────────────────

export function runAllChecks(pkg: FilingPackage): CheckResult[] {
  return [
    cross001(pkg),
    cross002(pkg),
    cross003(pkg),
    cross004(pkg),
    cross005(pkg),
    cross006(pkg),
    cross007(pkg),
    cross008(pkg),
    cross009(pkg),
    cross010(pkg),
    cross011(pkg),
    cross012(pkg),
    cross013(pkg),
    cross014(pkg),
  ];
}
