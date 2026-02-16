import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import {
  Users,
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // Parallel data fetching
  const [clientsRes, pendingPaymentsRes, todaySessionsRes, recentCompletionsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact" })
        .eq("role", "client")
        .eq("is_active", true),
      supabase
        .from("payments")
        .select("*, profiles!payments_client_id_fkey(full_name)")
        .eq("status", "pending")
        .order("submitted_at", { ascending: true })
        .limit(5),
      supabase
        .from("sessions")
        .select("*, profiles!sessions_client_id_fkey(full_name)")
        .eq("session_date", today)
        .order("start_time", { ascending: true }),
      supabase
        .from("workout_completions")
        .select(
          "*, profiles!workout_completions_client_id_fkey(full_name), workout_assignments!workout_completions_assignment_id_fkey(name)"
        )
        .order("completed_at", { ascending: false })
        .limit(5),
    ]);

  const activeClients = clientsRes.count || 0;
  const pendingPayments = pendingPaymentsRes.data || [];
  const todaySessions = todaySessionsRes.data || [];
  const recentCompletions = recentCompletionsRes.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your coaching platform" />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Clients"
          value={activeClients}
          icon={Users}
        />
        <StatCard
          title="Pending Payments"
          value={pendingPayments.length}
          icon={CreditCard}
          description={pendingPayments.length > 0 ? "Needs review" : "All clear"}
        />
        <StatCard
          title="Today's Sessions"
          value={todaySessions.length}
          icon={Calendar}
        />
        <StatCard
          title="Recent Completions"
          value={recentCompletions.length}
          icon={CheckCircle}
          description="Last 5 workouts"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Today&apos;s Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sessions scheduled for today.
              </p>
            ) : (
              <div className="space-y-3">
                {todaySessions.map((session: any) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {(session.profiles as any)?.full_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatTime(session.start_time)}
                      </p>
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending payments.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {(payment.profiles as any)?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.submitted_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(payment.amount)}
                      </p>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-primary" />
              Recent Workout Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCompletions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent completions.
              </p>
            ) : (
              <div className="space-y-3">
                {recentCompletions.map((completion: any) => (
                  <div
                    key={completion.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {(completion.profiles as any)?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(completion.workout_assignments as any)?.name}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {formatDate(completion.completed_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
