/**
 * Category C — Utah Regulatory Compliance Checks (10 checks)
 * Based on Utah Insurance Code Title 31A, Chapter 37 and Utah Admin. Code R590-250.
 */
import type { FilingPackage, CheckResult, ExtractedDoc } from "../types";
import { coversLastTenYears, findEmploymentGaps } from "../utils";

function skip(id: string, description: string, docs: string[], reason: string): CheckResult {
  return { id, category: "C", description, status: "SKIP", detail: reason, docsInvolved: docs };
}
function pass(id: string, description: string, docs: string[]): CheckResult {
  return { id, category: "C", description, status: "PASS", docsInvolved: docs };
}
function fail(id: string, description: string, docs: string[], detail: string): CheckResult {
  return { id, category: "C", description, status: "FAIL", detail, docsInvolved: docs };
}
function warn(id: string, description: string, docs: string[], detail: string): CheckResult {
  return { id, category: "C", description, status: "WARN", detail, docsInvolved: docs };
}
function docAvailable<T>(doc: ExtractedDoc<T>): doc is ExtractedDoc<T> & { data: T } {
  return !doc.missing && doc.data !== null;
}

// ─── REG-001: Minimum initial capital ≥ $250,000 (§31A-37-203) ──────────────

function reg001(pkg: FilingPackage): CheckResult {
  const id = "REG-001";
  const desc = "Initial capital meets Utah minimum of $250,000 (§31A-37-203)";
  if (!docAvailable(pkg.doc4)) return skip(id, desc, ["doc4"], "Document 4 not available");

  const cap = pkg.doc4.data.totalCapitalization;
  if (!cap) return skip(id, desc, ["doc4"], "Total capitalization not extracted");

  if (cap < 250000)
    return fail(id, desc, ["doc4"], `Total capitalization $${cap.toLocaleString()} is below the $250,000 statutory minimum`);
  return pass(id, desc, ["doc4"]);
}

// ─── REG-002: At least 3 directors (Utah corporate law) ─────────────────────

function reg002(pkg: FilingPackage): CheckResult {
  const id = "REG-002";
  const desc = "Board has at least 3 directors (Utah corporate law requirement)";
  if (!docAvailable(pkg.doc2)) return skip(id, desc, ["doc2"], "Document 2 not available");

  const count = pkg.doc2.data.directors.length;
  if (count < 3)
    return fail(id, desc, ["doc2"], `Only ${count} director(s) identified; Utah law requires a minimum of 3`);
  return pass(id, desc, ["doc2"]);
}

// ─── REG-003: Biographical affidavit for every director/officer ─────────────

function reg003(pkg: FilingPackage): CheckResult {
  const id = "REG-003";
  const desc = "Biographical affidavit filed for every director and officer";
  const docs = ["doc2", "doc7"];

  if (!docAvailable(pkg.doc2)) return skip(id, desc, docs, "Document 2 not available");
  if (!docAvailable(pkg.doc7)) return skip(id, desc, docs, "Biographical affidavits not available");

  const requiredNames = pkg.doc2.data.all.map((p) => p.fullName);
  const affidavitNames = pkg.doc7.data.affidavits.map((a) => a.subjectName);
  const count = pkg.doc7.data.affidavits.length;

  if (count < requiredNames.length)
    return fail(id, desc, docs,
      `${count} affidavit(s) found but ${requiredNames.length} person(s) listed in Doc 2. Missing affidavits for some officers/directors.`);
  return pass(id, desc, docs);
}

// ─── REG-004: Business plan filed (§31A-37-204) ──────────────────────────────

function reg004(pkg: FilingPackage): CheckResult {
  const id = "REG-004";
  const desc = "Business plan included in the filing (§31A-37-204)";

  if (pkg.doc8.missing)
    return fail(id, desc, ["doc8"], "Business plan document (Doc 8) is missing from the filing package");
  if (pkg.doc8.data === null)
    return warn(id, desc, ["doc8"], "Business plan file found but content could not be extracted — verify manually");
  return pass(id, desc, ["doc8"]);
}

// ─── REG-005: Articles reference Utah Title 31A Chapter 37 ──────────────────

function reg005(pkg: FilingPackage): CheckResult {
  const id = "REG-005";
  const desc = "Articles of Incorporation reference Utah Title 31A, Chapter 37 (captive insurance law)";

  if (!docAvailable(pkg.doc12)) return skip(id, desc, ["doc12"], "Document 12 not available");

  if (!pkg.doc12.data.referencesUtahTitle31AChap37)
    return fail(id, desc, ["doc12"],
      "Articles of Incorporation do not appear to reference Utah Title 31A, Chapter 37 — required for captive insurance companies");
  return pass(id, desc, ["doc12"]);
}

// ─── REG-006: Investment policy references §31A-18-110 and §31A-18-111 ───────

