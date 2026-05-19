import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { debugLog } from "../store/useDebugStore";
import { openExternalUrl } from "../utils/openExternal";
import styles from "./ExternalPlayerPage.module.css";

const iframeSandbox =
  "allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-pointer-lock allow-storage-access-by-user-activation allow-top-navigation-by-user-activation";
const iframeAllow =
  "autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write; web-share; screen-wake-lock";
const iframeReferrerPolicy = "no-referrer";

const getExternalPlayerParams = () => {
  const hash = window.location.hash;
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  return new URLSearchParams(hashQuery || window.location.search);
};

export function ExternalPlayerPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const loadStartedAtRef = useRef<number | null>(null);
  const params = useMemo(getExternalPlayerParams, []);
  const src = params.get("src") ?? "";
  const title = params.get("title") ?? "Cineshelf Player";
  const [frameNonce, setFrameNonce] = useState(0);
  const [loadState, setLoadState] = useState<"loading" | "slow" | "loaded" | "error">(src ? "loading" : "error");
  const [actionError, setActionError] = useState<string | null>(null);

  const clearLoadTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    clearLoadTimeout();

    debugLog("externalPlayer", "External player route mounted.", {
      href: window.location.href,
      hash: window.location.hash,
      browserSearch: window.location.search,
      src,
      title,
    });

    if (src) {
      loadStartedAtRef.current = performance.now();
      setLoadState("loading");
      setActionError(null);

      timeoutRef.current = window.setTimeout(() => {
        setLoadState((currentState) => (currentState === "loading" ? "slow" : currentState));
        debugLog("externalPlayer", "External player iframe is still loading.", {
          src,
          title,
          elapsedMs: loadStartedAtRef.current
            ? Math.round(performance.now() - loadStartedAtRef.current)
            : null,
        }, "warn");
      }, 12000);
    }

    return () => {
      clearLoadTimeout();

      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
        iframeRef.current.removeAttribute("src");
      }
    };
  }, [src, title, frameNonce]);

  if (!src) {
    return <main className={styles.empty}>No player URL was provided.</main>;
  }

  const retryPlayer = () => {
    debugLog("externalPlayer", "Retry requested.", {
      src,
      title,
      frameNonce,
    }, "warn");
    setFrameNonce((currentNonce) => currentNonce + 1);
  };

  const openInBrowser = async () => {
    try {
      setActionError(null);
      await openExternalUrl(src);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setActionError(message);
      debugLog("externalPlayer", "Open in browser failed.", {
        src,
        title,
        error: message,
      }, "error");
    }
  };

  const statusText = {
    loading: "Loading player...",
    slow: "Still loading. This mirror may be slow or blocked.",
    loaded: "Player frame responded.",
    error: "Player frame failed to load.",
  }[loadState];

  return (
    <main className={styles.page}>
      <header className={styles.toolbar}>
        <div className={styles.titleGroup}>
          <strong>{title}</strong>
          <span className={styles.status}>{statusText}</span>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={retryPlayer} title="Retry player">
            <RotateCcw size={16} aria-hidden="true" />
            <span>Retry</span>
          </button>
          <button
            className={styles.secondaryAction}
            type="button"
            onClick={openInBrowser}
            title="Open in external browser"
          >
            <ExternalLink size={16} aria-hidden="true" />
            <span>External Browser</span>
          </button>
        </div>
      </header>

      {loadState === "loading" || loadState === "slow" ? (
        <div className={styles.overlay} role="status" aria-live="polite">
          <Loader2 className={styles.spinner} size={30} aria-hidden="true" />
          <strong>{statusText}</strong>
          {loadState === "slow" ? (
            <p>Try Retry first. External Browser is only a fallback.</p>
          ) : null}
        </div>
      ) : null}

      {loadState === "error" || actionError ? (
        <div className={styles.overlay} role="alert">
          <AlertTriangle size={30} aria-hidden="true" />
          <strong>{actionError ? "Action failed" : "Player did not load"}</strong>
          <p>{actionError ?? "Try Retry first. External Browser is only a fallback."}</p>
        </div>
      ) : null}

      <iframe
        key={frameNonce}
        ref={iframeRef}
        title={title}
        src={src}
        sandbox={iframeSandbox}
        allow={iframeAllow}
        allowFullScreen
        referrerPolicy={iframeReferrerPolicy}
        onLoad={() => {
          clearLoadTimeout();
          setLoadState("loaded");
          debugLog("externalPlayer", "External player iframe loaded.", {
            src,
            title,
            elapsedMs: loadStartedAtRef.current
              ? Math.round(performance.now() - loadStartedAtRef.current)
              : null,
          }, "success");
        }}
        onError={() => {
          clearLoadTimeout();
          setLoadState("error");
          debugLog("externalPlayer", "External player iframe failed.", {
            src,
            title,
          }, "error");
        }}
      />
    </main>
  );
}
