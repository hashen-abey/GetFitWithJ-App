"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createNote({
  clientId,
  trainerId,
  body,
}: {
  clientId: string;
  trainerId: string;
  body: string;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("notes")
    .insert({ trainer_id: trainerId, client_id: clientId, body });

  if (error) return { error: error.message };

  // Create notification for client
  await supabase.from("notifications").insert({
    user_id: clientId,
    type: "new_note",
    payload: { trainer_id: trainerId },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/notes");
  return { success: true };
}

export async function createNoteReply({
  noteId,
  authorId,
  body,
}: {
  noteId: string;
  authorId: string;
  body: string;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("note_replies")
    .insert({ note_id: noteId, author_id: authorId, body });

  if (error) return { error: error.message };
  revalidatePath("/notes");
  return { success: true };
}

export async function markNotesRead(clientId: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("notes")
    .update({ is_read: true })
    .eq("client_id", clientId);

  if (error) return { error: error.message };
  return { success: true };
}
