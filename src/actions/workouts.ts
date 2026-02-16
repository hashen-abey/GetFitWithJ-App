"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  workoutTemplateSchema,
  exerciseSchema,
  workoutAssignmentSchema,
  workoutCompletionSchema,
  type WorkoutTemplateInput,
  type ExerciseInput,
  type WorkoutAssignmentInput,
  type WorkoutCompletionInput,
} from "@/lib/validators";
import { revalidatePath } from "next/cache";

// ==================== TEMPLATES ====================

export async function getWorkoutTemplates() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getWorkoutTemplate(id: string) {
  const supabase = createServerSupabaseClient();
  const { data: template, error: tError } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (tError) return { error: tError.message };

  const { data: exercises, error: eError } = await supabase
    .from("workout_template_exercises")
    .select("*")
    .eq("template_id", id)
    .order("sort_order");

  if (eError) return { error: eError.message };

  return { data: { ...template, exercises: exercises || [] } };
}

export async function createWorkoutTemplate(
  input: WorkoutTemplateInput,
  exercises: ExerciseInput[]
) {
  const parsed = workoutTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();

  const { data: template, error: tError } = await supabase
    .from("workout_templates")
    .insert(parsed.data)
    .select()
    .single();

  if (tError) return { error: tError.message };

  if (exercises.length > 0) {
    const exerciseRows = exercises.map((ex, i) => {
      const parsedEx = exerciseSchema.parse(ex);
      return {
        ...parsedEx,
        template_id: template.id,
        sort_order: i,
        video_url: parsedEx.video_url || null,
        image_url: parsedEx.image_url || null,
      };
    });

    const { error: eError } = await supabase
      .from("workout_template_exercises")
      .insert(exerciseRows);

    if (eError) return { error: eError.message };
  }

  revalidatePath("/admin/workouts");
  return { data: template.id };
}

export async function updateWorkoutTemplate(
  id: string,
  input: WorkoutTemplateInput,
  exercises: ExerciseInput[]
) {
  const parsed = workoutTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();

  const { error: tError } = await supabase
    .from("workout_templates")
    .update(parsed.data)
    .eq("id", id);

  if (tError) return { error: tError.message };

  // Delete existing exercises and re-insert
  await supabase
    .from("workout_template_exercises")
    .delete()
    .eq("template_id", id);

  if (exercises.length > 0) {
    const exerciseRows = exercises.map((ex, i) => {
      const parsedEx = exerciseSchema.parse(ex);
      return {
        ...parsedEx,
        template_id: id,
        sort_order: i,
        video_url: parsedEx.video_url || null,
        image_url: parsedEx.image_url || null,
      };
    });

    const { error: eError } = await supabase
      .from("workout_template_exercises")
      .insert(exerciseRows);

    if (eError) return { error: eError.message };
  }

  revalidatePath("/admin/workouts");
  return { success: true };
}

export async function deleteWorkoutTemplate(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("workout_templates")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/workouts");
  return { success: true };
}

// ==================== ASSIGNMENTS ====================

export async function getWorkoutAssignments(clientId?: string) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("workout_assignments")
    .select("*, profiles!workout_assignments_client_id_fkey(full_name)")
    .eq("is_active", true)
    .order("start_date", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

export async function getWorkoutAssignment(id: string) {
  const supabase = createServerSupabaseClient();
  const { data: assignment, error: aError } = await supabase
    .from("workout_assignments")
    .select("*")
    .eq("id", id)
    .single();

  if (aError) return { error: aError.message };

  const { data: exercises, error: eError } = await supabase
    .from("workout_assignment_exercises")
    .select("*")
    .eq("assignment_id", id)
    .order("sort_order");

  if (eError) return { error: eError.message };

  return { data: { ...assignment, exercises: exercises || [] } };
}

export async function createWorkoutAssignment(
  input: WorkoutAssignmentInput,
  exercises: ExerciseInput[]
) {
  const parsed = workoutAssignmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();

  const { data: assignment, error: aError } = await supabase
    .from("workout_assignments")
    .insert(parsed.data)
    .select()
    .single();

  if (aError) return { error: aError.message };

  if (exercises.length > 0) {
    const exerciseRows = exercises.map((ex, i) => {
      const parsedEx = exerciseSchema.parse(ex);
      return {
        ...parsedEx,
        assignment_id: assignment.id,
        sort_order: i,
        video_url: parsedEx.video_url || null,
        image_url: parsedEx.image_url || null,
      };
    });

    const { error: eError } = await supabase
      .from("workout_assignment_exercises")
      .insert(exerciseRows);

    if (eError) return { error: eError.message };
  }

  revalidatePath("/admin/clients");
  revalidatePath("/workouts");
  return { data: assignment.id };
}

export async function assignTemplateToClient(
  templateId: string,
  clientId: string,
  startDate: string,
  endDate?: string,
  clientNotes?: string
) {
  const supabase = createServerSupabaseClient();

  // Get template
  const { data: template } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (!template) return { error: "Template not found" };

  // Get template exercises
  const { data: exercises } = await supabase
    .from("workout_template_exercises")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order");

  // Create assignment
  const { data: assignment, error: aError } = await supabase
    .from("workout_assignments")
    .insert({
      client_id: clientId,
      template_id: templateId,
      name: template.name,
      description: template.description,
      trainer_notes: template.trainer_notes,
      client_notes: clientNotes || null,
      start_date: startDate,
      end_date: endDate || null,
    })
    .select()
    .single();

  if (aError) return { error: aError.message };

  // Copy exercises
  if (exercises && exercises.length > 0) {
    const exerciseRows = exercises.map((ex) => ({
      assignment_id: assignment.id,
      name: ex.name,
      description: ex.description,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
      video_url: ex.video_url,
      image_url: ex.image_url,
      notes: ex.notes,
      sort_order: ex.sort_order,
    }));

    await supabase
      .from("workout_assignment_exercises")
      .insert(exerciseRows);
  }

  revalidatePath("/admin/clients");
  revalidatePath("/workouts");
  return { data: assignment.id };
}

export async function deleteWorkoutAssignment(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("workout_assignments")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath("/workouts");
  return { success: true };
}

// ==================== COMPLETIONS ====================

export async function completeWorkout(input: WorkoutCompletionInput) {
  const parsed = workoutCompletionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("workout_completions").insert({
    ...parsed.data,
    client_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getWorkoutCompletions(
  clientId?: string,
  assignmentId?: string
) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("workout_completions")
    .select("*")
    .order("completed_at", { ascending: false });

  if (clientId) query = query.eq("client_id", clientId);
  if (assignmentId) query = query.eq("assignment_id", assignmentId);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

export async function getRecentCompletions(limit = 10) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workout_completions")
    .select(
      "*, profiles!workout_completions_client_id_fkey(full_name), workout_assignments!workout_completions_assignment_id_fkey(name)"
    )
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) return { error: error.message };
  return { data };
}
