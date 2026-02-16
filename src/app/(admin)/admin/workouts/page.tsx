import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Plus, ChevronRight, Clock } from "lucide-react";

export default async function AdminWorkoutsPage() {
  const supabase = createServerSupabaseClient();
  const { data: templates } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workout Templates"
        description="Create and manage reusable workout templates"
        action={
          <Link href="/admin/workouts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </Link>
        }
      />

      {!templates || templates.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workout templates"
          description="Create your first workout template to assign to clients."
          action={
            <Link href="/admin/workouts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/admin/workouts/${template.id}`}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{template.name}</p>
                    {template.description && (
                      <p className="truncate text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      {template.category && (
                        <Badge variant="secondary">{template.category}</Badge>
                      )}
                      {template.difficulty && (
                        <Badge variant="outline">{template.difficulty}</Badge>
                      )}
                      {template.estimated_duration_min && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {template.estimated_duration_min} min
                        </span>
                      )}
                    </div>
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