function reg006(pkg: FilingPackage): CheckResult {
  const id = "REG-006";
  const desc = "Investment policy references Utah Code §31A-18-110 and §31A-18-111";

  if (!docAvailable(pkg.doc11)) return skip(id, desc, ["doc11"], "Document 11 not available");

  const missing: string[] = [];
  if (!pkg.doc11.data.referencesUtah110) missing.push("§31A-18-110");
  if (!pkg.doc11.data.referencesUtah111) missing.push("§31A-18-111");

  if (missing.length > 0)
    return fail(id, desc, ["doc11"], `Investment policy does not reference: ${missing.join(", ")}`);
  return pass(id, desc, ["doc11"]);
}

// ─── REG-007: Captive designated as "association captive" ────────────────────

function reg007(pkg: FilingPackage): CheckResult {
  const id = "REG-007";
  const desc = 'Captive correctly designated as "association captive" with qualifying association documented';

  if (!docAvailable(pkg.doc1)) return skip(id, desc, ["doc1"], "Document 1 not available");

  const captiveType = pkg.doc1.data.captiveType?.toLowerCase() ?? "";
  const assocName = pkg.doc1.data.associationName;

  if (!captiveType.includes("association"))
    return fail(id, desc, ["doc1"], `Captive type is "${pkg.doc1.data.captiveType}" — must be "association captive"`);
  if (!assocName)
    return warn(id, desc, ["doc1"], 'Captive type is "association captive" but no association name was extracted — verify association is documented');
  return pass(id, desc, ["doc1"]);
}

// ─── REG-008: All 6 service provider categories populated ────────────────────

function reg008(pkg: FilingPackage): CheckResult {
  const id = "REG-008";
  const desc = "All 6 required service provider categories are populated";

  if (!docAvailable(pkg.doc3)) return skip(id, desc, ["doc3"], "Document 3 not available");

  const providers = pkg.doc3.data;
  const required: Array<{ label: string; value: unknown }> = [
    { label: "Captive Manager", value: providers.captiveManager },
    { label: "Legal Counsel", value: providers.legalCounsel },
    { label: "Independent Auditor", value: providers.auditor },
    { label: "Actuary", value: providers.actuary },
    { label: "Investment Advisor", value: providers.investmentAdvisor },
    { label: "Banking Institution", value: providers.bank },
  ];

  const missing = required.filter((r) => !r.value).map((r) => r.label);

  if (missing.length > 0)
    return fail(id, desc, ["doc3"], `Missing service providers: ${missing.join(", ")}`);
  return pass(id, desc, ["doc3"]);
}

// ─── REG-009: 10-year employment history in each biographical affidavit ──────

function reg009(pkg: FilingPackage): CheckResult {
  const id = "REG-009";
  const desc = "Each biographical affidavit covers at least 10 years of employment history";

  if (!docAvailable(pkg.doc7)) return skip(id, desc, ["doc7"], "Biographical affidavits not available");

  const insufficient: string[] = [];
  for (const aff of pkg.doc7.data.affidavits) {
    const covered = aff.tenYearCoverageConfirmed || coversLastTenYears(aff.employmentHistory);
    if (!covered) insufficient.push(`"${aff.subjectName}"`);
  }

  if (insufficient.length > 0)
    return fail(id, desc, ["doc7"],
      `Affidavits that may not cover 10 years of employment history: ${insufficient.join(", ")}`);
  return pass(id, desc, ["doc7"]);
}

// ─── REG-010: No unexplained employment gaps > 6 months ──────────────────────

function reg010(pkg: FilingPackage): CheckResult {
  const id = "REG-010";
  const desc = "No unexplained employment gaps > 6 months in biographical affidavits";

  if (!docAvailable(pkg.doc7)) return skip(id, desc, ["doc7"], "Biographical affidavits not available");

  const gapDetails: string[] = [];
  for (const aff of pkg.doc7.data.affidavits) {
    const sorted = [...aff.employmentHistory].sort((a, b) => {
      const da = new Date(a.startDate).getTime();
      const db = new Date(b.startDate).getTime();
      return da - db;
    });
    const gaps = findEmploymentGaps(sorted, 183);
    for (const gap of gaps) {
      gapDetails.push(
        `${aff.subjectName}: ${gap.gapDays}-day gap between "${gap.afterEmployer}" and "${gap.beforeEmployer}"`
      );
    }
  }

  if (gapDetails.length > 0)
    return warn(id, desc, ["doc7"],
      `Potential unexplained gaps (verify explanation is provided): ${gapDetails.join("; ")}`);
  return pass(id, desc, ["doc7"]);
}

// ─── Run all ─────────────────────────────────────────────────────────────────

export function runAllChecks(pkg: FilingPackage): CheckResult[] {
  return [
    reg001(pkg),
    reg002(pkg),
    reg003(pkg),
    reg004(pkg),
    reg005(pkg),
    reg006(pkg),
    reg007(pkg),
    reg008(pkg),
    reg009(pkg),
    reg010(pkg),
  ];
}
