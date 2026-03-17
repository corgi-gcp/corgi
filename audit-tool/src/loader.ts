/**
 * loader.ts — discovers .docx files, extracts raw text via mammoth,
 * calls Claude Haiku for structured extraction, returns FilingPackage.
 */
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { extractDoc } from "./extractor/extract";
import type {
  FilingPackage,
  ExtractedDoc,
  CompanyDetails,
  DirectorsOfficers,
  ServiceProviders,
  FormationCapitalization,
  LinesCoverage,
  BiographicalAffidavits,
  BusinessPlan,
  InvestmentPolicy,
  ArticlesOfIncorporation,
  Bylaws,
  OperatingAgreement,
  MembershipAgreement,
  OfficerRecord,
} from "./types";

// ─── Filename patterns ───────────────────────────────────────────────────────

const DOC_PATTERNS: Array<{ docId: string; patterns: RegExp[] }> = [
  { docId: "doc1", patterns: [/^1\./i, /captive insurance company details/i] },
  { docId: "doc2", patterns: [/^2\./i, /directors.*managers.*officers/i, /managers.*directors.*officers/i] },
  { docId: "doc3", patterns: [/^3\./i, /service providers/i] },
  { docId: "doc4", patterns: [/^4\./i, /formation.*capitalization/i, /capitalization.*formation/i] },
  { docId: "doc6", patterns: [/^6\./i, /lines of coverage/i] },
  { docId: "doc8", patterns: [/^8\./i, /business plan/i] },
  { docId: "doc11", patterns: [/^11\./i, /investment policy/i] },
  { docId: "doc12", patterns: [/^12\./i, /articles of incorporation/i] },
  { docId: "doc13", patterns: [/^13\./i, /bylaws/i] },
  { docId: "doc15", patterns: [/^15\./i, /operating agreement/i] },
  { docId: "membership", patterns: [/membership agreement/i] },
];

const BIO_AFFIDAVIT_PATTERN = /^7[a-d]?\.|biographical affidavit/i;

// ─── Text extraction ─────────────────────────────────────────────────────────

async function extractText(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

// ─── Single document loader ──────────────────────────────────────────────────

async function loadDoc<T>(
  filePath: string | null,
  docId: string,
  verbose: boolean
): Promise<ExtractedDoc<T>> {
  if (!filePath) {
    return { docId, rawText: "", data: null, missing: true };
  }

  let rawText = "";
  try {
    rawText = await extractText(filePath);
  } catch (err) {
    return {
      docId,
      rawText: "",
      data: null,
      missing: false,
      extractionError: `mammoth failed: ${String(err)}`,
    };
  }

  let data: T | null = null;
  let extractionError: string | undefined;
  try {
    data = await extractDoc<T>(docId, rawText, verbose);
    if (data === null) extractionError = "Claude returned null or unparseable JSON";
  } catch (err) {
    extractionError = String(err);
  }

  return { docId, rawText, data, missing: false, extractionError };
}

// ─── Biographical affidavit merger ───────────────────────────────────────────

async function loadBioAffidavits(
  bioPaths: string[],
  verbose: boolean
): Promise<ExtractedDoc<BiographicalAffidavits>> {
  if (bioPaths.length === 0) {
    return { docId: "doc7", rawText: "", data: null, missing: true };
  }

  // Concatenate text from all affidavit files
  const texts: string[] = [];
  for (const p of bioPaths) {
    try {
      texts.push(await extractText(p));
    } catch {
      // skip unreadable file
    }
  }
  const combinedText = texts.join("\n\n--- NEXT AFFIDAVIT ---\n\n");

  let data: BiographicalAffidavits | null = null;
  let extractionError: string | undefined;
  try {
    data = await extractDoc<BiographicalAffidavits>("doc7", combinedText, verbose);
    if (data === null) extractionError = "Claude returned null or unparseable JSON";
  } catch (err) {
    extractionError = String(err);
  }

  return { docId: "doc7", rawText: combinedText, data, missing: false, extractionError };
}

// ─── Post-process doc2 to derive directors/officers arrays ───────────────────

function processDoc2(raw: { all?: OfficerRecord[] } | null): DirectorsOfficers | null {
  if (!raw || !raw.all) return null;
  const all = raw.all;
  return {
    all,
    directors: all.filter((p) => p.isDirector),
    officers: all,
  };
}

// ─── Main loader ─────────────────────────────────────────────────────────────

export async function loadFilingPackage(
  docsDir: string,
  verbose = false
): Promise<FilingPackage> {
  const files = fs.readdirSync(docsDir).filter((f) => f.toLowerCase().endsWith(".docx"));

  // Map docId → file path
  const fileMap: Record<string, string | null> = {};
  const bioPaths: string[] = [];

  for (const pattern of DOC_PATTERNS) {
    fileMap[pattern.docId] = null;
  }

  for (const file of files) {
    const fullPath = path.join(docsDir, file);

    if (BIO_AFFIDAVIT_PATTERN.test(file)) {
      bioPaths.push(fullPath);
      continue;
    }

    for (const { docId, patterns } of DOC_PATTERNS) {
      if (patterns.some((p) => p.test(file))) {
        if (!fileMap[docId]) fileMap[docId] = fullPath;
        break;
      }
    }
  }

  if (verbose) {
    console.error("[DEBUG] File map:", fileMap);
    console.error("[DEBUG] Bio affidavit files:", bioPaths);
  }

  // Parallel extraction
  const [doc1, doc2Raw, doc3, doc4, doc6, doc7, doc8, doc11, doc12, doc13, doc15, membership] =
    await Promise.all([
      loadDoc<CompanyDetails>(fileMap["doc1"], "doc1", verbose),
      loadDoc<{ all: OfficerRecord[] }>(fileMap["doc2"], "doc2", verbose),
      loadDoc<ServiceProviders>(fileMap["doc3"], "doc3", verbose),
      loadDoc<FormationCapitalization>(fileMap["doc4"], "doc4", verbose),
      loadDoc<LinesCoverage>(fileMap["doc6"], "doc6", verbose),
      loadBioAffidavits(bioPaths, verbose),
      loadDoc<BusinessPlan>(fileMap["doc8"], "doc8", verbose),
      loadDoc<InvestmentPolicy>(fileMap["doc11"], "doc11", verbose),
      loadDoc<ArticlesOfIncorporation>(fileMap["doc12"], "doc12", verbose),
      loadDoc<Bylaws>(fileMap["doc13"], "doc13", verbose),
      loadDoc<OperatingAgreement>(fileMap["doc15"], "doc15", verbose),
      loadDoc<MembershipAgreement>(fileMap["membership"], "membership", verbose),
    ]);

  // Process doc2 into proper DirectorsOfficers shape
  const doc2: ExtractedDoc<DirectorsOfficers> = {
    ...doc2Raw,
    data: processDoc2(doc2Raw.data as { all?: OfficerRecord[] } | null),
  };

  return { doc1, doc2, doc3, doc4, doc6, doc7, doc8, doc11, doc12, doc13, doc15, membership };
}
