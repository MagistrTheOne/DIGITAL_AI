"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { KnowledgeDocumentPublic } from "@/services/db/repositories/knowledge.repository";
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

export function KnowledgeUploadPanel({
  employeeId,
  initialDocuments,
}: {
  employeeId: string;
  initialDocuments: KnowledgeDocumentPublic[];
}) {
  const router = useRouter();
  const [documents, setDocuments] =
    React.useState<KnowledgeDocumentPublic[]>(initialDocuments);
  const [label, setLabel] = React.useState("");
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  async function refresh() {
    const res = await fetch(`/api/employees/${employeeId}/knowledge`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      documents?: KnowledgeDocumentPublic[];
    };
    if (data.documents) setDocuments(data.documents);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          ...(label.trim() ? { label: label.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Upload failed");
        return;
      }
      setText("");
      setLabel("");
      await refresh();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeDoc(documentId: string) {
    if (!confirm("Delete this document and all its chunks?")) return;
    setError(null);
    const res = await fetch(
      `/api/employees/${employeeId}/knowledge/${documentId}`,
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

  return (
    <Card className="border-neutral-800 bg-neutral-950/40">
      <CardHeader>
        <CardTitle className="text-neutral-200">Knowledge base</CardTitle>
        <CardDescription className="text-neutral-500">
          Plain text for now; embedded with OpenAI and searchable in chat via
          tool calls.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="kb-label" className="text-neutral-300">
              Title (optional)
            </Label>
            <Input
              id="kb-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Q4 playbook"
              disabled={busy}
              className="border-neutral-800 bg-neutral-900 text-neutral-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kb-text" className="text-neutral-300">
              Text
            </Label>
            <textarea
              id="kb-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={8}
              disabled={busy}
              placeholder="Paste reference material…"
              className="focus-visible:ring-ring/50 w-full resize-y rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus-visible:ring-[3px]"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy ? "Indexing…" : "Upload & index"}
          </Button>
        </form>

        {documents.length > 0 ? (
          <ul className="space-y-2 border-t border-neutral-800 pt-4">
            {documents.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-neutral-200">{d.sourceLabel}</p>
                  <p className="text-xs text-neutral-500">
                    {d.chunkCount} chunks · {d.byteLength} bytes
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => void removeDoc(d.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No documents indexed yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
