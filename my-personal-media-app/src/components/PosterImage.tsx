import { useState } from "react";
import type { ReactNode } from "react";
import type { CSSProperties } from "react";
import type { Video } from "../types/video";
import styles from "./PosterImage.module.css";

type PosterImageProps = {
  video: Video;
  className?: string;
  eager?: boolean;
  children?: ReactNode;
};

export function PosterImage({ video, className, eager = false, children }: PosterImageProps) {
  const [failed, setFailed] = useState(false);
  const style = {
    "--poster-color": video.color,
    "--poster-accent": video.accentColor,
  } as CSSProperties;

  return (
    <div className={`${styles.poster} ${className ?? ""}`} style={style}>
      {video.posterUrl && !failed ? (
        <img
          src={video.posterUrl}
          alt={`${video.title} poster`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.fallback}>
          <span>{video.title}</span>
          <small>{video.releaseYear}</small>
        </div>
      )}
      {children}
    </div>
  );
}
