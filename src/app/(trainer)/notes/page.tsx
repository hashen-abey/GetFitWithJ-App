import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NotesView } from "./notes-view";

export const dynamic = "force-dynamic";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: { client?: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [notesRes, clientsRes] = await Promise.all([
    supabase
      .from("notes")
      .select(`
        *,
        profiles!notes_client_id_fkey(id, full_name, avatar_url),
        note_replies(id, body, author_id, created_at, profiles!note_replies_author_id_fkey(full_name, avatar_url))
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "client")
      .order("full_name"),
  ]);

  return (
    <NotesView
      initialNotes={notesRes.data || []}
      clients={clientsRes.data || []}
      currentUserId={user!.id}
      preselectedClientId={searchParams.client}
    />
  );
}
