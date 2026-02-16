import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Play, Clock } from "lucide-react";
import Link from "next/link";
import { CompleteWorkoutButton } from "./complete-button";

export default async function WorkoutDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: assignment } = await supabase
    .from("workout_assignments")
    .select("*")
    .eq("id", params.id)
    .eq("client_id", user.id)
    .single();

  if (!assignment) notFound();

  const [exercisesRes, completionsRes] = await Promise.all([
    supabase
      .from("workout_assignment_exercises")
      .select("*")
      .eq("assignment_id", params.id)
      .order("sort_order"),
    supabase
      .from("workout_completions")
      .select("*")
      .eq("assignment_id", params.id)
      .eq("client_id", user.id)
      .order("completed_at", { ascending: false }),
  ]);

  const exercises = exercisesRes.data || [];
  const completions = completionsRes.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workouts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{assignment.name}</h1>
          {assignment.description && (
            <p className="text-sm text-muted-foreground">
              {assignment.description}
            </p>
          )}
        </div>
      </div>

      {assignment.client_notes && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-primary">
              Trainer&apos;s Note
            </p>
            <p className="mt-1 text-sm">{assignment.client_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Exercises */}
      <Card>
        <CardHeader>
          <CardTitle>Exercises ({exercises.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No exercises in this workout.
            </p>
          ) : (
            <div className="space-y-4">
              {exercises.map((ex, i) => (
                <div key={ex.id}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium">{ex.name}</h4>
                      {ex.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {ex.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ex.sets && (
                          <Badge variant="secondary">{ex.sets} sets</Badge>
                        )}
                        {ex.reps && (
                          <Badge variant="secondary">{ex.reps} reps</Badge>
                        )}
                        {ex.rest_seconds && (
                          <Badge variant="outline">
                            <Clock className="mr-1 h-3 w-3" />
                            {ex.rest_seconds}s rest
                          </Badge>
                        )}
                      </div>
                      {ex.video_url && (
                        <a
                          href={ex.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          <Play className="h-4 w-4" />
                          Watch Video
                        </a>
                      )}
                      {ex.notes && (
                        <p className="mt-2 text-sm italic text-muted-foreground">
                          {ex.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Button */}
      <CompleteWorkoutButton assignmentId={assignment.id} />

      {/* Completion History */}
      {completions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Completion History ({completions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(c.completed_at)}
                    </p>
                    {c.notes && (
                      <p className="text-sm text-muted-foreground">{c.notes}</p>
                    )}
                  </div>
                  {c.rating && (
                    <Badge variant="secondary">{c.rating}/5</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
