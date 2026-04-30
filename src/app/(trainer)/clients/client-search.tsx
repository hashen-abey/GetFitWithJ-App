"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState, useTransition } from "react";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function ClientSearch({
  initialQ,
  initialStatus,
}: {
  initialQ: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  function applySearch(newQ: string, newStatus: string) {
    const params = new URLSearchParams();
    if (newQ) params.set("q", newQ);
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    startTransition(() => {
      router.push(`/clients?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search clients..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            applySearch(e.target.value, status);
          }}
          className="pl-9"
        />
      </div>
      <div className="flex gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={status === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatus(opt.value);
              applySearch(q, opt.value);
            }}
            className={status === opt.value ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
