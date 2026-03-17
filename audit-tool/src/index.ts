/**
 * index.ts — CLI entry point for the Utah Captive Insurance Regulatory Audit Tool.
 *
 * Usage:
 *   npx ts-node src/index.ts --docs-dir <path> [--output report.html] [--verbose]
 */
import "dotenv/config";
import path from "path";
import { Command } from "commander";
import { loadFilingPackage } from "./loader";
import * as crossDoc from "./checks/crossDoc";
import * as intraMath from "./checks/intraMath";
import * as regulatory from "./checks/regulatory";
import * as consoleReport from "./report/console";
import * as htmlReport from "./report/html";
import type { AuditReport, CheckResult } from "./types";

const program = new Command();

program
  .name("utah-captive-audit")
  .description("Regulatory audit tool for Utah captive insurance filing packages")
  .requiredOption("--docs-dir <path>", "Path to directory containing .docx filing documents")
  .option("--output <path>", "Write HTML report to this file path")
  .option("--verbose", "Print extraction debug info to stderr", false)
  .option("--api-key <key>", "Anthropic API key (overrides ANTHROPIC_API_KEY env var)");

program.parse(process.argv);
const opts = program.opts<{
  docsDir: string;
  output?: string;
  verbose: boolean;
  apiKey?: string;
}>();

// Allow CLI override of API key
if (opts.apiKey) {
  process.env.ANTHROPIC_API_KEY = opts.apiKey;
}

const docsDir = path.resolve(opts.docsDir);

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY is not set. Use --api-key or set the environment variable.");
    process.exit(2);
  }

  console.log(`\nLoading filing documents from: ${docsDir}`);
  console.log("Extracting structured data via Claude Haiku (this may take 30–60 seconds)...\n");

  let pkg;
  try {
    pkg = await loadFilingPackage(docsDir, opts.verbose);
  } catch (err) {
    console.error("ERROR loading documents:", err);
    process.exit(2);
  }

  // Print extraction status
  const docEntries = [
    ["Doc 1 — Company Details", pkg.doc1],
    ["Doc 2 — Directors/Officers", pkg.doc2],
    ["Doc 3 — Service Providers", pkg.doc3],
    ["Doc 4 — Formation/Capitalization", pkg.doc4],
    ["Doc 6 — Lines of Coverage", pkg.doc6],
    ["Doc 7 — Biographical Affidavits", pkg.doc7],
    ["Doc 8 — Business Plan", pkg.doc8],
    ["Doc 11 — Investment Policy", pkg.doc11],
    ["Doc 12 — Articles of Incorporation", pkg.doc12],
    ["Doc 13 — Bylaws", pkg.doc13],
    ["Doc 15 — Operating Agreement", pkg.doc15],
    ["Membership Agreement", pkg.membership],
  ] as const;

  for (const [label, doc] of docEntries) {
    if (doc.missing) console.error(`  [MISSING] ${label}`);
    else if (doc.extractionError) console.error(`  [WARN] ${label}: ${doc.extractionError}`);
    else if (doc.data === null) console.error(`  [WARN] ${label}: extracted null`);
    else if (opts.verbose) console.error(`  [OK] ${label}`);
  }

  // Run all checks
  const results: CheckResult[] = [
    ...crossDoc.runAllChecks(pkg),
    ...intraMath.runAllChecks(pkg),
    ...regulatory.runAllChecks(pkg),
  ];

  // Build summary
  const summary = {
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    warned: results.filter((r) => r.status === "WARN").length,
    skipped: results.filter((r) => r.status === "SKIP").length,
    total: results.length,
  };

  const report: AuditReport = {
    runAt: new Date().toISOString(),
    docsDir,
    results,
    summary,
  };

  // Console output
  consoleReport.render(report);

  // Optional HTML output
  if (opts.output) {
    const outputPath = path.resolve(opts.output);
    htmlReport.generate(report, outputPath);
    console.log(`HTML report written to: ${outputPath}\n`);
  }

  // Exit code: 1 if any FAIL, 0 otherwise
  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(2);
});
