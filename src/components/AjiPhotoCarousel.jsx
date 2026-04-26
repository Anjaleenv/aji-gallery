"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

const SLIDES = [
  { src: "/pic1.jpg", altKey: "photoAltAji1" },
  { src: "/pic2.jpg", altKey: "photoAltAji2" },
];

const INTERVAL_MS = 5500;

export function AjiPhotoCarousel() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <aside
      className="aji-photo-carousel"
      aria-label={t("photoCarouselAria")}
      aria-roledescription="carousel"
    >
      <div className="aji-photo-carousel-frame">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`aji-photo-carousel-slide ${
              i === index ? "is-active" : ""
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt={t(slide.altKey)}
              fill
              sizes="(max-width: 900px) 100vw, 320px"
              className="aji-photo-carousel-img"
              priority={i === 0}
              draggable={false}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
