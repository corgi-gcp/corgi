---
name: service-providers
description: "Generate or update Document 3 — Service Providers Details for the SEIC Utah captive filing. Use this skill whenever the user mentions 'service providers', 'captive manager', 'auditor', 'actuary', 'legal counsel', 'investment advisor', 'bank', 'Document 3', or needs to fill in the vendor/provider roster for the captive application."
---

# Service Providers Details (Document 3)

This skill generates the **Service Providers Details** document for SEIC.

## Document Purpose

Utah requires disclosure of all third-party service providers engaged by the captive. This includes the captive manager, legal counsel, independent auditor, actuary, investment advisor, and banking institution.

## Data Fields to Extract from CSV

For each service provider, extract:

- `provider_category` — One of: Captive Manager, Legal Counsel, Independent Auditor, Actuary, Investment Advisor, Banking Institution
- `company_name` — Legal entity name
- `contact_name` — Primary contact person
- `contact_title` — Title of contact
- `address` — Business address
- `phone` — Phone number
- `email` — Email address
- `services_description` — Brief description of services provided
- `contract_term` — Duration or renewal terms of engagement
- `fees_description` — Fee structure summary (if disclosed at this stage)

## Template Structure

1. **Header** — "SERVICE PROVIDERS DETAILS"
2. **Per-Provider Sections** — One section per category, each containing:
   - Provider category heading
   - Company name and contact info
   - Services description
   - Contract/fee notes

The template uses the following provider categories in order:
- Captive Manager
- Legal Counsel
- Independent Auditor
- Actuary
- Investment Advisor
- Banking Institution

## Generation Logic

1. Read provider records from the CSV grouped by `provider_category`.
2. Load template from `3. Service Providers Details.docx`.
3. Populate each section; if a provider category has no data, insert `[MISSING: provider_category — no provider listed]`.
4. Save output for review.

## Validation Checks

- All six provider categories have at least one entry
- Each provider has company name and address at minimum
- No duplicate providers across categories (same entity can appear in multiple categories but should be noted)
