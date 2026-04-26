"use client";

import { useTranslation } from "react-i18next";

export function AboutSection({
  className = "",
  titleTag: TitleTag = "h2",
  showProfileFigure = true,
}) {
  const { t } = useTranslation();

  return (
    <div className={`page-content about-content ${className}`.trim()}>
      <span className="pill">{t("aboutUs")}</span>
      <TitleTag className="page-title section-heading">
        {t("ourFoundation")}
      </TitleTag>
      <p className="page-desc">{t("aboutDesc1")}</p>
      <p className="page-desc">{t("aboutDesc2")}</p>
      <section
        className={`about-profile ${
          showProfileFigure ? "" : "about-profile--no-figure"
        }`.trim()}
        aria-labelledby="about-profile-heading"
      >
        {showProfileFigure && (
          <figure className="about-profile-figure">
            <img
              src="/team-ajith-nv.svg"
              alt={t("aboutProfilePhotoAlt")}
              width="640"
              height="800"
              loading="lazy"
              decoding="async"
            />
          </figure>
        )}
        <div className="about-profile-text">
          <span className="pill" id="about-profile-heading">
            {t("aboutProfileHeading")}
          </span>
          <h3 className="about-profile-name">{t("aboutProfileName")}</h3>
          <p className="about-profile-role">{t("aboutProfileRole")}</p>
        </div>
      </section>
    </div>
  );
}
