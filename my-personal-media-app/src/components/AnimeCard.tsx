import { Play, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { AnimeMedia } from "../types/anime";
import styles from "./AnimeCard.module.css";

type AnimeCardProps = {
  anime: AnimeMedia;
};

export function AnimeCard({ anime }: AnimeCardProps) {
  const [posterFailed, setPosterFailed] = useState(false);
  const meta = [
    anime.releaseYear,
    anime.format,
    anime.episodes ? `${anime.episodes} eps` : null,
  ].filter(Boolean);

  return (
    <article className={styles.card}>
      <Link to={`/anime/${anime.id}`} state={{ anime }} className={styles.posterLink}>
        <div className={styles.poster}>
          {anime.poster && !posterFailed ? (
            <img
              src={anime.poster}
              alt={`${anime.title} poster`}
              loading="lazy"
              decoding="async"
              onError={() => setPosterFailed(true)}
            />
          ) : (
            <div className={styles.fallback}>{anime.title}</div>
          )}
          <span className={styles.playBadge}>
            <Play size={13} aria-hidden="true" />
            Anime
          </span>
          {anime.score ? (
            <span className={styles.scoreBadge}>
              <Star size={12} aria-hidden="true" />
              {anime.score}
            </span>
          ) : null}
        </div>
      </Link>

      <div className={styles.meta}>
        <Link to={`/anime/${anime.id}`} state={{ anime }} className={styles.title}>
          {anime.title}
        </Link>
        <div className={styles.details}>
          {meta.map((item) => (
            <span key={String(item)}>{item}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
