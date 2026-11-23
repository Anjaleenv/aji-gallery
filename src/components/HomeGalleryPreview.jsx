"use client";

import { useTranslation } from "react-i18next";
import { Play } from "lucide-react";
import { GALLERY_HOME_PREVIEW_COUNT } from "@/data/galleryWorkImages";
import { useGalleryImagePaths } from "@/hooks/useGalleryImagePaths";
import { getVideoPlaybackUrl } from "@/lib/galleryIndex";

function checkIsVideo(item) {
  if (!item) return false;
  if (item.isVideo === true) return true;
  const url = String(item.url || "").toLowerCase();
  const pid = String(item.publicId || item.id || "").toLowerCase();
  return (
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".mov") ||
    url.includes(".mp4") ||
    url.includes(".webm") ||
    url.includes(".mov") ||
    pid.endsWith(".mp4") ||
    pid.endsWith(".webm") ||
    pid.endsWith(".mov") ||
    Boolean(item.mimeType?.startsWith("video/"))
  );
}

function itemClassName(index) {
  const patternIndex = index % 7;
  let itemClass = "gallery-item home-gallery-preview-item";
  if (patternIndex === 0) itemClass += " span-2 row-span-3";
  else if (patternIndex === 1) itemClass += " span-1 row-span-2";
  else if (patternIndex === 2) itemClass += " span-1 row-span-3";
  else if (patternIndex === 3) itemClass += " span-1 row-span-2";
  else if (patternIndex === 4) itemClass += " span-1 row-span-2";
  else if (patternIndex === 5) itemClass += " span-1 row-span-2";
  else if (patternIndex === 6) itemClass += " span-2 row-span-2";
  return itemClass;
}

export function HomeGalleryPreview() {
  const { t } = useTranslation();
  const { images, loading, configured, error } = useGalleryImagePaths();
  const preview = images.slice(0, GALLERY_HOME_PREVIEW_COUNT);

  if (loading) {
    return (
      <div
        className="home-gallery-preview home-gallery-preview--loading"
        aria-busy="true"
        aria-label={t("ourProjects")}
      />
    );
  }

  if (error && preview.length === 0) {
    return null;
  }

  if (!configured && preview.length === 0) {
    return null;
  }

  if (preview.length === 0) {
    return null;
  }

  return (
    <div className="home-gallery-preview">
      <div className="gallery-grid" role="list">
        {preview.map((item, index) => {
          const isVideo = checkIsVideo(item);

          return (
            <div
              key={item.publicId}
              className={itemClassName(index)}
              role="listitem"
            >
              {isVideo ? (
                <div className="home-gallery-preview-video-wrapper">
                  <video
                    src={getVideoPlaybackUrl(item.url, item.publicId)}
                    muted
                    playsInline
                    preload="metadata"
                    className="home-gallery-preview-img"
                  />
                  <div className="gallery-video-badge" aria-hidden="true">
                    <Play size={18} fill="currentColor" />
                  </div>
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={t("galleryWorkPhotoAlt", { n: index + 1 })}
                  className="home-gallery-preview-img"
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

