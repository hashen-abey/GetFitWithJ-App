"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Zap, Loader2, AlertCircle } from "lucide-react";

export default function InvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const supabase = createClient();

  const [invite, setInvite] = useState<{ email: string; trainer_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function checkInvite() {
      if (!token) { setInvalid(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from("client_invites")
        .select("email, trainer_id, used_at, expires_at")
        .eq("token", token)
        .single();

      if (error || !data || data.used_at || new Date(data.expires_at) < new Date()) {
        setInvalid(true);
      } else {
        setInvite({ email: data.email, trainer_id: data.trainer_id });
      }
      setLoading(false);
    }
    checkInvite();
  }, [token]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!invite || !token) return;
    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: {
        data: { full_name: fullName, role: "client" },
      },
    });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Mark invite as used
    await supabase
      .from("client_invites")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    toast.success("Account created! Welcome to GetFitWithJ.");
    router.push("/my-dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 text-white">
          <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">Invalid Invite Link</h2>
              <p className="mt-1 text-sm text-slate-400">
                This invite link is invalid, expired, or already been used.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/login")} className="border-slate-600 text-white">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Join GetFitWithJ</h1>
            <p className="text-sm text-slate-400">Your trainer has invited you</p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Create your account</CardTitle>
            <CardDescription className="text-slate-400">
              Signing up as <span className="text-blue-400">{invite?.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
