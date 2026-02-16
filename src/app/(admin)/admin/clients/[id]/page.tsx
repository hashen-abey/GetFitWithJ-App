import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  formatDate,
  getInitials,
  isSubscriptionActive,
  formatCurrency,
} from "@/lib/utils";
import {
  ArrowLeft,
  Dumbbell,
  UtensilsCrossed,
  Calendar,
  CreditCard,
  TrendingUp,
  Edit,
} from "lucide-react";
import { ClientDetailActions } from "./client-actions";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: client } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!client) notFound();

  // Parallel data fetching
  const [assignmentsRes, mealAssignmentsRes, sessionsRes, paymentsRes, progressRes] =
    await Promise.all([
      supabase
        .from("workout_assignments")
        .select("*")
        .eq("client_id", params.id)
        .eq("is_active", true)
        .order("start_date", { ascending: false })
        .limit(5),
      supabase
        .from("meal_assignments")
        .select("*, meal_plans(name)")
        .eq("client_id", params.id)
        .eq("is_active", true)
        .order("start_date", { ascending: false })
        .limit(3),
      supabase
        .from("sessions")
        .select("*")
        .eq("client_id", params.id)
        .gte("session_date", new Date().toISOString().split("T")[0])
        .eq("status", "scheduled")
        .order("session_date", { ascending: true })
        .limit(3),
      supabase
        .from("payments")
        .select("*")
        .eq("client_id", params.id)
        .order("submitted_at", { ascending: false })
        .limit(5),
      supabase
        .from("progress_logs")
        .select("*")
        .eq("client_id", params.id)
        .order("log_date", { ascending: false })
        .limit(5),
    ]);

  const subActive = isSubscriptionActive(client.subscription_valid_until);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader title={client.full_name} />
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-lg text-primary">
                {getInitials(client.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{client.full_name}</h2>
                <Badge variant={client.is_active ? "success" : "secondary"}>
                  {client.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant={subActive ? "success" : "destructive"}>
                  {subActive ? "Subscribed" : "No Subscription"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{client.email}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {client.phone && <span>Phone: {client.phone}</span>}
                {client.gender && (
                  <span>Gender: {client.gender}</span>
                )}
                {client.height_cm && (
                  <span>Height: {client.height_cm} cm</span>
                )}
                {client.weight_kg && (
                  <span>Weight: {client.weight_kg} kg</span>
                )}
                {client.subscription_valid_until && (
                  <span>
                    Sub until: {formatDate(client.subscription_valid_until)}
                  </span>
                )}
              </div>
            </div>
            <ClientDetailActions client={client} />
          </div>
          {client.medical_notes && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Medical Notes
                </p>
                <p className="mt-1 text-sm">{client.medical_notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workout Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="h-5 w-5 text-primary" />
              Workouts
            </CardTitle>
            <Link href={`/admin/clients/${params.id}/assign-workout`}>
              <Button size="sm">Assign</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!assignmentsRes.data?.length ? (
              <p className="text-sm text-muted-foreground">
                No workout assignments.
              </p>
            ) : (
              <div className="space-y-2">
                {assignmentsRes.data.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.start_date)}
                        {a.end_date ? ` - ${formatDate(a.end_date)}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meal Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Meal Plans
            </CardTitle>
            <Link href={`/admin/clients/${params.id}/assign-meal`}>
              <Button size="sm">Assign</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!mealAssignmentsRes.data?.length ? (
              <p className="text-sm text-muted-foreground">
                No meal plan assignments.
              </p>
            ) : (
              <div className="space-y-2">
                {mealAssignmentsRes.data.map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {a.meal_plans?.name || "Meal Plan"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        From {formatDate(a.start_date)}
                      </p>
                    </div>
                  </div>
                ))}
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
            {!sessionsRes.data?.length ? (
              <p className="text-sm text-muted-foreground">
                No upcoming sessions.
              </p>
            ) : (
              <div className="space-y-2">
                {sessionsRes.data.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(s.session_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!paymentsRes.data?.length ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {paymentsRes.data.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.submitted_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        p.status === "approved"
                          ? "success"
                          : p.status === "rejected"
                          ? "destructive"
                          : "warning"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progress History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!progressRes.data?.length ? (
              <p className="text-sm text-muted-foreground">
                No progress logs yet.
              </p>
            ) : (
              <div className="space-y-2">
                {progressRes.data.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{formatDate(p.log_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.weight_kg ? `${p.weight_kg} kg` : ""}
                        {p.body_fat_pct ? ` | ${p.body_fat_pct}% BF` : ""}
                      </p>
                    </div>
                    {p.notes && (
                      <p className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {p.notes}
                      </p>
                    )}
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
