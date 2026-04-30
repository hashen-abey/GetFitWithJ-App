import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, ClipboardList, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CreateProgramDialog } from "./create-program-dialog";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const supabase = createServerSupabaseClient();

  const { data: programs } = await supabase
    .from("programs")
    .select("*, profiles!programs_trainer_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  // Count workouts per program
  const { data: pwCounts } = await supabase
    .from("program_workouts")
    .select("program_id");

  const countMap: Record<string, number> = {};
  (pwCounts || []).forEach((pw: any) => {
    countMap[pw.program_id] = (countMap[pw.program_id] || 0) + 1;
  });

  // Count assigned clients per program
  const { data: cpCounts } = await supabase
    .from("client_programs")
    .select("program_id")
    .eq("is_active", true);

  const clientMap: Record<string, number> = {};
  (cpCounts || []).forEach((cp: any) => {
    clientMap[cp.program_id] = (clientMap[cp.program_id] || 0) + 1;
  });

  const templates = (programs || []).filter((p: any) => p.is_template);
  const custom = (programs || []).filter((p: any) => !p.is_template);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Programs</h1>
          <p className="text-sm text-slate-500 mt-0.5">{programs?.length || 0} programs</p>
        </div>
        <CreateProgramDialog />
      </div>

      {templates.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Templates</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((program: any) => (
              <ProgramCard key={program.id} program={program} workoutCount={countMap[program.id] || 0} clientCount={clientMap[program.id] || 0} />
            ))}
          </div>
        </div>
      )}

      <div>
        {templates.length > 0 && (
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Custom Programs</h2>
        )}
        {custom.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <ClipboardList className="h-10 w-10 text-slate-300" />
            <div>
              <p className="font-medium text-slate-600">No programs yet</p>
              <p className="text-sm text-slate-400 mt-1">Build your first training program</p>
            </div>
            <CreateProgramDialog />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {custom.map((program: any) => (
              <ProgramCard key={program.id} program={program} workoutCount={countMap[program.id] || 0} clientCount={clientMap[program.id] || 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgramCard({
  program,
  workoutCount,
  clientCount,
}: {
  program: any;
  workoutCount: number;
  clientCount: number;
}) {
  return (
    <Link href={`/programs/${program.id}`} className="group block">
      <Card className="hover:shadow-md transition-all duration-200 hover:border-blue-200 cursor-pointer h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {program.name}
                </h3>
                {program.is_template && (
                  <Badge variant="secondary" className="text-xs shrink-0">Template</Badge>
                )}
              </div>
              {program.description && (
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">{program.description}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ClipboardList className="h-3.5 w-3.5" />
              {workoutCount} workout{workoutCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {clientCount} client{clientCount !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Created {formatDate(program.created_at)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
