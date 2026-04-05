import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session.server";
import { chunkPlainText } from "@/lib/knowledge/chunk-text.server";
import { embedTextChunks } from "@/lib/knowledge/embed.server";
import { getEmployeeRowById } from "@/services/db/repositories/employees.repository";
import {
  insertKnowledgeDocumentWithChunks,
  listKnowledgeDocumentsForEmployee,
} from "@/services/db/repositories/knowledge.repository";

const MAX_TEXT = 400_000;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ employeeId: string }> },
) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await ctx.params;
  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const documents = await listKnowledgeDocumentsForEmployee(userId, employeeId);
  return NextResponse.json({ documents });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ employeeId: string }> },
) {
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await ctx.params;
  const row = await getEmployeeRowById(employeeId, userId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as null | {
    text?: string;
    label?: string;
  };

  const text = typeof body?.text === "string" ? body.text : "";
  const label =
    typeof body?.label === "string" && body.label.trim()
      ? body.label.trim().slice(0, 512)
      : "Pasted text";

  if (!text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const slice = text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) : text;
  const chunks = chunkPlainText(slice);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "No indexable content" }, { status: 400 });
  }

  let embeddings: number[][];
  try {
    embeddings = await embedTextChunks(chunks);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "embed_failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (embeddings.length !== chunks.length) {
    return NextResponse.json({ error: "embedding_count_mismatch" }, { status: 502 });
  }

  const rows = chunks.map((content, i) => ({
    content,
    embedding: embeddings[i]!,
    metadata: { chunkIndex: i, sourceLabel: label },
  }));

  try {
    const doc = await insertKnowledgeDocumentWithChunks({
      userId,
      employeeId,
      sourceLabel: label,
      mime: "text/plain",
      byteLength: Buffer.byteLength(slice, "utf8"),
      chunks: rows,
    });
    return NextResponse.json({ document: doc });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "insert_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
