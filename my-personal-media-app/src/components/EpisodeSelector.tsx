import type { Video } from "../types/video";
import styles from "./EpisodeSelector.module.css";

type EpisodeSelectorProps = {
  video: Video;
  selectedSeason: number;
  selectedEpisode: number;
  onChange: (season: number, episode: number) => void;
};

export function EpisodeSelector({
  video,
  selectedSeason,
  selectedEpisode,
  onChange,
}: EpisodeSelectorProps) {
  if (video.kind !== "tv" || !video.seasons?.length) {
    return null;
  }

  const activeSeason =
    video.seasons.find((season) => season.season === selectedSeason) ?? video.seasons[0];
  const episodes = Array.from({ length: activeSeason.episodes }, (_, index) => index + 1);

  return (
    <section className={styles.selector} aria-label="Episode selector">
      <div className={styles.seasonHeader}>
        <div>
          <p>Now Playing</p>
          <h2>
            Season {selectedSeason}, Episode {selectedEpisode}
          </h2>
        </div>

        <label>
          <span>Season</span>
          <select
            value={selectedSeason}
            onChange={(event) => onChange(Number(event.currentTarget.value), 1)}
          >
            {video.seasons.map((season) => (
              <option key={season.season} value={season.season}>
                Season {season.season}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.episodeGrid}>
        {episodes.map((episode) => (
          <button
            key={episode}
            type="button"
            className={episode === selectedEpisode ? styles.activeEpisode : ""}
            onClick={() => onChange(selectedSeason, episode)}
            aria-pressed={episode === selectedEpisode}
          >
            {episode}
          </button>
        ))}
      </div>
    </section>
  );
}
