# Afterward · TPW Outcomes V1

A lightweight website for exploring real public outcome data and preparing member reports. No synthetic participant data is shipped.

## Run locally

From this project directory:

```sh
node scripts/dev-server.mjs
```

Open http://localhost:4173. Run the meaningful data and import checks with:

```sh
node scripts/check.mjs
```

## What works

- California outcomes: 180 published measurements, 21 release fiscal years with follow-up where available, three separate metrics, cohort and follow-up controls, exact values, evidence receipts, CSV export.
- Rehabilitation achievements: 27 published measurements across three statewide achievement categories. Groups overlap and are never summed.
- Iowa record explorer: 31,703 deidentified public source rows, filters, pagination, and outcome details. Source row positions are not participant identities. No names, photos, birth dates, charge identifiers, or person risk scores are included.
- Coalition workspace: local CSV import, column mapping, arbitrary extra fields, field hiding/removal, organization filtering, duplicate validation, three-year maturity, missingness bounds, CSV export, print/PDF and downloadable HTML reports.
- Data library: citations, original source hashes, limitations, retrieval dates, AWS discovery status.

## Data provenance

Retrieved October 24, 2026. Exact source URLs and SHA-256 hashes are in `public/data/california.json`.

1. California Department of Corrections and Rehabilitation, June 2026 statewide report for FY 2020–21 releases, Tables 14–16, printed pages 51–53 (PDF pages 61–63).
2. CDCR, September 2026 rehabilitation achievements supplement, Table 1, printed/PDF page 3.
3. Iowa Department of Corrections, Iowa Prison Recidivism Status, https://data.iowa.gov/catalog/dataset/984. Downloaded through the official CSV button. Names, birth dates, and person IDs are blank in the public source. This app retains a smaller field set; age bands are derived from published age, `returned` is a boolean from `is_recid`, and `row` is the 1-based data-row position.

California and Iowa are separate datasets. Iowa records are not TPW participants. Counts of records are not necessarily unique people. Public Iowa records are not enriched or identified. Provider-supplied roster names may be researched on demand against approved public professional profiles; results remain unconfirmed candidates.

AWS Open Data Registry was searched for prison/recidivism data. No suitable direct outcomes dataset was found. The Common Crawl registry entry was inspected; anonymous S3 listing returned AccessDenied. Common Crawl is not an outcome registry and is not ingested. No AWS account resources were created. This site is hosted with Sites, not AWS.

## Refresh the snapshots

Create `source-data/`. Download the two PDFs from the exact URLs in `scripts/prepare-data.py` as `cdcr-statewide.pdf` and `cdcr-programs.pdf`. Download the Iowa CSV from the official catalog's Download button and save as `iowa.csv`. The raw files are deliberately excluded from the source repository.

With Poppler's `pdftotext` available:

```sh
python3 scripts/prepare-data.py
node scripts/check.mjs
```

The script extracts California tables from PDFs, validates counts against published rates, records original-file hashes, and writes JSON and CSV snapshots. If the Iowa source changes, update the expected row count only after reviewing it. Update the retrieval date when refreshing.

## Coalition import contract

CSV columns are mapped in the interface. Required concepts: participant ID, provider/organization, release date, outcome status. Status values: `returned`, `no_return`, `unknown`. Dates use `YYYY-MM-DD`.

A return requires a return date. A known non-return requires an observation-end date covering the third anniversary. Reporting uses `[release date, third anniversary)`. Unknown observations are not successes. Only episodes reaching three years by the selected reporting date enter the fixed cohort; newer episodes are shown as pending.

Duplicate participant + provider + release-date combinations block reporting. Multiple-provider episodes are not deduplicated across organizations: the all-provider report explicitly counts provider/release episodes. Sources are staff-supplied and are not independently verified. Dates of death and competing-risk analyses are not implemented; represent unresolved follow-up as unknown and review with an evaluator.

## Scope and limits

This is a public-data and browser-local V1 with a small server-side Exa research endpoint. It has no shared participant database, automated refresh, facial search, or outreach. Browser uploads are held only in memory and are lost on refresh. No causal program effects are inferred. Optional applied-credit estimates use provider-reported days with evidence references; costs are explicitly labeled scenarios, not verified cash savings. Do not publish a member report without reviewing input documentation and cohort eligibility.

## Directory design reference

The primary UI was adapted from the user-supplied mal.gg/yc screenshot and live page. It uses the actual extracted Geist/Geist Mono fonts and 24 SVG interface assets. See `docs/research/mal-assets.md` and `docs/research/components/directory.spec.md` for extraction provenance and tokens. No founder records or portraits were copied. The directory has table, cards, and people layouts, source-row details, six facets, sorting, pagination, keyboard search focus, and selectable-record CSV export. The default view uses Iowa public records; California outcomes remain a distinct navigation destination.

## Named participant roster and applied credits

The Participants tab accepts authorized CSV rosters with `full_name` and `organization`, plus optional provider ID, program and approved HTTPS profile URL. It has no preloaded identities. Files stay in tab memory; live Exa research is available through a server-side endpoint. The originally connected Exa tool was credit-limited; a user-supplied key was validated and configured server-side. Local preview reads the active key used by exa-cli; hosted deployment uses a Sites secret. Named participants are not linked to anonymous Iowa records.

Member reports optionally map `credit_days_applied` and `credit_evidence`. Only numeric applied-day totals with a nonempty evidence reference enter the estimate. Formula: days / 365.25; illustrative cost = years x annual cost (editable, default challenge assumption $21,534/year). Awarded credits alone do not enter the estimate. Provider inputs are not independently verified, and multi-provider counts are not deduplicated coalition totals.

## Research server and deployment

Local preview reads EXA_API_KEY from environment, or the existing active_key in /Users/dennis/exa_keys.json. The CLI and local server use that same active selection. No key is included in source, browser assets, reports, or archives. Production uses the secret EXA_API_KEY configured through Sites.

POST /api/research accepts a name and an optional approved public HTTPS professional profile URL. It requests up to six real Exa sources for professional employment/education context, returns source URLs, highlights, available publication dates and retrieval time, and labels identity matching unconfirmed. It does not search prison status, estimate risk, infer income, or write to outcome metrics. Source candidates can be saved for staff review in tab memory and exported as evidence. No result proves three-year non-return or program causation.

Requests require same-origin JSON and bounded inputs. An approved public professional profile is optional and improves identity review. Name-only results require careful disambiguation. The owner-private hosted Site supplies the access boundary. There is a small per-isolate throttle for accidental repeated requests, not a distributed quota system. Do not change Site access to public without adding appropriate endpoint authorization and usage controls.

```sh
node scripts/check.mjs
node scripts/check-research.mjs
node scripts/build-worker.mjs
node scripts/validate-artifact.mjs
```

The Worker build embeds public static assets and the research handler in one server module. Runtime secrets are supplied separately. Existing source snapshots stay in public/data/; source PDFs and raw Iowa downloads remain excluded from the repository. Local browser participant uploads never enter the build.
