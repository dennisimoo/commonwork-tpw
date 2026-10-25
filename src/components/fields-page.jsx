import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Check,
  GripVertical,
  Pencil,
  Archive,
  ArchiveRestore,
  Type,
  Hash,
  CalendarDays,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  fixedRequired,
  fieldSection,
  fieldInputType,
} from "../../public/report-fields.mjs";
import { saveFieldConfig, reorderFields } from "@/lib/demo-store.mjs";
import { Choice } from "./controls";
import { toast } from "sonner";
const types = {
  text: { label: "Text", icon: Type },
  number: { label: "Number", icon: Hash },
  date: { label: "Date", icon: CalendarDays },
  choice: { label: "Choice", icon: ListFilter },
};
const fieldType = fieldInputType;
const verticalOnly = ({ transform }) => ({ ...transform, x: 0 });
function SortableFieldRow({ field, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    disabled: !field.active,
    transition: { duration: 160, easing: "cubic-bezier(.2,.8,.2,1)" },
  });
  return (
    <TableRow
      ref={setNodeRef}
      data-dragging={isDragging || undefined}
      className="sortable-field-row"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <TableCell className="field-grip-cell">
        <Button
          ref={setActivatorNodeRef}
          variant="ghost"
          size="icon-sm"
          className="field-grip"
          disabled={!field.active}
          {...attributes}
          {...listeners}
          aria-label={`Drag ${field.label} to reorder`}
        >
          <GripVertical />
        </Button>
      </TableCell>
      {children}
    </TableRow>
  );
}
export default function FieldsPage({ state, setState }) {
  const [fields, setFields] = useState(() =>
      structuredClone(state.fields.fields),
    ),
    [draft, setDraft] = useState(null),
    [showRemoved, setShowRemoved] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const dirty = JSON.stringify(fields) !== JSON.stringify(state.fields.fields);
  const change = (id, patch) =>
    setFields((list) =>
      list.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  const commit = (nextFields) => {
    try {
      const next = saveFieldConfig(state, nextFields);
      setState(next);
      setFields(structuredClone(next.fields.fields));
      toast.success("Fields saved.");
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };
  const beginAdd = () =>
    setDraft({
      id: "custom_" + crypto.randomUUID(),
      label: "",
      type: "text",
      active: true,
      required: false,
    });
  const isNew = draft && !fields.some((f) => f.id === draft.id),
    core = draft?.type === "core";
  const editField = (f) => setDraft({ ...f });
  const collision = (args) =>
    closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container) =>
          fieldSection(container.id) === fieldSection(args.active.id),
      ),
    });
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Fields</h1>
          <p>Drag to reorder. Click a field to edit its settings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={beginAdd}>
            <Plus data-icon="inline-start" />
            Add field
          </Button>
          <Button disabled={!dirty} onClick={() => commit(fields)}>
            <Check data-icon="inline-start" />
            {dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        modifiers={[verticalOnly]}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Press Space to pick up a field. Use the up and down arrows to move it within its section. Press Space to drop, or Escape to cancel.",
          },
        }}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id)
            setFields((list) => reorderFields(list, active.id, over.id));
        }}
      >
        <Card className="fields-table">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <span className="sr-only">Drag to reorder</span>
                  </TableHead>
                  <TableHead>Field name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>
                    <span className="sr-only">Edit</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              {["Course", "Counts", "Notes"].map((section) => {
                const sectionFields = fields.filter(
                  (f) =>
                    fieldSection(f.id) === section && (showRemoved || f.active),
                );
                return (
                  <TableBody key={section}>
                    <TableRow className="field-section-heading">
                      <TableCell colSpan={5}>{section}</TableCell>
                    </TableRow>
                    <SortableContext
                      items={sectionFields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sectionFields.map((f) => {
                        const kind = types[fieldType(f)],
                          Icon = kind.icon;
                        return (
                          <SortableFieldRow field={f} key={f.id}>
                            <TableCell>
                              <button
                                className="field-name-button"
                                onClick={() => editField(f)}
                              >
                                {f.label}
                                {!f.active && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    · Removed
                                  </span>
                                )}
                              </button>
                            </TableCell>
                            <TableCell>
                              <button
                                className="field-type-button"
                                aria-label={`Edit type for ${f.label}`}
                                onClick={() => editField(f)}
                              >
                                <Badge variant="outline" className="field-kind">
                                  <Icon />
                                  {kind.label}
                                </Badge>
                              </button>
                            </TableCell>
                            <TableCell>
                              {fixedRequired(f.id) ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                      <Switch
                                        checked
                                        disabled
                                        aria-label={`Require ${f.label}`}
                                      />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Needed for a valid submitted report.
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Switch
                                  checked={f.required}
                                  disabled={!f.active}
                                  aria-label={`Require ${f.label}`}
                                  onCheckedChange={(value) =>
                                    change(f.id, { required: value })
                                  }
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${f.label}`}
                                onClick={() => editField(f)}
                              >
                                <Pencil />
                              </Button>
                            </TableCell>
                          </SortableFieldRow>
                        );
                      })}
                    </SortableContext>
                  </TableBody>
                );
              })}
            </Table>
          </CardContent>
        </Card>
      </DndContext>
      <div className="fields-footer">
        <span>
          Reorder within each section. Changes appear in the reporting form.
        </span>
        {fields.some((f) => !f.active) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRemoved((v) => !v)}
          >
            {showRemoved ? "Hide removed" : "Show removed"}
          </Button>
        )}
      </div>
      <Sheet
        open={!!draft}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
      >
        <SheetContent className="field-settings-sheet">
          <SheetHeader>
            <SheetTitle>{isNew ? "Add a field" : "Edit field"}</SheetTitle>
            <SheetDescription>
              {draft ? `${fieldSection(draft.id)} section` : ""}
            </SheetDescription>
          </SheetHeader>
          {draft && (
            <form
              className="field-settings-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (isNew && fields.length >= 40) {
                  toast.error("You can have up to 40 fields.");
                  return;
                }
                const next = isNew
                  ? [...fields, draft]
                  : fields.map((f) => (f.id === draft.id ? draft : f));
                if (commit(next)) setDraft(null);
              }}
            >
              <div className="field-settings-body">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="field-name">Name</FieldLabel>
                    <Input
                      id="field-name"
                      value={draft.label}
                      required
                      maxLength={80}
                      placeholder="e.g. Facilitator hours"
                      onChange={(e) =>
                        setDraft((f) => ({ ...f, label: e.target.value }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Type</FieldLabel>
                    <Choice
                      label="Field type"
                      value={fieldType(draft)}
                      onChange={(value) =>
                        setDraft((f) =>
                          f.type === "core"
                            ? { ...f, input_type: value }
                            : { ...f, type: value },
                        )
                      }
                      options={[
                        { value: "text", label: "Text" },
                        { value: "number", label: "Number" },
                        { value: "date", label: "Date" },
                        ...(["facility", "status", "data_basis"].includes(
                          draft.id,
                        )
                          ? [{ value: "choice", label: "Choice" }]
                          : []),
                      ]}
                      className="w-full"
                    />
                    <FieldDescription>
                      Saved answers are checked before the type changes. Report
                      calculations still validate numbers and dates.
                    </FieldDescription>
                  </Field>
                  <Field orientation="horizontal">
                    <div className="flex flex-1 flex-col gap-1">
                      <FieldLabel htmlFor="field-required">
                        Required to submit
                      </FieldLabel>
                      <FieldDescription>
                        {fixedRequired(draft.id)
                          ? "Needed for a valid submitted report."
                          : "Drafts can be saved without an answer."}
                      </FieldDescription>
                    </div>
                    <Switch
                      id="field-required"
                      checked={fixedRequired(draft.id) || draft.required}
                      disabled={fixedRequired(draft.id)}
                      onCheckedChange={(value) =>
                        setDraft((f) => ({ ...f, required: value }))
                      }
                    />
                  </Field>
                </FieldGroup>
                {!core && !isNew && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-8"
                    onClick={() => {
                      const next = fields.map((f) =>
                        f.id === draft.id
                          ? { ...draft, active: !draft.active }
                          : f,
                      );
                      if (commit(next)) setDraft(null);
                    }}
                  >
                    {draft.active ? (
                      <Archive data-icon="inline-start" />
                    ) : (
                      <ArchiveRestore data-icon="inline-start" />
                    )}
                    {draft.active ? "Remove field" : "Restore field"}
                  </Button>
                )}
              </div>
              <SheetFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!draft.label.trim()}>
                  {isNew ? "Add field" : "Save field"}
                </Button>
              </SheetFooter>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
