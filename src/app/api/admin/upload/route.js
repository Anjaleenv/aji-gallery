import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  isGalleryConfigured,
  uploadGalleryBuffer,
  finalizeGalleryUpload,
  getPublicKey,
} from "@/lib/galleryServer";

export const runtime = "nodejs";
export const maxDuration = 60;

const COOKIE = "admin_gallery";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

// 50 MB limit (exceeds requirement of "at least 30 MB")
const MAX_SIZE_BYTES = 50 * 1024 * 1024;

export async function GET() {
  const all = await cookies();
  if (all.get(COOKIE)?.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    publicKey: getPublicKey() || "",
    maxSizeBytes: MAX_SIZE_BYTES,
    allowedMimeTypes: Array.from(ALLOWED),
  });
}

export async function POST(request) {
  const all = await cookies();
  if (all.get(COOKIE)?.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isGalleryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Uploadcare is not configured. Set UPLOADCARE_PUBLIC_KEY and UPLOADCARE_SECRET_KEY in the server environment.",
      },
      { status: 503 }
    );
  }

  const contentType = request.headers.get("content-type") || "";

  // 1. Direct upload from browser to Uploadcare: client sends JSON { uuid, name }
  // This bypasses Vercel serverless 4.5 MB request payload limits for 30+ MB videos.
  if (contentType.includes("application/json")) {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { uuid } = body;
    if (!uuid || typeof uuid !== "string") {
      return NextResponse.json({ error: "Missing uuid" }, { status: 400 });
    }

    try {
      const result = await finalizeGalleryUpload(uuid);
      if (result.size && result.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File too large (max 50 MB)" },
          { status: 413 }
        );
      }
      if (
        result.mimeType &&
        !ALLOWED.has(result.mimeType) &&
        !/\.(mp4|webm|mov)$/i.test(result.url || "")
      ) {
        return NextResponse.json(
          {
            error:
              "Only JPEG, PNG, WebP, GIF, AVIF images and MP4, WebM, MOV videos are allowed",
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true, ...result });
    } catch (e) {
      console.error("Gallery upload finalize error:", e);
      return NextResponse.json(
        { error: e?.message || "Upload finalize failed" },
        { status: 500 }
      );
    }
  }

  // 2. Fallback: multipart/form-data upload
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 50 MB)" },
      { status: 413 }
    );
  }

  const isVideoExt = /\.(mp4|webm|mov)$/i.test(file.name || "");
  if (!ALLOWED.has(file.type) && !isVideoExt) {
    return NextResponse.json(
      {
        error:
          "Only JPEG, PNG, WebP, GIF, AVIF images and MP4, WebM, MOV videos are allowed",
      },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await uploadGalleryBuffer(buffer, file.type, file.name);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("Gallery upload error:", e);
    return NextResponse.json(
      { error: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
