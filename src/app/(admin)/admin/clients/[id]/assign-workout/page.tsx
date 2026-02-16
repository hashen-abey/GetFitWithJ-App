"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { assignTemplateToClient } from "@/actions/workouts";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { ArrowLeft, Dumbbell } from "lucide-react";
import Link from "next/link";
import type { WorkoutTemplate } from "@/types/database";

export default function AssignWorkoutPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setTemplates(data || []);
      setLoadingTemplates(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) {
      toast.error("Select a template");
      return;
    }
    setLoading(true);

    const result = await assignTemplateToClient(
      selectedTemplate,
      clientId,
      startDate,
      endDate || undefined,
      clientNotes || undefined
    );

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Workout assigned");
    router.push(`/admin/clients/${clientId}`);
  }

  if (loadingTemplates) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/clients/${clientId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader title="Assign Workout" />
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No templates"
          description="Create a workout template first before assigning."
          action={
            <Link href="/admin/workouts/new">
              <Button>Create Template</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Workout Template" required>
                <div className="space-y-2">
                  {templates.map((t) => (
                    <label
                      key={t.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selectedTemplate === t.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={t.id}
                        checked={selectedTemplate === t.id}
                        onChange={() => setSelectedTemplate(t.id)}
                        className="accent-primary"
                      />
                      <div>
                        <p className="font-medium">{t.name}</p>
                        {t.description && (
                          <p className="text-sm text-muted-foreground">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Start Date" required>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="End Date">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Notes for Client">
                <Textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Any specific instructions for this client..."
                  rows={3}
                />
              </FormField>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner className="h-4 w-4" /> : "Assign Workout"}
                </Button>
                <Link href={`/admin/clients/${clientId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
