"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Check,
  Languages,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AjiPhotoCarousel } from "@/components/AjiPhotoCarousel";
import { SiteFooter } from "@/components/SiteFooter";

const paths = {
  home: "/#home",
  about: "/#about",
  gallery: "/#gallery",
  contact: "/#contact",
};

export function SiteLayout({ children }) {
  const pathname = usePathname();
  const [sectionHash, setSectionHash] = useState("");
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const languageMenuRef = useRef(null);
  const topNavRef = useRef(null);
  const headerBlockRef = useRef(null);
  const lastScrollY = useRef(0);

  const [headerVisible, setHeaderVisible] = useState(true);
  /** Until ResizeObserver runs, keep rough space so content does not sit under the fixed bar. */
  const [headerBlockHeight, setHeaderBlockHeight] = useState(80);

  const isGalleryPage = pathname === "/gallery";
  const isAdminPage = pathname === "/admin";
  const isSingleColumnNoCarousel = isGalleryPage || isAdminPage;

  /** Spacer + fixed header: keep layout stable while nav slides. Mobile menu open = always show bar. */
  const showHeader = isNavOpen || headerVisible;

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsLanguageMenuOpen(false);
  };

  const languageOptions = [
    { code: "en", label: t("languageEnglish") },
    { code: "ml", label: t("languageMalayalam") },
    { code: "hi", label: t("languageHindi") },
  ];

  useEffect(() => {
    const syncHash = () => {
      if (typeof window === "undefined") return;
      setSectionHash(window.location.hash);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  const currentLanguage = i18n.resolvedLanguage || i18n.language || "en";
  const currentLanguageLabel =
    languageOptions.find((option) => option.code === currentLanguage)?.label ||
    t("languageEnglish");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target)
      ) {
        setIsLanguageMenuOpen(false);
      }
      if (
        isNavOpen &&
        topNavRef.current &&
        !topNavRef.current.contains(event.target)
      ) {
        setIsNavOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsLanguageMenuOpen(false);
        setIsNavOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNavOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const clearNav = () => {
      if (mq.matches) setIsNavOpen(false);
    };
    mq.addEventListener("change", clearNav);
    return () => mq.removeEventListener("change", clearNav);
  }, []);

  useEffect(() => {
    if (isNavOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isNavOpen]);

  useLayoutEffect(() => {
    const el = headerBlockRef.current;
    if (!el) return;
    const update = () => {
      setHeaderBlockHeight(el.getBoundingClientRect().height);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pathname, isNavOpen]);

  useEffect(() => {
    lastScrollY.current =
      typeof window === "undefined" ? 0 : window.scrollY;
    setHeaderVisible(true);
  }, [pathname]);

  useEffect(() => {
    if (isNavOpen) return;
    const topRevealPx = 56;
    const minDelta = 6;

    const onScroll = () => {
      const y = window.scrollY;
      const prev = lastScrollY.current;
      const delta = y - prev;

      if (y < topRevealPx) {
        setHeaderVisible(true);
      } else if (Math.abs(delta) < minDelta) {
        // ignore tiny scroll jitter
      } else if (delta > 0) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }

      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isNavOpen, pathname]);

  const isActive = (key) => {
    const h = sectionHash;
    if (key === "home") {
      return pathname === "/" && (h === "" || h === "#home");
    }
    if (key === "about")
      return pathname === "/about" || (pathname === "/" && h === "#about");
    if (key === "gallery")
      return (
        pathname === "/gallery" || (pathname === "/" && h === "#gallery")
      );
    if (key === "contact")
      return pathname === "/contact" || (pathname === "/" && h === "#contact");
    return false;
  };

  return (
    <div className="app-page">
      <div
        className="site-header-spacer"
        style={{ height: showHeader ? headerBlockHeight : 0 }}
        aria-hidden="true"
      />
      <header
        className={`site-header-bar${showHeader ? " site-header-bar--visible" : " site-header-bar--hidden"}`}
        ref={topNavRef}
      >
        <div className="site-header-bar-track" ref={headerBlockRef}>
        <div className="site-header-wrap site-header-wrap--in-bar">
        <nav className="top-nav" aria-label="Main">
          <div className="nav-left">
            <Link href="/" className="nav-brand">
              <span className="nav-brand-logo-wrap" aria-hidden="true">
                <Image
                  src="/pic1.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 480px) 48px, 56px"
                  className="nav-brand-logo"
                  style={{ objectPosition: "center bottom" }}
                  priority
                />
              </span>
              <span className="nav-brand-text" suppressHydrationWarning>
                {t("navBrand")}
              </span>
            </Link>
          </div>
          <div className="nav-center">
            <div
              className={`nav-links ${isNavOpen ? "is-open" : ""}`}
              id="primary-navigation"
            >
              <Link
                href={paths.home}
                className={isActive("home") ? "active" : ""}
                onClick={() => setIsNavOpen(false)}
              >
                {t("navHome")}
              </Link>
              <Link
                href={paths.about}
                className={isActive("about") ? "active" : ""}
                onClick={() => setIsNavOpen(false)}
              >
                {t("navAbout")}
              </Link>
              <Link
                href={paths.gallery}
                className={isActive("gallery") ? "active" : ""}
                onClick={() => setIsNavOpen(false)}
              >
                {t("navGallery")}
              </Link>
              <Link
                href={paths.contact}
                className={isActive("contact") ? "active" : ""}
                onClick={() => setIsNavOpen(false)}
              >
                {t("navContact")}
              </Link>
            </div>
          </div>
          <div className="nav-right">
            <div className="nav-controls">
              <div className="language-control" ref={languageMenuRef}>
                <button
                  type="button"
                  className="language-trigger"
                  aria-haspopup="menu"
                  aria-expanded={isLanguageMenuOpen}
                  aria-label={`${t("languageLabel")}: ${currentLanguageLabel}`}
                  onClick={() => setIsLanguageMenuOpen((prev) => !prev)}
                >
                  <Languages size={18} aria-hidden="true" />
                  <span className="language-trigger-label">
                    {currentLanguageLabel}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`language-arrow ${isLanguageMenuOpen ? "open" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {isLanguageMenuOpen && (
                  <div
                    className="language-menu"
                    role="menu"
                    aria-label={t("languageLabel")}
                  >
                    {languageOptions.map((option) => {
                      const active = option.code === currentLanguage;
                      return (
                        <button
                          key={option.code}
                          type="button"
                          className={`language-option ${active ? "active" : ""}`}
                          role="menuitemradio"
                          aria-checked={active}
                          onClick={() => handleLanguageChange(option.code)}
                        >
                          <span>{option.label}</span>
                          {active && <Check size={14} aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="menu-btn"
              aria-label={isNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={isNavOpen}
              aria-controls="primary-navigation"
              onClick={() => setIsNavOpen((prev) => !prev)}
            >
              {isNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
        </div>
        </div>
      </header>

      <div
        className={`app-container${isSingleColumnNoCarousel ? " app-container--gallery" : ""}`}
      >
        <div
          className={`main-content-layout${
            isSingleColumnNoCarousel ? " main-content-layout--no-carousel" : ""
          }`}
        >
          <div className="main-content-primary">{children}</div>
          {!isSingleColumnNoCarousel && <AjiPhotoCarousel />}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
