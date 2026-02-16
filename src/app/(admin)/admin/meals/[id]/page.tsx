import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

export default async function MealPlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!plan) notFound();

  const { data: days } = await supabase
    .from("meal_plan_days")
    .select("*, meal_plan_items(*)")
    .eq("plan_id", params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/meals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader title={plan.name} />
      </div>

      <Card>
        <CardContent className="p-6">
          {plan.description && (
            <p className="text-muted-foreground">{plan.description}</p>
          )}
          {plan.total_calories && (
            <Badge variant="secondary" className="mt-2">
              ~{plan.total_calories} kcal/day
            </Badge>
          )}
        </CardContent>
      </Card>

      {days?.map((day: any) => {
        const items = day.meal_plan_items || [];
        const grouped = MEAL_ORDER.reduce(
          (acc: Record<string, any[]>, type) => {
            acc[type] = items
              .filter((i: any) => i.meal_type === type)
              .sort((a: any, b: any) => a.sort_order - b.sort_order);
            return acc;
          },
          {}
        );

        return (
          <Card key={day.id}>
            <CardHeader>
              <CardTitle className="capitalize">{day.day_of_week}</CardTitle>
            </CardHeader>
            <CardContent>
              {MEAL_ORDER.map((mealType) => {
                const mealItems = grouped[mealType];
                if (!mealItems || mealItems.length === 0) return null;
                return (
                  <div key={mealType} className="mb-4 last:mb-0">
                    <h4 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
                      {mealType}
                    </h4>
                    <div className="space-y-2">
                      {mealItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="rounded-md border p-3"
                        >
                          <p className="font-medium">{item.name}</p>
                          {item.portion_size && (
                            <p className="text-sm text-muted-foreground">
                              {item.portion_size}
                            </p>
                          )}
                          <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                            {item.calories && <span>{item.calories} kcal</span>}
                            {item.protein_g && <span>P: {item.protein_g}g</span>}
                            {item.carbs_g && <span>C: {item.carbs_g}g</span>}
                            {item.fat_g && <span>F: {item.fat_g}g</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
