import { uploadFile } from "@uploadcare/upload-client";
import {
  listOfFiles,
  paginate,
  deleteFile,
  fileInfo,
  storeFile,
  UploadcareSimpleAuthSchema,
} from "@uploadcare/rest-client";

/**
 * File metadata on Uploadcare — only files with this tag are shown in the gallery.
 * @see https://uploadcare.com/docs/file-metadata/
 */
/** Upload API form field; keep snake_case. */
const GALLERY_META = { aji_gallery: "1" };
const GALLERY_META_KEY = "aji_gallery";
/**
 * @uploadcare/rest-client camelizes API JSON: `metadata.aji_gallery` → `metadata.ajiGallery`
 * @see node_modules/@uploadcare/rest-client camelizeString
 */
const GALLERY_META_KEY_CAMEL = "ajiGallery";
const MAX_LIST_PAGES = 50;

/**
 * @param {Record<string, unknown> | null | undefined} metadata
 */
function galleryTagValue(metadata) {
  if (!metadata || typeof metadata !== "object") return undefined;
  if (GALLERY_META_KEY in metadata) {
    return /** @type {unknown} */ (metadata[GALLERY_META_KEY]);
  }
  if (GALLERY_META_KEY_CAMEL in metadata) {
    return /** @type {unknown} */ (metadata[GALLERY_META_KEY_CAMEL]);
  }
  return undefined;
}

/**
 * REST may return metadata values as string "1", number 1, or boolean true.
 * @param {Record<string, unknown> | null | undefined} metadata
 */
function hasGalleryTag(metadata) {
  const v = galleryTagValue(metadata);
  if (v === 1 || v === "1" || v === true) return true;
  if (v === 0 || v === "0" || v === false) return false;
  if (v === undefined || v === null) return false;
  return String(v).trim() === "1";
}

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * @param {string} name
 */
