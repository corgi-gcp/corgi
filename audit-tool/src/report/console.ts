/**
 * Console report renderer — chalk + cli-table3.
 */
import chalk from "chalk";
import Table from "cli-table3";
import type { AuditReport, CheckResult, CheckStatus } from "../types";

const STATUS_COLORS: Record<CheckStatus, (s: string) => string> = {
  PASS: (s) => chalk.green(s),
  FAIL: (s) => chalk.bold.red(s),
  WARN: (s) => chalk.yellow(s),
  SKIP: (s) => chalk.gray(s),
};

const STATUS_ICONS: Record<CheckStatus, string> = {
  PASS: "✓",
  FAIL: "✗",
  WARN: "⚠",
  SKIP: "–",
};

function colorStatus(status: CheckStatus): string {
  const icon = STATUS_ICONS[status];
  return STATUS_COLORS[status](`${icon} ${status}`);
}

function renderCategory(
  results: CheckResult[],
  category: "A" | "B" | "C",
  title: string
): void {
  const filtered = results.filter((r) => r.category === category);
  if (filtered.length === 0) return;

  console.log("\n" + chalk.bold.white(title));

  const table = new Table({
    head: [
      chalk.bold("ID"),
      chalk.bold("Description"),
      chalk.bold("Status"),
      chalk.bold("Detail"),
    ],
    colWidths: [12, 54, 14, 42],
    wordWrap: true,
    style: { head: [], border: ["gray"] },
  });

  for (const r of filtered) {
    const detail = r.detail ?? "";
    const truncatedDetail = detail.length > 80 ? detail.slice(0, 77) + "..." : detail;
    table.push([
      chalk.dim(r.id),
      r.description,
      colorStatus(r.status),
      r.status === "FAIL" ? chalk.red(truncatedDetail) :
        r.status === "WARN" ? chalk.yellow(truncatedDetail) :
          chalk.dim(truncatedDetail),
    ]);
  }

  console.log(table.toString());
}

export function render(report: AuditReport): void {
  console.log("\n" + chalk.bold.bgBlue.white("  UTAH CAPTIVE INSURANCE REGULATORY AUDIT  "));
  console.log(chalk.dim(`  Run: ${report.runAt}  |  Docs: ${report.docsDir}`));

  renderCategory(report.results, "A", "CATEGORY A — CROSS-DOCUMENT CONSISTENCY");
  renderCategory(report.results, "B", "CATEGORY B — INTRA-DOCUMENT MATH & LOGIC");
  renderCategory(report.results, "C", "CATEGORY C — UTAH REGULATORY COMPLIANCE");

  const { passed, failed, warned, skipped, total } = report.summary;

  console.log("\n" + "─".repeat(70));
  const summaryParts = [
    chalk.green(`${passed} passed`),
    chalk.bold.red(`${failed} failed`),
    chalk.yellow(`${warned} warned`),
    chalk.gray(`${skipped} skipped`),
    chalk.dim(`(${total} total)`),
  ];
  console.log("  SUMMARY: " + summaryParts.join("  ·  "));
  console.log("─".repeat(70) + "\n");

  if (failed > 0) {
    console.log(chalk.bold.red("FILING PACKAGE HAS ISSUES REQUIRING ATTENTION BEFORE SUBMISSION.\n"));
  } else if (warned > 0) {
    console.log(chalk.yellow("Filing package passed with warnings — review flagged items.\n"));
  } else {
    console.log(chalk.green("Filing package passed all checks.\n"));
  }
}
