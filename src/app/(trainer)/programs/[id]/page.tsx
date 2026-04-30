import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProgramBuilder } from "./program-builder";

export const dynamic = "force-dynamic";

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const [programRes, workoutsRes, programWorkoutsRes] = await Promise.all([
    supabase.from("programs").select("*").eq("id", params.id).single(),
    supabase.from("workouts").select("id, title, difficulty, muscle_groups, duration_mins, youtube_video_id").order("title"),
    supabase
      .from("program_workouts")
      .select("*, workouts!program_workouts_workout_id_fkey(id, title, difficulty, muscle_groups, duration_mins, youtube_video_id)")
      .eq("program_id", params.id)
      .order("sort_order"),
  ]);

  if (!programRes.data) notFound();

  return (
    <ProgramBuilder
      program={programRes.data}
      allWorkouts={workoutsRes.data || []}
      initialProgramWorkouts={programWorkoutsRes.data || []}
    />
  );
}
