import { NextResponse } from "next/server";
import {
  isGalleryConfigured,
  isUploadcareConnectivityError,
  listGalleryImages,
} from "@/lib/galleryServer";
import { GALLERY_WORK_IMAGES } from "@/data/galleryWorkImages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!isGalleryConfigured()) {
    return NextResponse.json(
      { images: GALLERY_WORK_IMAGES, configured: true, fallback: true },
      { status: 200 }
    );
  }
  try {
    const images = await listGalleryImages();
    if (images.length === 0 && GALLERY_WORK_IMAGES.length > 0) {
      return NextResponse.json({
        images: GALLERY_WORK_IMAGES,
        configured: true,
        fallback: true,
      });
    }
    return NextResponse.json({ images, configured: true });
  } catch (e) {
    console.error("Gallery list error:", e);
    if (GALLERY_WORK_IMAGES.length > 0) {
      return NextResponse.json({
        images: GALLERY_WORK_IMAGES,
        configured: true,
        upstreamUnavailable: true,
        fallback: true,
      });
    }
    if (isUploadcareConnectivityError(e)) {
      return NextResponse.json({
        images: [],
        configured: true,
        upstreamUnavailable: true,
      });
    }
    return NextResponse.json(
      { error: "Failed to list gallery" },
      { status: 500 }
    );
  }
}
