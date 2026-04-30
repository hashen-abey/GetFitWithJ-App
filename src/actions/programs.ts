"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProgram({
  name,
  description,
  isTemplate,
}: {
  name: string;
  description?: string;
  isTemplate?: boolean;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("programs")
    .insert({ name, description: description || null, trainer_id: user.id, is_template: isTemplate || false })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/programs");
  return { id: data.id };
}

export async function updateProgram({
  id,
  name,
  description,
}: {
  id: string;
  name: string;
  description?: string;
}) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("programs")
    .update({ name, description: description || null })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/programs");
  revalidatePath(`/programs/${id}`);
  return { success: true };
}

export async function deleteProgram(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/programs");
  return { success: true };
}

export async function addWorkoutToProgram({
  programId,
  workoutId,
  dayOfWeek,
  sortOrder,
}: {
  programId: string;
  workoutId: string;
  dayOfWeek: string;
  sortOrder: number;
}) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("program_workouts")
    .insert({ program_id: programId, workout_id: workoutId, day_of_week: dayOfWeek as any, sort_order: sortOrder });

  if (error) return { error: error.message };
  revalidatePath(`/programs/${programId}`);
  return { success: true };
}

export async function removeWorkoutFromProgram(programWorkoutId: string, programId: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("program_workouts")
    .delete()
    .eq("id", programWorkoutId);

  if (error) return { error: error.message };
  revalidatePath(`/programs/${programId}`);
  return { success: true };
}

export async function assignProgram({
  clientId,
  programId,
  startDate,
}: {
  clientId: string;
  programId: string;
  startDate: string;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Deactivate existing
  await supabase
    .from("client_programs")
    .update({ is_active: false })
    .eq("client_id", clientId)
    .eq("is_active", true);

  const { error } = await supabase
    .from("client_programs")
    .insert({ client_id: clientId, program_id: programId, start_date: startDate });

  if (error) return { error: error.message };

  // Notify client
  await supabase.from("notifications").insert({
    user_id: clientId,
    type: "program_assigned",
    payload: { program_id: programId },
  });

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function saveProgramWorkouts(
  programId: string,
  workouts: Array<{ workoutId: string; dayOfWeek: string; sortOrder: number }>
) {
  const supabase = createServerSupabaseClient();

  // Delete all existing
  await supabase.from("program_workouts").delete().eq("program_id", programId);

  if (workouts.length === 0) {
    revalidatePath(`/programs/${programId}`);
    return { success: true };
  }

  const { error } = await supabase.from("program_workouts").insert(
    workouts.map((w) => ({
      program_id: programId,
      workout_id: w.workoutId,
      day_of_week: w.dayOfWeek as any,
      sort_order: w.sortOrder,
    }))
  );

  if (error) return { error: error.message };
  revalidatePath(`/programs/${programId}`);
  return { success: true };
}
