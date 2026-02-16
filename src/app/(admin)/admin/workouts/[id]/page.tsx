import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, Play } from "lucide-react";
import { DeleteTemplateButton } from "./delete-button";

export default async function WorkoutTemplateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: template } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!template) notFound();

  const { data: exercises } = await supabase
    .from("workout_template_exercises")
    .select("*")
    .eq("template_id", params.id)
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/workouts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader
          title={template.name}
          action={<DeleteTemplateButton id={template.id} />}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          {template.description && (
            <p className="text-muted-foreground">{template.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {template.category && (
              <Badge variant="secondary">{template.category}</Badge>
            )}
            {template.difficulty && (
              <Badge variant="outline">{template.difficulty}</Badge>
            )}
            {template.estimated_duration_min && (
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                {template.estimated_duration_min} min
              </Badge>
            )}
          </div>
          {template.trainer_notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Trainer Notes
                </p>
                <p className="mt-1 text-sm">{template.trainer_notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Exercises ({exercises?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!exercises || exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No exercises added to this template.
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
                      <div className="mt-2 flex flex-wrap gap-3 text-sm">
                        {ex.sets && (
                          <span className="rounded bg-muted px-2 py-0.5">
                            {ex.sets} sets
                          </span>
                        )}
                        {ex.reps && (
                          <span className="rounded bg-muted px-2 py-0.5">
                            {ex.reps} reps
                          </span>
                        )}
                        {ex.rest_seconds && (
                          <span className="rounded bg-muted px-2 py-0.5">
                            {ex.rest_seconds}s rest
                          </span>
                        )}
                      </div>
                      {ex.video_url && (
                        <a
                          href={ex.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Play className="h-3 w-3" />
                          Watch Video
                        </a>
                      )}
                      {ex.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">
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
    </div>
  );
}
