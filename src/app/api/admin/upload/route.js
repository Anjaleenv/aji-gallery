import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isGalleryConfigured, uploadGalleryBuffer } from "@/lib/galleryServer";

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

  const form = await request.formData();
  const file = form.get("file");
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
    const result = await uploadGalleryBuffer(buffer, file.type);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("Gallery upload error:", e);
    return NextResponse.json(
      { error: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
