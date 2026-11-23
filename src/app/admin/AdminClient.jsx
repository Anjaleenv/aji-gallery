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
  Play,
  Eye,
  X,
} from "lucide-react";
import { uploadFile } from "@uploadcare/upload-client";
import {
  getVideoPlaybackUrl,
  getVideoPosterUrl,
  normalizeImageUrl,
} from "@/lib/galleryIndex";

const ACCEPT_MEDIA =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

function isItemVideo(item) {
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

export function AdminClient() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [code, setCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [images, setImages] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [publicKey, setPublicKey] = useState(
    process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || ""
  );
  /** @type {{ hasPublicKey: boolean, hasSecretKey: boolean } | null} */
  const [uploadcareKeys, setUploadcareKeys] = useState(null);
  const [listError, setListError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const [deletingId, setDeletingId] = useState(null);
  const [replacingId, setReplacingId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const replaceInputRef = useRef(null);
  const createFileInputRef = useRef(null);

  const loadGallery = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gallery", { cache: "no-store" });
      const data = await res.json();
      setListError("");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Load failed");
      setImages(Array.isArray(data.images) ? data.images : []);
      setConfigured(data.configured !== false);
      if (data.publicKey) {
        setPublicKey(data.publicKey);
      } else if (data.uploadcare?.publicKey) {
        setPublicKey(data.uploadcare.publicKey);
      }
      if (data.uploadcare && typeof data.uploadcare === "object") {
        setUploadcareKeys({
          hasPublicKey: Boolean(data.uploadcare.hasPublicKey),
          hasSecretKey: Boolean(data.uploadcare.hasSecretKey),
        });
      } else {
        setUploadcareKeys(null);
      }
      if (data.upstreamUnavailable) {
        setListError(
          "Cannot reach Uploadcare (check internet, DNS, or firewall). The gallery list stays empty until the connection works."
        );
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (createFileInputRef.current) createFileInputRef.current.value = "";
    setUploadMsg("");

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadMsg("File too large (max 50 MB).");
      return;
    }

    const isVid =
      file.type.startsWith("video/") ||
      /\.(mp4|webm|mov)$/i.test(file.name || "");
    const isImg =
      file.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.name || "");

    if (!isVid && !isImg) {
      setUploadMsg(
        "Only JPEG, PNG, WebP, GIF, AVIF images and MP4, WebM, MOV videos are allowed."
      );
      return;
    }

    setUploading(true);

    try {
      let pubKey = publicKey;
      if (!pubKey) {
        const pRes = await fetch("/api/admin/upload", { cache: "no-store" });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.publicKey) {
            pubKey = pData.publicKey;
            setPublicKey(pData.publicKey);
          }
        }
      }

      if (pubKey) {
        // Direct browser upload to Uploadcare (bypasses Vercel serverless 4.5 MB request body limit)
        setUploadMsg(isVid ? "Uploading video to Uploadcare…" : "Uploading image to Uploadcare…");
        const uploadResult = await uploadFile(file, {
          publicKey: pubKey,
          store: true,
          metadata: { aji_gallery: "1" },
          fileName: file.name,
          contentType: file.type || undefined,
        });

        setUploadMsg("Finalizing upload…");
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid: uploadResult.uuid, name: file.name }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUploadMsg(data.error || "Upload failed");
          return;
        }
      } else {
        // Fallback
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUploadMsg(data.error || "Upload failed");
          return;
        }
      }

      setUploadMsg(isVid ? "Video uploaded successfully." : "Image uploaded successfully.");
      await loadGallery();
    } catch (err) {
      console.error("Upload error:", err);
      setUploadMsg(err?.message || "Upload failed.");
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

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadMsg("File too large (max 50 MB).");
      setReplacingId(null);
      return;
    }

    const isVid =
      file.type.startsWith("video/") ||
      /\.(mp4|webm|mov)$/i.test(file.name || "");
    const isImg =
      file.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.name || "");

    if (!isVid && !isImg) {
      setUploadMsg(
        "Only JPEG, PNG, WebP, GIF, AVIF images and MP4, WebM, MOV videos are allowed."
      );
      setReplacingId(null);
      return;
    }

    setUploading(true);
    setUploadMsg("");

    try {
      let pubKey = publicKey;
      if (!pubKey) {
        const pRes = await fetch("/api/admin/upload", { cache: "no-store" });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.publicKey) {
            pubKey = pData.publicKey;
            setPublicKey(pData.publicKey);
          }
        }
      }

      if (pubKey) {
        // Direct browser-to-Uploadcare replace
        setUploadMsg(isVid ? "Uploading replacement video…" : "Uploading replacement image…");
        const uploadResult = await uploadFile(file, {
          publicKey: pubKey,
          store: true,
          metadata: { aji_gallery: "1" },
          fileName: file.name,
          contentType: file.type || undefined,
        });

        setUploadMsg("Finalizing replacement…");
        const res = await fetch("/api/admin/image", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid: uploadResult.uuid, publicId: pid }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUploadMsg(data.error || "Replace failed");
          return;
        }
      } else {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("publicId", pid);
        const res = await fetch("/api/admin/image", { method: "PUT", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUploadMsg(data.error || "Replace failed");
          return;
        }
      }

      setUploadMsg(isVid ? "Video replaced successfully." : "Image replaced successfully.");
      await loadGallery();
    } catch (err) {
      console.error("Replace error:", err);
      setUploadMsg(err?.message || "Replace failed");
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
        accept={ACCEPT_MEDIA}
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
                  <strong>On this live site (Vercel):</strong> open{" "}
                  <a
                    href="https://vercel.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    vercel.com
                  </a>{" "}
                  → your <strong>aji-gallery</strong> project →{" "}
                  <strong>Settings</strong> → <strong>Environment Variables</strong> →
                  add <code>UPLOADCARE_SECRET_KEY</code> = your secret, for{" "}
                  <strong>Production</strong> (and Preview if you use preview
                  deploys) → <strong>Save</strong> → <strong>Deployments</strong> →
                  <strong>⋯</strong> on the latest → <strong>Redeploy</strong>.
                </li>
                <li>
                  <strong>On your computer only:</strong> in <code>aji-gallery</code>, edit{" "}
                  <code>.env.local</code> and add{" "}
                  <code>UPLOADCARE_SECRET_KEY=</code> then the secret (no spaces).
                </li>
                <li>
                  <strong>Stop</strong> the dev server (Ctrl+C) and start again
                  with <code>npm run dev</code> — local env loads only at startup.
                </li>
              </ol>
            </div>
          ) : (
            <div className="admin-hint">
              <p>
                <strong>
                  <code>.env.local</code> is not used on the deployed site.
                </strong>{" "}
                It only exists on your machine and is not sent to Vercel. For{" "}
                <strong>aji-gallery.vercel.app</strong> or your custom domain, you
                must set keys in the Vercel dashboard.
              </p>
              <ol className="admin-ol">
                <li>
                  In{" "}
                  <a
                    href="https://app.uploadcare.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    app.uploadcare.com
                  </a>
                  , open your project → <strong>API keys</strong> and copy the{" "}
                  <strong>public key</strong> and <strong>secret key</strong> (two
                  different values).
                </li>
                <li>
                  In{" "}
                  <a
                    href="https://vercel.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    vercel.com
                  </a>{" "}
                  → project <strong>aji-gallery</strong> → <strong>Settings</strong> →{" "}
                  <strong>Environment Variables</strong> → add{" "}
                  <code>UPLOADCARE_PUBLIC_KEY</code> and{" "}
                  <code>UPLOADCARE_SECRET_KEY</code> → mark{" "}
                  <strong>Production</strong> (and <strong>Preview</strong> if
                  needed) → <strong>Save</strong>.
                </li>
                <li>
                  Open <strong>Deployments</strong> and click <strong>Redeploy</strong> on
                  the latest production deployment so the server picks up the new
                  variables.
                </li>
                <li>
                  For local <code>npm run dev</code> only, put the same names and
                  values in <code>aji-gallery/.env.local</code> and restart the dev
                  server.
                </li>
              </ol>
            </div>
          )}
        </div>
      )}

      <div className="admin-card admin-card--wide">
        <h2 className="admin-h2">Add image or video (create)</h2>
        <p className="admin-hint">
          Media files are uploaded directly to <strong>Uploadcare</strong> (CDN)
          and shown on the site. Max 50 MB. JPEG, PNG, WebP, GIF, AVIF, or MP4,
          WebM, MOV video.
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
                Choose image or video
              </span>
            )}
            <input
              ref={createFileInputRef}
              type="file"
              accept={ACCEPT_MEDIA}
              className="admin-file-input-overlay"
              aria-label="Choose an image or video file to upload to the gallery"
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
          <p className="admin-hint">No images or videos yet. Upload one above.</p>
        )}
        <ul className="admin-file-list">
          {images.map((img) => (
            <li key={img.publicId} className="admin-file-item">
              <div
                className="admin-thumb"
                onClick={() => setPreviewItem(img)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPreviewItem(img);
                  }
                }}
                title={isItemVideo(img) ? "Click to play video" : "Click to view image"}
                style={{ cursor: "pointer" }}
              >
                {isItemVideo(img) ? (
                  <div className="admin-thumb-video-wrapper">
                    <video
                      src={`${getVideoPlaybackUrl(img.url, img.publicId)}#t=0.1`}
                      poster={getVideoPosterUrl(img.url, img.publicId) || undefined}
                      className="admin-thumb-img"
                      muted
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        if (!getVideoPosterUrl(img.url, img.publicId)) {
                          try { e.target.currentTime = 0.1; } catch {}
                        }
                      }}
                    />
                    <div className="admin-thumb-video-badge" aria-hidden="true">
                      <Play size={12} fill="currentColor" />
                    </div>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={normalizeImageUrl(img.url)}
                    alt=""
                    width={80}
                    height={80}
                    className="admin-thumb-img"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="admin-file-meta">
                <code className="admin-filename">{img.publicId}</code>
                <div className="admin-file-actions">
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => setPreviewItem(img)}
                    title={isItemVideo(img) ? "Play video preview" : "View image preview"}
                  >
                    {isItemVideo(img) ? <Play size={16} /> : <Eye size={16} />}
                    {isItemVideo(img) ? "Play" : "View"}
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => startReplace(img.publicId)}
                    disabled={!configured || Boolean(uploading)}
                    title="Replace with a new image or video (may get a new id)"
                  >
                    <ImageIcon size={16} />
                    Replace
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--danger"
                    onClick={() => onDelete(img.publicId)}
                    disabled={deletingId === img.publicId || !configured}
                    title="Delete item"
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

      {previewItem && (
        <div
          className="admin-preview-modal-overlay"
          onClick={() => setPreviewItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-preview-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-preview-modal-header">
              <h3 className="admin-preview-modal-title">
                {isItemVideo(previewItem) ? "Video Player" : "Image Preview"}
              </h3>
              <button
                type="button"
                className="admin-preview-modal-close"
                onClick={() => setPreviewItem(null)}
                aria-label="Close preview"
              >
                <X size={24} />
              </button>
            </div>
            <div className="admin-preview-modal-body">
              {isItemVideo(previewItem) ? (
                <video
                  key={previewItem.url}
                  poster={
                    getVideoPosterUrl(
                      previewItem.url,
                      previewItem.publicId
                    ) || undefined
                  }
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="admin-preview-video"
                >
                  <source
                    src={`${getVideoPlaybackUrl(
                      previewItem.url,
                      previewItem.publicId
                    )}#t=0.1`}
                    type="video/mp4"
                  />
                  <source
                    src={`${getVideoPlaybackUrl(
                      previewItem.url,
                      previewItem.publicId
                    )}#t=0.1`}
                    type="video/webm"
                  />
                  Your browser does not support HTML5 video playback.
                </video>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewItem.url}
                  alt=""
                  className="admin-preview-img"
                />
              )}
            </div>
            <div className="admin-preview-modal-footer">
              <code className="admin-filename">{previewItem.publicId}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
