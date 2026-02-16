import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, Plus, ChevronRight } from "lucide-react";

export default async function AdminMealsPage() {
  const supabase = createServerSupabaseClient();
  const { data: plans } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meal Plans"
        description="Create and manage reusable meal plans"
        action={
          <Link href="/admin/meals/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Meal Plan
            </Button>
          </Link>
        }
      />

      {!plans || plans.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No meal plans"
          description="Create your first meal plan to assign to clients."
          action={
            <Link href="/admin/meals/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Meal Plan
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/admin/meals/${plan.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{plan.name}</p>
                    {plan.description && (
                      <p className="truncate text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}
                    {plan.total_calories && (
                      <p className="text-xs text-muted-foreground">
                        ~{plan.total_calories} kcal/day
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
