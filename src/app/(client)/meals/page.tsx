import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed } from "lucide-react";
import { getDayOfWeek } from "@/lib/utils";

const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

export default async function ClientMealsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // Get active meal assignment
  const { data: assignment } = await supabase
    .from("meal_assignments")
    .select("*, meal_plans(name, description, total_calories)")
    .eq("client_id", user.id)
    .eq("is_active", true)
    .lte("start_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!assignment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Meal Plan" />
        <EmptyState
          icon={UtensilsCrossed}
          title="No meal plan assigned"
          description="Your trainer hasn't assigned a meal plan yet. Check back soon!"
        />
      </div>
    );
  }

  // Get meal plan days with items
  const { data: days } = await supabase
    .from("meal_plan_days")
    .select("*, meal_plan_items(*)")
    .eq("plan_id", assignment.plan_id);

  const sortedDays = (days || []).sort(
    (a, b) => DAYS_ORDER.indexOf(a.day_of_week) - DAYS_ORDER.indexOf(b.day_of_week)
  );

  const todayDay = getDayOfWeek();
  const defaultDay = sortedDays.find((d) => d.day_of_week === todayDay)
    ? todayDay
    : sortedDays[0]?.day_of_week || "monday";

  return (
    <div className="space-y-6">
      <PageHeader title="Meal Plan" />

      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold">
            {(assignment.meal_plans as any)?.name}
          </h2>
          {(assignment.meal_plans as any)?.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {(assignment.meal_plans as any).description}
            </p>
          )}
          {(assignment.meal_plans as any)?.total_calories && (
            <Badge variant="secondary" className="mt-2">
              ~{(assignment.meal_plans as any).total_calories} kcal/day
            </Badge>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue={defaultDay}>
        <TabsList className="w-full overflow-x-auto">
          {sortedDays.map((day) => (
            <TabsTrigger
              key={day.id}
              value={day.day_of_week}
              className="capitalize"
            >
              {day.day_of_week.slice(0, 3)}
            </TabsTrigger>
          ))}
        </TabsList>

        {sortedDays.map((day: any) => {
          const items = day.meal_plan_items || [];
          return (
            <TabsContent key={day.id} value={day.day_of_week}>
              <div className="space-y-4">
                {MEAL_ORDER.map((mealType) => {
                  const mealItems = items
                    .filter((i: any) => i.meal_type === mealType)
                    .sort((a: any, b: any) => a.sort_order - b.sort_order);

                  if (mealItems.length === 0) return null;

                  return (
                    <Card key={mealType}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base capitalize">
                          {mealType}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mealItems.map((item: any) => (
                            <div key={item.id} className="rounded-md border p-3">
                              <p className="font-medium">{item.name}</p>
                              {item.portion_size && (
                                <p className="text-sm text-muted-foreground">
                                  {item.portion_size}
                                </p>
                              )}
                              {item.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {item.calories && (
                                  <Badge variant="outline">
                                    {item.calories} kcal
                                  </Badge>
                                )}
                                {item.protein_g && (
                                  <Badge variant="outline">
                                    P: {item.protein_g}g
                                  </Badge>
                                )}
                                {item.carbs_g && (
                                  <Badge variant="outline">
                                    C: {item.carbs_g}g
                                  </Badge>
                                )}
                                {item.fat_g && (
                                  <Badge variant="outline">
                                    F: {item.fat_g}g
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