function trimEnv(name) {
  const v = process.env[name];
  if (v == null) return undefined;
  const t = String(v).replace(/^["']|["']$/g, "").trim();
  return t.length > 0 ? t : undefined;
}

function getPublicKey() {
  return (
    trimEnv("UPLOADCARE_PUBLIC_KEY") || trimEnv("UPLOADCARE_PUB_KEY")
  );
}

function getSecretKey() {
  return (
    trimEnv("UPLOADCARE_SECRET_KEY") ||
    trimEnv("UPLOADCARE_API_SECRET") ||
    trimEnv("UPLOADCARE_SECRET")
  );
}

function getKeys() {
  return {
    publicKey: getPublicKey(),
    secretKey: getSecretKey(),
  };
}

/**
 * @returns {{ configured: boolean, hasPublicKey: boolean, hasSecretKey: boolean }}
 */
export function getGalleryConfigState() {
  const { publicKey, secretKey } = getKeys();
  return {
    configured: Boolean(publicKey && secretKey),
    hasPublicKey: Boolean(publicKey),
    hasSecretKey: Boolean(secretKey),
  };
}

export function isGalleryConfigured() {
  return getGalleryConfigState().configured;
}

/** Errors where Uploadcare’s host cannot be reached (DNS, offline, firewall). */
const UPLOADCARE_CONNECTIVITY_CODES = new Set([
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "EAI_AGAIN",
]);

/**
 * True when listing/upload likely failed due to network/DNS, not bad keys or API semantics.
 * @param {unknown} error
 */
export function isUploadcareConnectivityError(error) {
  let e = error;
  for (let depth = 0; depth < 8 && e && typeof e === "object"; depth++) {
    const rec = /** @type {Record<string, unknown>} */ (e);
    const code = rec.code;
    const errno = rec.errno;
    if (typeof code === "string" && UPLOADCARE_CONNECTIVITY_CODES.has(code)) {
      return true;
    }
    if (typeof errno === "string" && UPLOADCARE_CONNECTIVITY_CODES.has(errno)) {
      return true;
    }
    e = rec.cause;
  }
  return false;
}

function getAuth() {
  const { publicKey, secretKey } = getKeys();
  return new UploadcareSimpleAuthSchema({ publicKey, secretKey });
}

function restSettings() {
  return { authSchema: getAuth() };
}

function extFromMime(mimeType) {
  if (!mimeType || typeof mimeType !== "string") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  if (mimeType === "image/avif") return ".avif";
  return ".jpg";
}

/**
 * Public CDN URL for a file uuid.
 * @param {string} [uuid]
 */
function cdnUrlForUuid(uuid) {
  if (!uuid || typeof uuid !== "string") return "";
  const id = uuid.trim();
  if (!id) return "";
  return `https://ucarecdn.com/${id}/`;
}

/**
 * Prefer the URL Uploadcare returns; otherwise build ucarecdn from uuid.
 * @param {import("@uploadcare/rest-client").FileInfo} f
 */
function deliveryUrlFromFile(f) {
  const orig = f.originalFileUrl;
  if (typeof orig === "string" && /^https?:\/\//.test(orig)) {
    return orig;
  }
  const u = f.url;
  if (typeof u === "string" && u.includes("ucarecdn.com")) {
    return u;
  }
  if (typeof u === "string" && u.includes("api.uploadcare.com")) {
    const m = u.match(/files\/([0-9a-f-]{36})/i);
    if (m) {
      return cdnUrlForUuid(m[1]);
    }
  }
  return cdnUrlForUuid(f.uuid);
}

/**
 * @returns {Promise<{ publicId: string, url: string, width?: number, height?: number, createdAt: string }[]>}
 */
export async function listGalleryImages() {
  if (!isGalleryConfigured()) return [];
  const settings = restSettings();
  const out = [];
  const pages = paginate(listOfFiles)(
    {
      limit: 100,
      ordering: "-datetime_uploaded",
      // Omit `stored` so we do not miss files that are not yet in long-term storage.
      // Removed is never returned as active in the same way, but we still check below.
    },
    settings
  );
  let n = 0;
  for await (const page of pages) {
    n += 1;
    for (const f of page.results) {
      const looksImage =
        f.isImage ||
        (typeof f.mimeType === "string" && f.mimeType.startsWith("image/"));
      if (
        !f.uuid ||
        !looksImage ||
        f.datetimeRemoved != null ||
        !hasGalleryTag(f.metadata)
      ) {
        continue;
      }
      // Unfinished uploads can 404 on the CDN until processing completes
      if (f.isReady === false) {
        continue;
      }
      const w = f.contentInfo?.image?.width;
      const h = f.contentInfo?.image?.height;
      const cdn = deliveryUrlFromFile(f);
      if (!cdn) continue;
      out.push({
        publicId: f.uuid,
        url: cdn,
        width: w,
        height: h,
        createdAt: f.datetimeUploaded,
      });
    }
    if (n >= MAX_LIST_PAGES) break;
  }
  out.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return out;
}

/**
 * @param {string} publicId
 */
export function isPublicIdInGalleryFolder(publicId) {
  return (
    typeof publicId === "string" && UUID_RE.test(publicId) && !publicId.includes("..")
  );
}

/**
 * @param {string} publicId
 */
async function assertGalleryFile(publicId) {
  if (!isPublicIdInGalleryFolder(publicId)) {
    throw new Error("Invalid public id");
  }
  const info = await fileInfo({ uuid: publicId }, restSettings());
  if (!hasGalleryTag(info.metadata)) {
    throw new Error("Invalid public id");
  }
}

/**
 * @param {Buffer} buffer
 * @param {string} [mimeType]
 */
export async function uploadGalleryBuffer(buffer, mimeType) {
  if (!isGalleryConfigured()) {
    return Promise.reject(new Error("Uploadcare is not configured"));
  }
  const { publicKey } = getKeys();
  const ext = extFromMime(mimeType);
  const fileName = `image${ext}`;
  const result = await uploadFile(buffer, {
    publicKey: publicKey ?? "",
    fileName,
    contentType: mimeType || "image/jpeg",
    store: true,
    metadata: GALLERY_META,
  });
  const settings = restSettings();
  /* Ensure the file is permanently stored so ucarecdn does not 404. */
  try {
    const info0 = await fileInfo({ uuid: result.uuid }, settings);
    if (!info0.datetimeStored) {
      await storeFile({ uuid: result.uuid }, settings);
    }
  } catch (e) {
    console.error("upload storeFile / fileInfo:", e);
  }
  let url = result.cdnUrl;
  try {
    const info1 = await fileInfo({ uuid: result.uuid }, settings);
    if (info1?.originalFileUrl && /^https?:\/\//.test(info1.originalFileUrl)) {
      url = info1.originalFileUrl;
    } else {
      const built = deliveryUrlFromFile(/** @type {any} */ (info1));
      if (built) url = built;
    }
  } catch (e) {
    console.error("upload delivery url from fileInfo:", e);
  }
  return {
    publicId: result.uuid,
    url,
  };
}

/**
 * Replaces the image: removes the old file, uploads a new one (new uuid).
 * @param {Buffer} buffer
 * @param {string} publicId
 * @param {string} [mimeType]
 */
export async function replaceGalleryImage(buffer, publicId, mimeType) {
  if (!isGalleryConfigured()) {
    return Promise.reject(new Error("Uploadcare is not configured"));
  }
  await assertGalleryFile(publicId);
  const created = await uploadGalleryBuffer(buffer, mimeType);
  try {
    await deleteFile({ uuid: publicId }, restSettings());
  } catch (e) {
    console.error("Replaced new upload; old file delete failed:", publicId, e);
  }
  return created;
}

/**
 * @param {string} publicId
 */
export async function deleteGalleryImage(publicId) {
  if (!isGalleryConfigured()) {
    throw new Error("Uploadcare is not configured");
  }
  await assertGalleryFile(publicId);
  const settings = restSettings();
  try {
    await deleteFile({ uuid: publicId }, settings);
  } catch (e) {
    if (e && typeof e === "object" && "status" in e && e.status === 404) {
      return { result: "not found" };
    }
    throw e;
  }
  return { result: "ok" };
}
