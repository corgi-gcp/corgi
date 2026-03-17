/**
 * Claude Haiku extraction prompts — one per document type.
 * Each prompt defines a JSON schema and instructs the model to extract
 * only the fields needed for audit checks. All monetary values as raw numbers.
 */

export const PROMPTS: Record<string, { system: string; userPrefix: string }> = {

  doc1: {
    system: `You are extracting structured data from a Utah captive insurance filing document titled "Captive Insurance Company Details".
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "legalName": string,
  "captiveType": string,
  "registeredAgentName": string,
  "registeredAgentAddress": string,
  "domicileState": string,
  "fiscalYearEnd": string,
  "associationName": string
}
- legalName: full legal name of the captive insurance company
- captiveType: e.g. "association captive", "pure captive", etc.
- registeredAgentName: name of the statutory/registered agent
- registeredAgentAddress: street address of registered agent
- domicileState: state where captive is domiciled (e.g. "Utah")
- fiscalYearEnd: e.g. "December 31" or "December 31st"
- associationName: name of the sponsoring association
Use null for any field you cannot find. Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  doc2: {
    system: `You are extracting structured data from a Utah captive insurance filing document titled "Directors/Managers and Officers".
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "all": [
    {
      "fullName": string,
      "title": string,
      "isDirector": boolean,
      "address": string
    }
  ]
}
- fullName: the person's full legal name
- title: their title(s) at the captive, e.g. "President", "Vice President", "Secretary", "Treasurer", "Director"
- isDirector: true if the person serves on the board of directors/managers
- address: mailing/home address if listed, otherwise null
List every person mentioned. Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  doc3: {
    system: `You are extracting structured data from a Utah captive insurance filing document titled "Service Providers Details".
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "captiveManager": { "companyName": string, "contactName": string } | null,
  "legalCounsel": { "companyName": string, "contactName": string } | null,
  "auditor": { "companyName": string, "contactName": string } | null,
  "actuary": { "companyName": string, "contactName": string } | null,
  "investmentAdvisor": { "companyName": string, "contactName": string } | null,
  "bank": { "companyName": string, "contactName": string } | null
}
Set a provider to null if not present. Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  doc4: {
    system: `You are extracting structured data from a Utah captive insurance filing document titled "Captive Formation & Capitalization".
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "authorizedShares": number,
  "issuedShares": number,
  "paidInCapital": number,
  "paidInSurplus": number,
  "locAmount": number,
  "totalCapitalization": number,
  "fiscalYearEnd": string
}
- All monetary values as raw integers (no $ or commas). E.g. $5,000,000 → 5000000.
- locAmount: letter of credit amount, 0 if none.
- fiscalYearEnd: e.g. "December 31"
Use null for any field you cannot find. Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  doc6: {
    system: `You are extracting structured data from a Utah captive insurance filing document titled "Lines of Coverage Details".
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "lines": [
    {
      "lineName": string,
      "grossPremium": number,
      "netPremium": number,
      "perOccurrenceLimit": number | null,
      "aggregateLimit": number | null,
      "claimsBasis": string,
      "retroactiveDate": string | null
    }
  ],
  "totalGrossPremium": number,
  "totalNetPremium": number
}
- All monetary values as raw integers. claimsBasis: "occurrence" or "claims-made".
- retroactiveDate: only for claims-made lines, ISO date string or descriptive date, null otherwise.
- Extract every coverage line listed. Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  doc7: {
    system: `You are extracting structured data from one or more Utah captive insurance biographical affidavit documents.
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "affidavits": [
    {
      "subjectName": string,
      "employmentHistory": [
        {
          "employer": string,
          "title": string,
          "startDate": string,
          "endDate": string
        }
      ],
      "tenYearCoverageConfirmed": boolean
    }
  ]
}
- subjectName: the full name of the person the affidavit is about
- employmentHistory: list all employment entries found, sorted chronologically (oldest first)
- startDate / endDate: use ISO format (YYYY-MM) where possible, "Present" if still employed
- tenYearCoverageConfirmed: true if the document explicitly states 10-year coverage or employment history spans back at least 10 years from the document date
Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  doc8: {
    system: `You are extracting structured data from a Utah captive insurance filing document titled "Business Plan".
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "captiveManagerReference": string,
  "actuaryReference": string,
  "linesOfCoverage": [string],
  "fiscalYearEnd": string,
  "openingSurplus": number,
  "projections": [
    {
      "year": number,
      "grossWrittenPremium": number,
      "netEarnedPremium": number,
      "lossesIncurred": number,
      "lossRatio": number,
      "operatingExpenses": number,
      "expenseRatio": number,
      "combinedRatio": number,
      "surplusEndOfYear": number,
      "memberCount": number
    }
  ]
}
- captiveManagerReference: name of the captive management company mentioned
- actuaryReference: name of the actuarial firm mentioned
- linesOfCoverage: list of all insurance line names mentioned in the business plan
- openingSurplus: initial surplus/capitalization amount as raw integer
- All monetary values as raw integers. Ratios as decimals (e.g. 0.65 not 65%).
- projections: one entry per year in the financial projections table. If ratios are given as percentages convert to decimals.
Use null for any field you cannot find. Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  doc11: {
    system: `You are extracting structured data from a Utah captive insurance filing document titled "Investment Policy".
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "custodianName": string,
  "permittedAssetClasses": [
    { "name": string, "maxAllocationPct": number }
  ],
  "referencesUtah110": boolean,
  "referencesUtah111": boolean
}
- custodianName: name of the investment custodian or banking institution for assets
- maxAllocationPct: percentage as a number 0-100 (e.g. 40 not 0.40)
- referencesUtah110: true if the document mentions "31A-18-110" or "Section 110" of the Utah Investment statutes
- referencesUtah111: true if the document mentions "31A-18-111" or "Section 111" of the Utah Investment statutes
Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  doc12: {
    system: `You are extracting structured data from a Utah captive insurance filing document titled "Articles of Incorporation".
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "legalName": string,
  "registeredAgentName": string,
  "registeredAgentAddress": string,
  "authorizedShares": number,
  "initialDirectors": [
    { "fullName": string, "address": string | null }
  ],
  "referencesUtahTitle31AChap37": boolean
}
- referencesUtahTitle31AChap37: true if the document mentions "Title 31A, Chapter 37" or "31A-37" or "captive insurance" in relation to Utah law
- authorizedShares: number of authorized shares as raw integer
Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  doc13: {
    system: `You are extracting structured data from a Utah captive insurance filing document titled "Bylaws".
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "boardMinSize": number,
  "officerPositions": [string],
  "fiscalYearEnd": string,
  "governingLaw": string
}
- boardMinSize: minimum number of directors required per the bylaws (integer)
- officerPositions: list all officer titles defined in the bylaws (e.g. "President", "Vice President", "Secretary", "Treasurer")
- fiscalYearEnd: e.g. "December 31"
- governingLaw: the state or jurisdiction named as governing law, e.g. "Utah"
Use null for any field you cannot find. Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  doc15: {
    system: `You are extracting structured data from a Utah captive insurance filing document titled "Operating Agreement".
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "governingLaw": string,
  "totalCapitalContributions": number
}
- governingLaw: the state named as governing law, e.g. "Utah"
- totalCapitalContributions: total capital contributed by all members as raw integer
Use null for any field you cannot find. Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },

  membership: {
    system: `You are extracting structured data from a Utah captive insurance Membership Agreement.
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "linesOfCoverage": [string],
  "governingLaw": string
}
- linesOfCoverage: list all insurance coverage lines named in the agreement
- governingLaw: the state named as governing law, e.g. "Utah"
Use null for any field you cannot find. Do NOT wrap in code fences.`,
    userPrefix: "Document text:\n\n",
  },
};
