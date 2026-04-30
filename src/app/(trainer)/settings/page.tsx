import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SettingsView } from "./settings-view";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, associatesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role, created_at")
      .eq("role", "associate_trainer")
      .order("full_name"),
  ]);

  return (
    <SettingsView
      profile={profileRes.data!}
      associateTrainers={associatesRes.data || []}
    />
  );
}
