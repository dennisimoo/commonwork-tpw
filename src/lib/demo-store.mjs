import {
  normalizeActivity,
  normalizeRanges,
  usesRanges,
} from "../../public/impact-core.mjs";
import { normalizeSchedule } from "../../public/schedule.mjs";
import {
  defaultFields,
  customValues,
  duplicateMatches,
  validateFields,
  requiredCoreValues,
  fieldSection,
  fieldInputType,
  convertFieldAnswer,
} from "../../public/report-fields.mjs";
export function initialDemo(data) {
  return {
    version: 1,
    organizations: data.organizations,
    records: structuredClone(data.records),
    published: structuredClone(
      data.records.filter((r) => r.report_state === "submitted"),
    ),
    fields: defaultFields(),
  };
}
export function blankCourse(organizationId, date = null) {
  return {
    organization_id: organizationId,
    program: "",
    facility: "",
    yard: "",
    status: "Planned",
    start_date: date,
    end_date: null,
    program_hours: null,
    participants: null,
    completions: null,
    notes: "",
    data_basis: "reported",
    custom_fields: {},
    schedule: null,
    report_state: "draft",
  };
}
export function copyCourse(row) {
  return {
    ...blankCourse(row.organization_id),
    program: row.program,
    facility: row.facility,
    yard: row.yard,
    program_hours: row.program_hours,
    program_hours_max: row.program_hours_max || null,
    schedule: structuredClone(row.schedule),
  };
}
export function saveCourse(state, input, intent = "draft", reason = "") {
  const org = state.organizations.find((o) => o.id === input.organization_id);
  if (!org) throw Error("Choose an organization.");
  const existing = state.records.find((r) => r.id === input.id);
  if (!["Planned", "In Progress", "Completed"].includes(input.status))
    throw Error("Choose a course status.");
  if (intent === "submit" && input.status !== "Completed")
    throw Error("Only completed courses can be submitted.");
  const row = normalizeRanges({
    ...input,
    program: input.program.trim(),
    organization: org.name,
    facility: input.facility || "Not yet specified",
  });
  const record = normalizeActivity(row);
  if (intent === "submit") requiredCoreValues(record, state.fields);
  record.schedule = normalizeSchedule(row.schedule);
  if (
    intent === "submit" &&
    (!input.facility || !record.start_date || !record.end_date)
  )
    throw Error("Choose a facility and both course dates before submitting.");
  if (
    intent === "submit" &&
    [record.program_hours, record.participants, record.completions].some(
      (v) => v == null,
    ) &&
    !record.notes
  )
    throw Error("Add a note explaining unavailable hours or counts.");
  if (record.data_basis === "estimated" && !record.notes && !usesRanges(record))
    throw Error("Add a note explaining these estimates.");
  record.custom_fields = {
    ...Object.fromEntries(
      Object.entries(existing?.custom_fields || {}).filter(([id]) =>
        state.fields.fields.some((f) => f.id === id && !f.active),
      ),
    ),
    ...customValues(row, state.fields, intent === "submit"),
  };
  const matches =
    intent === "submit"
      ? duplicateMatches(
          [record],
          state.records.filter((r) => r.organization_id === org.id),
        )
      : [];
  if (matches.length && reason.trim().length < 10)
    throw Object.assign(Error("A similar course already exists."), {
      duplicates: matches,
    });
  if (matches.length) record.duplicate_review = reason.trim();
  record.id ??= crypto.randomUUID();
  record.report_state = intent === "submit" ? "submitted" : "draft";
  record.version = (existing?.version || 0) + 1;
  record.updated_at = new Date().toISOString();
  record.origin ??= "demo-edit";
  const records = existing
    ? state.records.map((r) => (r.id === record.id ? record : r))
    : [record, ...state.records];
  return {
    ...state,
    records,
    published:
      intent === "submit"
        ? [record, ...state.published.filter((r) => r.id !== record.id)]
        : state.published,
  };
}
export function saveFieldConfig(state, fields) {
  const changed = fields.filter((next) => {
    const old = state.fields.fields.find((f) => f.id === next.id);
    return old && fieldInputType(old) !== fieldInputType(next);
  });
  const migrate = (rows) =>
    rows.map((row) => {
      let updated = row;
      for (const field of changed) {
        const type = fieldInputType(field);
        if (field.type === "core") {
          if (type !== "choice")
            convertFieldAnswer(row[field.id], type, field.label);
        } else {
          const value = convertFieldAnswer(
            row.custom_fields?.[field.id],
            type,
            field.label,
          );
          if (value !== undefined)
            updated = {
              ...updated,
              custom_fields: { ...updated.custom_fields, [field.id]: value },
            };
        }
      }
      return updated;
    });
  const records = migrate(state.records),
    published = migrate(state.published),
    deletedOrganizations = state.deletedOrganizations?.map((saved) => ({
      ...saved,
      records: migrate(saved.records),
      published: migrate(saved.published),
    }));
  const previous = {
    ...state.fields,
    fields: state.fields.fields.map((old) => {
      const next = fields.find((f) => f.id === old.id);
      return next && old.type !== "core" ? { ...old, type: next.type } : old;
    }),
  };
  return {
    ...state,
    records,
    published,
    ...(deletedOrganizations ? { deletedOrganizations } : {}),
    fields: {
      version: state.fields.version + 1,
      fields: validateFields(fields, previous),
    },
  };
}
export function addOrganization(state, name) {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 150)
    throw Error("Use an organization name of 2–150 characters.");
  if (
    state.organizations.some(
      (o) => o.name.toLowerCase() === trimmed.toLowerCase(),
    )
  )
    throw Error("This organization already exists.");
  return {
    ...state,
    organizations: [
      ...state.organizations,
      { id: crypto.randomUUID(), name: trimmed },
    ],
  };
}

