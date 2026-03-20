"use client";

import * as React from "react";

import type { EmployeeSessionBootstrapDTO } from "@/features/employees/types";
import { useAvatarRuntime } from "@/features/arachine-x/client/useAvatarRuntime";

function AvatarStagePlaceholder({
  bootstrap,
  phase,
}: {
  bootstrap: EmployeeSessionBootstrapDTO;
  phase: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Avatar</div>
          <div className="text-lg font-semibold">{bootstrap.employee.name}</div>
          <div className="text-xs text-muted-foreground">
            {bootstrap.employee.roleCategory} · {bootstrap.employee.verified ? "Verified" : "Unverified"}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Phase: <span className="font-mono">{phase}</span>
        </div>
      </div>

      <div className="mt-4 aspect-video w-full rounded-lg bg-muted/50 p-3">
        Real-time avatar stage placeholder (ARACHNE-X runtime will render streams here).
      </div>
    </div>
  );
}

export function EmployeeSessionRuntime({
  bootstrap,
}: {
  bootstrap: EmployeeSessionBootstrapDTO;
}) {
  const avatar = useAvatarRuntime({
    sessionId: bootstrap.sessionId,
    websocket: {
      url: bootstrap.websocket.url,
      token: bootstrap.websocket.token,
    },
    capabilities: bootstrap.capabilities,
  });

  React.useEffect(() => {
    void avatar.connect();
    return () => {
      void avatar.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <AvatarStagePlaceholder bootstrap={bootstrap} phase={avatar.state.phase} />

      <div className="rounded-xl border bg-card p-4">
        <div className="text-sm font-medium">Chat / Voice</div>
        <div className="mt-2 text-xs text-muted-foreground">
          Placeholder UI. Later: bind send/mute events to ARACHNE-X runtime.
        </div>
      </div>
    </div>
  );
}

