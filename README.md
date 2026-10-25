# Afterward · TPW Outcomes

A named people directory with an OpenAI research agent, Exa search, and separate California outcome reporting. No synthetic people are shipped.

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
node scripts/check-research.mjs
node scripts/build-worker.mjs
node scripts/validate-artifact.mjs
```

The Worker embeds public assets plus the server research handler. .openai/hosting.json binds the existing private Site. Credentials are supplied through Sites runtime variables separately from the source artifact. UI assets and Geist fonts are the extracted user-requested mal.gg/yc reference, documented in docs/research/mal-assets.md.
