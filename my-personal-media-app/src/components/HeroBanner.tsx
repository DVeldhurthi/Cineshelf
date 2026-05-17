import type { CSSProperties } from "react";
import { Check, Play, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import type { Video } from "../types/video";
import { PosterImage } from "./PosterImage";
import styles from "./HeroBanner.module.css";

type HeroBannerProps = {
  video: Video;
  isInWatchlist: boolean;
  onToggleWatchlist: () => void;
};

export function HeroBanner({ video, isInWatchlist, onToggleWatchlist }: HeroBannerProps) {
  const artStyle = {
    "--hero-color": video.color,
    "--hero-accent": video.accentColor,
    "--hero-backdrop": `url("${video.backdropUrl}")`,
  } as CSSProperties;

  return (
    <section className={styles.hero} style={artStyle}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.copy}>
        <div className={styles.kicker}>
          <span>{video.kind === "tv" ? "Series" : "Feature"}</span>
          <span>{video.year}</span>
          <span>{video.rating}</span>
        </div>
        <h1>{video.title}</h1>
        <p className={styles.tagline}>{video.tagline}</p>
        <p className={styles.synopsis}>{video.synopsis}</p>

        <div className={styles.actions}>
          <Link to={`/watch/${video.id}`} className={styles.primaryAction}>
            <Play size={18} fill="currentColor" aria-hidden="true" />
            <span>Watch</span>
          </Link>
          <button
            type="button"
            className={styles.secondaryAction}
            aria-pressed={isInWatchlist}
            onClick={onToggleWatchlist}
          >
            {isInWatchlist ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Plus size={18} aria-hidden="true" />
            )}
            <span>{isInWatchlist ? "Saved" : "Watchlist"}</span>
          </button>
        </div>
      </div>

      <div className={styles.poster} aria-hidden="true">
        <PosterImage video={video} className={styles.posterFrame} eager />
      </div>
    </section>
  );
}
