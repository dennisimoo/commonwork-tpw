# Commonwork for TPW

Nonprofits record courses, schedules, participant counts and completions. TPW reviews submitted reports by organization or across the coalition.

Live app: https://commonwork-tpw.4dennisk.workers.dev

Private source: https://github.com/dennisimoo/commonwork-tpw

## Run locally

Use Node.js 24 or newer.

```sh
npm ci
npm start
```

Open http://localhost:4173. Select **Explore the real-data demo** to use the supplied workbook without creating an account. Demo edits stay in the tab and reset on reload or exit.

To save actual reports, exit demo mode and create the first TPW administrator account. Add a nonprofit, copy its invitation link, and share it with a staff member. Invitations expire after seven days and can be used once. Staff see only their organization's records. Localhost invitations require access to the same server; the deployed Worker provides a shared HTTPS address.

Local accounts and reports persist in `.local/workspace.sqlite`, which is excluded from Git. Passwords use salted scrypt hashes; session cookies are HttpOnly and SameSite Strict. HTTPS cookies are Secure. Localhost and D1 use the same asynchronous request handlers.

## Reporting

- Add a course once; keep its facility, yard, dates and schedule together.
- Copy a course to another yard or date. The copy clears dates and participant counts.
- Choose weekly days, time and session length in Calendar. Scheduled hours are a plan, not attendance. Apply the calculated course hours explicitly.
- Save changed courses as drafts or submit completed courses together (up to 30 changed courses per save, within D1 query and parameter limits).
- Only submitted, completed courses enter TPW totals. Editing a submitted course preserves its last submission until it is submitted again.
- Counts, dates, missing values and estimates are checked. Estimates or unavailable counts require a note. Concurrent edits cannot silently overwrite each other.
- View organization or coalition reports, download CSV, and print a report.

## Actual source data

`public/data/collective-impact.json` comes from Dennis's **TPW - Collective Impact Report.xlsx** and the matching Google Sheet. The extraction script preserves sheet/row receipts, source hash, missing values and overlap warnings. Sample/Test rows are excluded. No synthetic participant names or Iowa data are used.

There are 36 original course records for Defy Ventures and GRIP Training Institute. Three in-progress records remain drafts; 33 completed records enter the initial submitted report. The 31 facility names come from the workbook Constants tab. The original source file is not changed.

The supplied glossary defines course hours as the hours one participant would receive by attending every session. Calculated participant-hours multiply course hours by completions; they are not observed attendance. Participants are reported participations, not deduplicated people across organizations. Possible overlapping workbook rows are flagged rather than silently removed.

Program counts alone cannot establish three-year return-to-prison rates, credit application, causal impact or actual government savings. The optional impact estimate is labeled as a scenario and kept separate from reported activity. Public success-story research is a separate, authenticated feature; it does not supply recidivism results.

## Cloudflare Worker and D1

`worker/index.mjs` handles API requests and serves static files through the ASSETS binding. `DB` is Cloudflare D1. SQL migrations are in `migrations/`; the workbook import is idempotent and never overwrites later edits. No SQLite file is uploaded. Transactions use D1 batches, with database checks for invitation reuse and report-version conflicts.

```sh
npm run dev:worker     # local Worker and local D1, port 4175
npm run check         # source, calculation, auth/report and calendar checks
npm run check:worker  # complete account/invite/report flow in isolated Worker + D1
npm run build         # Wrangler dry run
npm run deploy        # remote D1 migrations, then Worker deployment
```

Configure the account through `CLOUDFLARE_ACCOUNT_ID`. The database binding is in `wrangler.jsonc`. The deployed first-admin setup requires a separate `TPW_SETUP_TOKEN` Worker secret; anonymous visitors cannot claim the administrator account. Set it before sharing the deployment:

```sh
npx wrangler secret put TPW_SETUP_TOKEN
```

The administrator enters this setup code once and chooses their own username/password. Afterwards setup is disabled by a database constraint. Optional `OPENAI_API_KEY` and `EXA_API_KEY` Worker secrets enable the separate public-story researcher. Keys never belong in browser code, Git, or Wrangler vars.

### GitHub deployments

`.github/workflows/deploy.yml` checks every push/PR. Successful main-branch checks apply D1 migrations and deploy the Worker. Deployment also supports manual dispatch. Deployments are serialized. PRs never deploy.

Configure the repository:

- Secret `CLOUDFLARE_API_TOKEN`: an API token with Workers Scripts Edit and D1 Edit for the intended account, plus Account Settings Read if needed by Wrangler.
- Variable `CLOUDFLARE_ACCOUNT_ID`: the intended Cloudflare account ID.

The CI token stays in GitHub Secrets. A local Wrangler OAuth login is not a persistent CI credential. Worker secrets are provisioned separately and retained across deployments. The production environment can have GitHub approval rules added if required.

Account creation, invitations and reporting are implemented. Password reset and outbound email are not implemented in V1. Administrators share invitation links directly. The app has no individual participant records.
