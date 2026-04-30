import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrainerSidebar } from "@/components/layouts/trainer-sidebar";
import { TRAINER_ROLES } from "@/types/database";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile || !TRAINER_ROLES.includes(profile.role as any)) {
    redirect("/my-dashboard");
  }

  // Unread notes count
  const { count: unreadNotes } = await supabase
    .from("notes")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  return (
    <div className="min-h-screen bg-slate-50">
      <TrainerSidebar
        profile={profile}
        unreadNotes={unreadNotes || 0}
      />
      <main className="lg:pl-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