export function renameOrganization(state, id, name) {
  const trimmed = name.trim();
  if (!state.organizations.some((o) => o.id === id))
    throw Error("Organization not found.");
  if (trimmed.length < 2 || trimmed.length > 150)
    throw Error("Use an organization name of 2–150 characters.");
  if (
    state.organizations.some(
      (o) => o.id !== id && o.name.toLowerCase() === trimmed.toLowerCase(),
    )
  )
    throw Error("This organization already exists.");
  const rename = (rows) =>
    rows.map((r) =>
      r.organization_id === id ? { ...r, organization: trimmed } : r,
    );
  return {
    ...state,
    organizations: state.organizations.map((o) =>
      o.id === id ? { ...o, name: trimmed } : o,
    ),
    records: rename(state.records),
    published: rename(state.published),
  };
}
export function deleteOrganization(state, id) {
  const organization = state.organizations.find((o) => o.id === id);
  if (!organization) throw Error("Organization not found.");
  return {
    ...state,
    organizations: state.organizations.filter((o) => o.id !== id),
    records: state.records.filter((r) => r.organization_id !== id),
    published: state.published.filter((r) => r.organization_id !== id),
    deletedOrganizations: [
      ...(state.deletedOrganizations || []),
      {
        organization,
        records: state.records.filter((r) => r.organization_id === id),
        published: state.published.filter((r) => r.organization_id === id),
      },
    ],
  };
}
export function restoreOrganization(state, id) {
  const saved = state.deletedOrganizations?.find(
    (s) => s.organization.id === id,
  );
  if (!saved) throw Error("Deleted organization not found.");
  if (
    state.organizations.some(
      (o) =>
        o.id === id ||
        o.name.toLowerCase() === saved.organization.name.toLowerCase(),
    )
  )
    throw Error("Rename the existing organization before restoring this one.");
  return {
    ...state,
    organizations: [...state.organizations, saved.organization],
    records: [...state.records, ...saved.records],
    published: [...state.published, ...saved.published],
    deletedOrganizations: state.deletedOrganizations.filter(
      (s) => s.organization.id !== id,
    ),
  };
}

export function fieldHasAnswers(state, id) {
  return [
    ...state.records,
    ...state.published,
    ...(state.deletedOrganizations || []).flatMap((saved) => [
      ...saved.records,
      ...saved.published,
    ]),
  ].some((row) => {
    const value = row.custom_fields?.[id];
    return value !== null && value !== undefined && value !== "";
  });
}
export function reorderFields(fields, activeId, overId) {
  if (activeId === overId || fieldSection(activeId) !== fieldSection(overId))
    return fields;
  const positions = fields
    .map((f, i) => ({ f, i }))
    .filter(
      ({ f }) => f.active && fieldSection(f.id) === fieldSection(activeId),
    );
  const from = positions.findIndex(({ f }) => f.id === activeId),
    to = positions.findIndex(({ f }) => f.id === overId);
  if (from < 0 || to < 0) return fields;
  const ordered = positions.map(({ f }) => f),
    [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);
  const next = [...fields];
  positions.forEach(({ i }, index) => {
    next[i] = ordered[index];
  });
  return next;
}
