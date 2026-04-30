import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDate, formatTime, getInitials } from "@/lib/utils";
import {
  Users,
  Calendar,
  CheckCircle2,
  MessageSquare,
  UserPlus,
  Plus,
  Clock,
  TrendingUp,
} from "lucide-react";
import { InviteClientDialog } from "./invite-client-dialog";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split("T")[0];

  const [clientsRes, todaySessionsRes, recentCompletionsRes, unreadNotesRes, profile] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, is_active, created_at", { count: "exact" })
        .eq("role", "client")
        .eq("is_active", true),
      supabase
        .from("sessions")
        .select("*, profiles!sessions_client_id_fkey(full_name, avatar_url)")
        .eq("session_date", today)
        .order("start_time"),
      supabase
        .from("workout_completions")
        .select("*, profiles!workout_completions_client_id_fkey(full_name, avatar_url), workout_assignments!workout_completions_assignment_id_fkey(name)")
        .order("completed_at", { ascending: false })
        .limit(5),
      supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false),
      supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user!.id)
        .single(),
    ]);

  const activeClients = clientsRes.count || 0;
  const todaySessions = todaySessionsRes.data || [];
  const recentCompletions = recentCompletionsRes.data || [];
  const unreadNotes = unreadNotesRes.count || 0;
  const trainerName = profile.data?.full_name?.split(" ")[0] || "Trainer";

  const completedToday = todaySessions.filter((s: any) => s.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {getGreeting()}, {trainerName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InviteClientDialog trainerId={user!.id} />
          <Button asChild size="sm" variant="outline">
            <Link href="/sessions"><Plus className="h-4 w-4 mr-1.5" />Schedule Session</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Clients"
          value={activeClients}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          href="/clients"
          trend={`${clientsRes.data?.filter((c: any) => {
            const d = new Date(c.created_at);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length || 0} new this month`}
        />
        <StatCard
          title="Sessions Today"
          value={todaySessions.length}
          icon={<Calendar className="h-5 w-5 text-violet-500" />}
          href="/sessions"
          trend={`${completedToday} completed`}
        />
        <StatCard
          title="Workout Completions"
          value={recentCompletions.length}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          href="/clients"
          trend="Last 5 completions"
        />
        <StatCard
          title="Unread Notes"
          value={unreadNotes}
          icon={<MessageSquare className="h-5 w-5 text-amber-500" />}
          href="/notes"
          trend={unreadNotes > 0 ? "Needs your attention" : "All caught up"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Today's Sessions */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Today&apos;s Sessions</CardTitle>
            <Button asChild size="sm" variant="ghost" className="text-blue-600 h-7">
              <Link href="/sessions">View calendar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todaySessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Calendar className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No sessions scheduled for today</p>
                <Button asChild size="sm" variant="outline" className="mt-1">
                  <Link href="/sessions"><Plus className="h-3.5 w-3.5 mr-1" />Schedule one</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 rounded-lg border bg-slate-50 px-3 py-2.5"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={session.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {getInitials(session.profiles?.full_name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{session.title}</p>
                      <p className="truncate text-xs text-slate-500">{session.profiles?.full_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">{formatTime(session.start_time)}</p>
                      <SessionBadge status={session.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Completions</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {recentCompletions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">No completions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCompletions.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                      <AvatarImage src={c.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                        {getInitials(c.profiles?.full_name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.profiles?.full_name}</p>
                      <p className="truncate text-xs text-slate-500">{c.workout_assignments?.name}</p>
                      <p className="text-xs text-slate-400">{formatDate(c.completed_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction href="/clients" icon={<Users className="h-5 w-5" />} label="View All Clients" color="blue" />
            <QuickAction href="/workouts/new" icon={<Plus className="h-5 w-5" />} label="Add Workout" color="violet" />
            <QuickAction href="/programs" icon={<CheckCircle2 className="h-5 w-5" />} label="Build Program" color="emerald" />
            <QuickAction href="/notes" icon={<MessageSquare className="h-5 w-5" />} label="View Notes" color="amber" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function StatCard({
  title,
  value,
  icon,
  href,
  trend,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  trend: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
            </div>
            <div className="rounded-lg bg-slate-100 p-2">{icon}</div>
          </div>
          <p className="mt-2 text-xs text-slate-400">{trend}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function SessionBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${variants[status] || variants.scheduled}`}>
      {status}
    </span>
  );
}

function QuickAction({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: "blue" | "violet" | "emerald" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    violet: "bg-violet-50 text-violet-600 hover:bg-violet-100",
    emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",
  };
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl p-4 font-medium text-sm transition-colors ${colors[color]}`}
    >
      {icon}
      {label}
    </Link>
  );
}
