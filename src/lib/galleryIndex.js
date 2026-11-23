import { GALLERY_WORK_IMAGES } from "@/data/galleryWorkImages";

/**
 * Normalizes video URLs so HTML5 video players can stream them properly.
 * For Uploadcare CDN, bare UUID URLs are given /video.mp4 or /filename.mp4
 * to ensure Content-Type: video/mp4, Range request (206) support, and browser playback.
 * Strips accidental /public/ prefix so paths like /public/gallery/... resolve correctly.
 * @param {string} url
 * @param {string} [originalFilename]
 */
export function getVideoPlaybackUrl(url, originalFilename) {
  if (!url) return "";
  let clean = String(url).trim();
  if (clean.startsWith("/public/")) {
    clean = clean.replace(/^\/public\//, "/");
  }
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
 * Generates a thumbnail/poster image URL for videos.
 * - For Cloudinary: automatically derives the poster by replacing the video
 *   extension (.mp4, .mov, .webm) with .jpg and inserting /so_0/ to capture frame 0.
 * - For Uploadcare: utilizes the on-the-fly videoframe endpoint.
 * @param {string} url
 * @param {string} [publicId]
 */
export function getVideoPosterUrl(url, publicId) {
  if (!url) return "";
  let clean = String(url).trim();
  if (clean.startsWith("/public/")) {
    clean = clean.replace(/^\/public\//, "/");
  }

  // Cloudinary video poster derivation
  if (clean.includes("res.cloudinary.com") || clean.includes("cloudinary.com")) {
    let poster = clean.replace(/\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i, ".jpg$2");
    if (!poster.includes("/so_0") && poster.includes("/upload/")) {
      poster = poster.replace("/upload/", "/upload/so_0/");
    }
    return poster;
  }

  // Supabase storage video poster derivation
  if (
    clean.includes("supabase.co") ||
    clean.includes("supabase.in") ||
    clean.includes("supabase.com")
  ) {
    return clean.replace(/\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i, ".jpg$2");
  }

  // Uploadcare CDN video poster derivation
  if (clean.includes("ucarecdn.com")) {
    const m = clean.match(/([0-9a-f-]{36})/i);
    const uuid =
      m ? m[1] : publicId && /^[0-9a-f-]{36}$/i.test(publicId) ? publicId : null;
    if (uuid) {
      return `https://ucarecdn.com/${uuid}/videoframe/00:00:01/-/resize/800x/`;
    }
  }

  return "";
}

/**
 * Normalizes gallery image URLs, stripping accidental /public/ prefixes
 * and cleaning fragile suffixes to ensure images always load properly.
 * @param {string} url
 */
export function normalizeImageUrl(url) {
  if (!url) return "";
  let clean = String(url).trim();
  if (clean.startsWith("/public/")) {
    clean = clean.replace(/^\/public\//, "/");
  }
  // Canonical Uploadcare image endpoint
  if (clean.includes("ucarecdn.com")) {
    const m = clean.match(/ucarecdn\.com\/([0-9a-f-]{36})/i);
    if (m && !clean.includes("/-/")) {
      return `https://ucarecdn.com/${m[1]}/`;
    }
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
