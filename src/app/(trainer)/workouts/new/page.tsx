"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowLeft, X, Play } from "lucide-react";
import Link from "next/link";
import { createWorkout } from "@/actions/workouts-new";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "Glutes", "Full Body", "Biceps", "Triceps", "Hamstrings", "Quadriceps", "Calves"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

function extractVideoId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /embed\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function NewWorkoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    difficulty: "",
    durationMins: "",
  });
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);

  function handleYoutubeChange(url: string) {
    setForm((f) => ({ ...f, youtubeUrl: url }));
    const id = extractVideoId(url);
    setPreviewId(id);
  }

  function toggleMuscle(mg: string) {
    setMuscleGroups((prev) =>
      prev.includes(mg) ? prev.filter((m) => m !== mg) : [...prev, mg]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);

    const result = await createWorkout({
      title: form.title.trim(),
      description: form.description || undefined,
      youtubeUrl: form.youtubeUrl || undefined,
      difficulty: form.difficulty || undefined,
      muscleGroups,
      durationMins: form.durationMins ? parseInt(form.durationMins) : undefined,
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Workout added to library!");
    router.push("/workouts");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="-ml-2">
          <Link href="/workouts"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Workout</h1>
          <p className="text-sm text-slate-500 mt-0.5">Add a new workout to your library</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Workout Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Upper Body Push Day"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this workout..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm((f) => ({ ...f, difficulty: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g. 45"
                  min="1"
                  max="300"
                  value={form.durationMins}
                  onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">YouTube Video</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube URL</Label>
              <div className="flex gap-2">
                <Input
                  id="youtube"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.youtubeUrl}
                  onChange={(e) => handleYoutubeChange(e.target.value)}
                />
                {form.youtubeUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => { setForm((f) => ({ ...f, youtubeUrl: "" })); setPreviewId(null); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Paste a YouTube URL — embeds use youtube-nocookie.com for privacy
              </p>
            </div>
            {previewId && (
              <YouTubeEmbed videoId={previewId} title={form.title} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Muscle Groups</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => toggleMuscle(mg)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    muscleGroups.includes(mg)
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/workouts">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white flex-1 sm:flex-none">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Workout
          </Button>
        </div>
      </form>
    </div>
  );
}
