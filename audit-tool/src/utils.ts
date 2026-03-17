/**
 * Shared utility functions for the audit tool.
 */

// ─── Fuzzy name matching ────────────────────────────────────────────────────

const STRIP_SUFFIXES = /\b(inc\.?|llc\.?|corp\.?|ltd\.?|co\.?|company|corporation|insurance|captive)\b/gi;
const NORMALIZE = /[^a-z0-9 ]/g;

function normalizeNameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(STRIP_SUFFIXES, "")
    .replace(NORMALIZE, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Returns a similarity score 0–1 between two name strings.
 * Strips common corporate suffixes, normalizes whitespace and punctuation,
 * and uses token overlap (Jaccard-like) ratio.
 */
export function nameSimScore(a: string, b: string): number {
  const tokA = new Set(normalizeNameTokens(a));
  const tokB = new Set(normalizeNameTokens(b));
  if (tokA.size === 0 && tokB.size === 0) return 1;
  if (tokA.size === 0 || tokB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokA) if (tokB.has(t)) intersection++;
  const union = new Set([...tokA, ...tokB]).size;
  return intersection / union;
}

/**
 * Fuzzy-matches a candidate against a set of reference strings.
 * Returns the best score found.
 */
export function bestFuzzyScore(candidate: string, references: string[]): number {
  if (!references.length) return 0;
  return Math.max(...references.map((r) => nameSimScore(candidate, r)));
}

export type MatchStrength = "strong" | "weak" | "none";

export function scoreToStrength(score: number): MatchStrength {
  if (score >= 0.75) return "strong";
  if (score >= 0.5) return "weak";
  return "none";
}

// ─── Currency parsing ────────────────────────────────────────────────────────

/**
 * Parses human-readable currency strings into a raw number.
 * Handles: "$5,000,000", "5M", "5.5M", "$250K", "5000000", etc.
 */
export function parseCurrency(s: string | number | null | undefined): number {
  if (s === null || s === undefined) return NaN;
  if (typeof s === "number") return s;
  const str = s.trim().replace(/[$,\s]/g, "");
  const mMatch = str.match(/^([\d.]+)\s*[Mm]$/);
  if (mMatch) return parseFloat(mMatch[1]) * 1_000_000;
  const kMatch = str.match(/^([\d.]+)\s*[Kk]$/);
  if (kMatch) return parseFloat(kMatch[1]) * 1_000;
  const n = parseFloat(str);
  return isNaN(n) ? NaN : n;
}

// ─── Date parsing & gap detection ───────────────────────────────────────────

const MONTH_NAMES: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
  april: 3, apr: 3, may: 4, june: 5, jun: 5,
  july: 6, jul: 6, august: 7, aug: 7, september: 8, sep: 8, sept: 8,
  october: 9, oct: 9, november: 10, nov: 10, december: 11, dec: 11,
};

/**
 * Parses an employment date string into a Date object.
 * Supports: "Present", "Current", "2024", "01/2024", "January 2024", "2024-01", ISO dates.
 * Returns null if unparseable.
 */
export function parseEmploymentDate(s: string): Date | null {
  if (!s) return null;
  const norm = s.trim().toLowerCase();
  if (norm === "present" || norm === "current" || norm === "now") return new Date();

  // ISO: 2024-01 or 2024-01-15
  const isoMatch = norm.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (isoMatch) return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, 1);

  // MM/YYYY or M/YYYY
  const slashMatch = norm.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return new Date(parseInt(slashMatch[2]), parseInt(slashMatch[1]) - 1, 1);

  // "Month YYYY" or "Month, YYYY"
  const monthMatch = norm.match(/^([a-z]+),?\s+(\d{4})$/);
  if (monthMatch) {
    const month = MONTH_NAMES[monthMatch[1]];
    if (month !== undefined) return new Date(parseInt(monthMatch[2]), month, 1);
  }

  // Just a year
  const yearMatch = norm.match(/^(\d{4})$/);
  if (yearMatch) return new Date(parseInt(yearMatch[1]), 0, 1);

  // Fall back to native Date.parse
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns the number of days between two date strings.
 * Returns null if either date cannot be parsed.
 */
export function dateGapDays(endOfPrior: string, startOfNext: string): number | null {
  const d1 = parseEmploymentDate(endOfPrior);
  const d2 = parseEmploymentDate(startOfNext);
  if (!d1 || !d2) return null;
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Given an array of employment entries (already sorted by start date),
 * returns a list of gaps > threshold days between consecutive entries.
 */
export interface EmploymentGap {
  afterEmployer: string;
  beforeEmployer: string;
  gapDays: number;
}

export function findEmploymentGaps(
  entries: Array<{ employer: string; startDate: string; endDate: string }>,
  thresholdDays = 183
): EmploymentGap[] {
  if (entries.length < 2) return [];
  const gaps: EmploymentGap[] = [];
  for (let i = 0; i < entries.length - 1; i++) {
    const gap = dateGapDays(entries[i].endDate, entries[i + 1].startDate);
    if (gap !== null && gap > thresholdDays) {
      gaps.push({
        afterEmployer: entries[i].employer,
        beforeEmployer: entries[i + 1].employer,
        gapDays: gap,
      });
    }
  }
  return gaps;
}

/**
 * Checks whether an employment history covers at least 10 years back from today.
 * Returns true if earliest start date ≤ 10 years ago.
 */
export function coversLastTenYears(entries: Array<{ startDate: string }>): boolean {
  if (!entries.length) return false;
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  for (const e of entries) {
    const d = parseEmploymentDate(e.startDate);
    if (d && d <= tenYearsAgo) return true;
  }
  return false;
}

// ─── JSON extraction helper ──────────────────────────────────────────────────

/**
 * Strips markdown code fences from an LLM response and parses JSON.
 * Returns null on any failure.
 */
export function extractJSON<T>(response: string): T | null {
  try {
    // Strip ```json ... ``` or ``` ... ```
    const stripped = response
      .replace(/^```(?:json)?\s*/im, "")
      .replace(/\s*```\s*$/im, "")
      .trim();
    return JSON.parse(stripped) as T;
  } catch {
    // Try to find the first { ... } block
    const match = response.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ─── Text truncation ─────────────────────────────────────────────────────────

/**
 * Truncates raw document text for Claude prompt usage.
 * Keeps first and last portions to preserve header/footer context.
 */
export function truncateText(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  const half = Math.floor(maxChars / 2);
  return text.slice(0, half) + "\n\n[... document truncated ...]\n\n" + text.slice(-half);
}
