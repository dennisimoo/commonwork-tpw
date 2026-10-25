import { useDatabaseDemo } from "@/hooks/use-database-demo";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import ProgramGroups from "@/components/program-groups";
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { cn } from "cn";
import { toast } from "sonner";
import {
  Layers,
  CalendarDays,
  ChartNoAxesCombined,
  Building2,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Plus,
  Search,
  MoreHorizontal,
  Check,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Choice, Status, fmt, dateLabel } from "@/components/controls";
import CourseEditor from "@/components/course-editor";
import FieldsPage from "@/components/fields-page";
const CalendarPage = lazy(() => import("@/components/calendar-page"));
import ReportsPage, { downloadCSV } from "@/components/reports-page";
import {
  initialDemo,
  blankCourse,
  copyCourse,
  saveCourse,
  addOrganization,
  renameOrganization,
  deleteOrganization,
  restoreOrganization,
} from "@/lib/demo-store.mjs";
const nav = [
  { id: "programs", label: "Programs", icon: Layers },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "impact", label: "Reports", icon: ChartNoAxesCombined },
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "fields", label: "Reporting fields", icon: SlidersHorizontal },
];
const storageKey = "commonwork-react-demo-1";
function currentView() {
  const id = location.hash.slice(1);
  return nav.some((n) => n.id === id) ? id : "programs";
}
function OrganizationOption(props) {
  const { setOpenMobile } = useSidebar();
  return (
    <DropdownMenuRadioItem {...props} onSelect={() => setOpenMobile(false)} />
  );
}
function SidebarLink({ children, ...props }) {
  const { setOpenMobile } = useSidebar();
  return (
    <a {...props} onClick={() => setOpenMobile(false)}>
      {children}
    </a>
  );
}
function MobileMenu() {
  const { toggleSidebar, isMobile } = useSidebar();
  return isMobile ? (
    <Button variant="ghost" size="sm" onClick={toggleSidebar}>
      Menu
    </Button>
  ) : null;
}
function App() {
  const {
    state,
    setState,
    source,
    loadError,
    saveStatus,
    saveError,
    retry,
    storage,
  } = useDatabaseDemo();
  const [view, setView] = useState(currentView),
    [organization, setOrganization] = useState("all"),
    [activeOrg, setActiveOrg] = useState(() => {
      try {
        return sessionStorage.getItem(storageKey + "-organization") || "all";
      } catch {
        return "all";
      }
    }),
    [status, setStatus] = useState("all"),
    [commandOpen, setCommandOpen] = useState(false),
    [editing, setEditing] = useState(null),
    [newOrg, setNewOrg] = useState(false),
    [renamingOrg, setRenamingOrg] = useState(null),
    [deletingOrg, setDeletingOrg] = useState(null),
    [orgName, setOrgName] = useState(""),
    [resetting, setResetting] = useState(false),
    [pendingBulk, setPendingBulk] = useState(false);
  useEffect(() => {
    const change = () => {
      setView(currentView());
      window.scrollTo(0, 0);
      document.getElementById("main")?.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    const shortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const visibleState =
    !state || activeOrg === "all"
      ? state
      : {
          ...state,
          organizations: state.organizations.filter((o) => o.id === activeOrg),
          records: state.records.filter((r) => r.organization_id === activeOrg),
          published: state.published.filter(
            (r) => r.organization_id === activeOrg,
          ),
        };
  const visibleNav = activeOrg === "all" ? nav : nav.slice(0, 3);
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey + "-organization", activeOrg);
    } catch {}
  }, [activeOrg]);
  useEffect(() => {
    if (
      state &&
      activeOrg !== "all" &&
      !state.organizations.some((o) => o.id === activeOrg)
    )
      setActiveOrg("all");
  }, [state, activeOrg]);
  useEffect(() => {
    if (activeOrg !== "all" && ["fields", "organizations"].includes(view))
      location.hash = "#programs";
  }, [activeOrg, view]);
  const navigate = (id) => {
    location.hash = "#" + id;
  };
  const startCourse = (date) => {
    if (!visibleState.organizations.length) {
      setNewOrg(true);
      return;
    }
    setEditing(
      blankCourse(
        activeOrg !== "all"
          ? activeOrg
          : organization === "all"
            ? state.organizations[0]?.id
            : organization,
        date,
      ),
    );
  };
  const openCopy = (row) => {
    setEditing(copyCourse(row));
    toast("Course copied. Add the new dates and counts.");
  };
  const save = (row, intent, reason) => {
    if (intent === "submit" && !source.facilities.includes(row.facility))
      throw Error("Choose a facility from the list.");
    setState(saveCourse(state, row, intent, reason));
    toast.success(
      intent === "submit"
        ? "Course submitted. Report updated."
        : "Draft saved.",
    );
  };
  const scoped =
    visibleState?.records.filter(
      (r) => organization === "all" || r.organization_id === organization,
    ) || [];
  const rows = scoped
    .filter((r) => status === "all" || r.status === status)
    .sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""));
  const ready = rows.filter(
    (r) => r.status === "Completed" && r.report_state === "draft",
  );
  function bulkSubmit() {
    let next = state;
    try {
      for (const row of ready) {
        if (!source.facilities.includes(row.facility))
          throw Object.assign(Error("Choose a listed facility."), {
            course: row,
          });
        try {
          next = saveCourse(next, row, "submit");
        } catch (error) {
          throw Object.assign(error, { course: row });
        }
      }
      setState(next);
      setPendingBulk(false);
      toast.success(`${ready.length} courses submitted.`);
    } catch (error) {
      setPendingBulk(false);
      setEditing(error.course);
      toast.error(`Review ${error.course.program}: ${error.message}`);
    }
  }
  return (
    <SidebarProvider
      className="app-shell"
      style={{ "--sidebar-width": "14rem" }}
    >
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main").focus();
        }}
      >
        Skip to content
      </a>
      <Sidebar variant="inset" className="reference-sidebar">
        <SidebarHeader>
          <a href="#programs" className="sidebar-wordmark">
            Commonwork
          </a>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Main navigation">
            {[
              { label: "Reporting", items: nav.slice(0, 3) },
              ...(activeOrg === "all"
                ? [{ label: "Manage", items: nav.slice(3) }]
                : []),
            ].map((group) => (
              <div key={group.label} className="navigation-section">
                <SidebarGroup aria-label={group.label}>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={view === item.id}
                          >
                            <SidebarLink
                              href={"#" + item.id}
                              aria-current={
                                view === item.id ? "page" : undefined
                              }
                            >
                              <Icon strokeWidth={1.6} />
                              <span>{item.label}</span>
                            </SidebarLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroup>
                <Separator />
              </div>
            ))}
          </nav>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="account-switcher">
                <span className="account-avatar">
                  {activeOrg === "all"
                    ? "TP"
                    : state?.organizations
                        .find((o) => o.id === activeOrg)
                        ?.name.split(" ")
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join("")}
                </span>
                <span>
                  <strong>
                    {activeOrg === "all"
                      ? "TPW admin"
                      : state?.organizations.find((o) => o.id === activeOrg)
                          ?.name}
                  </strong>
                  <small>Switch organization</small>
                </span>
                <ChevronRight />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={12}
              className="organization-menu"
            >
              <DropdownMenuLabel>Switch view</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={activeOrg}
                onValueChange={(id) => {
                  setActiveOrg(id);
                  setOrganization("all");
                  navigate("programs");
                }}
              >
                <OrganizationOption value="all">TPW admin</OrganizationOption>
                {state?.organizations.map((o) => (
                  <OrganizationOption key={o.id} value={o.id}>
                    {o.name}
                  </OrganizationOption>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="app-main" id="main" tabIndex={-1}>
        <header className="top-bar">
          <div className="top-bar-inner">
            <div className="flex items-center gap-3">
              <MobileMenu />
              <Button
                variant="outline"
                className="command-trigger"
                onClick={() => setCommandOpen(true)}
              >
                <Search data-icon="inline-start" />
                <span>Search anything…</span>
                <Kbd>⌘ K</Kbd>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="database-status" role="status">
                {saveStatus === "saving"
                  ? "Saving…"
                  : saveStatus === "error"
                    ? "Not saved"
                    : saveStatus === "saved"
                      ? "Saved"
                      : "Loading…"}
              </span>
              <Badge variant="outline" className="demo-badge">
                Demo
              </Badge>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Demo options"
                  >
                    <MoreHorizontal />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-64 flex flex-col gap-3"
                >
                  <p className="text-sm text-muted-foreground">
                    Sample data. Changes are saved to {storage}.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!source}
                    onClick={() => setResetting(true)}
                  >
                    <RotateCcw data-icon="inline-start" />
                    Reset demo
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>
        <div className="page-content">
          {activeOrg !== "all" && (
            <div className="organization-view-note">
              <Building2 />
              <span>
                {state?.organizations.find((org) => org.id === activeOrg)?.name}
              </span>
              <span>Organization view</span>
            </div>
          )}

          {saveError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Changes haven’t saved</AlertTitle>
              <AlertDescription>
                {saveError}
                <Button variant="outline" size="sm" onClick={retry}>
                  Retry save
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loadError ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn’t load the demo</AlertTitle>
              <AlertDescription>
                {loadError}
                <Button variant="outline" onClick={() => location.reload()}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : !state ? (
            <div className="flex flex-col gap-6">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <>
              {view === "programs" && (
                <>
                  <div className="page-heading">
                    <div>
                      <h1>Programs</h1>
                      <p>
                        {scoped.length} reports
                        {activeOrg === "all" && organization === "all"
                          ? ` across ${visibleState.organizations.length} organizations`
                          : ""}
                        .
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {ready.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setPendingBulk(true)}
                        >
                          <Check data-icon="inline-start" />
                          Submit ready ({ready.length})
                        </Button>
                      )}
                      <Button onClick={() => startCourse()}>
                        <Plus data-icon="inline-start" />
                        Add course
                      </Button>
                    </div>
                  </div>
                  <div className="program-stats">
                    <span>
                      <strong>
                        {fmt(
                          scoped.filter((r) => r.status === "In Progress")
                            .length,
                        )}
                      </strong>{" "}
                      in progress
                    </span>
                    <span>
                      <strong>
                        {fmt(
                          scoped.filter((r) => r.status === "Completed").length,
                        )}
                      </strong>{" "}
                      completed
                    </span>
                    <span>
                      <strong>
                        {fmt(
                          scoped.filter((r) => r.status === "Planned").length,
                        )}
                      </strong>{" "}
                      planned
                    </span>
                  </div>
                  <section className="program-table-panel">
                    <div className="program-controls">
                      <ToggleGroup
                        type="single"
                        value={status}
                        onValueChange={(value) => {
                          if (value) setStatus(value);
                        }}
                        aria-label="Course status filter"
                        className="status-filters"
                      >
                        <ToggleGroupItem value="all">All</ToggleGroupItem>
                        <ToggleGroupItem value="In Progress">
                          In progress
                        </ToggleGroupItem>
                        <ToggleGroupItem value="Completed">
                          Completed
                        </ToggleGroupItem>
                        <ToggleGroupItem value="Planned">
                          Planned
                        </ToggleGroupItem>
                      </ToggleGroup>
                      <div className="flex flex-wrap gap-2">
                        <Choice
                          value={organization}
                          onChange={setOrganization}
                          label="Filter organization"
                          options={[
                            {
                              value: "all",
                              label:
                                activeOrg === "all"
                                  ? "All organizations"
                                  : "This organization",
                            },
                            ...visibleState.organizations.map((o) => ({
                              value: o.id,
                              label: o.name,
                            })),
                          ]}
                        />
                      </div>
                    </div>
                    <ProgramGroups
                      rows={rows}
                      state={visibleState}
                      onEdit={setEditing}
                      onCopy={openCopy}
                      onAdd={(orgId) => setEditing(blankCourse(orgId))}
                    />
                    {!rows.length && (
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Layers />
                          </EmptyMedia>
                          <EmptyTitle>No courses found</EmptyTitle>
                          <EmptyDescription>
                            Try another filter or add a course.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setStatus("all");
                              setOrganization("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        </EmptyContent>
                      </Empty>
                    )}
                    <div className="table-footer">
                      <span>{rows.length} courses</span>
                      <span>Sample data · Saved to {storage}</span>
                    </div>
                  </section>
                </>
              )}
              {view === "fields" && activeOrg === "all" && (
                <FieldsPage state={visibleState} setState={setState} />
              )}{" "}
              {view === "calendar" && (
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <CalendarPage
                    state={visibleState}
                    organization={organization}
                    onOrganization={setOrganization}
                    onEdit={setEditing}
                    onAdd={startCourse}
                  />
                </Suspense>
              )}{" "}
              {view === "impact" && (
                <ReportsPage
                  state={visibleState}
                  organization={organization}
                  onOrganization={setOrganization}
                />
              )}{" "}
              {view === "organizations" && activeOrg === "all" && (
                <>
                  <div className="page-heading">
                    <div>
                      <h1>Organizations</h1>
                      <p>Courses and reporting progress for each member.</p>
                    </div>
                    <Button
                      onClick={() => {
                        setRenamingOrg(null);
                        setOrgName("");
                        setNewOrg(true);
                      }}
                    >
                      <Plus data-icon="inline-start" />
                      Add organization
                    </Button>
                  </div>
                  <div className="organization-grid">
                    {state.organizations.map((org) => {
                      const courses = state.records.filter(
                          (r) => r.organization_id === org.id,
                        ),
                        submitted = courses.filter(
                          (r) => r.report_state === "submitted",
                        ).length;
                      return (
                        <Card key={org.id}>
                          <CardHeader>
                            <div className="organization-icon">
                              <Building2 />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle>{org.name}</CardTitle>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    aria-label={`Manage ${org.name}`}
                                  >
                                    <MoreHorizontal />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuGroup>
                                    <DropdownMenuItem
                                      onSelect={() => {
                                        setRenamingOrg(org);
                                        setOrgName(org.name);
                                        setNewOrg(true);
                                      }}
                                    >
                                      <Pencil />
                                      Rename organization
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onSelect={() => setDeletingOrg(org)}
                                    >
                                      <Trash2 />
                                      Delete organization
                                    </DropdownMenuItem>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <CardDescription>
                              {courses.length} courses
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="org-progress">
                              <span>{submitted} submitted</span>
                              <span>{courses.length - submitted} drafts</span>
                            </div>
                            <div className="org-progress-track">
                              <div
                                style={{
                                  width: `${courses.length ? (submitted / courses.length) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <Button
                              variant="outline"
                              className="mt-6 w-full justify-between"
                              onClick={() => {
                                setOrganization(org.id);
                                navigate("programs");
                              }}
                            >
                              View courses
                              <ChevronRight data-icon="inline-end" />
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <p className="page-footnote">
                    Demo organizations and reports are stored in {storage}.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </SidebarInset>
      {editing && state && (
        <CourseEditor
          key={editing.id || "new-" + editing.program}
          course={editing}
          state={visibleState}
          saveStatus={saveStatus}
          facilities={source.facilities}
          onClose={() => setEditing(null)}
          onSave={save}
          onCopy={openCopy}
        />
      )}
      <Dialog open={newOrg} onOpenChange={setNewOrg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {renamingOrg ? "Rename organization" : "Add an organization"}
            </DialogTitle>
            <DialogDescription>
              {renamingOrg
                ? "The new name will appear on its programs and reports."
                : "Create a member organization in this demo."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                setState(
                  renamingOrg
                    ? renameOrganization(state, renamingOrg.id, orgName)
                    : addOrganization(state, orgName),
                );
                setNewOrg(false);
                setOrgName("");
                toast.success(
                  renamingOrg ? "Organization renamed." : "Organization added.",
                );
                setRenamingOrg(null);
              } catch (error) {
                toast.error(error.message);
              }
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
                <Input
                  id="org-name"
                  required
                  minLength={2}
                  maxLength={150}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Nonprofit name"
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button type="submit">
                {renamingOrg ? "Save name" : "Add organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deletingOrg}
        onOpenChange={(open) => {
          if (!open) setDeletingOrg(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deletingOrg?.name}?</DialogTitle>
            <DialogDescription>
              This removes the organization and its{" "}
              {state?.records.filter(
                (r) => r.organization_id === deletingOrg?.id,
              ).length || 0}{" "}
              reports from Programs, Calendar, and report totals. You can undo
              this immediately after deletion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingOrg(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const id = deletingOrg.id;
                setState(deleteOrganization(state, id));
                if (organization === id) setOrganization("all");
                setDeletingOrg(null);
                toast.success("Organization deleted.", {
                  duration: 15000,
                  action: {
                    label: "Undo",
                    onClick: () => {
                      try {
                        setState(restoreOrganization(stateRef.current, id));
                      } catch (error) {
                        toast.error(error.message);
                      }
                    },
                  },
                });
              }}
            >
              Delete organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={resetting} onOpenChange={setResetting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset the demo?</DialogTitle>
            <DialogDescription>
              Your demo edits will be cleared and the original sample courses
              restored.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetting(false)}>
              Keep edits
            </Button>
            <Button
              onClick={() => {
                setState(initialDemo(source));
                setOrganization("all");
                setEditing(null);
                setResetting(false);
                navigate("programs");
                toast.success("Demo reset.");
              }}
            >
              Reset demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={pendingBulk} onOpenChange={setPendingBulk}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit {ready.length} completed courses?</DialogTitle>
            <DialogDescription>
              Courses must pass validation before they enter Reports.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-auto flex flex-col gap-2">
            {ready.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3"
              >
                <span>{r.program}</span>
                <Status status={r.status} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingBulk(false)}>
              Cancel
            </Button>
            <Button onClick={bulkSubmit}>Submit courses</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        title="Search"
        description="Find a program or open a page."
      >
        <CommandInput placeholder="Search programs or pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {visibleNav.map((item) => (
              <CommandItem
                key={item.id}
                value={"page " + item.label}
                onSelect={() => {
                  navigate(item.id);
                  setCommandOpen(false);
                }}
              >
                <item.icon />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Programs">
            {visibleState?.records.map((row) => (
              <CommandItem
                key={row.id}
                value={
                  row.id +
                  " " +
                  row.program +
                  " " +
                  row.facility +
                  " " +
                  state.organizations.find((o) => o.id === row.organization_id)
                    ?.name
                }
                onSelect={() => {
                  setEditing(row);
                  setCommandOpen(false);
                }}
              >
                <Layers />
                <span>
                  {row.program}
                  <small className="block text-xs text-muted-foreground">
                    {row.facility}
                  </small>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
}
export default App;
