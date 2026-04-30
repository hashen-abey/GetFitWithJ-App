"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createInvite({ email, trainerId }: { email: string; trainerId: string }) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("client_invites")
    .insert({ email: email.toLowerCase(), trainer_id: trainerId })
    .select("token")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { token: data.token };
}

export async function getInviteByToken(token: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("client_invites")
    .select("*")
    .eq("token", token)
    .single();
  return data;
}
