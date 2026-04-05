import { randomUUID } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { knowledgeChunk, knowledgeDocument } from "@/db/schema";

export type KnowledgeDocumentPublic = {
  id: string;
  sourceLabel: string;
  mime: string;
  byteLength: number;
  chunkCount: number;
  createdAt: Date;
};

export async function listKnowledgeDocumentsForEmployee(
  userId: string,
  employeeId: string,
): Promise<KnowledgeDocumentPublic[]> {
  const rows = await db
    .select({
      id: knowledgeDocument.id,
      sourceLabel: knowledgeDocument.sourceLabel,
      mime: knowledgeDocument.mime,
      byteLength: knowledgeDocument.byteLength,
      chunkCount: knowledgeDocument.chunkCount,
      createdAt: knowledgeDocument.createdAt,
    })
    .from(knowledgeDocument)
    .where(
      and(
        eq(knowledgeDocument.userId, userId),
        eq(knowledgeDocument.employeeId, employeeId),
      ),
    )
    .orderBy(desc(knowledgeDocument.createdAt));
  return rows;
}

export async function insertKnowledgeDocumentWithChunks(input: {
  userId: string;
  employeeId: string;
  sourceLabel: string;
  mime: string;
  byteLength: number;
  chunks: { content: string; embedding: number[]; metadata: Record<string, unknown> }[];
}): Promise<KnowledgeDocumentPublic> {
  if (input.chunks.length === 0) {
    throw new Error("no_chunks");
  }

  const docId = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(knowledgeDocument).values({
      id: docId,
      userId: input.userId,
      employeeId: input.employeeId,
      sourceLabel: input.sourceLabel.slice(0, 512),
      mime: input.mime.slice(0, 128),
      byteLength: input.byteLength,
      chunkCount: input.chunks.length,
      createdAt: now,
    });

    for (let i = 0; i < input.chunks.length; i++) {
      const ch = input.chunks[i]!;
      await tx.insert(knowledgeChunk).values({
        id: randomUUID(),
        documentId: docId,
        userId: input.userId,
        employeeId: input.employeeId,
        chunkIndex: i,
        content: ch.content,
        metadata: ch.metadata,
        embedding: ch.embedding,
      });
    }
  });

  return {
    id: docId,
    sourceLabel: input.sourceLabel.slice(0, 512),
    mime: input.mime,
    byteLength: input.byteLength,
    chunkCount: input.chunks.length,
    createdAt: now,
  };
}

export async function deleteKnowledgeDocumentForOwner(
  userId: string,
  employeeId: string,
  documentId: string,
): Promise<boolean> {
  const res = await db
    .delete(knowledgeDocument)
    .where(
      and(
        eq(knowledgeDocument.id, documentId),
        eq(knowledgeDocument.userId, userId),
        eq(knowledgeDocument.employeeId, employeeId),
      ),
    )
    .returning({ id: knowledgeDocument.id });
  return res.length > 0;
}

export type KnowledgeSearchHit = {
  content: string;
  metadata: Record<string, unknown>;
  distance: number;
};

/**
 * Cosine distance via pgvector `<=>` (lower is closer for cosine ops on normalized embeddings).
 */
export async function searchKnowledgeChunks(
  userId: string,
  employeeId: string,
  queryEmbedding: number[],
  topK: number,
): Promise<KnowledgeSearchHit[]> {
  const k = Math.min(20, Math.max(1, Math.floor(topK)));
  const vecJson = JSON.stringify(queryEmbedding);

  const rows = await db
    .select({
      content: knowledgeChunk.content,
      metadata: knowledgeChunk.metadata,
      distance: sql<number>`${knowledgeChunk.embedding} <=> ${sql.raw(`'${vecJson}'::vector`)}`,
    })
    .from(knowledgeChunk)
    .where(
      and(
        eq(knowledgeChunk.userId, userId),
        eq(knowledgeChunk.employeeId, employeeId),
      ),
    )
    .orderBy(sql`${knowledgeChunk.embedding} <=> ${sql.raw(`'${vecJson}'::vector`)}`)
    .limit(k);

  return rows.map((r) => ({
    content: r.content,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
    distance: r.distance,
  }));
}
