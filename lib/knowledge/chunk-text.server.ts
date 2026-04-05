const DEFAULT_MAX_CHARS = 1_800;
const DEFAULT_OVERLAP = 200;

/**
 * Split plain text into overlapping chunks for embedding (character-based MVP).
 */
export function chunkPlainText(
  text: string,
  maxChars: number = DEFAULT_MAX_CHARS,
  overlap: number = DEFAULT_OVERLAP,
): string[] {
  const t = text.replace(/\r\n/g, "\n").trim();
  if (!t) return [];

  const paragraphs = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const pieces: string[] = [];
  let buf = "";

  const flush = () => {
    const s = buf.trim();
    if (s.length) pieces.push(s);
    buf = "";
  };

  for (const para of paragraphs) {
    if (buf.length + para.length + 2 <= maxChars) {
      buf = buf ? `${buf}\n\n${para}` : para;
      continue;
    }
    if (buf) flush();
    if (para.length <= maxChars) {
      buf = para;
      continue;
    }
    for (let i = 0; i < para.length; i += maxChars - overlap) {
      pieces.push(para.slice(i, i + maxChars));
    }
  }
  flush();

  return pieces;
}
