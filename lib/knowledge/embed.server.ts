import OpenAI from "openai";

const MODEL = "text-embedding-3-small";
const DIMENSIONS = 1536;

export function embeddingDimensions(): number {
  return DIMENSIONS;
}

export async function embedTextChunks(chunks: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (chunks.length === 0) return [];

  const client = new OpenAI({ apiKey });
  const inputs = chunks.map((c) => (c.length > 30_000 ? c.slice(0, 30_000) : c));

  const res = await client.embeddings.create({
    model: MODEL,
    input: inputs,
    dimensions: DIMENSIONS,
  });

  const out: number[][] = [];
  const byIndex = new Map<number, number[]>();
  for (const item of res.data) {
    byIndex.set(item.index, item.embedding);
  }
  for (let i = 0; i < inputs.length; i++) {
    const emb = byIndex.get(i);
    if (!emb || emb.length !== DIMENSIONS) {
      throw new Error("embedding_response_mismatch");
    }
    out.push(emb);
  }
  return out;
}

export async function embedSingleQuery(text: string): Promise<number[]> {
  const [row] = await embedTextChunks([text]);
  return row ?? [];
}
