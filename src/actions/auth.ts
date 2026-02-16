"use server";

import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { createClientSchema, type CreateClientInput } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function createClientAccount(input: CreateClientInput) {
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = createServerSupabaseClient();

  // Verify caller is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Unauthorized" };

  // Use admin client to create user
  const admin = createAdminClient();
  const { data: newUser, error: createError } =
    await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
        role: "client",
      },
    });

  if (createError) return { error: createError.message };
  if (!newUser.user) return { error: "Failed to create user" };

  // Update profile with additional fields
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      phone: parsed.data.phone || null,
      date_of_birth: parsed.data.date_of_birth || null,
      gender: parsed.data.gender || null,
      height_cm: parsed.data.height_cm || null,
      weight_kg: parsed.data.weight_kg || null,
      medical_notes: parsed.data.medical_notes || null,
    })
    .eq("id", newUser.user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/clients");
  return { data: newUser.user.id };
}
