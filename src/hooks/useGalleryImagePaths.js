"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

const API = "/api/gallery";

/**
 * @typedef {{ publicId: string, url: string, width?: number, height?: number, createdAt?: string }} GalleryImage
 */

export function useGalleryImagePaths() {
  const [images, setImages] = useState(/** @type {GalleryImage[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [configured, setConfigured] = useState(true);
  const [bump, setBump] = useState(0);

  const refresh = useCallback(() => {
    setBump((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(API, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Failed to load gallery");
          setImages([]);
          return;
        }
        setImages(Array.isArray(data.images) ? data.images : []);
        setConfigured(data.configured !== false);
        if (data.configured === false) {
          setError(null);
        } else if (data.upstreamUnavailable) {
          setError("Gallery is temporarily unavailable.");
        }
      } catch (e) {
        if (!cancelled) {
          setError("Failed to load gallery");
          setImages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bump]);

  const paths = useMemo(
    () => images.map((img) => img.url),
    [images]
  );

  return { images, paths, loading, error, configured, refresh };
}
