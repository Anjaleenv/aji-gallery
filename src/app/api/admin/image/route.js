import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  isGalleryConfigured,
  isPublicIdInGalleryFolder,
  deleteGalleryImage,
  replaceGalleryImage,
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
]);

const MAX_SIZE_BYTES = 12 * 1024 * 1024;

export async function DELETE(request) {
  const all = await cookies();
  if (all.get(COOKIE)?.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isGalleryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Uploadcare is not configured. Set UPLOADCARE_PUBLIC_KEY and UPLOADCARE_SECRET_KEY.",
      },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { publicId } = body;
  if (!isPublicIdInGalleryFolder(publicId)) {
    return NextResponse.json({ error: "Invalid public id" }, { status: 400 });
  }

  try {
    await deleteGalleryImage(publicId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Gallery delete error:", e);
    return NextResponse.json(
      { error: e?.message || "Delete failed" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const c = await cookies();
  if (c.get(COOKIE)?.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isGalleryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Uploadcare is not configured. Set UPLOADCARE_PUBLIC_KEY and UPLOADCARE_SECRET_KEY.",
      },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  const publicId = form.get("publicId");
  if (typeof publicId !== "string" || !isPublicIdInGalleryFolder(publicId)) {
    return NextResponse.json({ error: "Invalid publicId" }, { status: 400 });
  }
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 12 MB)" },
      { status: 413 }
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, GIF, and AVIF images are allowed" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await replaceGalleryImage(buffer, publicId, file.type);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("Gallery replace error:", e);
    return NextResponse.json(
      { error: e?.message || "Replace failed" },
      { status: 500 }
    );
  }
}
