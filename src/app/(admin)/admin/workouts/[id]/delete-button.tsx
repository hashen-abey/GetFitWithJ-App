"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteWorkoutTemplate } from "@/actions/workouts";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/loading";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeleteTemplateButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this template?")) return;
    setLoading(true);

    const result = await deleteWorkoutTemplate(id);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Template deleted");
    router.push("/admin/workouts");
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </>
      )}
    </Button>
  );
}
