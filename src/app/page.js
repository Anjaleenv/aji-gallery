"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { HomeGalleryPreview } from "@/components/HomeGalleryPreview";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="home-landing">
      <section
        id="home"
        className="home-section home-hero"
        aria-label={t("navHome")}
      >
        <div className="page-content home-content">
          <span className="pill">{t("welcome")}</span>
          <h1 className="page-title">{t("homeTitle")}</h1>
          <p className="page-desc">{t("homeDesc")}</p>
          <div className="home-hero-actions">
            <Link href="/#about" className="upload-btn upload-btn--ghost">
              {t("aboutUs")}
            </Link>
            <Link href="/gallery" className="upload-btn">
              {t("viewOurWork")}
            </Link>
          </div>
        </div>
      </section>

      <section id="about" className="home-section" aria-label={t("aboutUs")}>
        <AboutSection
          className="home-section-inner"
          showProfileFigure={false}
        />
      </section>

      <section
        id="gallery"
        className="home-section home-section-gallery"
        aria-labelledby="gallery-section-title"
      >
        <div className="home-gallery-section-inner">
          <div className="page-content home-gallery-section-intro">
            <span className="pill">{t("ourProjects")}</span>
            <h2
              id="gallery-section-title"
              className="page-title section-heading"
            >
              {t("projectGallery")}
            </h2>
            <p className="page-desc">{t("galleryIntro")}</p>
          </div>
          <HomeGalleryPreview />
          <div className="page-content home-gallery-section-cta">
            <Link href="/gallery" className="upload-btn">
              {t("viewOurWork")}
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="home-section home-section-contact">
        <ContactSection
          nameId="homeContactName"
          emailId="homeContactEmail"
          projectId="homeContactProject"
          buttonId="homeContactSend"
        />
      </section>
    </div>
  );
}
