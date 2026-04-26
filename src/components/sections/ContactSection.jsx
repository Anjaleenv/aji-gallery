"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const MIN_NAME_LEN = 2;
const MIN_PROJECT_LEN = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WA_SEP =
  "────────────────────────────────────────";
const MAX_WA = 4000;
const R_BACKTICK = /`/g;

/**
 * @param {string} s
 */
function escapeForWhatsAppInline(s) {
  return s.replace(R_BACKTICK, "ᐟ");
}

function nameErrorKey(raw) {
  const v = raw.trim();
  if (!v) return "contactErrorNameRequired";
  if (v.length < MIN_NAME_LEN) return "contactErrorNameShort";
  return null;
}

function emailErrorKey(raw) {
  const v = raw.trim();
  if (!v) return null;
  if (!EMAIL_RE.test(v)) return "contactErrorEmailInvalid";
  return null;
}

function projectErrorKey(raw) {
  const v = raw.trim();
  if (!v) return "contactErrorProjectRequired";
  if (v.length < MIN_PROJECT_LEN) return "contactErrorProjectShort";
  return null;
}

const initialDirty = { name: false, email: false, project: false };

export function ContactSection({
  nameId = "userName",
  emailId = "userEmail",
  projectId = "userProject",
  buttonId = "sendBtn",
  className = "",
  titleTag: TitleTag = "h2",
}) {
  const { t, i18n } = useTranslation();

  const [values, setValues] = useState({ name: "", email: "", project: "" });
  const [dirty, setDirty] = useState(() => ({ ...initialDirty }));

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const projectRef = useRef(null);

  const errors = useMemo(
    () => ({
      name: nameErrorKey(values.name),
      email: emailErrorKey(values.email),
      project: projectErrorKey(values.project),
    }),
    [values]
  );

  const isValid = !errors.name && !errors.email && !errors.project;

  const setField = useCallback(
    (field) => (e) => {
      const val = e.target.value;
      setValues((prev) => ({ ...prev, [field]: val }));
      setDirty((prev) => ({ ...prev, [field]: true }));
    },
    []
  );

  const markDirty = useCallback((field) => {
    setDirty((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const sendToWhatsApp = useCallback(() => {
    if (!isValid) {
      setDirty({ name: true, email: true, project: true });
      if (errors.name) nameRef.current?.focus();
      else if (errors.email) emailRef.current?.focus();
      else if (errors.project) projectRef.current?.focus();
      return;
    }

    const name = values.name.trim();
    const email = values.email.trim();
    const project = values.project.trim();

    const locale =
      i18n.resolvedLanguage === "ml"
        ? "ml-IN"
        : i18n.resolvedLanguage === "hi"
          ? "hi-IN"
          : "en-IN";
    const when = new Date().toLocaleString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const n = escapeForWhatsAppInline(name);
    const e = escapeForWhatsAppInline(email);
    const p = escapeForWhatsAppInline(project);
    const pageUrl = escapeForWhatsAppInline(
      typeof window !== "undefined" ? window.location.href : ""
    );

    const message = [
      t("waTitleLine1"),
      t("waTitleLine2"),
      "",
      WA_SEP,
      "",
      t("waBlockContact"),
      "",
      t("waFieldName"),
      "`" + n + "`",
      "",
      t("waFieldEmail"),
      "`" + e + "`",
      "",
      WA_SEP,
      "",
      t("waFieldProject"),
      "",
      p,
      "",
      WA_SEP,
      "",
      t("waFieldWebsite"),
      "",
      "`" + pageUrl + "`",
      "",
      WA_SEP,
      "",
      t("waFooter", { when }),
    ].join("\n");

    let finalMessage = message;
    if (message.length > MAX_WA) {
      const sliceLen = MAX_WA - t("waTruncated").length - 1;
      finalMessage =
        message.slice(0, Math.max(0, sliceLen)) + t("waTruncated");
    }

    const phoneNumber = "9605006565";
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(finalMessage)}`;
    const newWindow = window.open(whatsappURL, "_blank");
    newWindow?.focus();
  }, [isValid, errors, values.name, values.email, values.project, t, i18n.resolvedLanguage]);

  const errClass = (field) => (dirty[field] && errors[field] ? "is-invalid" : "");

  return (
    <div className={`page-content contact-content ${className}`.trim()}>
      <span className="pill">{t("getInTouch")}</span>
      <TitleTag className="page-title section-heading">
        {t("letsBuild")}
      </TitleTag>
      <p className="page-desc">{t("contactDesc")}</p>
      <form
        className="contact-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          sendToWhatsApp();
        }}
      >
        <div className="contact-field">
          <input
            ref={nameRef}
            id={nameId}
            name="name"
            type="text"
            placeholder={t("yourName")}
            className={`contact-input ${errClass("name")}`}
            autoComplete="name"
            value={values.name}
            onChange={setField("name")}
            onBlur={() => markDirty("name")}
            aria-invalid={dirty.name && errors.name ? true : undefined}
            aria-describedby={
              dirty.name && errors.name ? `${nameId}-err` : undefined
            }
          />
          {dirty.name && errors.name && (
            <p id={`${nameId}-err`} className="contact-field-error" role="alert">
              {t(errors.name)}
            </p>
          )}
        </div>

        <div className="contact-field">
          <input
            ref={emailRef}
            id={emailId}
            name="email"
            type="email"
            placeholder={t("emailAddress")}
            className={`contact-input ${errClass("email")}`}
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={setField("email")}
            onBlur={() => markDirty("email")}
            aria-invalid={dirty.email && errors.email ? true : undefined}
            aria-describedby={
              dirty.email && errors.email ? `${emailId}-err` : undefined
            }
          />
          {dirty.email && errors.email && (
            <p
              id={`${emailId}-err`}
              className="contact-field-error"
              role="alert"
            >
              {t(errors.email)}
            </p>
          )}
        </div>

        <div className="contact-field">
          <textarea
            ref={projectRef}
            id={projectId}
            name="project"
            placeholder={t("projectDetails")}
            rows={5}
            className={`contact-input contact-textarea ${errClass("project")}`}
            value={values.project}
            onChange={setField("project")}
            onBlur={() => markDirty("project")}
            aria-invalid={dirty.project && errors.project ? true : undefined}
            aria-describedby={
              dirty.project && errors.project ? `${projectId}-err` : undefined
            }
          />
          {dirty.project && errors.project && (
            <p
              id={`${projectId}-err`}
              className="contact-field-error"
              role="alert"
            >
              {t(errors.project)}
            </p>
          )}
        </div>

        <button
          id={buttonId}
          type="submit"
          className="upload-btn form-submit"
        >
          {t("sendMessage")}
        </button>
      </form>
    </div>
  );
}
