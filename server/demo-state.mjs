import { initialDemo } from "../src/lib/demo-store.mjs";
import { normalizeActivity } from "../public/impact-core.mjs";
import { normalizeSchedule } from "../public/schedule.mjs";
import {
  defaultFields,
  validateFields,
  customValues,
  coreLabels,
} from "../public/report-fields.mjs";
export function demoSource(demo) {
  const organizations = [
    ...new Set(demo.records.map((r) => r.organization)),
  ].map((name) => ({
    id: "demo-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
  }));
  return {
    ...demo,
    organizations,
    records: demo.records.map((r, index) => ({
      ...r,
      id: "demo-" + index,
      organization_id: organizations.find((o) => o.name === r.organization).id,
      report_state: r.status === "Completed" ? "submitted" : "draft",
      version: 1,
      origin: "demo",
    })),
  };
}
export const initialDemoState = (demo) => initialDemo(demoSource(demo));
export function validateDemoState(input, facilities) {
  if (
    !input ||
    input.version !== 1 ||
    !Array.isArray(input.organizations) ||
    input.organizations.length > 100 ||
    !Array.isArray(input.records) ||
    input.records.length > 2000 ||
    !Array.isArray(input.published) ||
    input.published.length > 2000
  )
    throw Error("Invalid demo data.");
  const organizations = (list) => {
    const ids = new Set(),
      names = new Set();
    return list.map((o) => {
      if (
        !o ||
        typeof o.id !== "string" ||
        !o.id ||
        o.id.length > 160 ||
        ids.has(o.id) ||
        typeof o.name !== "string" ||
        o.name.trim().length < 2 ||
        o.name.length > 150 ||
        names.has(o.name.trim().toLowerCase())
      )
        throw Error("Invalid demo organization.");
      ids.add(o.id);
      names.add(o.name.trim().toLowerCase());
      return { id: o.id, name: o.name.trim() };
    });
  };
  const orgs = organizations(input.organizations);
  if (
    !input.fields ||
    !Number.isInteger(input.fields.version) ||
    input.fields.version < 0
  )
    throw Error("Invalid field configuration.");
  const fields = {
    version: input.fields.version,
    fields: validateFields(input.fields.fields, defaultFields()),
  };
  if (
    Object.keys(coreLabels).some(
      (id) => !fields.fields.some((f) => f.id === id),
    )
  )
    throw Error("Keep the standard reporting fields.");
  const records = (list, scope) => {
    if (!Array.isArray(list) || list.length > 2000)
      throw Error("Too many demo reports.");
    const ids = new Set();
    return list.map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row))
        throw Error("Invalid demo report.");
      const org = scope.find((o) => o.id === row.organization_id);
      if (
        !org ||
        typeof row.id !== "string" ||
        !row.id ||
        row.id.length > 160 ||
        ids.has(row.id) ||
        !["draft", "submitted"].includes(row.report_state) ||
        !["Planned", "In Progress", "Completed"].includes(row.status) ||
        String(row.program).length > 150 ||
        String(row.notes || "").length > 3000
      )
        throw Error("Invalid demo report.");
      ids.add(row.id);
      if (
        !facilities.includes(row.facility) &&
        row.facility !== "Not yet specified"
      )
        throw Error("Choose a reference facility.");
      const normalized = normalizeActivity({ ...row, organization: org.name });
      normalized.schedule = normalizeSchedule(row.schedule);
      const values = row.custom_fields || {};
      if (
        typeof values !== "object" ||
        Array.isArray(values) ||
        Object.entries(values).some(
          ([key, v]) =>
            !fields.fields.some((f) => f.id === key) ||
            (v != null &&
              ((typeof v !== "string" && typeof v !== "number") ||
                (typeof v === "string" && v.length > 2000) ||
                (typeof v === "number" && !Number.isFinite(v)))),
        )
      )
        throw Error("Invalid field answers.");
      customValues(row, fields, false);
      return { ...normalized, custom_fields: values };
    });
  };
  const rows = records(input.records, orgs),
    published = records(input.published, orgs);
  if (
    published.some(
      (r) =>
        !rows.some(
          (d) => d.id === r.id && d.organization_id === r.organization_id,
        ) || r.report_state !== "submitted",
    )
  )
    throw Error("Invalid submitted report snapshot.");
  const deleted = input.deletedOrganizations || [];
  if (!Array.isArray(deleted) || deleted.length > 100)
    throw Error("Invalid deleted demo data.");
  const deletedOrganizations = deleted.map((saved) => {
    const org = organizations([saved.organization]);
    return {
      organization: org[0],
      records: records(saved.records, org),
      published: records(saved.published, org),
    };
  });
  return {
    version: 1,
    organizations: orgs,
    records: rows,
    published,
    fields,
    ...(deletedOrganizations.length ? { deletedOrganizations } : {}),
  };
}
