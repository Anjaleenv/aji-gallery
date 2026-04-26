import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getGalleryConfigState,
  isGalleryConfigured,
  listGalleryImages,
} from "@/lib/galleryServer";

const COOKIE = "admin_gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only list (same data as /api/gallery, requires auth cookie)
 */
export async function GET() {
  const c = await cookies();
  if (c.get(COOKIE)?.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isGalleryConfigured()) {
    const st = getGalleryConfigState();
    return NextResponse.json(
      {
        images: [],
        configured: false,
        uploadcare: {
          hasPublicKey: st.hasPublicKey,
          hasSecretKey: st.hasSecretKey,
        },
      },
      { status: 200 }
    );
  }
  try {
    const images = await listGalleryImages();
    return NextResponse.json({ images, configured: true });
  } catch (e) {
    console.error("Admin gallery list error:", e);
    return NextResponse.json(
      { error: "Failed to list gallery" },
      { status: 500 }
    );
  }
}
