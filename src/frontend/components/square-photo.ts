/**
 * Shared by the photo uploaders (coach photos, class photos): photos are
 * stored as square JPEGs this many pixels across.
 */
export const PHOTO_SIZE = 512;

/** What to tell whoever is choosing a photo, wherever they choose one. */
export const PHOTO_HINT = `Square works best, at least ${PHOTO_SIZE} × ${PHOTO_SIZE} px (JPEG, PNG or WebP). Other shapes are cropped to the middle square.`;

/**
 * Centre-crops the picked image to a square and re-encodes it as a JPEG of at
 * most PHOTO_SIZE px, so a phone photo uploads as ~60 KB instead of several MB.
 */
export async function toSquareJpeg(file: File): Promise<Blob> {
  const src = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = src;
    await img.decode().catch(() => {
      throw new Error("That image couldn't be read. Try a JPEG or PNG.");
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const out = Math.min(PHOTO_SIZE, side);
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can't process photos.");
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      out,
      out,
    );

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("That image couldn't be read.")),
        "image/jpeg",
        0.85,
      ),
    );
  } finally {
    URL.revokeObjectURL(src);
  }
}

/** Storage path of a public photo URL in `bucket`, or null for anything else. */
export function storagePathOf(bucket: string, url: string | null): string | null {
  const marker = `/object/public/${bucket}/`;
  const i = url ? url.indexOf(marker) : -1;
  return url && i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}
