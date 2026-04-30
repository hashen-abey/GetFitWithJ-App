import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SessionsCalendar } from "./sessions-calendar";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: { client?: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [sessionsRes, clientsRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, profiles!sessions_client_id_fkey(id, full_name, avatar_url)")
      .order("session_date")
      .order("start_time"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "client")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <SessionsCalendar
      sessions={sessionsRes.data || []}
      clients={clientsRes.data || []}
      trainerId={user!.id}
      preselectedClientId={searchParams.client}
    />
  );
}
