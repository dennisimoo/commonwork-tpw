import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  initialDemo,
  blankCourse,
  copyCourse,
  saveCourse,
  saveFieldConfig,
  addOrganization,
} from "../src/lib/demo-store.mjs";
import { exportActivityRows } from "../public/report-fields.mjs";
const seed = JSON.parse(
  await readFile(new URL("../public/data/demo-programs.json", import.meta.url)),
);
const organizations = [...new Set(seed.records.map((r) => r.organization))].map(
  (name, i) => ({ id: "org" + i, name }),
);
const data = {
  ...seed,
  organizations,
  records: seed.records.map((r, i) => ({
    ...r,
    id: "course" + i,
    organization_id: organizations.find((o) => o.name === r.organization).id,
    report_state: r.status === "Completed" ? "submitted" : "draft",
  })),
};
let state = initialDemo(data);
const original = structuredClone(state),
  row = state.records[0];
assert.equal(state.records.length, 48);
assert.equal(state.published.length, 44);
const id = "custom_12345678-1234-1234-1234-123456789abc";
state = saveFieldConfig(state, [
  ...state.fields.fields,
  {
    id,
    label: "Facilitator hours",
    type: "number",
    active: true,
    required: true,
  },
]);
assert.throws(
  () => saveCourse(state, row, "submit"),
  /Facilitator hours is required/,
);
assert.throws(
  () => saveCourse(state, { ...row, completions: 1000 }, "draft"),
  /exceed/,
);
state = saveCourse(
  state,
  { ...row, custom_fields: { [id]: 3.5 }, participants: 40 },
  "draft",
);
assert.equal(
  state.published.find((r) => r.id === row.id).participants,
  row.participants,
  "Draft edits must not enter reports.",
);
const draft = state.records.find((r) => r.id === row.id);
state = saveCourse(state, draft, "submit");
assert.equal(state.published.find((r) => r.id === row.id).participants, 40);
const duplicate = {
  ...copyCourse(draft),
  status: "Completed",
  start_date: row.start_date,
  end_date: row.end_date,
  participants: 20,
  completions: 15,
  custom_fields: { [id]: 2 },
};
assert.throws(
  () => saveCourse(state, duplicate, "submit"),
  (e) => e.duplicates.length === 1,
);
state = saveCourse(
  state,
  duplicate,
  "submit",
  "Separate afternoon cohort with different participants.",
);
assert.equal(state.records.length, 49);
assert.equal(state.published.length, 45);
const extra = state.records.find((r) => r.id !== row.id && r.duplicate_review);
state = saveFieldConfig(
  state,
  state.fields.fields.map((f) =>
    f.id === id ? { ...f, label: "Staff hours", active: false } : f,
  ),
);
state = saveCourse(state, { ...extra, custom_fields: {} }, "draft");
assert.equal(state.records.find((r) => r.id === extra.id).custom_fields[id], 2);
const exported = exportActivityRows(state.published, state.fields);
assert.equal(
  exported.find((r) => r.duplicate_review)[`Staff hours [${id}]`],
  2,
);
assert.equal(
  exported.find((r) => r.duplicate_review).total_participant_hours_delivered,
  row.program_hours * 15,
);
const copied = copyCourse(row);
assert.equal(copied.participants, null);
assert.equal(copied.start_date, null);
assert.equal(copied.id, undefined);
const pending = blankCourse(organizations[0].id);
assert.throws(() => saveCourse(state, pending), /program/);
state = addOrganization(state, "Additional demo organization");
assert.equal(state.organizations.length, 4);
assert.throws(
  () => addOrganization(state, "Additional demo organization"),
  /already/,
);
assert.deepEqual(
  original,
  initialDemo(data),
  "Source sample courses must never be mutated.",
);
console.log(
  "PASS: demo drafts/submissions, required and archived fields, duplicates, CSV calculations, course copying, organization creation and source isolation.",
);

// Organization changes preserve report history and can be reversed after reload.
const { renameOrganization, deleteOrganization, restoreOrganization } =
  await import("../src/lib/demo-store.mjs");
