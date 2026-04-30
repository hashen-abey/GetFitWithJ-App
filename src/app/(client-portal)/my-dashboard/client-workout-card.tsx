"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Dumbbell, Clock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClientWorkoutCardProps {
  workout: {
    id: string;
    title: string;
    description: string | null;
    youtube_video_id: string | null;
    difficulty: string | null;
    duration_mins: number | null;
  } | null;
  clientId: string;
  isCompleted: boolean;
}

export function ClientWorkoutCard({ workout, clientId, isCompleted }: ClientWorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);
  const router = useRouter();
  const supabase = createClient();

  if (!workout) return null;

  const diffColors = {
    beginner: "bg-emerald-100 text-emerald-700",
    intermediate: "bg-amber-100 text-amber-700",
    advanced: "bg-red-100 text-red-700",
  };

  async function handleComplete() {
    if (completed) return;
    setLoading(true);

    // We use workout.id as assignment_id for program-based workouts
    const { error } = await supabase.from("workout_completions").insert({
      assignment_id: workout!.id,
      client_id: clientId,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      toast.error("Failed to mark as complete");
    } else {
      setCompleted(true);
      toast.success("Workout completed! Great job! 💪");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card className={`overflow-hidden transition-all ${completed ? "opacity-75" : ""}`}>
      <CardContent className="p-0">
        {workout.youtube_video_id && expanded && (
          <YouTubeEmbed videoId={workout.youtube_video_id} title={workout.title} />
        )}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-lg p-2 ${completed ? "bg-emerald-100" : "bg-slate-100"}`}>
              {completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Dumbbell className="h-5 w-5 text-slate-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-slate-900 ${completed ? "line-through text-slate-400" : ""}`}>
                {workout.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {workout.difficulty && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${diffColors[workout.difficulty as keyof typeof diffColors] || "bg-slate-100 text-slate-600"}`}>
                    {workout.difficulty}
                  </span>
                )}
                {workout.duration_mins && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {workout.duration_mins}m
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {workout.youtube_video_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={loading || completed}
                className={completed
                  ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
                }
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : completed ? (
                  <><CheckCircle2 className="h-4 w-4 mr-1" />Done</>
                ) : (
                  "Mark Done"
                )}
              </Button>
            </div>
          </div>
          {workout.description && expanded && (
            <p className="mt-3 text-sm text-slate-600 border-t pt-3">{workout.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
