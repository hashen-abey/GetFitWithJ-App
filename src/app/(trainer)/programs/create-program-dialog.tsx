"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { createProgram } from "@/actions/programs";

export function CreateProgramDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const result = await createProgram({ name: name.trim(), description: description || undefined, isTemplate });
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Program created!");
    setOpen(false);
    router.push(`/programs/${result.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          <Plus className="h-4 w-4 mr-1.5" />New Program
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Program</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Program Name *</Label>
            <Input
              placeholder="e.g. 8-Week Strength Builder"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Save as Template</p>
              <p className="text-xs text-slate-500">Reusable for multiple clients</p>
            </div>
            <Switch checked={isTemplate} onCheckedChange={setIsTemplate} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !name.trim()} className="bg-blue-500 hover:bg-blue-600 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & Build"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
