import { useId } from "react";
import type { AnimeMedia } from "../types/anime";
import { AnimeCard } from "./AnimeCard";
import styles from "./AnimeRow.module.css";

type AnimeRowProps = {
  title: string;
  eyebrow?: string;
  anime: AnimeMedia[];
  loading?: boolean;
  error?: string | null;
};

export function AnimeRow({ title, eyebrow, anime, loading, error }: AnimeRowProps) {
  const headingId = useId();

  if (!loading && !error && anime.length === 0) {
    return null;
  }

  return (
    <section className={styles.row} aria-labelledby={headingId}>
      <div className={styles.heading}>
        <div>
          {eyebrow ? <p>{eyebrow}</p> : null}
          <h2 id={headingId}>{title}</h2>
        </div>
        <span>{loading ? "Loading" : anime.length}</span>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        <div className={styles.skeletonRow} aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
      ) : (
        <div className={styles.scroller}>
          {anime.map((item) => (
            <AnimeCard key={item.id} anime={item} />
          ))}
        </div>
      )}
    </section>
  );
}
