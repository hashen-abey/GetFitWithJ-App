"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeWorkout } from "@/actions/workouts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { Spinner } from "@/components/shared/loading";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

export function CompleteWorkoutButton({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleComplete() {
    setLoading(true);
    const result = await completeWorkout({
      assignment_id: assignmentId,
      notes: notes || null,
      rating: rating ? parseInt(rating) : null,
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Workout completed! Great job!");
    setExpanded(false);
    setNotes("");
    setRating("");
    router.refresh();
    setLoading(false);
  }

  if (!expanded) {
    return (
      <Button
        className="w-full py-6 text-lg"
        onClick={() => setExpanded(true)}
      >
        <CheckCircle className="mr-2 h-5 w-5" />
        Mark as Completed
      </Button>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Complete Workout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField label="How was it? (optional)">
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger>
              <SelectValue placeholder="Rate this workout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Very Easy</SelectItem>
              <SelectItem value="2">2 - Easy</SelectItem>
              <SelectItem value="3">3 - Moderate</SelectItem>
              <SelectItem value="4">4 - Hard</SelectItem>
              <SelectItem value="5">5 - Very Hard</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Notes (optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it go? Any issues?"
            rows={3}
          />
        </FormField>
        <div className="flex gap-3">
          <Button onClick={handleComplete} disabled={loading} className="flex-1">
            {loading ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setExpanded(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
