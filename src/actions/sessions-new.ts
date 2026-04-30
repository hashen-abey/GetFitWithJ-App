"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSession({
  clientId,
  trainerId,
  title,
  sessionDate,
  startTime,
  durationMins,
  type,
  locationOrLink,
  notes,
}: {
  clientId: string;
  trainerId: string;
  title: string;
  sessionDate: string;
  startTime: string;
  durationMins?: number;
  type: "in_person" | "online";
  locationOrLink?: string;
  notes?: string;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      client_id: clientId,
      trainer_id: trainerId,
      title,
      session_date: sessionDate,
      start_time: startTime,
      duration_mins: durationMins || 60,
      type,
      location_or_link: locationOrLink || null,
      trainer_notes: notes || null,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Notify client
  await supabase.from("notifications").insert({
    user_id: clientId,
    type: "session_booked",
    payload: {
      session_id: data.id,
      session_date: sessionDate,
      start_time: startTime,
    },
  });

  revalidatePath("/sessions");
  return { id: data.id };
}

export async function updateSessionStatus({
  id,
  status,
}: {
  id: string;
  status: "scheduled" | "completed" | "cancelled";
}) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/sessions");
  return { success: true };
}

export async function deleteSession(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/sessions");
  return { success: true };
}
