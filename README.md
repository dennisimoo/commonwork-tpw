# Afterward · TPW Outcomes

A localhost dashboard for TPW and its nonprofit partners. The primary views are Coalition impact and My organization, based on the user-supplied Collective Impact workbook. Public story research and California reference outcomes remain separate tools. No synthetic activity records are introduced.

## Collective impact dashboard

Open http://localhost:4173/#impact (the old #directory URL also opens this view), or #organization for a partner dashboard. The current data has 36 retained program/facility activity records from Defy Ventures and GRIP Training Institute: 1,441 reported participations, 4,552 known program/course hours and 739 known completions. One explicit SAMPLE DATA row and one Test form response are excluded. Remaining records are partner-supplied, not independently verified.

The completion rate is 739 / 1,261 = 58.6% over 31 records with both counts; missing completions are not treated as zero. Five records have missing counts/hours. Three possible overlapping groups are retained for provider review. There is no participant-level deduplication, attendance inference or session count.

Use the start-year, organization, facility, program and status filters; drill into the facility tables or source receipts; edit/copy the grant summary; export selected CSV or a print-ready HTML report. The optional scenario is calculated deterministically from editable distinct-release, rate, years and cost assumptions. Reports default to activity only. Whole-course totals are grouped by course start year, not allocated to quarters or represented as annual delivered hours.

The dashboard consumes canonical JSON records or CSV including the workbook's original column headings. Extra fields remain on records and exports. No new survey questions or forms are required. Imports replace tab data and disappear on reload; this prototype's organization selector is not an access control system. There is no production database or live form integration.

Minimum handoff fields: organization, program, facility; optional yard, status, start_date, end_date, program_hours, participants, completions and notes. Count/hour values may be null when unknown. Counts must be nonnegative integers, hours nonnegative numbers, and dates YYYY-MM-DD. Upstream teams should clarify course-hours vs actual delivered-hours before making delivery claims. See docs/partner-inputs/README.md for source details and unavailable references.

To regenerate the supplied workbook snapshot without modifying the original:

```sh
python3 scripts/extract-impact.py "/path/to/TPW - Collective Impact Report.xlsx"
node scripts/check-impact.mjs
```

## Local development

Run `node scripts/dev-server.mjs` and open http://localhost:4173. The impact dashboard works without API keys. For public-story research, copy `.env.example` to `.env`, fill the two keys, and run `node --env-file=.env scripts/dev-server.mjs`. Never commit `.env`. No build step is required for ordinary frontend changes. This repository is private; GitHub publishing stores source only and does not deploy or change the running hosted Site. Keep further work localhost-only unless explicitly requested otherwise.

## People and provenance

The home view contains twelve real adults, collected through Exa from The Last Mile's public student stories, individual alumni spotlights, first-person stories on Google.org and CZI, and TPW's public advocacy article. Each row retains its name, affiliation, program/context, source URL, publication date/year and a short paraphrase. Eleven are public alumni stories; Susan Bustamante is explicitly a public advocate, not a program enrollment record. These form a curated public story collection, not a representative participant roster or verified TPW cohort. Dates belong to the source story and do not establish current roles.

Starting collection: https://thelastmile.org/students/

Records: public/data/public-alumni.json. Export people in the app for an Excel-compatible CSV. Provider CSV imports can replace this collection within the browser tab. The People view replaces the former Iowa explorer and separate Participants tab. No Iowa case data is shipped.

## Agent flow

Research -> OpenAI Responses API -> exa_search function -> bounded Exa results with page text -> OpenAI structured milestone report -> source-linked timeline. The agent can run at most two searches and three model turns with an 85-second total deadline. Exa uses its fast search mode. OpenAI model is runtime-configured, matching Kiwi's current model at setup (gpt-6-luna). Requests use store:false. No SDK or CLI execution service is needed in the deployed Worker.

Each milestone cites IDs from actual retrieved sources; the server drops unsupported citation IDs and uncited milestones. Dates, identity assessment, self-report limitations, retrieval time, model and executed tool counts remain visible. Identity matching and claims still require review; citation existence is not entailment verification. Public pages are untrusted data. The prompt excludes contacts, offenses, sentence details, health data, inferred income/risk and causal claims. Returned page text is used for synthesis and not sent back to the browser. Keys remain server-only. Research reports can be exported as JSON; sources can be saved for review and exported as CSV. Browser imports and saved research disappear on reload.

Neither public stories nor absence of web results establish three-year non-return. Research never populates the member outcome statistics automatically.

## Runtime secrets

Production uses Sites secret OPENAI_API_KEY (retrieved from the user-authorized Kiwi config in AWS Secrets Manager), OPENAI_MODEL, and the existing EXA_API_KEY secret. Kiwi's own configuration is read-only and unchanged. No secrets are stored in source, assets or archives.

Local preview: supply OPENAI_API_KEY and OPENAI_MODEL in the process environment. EXA_API_KEY is read from the environment or the existing active_key in /Users/dennis/exa_keys.json. Then run:

```sh
node scripts/dev-server.mjs
```

Open http://localhost:4173/#directory. The production Site remains owner-private. The endpoint has a per-isolate throttle for accidental repeats; add durable user quotas before shared use.

## California outcome reports

CA outcomes and Programs use official CDCR reports: 180 statewide measurements and 27 program-category measurements. Member reports accept CSV with flexible mapping, fields, organization filters, release-episode validation, mature three-year cohorts, observation coverage, unknown-outcome bounds and printable reports. Optional documented applied credit days are converted to years / 365.25 and an explicitly illustrative annual-cost assumption. Public stories never enter these calculations. Source PDFs, dates, hashes and limitations are in the data library. Refresh official snapshots using scripts/prepare-data.py and its named CDCR PDFs in source-data/.

## Validate and deploy

```sh
node --check public/app.mjs
node --check public/roster.mjs
node scripts/check.mjs
node scripts/check-impact.mjs
node scripts/check-research.mjs
node scripts/build-worker.mjs
node scripts/validate-artifact.mjs
```

The Worker embeds public assets plus the server research handler. .openai/hosting.json binds the existing private Site. Credentials are supplied through Sites runtime variables separately from the source artifact. UI assets and Geist fonts are the extracted user-requested mal.gg/yc reference, documented in docs/research/mal-assets.md.
