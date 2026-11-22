"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGalleryImagePaths } from "@/hooks/useGalleryImagePaths";

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
    const list = images.map((item, i) => ({
      id: item.publicId,
      publicId: item.publicId,
      url: item.url,
      workIndex: i,
      isVideo: checkIsVideo(item),
    }));

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
                    <div className="gallery-video-wrapper">
                      <video
                        src={image.url}
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="gallery-video-badge" aria-hidden="true">
                        <Play size={20} fill="currentColor" />
                      </div>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element -- dynamic gallery + lightbox src */
                    <img
                      src={image.url}
                      alt={t("galleryWorkPhotoAlt", { n: image.workIndex + 1 })}
                      loading="lazy"
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
              <video
                key={grid[selectedIndex].url}
                src={grid[selectedIndex].url}
                controls
                autoPlay
                playsInline
                className="lightbox-video"
              />
            ) : (
              <img
                src={grid[selectedIndex].url}
                alt={t("galleryWorkPhotoAlt", {
                  n: grid[selectedIndex].workIndex + 1,
                })}
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

