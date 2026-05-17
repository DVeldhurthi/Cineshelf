import { Check, Plus, Tv } from "lucide-react";
import { Link } from "react-router-dom";
import type { ContinueWatchingEntry, Video } from "../types/video";
import { PosterImage } from "./PosterImage";
import styles from "./VideoCard.module.css";

type VideoCardProps = {
  video: Video;
  isInWatchlist: boolean;
  onToggleWatchlist: (videoId: string) => void;
  continueEntry?: ContinueWatchingEntry;
};

export function VideoCard({
  video,
  isInWatchlist,
  onToggleWatchlist,
  continueEntry,
}: VideoCardProps) {
  const progressLabel =
    video.kind === "tv" && continueEntry?.season && continueEntry?.episode
      ? `S${continueEntry.season} E${continueEntry.episode}`
      : continueEntry
        ? "Resume"
        : null;

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={`${styles.saveButton} ${isInWatchlist ? styles.saveButtonActive : ""}`}
        onClick={() => onToggleWatchlist(video.id)}
        aria-label={isInWatchlist ? `Remove ${video.title} from watchlist` : `Add ${video.title} to watchlist`}
        aria-pressed={isInWatchlist}
        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        {isInWatchlist ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Plus size={16} aria-hidden="true" />
        )}
      </button>

      <Link to={`/watch/${video.id}`} className={styles.posterLink}>
        <PosterImage video={video} className={styles.posterArt}>
          <span className={styles.typeBadge}>
            {video.kind === "tv" ? <Tv size={13} aria-hidden="true" /> : null}
            {video.kind === "tv" ? "TV" : "Movie"}
          </span>
        </PosterImage>
      </Link>

      <div className={styles.meta}>
        <Link to={`/watch/${video.id}`} className={styles.title}>
          {video.title}
        </Link>
        <div className={styles.details}>
          <span>{video.year}</span>
          <span>{video.runtime}</span>
          {progressLabel ? <span>{progressLabel}</span> : null}
        </div>
      </div>
    </article>
  );
}
