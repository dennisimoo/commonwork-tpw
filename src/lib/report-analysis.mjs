import { summarizeActivity } from "../../public/impact-core.mjs";
export function reportAnalysis(rows, groupBy = "organization") {
  const groups = [...new Set(rows.map((r) => r[groupBy] || "Not specified"))]
    .map((name) => ({
      name,
      ...summarizeActivity(
        rows.filter((r) => (r[groupBy] || "Not specified") === name),
      ),
    }))
    .sort(
      (a, b) => b.participants - a.participants || a.name.localeCompare(b.name),
    );
  const months = rows
    .map((r) => r.start_date?.slice(0, 7))
    .filter(Boolean)
    .sort();
  const trend = [];
  if (months.length) {
    const cursor = new Date(months[0] + "-01T00:00:00Z"),
      last = months.at(-1);
    while (cursor.toISOString().slice(0, 7) <= last) {
      const month = cursor.toISOString().slice(0, 7);
      trend.push({
        month,
        ...summarizeActivity(
          rows.filter((r) => r.start_date?.slice(0, 7) === month),
        ),
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }
  const missing = rows.filter((r) =>
    [r.participants, r.completions, r.program_hours].some((v) => v == null),
  );
  const estimated = rows.filter((r) => r.data_basis === "estimated");
  return { groups, trend, missing, estimated, total: summarizeActivity(rows) };
}
