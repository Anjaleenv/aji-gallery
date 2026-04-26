import { NextResponse } from "next/server";
import { isGalleryConfigured, listGalleryImages } from "@/lib/galleryServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!isGalleryConfigured()) {
    return NextResponse.json(
      { images: [], configured: false },
      { status: 200 }
    );
  }
  try {
    const images = await listGalleryImages();
    return NextResponse.json({ images, configured: true });
  } catch (e) {
    console.error("Gallery list error:", e);
    return NextResponse.json(
      { error: "Failed to list gallery" },
      { status: 500 }
    );
  }
}
