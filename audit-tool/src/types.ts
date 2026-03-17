// ─── Audit result types ────────────────────────────────────────────────────

export type CheckStatus = "PASS" | "FAIL" | "WARN" | "SKIP";

export interface CheckResult {
  id: string;
  category: "A" | "B" | "C";
  description: string;
  status: CheckStatus;
  detail?: string;
  docsInvolved: string[];
}

export interface AuditReport {
  runAt: string;
  docsDir: string;
  results: CheckResult[];
  summary: {
    passed: number;
    failed: number;
    warned: number;
    skipped: number;
    total: number;
  };
}

// ─── Extraction wrapper ─────────────────────────────────────────────────────

export interface ExtractedDoc<T> {
  docId: string;
  rawText: string;
  data: T | null;
  missing: boolean;
  extractionError?: string;
}

// ─── Domain types (one per document) ───────────────────────────────────────

export interface CompanyDetails {
  legalName: string;
  captiveType: string;
  registeredAgentName: string;
  registeredAgentAddress: string;
  domicileState: string;
  fiscalYearEnd: string;
  associationName: string;
}

export interface Person {
  fullName: string;
  address?: string;
}

export interface OfficerRecord extends Person {
  title: string;
  isDirector: boolean;
}

export interface DirectorsOfficers {
  directors: OfficerRecord[];
  officers: OfficerRecord[];
  all: OfficerRecord[];
}

export interface Provider {
  companyName: string;
  contactName?: string;
}

export interface ServiceProviders {
  captiveManager: Provider | null;
  legalCounsel: Provider | null;
  auditor: Provider | null;
  actuary: Provider | null;
  investmentAdvisor: Provider | null;
  bank: Provider | null;
}

export interface FormationCapitalization {
  authorizedShares: number;
  issuedShares: number;
  paidInCapital: number;
  paidInSurplus: number;
  locAmount: number;
  totalCapitalization: number;
  fiscalYearEnd: string;
}

export interface CoverageLine {
  lineName: string;
  grossPremium: number;
  netPremium: number;
  perOccurrenceLimit: number | null;
  aggregateLimit: number | null;
  claimsBasis: string;
  retroactiveDate?: string;
}

export interface LinesCoverage {
  lines: CoverageLine[];
  totalGrossPremium: number;
  totalNetPremium: number;
}

export interface EmploymentEntry {
  employer: string;
  title: string;
  startDate: string;
  endDate: string;
}

export interface BiographicalAffidavit {
  subjectName: string;
  employmentHistory: EmploymentEntry[];
  tenYearCoverageConfirmed: boolean;
}

export interface BiographicalAffidavits {
  affidavits: BiographicalAffidavit[];
}

export interface ProjectionYear {
  year: number;
  grossWrittenPremium: number;
  netEarnedPremium: number;
  lossesIncurred: number;
  lossRatio: number;
  operatingExpenses: number;
  expenseRatio: number;
  combinedRatio: number;
  surplusEndOfYear: number;
  memberCount: number;
}

export interface BusinessPlan {
  captiveManagerReference: string;
  actuaryReference: string;
  linesOfCoverage: string[];
  projections: ProjectionYear[];
  fiscalYearEnd: string;
  openingSurplus: number;
}

export interface AssetClass {
  name: string;
  maxAllocationPct: number;
}

export interface InvestmentPolicy {
  custodianName: string;
  permittedAssetClasses: AssetClass[];
  referencesUtah110: boolean;
  referencesUtah111: boolean;
}

export interface ArticlesOfIncorporation {
  legalName: string;
  registeredAgentName: string;
  registeredAgentAddress: string;
  authorizedShares: number;
  initialDirectors: Person[];
  referencesUtahTitle31AChap37: boolean;
}

export interface Bylaws {
  boardMinSize: number;
  officerPositions: string[];
  fiscalYearEnd: string;
  governingLaw: string;
}

export interface OperatingAgreement {
  governingLaw: string;
  totalCapitalContributions: number;
}

export interface MembershipAgreement {
  linesOfCoverage: string[];
  governingLaw: string;
}

// ─── Full filing package ────────────────────────────────────────────────────

export interface FilingPackage {
  doc1: ExtractedDoc<CompanyDetails>;
  doc2: ExtractedDoc<DirectorsOfficers>;
  doc3: ExtractedDoc<ServiceProviders>;
  doc4: ExtractedDoc<FormationCapitalization>;
  doc6: ExtractedDoc<LinesCoverage>;
  doc7: ExtractedDoc<BiographicalAffidavits>;
  doc8: ExtractedDoc<BusinessPlan>;
  doc11: ExtractedDoc<InvestmentPolicy>;
  doc12: ExtractedDoc<ArticlesOfIncorporation>;
  doc13: ExtractedDoc<Bylaws>;
  doc15: ExtractedDoc<OperatingAgreement>;
  membership: ExtractedDoc<MembershipAgreement>;
}
