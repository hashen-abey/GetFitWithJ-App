"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { createNote } from "@/actions/notes";

export function AddNoteForm({ clientId, trainerId }: { clientId: string; trainerId: string }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);

    const result = await createNote({ clientId, trainerId, body: body.trim() });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Note added");
      setBody("");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        placeholder="Add a note for this client..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="resize-none min-h-[80px]"
      />
      <Button
        type="submit"
        disabled={loading || !body.trim()}
        className="self-end bg-blue-500 hover:bg-blue-600 text-white shrink-0"
        size="icon"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  );
}
