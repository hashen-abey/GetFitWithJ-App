"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleClientActive } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/loading";
import { toast } from "sonner";
import type { Profile } from "@/types/database";
import { UserX, UserCheck } from "lucide-react";

export function ClientDetailActions({ client }: { client: Profile }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    const result = await toggleClientActive(client.id, !client.is_active);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        client.is_active ? "Client deactivated" : "Client activated"
      );
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      variant={client.is_active ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Spinner className="h-4 w-4" />
      ) : client.is_active ? (
        <>
          <UserX className="mr-2 h-4 w-4" />
          Deactivate
        </>
      ) : (
        <>
          <UserCheck className="mr-2 h-4 w-4" />
          Activate
        </>
      )}
    </Button>
  );
}
