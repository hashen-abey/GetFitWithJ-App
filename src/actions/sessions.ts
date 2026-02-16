"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sessionSchema, type SessionInput } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function getSessions(filters?: {
  clientId?: string;
  date?: string;
  status?: string;
}) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("sessions")
    .select("*, profiles!sessions_client_id_fkey(full_name)")
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (filters?.clientId) query = query.eq("client_id", filters.clientId);
  if (filters?.date) query = query.eq("session_date", filters.date);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

export async function getUpcomingSessions(clientId?: string, limit = 10) {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("sessions")
    .select("*, profiles!sessions_client_id_fkey(full_name)")
    .gte("session_date", today)
    .eq("status", "scheduled")
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(limit);

  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data };
}

export async function getTodaySessions() {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("sessions")
    .select("*, profiles!sessions_client_id_fkey(full_name)")
    .eq("session_date", today)
    .order("start_time", { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

export async function createSession(input: SessionInput) {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("sessions").insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  return { success: true };
}

export async function updateSession(id: string, input: Partial<SessionInput>) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("sessions")
    .update(input)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  return { success: true };
}

export async function updateSessionStatus(
  id: string,
  status: "scheduled" | "completed" | "cancelled"
) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  return { success: true };
}

export async function deleteSession(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("sessions").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
  return { success: true };
}

export async function getMyUpcomingSessions() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", user.id)
    .gte("session_date", today)
    .eq("status", "scheduled")
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(10);

  if (error) return { error: error.message };
  return { data };
}
