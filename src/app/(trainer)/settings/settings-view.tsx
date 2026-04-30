"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Camera, UserPlus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SettingsViewProps {
  profile: any;
  associateTrainers: any[];
}

export function SettingsView({ profile, associateTrainers }: SettingsViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: profile.full_name || "",
    phone: profile.phone || "",
    date_of_birth: profile.date_of_birth || "",
    gender: profile.gender || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");

  // Invite associate
  const [associateEmail, setAssociateEmail] = useState("");
  const [invitingAssociate, setInvitingAssociate] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile saved!");
      router.refresh();
    }
    setSaving(false);
  }

  async function handleAvatarUpload(file: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setUploadingAvatar(true);

    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error(uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      setAvatarUrl(publicUrl);
      toast.success("Avatar updated!");
      router.refresh();
    }
    setUploadingAvatar(false);
  }

  async function handleChangePassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent!");
  }

  async function handleInviteAssociate(e: React.FormEvent) {
    e.preventDefault();
    if (!associateEmail.trim()) return;
    setInvitingAssociate(true);

    // Create user with associate_trainer role
    const { error } = await supabase.auth.signUp({
      email: associateEmail,
      password: Math.random().toString(36).slice(-12), // temp password
      options: {
        data: { role: "associate_trainer", full_name: associateEmail.split("@")[0] },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Invite sent to ${associateEmail}`);
      setAssociateEmail("");
      router.refresh();
    }
    setInvitingAssociate(false);
  }

  const isOwner = profile.role === "admin" || profile.role === "trainer_owner";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          {isOwner && <TabsTrigger value="team">Team</TabsTrigger>}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-semibold">
                    {getInitials(form.full_name || profile.email)}
                  </AvatarFallback>
                </Avatar>
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {uploadingAvatar ? "Uploading..." : "Change Photo"}
                </Button>
                <p className="text-xs text-slate-400 mt-1.5">JPG, PNG or WebP · Max 2MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={form.full_name}
                      onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Input
                      id="gender"
                      placeholder="e.g. Male, Female, Other"
                      value={form.gender}
                      onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profile.email} disabled className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex items-center h-10">
                      <Badge variant="secondary" className="capitalize">
                        {profile.role.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving} className="bg-blue-500 hover:bg-blue-600 text-white">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium text-sm">Password</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Send a password reset link to {profile.email}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleChangePassword}>
                  Reset Password
                </Button>
              </div>
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <p className="font-medium text-sm text-red-700">Danger Zone</p>
                <p className="text-xs text-red-500 mt-1">
                  Contact support to delete your account. This action is irreversible.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab (Owner only) */}
        {isOwner && (
          <TabsContent value="team" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invite Associate Trainer</CardTitle>
                <CardDescription>
                  Associate trainers can manage their assigned clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteAssociate} className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="trainer@example.com"
                    value={associateEmail}
                    onChange={(e) => setAssociateEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={invitingAssociate || !associateEmail.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                  >
                    {invitingAssociate ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <><UserPlus className="h-4 w-4 mr-1.5" />Invite</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {associateTrainers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Associate Trainers ({associateTrainers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {associateTrainers.map((trainer: any) => (
                      <div key={trainer.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={trainer.avatar_url} />
                          <AvatarFallback className="bg-slate-100 text-slate-600 text-sm">
                            {getInitials(trainer.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{trainer.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{trainer.email}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">Associate</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
