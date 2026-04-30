import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { getInitials, formatDate, formatTime } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Target,
  Activity,
  MessageSquare,
  Dumbbell,
  Plus,
} from "lucide-react";
import { AddNoteForm } from "./add-note-form";
import { AssignProgramForm } from "./assign-program-form";

export const dynamic = "force-dynamic";

export default async function ClientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const [clientRes, sessionsRes, completionsRes, notesRes, programsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .eq("role", "client")
        .single(),
      supabase
        .from("sessions")
        .select("*")
        .eq("client_id", params.id)
        .order("session_date", { ascending: false })
        .limit(10),
      supabase
        .from("workout_completions")
        .select("*, workout_assignments!workout_completions_assignment_id_fkey(name)")
        .eq("client_id", params.id)
        .order("completed_at", { ascending: false })
        .limit(10),
      supabase
        .from("notes")
        .select("*, note_replies(id, body, author_id, created_at, profiles!note_replies_author_id_fkey(full_name, avatar_url))")
        .eq("client_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("client_programs")
        .select("*, programs!client_programs_program_id_fkey(id, name, description)")
        .eq("client_id", params.id)
        .eq("is_active", true),
    ]);

  if (!clientRes.data) notFound();

  const client = clientRes.data;
  const sessions = sessionsRes.data || [];
  const completions = completionsRes.data || [];
  const notes = notesRes.data || [];
  const programs = programsRes.data || [];

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="-ml-2">
          <Link href="/clients"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarImage src={client.avatar_url || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
              {getInitials(client.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{client.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusDot active={client.is_active} />
              {client.subscription_valid_until && (
                <span className="text-xs text-slate-400">
                  Sub until {formatDate(client.subscription_valid_until)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild size="sm" variant="outline">
            <Link href={`/sessions?client=${params.id}`}>
              <Plus className="h-3.5 w-3.5 mr-1" />Session
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
            <Link href={`/notes?client=${params.id}`}>
              <MessageSquare className="h-3.5 w-3.5 mr-1" />Note
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Personal Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={client.email} />
              {client.phone && (
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={client.phone} />
              )}
              {client.date_of_birth && (
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date of Birth"
                  value={formatDate(client.date_of_birth)}
                />
              )}
              {client.gender && (
                <InfoRow icon={<Activity className="h-4 w-4" />} label="Gender" value={client.gender} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Stats & Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.height_cm && (
                <InfoRow icon={<Activity className="h-4 w-4" />} label="Height" value={`${client.height_cm} cm`} />
              )}
              {client.weight_kg && (
                <InfoRow icon={<Activity className="h-4 w-4" />} label="Weight" value={`${client.weight_kg} kg`} />
              )}
              {client.medical_notes && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Medical Notes</p>
                  <p className="text-sm text-slate-700 rounded-md bg-amber-50 border border-amber-100 p-2">
                    {client.medical_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Programs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Active Programs
              </CardTitle>
              <AssignProgramForm clientId={params.id} />
            </CardHeader>
            <CardContent>
              {programs.length === 0 ? (
                <p className="text-sm text-slate-400">No active programs assigned</p>
              ) : (
                <div className="space-y-2">
                  {programs.map((cp: any) => (
                    <Link
                      key={cp.id}
                      href={`/programs/${cp.programs?.id}`}
                      className="block rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-sm font-medium">{cp.programs?.name}</p>
                      {cp.programs?.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{cp.programs?.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">Started {formatDate(cp.start_date)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="notes">
            <TabsList className="w-full">
              <TabsTrigger value="notes" className="flex-1">
                Notes {notes.length > 0 && <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-xs">{notes.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex-1">
                Sessions {sessions.length > 0 && <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-xs">{sessions.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="workouts" className="flex-1">
                Completions {completions.length > 0 && <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-xs">{completions.length}</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="mt-4 space-y-4">
              <AddNoteForm clientId={params.id} trainerId={user!.id} />
              {notes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-400">No notes yet</p>
                </div>
              ) : (
                notes.map((note: any) => (
                  <NoteCard key={note.id} note={note} currentUserId={user!.id} />
                ))
              )}
            </TabsContent>

            <TabsContent value="sessions" className="mt-4">
              {sessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-400">No sessions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">{session.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(session.session_date)} at {formatTime(session.start_time)}
                          {session.type && <span className="ml-2 capitalize">· {session.type.replace("_", " ")}</span>}
                        </p>
                      </div>
                      <SessionBadge status={session.status} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="workouts" className="mt-4">
              {completions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                  <Dumbbell className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-400">No completions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {completions.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">
                          {c.workout_assignments?.name || "Workout"}
                        </p>
                        {c.notes && <p className="text-xs text-slate-500 mt-0.5">{c.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{formatDate(c.completed_at)}</p>
                        {c.rating && (
                          <div className="flex gap-0.5 justify-end mt-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`text-xs ${i < c.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 break-all">{value}</p>
      </div>
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SessionBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || map.scheduled}`}>
      {status}
    </span>
  );
}

function NoteCard({ note, currentUserId }: { note: any; currentUserId: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.body}</p>
        <p className="mt-2 text-xs text-slate-400">{formatDate(note.created_at)}</p>
        {note.note_replies && note.note_replies.length > 0 && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {note.note_replies.map((reply: any) => (
              <div key={reply.id} className="flex gap-2">
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
      </CardContent>
    </Card>
  );
}
