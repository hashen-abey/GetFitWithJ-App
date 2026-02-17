"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/actions/clients";
import {
  uploadProfilePictureAction,
  getSignedImageUrlAction,
} from "@/actions/cloudinary";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/shared/loading";
import { formatDate, getInitials, isSubscriptionActive } from "@/lib/utils";
import { toast } from "sonner";
import { Save, User, Upload } from "lucide-react";
import type { Profile } from "@/types/database";

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    medical_notes: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setForm({
          full_name: data.full_name,
          phone: data.phone || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          height_cm: data.height_cm?.toString() || "",
          weight_kg: data.weight_kg?.toString() || "",
          medical_notes: data.medical_notes || "",
        });

        // Load avatar image if exists (Cloudinary public_id)
        if (data.avatar_url) {
          const result = await getSignedImageUrlAction(data.avatar_url);
          if (result.success && result.url) {
            setAvatarUrl(result.url);
          }
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingPhoto(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      // Upload to Cloudinary using server action
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadProfilePictureAction(formData, user.id);

      if (!result.success || !result.publicId) {
        toast.error(result.error || "Upload failed");
        return;
      }

      // Update profile with Cloudinary public_id
      const updateResult = await updateProfile({
        full_name: form.full_name,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        medical_notes: form.medical_notes || null,
        avatar_url: result.publicId,
      });

      if (updateResult.error) {
        toast.error(updateResult.error);
      } else {
        toast.success("Profile picture updated");
        // Get signed URL for display
        const urlResult = await getSignedImageUrlAction(result.publicId);
        if (urlResult.success && urlResult.url) {
          setAvatarUrl(urlResult.url);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const result = await updateProfile({
      full_name: form.full_name,
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      medical_notes: form.medical_notes || null,
      avatar_url: profile?.avatar_url || null,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Profile updated");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!profile) return null;

  const subActive = isSubscriptionActive(profile.subscription_valid_until);

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" />

      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="relative">
            <Avatar className="h-16 w-16">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={profile.full_name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-lg text-primary">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90"
            >
              <Upload className="h-3 w-3" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
            </label>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile.full_name}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={subActive ? "success" : "destructive"}>
                {subActive ? "Subscribed" : "No Subscription"}
              </Badge>
              {profile.subscription_valid_until && (
                <span className="text-xs text-muted-foreground">
                  Until {formatDate(profile.subscription_valid_until)}
                </span>
              )}
            </div>
          </div>
          {uploadingPhoto && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Uploading...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Full Name" required>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
                required
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+94 77 123 4567"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date of Birth">
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date_of_birth: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Gender">
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Height (cm)">
                <Input
                  type="number"
                  step="0.1"
                  value={form.height_cm}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, height_cm: e.target.value }))
                  }
                />
              </FormField>
              <FormField label="Weight (kg)">
                <Input
                  type="number"
                  step="0.1"
                  value={form.weight_kg}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, weight_kg: e.target.value }))
                  }
                />
              </FormField>
            </div>
            <FormField label="Medical Notes">
              <Textarea
                value={form.medical_notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, medical_notes: e.target.value }))
                }
                placeholder="Any medical conditions, injuries, allergies..."
                rows={3}
              />
            </FormField>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
