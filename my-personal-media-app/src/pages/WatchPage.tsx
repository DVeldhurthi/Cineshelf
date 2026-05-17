import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Heart, MonitorPlay, RotateCcw, Settings, Tv } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { EpisodeSelector } from "../components/EpisodeSelector";
import { PlayerFrame } from "../components/PlayerFrame";
import { PosterImage } from "../components/PosterImage";
import { WarningModal } from "../components/WarningModal";
import { getSameSeriesVideos, getVideoById } from "../data/catalog";
import { debugLog } from "../store/useDebugStore";
import { useMediaStore } from "../store/useMediaStore";
import type { Video } from "../types/video";
import { buildVidSrcUrl, getActiveMirror, getVidSrcLookupId } from "../utils/vidsrc";
import { openExternalUrl } from "../utils/openExternal";
import { openPlayerWebviewWindow } from "../utils/openPlayerWebview";
import styles from "./WatchPage.module.css";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to open the external player.";

function SameSeriesSection({ currentVideo, videos }: { currentVideo: Video; videos: Video[] }) {
  if (!videos.length) {
    return null;
  }

  return (
    <section className={styles.sameSeries} aria-labelledby="same-series-heading">
      <div className={styles.sameSeriesHeader}>
        <div>
          <p>{currentVideo.seriesTitle ?? "Related titles"}</p>
          <h2 id="same-series-heading">From same series</h2>
        </div>
        <span>{videos.length}</span>
      </div>

      <div className={styles.sameSeriesScroller}>
        {videos.map((seriesVideo) => {
          const seasonLabels =
            seriesVideo.kind === "tv"
              ? seriesVideo.seasons?.map((season) => `S${season.season}`).join(" / ")
              : null;

          return (
            <Link key={seriesVideo.id} to={`/watch/${seriesVideo.id}`} className={styles.seriesCard}>
              <PosterImage video={seriesVideo} className={styles.seriesPoster}>
                <span className={styles.seriesBadge}>
                  {seriesVideo.kind === "tv" ? <Tv size={12} aria-hidden="true" /> : null}
                  {seriesVideo.kind === "tv" ? "TV" : "Movie"}
                </span>
              </PosterImage>
              <span className={styles.seriesTitle}>{seriesVideo.title}</span>
              <span className={styles.seriesMeta}>
                {seriesVideo.releaseYear}
                {seasonLabels ? ` / ${seasonLabels}` : ` / ${seriesVideo.runtime}`}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function WatchPage() {
  const { id } = useParams();
  const video = getVideoById(id);
  const settings = useMediaStore((state) => state.settings);
  const watchlistIds = useMediaStore((state) => state.watchlistIds);
  const continueEntry = useMediaStore((state) => (id ? state.continueWatching[id] : undefined));
  const setActiveMirror = useMediaStore((state) => state.setActiveMirror);
  const toggleWatchlist = useMediaStore((state) => state.toggleWatchlist);
  const recordContinueWatching = useMediaStore((state) => state.recordContinueWatching);

  const initialSeason = video?.kind === "tv" ? video.seasons?.[0]?.season ?? 1 : 1;
  const [selectedSeason, setSelectedSeason] = useState(continueEntry?.season ?? initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(continueEntry?.episode ?? 1);
  const [confirmedUrl, setConfirmedUrl] = useState<string | null>(null);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [playerRefreshNonce, setPlayerRefreshNonce] = useState(0);

  const activeMirror = getActiveMirror(settings);
  const enabledMirrors = settings.mirrors.filter((mirror) => mirror.enabled);
  const playbackMirrors = enabledMirrors.length ? enabledMirrors : [activeMirror];
  const sameSeriesVideos = video ? getSameSeriesVideos(video) : [];
  const embedUrl = useMemo(() => {
    if (!video) {
      return null;
    }

    try {
      return buildVidSrcUrl(activeMirror, video, selectedSeason, selectedEpisode, {
        autoplay: false,
        autonext: false,
        lookupSource: settings.vidSrcLookupSource,
      });
    } catch {
      return null;
    }
  }, [
    activeMirror.baseUrl,
    activeMirror.urlFormat,
    selectedEpisode,
    selectedSeason,
    settings.vidSrcLookupSource,
    video,
  ]);

  useEffect(() => {
    if (!video) {
      return;
    }

    const firstSeason = video.kind === "tv" ? video.seasons?.[0]?.season ?? 1 : 1;
    setSelectedSeason(continueEntry?.season ?? firstSeason);
    setSelectedEpisode(continueEntry?.episode ?? 1);
  }, [continueEntry?.episode, continueEntry?.season, video]);

  useEffect(() => {
    setConfirmedUrl(settings.warnBeforeExternalPlayer ? null : embedUrl);
    setDismissedWarning(false);
    setExternalError(null);
  }, [embedUrl, settings.warnBeforeExternalPlayer]);

  useEffect(() => {
    if (!video || !embedUrl) {
      return;
    }

    const lookup = getVidSrcLookupId(video, settings.vidSrcLookupSource);

    debugLog("watch", "Embed URL prepared.", {
      title: video.title,
      kind: video.kind,
      imdbId: video.imdbId,
      tmdbId: video.tmdbId,
      lookupSourceSetting: settings.vidSrcLookupSource,
      lookup,
      mirror: {
        id: activeMirror.id,
        label: activeMirror.label,
        baseUrl: activeMirror.baseUrl,
        urlFormat: activeMirror.urlFormat,
      },
      season: video.kind === "tv" ? selectedSeason : undefined,
      episode: video.kind === "tv" ? selectedEpisode : undefined,
      url: embedUrl,
      warningEnabled: settings.warnBeforeExternalPlayer,
    });
  }, [
    activeMirror.baseUrl,
    activeMirror.id,
    activeMirror.label,
    activeMirror.urlFormat,
    embedUrl,
    selectedEpisode,
    selectedSeason,
    settings.warnBeforeExternalPlayer,
    settings.vidSrcLookupSource,
    video,
  ]);

  if (!video) {
    return <Navigate to="/" replace />;
  }

  const isInWatchlist = watchlistIds.includes(video.id);
  const playerUrl = embedUrl && confirmedUrl === embedUrl ? embedUrl : null;
  const playerFrameKey = playerUrl
    ? [
        activeMirror.id,
        video.id,
        video.kind === "tv" ? selectedSeason : "movie",
        video.kind === "tv" ? selectedEpisode : "feature",
        playerRefreshNonce,
      ].join(":")
    : "locked-player";
  const shouldShowWarning =
    Boolean(embedUrl) &&
    settings.warnBeforeExternalPlayer &&
    confirmedUrl !== embedUrl &&
    !dismissedWarning;

  const recordPlayback = () => {
    recordContinueWatching({
      videoId: video.id,
      updatedAt: Date.now(),
      season: video.kind === "tv" ? selectedSeason : undefined,
      episode: video.kind === "tv" ? selectedEpisode : undefined,
      mirrorId: activeMirror.id,
    });
  };

  const loadSandboxedPlayer = () => {
    if (!embedUrl) {
      return;
    }

    debugLog("watch", "User accepted warning; mounting sandboxed player.", {
      url: embedUrl,
      mirrorId: activeMirror.id,
      frameKey: playerFrameKey,
    }, "success");
    setConfirmedUrl(embedUrl);
    setDismissedWarning(false);
    setPlayerRefreshNonce((currentNonce) => currentNonce + 1);
    recordPlayback();
  };

  const retrySandboxedPlayer = () => {
    if (!embedUrl) {
      return;
    }

    debugLog("watch", "Retrying sandboxed iframe.", {
      url: embedUrl,
      mirrorId: activeMirror.id,
      previousFrameKey: playerFrameKey,
    }, "warn");
    setConfirmedUrl(null);
    setPlayerRefreshNonce((currentNonce) => currentNonce + 1);
    window.setTimeout(() => setConfirmedUrl(embedUrl), 0);
  };

  const openInTauriPlayerWindow = async () => {
    if (!embedUrl) {
      return;
    }

    try {
      setExternalError(null);
      debugLog("watch", "Open in Tauri Player Window clicked.", {
        url: embedUrl,
        mirrorId: activeMirror.id,
      });
      await openPlayerWebviewWindow(embedUrl, video.title);
      recordPlayback();
    } catch (error) {
      debugLog("watch", "Tauri player window failed.", error, "error");
      setExternalError(getErrorMessage(error));
    }
  };

  const openInBrowser = async () => {
    if (!embedUrl) {
      return;
    }

    try {
      setExternalError(null);
      debugLog("watch", "Open in External Browser clicked.", {
        url: embedUrl,
        mirrorId: activeMirror.id,
      });
      await openExternalUrl(embedUrl);
      debugLog("watch", "Tauri opener resolved.", {
        url: embedUrl,
      }, "success");
      recordPlayback();
    } catch (error) {
      debugLog("watch", "Tauri opener failed.", error, "error");
      setExternalError(getErrorMessage(error));
    }
  };

  const changeEpisode = (season: number, episode: number) => {
    debugLog("watch", "Episode changed.", {
      previous: {
        season: selectedSeason,
        episode: selectedEpisode,
      },
      next: {
        season,
        episode,
      },
    });
    setSelectedSeason(season);
    setSelectedEpisode(episode);
  };

  const changeMirror = (mirrorId: string) => {
    const nextMirror = playbackMirrors.find((mirror) => mirror.id === mirrorId);

    debugLog("watch", "Mirror changed.", {
      previousMirror: activeMirror,
      nextMirror,
    });
    setActiveMirror(mirrorId);
    setPlayerRefreshNonce((currentNonce) => currentNonce + 1);
  };

  const tryNextMirror = () => {
    if (playbackMirrors.length < 2) {
      return;
    }

    const currentIndex = playbackMirrors.findIndex((mirror) => mirror.id === activeMirror.id);
    const nextMirror = playbackMirrors[(currentIndex + 1) % playbackMirrors.length];

    if (nextMirror) {
      debugLog("watch", "Trying next mirror.", {
        currentMirror: activeMirror,
        nextMirror,
      }, "warn");
      changeMirror(nextMirror.id);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.playerColumn}>
        {embedUrl ? (
          <PlayerFrame
            src={playerUrl}
            frameKey={playerFrameKey}
            title={video.title}
            onReviewWarning={() => setDismissedWarning(false)}
            onRetry={retrySandboxedPlayer}
          />
        ) : (
          <div className={styles.configError}>
            <h2>Mirror configuration needs attention</h2>
            <p>The active mirror URL is invalid. Update it in Settings.</p>
            <Link to="/settings">
              <Settings size={17} aria-hidden="true" />
              <span>Open Settings</span>
            </Link>
          </div>
        )}

        {externalError ? <p className={styles.errorText}>{externalError}</p> : null}

        <p className={styles.playerHint}>
          If VidSrc reports that this media is unavailable, the embed loaded correctly but that
          mirror does not currently have the title. Try another mirror in Settings or use the
          external browser fallback.
        </p>

        <div className={styles.playerActions}>
          <label className={styles.mirrorControl}>
            <span>Mirror</span>
            <select
              value={activeMirror.id}
              onChange={(event) => changeMirror(event.currentTarget.value)}
              aria-label="VidSrc mirror"
            >
              {playbackMirrors.map((mirror) => (
                <option key={mirror.id} value={mirror.id}>
                  {mirror.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={tryNextMirror} disabled={playbackMirrors.length < 2}>
            <RotateCcw size={17} aria-hidden="true" />
            <span>Try Next Mirror</span>
          </button>
          <button type="button" onClick={openInBrowser} disabled={!embedUrl}>
            <ExternalLink size={17} aria-hidden="true" />
            <span>Open in External Browser</span>
          </button>
          <button type="button" onClick={openInTauriPlayerWindow} disabled={!embedUrl}>
            <MonitorPlay size={17} aria-hidden="true" />
            <span>Open in Tauri Player Window</span>
          </button>
          <button
            type="button"
            className={isInWatchlist ? styles.savedButton : ""}
            onClick={() => toggleWatchlist(video.id)}
            aria-pressed={isInWatchlist}
          >
            {isInWatchlist ? (
              <Check size={17} aria-hidden="true" />
            ) : (
              <Heart size={17} aria-hidden="true" />
            )}
            <span>{isInWatchlist ? "Saved" : "Watchlist"}</span>
          </button>
        </div>

        <EpisodeSelector
          video={video}
          selectedSeason={selectedSeason}
          selectedEpisode={selectedEpisode}
          onChange={changeEpisode}
        />

        <SameSeriesSection currentVideo={video} videos={sameSeriesVideos} />
      </section>

      <aside className={styles.detailsPanel}>
        <PosterImage video={video} className={styles.poster} eager />

        <div className={styles.metadata}>
          <p className={styles.kicker}>{video.kind === "tv" ? "Series" : "Movie"}</p>
          <h1>{video.title}</h1>
          <div className={styles.facts}>
            <span>{video.year}</span>
            <span>{video.runtime}</span>
            <span>{video.rating}</span>
          </div>
          <p>{video.synopsis}</p>
          <div className={styles.genres}>
            {video.genres.map((genre) => (
              <span key={genre}>{genre}</span>
            ))}
          </div>
          <div className={styles.mirrorBox}>
            <span>Active mirror</span>
            <strong>{activeMirror.label}</strong>
            <code>{activeMirror.baseUrl}</code>
            <span>Lookup source</span>
            <strong>{getVidSrcLookupId(video, settings.vidSrcLookupSource).source}</strong>
            <code>{getVidSrcLookupId(video, settings.vidSrcLookupSource).sourceUrl}</code>
            <span>Lookup ID</span>
            <code>{getVidSrcLookupId(video, settings.vidSrcLookupSource).value}</code>
          </div>
        </div>
      </aside>

      {shouldShowWarning && embedUrl ? (
        <WarningModal
          video={video}
          mirror={activeMirror}
          url={embedUrl}
          onAccept={loadSandboxedPlayer}
          onCancel={() => setDismissedWarning(true)}
          onOpenExternal={openInBrowser}
        />
      ) : null}
    </div>
  );
}
