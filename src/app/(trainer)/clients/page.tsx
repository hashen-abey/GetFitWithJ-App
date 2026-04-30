import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getInitials, formatDate } from "@/lib/utils";
import { Users, Search, ChevronRight, UserPlus } from "lucide-react";
import { ClientSearch } from "./client-search";
import { InviteClientDialog } from "../dashboard/invite-client-dialog";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const q = searchParams.q || "";
  const status = searchParams.status || "all";

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, is_active, created_at, subscription_valid_until")
    .eq("role", "client")
    .order("full_name");

  if (q) {
    query = query.ilike("full_name", `%${q}%`);
  }
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  const { data: clients } = await query;

  // Get recent completions count per client
  const { data: completionCounts } = await supabase
    .from("workout_completions")
    .select("client_id")
    .in("client_id", (clients || []).map((c: any) => c.id));

  const countMap: Record<string, number> = {};
  (completionCounts || []).forEach((c: any) => {
    countMap[c.client_id] = (countMap[c.client_id] || 0) + 1;
  });

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {clients?.length || 0} client{clients?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <InviteClientDialog trainerId={user!.id} />
      </div>

      {/* Filters */}
      <ClientSearch initialQ={q} initialStatus={status} />

      {/* Client Grid */}
      {!clients || clients.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Users className="h-10 w-10 text-slate-300" />
          <div>
            <p className="font-medium text-slate-600">No clients found</p>
            <p className="text-sm text-slate-400 mt-1">
              {q ? "Try a different search term" : "Invite your first client to get started"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client: any) => {
            const isNew = new Date(client.created_at) >= thisMonthStart;
            const subActive = client.subscription_valid_until
              ? new Date(client.subscription_valid_until) >= now
              : null;

            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="group block"
              >
                <Card className="hover:shadow-md transition-all duration-200 hover:border-blue-200 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={client.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                          {getInitials(client.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {client.full_name}
                          </p>
                          {isNew && (
                            <Badge className="bg-blue-500 text-white text-xs h-4 px-1.5">New</Badge>
                          )}
                        </div>
                        <p className="truncate text-sm text-slate-500">{client.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <StatusChip isActive={client.is_active} />
                          {countMap[client.id] > 0 && (
                            <span className="text-xs text-slate-400">
                              {countMap[client.id]} workout{countMap[client.id] !== 1 ? "s" : ""} done
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-1 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-400">
                        Member since {formatDate(client.created_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusChip({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
