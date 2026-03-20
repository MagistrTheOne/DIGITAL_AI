/**
 * Downscale large photos client-side before upload (JPEG output).
 */
export async function resizeImageFileForAvatar(
  file: File,
  maxDim = 512,
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    let w = bitmap.width;
    let h = bitmap.height;
    if (w > maxDim || h > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.88);
    });
    if (!blob) throw new Error("Could not encode image");

    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
