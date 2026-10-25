import { useState } from "react";
import {
  format,
  parseISO,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { cn } from "cn";
import { occurrences } from "../../public/schedule.mjs";
import { Choice, Status } from "./controls";
const eventLabel = (event) =>
  event.kind === "Scheduled session"
    ? event.row.schedule?.time || "Session"
    : event.kind === "Course starts"
      ? "Starts"
      : "Ends";
export default function CalendarPage({
  state,
  organization,
  onOrganization,
  onEdit,
  onAdd,
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date())),
    [selected, setSelected] = useState(null),
    [view, setView] = useState("month"),
    [picker, setPicker] = useState(false);
  const records = state.records.filter(
      (r) => organization === "all" || r.organization_id === organization,
    ),
    events = occurrences(records, format(month, "yyyy-MM"));
  const dates = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const selectedEvents = selected
    ? events.filter((e) => e.date === selected)
    : [];
  const edit = (row) => {
    setSelected(null);
    onEdit(row);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Calendar</h1>
          <p>Sample weekly sessions · All programs and counts are fictional.</p>
        </div>
        <Button onClick={() => onAdd(format(new Date(), "yyyy-MM-dd"))}>
          <Plus data-icon="inline-start" />
          Add course
        </Button>
      </div>
      <Card className="planner">
        <CardContent>
          <div className="planner-toolbar">
            <Popover open={picker} onOpenChange={setPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="month-picker">
                  {format(month, "MMMM yyyy")}
                  <ChevronDown data-icon="inline-end" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={month}
                  defaultMonth={month}
                  captionLayout="dropdown"
                  startMonth={new Date(2000, 0)}
                  endMonth={new Date(new Date().getFullYear() + 10, 11)}
                  onSelect={(date) => {
                    if (date) {
                      setMonth(startOfMonth(date));
                      setPicker(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
            <div className="planner-navigation">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonth(startOfMonth(new Date()))}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Previous month"
                onClick={() => setMonth((m) => addMonths(m, -1))}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Next month"
                onClick={() => setMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight />
              </Button>
            </div>
            <div className="planner-options">
              <Choice
                value={organization}
                onChange={onOrganization}
                label="Calendar organization"
                options={[
                  { value: "all", label: "All organizations" },
                  ...state.organizations.map((o) => ({
                    value: o.id,
                    label: o.name,
                  })),
                ]}
              />
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(v) => {
                  if (v) setView(v);
                }}
                className="status-filters"
              >
                <ToggleGroupItem value="month">Month</ToggleGroupItem>
                <ToggleGroupItem value="list">Agenda</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          {view === "month" ? (
            <div
              className="planner-grid"
              role="grid"
              aria-label={format(month, "MMMM yyyy")}
            >
              <div className="planner-weekdays" role="row">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div role="columnheader" key={d}>
                    {d}
                  </div>
                ))}
              </div>
              <div className="planner-days">
                {dates.map((date) => {
                  const key = format(date, "yyyy-MM-dd"),
                    dayEvents = events.filter((e) => e.date === key);
                  return (
                    <div
                      className={cn(
                        "planner-day",
                        !isSameMonth(date, month) && "outside-month",
                      )}
                      key={key}
                      role="gridcell"
                    >
                      <button
                        className={cn(
                          "planner-date",
                          isToday(date) && "is-today",
                        )}
                        aria-label={
                          format(date, "MMMM d, yyyy") +
                          `, ${dayEvents.length} events`
                        }
                        onClick={() => {
                          if (!isSameMonth(date, month))
                            setMonth(startOfMonth(date));
                          setSelected(key);
                        }}
                      >
                        {format(date, "d")}
                      </button>
                      <div className="planner-day-events">
                        {dayEvents.slice(0, 2).map((event, index) => (
                          <button
                            key={event.row.id + index}
                            className="planner-event"
                            data-kind={event.kind}
                            onClick={() => edit(event.row)}
                          >
                            <span>{eventLabel(event)}</span>
                            <strong>{event.label}</strong>
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <button
                            className="planner-more"
                            onClick={() => setSelected(key)}
                          >
                            +{dayEvents.length - 2} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="planner-agenda">
              {events.length ? (
                events.map((event, index) => (
                  <button
                    className="planner-agenda-row"
                    key={event.row.id + index}
                    onClick={() => edit(event.row)}
                  >
                    <div className="agenda-date">
                      <strong>{format(parseISO(event.date), "d")}</strong>
                      <span>{format(parseISO(event.date), "EEE")}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">
                        {eventLabel(event)}
                      </span>
                      <strong>{event.label}</strong>
                      <small>{event.row.facility}</small>
                    </div>
                    <Status status={event.row.status} />
                  </button>
                ))
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CalendarDays />
                    </EmptyMedia>
                    <EmptyTitle>No dates this month</EmptyTitle>
                    <EmptyDescription>
                      Add dates or a weekly schedule to a course.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected ? format(parseISO(selected), "EEEE, MMMM d") : ""}
            </DialogTitle>
            <DialogDescription>
              {selectedEvents.length} planned{" "}
              {selectedEvents.length === 1 ? "event" : "events"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {selectedEvents.map((event, index) => (
              <button
                className="day-event-row"
                onClick={() => edit(event.row)}
                key={event.row.id + index}
              >
                <span>{eventLabel(event)}</span>
                <strong>{event.label}</strong>
                <small>{event.row.facility}</small>
              </button>
            ))}
            {!selectedEvents.length && (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled yet.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                const date = selected;
                setSelected(null);
                onAdd(date);
              }}
            >
              <Plus data-icon="inline-start" />
              Add course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
