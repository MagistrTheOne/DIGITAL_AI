"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ClientApiIntegrationPublic } from "@/services/db/repositories/employee-integration.repository";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClientApiIntegrationsPanel({
  employeeId,
  initialIntegrations,
  encryptionConfigured,
}: {
  employeeId: string;
  initialIntegrations: ClientApiIntegrationPublic[];
  encryptionConfigured: boolean;
}) {
  const router = useRouter();
  const [integrations, setIntegrations] =
    React.useState<ClientApiIntegrationPublic[]>(initialIntegrations);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [methods, setMethods] = React.useState("GET,POST,PATCH,PUT");

  React.useEffect(() => {
    setIntegrations(initialIntegrations);
  }, [initialIntegrations]);

  async function refresh() {
    const res = await fetch(`/api/employees/${employeeId}/integrations`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      integrations?: ClientApiIntegrationPublic[];
    };
    if (data.integrations) setIntegrations(data.integrations);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const allowedMethods = methods
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      const res = await fetch(`/api/employees/${employeeId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          baseUrl,
          apiKey,
          allowedMethods: allowedMethods.length ? allowedMethods : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      setName("");
      setBaseUrl("");
      setApiKey("");
      await refresh();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled(integration: ClientApiIntegrationPublic) {
    setError(null);
    const res = await fetch(
      `/api/employees/${employeeId}/integrations/${integration.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !integration.enabled }),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Update failed");
      return;
    }
    await refresh();
    router.refresh();
  }

  async function remove(integrationId: string) {
    if (!confirm("Remove this integration?")) return;
    setError(null);
    const res = await fetch(
      `/api/employees/${employeeId}/integrations/${integrationId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Delete failed");
      return;
    }
    await refresh();
    router.refresh();
  }

  async function testRequest(integrationId: string) {
    setError(null);
    const res = await fetch(
      `/api/employees/${employeeId}/integrations/${integrationId}/test`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/", method: "GET" }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        typeof data.error === "string"
          ? data.error
          : `Test failed (${res.status})`,
      );
      return;
    }
    const preview =
      typeof data.bodyPreview === "string"
        ? data.bodyPreview.slice(0, 800)
        : "";
    toast.message(`Test: HTTP ${data.status}`, {
      description: preview || "(empty body)",
    });
  }

  return (
    <Card className="border-neutral-800 bg-neutral-950/40">
      <CardHeader>
        <CardTitle className="text-neutral-200">Client API</CardTitle>
        <CardDescription className="text-neutral-500">
          HTTPS only; keys are encrypted with{" "}
          <code className="text-neutral-400">INTEGRATIONS_ENCRYPTION_KEY</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!encryptionConfigured ? (
          <p className="text-sm text-amber-500/90">
            Set <code className="text-neutral-400">INTEGRATIONS_ENCRYPTION_KEY</code>{" "}
            in the server environment to add integrations.
          </p>
        ) : null}

        <form onSubmit={onCreate} className="space-y-4">
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="int-name" className="text-neutral-300">
              Label
            </Label>
            <Input
              id="int-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CRM / internal API"
              required
              disabled={!encryptionConfigured || busy}
              className="border-neutral-800 bg-neutral-900 text-neutral-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="int-base" className="text-neutral-300">
              Base URL (https)
            </Label>
            <Input
              id="int-base"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              required
              disabled={!encryptionConfigured || busy}
              className="border-neutral-800 bg-neutral-900 text-neutral-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="int-key" className="text-neutral-300">
              API key
            </Label>
            <Input
              id="int-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Stored encrypted; not shown again"
              required
              disabled={!encryptionConfigured || busy}
              className="border-neutral-800 bg-neutral-900 text-neutral-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="int-methods" className="text-neutral-300">
              Allowed methods
            </Label>
            <Input
              id="int-methods"
              value={methods}
              onChange={(e) => setMethods(e.target.value)}
              disabled={!encryptionConfigured || busy}
              className="border-neutral-800 bg-neutral-900 text-neutral-100"
            />
          </div>
          <Button
            type="submit"
            disabled={!encryptionConfigured || busy}
            className="w-full sm:w-auto"
          >
            {busy ? "Saving…" : "Add integration"}
          </Button>
        </form>

        {integrations.length > 0 ? (
          <ul className="space-y-3 border-t border-neutral-800 pt-4">
            {integrations.map((int) => (
              <li
                key={int.id}
                className="flex flex-col gap-2 rounded-md border border-neutral-800 bg-neutral-900/50 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-neutral-200">{int.name}</span>
                  <span
                    className={
                      int.enabled
                        ? "text-emerald-500/90"
                        : "text-neutral-500"
                    }
                  >
                    {int.enabled ? "enabled" : "disabled"}
                  </span>
                </div>
                <code className="break-all text-xs text-neutral-400">
                  {int.baseUrl}
                </code>
                {int.lastError ? (
                  <p className="text-xs text-amber-500/90">{int.lastError}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-neutral-700"
                    onClick={() => void testRequest(int.id)}
                  >
                    Test GET /
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-neutral-700"
                    onClick={() => void toggleEnabled(int)}
                  >
                    {int.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => void remove(int.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No integrations yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
