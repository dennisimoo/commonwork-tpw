import {
  fixedRequired,
  fieldSection,
  fieldInputType,
} from "../../public/report-fields.mjs";
import { useState } from "react";
import {
  Check,
  Copy,
  CalendarDays,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Choice,
  FacilityPicker,
  DatePicker,
  TimePicker,
  Help,
  fmt,
} from "./controls";
import { RANGES, applyRanges } from "../../public/impact-core.mjs";
import { plannedHours } from "../../public/schedule.mjs";
export default function CourseEditor({
  course,
  state,
  saveStatus,
  facilities,
  onClose,
  onSave,
  onCopy,
}) {
  const [row, setRow] = useState(() => structuredClone(course)),
    [tab, setTab] = useState("course"),
    [error, setError] = useState(""),
    [duplicates, setDuplicates] = useState(null),
    [reason, setReason] = useState("");
  const [estimates, setEstimates] = useState(() =>
    Object.fromEntries(
      Object.keys(RANGES).map((k) => [k, !!course[k + "_range"]]),
    ),
  );
  const labels = Object.fromEntries(
    state.fields.fields.map((f) => [f.id, f.label]),
  );
  const requiredMark = (id) =>
    fixedRequired(id) ||
    state.fields.fields.find((f) => f.id === id)?.required ? (
      <span aria-hidden="true" className="text-muted-foreground">
        {" "}
        *
      </span>
    ) : null;
  const courseField = (f) => (
    <Field key={f.id}>
      <FieldLabel htmlFor={f.id}>
        {f.label}
        {requiredMark(f.id)}
      </FieldLabel>
      {fieldInputType(f) === "choice" && f.id === "facility" ? (
        <FacilityPicker
          value={row.facility}
          label={f.label}
          onChange={(v) => update("facility", v)}
          facilities={facilities}
        />
      ) : fieldInputType(f) === "choice" && f.id === "status" ? (
        <Choice
          label={f.label}
          value={row.status}
          onChange={(v) => update("status", v)}
          options={["Planned", "In Progress", "Completed"]}
          className="w-full"
        />
      ) : fieldInputType(f) === "date" ? (
        <DatePicker
          label={f.label}
          value={row[f.id]}
          onChange={(v) => update(f.id, v)}
        />
      ) : (
        <Input
          id={f.id}
          type={fieldInputType(f)}
          value={row[f.id] ?? ""}
          maxLength={f.id === "yard" ? 80 : 150}
          onChange={(e) => update(f.id, e.target.value)}
        />
      )}
    </Field>
  );
  const update = (key, value) => {
    setRow((r) => ({ ...r, [key]: value }));
    setError("");
    setDuplicates(null);
    setReason("");
  };
  const updateSchedule = (key, value) =>
    update("schedule", {
      frequency: "weekly",
      days: [],
      time: "",
      session_hours: null,
      ...row.schedule,
      [key]: value,
    });
  const mismatch =
    row.participants != null &&
    row.completions != null &&
    Number(row.completions) > Number(row.participants);
  const plan = plannedHours(row);
  function commit(intent) {
    try {
      onSave(row, intent, reason);
      onClose();
    } catch (cause) {
      const message = cause.message.replace(/^Row \d+:\s*/, "");
      setError(message.charAt(0).toUpperCase() + message.slice(1));
      setDuplicates(cause.duplicates || null);
      if (!cause.duplicates)
        setTab(
          /facility|date|program name|organization/.test(cause.message)
            ? "course"
            : "counts",
        );
    }
  }
  const numberField = (key) => {
    const isRange = estimates[key];
    return (
      <Field key={key} data-invalid={key === "completions" && mismatch}>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor={key}>
            {labels[key]}
            {requiredMark(key)}
          </FieldLabel>
          <Button
            variant="ghost"
            size="xs"
            type="button"
            onClick={() => {
              setEstimates((v) => ({ ...v, [key]: !isRange }));
              if (isRange) update(key + "_range", null);
            }}
          >
            {isRange ? "Use a number" : "Estimate"}
          </Button>
        </div>
        {isRange ? (
          <Choice
            value={row[key + "_range"] || ""}
            onChange={(value) => {
              setRow((r) => applyRanges({ ...r, [key + "_range"]: value }));
              setError("");
            }}
            label={`${labels[key]} estimate`}
            className="w-full"
            options={RANGES[key].map((r) => ({ value: r.id, label: r.label }))}
          />
        ) : (
          <Input
            id={key}
            type={fieldInputType(state.fields.fields.find((f) => f.id === key))}
            min="0"
            step={key === "program_hours" ? "0.25" : "1"}
            placeholder="Not known yet"
            value={row[key] ?? ""}
            aria-invalid={key === "completions" && mismatch}
            onChange={(e) =>
              update(key, e.target.value === "" ? null : Number(e.target.value))
            }
          />
        )}{" "}
        {isRange && row[key + "_range"] && (
          <FieldDescription>
            Stored as an estimate: {fmt(row[key])}.
          </FieldDescription>
        )}
        {key === "completions" && mismatch && (
          <FieldError>Completions cannot exceed participants.</FieldError>
        )}
      </Field>
    );
  };
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="course-sheet w-full sm:max-w-[580px]">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {row.id ? "Edit course" : "New course"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {row.report_state === "submitted" ? "Submitted report" : "Draft"}
            </span>
          </div>
          <SheetTitle>{row.id ? row.program : "Add a course"}</SheetTitle>
          <SheetDescription>
            {state.organizations.find((o) => o.id === row.organization_id)
              ?.name || "Choose an organization below"}
          </SheetDescription>
        </SheetHeader>
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-6 grid grid-cols-3">
            <TabsTrigger value="course">Course</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="counts">Counts</TabsTrigger>
          </TabsList>
          <div className="sheet-scroll">
            <TabsContent value="course">
              <FieldGroup>
                <Field>
                  <FieldLabel>Organization</FieldLabel>
                  <Choice
                    label="Course organization"
                    value={row.organization_id}
                    onChange={(v) => update("organization_id", v)}
                    options={state.organizations.map((o) => ({
                      value: o.id,
                      label: o.name,
                    }))}
                    className="w-full"
                  />
                </Field>
                {state.fields.fields
                  .filter((f) => fieldSection(f.id) === "Course")
                  .map(courseField)}
                {row.start_date &&
                  row.end_date &&
                  row.end_date < row.start_date && (
                    <FieldError>End date must be after start date.</FieldError>
                  )}
              </FieldGroup>
            </TabsContent>
            <TabsContent value="schedule">
              <FieldGroup>
                <Field orientation="horizontal">
                  <div className="flex flex-1 flex-col gap-1">
                    <FieldLabel htmlFor="weekly">Repeat weekly</FieldLabel>
                    <FieldDescription>
                      Add sessions to the calendar.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="weekly"
                    checked={row.schedule?.frequency === "weekly"}
                    onCheckedChange={(checked) =>
                      update(
                        "schedule",
                        checked
                          ? {
                              frequency: "weekly",
                              days: [1],
                              time: "",
                              session_hours: null,
                            }
                          : null,
                      )
                    }
                  />
                </Field>
                {row.schedule && (
                  <>
                    <FieldSet>
                      <FieldLegend variant="label">Days</FieldLegend>
                      <ToggleGroup
                        type="multiple"
                        value={row.schedule.days.map(String)}
                        onValueChange={(days) =>
                          updateSchedule("days", days.map(Number))
                        }
                        variant="outline"
                        className="flex flex-wrap justify-start gap-1"
                      >
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (d, i) => (
                            <ToggleGroupItem
                              key={d}
                              value={String(i)}
                              aria-label={d}
                            >
                              {d.slice(0, 2)}
                            </ToggleGroupItem>
                          ),
                        )}
                      </ToggleGroup>
                    </FieldSet>
                    <FieldGroup className="grid grid-cols-2">
                      <Field>
                        <FieldLabel>Time</FieldLabel>
                        <TimePicker
                          value={row.schedule.time}
                          onChange={(value) => updateSchedule("time", value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="session-hours">
                          Hours per session
                        </FieldLabel>
                        <Input
                          id="session-hours"
                          type="number"
                          min="0.25"
                          max="24"
                          step="0.25"
                          value={row.schedule.session_hours ?? ""}
                          onChange={(e) =>
                            updateSchedule(
                              "session_hours",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                        />
                      </Field>
                    </FieldGroup>
                    {plan && (
                      <div className="calculation">
                        <CalendarDays />
                        <div>
                          <strong>
                            {plan.sessions} sessions · {fmt(plan.hours)} course
                            hours
                          </strong>
                          <p>Planned time, not recorded attendance.</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            update("program_hours", plan.hours);
                            setTab("counts");
                          }}
                        >
                          Use hours
                        </Button>
                      </div>
                    )}
                  </>
                )}
                <p className="text-sm text-muted-foreground">
                  {row.schedule
                    ? "Course start and end dates set the schedule’s boundaries."
                    : "Without a weekly schedule, the calendar shows course start and end dates."}
                </p>
              </FieldGroup>
            </TabsContent>
            <TabsContent value="counts">
              <FieldGroup>
                {state.fields.fields
                  .filter((f) => fieldSection(f.id) === "Counts" && f.active)
                  .map((f) =>
                    f.type === "core" ? (
                      numberField(f.id)
                    ) : (
                      <Field key={f.id}>
                        <FieldLabel htmlFor={f.id}>
                          {f.label}
                          {f.required && (
                            <span
                              aria-hidden="true"
                              className="text-muted-foreground"
                            >
                              *
                            </span>
                          )}
                        </FieldLabel>
                        <Input
                          id={f.id}
                          aria-label={f.label}
                          aria-required={f.required}
                          type={f.type}
                          min={f.type === "number" ? 0 : undefined}
                          step={f.type === "number" ? "any" : undefined}
                          maxLength={2000}
                          value={row.custom_fields?.[f.id] ?? ""}
                          onChange={(e) =>
                            update("custom_fields", {
                              ...row.custom_fields,
                              [f.id]:
                                f.type === "number"
                                  ? e.target.value === ""
                                    ? null
                                    : Number(e.target.value)
                                  : e.target.value,
                            })
                          }
                        />
                      </Field>
                    ),
                  )}

                <div className="calculation">
                  <Check />
                  <div>
                    <strong>
                      {row.program_hours != null && row.completions != null
                        ? fmt(row.program_hours * row.completions)
                        : "—"}{" "}
                      participant-hours
                    </strong>
                    <p>
                      Course hours × completions
                      <Help>
                        Calculated hours for completing participants, not
                        tracked attendance.
                      </Help>
                    </p>
                  </div>
                </div>

                <Accordion
                  type="single"
                  collapsible
                  defaultValue={row.notes ? "notes" : undefined}
                >
                  <AccordionItem value="notes">
                    <AccordionTrigger>
                      {labels.notes} & accuracy
                    </AccordionTrigger>
                    <AccordionContent>
                      <FieldGroup>
                        {state.fields.fields
                          .filter((f) => fieldSection(f.id) === "Notes")
                          .map((f) => (
                            <Field key={f.id}>
                              <FieldLabel htmlFor={f.id}>
                                {f.label}
                                {requiredMark(f.id)}
                              </FieldLabel>
                              {f.id === "data_basis" &&
                              fieldInputType(f) === "choice" ? (
                                <Choice
                                  label={f.label}
                                  className="w-full"
                                  value={row.data_basis || "reported"}
                                  onChange={(v) => update("data_basis", v)}
                                  options={[
                                    {
                                      value: "reported",
                                      label: "Reported counts",
                                    },
                                    { value: "estimated", label: "Estimated" },
                                    {
                                      value: "unknown",
                                      label: "Not available yet",
                                    },
                                  ]}
                                />
                              ) : fieldInputType(f) === "date" ? (
                                <DatePicker
                                  label={f.label}
                                  value={row[f.id]}
                                  onChange={(value) => update(f.id, value)}
                                />
                              ) : fieldInputType(f) !== "text" ||
                                f.id === "data_basis" ? (
                                <Input
                                  id={f.id}
                                  type={fieldInputType(f)}
                                  value={row[f.id] ?? ""}
                                  onChange={(event) =>
                                    update(f.id, event.target.value)
                                  }
                                />
                              ) : (
                                <Textarea
                                  id={f.id}
                                  value={row.notes || ""}
                                  maxLength={3000}
                                  placeholder="Explain estimates or missing information."
                                  onChange={(e) =>
                                    update("notes", e.target.value)
                                  }
                                />
                              )}
                            </Field>
                          ))}
                      </FieldGroup>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </FieldGroup>
            </TabsContent>
            {error && (
              <Alert variant="destructive" className="mt-5">
                <AlertCircle />
                <AlertTitle>
                  {duplicates ? "Review a similar course" : "Check this course"}
                </AlertTitle>
                <AlertDescription>
                  {error}
                  {duplicates && (
                    <>
                      <ul>
                        {duplicates.map((m, i) => (
                          <li key={i}>
                            {m.program} · {m.yard || "No yard"} · {m.start_date}{" "}
                            to {m.end_date}
                          </li>
                        ))}
                      </ul>
                      <Field>
                        <FieldLabel htmlFor="duplicate-reason">
                          Why is this a separate group?
                        </FieldLabel>
                        <Input
                          id="duplicate-reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. A second group meets in the afternoon"
                          maxLength={1000}
                        />
                      </Field>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Tabs>
        <SheetFooter className="sheet-actions">
          <span className="text-xs text-muted-foreground">
            Demo ·{" "}
            {saveStatus === "saving"
              ? "Saving to database…"
              : saveStatus === "error"
                ? "Not saved"
                : "Database autosave"}
          </span>
          <div className="flex flex-wrap gap-2">
            {row.id && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Copy this course"
                onClick={() => onCopy(row)}
              >
                <Copy />
              </Button>
            )}
            <Button variant="outline" onClick={() => commit("draft")}>
              Save draft
            </Button>
            {row.status === "Completed" ? (
              <Button onClick={() => commit("submit")}>
                <Check data-icon="inline-start" />
                Submit course
              </Button>
            ) : (
              <Button
                onClick={() => setTab(tab === "course" ? "schedule" : "counts")}
                disabled={tab === "counts"}
              >
                Next
                <ChevronRight data-icon="inline-end" />
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
