import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, isSubscriptionActive, getDayOfWeek } from "@/lib/utils";
import {
  Dumbbell,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default async function ClientDashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  const [profileRes, assignmentsRes, sessionsRes, settingsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("workout_assignments")
        .select("*")
        .eq("client_id", user.id)
        .eq("is_active", true)
        .lte("start_date", today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order("start_date", { ascending: false })
        .limit(3),
      supabase
        .from("sessions")
        .select("*")
        .eq("client_id", user.id)
        .gte("session_date", today)
        .eq("status", "scheduled")
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(3),
      supabase
        .from("app_settings")
        .select("*")
        .eq("key", "welcome_message")
        .single(),
    ]);

  const profile = profileRes.data;
  const assignments = assignmentsRes.data || [];
  const sessions = sessionsRes.data || [];
  const welcomeMessage = settingsRes.data?.value;
  const subActive = isSubscriptionActive(
    profile?.subscription_valid_until ?? null
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Hi, {profile?.full_name?.split(" ")[0]}
        </h1>
        {welcomeMessage && (
          <p className="mt-1 text-sm text-muted-foreground">{welcomeMessage}</p>
        )}
      </div>

      {/* Subscription Status */}
      <Card
        className={
          subActive ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        }
      >
        <CardContent className="flex items-center gap-3 p-4">
          {subActive ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <div className="flex-1">
            <p className="font-medium">
              {subActive ? "Subscription Active" : "Subscription Expired"}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile?.subscription_valid_until
                ? `Valid until ${formatDate(profile.subscription_valid_until)}`
                : "No active subscription"}
            </p>
          </div>
          {!subActive && (
            <Link href="/payments">
              <Button size="sm">
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Today's Workouts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5 text-primary" />
            Your Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active workouts assigned.
            </p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <Link key={a.id} href={`/workouts/${a.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                    <div>
                      <p className="font-medium">{a.name}</p>
                      {a.description && (
                        <p className="text-sm text-muted-foreground">
                          {a.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">View</Badge>
                  </div>
                </Link>
              ))}
              <Link href="/workouts">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Workouts
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming sessions scheduled.
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(s.session_date)} at {formatTime(s.start_time)}
                    </p>
                  </div>
                  {s.location && (
                    <span className="text-sm text-muted-foreground">
                      {s.location}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
