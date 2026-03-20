"use client";

import Link from "next/link";

import type { EmployeeDTO } from "@/features/employees/types";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export function EmployeeCard({ employee }: { employee: EmployeeDTO }) {
  return (
    <Link
      href={`/employees/${employee.id}`}
      className="group block rounded-xl border bg-card p-4 shadow-xs transition-transform hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted/40">
        {employee.videoPreview ? (
          <VideoPlayer
            src={employee.videoPreview.src}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No video preview
          </div>
        )}

        {employee.verified && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs backdrop-blur">
            <ShieldCheck className="size-3.5" />
            <span>Verified</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">{employee.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {employee.roleCategory}
          </div>
        </div>

        <div className="shrink-0">
          <Badge variant={employee.verified ? "secondary" : "outline"}>
            {employee.verified ? (
              <>
                <CheckCircle2 className="size-3.5" />
                Verified
              </>
            ) : (
              "Unverified"
            )}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

