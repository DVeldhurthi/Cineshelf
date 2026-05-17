import { VideoCard } from "../components/VideoCard";
import { EmptyState } from "../components/EmptyState";
import { videos } from "../data/catalog";
import { useMediaStore } from "../store/useMediaStore";
import type { Video } from "../types/video";
import styles from "./WatchlistPage.module.css";

export function WatchlistPage() {
  const watchlistIds = useMediaStore((state) => state.watchlistIds);
  const continueWatching = useMediaStore((state) => state.continueWatching);
  const toggleWatchlist = useMediaStore((state) => state.toggleWatchlist);

  const watchlistVideos = watchlistIds
    .map((id) => videos.find((video) => video.id === id))
    .filter((video): video is Video => Boolean(video));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p>Saved shelf</p>
        <h1>Watchlist</h1>
      </header>

      {watchlistVideos.length === 0 ? (
        <EmptyState
          title="No saved titles yet"
          message="Titles you save from the home or watch page will appear here."
        />
      ) : (
        <div className={styles.grid}>
          {watchlistVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isInWatchlist
              onToggleWatchlist={toggleWatchlist}
              continueEntry={continueWatching[video.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
