"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

const hashPaths = {
  home: "/#home",
  about: "/#about",
  gallery: "/#gallery",
  contact: "/#contact",
};

export function SiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-card">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <p className="site-footer-founder">{t("footerFounderName")}</p>
            <p className="site-footer-company">{t("navBrand")}</p>
            <p className="site-footer-tag">{t("footerTagline")}</p>
          </div>
          <nav className="site-footer-nav" aria-label="Footer">
            <Link href={hashPaths.home}>{t("navHome")}</Link>
            <Link href={hashPaths.about}>{t("navAbout")}</Link>
            <Link href={hashPaths.gallery}>{t("navGallery")}</Link>
            <Link href={hashPaths.contact}>{t("navContact")}</Link>
          </nav>
          <p className="site-footer-cta">
            <Link href="/gallery" className="site-footer-link">
              {t("viewOurWork")} →
            </Link>
          </p>
          <p className="site-footer-copy">
            {t("footerCopyright", { year: String(year) })}
          </p>
        </div>
      </div>
    </footer>
  );
}
