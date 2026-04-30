import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { YouTubeThumbnail } from "@/components/shared/youtube-embed";
import { Plus, Dumbbell, Clock, Search } from "lucide-react";
import { WorkoutFilters } from "./workout-filters";

export const dynamic = "force-dynamic";

const MUSCLE_COLORS: Record<string, string> = {
  chest: "bg-red-100 text-red-700",
  back: "bg-blue-100 text-blue-700",
  legs: "bg-green-100 text-green-700",
  shoulders: "bg-yellow-100 text-yellow-700",
  arms: "bg-purple-100 text-purple-700",
  core: "bg-orange-100 text-orange-700",
  cardio: "bg-pink-100 text-pink-700",
  glutes: "bg-teal-100 text-teal-700",
  default: "bg-slate-100 text-slate-600",
};

const DIFFICULTY_COLORS = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: { q?: string; difficulty?: string; muscle?: string };
}) {
  const supabase = createServerSupabaseClient();

  const q = searchParams.q || "";
  const difficulty = searchParams.difficulty || "";
  const muscle = searchParams.muscle || "";

  let query = supabase
    .from("workouts")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("title", `%${q}%`);
  if (difficulty) query = query.eq("difficulty", difficulty);
  if (muscle) query = query.contains("muscle_groups", [muscle]);

  const { data: workouts } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workout Library</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {workouts?.length || 0} workout{workouts?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
          <Link href="/workouts/new">
            <Plus className="h-4 w-4 mr-1.5" />Add Workout
          </Link>
        </Button>
      </div>

      <WorkoutFilters initialQ={q} initialDifficulty={difficulty} initialMuscle={muscle} />

      {!workouts || workouts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Dumbbell className="h-10 w-10 text-slate-300" />
          <div>
            <p className="font-medium text-slate-600">No workouts found</p>
            <p className="text-sm text-slate-400 mt-1">Add your first workout to build your library</p>
          </div>
          <Button asChild size="sm" className="mt-2 bg-blue-500 hover:bg-blue-600 text-white">
            <Link href="/workouts/new"><Plus className="h-4 w-4 mr-1" />Add Workout</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workouts.map((workout: any) => (
            <Link key={workout.id} href={`/workouts/${workout.id}`} className="group block">
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-blue-200 cursor-pointer">
                {workout.youtube_video_id ? (
                  <YouTubeThumbnail videoId={workout.youtube_video_id} title={workout.title} />
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                    <Dumbbell className="h-10 w-10 text-slate-500" />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {workout.title}
                  </h3>
                  {workout.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{workout.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {workout.difficulty && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[workout.difficulty as keyof typeof DIFFICULTY_COLORS] || "bg-slate-100 text-slate-600"}`}>
                        {workout.difficulty}
                      </span>
                    )}
                    {workout.muscle_groups?.slice(0, 3).map((mg: string) => (
                      <span
                        key={mg}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${MUSCLE_COLORS[mg.toLowerCase()] || MUSCLE_COLORS.default}`}
                      >
                        {mg}
                      </span>
                    ))}
                  </div>
                  {workout.duration_mins && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {workout.duration_mins} min
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
