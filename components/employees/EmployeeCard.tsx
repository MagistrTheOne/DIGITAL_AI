import Link from "next/link";

import { VideoPlayer } from "@/components/media/VideoPlayer";
import type { EmployeeDTO } from "@/features/employees/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const MIRA_PREVIEW_VIDEO = "/avatars/Mira/mira.mp4";

function isMiraCatalogPreviewName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (n.includes("miraz")) return true;
  return /\bmira\b/.test(n);
}

export function EmployeeCard({ employee }: { employee: EmployeeDTO }) {
  const name = employee.name;
  const miraPreview = isMiraCatalogPreviewName(name);

  return (
    <Link href={`/employees/${employee.id}`} className="block outline-none">
      <Card
        className={cn(
          "border-neutral-800 bg-neutral-950/40 transition-colors",
          "hover:border-neutral-600",
        )}
      >
        <div
          className={cn(
            "w-full overflow-hidden border-b border-neutral-800 bg-neutral-950",
            miraPreview
              ? "aspect-3/4 min-h-48 sm:min-h-56"
              : "aspect-video bg-neutral-900",
          )}
        >
          {miraPreview ? (
            <div className="flex size-full items-center justify-center bg-neutral-950">
              <VideoPlayer
                src={MIRA_PREVIEW_VIDEO}
                className="h-full w-full max-h-full bg-neutral-950 object-contain"
                unmuteOnHover
              />
            </div>
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-neutral-500">
              Preview
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base font-medium text-neutral-200">
              {name}
            </CardTitle>
            <Badge
              variant={employee.verified ? "secondary" : "outline"}
              className="inline-flex shrink-0 items-center gap-1 border-neutral-700 text-neutral-300"
            >
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
        </CardHeader>
        <CardContent className="pt-0 text-xs text-neutral-500">
          {employee.roleLabel}
        </CardContent>
      </Card>
    </Link>
  );
}
