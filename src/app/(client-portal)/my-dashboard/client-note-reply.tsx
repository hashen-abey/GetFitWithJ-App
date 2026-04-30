"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { createNoteReply } from "@/actions/notes";

export function ClientNoteReply({ noteId, clientId }: { noteId: string; clientId: string }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);

    const result = await createNoteReply({ noteId, authorId: clientId, body: body.trim() });
    if (result.error) {
      toast.error(result.error);
    } else {
      setBody("");
      setSent(true);
      toast.success("Reply sent!");
    }
    setLoading(false);
  }

  if (sent) {
    return <p className="text-xs text-slate-400 text-center">Reply sent ✓</p>;
  }

  return (
    <form onSubmit={handleReply} className="flex gap-2 pt-1">
      <Input
        placeholder="Reply to trainer..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="text-sm h-9"
      />
      <Button
        type="submit"
        disabled={loading || !body.trim()}
        size="icon"
        className="h-9 w-9 bg-blue-500 hover:bg-blue-600 text-white shrink-0"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      </Button>
    </form>
  );
}
