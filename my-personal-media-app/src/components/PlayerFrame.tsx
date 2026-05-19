import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { debugLog } from "../store/useDebugStore";
import styles from "./PlayerFrame.module.css";

type PlayerFrameProps = {
  src: string | null;
  frameKey: string;
  title: string;
  onReviewWarning: () => void;
  onRetry: () => void;
};

const iframeSandbox =
  "allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-pointer-lock allow-storage-access-by-user-activation allow-top-navigation-by-user-activation";
const iframeAllow =
  "autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write; web-share; screen-wake-lock";
const iframeReferrerPolicy = "no-referrer";

export function PlayerFrame({ src, frameKey, title, onReviewWarning, onRetry }: PlayerFrameProps) {
  const [isLoading, setIsLoading] = useState(Boolean(src));
  const [loadError, setLoadError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const loadStartedAtRef = useRef<number | null>(null);

  const clearLoadTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    clearLoadTimeout();

    if (!src) {
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
        iframeRef.current.removeAttribute("src");
      }

      setIsLoading(false);
      setLoadError(null);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    loadStartedAtRef.current = performance.now();

    debugLog("iframe", "Iframe mount requested.", {
      title,
      src,
      frameKey,
      sandbox: iframeSandbox,
      allow: iframeAllow,
      referrerPolicy: iframeReferrerPolicy,
    });

    timeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      debugLog("iframe", "Iframe load timeout reached.", {
        title,
        src,
        frameKey,
        elapsedMs: loadStartedAtRef.current
          ? Math.round(performance.now() - loadStartedAtRef.current)
          : null,
      }, "warn");
      setLoadError(
        "The embedded player is taking too long to respond. Try another mirror or open it in your browser.",
      );
    }, 18000);

    return () => {
      clearLoadTimeout();

      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
        iframeRef.current.removeAttribute("src");
      }
    };
  }, [src, frameKey]);

  if (!src) {
    return (
      <div className={styles.lockedFrame}>
        <ShieldCheck size={36} aria-hidden="true" />
        <h2>External Player Locked</h2>
        <p>The embed will mount only after confirmation.</p>
        <button type="button" onClick={onReviewWarning}>
          Review Warning
        </button>
      </div>
    );
  }

  return (
    <div className={styles.frameShell}>
      {isLoading ? (
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <Loader2 size={30} aria-hidden="true" />
          <span>Loading secure player...</span>
        </div>
      ) : null}

      {loadError ? (
        <div className={styles.errorOverlay} role="alert">
          <AlertTriangle size={30} aria-hidden="true" />
          <h2>Player did not finish loading</h2>
          <p>{loadError}</p>
          <button type="button" onClick={onRetry}>
            <RotateCcw size={16} aria-hidden="true" />
            <span>Retry Player</span>
          </button>
        </div>
      ) : null}

      <iframe
        key={frameKey}
        ref={iframeRef}
        title={`Sandboxed player for ${title}`}
        src={src}
        sandbox={iframeSandbox}
        allow={iframeAllow}
        allowFullScreen
        referrerPolicy={iframeReferrerPolicy}
        onLoad={() => {
          clearLoadTimeout();
          setIsLoading(false);
          setLoadError(null);
          debugLog("iframe", "Iframe load event fired.", {
            title,
            src,
            frameKey,
            elapsedMs: loadStartedAtRef.current
              ? Math.round(performance.now() - loadStartedAtRef.current)
              : null,
          }, "success");
        }}
        onError={() => {
          clearLoadTimeout();
          setIsLoading(false);
          debugLog("iframe", "Iframe error event fired.", {
            title,
            src,
            frameKey,
          }, "error");
          setLoadError(
            "The embedded player failed to load. Try another mirror or open it in your browser.",
          );
        }}
      />
    </div>
  );
}
