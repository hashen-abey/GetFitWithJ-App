"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useState, useTransition } from "react";

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "Glutes", "Full Body"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

export function WorkoutFilters({
  initialQ,
  initialDifficulty,
  initialMuscle,
}: {
  initialQ: string;
  initialDifficulty: string;
  initialMuscle: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [difficulty, setDifficulty] = useState(initialDifficulty || "all");
  const [muscle, setMuscle] = useState(initialMuscle || "all");
  const [isPending, startTransition] = useTransition();

  function apply(newQ: string, newDiff: string, newMuscle: string) {
    const params = new URLSearchParams();
    if (newQ) params.set("q", newQ);
    if (newDiff && newDiff !== "all") params.set("difficulty", newDiff);
    if (newMuscle && newMuscle !== "all") params.set("muscle", newMuscle);
    startTransition(() => router.push(`/workouts?${params.toString()}`));
  }

  function clear() {
    setQ("");
    setDifficulty("all");
    setMuscle("all");
    startTransition(() => router.push("/workouts"));
  }

  const hasFilters = q || (difficulty && difficulty !== "all") || (muscle && muscle !== "all");

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search workouts..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            apply(e.target.value, difficulty, muscle);
          }}
          className="pl-9"
        />
      </div>
      <Select value={difficulty} onValueChange={(v) => { setDifficulty(v); apply(q, v, muscle); }}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All levels</SelectItem>
          {DIFFICULTIES.map((d) => (
            <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={muscle} onValueChange={(v) => { setMuscle(v); apply(q, difficulty, v); }}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Muscle group" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All muscles</SelectItem>
          {MUSCLE_GROUPS.map((mg) => (
            <SelectItem key={mg} value={mg}>{mg}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="text-slate-500">
          <X className="h-4 w-4 mr-1" />Clear
        </Button>
      )}
    </div>
  );
}
