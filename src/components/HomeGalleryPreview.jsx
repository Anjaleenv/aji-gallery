"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Play, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  GALLERY_HOME_PREVIEW_COUNT,
  GALLERY_ITEMS,
} from "@/data/galleryWorkImages";
import { useGalleryImagePaths } from "@/hooks/useGalleryImagePaths";
import {
  getVideoPlaybackUrl,
  getVideoPosterUrl,
  normalizeImageUrl,
} from "@/lib/galleryIndex";

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

function VideoPreviewCard({ item, onClick }) {
  const videoRef = useRef(null);
  const playbackUrl = getVideoPlaybackUrl(item.url, item.publicId);
  const posterUrl = getVideoPosterUrl(item.url, item.publicId);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      try {
        videoRef.current.currentTime = 0.1;
      } catch {}
    }
  };

  return (
    <div
      className="home-gallery-preview-video-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      title="Click to play video"
      style={{ cursor: "pointer" }}
    >
      <video
        ref={videoRef}
        src={playbackUrl}
        poster={posterUrl || undefined}
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          if (!posterUrl) {
            try {
              e.target.currentTime = 0.1;
            } catch {}
          }
        }}
        className="home-gallery-preview-img"
      />
      <div className="gallery-video-badge" aria-hidden="true">
        <Play size={20} fill="currentColor" />
      </div>
    </div>
  );
}

function ImagePreviewCard({ item, index, alt, onClick }) {
  const [src, setSrc] = useState(() =>
    normalizeImageUrl(item?.url || item?.publicId || "")
  );
  const [attempt, setAttempt] = useState(0);

  const handleError = () => {
    if (attempt === 0) {
      // 1. Try stripping accidental /public/ prefix
      if (src.includes("/public/")) {
        setSrc(src.replace("/public/", "/"));
        setAttempt(1);
        return;
      }
      // 2. Try normalized canonical URL
      const cleanUrl = normalizeImageUrl(item?.url || item?.publicId || "");
      if (cleanUrl && src !== cleanUrl) {
        setSrc(cleanUrl);
        setAttempt(1);
        return;
      }
    }
    // Final fallback to curated local project photos
    const fallback =
      GALLERY_ITEMS[index % GALLERY_ITEMS.length]?.url || "/pic1.jpg";
    setSrc(fallback.replace(/^\/public\//, "/"));
    setAttempt(2);
  };

  return (
    <img
      src={src}
      alt={alt}
      onError={handleError}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      title="Click to view full image"
      className="home-gallery-preview-img"
      loading={index < 2 ? "eager" : "lazy"}
      decoding="async"
      style={{ cursor: "pointer" }}
    />
  );
}

export function HomeGalleryPreview() {
  const { t } = useTranslation();
  const { images, loading, configured, error } = useGalleryImagePaths();
  const preview = images.slice(0, GALLERY_HOME_PREVIEW_COUNT);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handlePrev = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setSelectedIndex((prev) => {
        if (prev === null) return null;
        return prev > 0 ? prev - 1 : preview.length - 1;
      });
    },
    [preview.length]
  );

  const handleNext = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setSelectedIndex((prev) => {
        if (prev === null) return null;
        return prev < preview.length - 1 ? prev + 1 : 0;
      });
    },
    [preview.length]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handleNext, handlePrev]);

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
    <>
      <div className="home-gallery-preview">
        <div className="gallery-grid" role="list">
          {preview.map((item, index) => {
            const isVideo = checkIsVideo(item);

            return (
              <div
                key={item.publicId || item.url || index}
                className={itemClassName(index)}
                role="listitem"
              >
                {isVideo ? (
                  <VideoPreviewCard
                    item={item}
                    onClick={() => setSelectedIndex(index)}
                  />
                ) : (
                  <ImagePreviewCard
                    item={item}
                    index={index}
                    alt={t("galleryWorkPhotoAlt", { n: index + 1 })}
                    onClick={() => setSelectedIndex(index)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedIndex !== null && preview[selectedIndex] && (
        <div
          className="lightbox-overlay"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setSelectedIndex(null)}
            aria-label="Close lightbox"
          >
            <X size={32} />
          </button>

          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            onClick={handlePrev}
            aria-label="Previous item"
          >
            <ChevronLeft size={48} />
          </button>

          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {checkIsVideo(preview[selectedIndex]) ? (
              <div className="lightbox-video-wrapper">
                <video
                  key={getVideoPlaybackUrl(
                    preview[selectedIndex].url,
                    preview[selectedIndex].publicId
                  )}
                  poster={
                    getVideoPosterUrl(
                      preview[selectedIndex].url,
                      preview[selectedIndex].publicId
                    ) || undefined
                  }
                  controls
                  playsInline
                  autoPlay
                  preload="metadata"
                  className="lightbox-video"
                >
                  <source
                    src={getVideoPlaybackUrl(
                      preview[selectedIndex].url,
                      preview[selectedIndex].publicId
                    )}
                    type="video/mp4"
                  />
                  <source
                    src={getVideoPlaybackUrl(
                      preview[selectedIndex].url,
                      preview[selectedIndex].publicId
                    )}
                    type="video/webm"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <img
                src={normalizeImageUrl(
                  preview[selectedIndex].url || preview[selectedIndex].publicId
                )}
                alt={t("galleryWorkPhotoAlt", {
                  n: selectedIndex + 1,
                })}
                onError={(e) => {
                  const fallback =
                    GALLERY_ITEMS[selectedIndex % GALLERY_ITEMS.length]?.url ||
                    "/pic1.jpg";
                  if (e.target.src !== fallback) {
                    e.target.src = fallback.replace(/^\/public\//, "/");
                  }
                }}
              />
            )}
          </div>

          <button
            type="button"
            className="lightbox-nav lightbox-next"
            onClick={handleNext}
            aria-label="Next item"
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </>
  );
}
