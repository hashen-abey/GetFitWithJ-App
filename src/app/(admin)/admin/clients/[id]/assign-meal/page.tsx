"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createMealAssignment } from "@/actions/meals";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import type { MealPlan } from "@/types/database";

export default function AssignMealPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [trainerNotes, setTrainerNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setPlans(data || []);
      setLoadingPlans(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error("Select a meal plan");
      return;
    }
    setLoading(true);

    const result = await createMealAssignment({
      client_id: clientId,
      plan_id: selectedPlan,
      start_date: startDate,
      end_date: endDate || null,
      trainer_notes: trainerNotes || null,
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Meal plan assigned");
    router.push(`/admin/clients/${clientId}`);
  }

  if (loadingPlans) {
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
        <PageHeader title="Assign Meal Plan" />
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No meal plans"
          description="Create a meal plan first before assigning."
          action={
            <Link href="/admin/meals/new">
              <Button>Create Meal Plan</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField label="Meal Plan" required>
                <div className="space-y-2">
                  {plans.map((p) => (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selectedPlan === p.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={p.id}
                        checked={selectedPlan === p.id}
                        onChange={() => setSelectedPlan(p.id)}
                        className="accent-primary"
                      />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.description && (
                          <p className="text-sm text-muted-foreground">
                            {p.description}
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

              <FormField label="Trainer Notes">
                <Textarea
                  value={trainerNotes}
                  onChange={(e) => setTrainerNotes(e.target.value)}
                  placeholder="Notes about this meal plan assignment..."
                  rows={3}
                />
              </FormField>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    "Assign Meal Plan"
                  )}
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
