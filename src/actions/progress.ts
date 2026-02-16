"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { progressLogSchema, type ProgressLogInput } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function getProgressLogs(clientId?: string) {
  const supabase = createServerSupabaseClient();

  let userId = clientId;
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    userId = user.id;
  }

  const { data, error } = await supabase
    .from("progress_logs")
    .select("*")
    .eq("client_id", userId)
    .order("log_date", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function createProgressLog(
  input: ProgressLogInput,
  photoUrls?: string[]
) {
  const parsed = progressLogSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("progress_logs").insert({
    ...parsed.data,
    client_id: user.id,
    photo_urls: photoUrls || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/progress");
  return { success: true };
}

export async function deleteProgressLog(id: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("progress_logs")
    .delete()
    .eq("id", id)
    .eq("client_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/progress");
  return { success: true };
}
