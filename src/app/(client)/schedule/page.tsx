import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, MapPin } from "lucide-react";

export default async function ClientSchedulePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("client_id", user.id)
    .gte("session_date", today)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" />

      {!sessions || sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming sessions"
          description="Your trainer will schedule sessions for you. Check back soon!"
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{session.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(session.session_date)} at{" "}
                      {formatTime(session.start_time)}
                      {session.end_time && ` - ${formatTime(session.end_time)}`}
                    </p>
                    {session.location && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </p>
                    )}
                    {session.description && (
                      <p className="mt-2 text-sm">{session.description}</p>
                    )}
                  </div>
                  <Badge
                    variant={
                      session.status === "completed"
                        ? "success"
                        : session.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {session.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
