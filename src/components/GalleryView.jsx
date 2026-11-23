"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGalleryImagePaths } from "@/hooks/useGalleryImagePaths";
import {
  getVideoPlaybackUrl,
  getVideoPosterUrl,
  normalizeImageUrl,
} from "@/lib/galleryIndex";
import { GALLERY_ITEMS } from "@/data/galleryWorkImages";

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

export function GalleryView() {
  const { images, loading, error, configured } = useGalleryImagePaths();
  const [filter, setFilter] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const { t } = useTranslation();

  const grid = useMemo(() => {
    const list = images.map((item, i) => {
      const isVideo = checkIsVideo(item);
      const rawUrl = isVideo
        ? getVideoPlaybackUrl(item.url, item.publicId)
        : normalizeImageUrl(item.url);
      const url =
        isVideo && !rawUrl.includes("#t=") ? `${rawUrl}#t=0.1` : rawUrl;
      return {
        id: item.publicId || item.id || String(i),
        publicId: item.publicId,
        url,
        workIndex: i,
        isVideo,
      };
    });

    if (filter === "photos") return list.filter((i) => !i.isVideo);
    if (filter === "videos") return list.filter((i) => i.isVideo);
    return list;
  }, [images, filter]);

  const counts = useMemo(() => {
    let photos = 0;
    let videos = 0;
    images.forEach((i) => {
      if (checkIsVideo(i)) videos += 1;
      else photos += 1;
    });
    return { all: images.length, photos, videos };
  }, [images]);

  const handlePrev = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setSelectedIndex((prev) => {
        if (prev === null) return null;
        return prev > 0 ? prev - 1 : grid.length - 1;
      });
    },
    [grid.length]
  );

  const handleNext = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      setSelectedIndex((prev) => {
        if (prev === null) return null;
        return prev < grid.length - 1 ? prev + 1 : 0;
      });
    },
    [grid.length]
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

  return (
    <>
      <header className="page-header">
        <div className="header-left">
          <span className="pill">{t("ourProjects")}</span>
          <h1>{t("projectGallery")}</h1>
        </div>
        <div className="header-right">
          <p>{t("galleryIntro")}</p>
        </div>
      </header>

      {counts.videos > 0 && (
        <div className="gallery-filters" role="tablist" aria-label="Media filter">
          <button
            type="button"
            className={`gallery-filter-btn ${filter === "all" ? "is-active" : ""}`}
            onClick={() => {
              setFilter("all");
              setSelectedIndex(null);
            }}
            role="tab"
            aria-selected={filter === "all"}
          >
            {t("filterAll") || "All"} ({counts.all})
          </button>
          <button
            type="button"
            className={`gallery-filter-btn ${filter === "photos" ? "is-active" : ""}`}
            onClick={() => {
              setFilter("photos");
              setSelectedIndex(null);
            }}
            role="tab"
            aria-selected={filter === "photos"}
          >
            {t("filterPhotos") || "Photos"} ({counts.photos})
          </button>
          <button
            type="button"
            className={`gallery-filter-btn ${filter === "videos" ? "is-active" : ""}`}
            onClick={() => {
              setFilter("videos");
              setSelectedIndex(null);
            }}
            role="tab"
            aria-selected={filter === "videos"}
          >
            {t("filterVideos") || "Videos"} ({counts.videos})
          </button>
        </div>
      )}

      <main>
        {loading && (
          <div
            className="home-gallery-preview--loading"
            style={{ minHeight: "14rem" }}
            aria-live="polite"
            aria-busy="true"
          />
        )}
        {!loading && error && (
          <div className="empty-state">
            <p role="alert">{error}</p>
          </div>
        )}
        {!loading && !error && !configured && grid.length === 0 && (
          <div className="empty-state">
            <p>Gallery is not available.</p>
          </div>
        )}
        {!loading && !error && grid.length === 0 && configured && (
          <div className="empty-state">
            <p>{t("noImages")}</p>
          </div>
        )}
        {!loading && grid.length > 0 && (
          <div className="gallery-grid">
            {grid.map((image, index) => {
              const patternIndex = index % 7;
              let itemClass = "gallery-item";

              if (patternIndex === 0) itemClass += " span-2 row-span-3";
              else if (patternIndex === 1) itemClass += " span-1 row-span-2";
              else if (patternIndex === 2) itemClass += " span-1 row-span-3";
              else if (patternIndex === 3) itemClass += " span-1 row-span-2";
              else if (patternIndex === 4) itemClass += " span-1 row-span-2";
              else if (patternIndex === 5) itemClass += " span-1 row-span-2";
              else if (patternIndex === 6) itemClass += " span-2 row-span-2";

              return (
                <div
                  key={image.id}
                  className={itemClass}
                  onClick={() => setSelectedIndex(index)}
                  style={{ cursor: "pointer" }}
                >
                  {image.isVideo ? (
                    <div
                      className="gallery-video-wrapper"
                      onMouseEnter={(e) => {
                        const v = e.currentTarget.querySelector("video");
                        if (v) v.play().catch(() => {});
                      }}
                      onMouseLeave={(e) => {
                        const v = e.currentTarget.querySelector("video");
                        if (v) {
                          v.pause();
                          try {
                            v.currentTime = 0.1;
                          } catch {}
                        }
                      }}
                    >
                      <video
                        src={image.url}
                        poster={
                          getVideoPosterUrl(image.url, image.publicId) || undefined
                        }
                        preload="metadata"
                        muted
                        playsInline
                        onLoadedMetadata={(e) => {
                          if (!getVideoPosterUrl(image.url, image.publicId)) {
                            try {
                              e.target.currentTime = 0.1;
                            } catch {}
                          }
                        }}
                      />
                      <div className="gallery-video-badge" aria-hidden="true">
                        <Play size={20} fill="currentColor" />
                      </div>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element -- dynamic gallery + lightbox src */
                    <img
                      src={image.url}
                      alt={t("galleryWorkPhotoAlt", {
                        n: filter === "all" ? image.workIndex + 1 : index + 1,
                      })}
                      loading="lazy"
                      onError={(e) => {
                        const current = e.currentTarget.src;
                        if (current.includes("/public/")) {
                          e.currentTarget.src = current.replace("/public/", "/");
                          return;
                        }
                        if (image.url.includes("ucarecdn.com")) {
                          const m = image.url.match(/([0-9a-f-]{36})/i);
                          if (m && current !== `https://ucarecdn.com/${m[1]}/`) {
                            e.currentTarget.src = `https://ucarecdn.com/${m[1]}/`;
                            return;
                          }
                        }
                        const fallback =
                          GALLERY_ITEMS[index % GALLERY_ITEMS.length]?.url ||
                          "/pic1.jpg";
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback.replace(/^\/public\//, "/");
                        }
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedIndex !== null && grid[selectedIndex] && (
        <div
          className="lightbox-overlay"
          onClick={() => setSelectedIndex(null)}
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
            {grid[selectedIndex].isVideo ? (
              <div className="lightbox-video-wrapper">
                <video
                  key={grid[selectedIndex].url}
                  controls
                  playsInline
                  autoPlay
                  preload="metadata"
                  className="lightbox-video"
                >
                  <source
                    src={
                      grid[selectedIndex].url.includes("#t=")
                        ? grid[selectedIndex].url
                        : `${grid[selectedIndex].url}#t=0.1`
                    }
                    type="video/mp4"
                  />
                  <source
                    src={
                      grid[selectedIndex].url.includes("#t=")
                        ? grid[selectedIndex].url
                        : `${grid[selectedIndex].url}#t=0.1`
                    }
                    type="video/webm"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <img
                src={normalizeImageUrl(grid[selectedIndex].url)}
                alt={t("galleryWorkPhotoAlt", {
                  n:
                    filter === "all"
                      ? grid[selectedIndex].workIndex + 1
                      : selectedIndex + 1,
                })}
                onError={(e) => {
                  const fallback =
                    GALLERY_ITEMS[
                      grid[selectedIndex].workIndex % GALLERY_ITEMS.length
                    ]?.url || "/pic1.jpg";
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback.replace(/^\/public\//, "/");
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

