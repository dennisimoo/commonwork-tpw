import { useState } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  Copy,
  BookOpen,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Status, fmt, dateLabel } from "./controls";
import { downloadCSV } from "./reports-page";
function OrganizationCourses({
  organization,
  rows,
  state,
  onEdit,
  onCopy,
  onAdd,
}) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false),
    visible = expanded ? rows : rows.slice(0, 5);
  const initials = organization.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card className="course-group">
        <CardHeader className="course-group-heading">
          <Badge variant="secondary" className="organization-initials">
            {initials}
          </Badge>
          <div>
            <CardTitle>{organization.name}</CardTitle>
            <CardDescription>{rows.length} reports</CardDescription>
          </div>
          <span className="group-completed">
            {rows.filter((r) => r.status === "Completed").length} completed
          </span>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${open ? "Collapse" : "Expand"} ${organization.name}`}
            >
              <ChevronDown className={open ? "" : "-rotate-90"} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="flex flex-col">
              {visible.map((row) => (
                <div className="course-list-row" key={row.id}>
                  <div className="course-list-title">
                    <button onClick={() => onEdit(row)}>{row.program}</button>
                    <span>
                      {row.facility}
                      {row.yard ? " · " + row.yard : ""}
                    </span>
                    <small>
                      {dateLabel(row.start_date)}
                      {row.end_date ? " – " + dateLabel(row.end_date) : ""}
                    </small>
                  </div>
                  <div className="course-list-numbers">
                    <strong>{fmt(row.participants)}</strong>
                    <span>
                      participants{row.participants_range ? " · estimate" : ""}
                    </span>
                  </div>
                  <div className="course-list-status">
                    <Status status={row.status} />
                    <span>
                      {row.report_state === "submitted" ? "Submitted" : "Draft"}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${row.program}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={() => onEdit(row)}>
                          <BookOpen />
                          Edit course
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onCopy(row)}>
                          <Copy />
                          Copy course
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => downloadCSV([row], state.fields)}
                        >
                          <Download />
                          Export course
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            {rows.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Show fewer" : `Show all ${rows.length}`}
              </Button>
            )}
          </CardFooter>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
export default function ProgramGroups({ rows, state, onEdit, onCopy, onAdd }) {
  return (
    <div className="program-groups">
      {state.organizations
        .map((o) => ({
          organization: o,
          rows: rows.filter((r) => r.organization_id === o.id),
        }))
        .filter((g) => g.rows.length)
        .map((g) => (
          <OrganizationCourses
            key={g.organization.id}
            {...g}
            state={state}
            onEdit={onEdit}
            onCopy={onCopy}
            onAdd={onAdd}
          />
        ))}
    </div>
  );
}
