"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { UserPlus, Loader2, Copy, Check } from "lucide-react";
import { createInvite } from "@/actions/invites";

export function InviteClientDialog({ trainerId }: { trainerId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createInvite({ email, trainerId });
    if (result.error) {
      toast.error(result.error);
    } else if (result.token) {
      const origin = window.location.origin;
      setInviteLink(`${origin}/invite?token=${result.token}`);
      toast.success("Invite created!");
    }
    setLoading(false);
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setEmail("");
      setInviteLink(null);
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Invite Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a Client</DialogTitle>
        </DialogHeader>
        {!inviteLink ? (
          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Client Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We&apos;ll generate a unique invite link you can send to your client. The link expires in 7 days.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Link"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Share this link with <strong>{email}</strong>. It expires in 7 days.
            </p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="text-xs font-mono" />
              <Button type="button" variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button className="w-full" variant="outline" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
