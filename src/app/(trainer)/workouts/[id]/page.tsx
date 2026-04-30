import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Clock, Edit, Trash2 } from "lucide-react";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import { DeleteWorkoutButton } from "./delete-button";

export const dynamic = "force-dynamic";

const DIFFICULTY_COLORS = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default async function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select("*, profiles!workouts_created_by_fkey(full_name)")
    .eq("id", params.id)
    .single();

  if (!workout) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="-ml-2">
          <Link href="/workouts"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">{workout.title}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href={`/workouts/${params.id}/edit`}><Edit className="h-4 w-4 mr-1" />Edit</Link>
          </Button>
          <DeleteWorkoutButton id={params.id} />
        </div>
      </div>

      {workout.youtube_video_id && (
        <YouTubeEmbed videoId={workout.youtube_video_id} title={workout.title} />
      )}

      <Card>
        <CardContent className="pt-5 space-y-4">
          {workout.description && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{workout.description}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {workout.difficulty && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Difficulty</p>
                <span className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${DIFFICULTY_COLORS[workout.difficulty as keyof typeof DIFFICULTY_COLORS] || "bg-slate-100 text-slate-600"}`}>
                  {workout.difficulty}
                </span>
              </div>
            )}
            {workout.duration_mins && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Duration</p>
                <div className="flex items-center gap-1 text-sm text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {workout.duration_mins} minutes
                </div>
              </div>
            )}
          </div>
          {workout.muscle_groups && workout.muscle_groups.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Muscle Groups</p>
              <div className="flex flex-wrap gap-1.5">
                {workout.muscle_groups.map((mg: string) => (
                  <Badge key={mg} variant="secondary">{mg}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="text-xs text-slate-400 border-t pt-3">
            Added by {(workout as any).profiles?.full_name || "Trainer"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
