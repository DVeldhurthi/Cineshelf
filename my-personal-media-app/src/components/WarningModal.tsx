import { ExternalLink, Play, ShieldAlert, X } from "lucide-react";
import type { VidSrcMirror, Video } from "../types/video";
import styles from "./WarningModal.module.css";

type WarningModalProps = {
  video: Video;
  mirror: VidSrcMirror;
  url: string;
  onAccept: () => void;
  onCancel: () => void;
  onOpenExternal: () => void;
};

export function WarningModal({
  video,
  mirror,
  url,
  onAccept,
  onCancel,
  onOpenExternal,
}: WarningModalProps) {
  return (
    <div className={styles.overlay} role="presentation">
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="external-player-warning"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="Close warning"
          title="Close warning"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className={styles.iconWrap}>
          <ShieldAlert size={28} aria-hidden="true" />
        </div>

        <h2 id="external-player-warning">Load External Player?</h2>
        <p>
          {video.title} will load from {mirror.label}. External players can run
          third-party scripts, set their own cookies, and change without notice.
        </p>

        <div className={styles.securityList}>
          <span>Iframe sandbox: scripts, same-origin, forms, popups, presentation, storage access</span>
          <span>Referrer policy: no-referrer</span>
          <span>Top navigation and downloads are not granted</span>
        </div>

        <div className={styles.urlBox}>
          <span>VidSrc URL</span>
          <code>{url}</code>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.ghostButton} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onOpenExternal}>
            <ExternalLink size={17} aria-hidden="true" />
            <span>Open in External Browser</span>
          </button>
          <button type="button" className={styles.primaryButton} onClick={onAccept}>
            <Play size={17} fill="currentColor" aria-hidden="true" />
            <span>Load Sandboxed Player</span>
          </button>
        </div>
      </section>
    </div>
  );
}
