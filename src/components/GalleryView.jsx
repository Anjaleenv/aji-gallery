"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGalleryImagePaths } from "@/hooks/useGalleryImagePaths";

export function GalleryView() {
  const { images, loading, error, configured } = useGalleryImagePaths();
  const [grid, setGrid] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    setGrid(
      images.map((item, i) => ({
        id: item.publicId,
        publicId: item.publicId,
        url: item.url,
        workIndex: i,
      }))
    );
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
                  {/* eslint-disable-next-line @next/next/no-img-element -- dynamic gallery + lightbox src */}
                  <img
                    src={image.url}
                    alt={t("galleryWorkPhotoAlt", { n: image.workIndex + 1 })}
                    loading="lazy"
                  />
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
          >
            <X size={32} />
          </button>

          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            onClick={handlePrev}
          >
            <ChevronLeft size={48} />
          </button>

          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={grid[selectedIndex].url}
              alt={t("galleryWorkPhotoAlt", {
                n: grid[selectedIndex].workIndex + 1,
              })}
            />
          </div>

          <button
            type="button"
            className="lightbox-nav lightbox-next"
            onClick={handleNext}
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </>
  );
}
