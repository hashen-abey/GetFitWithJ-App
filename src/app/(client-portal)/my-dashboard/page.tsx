import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { formatDate, formatTime, getInitials } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  MessageSquare,
  Video,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { ClientWorkoutCard } from "./client-workout-card";
import { ClientNoteReply } from "./client-note-reply";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  const [profileRes, sessionsRes, notesRes, activeProgramRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("sessions")
      .select("*")
      .eq("client_id", user.id)
      .gte("session_date", todayStr)
      .eq("status", "scheduled")
      .order("session_date")
      .order("start_time")
      .limit(5),
    supabase
      .from("notes")
      .select("*, note_replies(id, body, author_id, created_at, profiles!note_replies_author_id_fkey(full_name, avatar_url))")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("client_programs")
      .select("*, programs!client_programs_program_id_fkey(id, name, program_workouts!program_workouts_program_id_fkey(day_of_week, sort_order, workouts!program_workouts_workout_id_fkey(id, title, description, youtube_video_id, difficulty, duration_mins)))")
      .eq("client_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const profile = profileRes.data;
  const sessions = sessionsRes.data || [];
  const notes = notesRes.data || [];

  // Today's workouts from active program
  let todayWorkouts: any[] = [];
  if (activeProgramRes.data?.programs?.program_workouts) {
    todayWorkouts = activeProgramRes.data.programs.program_workouts
      .filter((pw: any) => pw.day_of_week === dayOfWeek)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);
  }

  // Get already-completed workout ids for today
  const { data: completedToday } = await supabase
    .from("workout_completions")
    .select("assignment_id")
    .eq("client_id", user.id)
    .gte("completed_at", todayStr + "T00:00:00");

  const completedIds = new Set((completedToday || []).map((c: any) => c.assignment_id));

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6 py-2">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hey {firstName}! 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Today's Workouts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800">
            Today&apos;s Workouts
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({todayWorkouts.length} scheduled)
            </span>
          </h2>
        </div>
        {todayWorkouts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-400">
              {activeProgramRes.data
                ? "Rest day — no workouts scheduled today!"
                : "No program assigned yet. Ask your trainer!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayWorkouts.map((pw: any, idx: number) => (
              <ClientWorkoutCard
                key={pw.workouts?.id || idx}
                workout={pw.workouts}
                clientId={user.id}
                isCompleted={completedIds.has(pw.workouts?.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Sessions */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Upcoming Sessions</h2>
        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center">
            <Calendar className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm text-slate-400">No upcoming sessions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session: any) => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{session.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatDate(session.session_date)} · {formatTime(session.start_time)}
                        {session.duration_mins && <span> · {session.duration_mins}min</span>}
                      </p>
                      {session.location_or_link && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
                          {session.type === "online" ? (
                            <Video className="h-4 w-4 text-blue-500 shrink-0" />
                          ) : (
                            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          {session.type === "online" ? (
                            <a
                              href={session.location_or_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1 truncate"
                            >
                              Join Meeting <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="truncate">{session.location_or_link}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Badge
                      className={`shrink-0 ${
                        session.type === "online"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {session.type === "online" ? "Online" : "In Person"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Trainer Notes */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          Trainer Notes
          {notes.filter((n: any) => !n.is_read).length > 0 && (
            <Badge className="ml-2 bg-blue-500 text-white text-xs">
              {notes.filter((n: any) => !n.is_read).length} new
            </Badge>
          )}
        </h2>
        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center">
            <MessageSquare className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm text-slate-400">No messages from your trainer yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note: any) => (
              <ClientNoteCard key={note.id} note={note} clientId={user.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ClientNoteCard({ note, clientId }: { note: any; clientId: string }) {
  const replies = note.note_replies || [];

  return (
    <Card className={!note.is_read ? "border-blue-200 bg-blue-50/30" : ""}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          {!note.is_read && (
            <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.body}</p>
            <p className="text-xs text-slate-400 mt-1">{formatDate(note.created_at)}</p>
          </div>
        </div>
        {replies.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            {replies.map((reply: any) => (
              <div key={reply.id} className="flex items-start gap-2">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={reply.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">{getInitials(reply.profiles?.full_name || "?")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium text-slate-600">{reply.profiles?.full_name}</p>
                  <p className="text-xs text-slate-600">{reply.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <ClientNoteReply noteId={note.id} clientId={clientId} />
      </CardContent>
    </Card>
  );
}
