"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("*");

  if (error) return { error: error.message };

  // Convert to key-value map
  const settings: Record<string, string> = {};
  data?.forEach((s) => {
    settings[s.key] = s.value;
  });

  return { data: settings };
}

export async function updateSetting(key: string, value: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, {
      onConflict: "key",
    });

  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/payments");
  return { success: true };
}
