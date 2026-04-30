"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Video,
  Loader2,
  X,
} from "lucide-react";
import { getInitials, formatTime } from "@/lib/utils";
import { createSession, updateSessionStatus, deleteSession } from "@/actions/sessions-new";
import { useRouter } from "next/navigation";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface SessionsCalendarProps {
  sessions: any[];
  clients: { id: string; full_name: string }[];
  trainerId: string;
  preselectedClientId?: string;
}

export function SessionsCalendar({ sessions, clients, trainerId, preselectedClientId }: SessionsCalendarProps) {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  // Form state
  const [form, setForm] = useState({
    clientId: preselectedClientId || "",
    title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    durationMins: "60",
    type: "in_person" as "in_person" | "online",
    locationOrLink: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function getDaysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
  }

  function getFirstDayOfMonth(y: number, m: number) {
    return new Date(y, m, 1).getDay();
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function getSessionsForDate(dateStr: string) {
    return sessions.filter((s) => s.session_date === dateStr);
  }

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.title) return;
    setSaving(true);

    const result = await createSession({
      clientId: form.clientId,
      trainerId,
      title: form.title,
      sessionDate: form.date,
      startTime: form.startTime,
      durationMins: parseInt(form.durationMins),
      type: form.type,
      locationOrLink: form.locationOrLink || undefined,
      notes: form.notes || undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Session scheduled!");
      setCreateOpen(false);
      setForm({ clientId: "", title: "", date: new Date().toISOString().split("T")[0], startTime: "09:00", durationMins: "60", type: "in_person", locationOrLink: "", notes: "" });
      router.refresh();
    }
    setSaving(false);
  }

  async function handleStatusChange(id: string, status: "scheduled" | "completed" | "cancelled") {
    const result = await updateSessionStatus({ id, status });
    if (result.error) toast.error(result.error);
    else { toast.success("Status updated"); router.refresh(); setSelectedSession(null); }
  }

  async function handleDelete(id: string) {
    const result = await deleteSession(id);
    if (result.error) toast.error(result.error);
    else { toast.success("Session deleted"); router.refresh(); setSelectedSession(null); }
  }

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
          <p className="text-sm text-slate-500 mt-0.5">{sessions.length} total sessions</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="h-4 w-4 mr-1.5" />Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Client *</Label>
                  <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Session Title *</Label>
                  <Input
                    placeholder="e.g. Upper Body Training"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (mins)</Label>
                  <Select value={form.durationMins} onValueChange={(v) => setForm((f) => ({ ...f, durationMins: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[30, 45, 60, 75, 90, 120].map((d) => (
                        <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v: any) => setForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{form.type === "online" ? "Meeting Link" : "Location"}</Label>
                  <Input
                    placeholder={form.type === "online" ? "https://zoom.us/..." : "Gym address or room"}
                    value={form.locationOrLink}
                    onChange={(e) => setForm((f) => ({ ...f, locationOrLink: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Any notes about this session..."
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="resize-none"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving || !form.clientId || !form.title} className="bg-blue-500 hover:bg-blue-600 text-white">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {MONTHS[month]} {year}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {DAYS_SHORT.map((d) => (
                <div key={d} className="py-1 text-center text-xs font-medium text-slate-400">{d}</div>
              ))}
              {/* Empty cells */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const ds = dateStr(day);
                const daySessions = getSessionsForDate(ds);
                const isToday = ds === todayStr;
                const isSelected = ds === selectedDate;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : ds)}
                    className={`relative rounded-lg p-1.5 text-left transition-colors hover:bg-slate-50 ${
                      isSelected ? "bg-blue-50 ring-1 ring-blue-200" : ""
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                        isToday ? "bg-blue-500 text-white font-semibold" : "text-slate-700"
                      }`}
                    >
                      {day}
                    </span>
                    {daySessions.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {daySessions.slice(0, 2).map((s: any) => (
                          <div
                            key={s.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                              s.status === "cancelled"
                                ? "bg-red-100 text-red-700 line-through"
                                : s.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {formatTime(s.start_time)} {s.profiles?.full_name?.split(" ")[0]}
                          </div>
                        ))}
                        {daySessions.length > 2 && (
                          <p className="text-[10px] text-slate-400 pl-1">+{daySessions.length - 2} more</p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-4">
          {selectedDate ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDate(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDateSessions.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-slate-400">No sessions</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => { setForm((f) => ({ ...f, date: selectedDate })); setCreateOpen(true); }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />Add Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateSessions.map((session: any) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.filter((s) => s.session_date >= todayStr && s.status === "scheduled").slice(0, 5).length === 0 ? (
                  <p className="text-sm text-slate-400">No upcoming sessions</p>
                ) : (
                  <div className="space-y-2">
                    {sessions
                      .filter((s) => s.session_date >= todayStr && s.status === "scheduled")
                      .slice(0, 5)
                      .map((session: any) => (
                        <div key={session.id} className="flex items-start gap-2 rounded-lg border p-2.5">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={session.profiles?.avatar_url} />
                            <AvatarFallback className="text-xs">{getInitials(session.profiles?.full_name || "?")}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{session.title}</p>
                            <p className="text-xs text-slate-500">
                              {session.session_date} · {formatTime(session.start_time)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionCard({
  session,
  onStatusChange,
  onDelete,
}: {
  session: any;
  onStatusChange: (id: string, status: "scheduled" | "completed" | "cancelled") => void;
  onDelete: (id: string) => void;
}) {
  const statusColors = {
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{session.title}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            {formatTime(session.start_time)}
            {session.duration_mins && <span>· {session.duration_mins}min</span>}
          </div>
          {session.profiles && (
            <p className="text-xs text-slate-500 mt-0.5">{session.profiles.full_name}</p>
          )}
          {session.location_or_link && (
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
              {session.type === "online" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              <span className="truncate">{session.location_or_link}</span>
            </div>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[session.status as keyof typeof statusColors]}`}>
          {session.status}
        </span>
      </div>
      {session.status === "scheduled" && (
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="h-6 text-xs flex-1" onClick={() => onStatusChange(session.id, "completed")}>
            Complete
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs text-red-600 border-red-200" onClick={() => onDelete(session.id)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
