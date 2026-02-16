"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkoutTemplate } from "@/actions/workouts";
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
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import type { ExerciseInput } from "@/lib/validators";

const defaultExercise: ExerciseInput = {
  name: "",
  description: null,
  sets: null,
  reps: null,
  rest_seconds: null,
  video_url: null,
  image_url: null,
  notes: null,
  sort_order: 0,
};

export default function NewWorkoutTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    difficulty: "",
    estimated_duration_min: "",
    trainer_notes: "",
  });
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { ...defaultExercise },
  ]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateExercise(index: number, field: string, value: any) {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  }

  function addExercise() {
    setExercises((prev) => [...prev, { ...defaultExercise }]);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      toast.error("Template name is required");
      return;
    }
    setLoading(true);

    const result = await createWorkoutTemplate(
      {
        name: form.name,
        description: form.description || null,
        category: form.category || null,
        difficulty: form.difficulty || null,
        estimated_duration_min: form.estimated_duration_min
          ? parseInt(form.estimated_duration_min)
          : null,
        trainer_notes: form.trainer_notes || null,
      },
      exercises.filter((ex) => ex.name.trim())
    );

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Template created");
    router.push("/admin/workouts");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/workouts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader title="New Workout Template" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Template Name" required>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Upper Body Strength"
                required
              />
            </FormField>
            <FormField label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe this workout..."
                rows={2}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Category">
                <Select
                  value={form.category}
                  onValueChange={(v) => updateField("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="hiit">HIIT</SelectItem>
                    <SelectItem value="full-body">Full Body</SelectItem>
                    <SelectItem value="upper-body">Upper Body</SelectItem>
                    <SelectItem value="lower-body">Lower Body</SelectItem>
                    <SelectItem value="core">Core</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Difficulty">
                <Select
                  value={form.difficulty}
                  onValueChange={(v) => updateField("difficulty", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Duration (min)">
                <Input
                  type="number"
                  value={form.estimated_duration_min}
                  onChange={(e) =>
                    updateField("estimated_duration_min", e.target.value)
                  }
                  placeholder="45"
                />
              </FormField>
            </div>
            <FormField label="Trainer Notes">
              <Textarea
                value={form.trainer_notes}
                onChange={(e) => updateField("trainer_notes", e.target.value)}
                placeholder="Internal notes (not visible to clients)..."
                rows={2}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Exercises</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addExercise}>
              <Plus className="mr-2 h-4 w-4" />
              Add Exercise
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {exercises.map((exercise, index) => (
              <div key={index}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="flex items-start gap-2">
                  <div className="mt-2 text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <Input
                        value={exercise.name}
                        onChange={(e) =>
                          updateExercise(index, "name", e.target.value)
                        }
                        placeholder="Exercise name"
                        className="flex-1"
                      />
                      {exercises.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExercise(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        type="number"
                        value={exercise.sets || ""}
                        onChange={(e) =>
                          updateExercise(
                            index,
                            "sets",
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        placeholder="Sets"
                      />
                      <Input
                        value={exercise.reps || ""}
                        onChange={(e) =>
                          updateExercise(index, "reps", e.target.value || null)
                        }
                        placeholder="Reps (e.g. 12 or 8-12)"
                      />
                      <Input
                        type="number"
                        value={exercise.rest_seconds || ""}
                        onChange={(e) =>
                          updateExercise(
                            index,
                            "rest_seconds",
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        placeholder="Rest (sec)"
                      />
                    </div>
                    <Input
                      value={exercise.video_url || ""}
                      onChange={(e) =>
                        updateExercise(
                          index,
                          "video_url",
                          e.target.value || null
                        )
                      }
                      placeholder="YouTube video URL (optional)"
                    />
                    <Textarea
                      value={exercise.notes || ""}
                      onChange={(e) =>
                        updateExercise(
                          index,
                          "notes",
                          e.target.value || null
                        )
                      }
                      placeholder="Exercise notes (optional)"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4" /> : "Create Template"}
          </Button>
          <Link href="/admin/workouts">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
