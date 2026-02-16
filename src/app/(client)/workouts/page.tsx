import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Dumbbell, ChevronRight } from "lucide-react";

export default async function ClientWorkoutsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: assignments } = await supabase
    .from("workout_assignments")
    .select("*")
    .eq("client_id", user.id)
    .eq("is_active", true)
    .order("start_date", { ascending: false });

  // Get completions count per assignment
  const { data: completions } = await supabase
    .from("workout_completions")
    .select("assignment_id")
    .eq("client_id", user.id);

  const completionCounts: Record<string, number> = {};
  completions?.forEach((c) => {
    completionCounts[c.assignment_id] =
      (completionCounts[c.assignment_id] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My Workouts" />

      {!assignments || assignments.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts assigned"
          description="Your trainer hasn't assigned any workouts yet. Check back soon!"
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Link key={a.id} href={`/workouts/${a.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{a.name}</p>
                    {a.description && (
                      <p className="truncate text-sm text-muted-foreground">
                        {a.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        From {formatDate(a.start_date)}
                      </span>
                      {completionCounts[a.id] > 0 && (
                        <Badge variant="success">
                          {completionCounts[a.id]}x completed
                        </Badge>
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
