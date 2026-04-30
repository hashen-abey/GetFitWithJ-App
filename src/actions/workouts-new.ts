"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createWorkout({
  title,
  description,
  youtubeUrl,
  difficulty,
  muscleGroups,
  durationMins,
}: {
  title: string;
  description?: string;
  youtubeUrl?: string;
  difficulty?: string;
  muscleGroups?: string[];
  durationMins?: number;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      title,
      description: description || null,
      youtube_url: youtubeUrl || null,
      difficulty: (difficulty as any) || null,
      muscle_groups: muscleGroups || [],
      duration_mins: durationMins || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/workouts");
  return { id: data.id };
}

export async function updateWorkout({
  id,
  title,
  description,
  youtubeUrl,
  difficulty,
  muscleGroups,
  durationMins,
}: {
  id: string;
  title: string;
  description?: string;
  youtubeUrl?: string;
  difficulty?: string;
  muscleGroups?: string[];
  durationMins?: number;
}) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("workouts")
    .update({
      title,
      description: description || null,
      youtube_url: youtubeUrl || null,
      difficulty: (difficulty as any) || null,
      muscle_groups: muscleGroups || [],
      duration_mins: durationMins || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/workouts");
  revalidatePath(`/workouts/${id}`);
  return { success: true };
}

export async function deleteWorkout(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/workouts");
  return { success: true };
}
