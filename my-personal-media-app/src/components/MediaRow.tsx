import { useId } from "react";
import type { Video } from "../types/video";
import { useMediaStore } from "../store/useMediaStore";
import { VideoCard } from "./VideoCard";
import styles from "./MediaRow.module.css";

type MediaRowProps = {
  title: string;
  eyebrow?: string;
  videos: Video[];
};

export function MediaRow({ title, eyebrow, videos }: MediaRowProps) {
  const headingId = useId();
  const watchlistIds = useMediaStore((state) => state.watchlistIds);
  const continueWatching = useMediaStore((state) => state.continueWatching);
  const toggleWatchlist = useMediaStore((state) => state.toggleWatchlist);

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className={styles.row} aria-labelledby={headingId}>
      <div className={styles.heading}>
        <div>
          {eyebrow ? <p>{eyebrow}</p> : null}
          <h2 id={headingId}>{title}</h2>
        </div>
        <span>{videos.length}</span>
      </div>

      <div className={styles.scroller}>
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            isInWatchlist={watchlistIds.includes(video.id)}
            onToggleWatchlist={toggleWatchlist}
            continueEntry={continueWatching[video.id]}
          />
        ))}
      </div>
    </section>
  );
}