const { reportAnalysis } = await import("../src/lib/report-analysis.mjs");
const orgId = state.organizations[0].id;
const renamed = renameOrganization(state, orgId, "Renamed organization");
assert(
  renamed.records
    .filter((r) => r.organization_id === orgId)
    .every((r) => r.organization === "Renamed organization"),
);
assert(
  renamed.published
    .filter((r) => r.organization_id === orgId)
    .every((r) => r.organization === "Renamed organization"),
);
assert.throws(
  () => renameOrganization(state, orgId, state.organizations[1].name),
  /already/,
);
const removed = deleteOrganization(renamed, orgId);
assert(!removed.records.some((r) => r.organization_id === orgId));
assert(!removed.published.some((r) => r.organization_id === orgId));
const editedWhileDeleted = addOrganization(
  JSON.parse(JSON.stringify(removed)),
  "Added while deleted",
);
const restored = restoreOrganization(editedWhileDeleted, orgId);
assert(restored.organizations.some((o) => o.name === "Added while deleted"));
assert.deepEqual(
  restored.records.filter((r) => r.organization_id === orgId),
  renamed.records.filter((r) => r.organization_id === orgId),
);
assert.deepEqual(
  restored.published.filter((r) => r.organization_id === orgId),
  renamed.published.filter((r) => r.organization_id === orgId),
);
assert.equal(restored.deletedOrganizations.length, 0);
const analysis = reportAnalysis(
  [
    {
      id: "a",
      organization: "A",
      facility: "Prison A",
      program: "One",
      start_date: "2026-01-01",
      participants: 10,
      completions: 8,
      program_hours: 2,
    },
    {
      id: "b",
      organization: "B",
      facility: "Prison A",
      program: "Two",
      start_date: "2026-03-01",
      participants: null,
      completions: 0,
      program_hours: 3,
      data_basis: "estimated",
    },
  ],
  "facility",
);
assert.equal(analysis.groups.length, 1);
assert.equal(analysis.trend.length, 3);
assert.equal(analysis.trend[1].records, 0);
assert.equal(analysis.missing.length, 1);
assert.equal(analysis.estimated.length, 1);
assert.equal(analysis.total.rate, 0.8);
assert.equal(analysis.total.participantHours, 16);
assert.equal(reportAnalysis([]).trend.length, 0);
console.log(
  "PASS: organization rename, reversible deletion, restore after reload, report grouping, month gaps, estimates and matched completion rate.",
);
const requiredCore = saveFieldConfig(
  state,
  state.fields.fields.map((f) =>
    f.id === "yard" ? { ...f, required: true } : f,
  ),
);
assert.throws(
  () => saveCourse(requiredCore, { ...row, yard: "" }, "submit"),
  /Yard is required/,
);
assert.equal(
  saveCourse(requiredCore, { ...row, yard: "" }, "draft").records.find(
    (r) => r.id === row.id,
  ).yard,
  "",
);

const { reorderFields, fieldHasAnswers } =
  await import("../src/lib/demo-store.mjs");
const orderBefore = state.fields.fields;
const orderAfter = reorderFields(orderBefore, "program", "yard");
assert.deepEqual(
  orderAfter
    .filter((f) => ["program", "facility", "yard"].includes(f.id))
    .map((f) => f.id),
  ["facility", "yard", "program"],
);
assert.equal(
  reorderFields(orderBefore, "program", "participants"),
  orderBefore,
);
assert.equal(reorderFields(orderBefore, "program", "unknown"), orderBefore);
assert(fieldHasAnswers(state, id));
const textAnswers = saveFieldConfig(
  state,
  state.fields.fields.map((f) => (f.id === id ? { ...f, type: "text" } : f)),
);
assert.equal(
  textAnswers.records.find((r) => r.id === extra.id).custom_fields[id],
  "2",
);
assert.equal(state.records.find((r) => r.id === extra.id).custom_fields[id], 2);
assert.throws(
  () =>
    saveFieldConfig(
      state,
      state.fields.fields.map((f) =>
        f.id === id ? { ...f, type: "date" } : f,
      ),
    ),
  /cannot be converted/,
);
const textDates = saveFieldConfig(
  state,
  state.fields.fields.map((f) =>
    f.id === "start_date" ? { ...f, input_type: "text" } : f,
  ),
);
assert.equal(
  textDates.fields.fields.find((f) => f.id === "start_date").input_type,
  "text",
);
assert.equal(textDates.records[0].start_date, state.records[0].start_date);
assert.throws(
  () =>
    saveFieldConfig(
      state,
      state.fields.fields.map((f) =>
        f.id === "program" ? { ...f, input_type: "number" } : f,
      ),
    ),
  /cannot be converted/,
);
const unusedId = "custom_" + crypto.randomUUID();
const unused = saveFieldConfig(state, [
  ...state.fields.fields,
  {
    id: unusedId,
    label: "Unused question",
    type: "text",
    active: true,
    required: false,
  },
]);
const changedType = saveFieldConfig(
  unused,
  unused.fields.fields.map((f) =>
    f.id === unusedId ? { ...f, type: "number" } : f,
  ),
);
assert.equal(
  changedType.fields.fields.find((f) => f.id === unusedId).type,
  "number",
);
assert.equal(
  state.fields.fields.find((f) => f.id === unusedId),
  undefined,
);
console.log(
  "PASS: drag reordering preserves section boundaries and values; unused field types can change while saved answers stay protected.",
);
