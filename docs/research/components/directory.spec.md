# Outcome Directory specification

## Scope
Adapt the UI of https://www.mal.gg/yc and user-reference.png to Afterward's REAL public Iowa records, retaining separate California outcome/report pages. Do not copy founders or fabricate participant identities, faces, employment, or program attribution.

## Source and screenshots
- User reference: docs/design-references/user-reference.png (3024x1666 source).
- Original inspected at 1280x720 via native browser. Its main max width is 1440px; padding 32px. At <=768px its main padding is 16px horizontal and 20px vertical; filters panel is hidden.
- Extracted via getComputedStyle on live DOM October 24, 2026.

## Exact tokens
- page #fafafa; surface #fff; header/subtle #f5f6f7; hover #f3f4f6; selected #eff3ff.
- text #0a0a0a; secondary #5b5f66; tertiary #8a8f98; muted #737373.
- border #e4e5e8; row separator #efeff1; strong #d3d5da.
- accent blue #2c5bff; focus #3177f0; link #1e46d6.
- Geist body, 12px live reference; heading Geist 20px/20px 600. Adapt body to 13px and row main labels to 15px for readability.
- Geist Mono labels/counts 12px. Agent asset extractor is fetching self-hosted font files; root owner installs @font-face.
- Main columns flex gap 16px. Filter panel width 340px, no shrink, self-start. Content min-width 0, flex1.
- Panels border 1px #e4e5e8, radius16px; shadow 0 3px 6px -1px rgba(0,0,0,.03), 0 1px 2px rgba(0,0,0,.04).
- Table rows 64px height, white background, bottom border1px #efeff1, horizontal padding16px; hover #f3f4f6.
- Original table grid: 32px minmax(220px,1.4fr) 120px 120px 130px minmax(150px,1fr) 72px minmax(160px,.9fr), min-width1000px. Adapt columns to actual record fields; allow horizontal scroll within panel, not page.
- Toolbar control white, border1px #e4e5e8, radius12px, height36px. Second-row pill height40px padding0 12px 0 16px. Tabs active white and shadow; inactive secondary. Search icon20px.
- Filter heading padding12px, header52px high. Filter accordion row36px high, padding0 20px 0 12px; left chevron; value and count right secondary.
- Add filter: dashed 1px focus blue 60% opacity, radius10px, height32px padding0 12px; blue text12px500.
- Avatars circular32px, initials/row references only, pastel variants from source: blue #eaf1fe/#2563eb, pink #fdebf0/#ce3560, green #e9f7f0/#0e8f5e, purple #f0edfb/#6a59cc.

## Interaction model
Click-driven view tabs, accordion filters, checkboxes and pills. Native page scroll; table horizontal scroll. No scroll animation or smooth-scroll dependency. View changes must render actual records, not cosmetic toggles. Search is live with brief debounce; preserve typing focus. Cmd/Ctrl+K focuses search. Filter reset and removable active chips. Sorting and pagination (20/40 rows). Row click opens source-backed detail drawer/dialog, with close button/Escape. No URL profile enrichment.

## Components / content
- Toolbar: broad search ('Search records, cohorts, release pathways…'), table/cards/people view tabs, sort control, filter toggle count.
- Second row: source dataset pill 'Iowa · public records'; return-status toggle; export selected or filtered rows button.
- Active filters row: ACTIVE label, Add filter button focuses sidebar; removable field/value chips; filter count on right.
- Filter sidebar: Filters [count], Reset, 'Find a filter' search; categories 'Release · Cohort' (fiscal year/release pathway), 'Recorded · Outcome' (return status/return reason), 'Record · Characteristics' (age group/sex). Collapsible groups contain actual distinct values and counts. Sidebar hidden under768px but toggle expands it.
- Results panel: 'Release records' blue count badge; contextual compact known-field summary (cohort/outcome data available), source label. Real record avatars use local row reference not invented names, row main 'Record 00001', secondary 'Iowa DOC · source row 1'. Table columns: checkbox, Record, Age at release, Release cohort, Pathway, Outcome, Source.
- Selected checkboxes must be real and export chosen records. Mark selected count; never mistake record count for unique people.
- Cards view actual record cards. People view list+detail pane, still explicitly deidentified record references, no photos.
- Detail: row reference, source, release date, cohort/report year, age band, release pathway, return/no return, days to return if present, source link; employment/housing/program participation unavailable. Do not infer them.
- Scope note small under toolbar: 'Public Iowa example · not TPW participants. Names and person IDs are masked; row references are not identities.'
- Data file dist/data/iowa.json has31703 genuine source rows; fields row,cohort,report_year,age_group,sex,release_type,release_date,returned,reason,days. All 3-year observations per public source; no fabricated defaults.

## Integration contract
Create dist/directory.mjs exporting async renderDirectory({mount,openModal,download}) and dist/directory.css scoped to .directory. Import helpers from ./core.mjs. Module may fetch data/iowa.json and cache only actual results. Root owns shell, index.html, app.mjs, style.css; do not edit those. Root installs fonts and links stylesheet. No frameworks/dependencies required. node --check must pass. Use escapeHTML for all untrusted values. Use source assets at assets/reference/*.svg after extractor provides names. Source icons discovered: search-md.svg,list.svg,grid-01.svg,user-01.svg,switch-vertical-01.svg,filter-funnel-02.svg,icon-briefcase.svg,users-01.svg,plus.svg,x-close.svg,chevron-right.svg,chevron-selector-vertical.svg,link-03.svg,chevron-left-double.svg,icon-chevron-left.svg,chevron-right-double.svg.

## Responsive
>=1280 sidebar 300–340px + results. <=1000 sidebar260px. <=768 collapsible full-width filters then results, search fullwidth, toolbar wraps, table scroll internal. Cards collapse to1column. Dialog width min(720px,viewport-32px); drawer can be fixed right up to520px. Reduce motion respected. Semantic labels and visible focus required.
