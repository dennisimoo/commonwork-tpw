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

Open http://localhost:4173. Select **Explore the demo** to try the app without creating an account. The demo uses synthetic data (`public/data/demo-programs.json`, from `node scripts/generate-demo.mjs`): three fictional organizations and 48 courses at real CDCR facility names, including estimates, ranges and missing counts. It contains no partner data. Demo edits stay in the tab and reset on reload or exit.

To save actual reports, exit demo mode and create the first TPW administrator account. Add a nonprofit, copy its invitation link, and share it with a staff member. Invitations expire after seven days and can be used once. Staff see only their organization's records. Localhost invitations require access to the same server; the deployed Worker provides a shared HTTPS address.

Local accounts and reports persist in `.local/workspace.sqlite`, which is excluded from Git. Passwords use salted scrypt hashes; session cookies are HttpOnly and SameSite Strict. HTTPS cookies are Secure. Localhost and D1 use the same asynchronous request handlers.

## Reporting

- Add a course once; keep its facility, yard, dates and schedule together.
- Copy a course to another yard or date. The copy clears dates and participant counts.
- Choose weekly days, time and session length in Calendar. Scheduled hours are a plan, not attendance. Apply the calculated course hours explicitly.
- Save changed courses as drafts or submit completed courses together (up to 30 changed courses per save, within D1 query and parameter limits).
- Only submitted, completed courses enter TPW totals. Editing a submitted course preserves its last submission until it is submitted again.
- Course hours, participants and completions accept an exact number or a range the partner types (from–to, e.g. 30 to 40). The low end is stored in the field and the high end in `*_max`; the course is marked as an estimate without requiring a note. Totals count the low end, and the dashboard shows lowest–highest whenever ranges are included.
- Counts, dates, missing values and estimates are checked. Estimates or unavailable counts require a note. Concurrent edits cannot silently overwrite each other.
- TPW administrators open **Reporting fields** to rename standard fields and add text, number or date questions. Added fields can be required for submission, removed, or restored. Removal hides a field while preserving saved values; types stay fixed so historical answers remain readable. Configuration is saved in D1 and shared with every organization. The demo editor uses tab-only changes.
- Similar courses in the same organization (program, facility, yard and start/end dates, ignoring case and extra spaces) trigger a warning before submission. Staff can correct the course or explain why it is a separate cohort. That explanation is saved with the report. This is a review aid; similar records are never silently deleted.
- View organization or coalition reports, download CSV, and print a report. CSV uses stable standard column names, includes custom fields with their stable references (including removed fields), and adds `program_year` from the start date and `total_participant_hours_delivered` as course hours × completions. Missing inputs produce blank calculated hours; true zero remains zero. Range and estimate markers are exported alongside the values.

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

### Automatic deployments with Cloudflare Builds

Cloudflare Builds connects directly to the private `dennisimoo/commonwork-tpw` repository. Pushes to `main` run the checks, apply D1 migrations and deploy the Worker. GitHub Actions is not used. Other branches do not build or deploy to production.

Build settings:

- Production branch: `main`.
- Root directory: `/`.
- Build command: `npm run build:cloudflare` (source/calculation/auth/calendar checks, an isolated Worker + D1 workflow check, and a Wrangler dry run).
- Deploy command: `npm run deploy` (remote D1 migrations followed by Worker deployment).
- Node version: `24`, set in `.node-version` and the build environment.
- Preview builds: disabled; branch changes do not touch the production database.

Cloudflare manages the repository webhook and build deployment credential. Worker runtime secrets are retained across deployments. Build-time credentials are not bundled into the app.

Account creation, invitations and reporting are implemented. Password reset and outbound email are not implemented in V1. Administrators share invitation links directly. The app has no individual participant records.
