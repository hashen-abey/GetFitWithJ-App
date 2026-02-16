"use server";

import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileInput } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function getClients() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getClient(id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function updateClient(id: string, input: ProfileInput) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  return { success: true };
}

export async function toggleClientActive(id: string, isActive: boolean) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  return { success: true };
}

export async function updateClientSubscription(
  clientId: string,
  validUntil: string
) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({ subscription_valid_until: validUntil })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath("/admin/payments");
  return { success: true };
}

export async function updateProfile(input: ProfileInput) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
