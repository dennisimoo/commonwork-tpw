import { useState, lazy, Suspense } from "react";
import { format, parseISO } from "date-fns";
import { Check, ChevronsUpDown, CalendarDays, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
const Calendar = lazy(() =>
  import("@/components/ui/calendar").then((module) => ({
    default: module.Calendar,
  })),
);
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Circle, CheckCircle2, Clock3 } from "lucide-react";
export const fmt = (value) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
        value,
      );
export const fmtRange = (low, high) =>
  low == null
    ? "—"
    : high != null && high !== low
      ? `${fmt(low)}–${fmt(high)}`
      : fmt(low);
export const fmtRate = (summary) =>
  summary.rateMin == null
    ? "—"
    : summary.rateMax != null && summary.rateMin !== summary.rateMax
      ? `${fmt(summary.rateMin * 100)}–${fmt(summary.rateMax * 100)}%`
      : `${fmt(summary.rateMin * 100)}%`;
export const dateLabel = (value) =>
  value ? format(parseISO(value), "MMM d, yyyy") : "No date";
export function Choice({
  value,
  onChange,
  options,
  label,
  className,
  placeholder,
  disabled,
}) {
  return (
    <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className} aria-label={label}>
        <SelectValue placeholder={placeholder || label} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem
              key={typeof o === "string" ? o : o.value}
              value={typeof o === "string" ? o : o.value}
            >
              {typeof o === "string" ? o : o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
export function FacilityPicker({
  value,
  onChange,
  facilities,
  label = "Facility",
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className="w-full justify-between"
        >
          <span className="truncate">{value || "Choose a facility"}</span>
          <ChevronsUpDown data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(30rem,90vw)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search facilities…" />
          <CommandList>
            <CommandEmpty>No facility found.</CommandEmpty>
            <CommandGroup>
              {facilities.map((name) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  {name}
                  {value === name && <Check className="ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
export function DatePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          aria-label={label}
        >
          <CalendarDays data-icon="inline-start" />
          {value ? dateLabel(value) : "Choose date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Suspense fallback={<Skeleton className="size-72" />}>
          <Calendar
            mode="single"
            captionLayout="dropdown"
            startMonth={new Date(2000, 0)}
            endMonth={new Date(new Date().getFullYear() + 10, 11)}
            selected={value ? parseISO(value) : undefined}
            defaultMonth={value ? parseISO(value) : new Date()}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : null);
              setOpen(false);
            }}
          />
        </Suspense>
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Clear date
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
export function Help({ children, label = "More information" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={label}>
          <Info />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">{children}</TooltipContent>
    </Tooltip>
  );
}
export function Status({ status }) {
  const Icon =
    status === "Completed"
      ? CheckCircle2
      : status === "In Progress"
        ? Clock3
        : Circle;
  return (
    <Badge variant="secondary" className="course-status" data-status={status}>
      <Icon />
      {status === "In Progress" ? "In progress" : status}
    </Badge>
  );
}
export function TimePicker({ value, onChange }) {
  const [hour24 = "09", minute = "00"] = (value || "09:00").split(":");
  const hour = String(Number(hour24) % 12 || 12),
    period = Number(hour24) >= 12 ? "PM" : "AM";
  function change(h, m, p) {
    const twentyFour = (Number(h) % 12) + (p === "PM" ? 12 : 0);
    onChange(String(twentyFour).padStart(2, "0") + ":" + m);
  }
  return (
    <div className="time-selects">
      <Choice
        label="Session hour"
        placeholder="Hour"
        value={value ? hour : ""}
        onChange={(h) => change(h, minute, period)}
        options={Array.from({ length: 12 }, (_, i) => String(i + 1))}
      />
      <Choice
        label="Session minute"
        value={minute}
        onChange={(m) => change(hour, m, period)}
        options={Array.from({ length: 60 }, (_, i) =>
          String(i).padStart(2, "0"),
        )}
      />
      <Choice
        label="AM or PM"
        value={period}
        onChange={(p) => change(hour, minute, p)}
        options={["AM", "PM"]}
      />
    </div>
  );
}
