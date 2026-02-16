"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  mealPlanSchema,
  mealItemSchema,
  mealAssignmentSchema,
  type MealPlanInput,
  type MealItemInput,
  type MealAssignmentInput,
} from "@/lib/validators";
import { revalidatePath } from "next/cache";

// ==================== MEAL PLANS ====================

export async function getMealPlans() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getMealPlan(id: string) {
  const supabase = createServerSupabaseClient();

  const { data: plan, error: pError } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", id)
    .single();

  if (pError) return { error: pError.message };

  const { data: days, error: dError } = await supabase
    .from("meal_plan_days")
    .select("*, meal_plan_items(*)")
    .eq("plan_id", id)
    .order("day_of_week");

  if (dError) return { error: dError.message };

  return { data: { ...plan, days: days || [] } };
}

interface MealDayInput {
  day_of_week: string;
  notes?: string;
  items: MealItemInput[];
}

export async function createMealPlan(
  input: MealPlanInput,
  days: MealDayInput[]
) {
  const parsed = mealPlanSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();

  const { data: plan, error: pError } = await supabase
    .from("meal_plans")
    .insert(parsed.data)
    .select()
    .single();

  if (pError) return { error: pError.message };

  for (const day of days) {
    const { data: dayRow, error: dError } = await supabase
      .from("meal_plan_days")
      .insert({
        plan_id: plan.id,
        day_of_week: day.day_of_week,
        notes: day.notes || null,
      })
      .select()
      .single();

    if (dError) return { error: dError.message };

    if (day.items.length > 0) {
      const itemRows = day.items.map((item, i) => {
        const parsedItem = mealItemSchema.parse(item);
        return {
          ...parsedItem,
          day_id: dayRow.id,
          sort_order: i,
        };
      });

      const { error: iError } = await supabase
        .from("meal_plan_items")
        .insert(itemRows);

      if (iError) return { error: iError.message };
    }
  }

  revalidatePath("/admin/meals");
  return { data: plan.id };
}

export async function updateMealPlan(
  id: string,
  input: MealPlanInput,
  days: MealDayInput[]
) {
  const parsed = mealPlanSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();

  const { error: pError } = await supabase
    .from("meal_plans")
    .update(parsed.data)
    .eq("id", id);

  if (pError) return { error: pError.message };

  // Delete old days (cascades to items)
  await supabase.from("meal_plan_days").delete().eq("plan_id", id);

  for (const day of days) {
    const { data: dayRow, error: dError } = await supabase
      .from("meal_plan_days")
      .insert({
        plan_id: id,
        day_of_week: day.day_of_week,
        notes: day.notes || null,
      })
      .select()
      .single();

    if (dError) return { error: dError.message };

    if (day.items.length > 0) {
      const itemRows = day.items.map((item, i) => {
        const parsedItem = mealItemSchema.parse(item);
        return {
          ...parsedItem,
          day_id: dayRow.id,
          sort_order: i,
        };
      });

      await supabase.from("meal_plan_items").insert(itemRows);
    }
  }

  revalidatePath("/admin/meals");
  return { success: true };
}

export async function deleteMealPlan(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("meal_plans")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/meals");
  return { success: true };
}

// ==================== MEAL ASSIGNMENTS ====================

export async function getMealAssignments(clientId?: string) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("meal_assignments")
    .select(
      "*, meal_plans(name, description), profiles!meal_assignments_client_id_fkey(full_name)"
    )
    .eq("is_active", true)
    .order("start_date", { ascending: false });

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

export async function createMealAssignment(input: MealAssignmentInput) {
  const parsed = mealAssignmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("meal_assignments")
    .insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath("/meals");
  return { success: true };
}

export async function deleteMealAssignment(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("meal_assignments")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath("/meals");
  return { success: true };
}

// Client: get current meal plan
export async function getMyMealPlan() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];

  const { data: assignment, error: aError } = await supabase
    .from("meal_assignments")
    .select("*, meal_plans(*)")
    .eq("client_id", user.id)
    .eq("is_active", true)
    .lte("start_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (aError) return { error: aError.message };
  if (!assignment) return { data: null };

  // Get full meal plan with days and items
  const { data: days, error: dError } = await supabase
    .from("meal_plan_days")
    .select("*, meal_plan_items(*)")
    .eq("plan_id", assignment.plan_id)
    .order("day_of_week");

  if (dError) return { error: dError.message };

  return {
    data: {
      assignment,
      plan: assignment.meal_plans,
      days: days || [],
    },
  };
}
