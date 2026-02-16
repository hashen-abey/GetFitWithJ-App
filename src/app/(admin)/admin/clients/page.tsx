import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, getInitials, isSubscriptionActive } from "@/lib/utils";
import { Users, Plus, ChevronRight } from "lucide-react";

export default async function AdminClientsPage() {
  const supabase = createServerSupabaseClient();
  const { data: clients } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your client roster"
        action={
          <Link href="/admin/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        }
      />

      {!clients || clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to get started."
          action={
            <Link href="/admin/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => {
            const subActive = isSubscriptionActive(
              client.subscription_valid_until
            );
            return (
              <Link key={client.id} href={`/admin/clients/${client.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(client.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {client.full_name}
                        </p>
                        {!client.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {client.email}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={subActive ? "success" : "destructive"}>
                          {subActive ? "Active Sub" : "No Sub"}
                        </Badge>
                        {client.subscription_valid_until && (
                          <span className="text-xs text-muted-foreground">
                            Until{" "}
                            {formatDate(client.subscription_valid_until)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
