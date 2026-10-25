# Commonwork for TPW

A React + shadcn/ui demo for coalition program reporting. It opens directly into Programs, with no sign-in screen.

Live app: https://commonwork-tpw.4dennisk.workers.dev

Private source: https://github.com/dennisimoo/commonwork-tpw

## Run locally

Use Node.js 24 or newer.

```sh
npm ci
npm start
```

Open http://localhost:4173. The local server runs Vite and the API together. The UI automatically loads the sample courses from `GET /api/demo`. No credentials are needed.

Demo courses, schedules, reporting fields, organizations, and submitted snapshots are saved in the `demo_workspaces` database table: SQLite locally and Cloudflare D1 on the Worker. Each browser gets an isolated HttpOnly demo cookie, valid for seven days. Reloading retains edits; **Demo options → Reset demo** restores the original sample. A revision check prevents one tab from overwriting newer edits from another. Demo rows never enter the private partner reporting tables. Existing tab-only edits migrate on the first database save. Exports download to the user's computer.

## Screens

- **Programs:** searchable course groups, organization and status filters, clear course-status and submission badges. The newest courses appear first within each organization’s rounded card. Row menus edit, copy or export a course. A shadcn Sidebar provides navigation.
- **Add/edit course:** shadcn Sheet with separate Course, Schedule and Counts tabs. Save a draft at any point or submit a completed course. Copying clears dates, notes and participant counts for the new group.
- **Counts:** exact numeric inputs by default. Optional **Estimate** controls reveal the partner-requested range buckets. Ranges retain their `*_range` marker, use midpoint/lower-bound estimates and remain labeled as estimates. Unknown values stay missing, not zero.
- **Calendar:** shadcn month calendar with marked course dates and a daily agenda. Weekly sessions use the course's date boundaries, weekdays, time and session duration. Planned hours can be explicitly applied to a course; schedules are not attendance records.
- **Reports:** submitted snapshots only, filtered by organization and course start year. Draft revisions preserve the last submitted values. CSV includes `program_year`, `total_participant_hours_delivered`, estimate markers, duplicate review notes, and custom fields with stable references. Browser print saves a PDF.
- **Reporting fields:** TPW can add text/number/date questions, make answers required on submission, rename labels, and remove/restore added fields. A preview shows the added questions. Standard fields can be renamed but are retained for calculations. Removed fields preserve saved answers in exports.
- **Organizations:** course and submission progress for each demo organization; add an organization or open its courses.

Counts and dates are validated before saving. Required added fields are checked on submission. Similar course records in the same organization (program, facility, yard and dates) require a review explanation before submission. No records are silently deduplicated. A batch submission is applied only after all selected courses pass validation.

The UI uses the official `@shadcn` Radix components installed with the shadcn CLI. `components.json` records the configuration; source components live in `src/components/ui`. Styling uses semantic Tailwind v4 tokens, system typography, restrained motion and reduced-motion/transparency/contrast support. Calendar code is loaded on demand.

## Data

The demo uses `public/data/demo-programs.json`: 48 fictional sample courses across three fictional organizations, clearly labeled as sample data. This source change was introduced separately from the React redesign. Facility names come from the supplied TPW reference list. `scripts/generate-demo.mjs` generates these sample courses.

The original `public/data/collective-impact.json` remains the extracted real TPW workbook source for authenticated API records. It has 36 courses for Defy Ventures and GRIP Training Institute, with source sheet/row receipts; sample/test rows are excluded. The demo does not expose those private saved reports.

Course hours mean the hours one participant would receive by attending every session. Calculated participant-hours multiply course hours by completions; they are not observed attendance. Participations are not deduplicated people across programs. These data cannot establish recidivism, causal rehabilitation effects, credit application or actual government savings.

## Cloudflare Worker and D1

`worker/index.mjs` serves the built React assets from `build/client` and handles API requests. `DB` is Cloudflare D1; SQL migrations are in `migrations/`. The authenticated reporting, field configuration, organization and invitation APIs remain protected, although this demo frontend does not expose the login flow. Anonymous demo users can read the public sample-data endpoint and read/write only their cookie-scoped demo snapshot. Private partner APIs still require authenticated organization-scoped sessions. No database credentials or private reports are bundled into React.

```sh
npm run check         # source, calculations, API/auth, schedules, fields, demo store
npm run build:web     # build the React app with Vite
npm run check:worker  # build + isolated Worker/D1 workflow checks
npm run build         # React build + Wrangler dry run
npm run dev:worker    # build + local migrations + Worker preview on 4175
npm run deploy        # remote migrations + deploy (build first)
```

Local API data is stored in `.local/workspace.sqlite`, excluded from Git. Tests use disposable databases. Hosted setup requires `TPW_SETUP_TOKEN`; authenticated sessions use salted scrypt password hashes and HttpOnly/SameSite cookies. Existing secrets and the production database are unchanged by the demo redesign.

## Automatic deployment

Cloudflare Builds connects directly to `dennisimoo/commonwork-tpw`. Pushes to `main` run `npm run build:cloudflare`, which checks the application, builds React, runs a Wrangler dry run and exercises the real Worker with isolated local D1. The deploy command is `npm run deploy`; it applies idempotent remote migrations and publishes the built app.

Node 24 is set in `.node-version` and the build environment. Preview builds are disabled. GitHub Actions is not used. Worker runtime secrets are retained across deployments.
