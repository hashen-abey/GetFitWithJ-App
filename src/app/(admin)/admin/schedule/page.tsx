"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createSession, updateSessionStatus, deleteSession } from "@/actions/sessions";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/shared/loading";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { Calendar, Plus, Check, X, Trash2 } from "lucide-react";
import type { Profile } from "@/types/database";

export default function AdminSchedulePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    title: "",
    description: "",
    session_date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "10:00",
    location: "",
    trainer_notes: "",
  });

  async function loadData() {
    const supabase = createClient();
    const [sessionsRes, clientsRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("*, profiles!sessions_client_id_fkey(full_name)")
        .gte("session_date", new Date().toISOString().split("T")[0])
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .eq("is_active", true)
        .order("full_name"),
    ]);
    setSessions(sessionsRes.data || []);
    setClients(clientsRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await createSession({
      ...form,
      description: form.description || null,
      end_time: form.end_time || null,
      location: form.location || null,
      trainer_notes: form.trainer_notes || null,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Session created");
      setDialogOpen(false);
      setForm({
        client_id: "",
        title: "",
        description: "",
        session_date: new Date().toISOString().split("T")[0],
        start_time: "09:00",
        end_time: "10:00",
        location: "",
        trainer_notes: "",
      });
      loadData();
    }
    setSaving(false);
  }

  async function handleStatusChange(id: string, status: "completed" | "cancelled") {
    const result = await updateSessionStatus(id, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Session ${status}`);
      loadData();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session?")) return;
    const result = await deleteSession(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Session deleted");
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        description="Manage training sessions"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Session</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <FormField label="Client" required>
                  <Select
                    value={form.client_id}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, client_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Title" required>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Training Session"
                    required
                  />
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Date" required>
                    <Input
                      type="date"
                      value={form.session_date}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, session_date: e.target.value }))
                      }
                      required
                    />
                  </FormField>
                  <FormField label="Location">
                    <Input
                      value={form.location}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, location: e.target.value }))
                      }
                      placeholder="Gym, Online, etc."
                    />
                  </FormField>
                  <FormField label="Start Time" required>
                    <Input
                      type="time"
                      value={form.start_time}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, start_time: e.target.value }))
                      }
                      required
                    />
                  </FormField>
                  <FormField label="End Time">
                    <Input
                      type="time"
                      value={form.end_time}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, end_time: e.target.value }))
                      }
                    />
                  </FormField>
                </div>
                <FormField label="Notes">
                  <Textarea
                    value={form.trainer_notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, trainer_notes: e.target.value }))
                    }
                    placeholder="Session notes..."
                    rows={2}
                  />
                </FormField>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Spinner className="h-4 w-4" /> : "Create Session"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming sessions"
          description="Schedule a session with a client."
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.title}</p>
                    <Badge
                      variant={
                        session.status === "completed"
                          ? "success"
                          : session.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(session.profiles as any)?.full_name} &middot;{" "}
                    {formatDate(session.session_date)} at{" "}
                    {formatTime(session.start_time)}
                  </p>
                  {session.location && (
                    <p className="text-xs text-muted-foreground">
                      {session.location}
                    </p>
                  )}
                </div>
                {session.status === "scheduled" && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleStatusChange(session.id, "completed")
                      }
                      title="Mark completed"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleStatusChange(session.id, "cancelled")
                      }
                      title="Cancel"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(session.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
