"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Loader2,
  Search,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import { createNote, createNoteReply } from "@/actions/notes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotesViewProps {
  initialNotes: any[];
  clients: { id: string; full_name: string; avatar_url?: string | null }[];
  currentUserId: string;
  preselectedClientId?: string;
}

export function NotesView({ initialNotes, clients, currentUserId, preselectedClientId }: NotesViewProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState(preselectedClientId || "all");
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({});
  const [loadingReply, setLoadingReply] = useState<string | null>(null);
  const [newNoteClientId, setNewNoteClientId] = useState(preselectedClientId || "");
  const [newNoteBody, setNewNoteBody] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const supabase = createClient();

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("notes-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notes" }, (payload) => {
        setNotes((prev) => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "note_replies" }, (payload) => {
        const reply = payload.new as any;
        setNotes((prev) =>
          prev.map((note) =>
            note.id === reply.note_id
              ? { ...note, note_replies: [...(note.note_replies || []), reply] }
              : note
          )
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = notes.filter((note) => {
    const matchesSearch =
      !search ||
      note.body?.toLowerCase().includes(search.toLowerCase()) ||
      note.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesClient =
      clientFilter === "all" || note.client_id === clientFilter;
    return matchesSearch && matchesClient;
  });

  function toggleExpand(noteId: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      next.has(noteId) ? next.delete(noteId) : next.add(noteId);
      return next;
    });
  }

  async function handleSendNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteBody.trim() || !newNoteClientId) return;
    setSendingNote(true);

    const result = await createNote({
      clientId: newNoteClientId,
      trainerId: currentUserId,
      body: newNoteBody.trim(),
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      setNewNoteBody("");
      toast.success("Note sent!");
    }
    setSendingNote(false);
  }

  async function handleReply(noteId: string) {
    const body = replyBodies[noteId]?.trim();
    if (!body) return;
    setLoadingReply(noteId);

    const result = await createNoteReply({ noteId, authorId: currentUserId, body });
    if (result.error) {
      toast.error(result.error);
    } else {
      setReplyBodies((prev) => ({ ...prev, [noteId]: "" }));
      toast.success("Reply sent!");
    }
    setLoadingReply(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notes</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {notes.filter((n) => !n.is_read).length} unread · {notes.length} total
        </p>
      </div>

      {/* Compose New Note */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-blue-500" />New Note
        </p>
        <form onSubmit={handleSendNote} className="space-y-3">
          <Select value={newNoteClientId} onValueChange={setNewNoteClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Textarea
              placeholder="Write a note to this client..."
              value={newNoteBody}
              onChange={(e) => setNewNoteBody(e.target.value)}
              className="resize-none min-h-[80px]"
            />
            <Button
              type="submit"
              disabled={sendingNote || !newNoteBody.trim() || !newNoteClientId}
              className="self-end bg-blue-500 hover:bg-blue-600 text-white shrink-0"
              size="icon"
            >
              {sendingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <MessageSquare className="h-10 w-10 text-slate-300" />
          <p className="text-slate-500">No notes found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => {
            const isExpanded = expandedNotes.has(note.id);
            const replies = note.note_replies || [];

            return (
              <div
                key={note.id}
                className={`rounded-xl border bg-white shadow-sm transition-all ${!note.is_read ? "border-blue-200 bg-blue-50/30" : ""}`}
              >
                {/* Note Header */}
                <div className="flex items-start gap-3 p-4">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={note.profiles?.avatar_url} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                      {getInitials(note.profiles?.full_name || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-slate-800">
                        {note.profiles?.full_name}
                      </p>
                      {!note.is_read && (
                        <Badge className="bg-blue-500 text-white text-xs h-4 px-1.5">Unread</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(note.created_at)}
                    </p>
                    <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{note.body}</p>
                  </div>
                  <button
                    onClick={() => toggleExpand(note.id)}
                    className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {replies.length > 0 && (
                      <span className="ml-1 text-xs">{replies.length}</span>
                    )}
                  </button>
                </div>

                {/* Replies */}
                {isExpanded && (
                  <div className="border-t bg-slate-50/50 p-4 space-y-3 rounded-b-xl">
                    {replies.map((reply: any) => (
                      <div key={reply.id} className="flex items-start gap-2.5">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={reply.profiles?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {getInitials(reply.profiles?.full_name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg bg-white border px-3 py-2 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">{reply.profiles?.full_name}</p>
                          <p className="text-sm text-slate-600 mt-0.5">{reply.body}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatDate(reply.created_at)}</p>
                        </div>
                      </div>
                    ))}
                    {/* Reply Input */}
                    <div className="flex gap-2 pt-1">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyBodies[note.id] || ""}
                        onChange={(e) =>
                          setReplyBodies((prev) => ({ ...prev, [note.id]: e.target.value }))
                        }
                        className="resize-none min-h-[60px] text-sm"
                      />
                      <Button
                        size="icon"
                        disabled={loadingReply === note.id || !replyBodies[note.id]?.trim()}
                        onClick={() => handleReply(note.id)}
                        className="self-end bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                      >
                        {loadingReply === note.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
