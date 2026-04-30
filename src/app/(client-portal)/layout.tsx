import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientNav } from "@/components/layouts/client-nav";
import { TRAINER_ROLES } from "@/types/database";

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
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

  if (!profile) redirect("/login");

  // Trainers go to trainer dashboard
  if (TRAINER_ROLES.includes(profile.role as any)) {
    redirect("/dashboard");
  }

  // Unread notifications count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return (
    <div className="min-h-screen bg-slate-50">
      <ClientNav profile={profile} unreadCount={unreadCount || 0} />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-4">
        {children}
      </main>
    </div>
  );
}
