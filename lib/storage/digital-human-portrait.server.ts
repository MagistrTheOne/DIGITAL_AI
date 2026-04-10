import { put } from "@vercel/blob";

const MAX_BYTES = 12 * 1024 * 1024;

/**
 * Persist OpenAI-generated reference portrait (public https URL for InfiniteTalk).
 */
export async function storeDigitalHumanPortraitPng(input: {
  userId: string;
  employeeId: string;
  png: Buffer;
}): Promise<{ url: string }> {
  if (input.png.length > MAX_BYTES) {
    throw new Error("Portrait image exceeds size limit");
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for auto digital-human portraits.");
  }

  const filename = `digital-human/${input.userId}/${input.employeeId}-ref.png`;
  const blob = await put(filename, input.png, {
    access: "public",
    token,
    contentType: "image/png",
    addRandomSuffix: true,
  });
  return { url: blob.url };
}
