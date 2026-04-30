"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Loader2,
  GripVertical,
  X,
  Plus,
  Dumbbell,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { saveProgramWorkouts, updateProgram } from "@/actions/programs";

const DAYS: { key: string; label: string; short: string }[] = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];

const DIFFICULTY_COLORS = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

type WorkoutItem = {
  id: string; // unique slot id
  programWorkoutId?: string;
  workoutId: string;
  title: string;
  difficulty: string | null;
  muscle_groups: string[];
  duration_mins: number | null;
  youtube_video_id: string | null;
  day: string;
  sortOrder: number;
};

type WorkoutLibraryItem = {
  id: string;
  title: string;
  difficulty: string | null;
  muscle_groups: string[];
  duration_mins: number | null;
  youtube_video_id: string | null;
};

interface ProgramBuilderProps {
  program: { id: string; name: string; description: string | null; is_template: boolean };
  allWorkouts: WorkoutLibraryItem[];
  initialProgramWorkouts: any[];
}

export function ProgramBuilder({ program, allWorkouts, initialProgramWorkouts }: ProgramBuilderProps) {
  const router = useRouter();
  const [programName, setProgramName] = useState(program.name);
  const [saving, setSaving] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Build initial schedule from DB
  const [schedule, setSchedule] = useState<Record<string, WorkoutItem[]>>(() => {
    const initial: Record<string, WorkoutItem[]> = {};
    DAYS.forEach((d) => (initial[d.key] = []));

    initialProgramWorkouts.forEach((pw: any) => {
      const w = pw.workouts;
      if (!w || !initial[pw.day_of_week]) return;
      initial[pw.day_of_week].push({
        id: `slot-${pw.id}`,
        programWorkoutId: pw.id,
        workoutId: w.id,
        title: w.title,
        difficulty: w.difficulty,
        muscle_groups: w.muscle_groups || [],
        duration_mins: w.duration_mins,
        youtube_video_id: w.youtube_video_id,
        day: pw.day_of_week,
        sortOrder: pw.sort_order,
      });
    });

    // Sort each day
    DAYS.forEach((d) => {
      initial[d.key].sort((a, b) => a.sortOrder - b.sortOrder);
    });

    return initial;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredWorkouts = allWorkouts.filter((w) =>
    w.title.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  function addWorkoutToDay(workout: WorkoutLibraryItem, day: string) {
    const existing = schedule[day];
    const newItem: WorkoutItem = {
      id: `new-${Date.now()}-${Math.random()}`,
      workoutId: workout.id,
      title: workout.title,
      difficulty: workout.difficulty,
      muscle_groups: workout.muscle_groups || [],
      duration_mins: workout.duration_mins,
      youtube_video_id: workout.youtube_video_id,
      day,
      sortOrder: existing.length,
    };
    setSchedule((prev) => ({ ...prev, [day]: [...prev[day], newItem] }));
  }

  function removeWorkout(day: string, slotId: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((w) => w.id !== slotId),
    }));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeSlotId = active.id as string;
    const overId = over.id as string;

    // Find source day
    let sourceDay = "";
    for (const day of DAYS) {
      if (schedule[day.key].find((w) => w.id === activeSlotId)) {
        sourceDay = day.key;
        break;
      }
    }

    if (!sourceDay) return;

    // Find target day (could be a day column or another slot)
    let targetDay = "";
    if (DAYS.find((d) => d.key === overId)) {
      targetDay = overId;
    } else {
      for (const day of DAYS) {
        if (schedule[day.key].find((w) => w.id === overId)) {
          targetDay = day.key;
          break;
        }
      }
    }

    if (!targetDay) return;

    if (sourceDay === targetDay) {
      // Reorder within same day
      const items = schedule[sourceDay];
      const oldIndex = items.findIndex((w) => w.id === activeSlotId);
      const newIndex = items.findIndex((w) => w.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setSchedule((prev) => ({
          ...prev,
          [sourceDay]: arrayMove(prev[sourceDay], oldIndex, newIndex),
        }));
      }
    } else {
      // Move to different day
      const sourceItems = schedule[sourceDay].filter((w) => w.id !== activeSlotId);
      const movedItem = schedule[sourceDay].find((w) => w.id === activeSlotId);
      if (!movedItem) return;
      const targetItems = [...schedule[targetDay], { ...movedItem, day: targetDay }];
      setSchedule((prev) => ({
        ...prev,
        [sourceDay]: sourceItems,
        [targetDay]: targetItems,
      }));
    }
  }

  async function handleSave() {
    setSaving(true);

    // Update program name if changed
    if (programName !== program.name) {
      await updateProgram({ id: program.id, name: programName });
    }

    // Flatten schedule
    const workouts: Array<{ workoutId: string; dayOfWeek: string; sortOrder: number }> = [];
    DAYS.forEach((d) => {
      schedule[d.key].forEach((w, idx) => {
        workouts.push({ workoutId: w.workoutId, dayOfWeek: d.key, sortOrder: idx });
      });
    });

    const result = await saveProgramWorkouts(program.id, workouts);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Program saved!");
      router.refresh();
    }
    setSaving(false);
  }

  const totalWorkouts = DAYS.reduce((sum, d) => sum + schedule[d.key].length, 0);

  const activeItem = activeId
    ? Object.values(schedule)
        .flat()
        .find((w) => w.id === activeId)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="icon" className="-ml-2">
          <Link href="/programs"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <Input
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            className="text-xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent text-slate-900"
          />
          <p className="text-xs text-slate-400 mt-0.5">{totalWorkouts} workout{totalWorkouts !== 1 ? "s" : ""} scheduled</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-500 hover:bg-blue-600 text-white shrink-0">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Workout Library Sidebar */}
        <div className="hidden lg:flex flex-col w-64 shrink-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Workout Library</p>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <ScrollArea className="flex-1 rounded-lg border bg-white">
            <div className="p-2 space-y-1.5">
              {filteredWorkouts.length === 0 ? (
                <p className="text-xs text-slate-400 p-2 text-center">No workouts found</p>
              ) : (
                filteredWorkouts.map((w) => (
                  <LibraryWorkoutCard key={w.id} workout={w} onAddToDay={addWorkoutToDay} days={DAYS} />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Weekly Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto">
            <div className="grid grid-cols-7 gap-3 min-w-[800px]">
              {DAYS.map((day) => (
                <DayColumn
                  key={day.key}
                  day={day}
                  items={schedule[day.key]}
                  onRemove={(slotId) => removeWorkout(day.key, slotId)}
                  allWorkouts={allWorkouts}
                  onAdd={addWorkoutToDay}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeItem && (
              <div className="rounded-lg border border-blue-300 bg-blue-50 p-2 shadow-lg opacity-90">
                <p className="text-xs font-medium text-blue-800 truncate">{activeItem.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function DayColumn({
  day,
  items,
  onRemove,
  allWorkouts,
  onAdd,
}: {
  day: { key: string; label: string; short: string };
  items: WorkoutItem[];
  onRemove: (slotId: string) => void;
  allWorkouts: WorkoutLibraryItem[];
  onAdd: (workout: WorkoutLibraryItem, day: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="mb-2 text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{day.short}</p>
        {items.length > 0 && (
          <span className="text-xs text-slate-400">{items.length}</span>
        )}
      </div>
      <SortableContext items={items.map((w) => w.id)} strategy={verticalListSortingStrategy} id={day.key}>
        <div
          className="flex-1 min-h-[400px] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-2 space-y-2 transition-colors"
          id={day.key}
        >
          {items.map((item) => (
            <SortableWorkoutSlot key={item.id} item={item} onRemove={onRemove} />
          ))}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="h-3 w-3" />Add
          </button>
          {showAdd && (
            <div className="rounded-lg border bg-white shadow-sm">
              <ScrollArea className="max-h-48">
                <div className="p-1 space-y-0.5">
                  {allWorkouts.map((w) => (
                    <button
                      key={w.id}
                      className="w-full rounded px-2 py-1.5 text-left text-xs hover:bg-blue-50 transition-colors"
                      onClick={() => { onAdd(w, day.key); setShowAdd(false); }}
                    >
                      <span className="font-medium text-slate-800 block truncate">{w.title}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableWorkoutSlot({ item, onRemove }: { item: WorkoutItem; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const diffColor =
    item.difficulty && item.difficulty in DIFFICULTY_COLORS
      ? DIFFICULTY_COLORS[item.difficulty as keyof typeof DIFFICULTY_COLORS]
      : "bg-slate-100 text-slate-600";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-lg border bg-white p-2 shadow-sm hover:border-blue-200 transition-colors"
    >
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-slate-300 hover:text-slate-500 shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-800 truncate leading-tight">{item.title}</p>
          {item.difficulty && (
            <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${diffColor}`}>
              {item.difficulty}
            </span>
          )}
          {item.duration_mins && (
            <span className="ml-1 text-[10px] text-slate-400">{item.duration_mins}m</span>
          )}
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="shrink-0 text-slate-300 hover:text-red-500 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function LibraryWorkoutCard({
  workout,
  onAddToDay,
  days,
}: {
  workout: WorkoutLibraryItem;
  onAddToDay: (workout: WorkoutLibraryItem, day: string) => void;
  days: typeof DAYS;
}) {
  const [showDays, setShowDays] = useState(false);

  return (
    <div className="rounded-lg border bg-white text-xs">
      <button
        className="w-full flex items-center gap-2 p-2 text-left hover:bg-slate-50 transition-colors rounded-lg"
        onClick={() => setShowDays(!showDays)}
      >
        <Dumbbell className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="flex-1 truncate font-medium text-slate-700">{workout.title}</span>
        {showDays ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>
      {showDays && (
        <div className="border-t p-2 grid grid-cols-4 gap-1">
          {days.map((day) => (
            <button
              key={day.key}
              onClick={() => { onAddToDay(workout, day.key); setShowDays(false); }}
              className="rounded px-1 py-1 text-center text-[10px] font-medium text-slate-600 bg-slate-50 hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              {day.short}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
