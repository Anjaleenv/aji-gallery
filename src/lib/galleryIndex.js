import { GALLERY_WORK_IMAGES } from "@/data/galleryWorkImages";

/**
 * Normalizes video URLs so HTML5 video players can stream them properly.
 * For Uploadcare CDN, bare UUID URLs are given /video.mp4 or /filename.mp4
 * to ensure Content-Type: video/mp4, Range request (206) support, and browser playback.
 * @param {string} url
 * @param {string} [originalFilename]
 */
export function getVideoPlaybackUrl(url, originalFilename) {
  if (!url) return "";
  let clean = String(url).trim();
  if (clean.includes("ucarecdn.com")) {
    if (/\.(mp4|webm|mov)(\?.*)?$/i.test(clean)) {
      return clean;
    }
    const filename =
      originalFilename && /\.(mp4|webm|mov)$/i.test(originalFilename)
        ? encodeURIComponent(originalFilename)
        : "video.mp4";
    const base = clean.endsWith("/") ? clean : `${clean}/`;
    return `${base}${filename}`;
  }
  return clean;
}

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
