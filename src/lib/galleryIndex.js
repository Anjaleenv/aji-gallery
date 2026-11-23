import { GALLERY_WORK_IMAGES } from "@/data/galleryWorkImages";

const UUID_REGEX =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

/**
 * Resolves the Uploadcare CDN domain from environment variables,
 * supporting default 'ucarecdn.com' and custom domains ('*.ucarecd.net').
 */
export function getUploadcareCdnDomain() {
  const envVal =
    (typeof process !== "undefined" && process?.env
      ? process.env.NEXT_PUBLIC_UPLOADCARE_CDN_BASE ||
        process.env.UPLOADCARE_CDN_BASE ||
        process.env.NEXT_PUBLIC_UPLOADCARE_CDN_DOMAIN ||
        process.env.UPLOADCARE_CDN_DOMAIN
      : undefined) || "";
  const cleaned = envVal.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return cleaned || "ucarecdn.com";
}

/**
 * Normalizes video URLs so HTML5 video players can stream them properly.
 * For Uploadcare CDN, bare UUIDs and URLs are normalized to clean
 * `https://<cdn-domain>/<uuid>/#t=0.1` without any image transformation paths
 * (such as /-/preview/ or /-/resize/) that cause 400/404 errors.
 * Strips accidental /public/ prefix so paths like /public/gallery/... resolve correctly.
 * Appends `#t=0.1` so browsers render the first frame immediately.
 * @param {string} url
 * @param {string} [originalFilenameOrPublicId]
 */
export function getVideoPlaybackUrl(url, originalFilenameOrPublicId) {
  if (!url) return "";
  let clean = String(url).trim();
  if (clean.startsWith("/public/")) {
    clean = clean.replace(/^\/public\//, "/");
  }

  const isUploadcareDomain =
    clean.includes("ucarecdn.com") || clean.includes("ucarecd.net");
  const uuidMatch =
    clean.match(UUID_REGEX) ||
    (originalFilenameOrPublicId &&
      String(originalFilenameOrPublicId).match(UUID_REGEX));

  if (isUploadcareDomain || uuidMatch) {
    let domain = getUploadcareCdnDomain();
    const hostMatch = clean.match(/^https?:\/\/([^/]+)/);
    if (
      hostMatch &&
      (hostMatch[1].endsWith("ucarecdn.com") ||
        hostMatch[1].endsWith("ucarecd.net"))
    ) {
      domain = hostMatch[1];
    }

    if (uuidMatch) {
      const uuid = uuidMatch[0];
      return `https://${domain}/${uuid}/#t=0.1`;
    }

    // Strip any image transformation paths (/-/preview/, /-/resize/, etc.)
    let stripped = clean.replace(/\/-\/[^/]+\/?/g, "/");
    if (!stripped.includes("#t=")) {
      stripped = stripped.endsWith("/")
        ? `${stripped}#t=0.1`
        : `${stripped}/#t=0.1`;
    }
    return stripped;
  }

  if (!clean.includes("#t=")) {
    return `${clean}#t=0.1`;
  }
  return clean;
}

/**
 * Generates a thumbnail/poster image URL for videos.
 * - For Cloudinary: automatically derives the poster by replacing the video
 *   extension (.mp4, .mov, .webm) with .jpg and inserting /so_0/ to capture frame 0.
 * - For Supabase: replaces video extension with .jpg.
 * - For Uploadcare: avoids appending non-existent /videoframe/ or /-/ image transformation
 *   paths that fail on free/standard plans; HTML5 video renders frame 0.1 via preload="metadata".
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

  return "";
}

/**
 * Normalizes gallery image URLs, resolving bare UUIDs, stripping accidental /public/
 * prefixes, removing fragile /-/ transformations from raw endpoints, and ensuring
 * canonical CDN URLs for both ucarecdn.com and custom *.ucarecd.net domains.
 * @param {string} url
 */
export function normalizeImageUrl(url) {
  if (!url) return "";
  let clean = String(url).trim();
  if (clean.startsWith("/public/")) {
    clean = clean.replace(/^\/public\//, "/");
  }

  // Bare UUID (e.g. 3a98f495-74ae-49c7-9250-183edc6982fc)
  if (UUID_REGEX.test(clean) && !clean.includes("/")) {
    const domain = getUploadcareCdnDomain();
    return `https://${domain}/${clean}/`;
  }

  const isUploadcareDomain =
    clean.includes("ucarecdn.com") || clean.includes("ucarecd.net");

  if (isUploadcareDomain) {
    let domain = getUploadcareCdnDomain();
    const hostMatch = clean.match(/^https?:\/\/([^/]+)/);
    if (
      hostMatch &&
      (hostMatch[1].endsWith("ucarecdn.com") ||
        hostMatch[1].endsWith("ucarecd.net"))
    ) {
      domain = hostMatch[1];
    }
    const uuidMatch = clean.match(UUID_REGEX);
    if (uuidMatch) {
      return `https://${domain}/${uuidMatch[0]}/`;
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
