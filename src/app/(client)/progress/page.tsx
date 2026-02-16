"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createProgressLog } from "@/actions/progress";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/shared/loading";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { TrendingUp, Plus, Scale, Ruler } from "lucide-react";
import type { ProgressLog } from "@/types/database";

export default function ClientProgressPage() {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    log_date: new Date().toISOString().split("T")[0],
    weight_kg: "",
    body_fat_pct: "",
    chest_cm: "",
    waist_cm: "",
    hips_cm: "",
    arm_cm: "",
    thigh_cm: "",
    notes: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);

  const supabase = createClient();

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("progress_logs")
      .select("*")
      .eq("client_id", user.id)
      .order("log_date", { ascending: false });

    setLogs(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let photoUrls: string[] = [];

    // Upload photos if any
    if (photos.length > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        setSaving(false);
        return;
      }

      for (const photo of photos) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;

        const { error } = await supabase.storage
          .from("progress-photos")
          .upload(fileName, photo);

        if (!error) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("progress-photos").getPublicUrl(fileName);
          photoUrls.push(publicUrl);
        }
      }
    }

    const result = await createProgressLog(
      {
        log_date: form.log_date,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
        chest_cm: form.chest_cm ? parseFloat(form.chest_cm) : null,
        waist_cm: form.waist_cm ? parseFloat(form.waist_cm) : null,
        hips_cm: form.hips_cm ? parseFloat(form.hips_cm) : null,
        arm_cm: form.arm_cm ? parseFloat(form.arm_cm) : null,
        thigh_cm: form.thigh_cm ? parseFloat(form.thigh_cm) : null,
        notes: form.notes || null,
      },
      photoUrls.length > 0 ? photoUrls : undefined
    );

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Progress logged");
      setDialogOpen(false);
      setForm({
        log_date: new Date().toISOString().split("T")[0],
        weight_kg: "",
        body_fat_pct: "",
        chest_cm: "",
        waist_cm: "",
        hips_cm: "",
        arm_cm: "",
        thigh_cm: "",
        notes: "",
      });
      setPhotos([]);
      loadData();
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Log Progress
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log Progress</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Date">
                  <Input
                    type="date"
                    value={form.log_date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, log_date: e.target.value }))
                    }
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Weight (kg)">
                    <Input
                      type="number"
                      step="0.1"
                      value={form.weight_kg}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, weight_kg: e.target.value }))
                      }
                      placeholder="70.5"
                    />
                  </FormField>
                  <FormField label="Body Fat %">
                    <Input
                      type="number"
                      step="0.1"
                      value={form.body_fat_pct}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          body_fat_pct: e.target.value,
                        }))
                      }
                      placeholder="15.0"
                    />
                  </FormField>
                  <FormField label="Chest (cm)">
                    <Input
                      type="number"
                      step="0.1"
                      value={form.chest_cm}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, chest_cm: e.target.value }))
                      }
                    />
                  </FormField>
                  <FormField label="Waist (cm)">
                    <Input
                      type="number"
                      step="0.1"
                      value={form.waist_cm}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, waist_cm: e.target.value }))
                      }
                    />
                  </FormField>
                  <FormField label="Hips (cm)">
                    <Input
                      type="number"
                      step="0.1"
                      value={form.hips_cm}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, hips_cm: e.target.value }))
                      }
                    />
                  </FormField>
                  <FormField label="Arm (cm)">
                    <Input
                      type="number"
                      step="0.1"
                      value={form.arm_cm}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, arm_cm: e.target.value }))
                      }
                    />
                  </FormField>
                  <FormField label="Thigh (cm)">
                    <Input
                      type="number"
                      step="0.1"
                      value={form.thigh_cm}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, thigh_cm: e.target.value }))
                      }
                    />
                  </FormField>
                </div>
                <FormField label="Progress Photos">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) =>
                      setPhotos(Array.from(e.target.files || []))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Max 5MB each. JPEG, PNG, or WebP.
                  </p>
                </FormField>
                <FormField label="Notes">
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    placeholder="How are you feeling? Any observations?"
                    rows={3}
                  />
                </FormField>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Spinner className="h-4 w-4" /> : "Save Progress"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No progress logged"
          description="Start tracking your progress by logging your measurements."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Log Progress
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{formatDate(log.log_date)}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {log.weight_kg && (
                    <div className="flex items-center gap-2 rounded bg-muted p-2">
                      <Scale className="h-4 w-4 text-primary" />
                      <span>{log.weight_kg} kg</span>
                    </div>
                  )}
                  {log.body_fat_pct && (
                    <div className="flex items-center gap-2 rounded bg-muted p-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>{log.body_fat_pct}% BF</span>
                    </div>
                  )}
                  {log.chest_cm && (
                    <div className="flex items-center gap-2 rounded bg-muted p-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>Chest: {log.chest_cm} cm</span>
                    </div>
                  )}
                  {log.waist_cm && (
                    <div className="flex items-center gap-2 rounded bg-muted p-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>Waist: {log.waist_cm} cm</span>
                    </div>
                  )}
                  {log.hips_cm && (
                    <div className="flex items-center gap-2 rounded bg-muted p-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>Hips: {log.hips_cm} cm</span>
                    </div>
                  )}
                  {log.arm_cm && (
                    <div className="flex items-center gap-2 rounded bg-muted p-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>Arm: {log.arm_cm} cm</span>
                    </div>
                  )}
                  {log.thigh_cm && (
                    <div className="flex items-center gap-2 rounded bg-muted p-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>Thigh: {log.thigh_cm} cm</span>
                    </div>
                  )}
                </div>
                {log.notes && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {log.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
