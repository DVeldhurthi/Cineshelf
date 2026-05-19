import { useEffect, useMemo, useRef, useState } from "react";
import type { AnimeSubtitle } from "../types/anime";
import styles from "./AnimePlayerPage.module.css";

const parseSubtitles = (value: string | null): AnimeSubtitle[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function AnimePlayerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const src = params.get("src") ?? "";
  const title = params.get("title") ?? "Anime Player";
  const poster = params.get("poster") ?? undefined;
  const subtitles = parseSubtitles(params.get("subtitles"));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    let cancelled = false;
    let hls: { destroy: () => void } | null = null;

    if (!video || !src) {
      return;
    }

    setError(null);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return () => {
        cancelled = true;
        video.pause();
        video.removeAttribute("src");
        video.load();
      };
    }

    const loadHlsFallback = async () => {
      const { default: Hls } = await import("hls.js");

      if (cancelled) {
        return;
      }

      if (Hls.isSupported()) {
        const hlsInstance = new Hls({
          backBufferLength: 30,
          enableWorker: false,
          lowLatencyMode: false,
          maxBufferLength: 12,
          maxMaxBufferLength: 30,
        });

        hls = hlsInstance;

        hlsInstance.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError("The anime stream could not be loaded in the built-in player.");
          }
        });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);
      } else {
        setError("This WebView cannot play this stream format. Use the external browser fallback.");
      }
    };

    loadHlsFallback().catch(() => {
      if (!cancelled) {
        setError("The anime player could not load its stream fallback.");
      }
    });

    return () => {
      cancelled = true;

      if (hls) {
        hls.destroy();
      }

      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>Anime stream</p>
        <h1>{title}</h1>
      </header>

      <div className={styles.playerShell}>
        {src ? (
          <video ref={videoRef} className={styles.player} controls autoPlay poster={poster}>
            {subtitles.map((subtitle, index) => (
              <track
                key={`${subtitle.file}-${index}`}
                kind={subtitle.kind ?? "subtitles"}
                src={subtitle.file}
                label={subtitle.label ?? `Subtitle ${index + 1}`}
              />
            ))}
          </video>
        ) : (
          <div className={styles.empty}>No anime stream URL was provided.</div>
        )}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
    </main>
  );
}
