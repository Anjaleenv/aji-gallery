import { GALLERY_WORK_IMAGES } from "@/data/galleryWorkImages";

/**
 * @deprecated Use GET /api/gallery from the client. Kept for any legacy import.
 */
export function filenamesToPublicPaths(filenames) {
  return (filenames ?? []).map((name) => `/gallery/${encodeURI(name)}`);
}

export const FALLBACK_GALLERY_FILENAMES = [];

export async function fetchGalleryPaths() {
  try {
    const res = await fetch("/api/gallery", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && Array.isArray(data.images) && data.images.length > 0) {
      return data.images.map((i) => i.url);
    }
  } catch {
    /* use fallback */
  }
  return GALLERY_WORK_IMAGES;
}
