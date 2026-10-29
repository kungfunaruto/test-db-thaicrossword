// Shrinks photos in the browser before upload: faster uploads and much faster page loads for visitors.
export const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function compressImage(file: File, maxSide = 2000, quality = 0.85): Promise<Blob> {
  if (!IMG_TYPES.includes(file.type)) throw new Error('type');
  let bmp: ImageBitmap | null = null;
  try { bmp = await createImageBitmap(file); } catch { return file; }
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'); if (!ctx) return file;
  ctx.drawImage(bmp, 0, 0, w, h); bmp.close?.();
  const out = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', quality));
  // Keep the original if the browser cannot encode WebP or the result is not smaller.
  if (!out || out.type !== 'image/webp' || (scale === 1 && out.size >= file.size)) return file;
  return out;
}
export const extFor = (type: string) => (type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg');
