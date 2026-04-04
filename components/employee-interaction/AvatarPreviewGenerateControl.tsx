"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const HIDE_PREVIEW_BTN_KEY = "nullxes.hideAvatarPreviewGenerate";
/** Sentinel — UI renders a single 404 copy, not this string. */
const ERR_PREVIEW_404 = "__preview_post_404__";

export function AvatarPreviewGenerateControl({
  employeeId,
  enabled,
}: {
  employeeId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [hiddenForSession, setHiddenForSession] = React.useState(false);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(HIDE_PREVIEW_BTN_KEY) === "1") {
        setHiddenForSession(true);
      }
    } catch {
      /* private mode */
    }
  }, []);

  if (!enabled || hiddenForSession) return null;

  const onClick = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/employees/${encodeURIComponent(employeeId)}/avatar-preview`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        upstreamStatus?: number | null;
      };
      if (!res.ok) {
        const is404 =
          data.upstreamStatus === 404 ||
          (typeof data.error === "string" && /404|not deployed|wrong path/i.test(data.error));
        if (is404) {
          throw new Error(ERR_PREVIEW_404);
        }
        const base = data.error || `Request failed (${res.status})`;
        const hint =
          data.upstreamStatus != null
            ? ` (ARACHNE HTTP ${data.upstreamStatus})`
            : "";
        throw new Error(base + hint);
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex max-w-md flex-col items-center gap-1 px-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
        disabled={busy}
        onClick={() => void onClick()}
      >
        {busy ? "Generating preview…" : "Generate preview (ARACHNE)"}
      </Button>
      {!err ? (
        <p className="text-center text-[10px] leading-snug text-neutral-600">
          Optional: <span className="font-mono text-neutral-500">ARACHNE_AVATAR_PREVIEW_URL</span>{" "}
          → POST on ARACHNE returning <span className="font-mono text-neutral-500">videoUrl</span>.
          Otherwise use bootstrap <span className="font-mono text-neutral-500">videoPreviewUrl</span>.
        </p>
      ) : (
        <div
          className="flex max-w-sm flex-col items-center gap-2 text-center"
          role="alert"
        >
          {err === ERR_PREVIEW_404 ? (
            <p className="text-xs leading-snug text-amber-200/85">
              На вашем URL-адресе ARACHNE_AVATAR_PREVIEW_URL ничего не отображается (404).
              Удалите эту строку из файла .env.local или выполните POST-запрос на ARACHNE;
              параметр videoPreviewUrl из bootstrap остаётся неизменным.
            </p>
          ) : (
            <p className="text-xs leading-snug text-red-400/90">{err}</p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-neutral-400 hover:text-neutral-200"
              onClick={() => setErr(null)}
            >
              Dismiss
            </Button>
            {err === ERR_PREVIEW_404 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-neutral-400 hover:text-neutral-200"
                onClick={() => {
                  try {
                    sessionStorage.setItem(HIDE_PREVIEW_BTN_KEY, "1");
                  } catch {
                    /* ignore */
                  }
                  setHiddenForSession(true);
                }}
              >
                Hide until page reload
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
