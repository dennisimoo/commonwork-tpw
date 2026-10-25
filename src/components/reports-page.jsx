import ReportChart from "./report-chart";
import { reportAnalysis } from "@/lib/report-analysis.mjs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Download, Printer, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { summarizeActivity } from "../../public/impact-core.mjs";
import { exportActivityRows } from "../../public/report-fields.mjs";
import { toCSV } from "../../public/core.mjs";
import { Choice, fmt, fmtRange, fmtRate, Help } from "./controls";
export function downloadCSV(rows, fields) {
  const blob = new Blob(["\uFEFF" + toCSV(exportActivityRows(rows, fields))], {
      type: "text/csv;charset=utf-8",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "tpw-program-reports.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Metrics({ items }) {
  return (
    <div className="metrics-grid">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardDescription>
              {item.label}
              {item.help && <Help>{item.help}</Help>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <strong className="metric-value">{item.value}</strong>
          </CardContent>
          {item.note && (
            <CardFooter>
              <span className="text-xs text-muted-foreground">{item.note}</span>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
export default function ReportsPage({ state, organization, onOrganization }) {
  const [year, setYear] = useState("all"),
    [facility, setFacility] = useState("all"),
    [groupBy, setGroupBy] = useState("organization"),
    [trendMetric, setTrendMetric] = useState("participants"),
    years = [
      ...new Set(
        state.published.map((r) => r.start_date?.slice(0, 4)).filter(Boolean),
      ),
    ].sort();
  const rows = state.published.filter(
      (r) =>
        (organization === "all" || r.organization_id === organization) &&
        (year === "all" || r.start_date?.slice(0, 4) === year) &&
        (facility === "all" || r.facility === facility),
    ),
    total = summarizeActivity(rows);
  const analysis = reportAnalysis(rows, groupBy),
    groups = analysis.groups;
  const rate = fmtRate(total);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Reports</h1>
          <p>Reach, completion, and reporting quality.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Print report"
            onClick={() => window.print()}
          >
            <Printer />
          </Button>
          <Button onClick={() => downloadCSV(rows, state.fields)}>
            <Download data-icon="inline-start" />
            Export CSV
          </Button>
        </div>
      </div>
      <div className="report-filters">
        {state.organizations.length > 1 ? (
          <Choice
            value={organization}
            onChange={onOrganization}
            label="Report organization"
            options={[
              { value: "all", label: "All organizations" },
              ...state.organizations.map((o) => ({
                value: o.id,
                label: o.name,
              })),
            ]}
          />
        ) : (
          <Badge variant="outline">{state.organizations[0]?.name}</Badge>
        )}
        <Choice
          value={year}
          onChange={setYear}
          label="Course start year"
          options={[{ value: "all", label: "All start years" }, ...years]}
        />
        <Choice
          value={facility}
          onChange={setFacility}
          label="Report facility"
          options={[
            { value: "all", label: "All prisons" },
            ...[...new Set(state.published.map((r) => r.facility))].sort(),
          ]}
        />
        <span className="report-record-count">
          {rows.length} submitted reports
        </span>
      </div>
      <p className="print-report-context">
        {organization === "all"
          ? state.organizations.length === 1
            ? state.organizations[0].name
            : "All organizations"
          : state.organizations.find((o) => o.id === organization)?.name}{" "}
        · {year === "all" ? "All start years" : year} ·{" "}
        {facility === "all" ? "All prisons" : facility}
      </p>
      <Metrics
        items={[
          {
            label: "Participations",
            value: total.knownParticipants
              ? fmtRange(total.participants, total.participantsMax)
              : "—",
            help: "Course enrollments, not unique people across programs.",
          },
          {
            label: "Completions",
            value: total.knownCompletions
              ? fmtRange(total.completions, total.completionsMax)
              : "—",
            note:
              total.rateMin == null
                ? "No comparable counts"
                : `${rate} on records with both counts`,
          },
          {
            label: "Completion rate",
            value: rate,
            note: `${total.comparable} reports with both counts`,
            help: "Only courses with both began and completed counts enter this calculation.",
          },
          {
            label: "Participant-hours",
            value: total.knownParticipantHours
              ? fmtRange(total.participantHours, total.participantHoursMax)
              : "—",
            help: "Course hours × completions, where both are known. Not observed attendance.",
            note: `${total.knownParticipantHours} courses with both inputs`,
          },
        ]}
      />
      <div className="report-insight-grid">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Over time</CardTitle>
              <ToggleGroup
                type="single"
                value={trendMetric}
                onValueChange={(v) => {
                  if (v) setTrendMetric(v);
                }}
              >
                <ToggleGroupItem value="participants">Began</ToggleGroupItem>
                <ToggleGroupItem value="completions">Completed</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <CardDescription>
              Grouped by course start month. Hover for counts and report
              coverage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportChart months={analysis.trend} metric={trendMetric} />
            {!rows.length && (
              <p className="text-sm text-muted-foreground">
                No reports match these filters.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reach</CardTitle>
            <CardDescription>Across the current selection</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {[
              { label: "Organizations", value: total.organizations },
              { label: "Prisons", value: total.facilities },
              { label: "Program names", value: total.programs },
              { label: "Submitted reports", value: rows.length },
            ].map((item) => (
              <div className="reach-row" key={item.label}>
                <span>{item.label}</span>
                <strong>{fmt(item.value)}</strong>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Enrollments may include the same person in several programs.
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Compare</CardTitle>
            <ToggleGroup
              type="single"
              value={groupBy}
              onValueChange={(v) => {
                if (v) setGroupBy(v);
              }}
            >
              <ToggleGroupItem value="organization">
                Organizations
              </ToggleGroupItem>
              <ToggleGroupItem value="facility">Prisons</ToggleGroupItem>
              <ToggleGroupItem value="program">Programs</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <CardDescription>
            Ranked by enrollments. Estimates show their lowest–highest total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {groupBy === "organization"
                    ? "Organization"
                    : groupBy === "facility"
                      ? "Prison"
                      : "Program"}
                </TableHead>
                <TableHead className="text-right">Courses</TableHead>
                <TableHead className="text-right">Participations</TableHead>
                <TableHead className="text-right">Completions</TableHead>
                <TableHead className="text-right">Completion rate</TableHead>
                <TableHead className="text-right">Participant-hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.name}>
                  <TableCell>{g.name}</TableCell>
                  <TableCell className="text-right">{fmt(g.records)}</TableCell>
                  <TableCell className="text-right">
                    {g.knownParticipants
                      ? fmtRange(g.participants, g.participantsMax)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {g.knownCompletions
                      ? fmtRange(g.completions, g.completionsMax)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">{fmtRate(g)}</TableCell>
                  <TableCell className="text-right">
                    {g.knownParticipantHours
                      ? fmtRange(g.participantHours, g.participantHoursMax)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="report-data-quality">
        <CardHeader>
          <CardTitle>Data quality</CardTitle>
          <CardDescription>
            Check gaps before sharing the report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="quality-summary">
            <Badge variant="outline">
              {analysis.missing.length} missing hours or counts
            </Badge>
            <Badge variant="outline">
              {analysis.estimated.length} estimated reports
            </Badge>
            <Badge variant="outline">
              {total.comparable} with both completion counts
            </Badge>
            <Badge variant="outline">
              {total.overlapGroups.length} possible overlapping groups
            </Badge>
          </div>
          {analysis.missing.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Missing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.missing.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.program}</TableCell>
                    <TableCell>{row.organization}</TableCell>
                    <TableCell>
                      {[
                        ["participants", "Began"],
                        ["completions", "Completed"],
                        ["program_hours", "Hours"],
                      ]
                        .filter(([key]) => row[key] == null)
                        .map(([, label]) => label)
                        .join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="report-quality">
        <span>{total.facilities} facilities</span>
        <span>
          {
            rows.filter(
              (r) =>
                r.participants == null ||
                r.completions == null ||
                r.program_hours == null,
            ).length
          }{" "}
          courses with missing counts or hours
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <Info data-icon="inline-start" />
              About these totals
            </Button>
          </PopoverTrigger>
          <PopoverContent className="text-sm flex flex-col gap-3">
            <p>
              Draft edits stay out of reports until submitted again. Missing
              values stay missing.
            </p>
            <p>
              Participant-hours are calculated from course hours and
              completions. These totals do not measure recidivism or government
              savings.
            </p>
            <p>
              {total.overlapGroups.length} possible overlapping course groups.
              Submitted rows are retained.
            </p>
          </PopoverContent>
        </Popover>
      </div>
      <p className="page-footnote">
        Demo data · {state.published.length} submitted sample courses · Not
        TPW’s measured outcomes
      </p>
    </>
  );
}
