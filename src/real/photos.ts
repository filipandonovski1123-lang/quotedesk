/** Shrinks a phone photo to a small JPEG data URL (under ~300 KB) so it fits in the database. */
export async function compressPhoto(file: File, maxSide = 1280): Promise<string> {
  const bitmap = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Photos aren’t supported in this browser.');
  ctx.drawImage(bitmap, 0, 0, w, h);
  for (const q of [0.7, 0.55, 0.4, 0.3]) {
    const url = canvas.toDataURL('image/jpeg', q);
    if (url.length < 300_000) return url;
  }
  return compressPhoto(file, Math.round(maxSide * 0.7));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => (URL.revokeObjectURL(url), resolve(img));
    img.onerror = () => (URL.revokeObjectURL(url), reject(new Error('That file isn’t a photo we can read.')));
    img.src = url;
  });
}
