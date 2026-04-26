"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  LogOut,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";

export function AdminClient() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [images, setImages] = useState([]);
  const [configured, setConfigured] = useState(true);
  /** @type {{ hasPublicKey: boolean, hasSecretKey: boolean } | null} */
  const [uploadcareKeys, setUploadcareKeys] = useState(null);
  const [listError, setListError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const [deletingId, setDeletingId] = useState(null);
  const [replacingId, setReplacingId] = useState(null);
  const replaceInputRef = useRef(null);
  const createFileInputRef = useRef(null);

  const loadGallery = useCallback(async () => {
    setListError("");
    try {
      const res = await fetch("/api/admin/gallery", { cache: "no-store" });
      const data = await res.json();
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Load failed");
      setImages(Array.isArray(data.images) ? data.images : []);
      setConfigured(data.configured !== false);
      if (data.uploadcare && typeof data.uploadcare === "object") {
        setUploadcareKeys({
          hasPublicKey: Boolean(data.uploadcare.hasPublicKey),
          hasSecretKey: Boolean(data.uploadcare.hasSecretKey),
        });
      } else {
        setUploadcareKeys(null);
      }
    } catch {
      setListError("Could not load the gallery.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        setAuthed(res.ok);
      } catch {
        setAuthed(false);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (authed) void loadGallery();
  }, [authed, loadGallery]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!/^\d{4}$/.test(code)) {
      setLoginError("Enter the 4-digit access code.");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        setLoginError("Code does not match. Try again.");
        return;
      }
      setCode("");
      setAuthed(true);
    } catch {
      setLoginError("Network error. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
  };

  const onUpload = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploadMsg("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadMsg(data.error || "Upload failed");
        return;
      }
      setUploadMsg("Uploaded successfully.");
      await loadGallery();
    } catch {
      setUploadMsg("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (publicId) => {
    if (!confirm("Delete this image? It will disappear from the site.")) {
      return;
    }
    setDeletingId(publicId);
    setListError("");
    try {
      const res = await fetch("/api/admin/image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(data.error || "Delete failed");
        return;
      }
      await loadGallery();
    } catch {
      setListError("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const startReplace = (publicId) => {
    setReplacingId(publicId);
    setUploadMsg("");
    requestAnimationFrame(() => replaceInputRef.current?.click());
  };

  const onReplaceFile = async (e) => {
    const file = e.target.files?.[0];
    const pid = replacingId;
    e.target.value = "";
    if (!file || !pid) {
      setReplacingId(null);
      return;
    }
    setUploading(true);
    setUploadMsg("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("publicId", pid);
    try {
      const res = await fetch("/api/admin/image", { method: "PUT", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadMsg(data.error || "Replace failed");
        return;
      }
      setUploadMsg("Image replaced successfully.");
      await loadGallery();
    } catch {
      setUploadMsg("Replace failed");
    } finally {
      setUploading(false);
      setReplacingId(null);
    }
  };

  if (checking) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-card--loading" aria-live="polite">
          <Loader2 className="admin-spinner" size={32} />
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <h1 className="admin-title">Gallery admin</h1>
          <p className="admin-sub">
            Enter the 4-digit access code to manage project photos.
          </p>
          <form onSubmit={handleLogin} className="admin-form">
            <label className="admin-label" htmlFor="admin-code">
              Access code
            </label>
            <input
              id="admin-code"
              className="admin-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              pattern="\d{4}"
              placeholder="0000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
            {loginError && (
              <p className="admin-msg admin-msg--err" role="alert">
                <AlertCircle size={16} /> {loginError}
              </p>
            )}
            <button
              type="submit"
              className="admin-btn"
              disabled={loginLoading}
            >
              {loginLoading ? "Checking…" : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="admin-replace-only-input"
        aria-hidden
        tabIndex={-1}
        onChange={onReplaceFile}
      />

      <div className="admin-bar">
        <h1 className="admin-title admin-title--inline">Gallery admin</h1>
        <button
          type="button"
          className="admin-btn-ghost"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>

      {!configured && (
        <div className="admin-card admin-card--wide admin-card--warn">
          <h2 className="admin-h2">Uploadcare is not fully configured</h2>
          {uploadcareKeys?.hasPublicKey && !uploadcareKeys.hasSecretKey ? (
            <div className="admin-hint">
              <p>
                <strong>Your public key is set, but the secret key is missing.</strong>{" "}
                Listing, delete, and replace use Uploadcare’s REST API, which
                needs both keys.
              </p>
              <ol className="admin-ol">
                <li>
                  Open{" "}
                  <a
                    href="https://app.uploadcare.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    app.uploadcare.com
                  </a>{" "}
                  → your project → <strong>API keys</strong> (or{" "}
                  <strong>Developers</strong>).
                </li>
                <li>
                  Copy the <strong>Secret key</strong> (a long string, different
                  from the public one).
                </li>
                <li>
                  In the <code>aji-gallery</code> project folder, edit{" "}
                  <code>.env.local</code> and add a new line:{" "}
                  <code>UPLOADCARE_SECRET_KEY=</code> then paste the secret
                  (no spaces).
                </li>
                <li>
                  <strong>Stop</strong> the dev server (Ctrl+C) and start again
                  with <code>npm run dev</code> — environment variables load only
                  at startup.
                </li>
              </ol>
            </div>
          ) : (
            <p className="admin-hint">
              Set <code>UPLOADCARE_PUBLIC_KEY</code> and{" "}
              <code>UPLOADCARE_SECRET_KEY</code> in <code>aji-gallery/.env.local</code>{" "}
              (local) or in Vercel → Settings → Environment Variables
              (production). Create a project in{" "}
              <a
                href="https://uploadcare.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Uploadcare
              </a>{" "}
              and copy <strong>both</strong> the public and secret API keys, then
              restart the dev server.
            </p>
          )}
        </div>
      )}

      <div className="admin-card admin-card--wide">
        <h2 className="admin-h2">Add image (create)</h2>
        <p className="admin-hint">
          Images are uploaded to <strong>Uploadcare</strong> (CDN) and shown on
          the site. Max 12 MB. JPEG, PNG, WebP, GIF, or AVIF.
        </p>
        <div className="admin-drop">
          <div className="admin-drop-inner">
            {uploading && !replacingId ? (
              <span className="admin-drop-prompt" aria-hidden>
                <Loader2 className="admin-spinner" size={24} />
                Working…
              </span>
            ) : (
              <span className="admin-drop-prompt" aria-hidden>
                <Upload size={20} />
                Choose image
              </span>
            )}
            <input
              ref={createFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="admin-file-input-overlay"
              aria-label="Choose an image file to upload to the gallery"
              disabled={uploading || !configured}
              onChange={(e) => onUpload(e.target.files)}
            />
          </div>
        </div>
        {uploadMsg && (
          <p
            className={`admin-msg ${
              uploadMsg.includes("success") ? "admin-msg--ok" : "admin-msg--err"
            }`}
            role="status"
          >
            {uploadMsg.includes("success") && <CheckCircle size={16} />}
            {uploadMsg.includes("success") && " "}
            {uploadMsg}
          </p>
        )}
      </div>

      <div className="admin-card admin-card--wide">
        <h2 className="admin-h2">Read / update / delete</h2>
        {listError && (
          <p className="admin-msg admin-msg--err" role="alert">
            {listError}
          </p>
        )}
        {!listError && images.length === 0 && configured && (
          <p className="admin-hint">No images yet. Upload one above.</p>
        )}
        <ul className="admin-file-list">
          {images.map((img) => (
            <li key={img.publicId} className="admin-file-item">
              <div className="admin-thumb">
                <Image
                  src={img.url}
                  alt=""
                  width={80}
                  height={80}
                  className="admin-thumb-img"
                  sizes="80px"
                  unoptimized
                />
              </div>
              <div className="admin-file-meta">
                <code className="admin-filename">{img.publicId}</code>
                <div className="admin-file-actions">
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => startReplace(img.publicId)}
                    disabled={!configured || Boolean(uploading)}
                    title="Replace with a new image (may get a new id)"
                  >
                    <ImageIcon size={16} />
                    Replace
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--danger"
                    onClick={() => onDelete(img.publicId)}
                    disabled={deletingId === img.publicId || !configured}
                    title="Delete image"
                  >
                    {deletingId === img.publicId ? (
                      <Loader2 className="admin-spinner" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
