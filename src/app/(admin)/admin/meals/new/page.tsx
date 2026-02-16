"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMealPlan } from "@/actions/meals";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/shared/loading";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

interface MealItem {
  meal_type: string;
  name: string;
  description: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  portion_size: string;
  notes: string;
}

interface DayPlan {
  day_of_week: string;
  notes: string;
  items: MealItem[];
}

const emptyItem: MealItem = {
  meal_type: "breakfast",
  name: "",
  description: "",
  calories: "",
  protein_g: "",
  carbs_g: "",
  fat_g: "",
  portion_size: "",
  notes: "",
};

export default function NewMealPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    total_calories: "",
    trainer_notes: "",
  });
  const [days, setDays] = useState<DayPlan[]>([
    { day_of_week: "monday", notes: "", items: [{ ...emptyItem }] },
  ]);

  function addDay() {
    const usedDays = days.map((d) => d.day_of_week);
    const nextDay = DAYS.find((d) => !usedDays.includes(d));
    if (nextDay) {
      setDays((prev) => [
        ...prev,
        { day_of_week: nextDay, notes: "", items: [{ ...emptyItem }] },
      ]);
    }
  }

  function removeDay(index: number) {
    setDays((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem(dayIndex: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, items: [...d.items, { ...emptyItem }] } : d
      )
    );
  }

  function removeItem(dayIndex: number, itemIndex: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? { ...d, items: d.items.filter((_, j) => j !== itemIndex) }
          : d
      )
    );
  }

  function updateItem(
    dayIndex: number,
    itemIndex: number,
    field: string,
    value: string
  ) {
    setDays((prev) =>
      prev.map((d, di) =>
        di === dayIndex
          ? {
              ...d,
              items: d.items.map((item, ii) =>
                ii === itemIndex ? { ...item, [field]: value } : item
              ),
            }
          : d
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      toast.error("Plan name is required");
      return;
    }
    setLoading(true);

    const formattedDays = days.map((d) => ({
      day_of_week: d.day_of_week,
      notes: d.notes || undefined,
      items: d.items
        .filter((item) => item.name.trim())
        .map((item, i) => ({
          meal_type: item.meal_type as any,
          name: item.name,
          description: item.description || null,
          calories: item.calories ? parseInt(item.calories) : null,
          protein_g: item.protein_g ? parseFloat(item.protein_g) : null,
          carbs_g: item.carbs_g ? parseFloat(item.carbs_g) : null,
          fat_g: item.fat_g ? parseFloat(item.fat_g) : null,
          portion_size: item.portion_size || null,
          notes: item.notes || null,
          sort_order: i,
        })),
    }));

    const result = await createMealPlan(
      {
        name: form.name,
        description: form.description || null,
        total_calories: form.total_calories
          ? parseInt(form.total_calories)
          : null,
        trainer_notes: form.trainer_notes || null,
      },
      formattedDays
    );

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Meal plan created");
    router.push("/admin/meals");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/meals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader title="New Meal Plan" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Plan Name" required>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Weight Loss Plan"
                  required
                />
              </FormField>
              <FormField label="Total Daily Calories">
                <Input
                  type="number"
                  value={form.total_calories}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, total_calories: e.target.value }))
                  }
                  placeholder="2000"
                />
              </FormField>
            </div>
            <FormField label="Description">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Describe this meal plan..."
                rows={2}
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Days */}
        {days.map((day, dayIndex) => (
          <Card key={dayIndex}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="capitalize">{day.day_of_week}</CardTitle>
              {days.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDay(dayIndex)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {day.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  {itemIndex > 0 && <Separator className="mb-4" />}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={item.meal_type}
                        onValueChange={(v) =>
                          updateItem(dayIndex, itemIndex, "meal_type", v)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEAL_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          updateItem(
                            dayIndex,
                            itemIndex,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Item name"
                        className="flex-1"
                      />
                      {day.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(dayIndex, itemIndex)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <Input
                        type="number"
                        value={item.calories}
                        onChange={(e) =>
                          updateItem(
                            dayIndex,
                            itemIndex,
                            "calories",
                            e.target.value
                          )
                        }
                        placeholder="Calories"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        value={item.protein_g}
                        onChange={(e) =>
                          updateItem(
                            dayIndex,
                            itemIndex,
                            "protein_g",
                            e.target.value
                          )
                        }
                        placeholder="Protein (g)"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        value={item.carbs_g}
                        onChange={(e) =>
                          updateItem(
                            dayIndex,
                            itemIndex,
                            "carbs_g",
                            e.target.value
                          )
                        }
                        placeholder="Carbs (g)"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        value={item.fat_g}
                        onChange={(e) =>
                          updateItem(
                            dayIndex,
                            itemIndex,
                            "fat_g",
                            e.target.value
                          )
                        }
                        placeholder="Fat (g)"
                      />
                    </div>
                    <Input
                      value={item.portion_size}
                      onChange={(e) =>
                        updateItem(
                          dayIndex,
                          itemIndex,
                          "portion_size",
                          e.target.value
                        )
                      }
                      placeholder="Portion size (e.g. 1 cup, 200g)"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(dayIndex)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        ))}

        {days.length < 7 && (
          <Button type="button" variant="outline" onClick={addDay}>
            <Plus className="mr-2 h-4 w-4" />
            Add Day
          </Button>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4" /> : "Create Meal Plan"}
          </Button>
          <Link href="/admin/meals">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
