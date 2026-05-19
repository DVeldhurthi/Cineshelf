import { ArrowLeft, ExternalLink, MonitorPlay, RefreshCcw, Settings } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { debugLog } from "../store/useDebugStore";
import { getEnabledAnimeApiSources, useMediaStore } from "../store/useMediaStore";
import type {
  AnimeApiSource,
  AnimeEpisodeGroup,
  AnimeMedia,
  AnimeStream,
  AnimeStreamsResponse,
} from "../types/anime";
import { filterMatureAnime, isMatureAnime } from "../utils/animeContentSafety";
import {
  fetchAnimeEpisodes,
  fetchAnimeInfo,
  fetchAnimeSameSeries,
  fetchAnimeStreams,
  isAnimeRequestAbortError,
} from "../utils/miruro";
import { openAnimePlayerWindow } from "../utils/openAnimePlayer";
import { openExternalUrl } from "../utils/openExternal";
import styles from "./AnimeWatchPage.module.css";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to load anime playback.";

const getGroupKey = (group: AnimeEpisodeGroup) => `${group.provider}:${group.category}`;

const pickPreferredStream = (streams: AnimeStream[]) =>
  [...streams].sort((first, second) => {
    const firstQuality = Number.parseInt(first.quality ?? "0", 10) || 0;
    const secondQuality = Number.parseInt(second.quality ?? "0", 10) || 0;
    return secondQuality - firstQuality;
  })[0];

const buildEpisodeStreamSources = (
  episode: { apiBaseUrl?: string; apiProvider?: AnimeApiSource["provider"]; apiProviderKey?: string; provider: string },
  animeApiSources: AnimeApiSource[],
) => {
  const primarySource =
    episode.apiBaseUrl && episode.apiProvider
      ? ({
          baseUrl: episode.apiBaseUrl,
          provider: episode.apiProvider,
          providerKey: episode.apiProviderKey,
          label: episode.provider,
        } satisfies AnimeApiSource)
      : null;
  const fallbackSources = animeApiSources
    .filter(
      (source) =>
        !primarySource ||
        source.baseUrl !== primarySource.baseUrl ||
        source.provider !== primarySource.provider,
    )
    .map((source) =>
      source.provider === "consumet" && episode.apiProviderKey
        ? { ...source, providerKey: episode.apiProviderKey }
        : source,
    );

  return primarySource ? [primarySource, ...fallbackSources] : fallbackSources;
};

const isTopLevelEmbedStream = (stream: AnimeStream) => {
  if (stream.type === "embed" || stream.quality === "embed") {
    return true;
  }

  try {
    const url = new URL(stream.url.replace(/^src=/i, ""));
    return ["gogoanime.com.by", "megaplay.buzz", "megacloud.blog"].some((host) =>
      url.hostname.includes(host),
    );
  } catch {
    return false;
  }
};

type AnimeLocationState = {
  anime?: AnimeMedia;
};

function AnimeSameSeriesCard({ anime }: { anime: AnimeMedia }) {
  const [posterFailed, setPosterFailed] = useState(false);
  const showPoster = Boolean(anime.poster && !posterFailed);

  return (
    <Link
      to={`/anime/${anime.id}`}
      state={{ anime }}
      className={styles.seriesCard}
    >
      <div className={styles.seriesPoster}>
        {showPoster ? (
          <img
            src={anime.poster}
            alt={`${anime.title} poster`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <span className={styles.seriesPosterFallback}>{anime.title}</span>
        )}
        {anime.relationType ? (
          <span className={styles.seriesBadge}>{anime.relationType}</span>
        ) : null}
      </div>
      <span className={styles.seriesTitle}>{anime.title}</span>
      <span className={styles.seriesMeta}>
        {[anime.releaseYear, anime.format, anime.episodes ? `${anime.episodes} eps` : null]
          .filter(Boolean)
          .join(" / ")}
      </span>
    </Link>
  );
}

function AnimeSameSeriesSection({ anime }: { anime: AnimeMedia[] }) {
  if (!anime.length) {
    return null;
  }

  return (
    <section className={styles.sameSeries} aria-labelledby="anime-same-series-heading">
      <div className={styles.sameSeriesHeader}>
        <div>
          <p>Related anime</p>
          <h2 id="anime-same-series-heading">From same series</h2>
        </div>
        <span>{anime.length}</span>
      </div>

      <div className={styles.sameSeriesScroller}>
        {anime.map((relatedAnime) => (
          <AnimeSameSeriesCard key={relatedAnime.id} anime={relatedAnime} />
        ))}
      </div>
    </section>
  );
}

export function AnimeWatchPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useMediaStore((state) => state.settings);
  const animeApiSources = useMemo(() => getEnabledAnimeApiSources(settings), [settings]);
  const routeStateAnime = (location.state as AnimeLocationState | null)?.anime;
  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [groups, setGroups] = useState<AnimeEpisodeGroup[]>([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState("");
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sameSeriesAnime, setSameSeriesAnime] = useState<AnimeMedia[]>([]);
  const [streamLoading, setStreamLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const streamRequestRef = useRef<AbortController | null>(null);
  const detailSources = useMemo(() => {
    const routeStateSource =
      routeStateAnime?.apiBaseUrl && routeStateAnime.apiProvider
        ? ({
            id: routeStateAnime.sourceId,
            label: routeStateAnime.apiProvider,
            baseUrl: routeStateAnime.apiBaseUrl,
            provider: routeStateAnime.apiProvider,
            providerKey: routeStateAnime.apiProviderKey,
          } satisfies AnimeApiSource)
        : null;

    if (!routeStateSource) {
      return animeApiSources;
    }

    return [
      routeStateSource,
      ...animeApiSources.filter(
        (source) =>
          source.baseUrl !== routeStateSource.baseUrl ||
          source.provider !== routeStateSource.provider ||
          source.providerKey !== routeStateSource.providerKey,
      ),
    ];
  }, [animeApiSources, routeStateAnime]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const requestOptions = { signal: controller.signal };

    const loadAnime = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextAnime = await fetchAnimeInfo(detailSources, id, requestOptions).catch((infoError) => {
          if (isAnimeRequestAbortError(infoError)) {
            throw infoError;
          }

          if (routeStateAnime?.id === id) {
            debugLog("anime", "Using route-state anime details after API detail lookup failed.", infoError, "warn");
            return routeStateAnime;
          }

          throw infoError;
        });
        if (!settings.showMatureAnimeSection && isMatureAnime(nextAnime)) {
          throw new Error("This anime is hidden by the mature anime setting.");
        }
        const [nextGroups, nextSameSeriesAnime] = await Promise.all([
          fetchAnimeEpisodes(animeApiSources, id, nextAnime, requestOptions).catch((episodesError) => {
            if (isAnimeRequestAbortError(episodesError)) {
              throw episodesError;
            }

            debugLog("anime", "Anime episode providers were unavailable.", episodesError, "warn");
            return [];
          }),
          fetchAnimeSameSeries(detailSources, id, requestOptions).catch((sameSeriesError) => {
            if (isAnimeRequestAbortError(sameSeriesError)) {
              throw sameSeriesError;
            }

            debugLog("anime", "Same-series anime lookup failed.", sameSeriesError, "warn");
            return [];
          }),
        ]);

        if (!cancelled) {
          const firstGroup = nextGroups[0];
          setAnime(nextAnime);
          setGroups(nextGroups);
          setSameSeriesAnime(filterMatureAnime(nextSameSeriesAnime, settings.showMatureAnimeSection));
          setSelectedGroupKey(firstGroup ? getGroupKey(firstGroup) : "");
          setSelectedEpisodeId(firstGroup?.episodes[0]?.id ?? "");
        }
      } catch (loadError) {
        if (!cancelled && !isAnimeRequestAbortError(loadError)) {
          setError(getErrorMessage(loadError));
          setAnime(null);
          setGroups([]);
          setSameSeriesAnime([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAnime();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [detailSources, id, routeStateAnime, settings.showMatureAnimeSection]);

  useEffect(() => {
    return () => {
      streamRequestRef.current?.abort();
      streamRequestRef.current = null;
    };
  }, [id, selectedEpisodeId, selectedGroupKey]);

  const selectedGroup = useMemo(
    () => groups.find((group) => getGroupKey(group) === selectedGroupKey) ?? groups[0],
    [groups, selectedGroupKey],
  );
  const selectedEpisode = selectedGroup?.episodes.find((episode) => episode.id === selectedEpisodeId);

  if (!id) {
    return <Navigate to="/anime" replace />;
  }

  const createStreamRequest = () => {
    streamRequestRef.current?.abort();
    const controller = new AbortController();
    streamRequestRef.current = controller;
    return controller;
  };

  const clearStreamRequest = (controller: AbortController) => {
    if (streamRequestRef.current === controller) {
      streamRequestRef.current = null;
    }
  };

  const getStreams = async (signal?: AbortSignal): Promise<AnimeStreamsResponse> => {
    if (!selectedEpisode) {
      throw new Error("Select an episode before opening the anime player.");
    }

    debugLog("anime", "Fetching anime stream sources.", {
      animeId: id,
      episodeId: selectedEpisode.id,
      provider: selectedEpisode.provider,
      category: selectedEpisode.category,
    });

    const streamSources = buildEpisodeStreamSources(selectedEpisode, animeApiSources);
    const requestOptions = { signal };
    let streams: AnimeStreamsResponse;

    try {
      streams = await fetchAnimeStreams(streamSources, selectedEpisode.id, requestOptions);
    } catch (streamLookupError) {
      const alternativeSources = animeApiSources.filter(
        (source) => source.provider === "anipub" || source.provider === "consumet",
      );

      if (
        !anime ||
        selectedEpisode.apiProvider === "anipub" ||
        selectedEpisode.apiProvider === "consumet" ||
        !alternativeSources.length
      ) {
        throw streamLookupError;
      }

      debugLog("anime", "Primary anime stream failed; trying alternate anime episode fallback.", {
        title: anime.title,
        episodeNumber: selectedEpisode.number,
        error: getErrorMessage(streamLookupError),
      }, "warn");

      const fallbackGroups = await fetchAnimeEpisodes(alternativeSources, id, anime, requestOptions);
      const fallbackEpisode = fallbackGroups
        .flatMap((group) => group.episodes)
        .find((episode) => episode.number === selectedEpisode.number);

      if (!fallbackEpisode) {
        throw streamLookupError;
      }

      streams = await fetchAnimeStreams(
        buildEpisodeStreamSources(fallbackEpisode, alternativeSources),
        fallbackEpisode.id,
        requestOptions,
      );
    }

    if (!streams.streams.length) {
      throw new Error("No playable streams were returned for this episode/server.");
    }

    return streams;
  };

  const getTopLevelEmbedStreams = async (signal?: AbortSignal): Promise<AnimeStreamsResponse | null> => {
    if (!anime || !selectedEpisode) {
      return null;
    }

    const requestOptions = { signal };

    if (selectedEpisode.apiProvider === "anipub") {
      const streams = await fetchAnimeStreams(
        buildEpisodeStreamSources(selectedEpisode, animeApiSources),
        selectedEpisode.id,
        requestOptions,
      );

      return streams.streams.some(isTopLevelEmbedStream) ? streams : null;
    }

    const embedSources = animeApiSources.filter((source) => source.provider === "anipub");

    if (!embedSources.length) {
      return null;
    }

    const embedGroups = await fetchAnimeEpisodes(embedSources, id, anime, requestOptions);
    const embedEpisode = embedGroups
      .flatMap((group) => group.episodes)
      .find((episode) => episode.number === selectedEpisode.number);

    if (!embedEpisode) {
      return null;
    }

    const streams = await fetchAnimeStreams(
      buildEpisodeStreamSources(embedEpisode, embedSources),
      embedEpisode.id,
      requestOptions,
    );

    return streams.streams.some(isTopLevelEmbedStream) ? streams : null;
  };

  const openInTauriPlayer = async () => {
    if (!anime || !selectedEpisode) {
      return;
    }

    const controller = createStreamRequest();

    try {
      setStreamLoading(true);
      setStreamError(null);
      const streams = (await getTopLevelEmbedStreams(controller.signal).catch((embedError) => {
        if (isAnimeRequestAbortError(embedError)) {
          throw embedError;
        }

        debugLog("anime", "Top-level anime embed fallback was unavailable.", embedError, "warn");
        return null;
      })) ?? (await getStreams(controller.signal));
      if (controller.signal.aborted) {
        return;
      }

      const stream = pickPreferredStream(streams.streams);

      await openAnimePlayerWindow(
        stream.url,
        `${anime.title} - Episode ${selectedEpisode.number}`,
        selectedEpisode.image ?? anime.backdrop ?? anime.poster,
        streams.subtitles,
        isTopLevelEmbedStream(stream),
      );
      debugLog("anime", "Anime Tauri player opened.", {
        title: anime.title,
        episode: selectedEpisode.number,
        stream,
      }, "success");
    } catch (playError) {
      if (!isAnimeRequestAbortError(playError)) {
        setStreamError(getErrorMessage(playError));
        debugLog("anime", "Anime Tauri player failed.", playError, "error");
      }
    } finally {
      if (streamRequestRef.current === controller) {
        setStreamLoading(false);
      }
      clearStreamRequest(controller);
    }
  };

  const openInBrowser = async () => {
    const controller = createStreamRequest();

    try {
      setStreamLoading(true);
      setStreamError(null);
      const streams = await getStreams(controller.signal);
      if (controller.signal.aborted) {
        return;
      }

      const stream = pickPreferredStream(streams.streams);
      await openExternalUrl(stream.url);
    } catch (playError) {
      if (!isAnimeRequestAbortError(playError)) {
        setStreamError(getErrorMessage(playError));
        debugLog("anime", "Anime external fallback failed.", playError, "error");
      }
    } finally {
      if (streamRequestRef.current === controller) {
        setStreamLoading(false);
      }
      clearStreamRequest(controller);
    }
  };

  const changeGroup = (groupKey: string) => {
    const nextGroup = groups.find((group) => getGroupKey(group) === groupKey);
    streamRequestRef.current?.abort();
    setSelectedGroupKey(groupKey);
    setSelectedEpisodeId(nextGroup?.episodes[0]?.id ?? "");
    setStreamError(null);
  };

  const goBack = () => {
    if (location.key === "default") {
      navigate("/anime", { replace: true });
      return;
    }

    navigate(-1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.backBar}>
        <button type="button" onClick={goBack}>
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Back</span>
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading anime details...</div>
      ) : error ? (
        <section className={styles.errorPanel}>
          <h1>Anime API unavailable</h1>
          <p>{error}</p>
          <Link to="/settings">
            <Settings size={17} aria-hidden="true" />
            <span>Update Anime API Mirrors</span>
          </Link>
        </section>
      ) : anime ? (
        <>
          <section className={styles.hero} style={{ "--backdrop": `url("${anime.backdrop}")` } as CSSProperties}>
            <div className={styles.poster} style={{ "--poster": `url("${anime.poster}")` } as CSSProperties} />
            <div className={styles.heroContent}>
              <p>Anime sources</p>
              <h1>{anime.title}</h1>
              <div className={styles.facts}>
                {anime.releaseYear ? <span>{anime.releaseYear}</span> : null}
                <span>{anime.format}</span>
                {anime.status ? <span>{anime.status.replace(/_/g, " ")}</span> : null}
                {anime.score ? <span>{anime.score}%</span> : null}
              </div>
              <p className={styles.description}>{anime.description || "No description available."}</p>
              <div className={styles.genres}>
                {anime.genres.slice(0, 6).map((genre) => (
                  <span key={genre}>{genre}</span>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.playback}>
            <div className={styles.playbackHeader}>
              <div>
                <p>Now playing</p>
                <h2>{selectedEpisode ? `Episode ${selectedEpisode.number}` : "No episodes"}</h2>
              </div>
              <label>
                <span>Server</span>
                <select
                  value={selectedGroup ? getGroupKey(selectedGroup) : ""}
                  onChange={(event) => changeGroup(event.currentTarget.value)}
                >
                  {groups.map((group) => (
                    <option key={getGroupKey(group)} value={getGroupKey(group)}>
                      {group.label} / {group.episodes.length} eps
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={openInTauriPlayer} disabled={!selectedEpisode || streamLoading}>
                <MonitorPlay size={17} aria-hidden="true" />
                <span>{streamLoading ? "Preparing Stream" : "Open in Tauri Player Window"}</span>
              </button>
              <button type="button" onClick={openInBrowser} disabled={!selectedEpisode || streamLoading}>
                <ExternalLink size={17} aria-hidden="true" />
                <span>Open in External Browser</span>
              </button>
              <button type="button" onClick={() => window.location.reload()}>
                <RefreshCcw size={17} aria-hidden="true" />
                <span>Reload Anime</span>
              </button>
            </div>

            {streamError ? <p className={styles.streamError}>{streamError}</p> : null}

            {!selectedEpisode ? (
              <p className={styles.streamError}>
                No episode providers were returned for this title. The app tried the configured
                anime API mirrors; add another anime API mirror in Settings if this source is missing.
              </p>
            ) : null}

            {selectedEpisode ? (
              <article className={styles.episodeSummary}>
                {selectedEpisode.image ? <img src={selectedEpisode.image} alt="" /> : null}
                <div>
                  <strong>{selectedEpisode.title}</strong>
                  {selectedEpisode.description ? <p>{selectedEpisode.description}</p> : null}
                </div>
              </article>
            ) : null}

            <div className={styles.episodeGrid}>
              {selectedGroup?.episodes.map((episode) => (
                <button
                  key={episode.id}
                  type="button"
                  className={episode.id === selectedEpisodeId ? styles.activeEpisode : ""}
                  onClick={() => {
                    streamRequestRef.current?.abort();
                    setSelectedEpisodeId(episode.id);
                    setStreamError(null);
                  }}
                  aria-pressed={episode.id === selectedEpisodeId}
                  title={episode.title}
                >
                  {episode.number}
                </button>
              ))}
            </div>

            <AnimeSameSeriesSection anime={sameSeriesAnime} />
          </section>
        </>
      ) : null}
    </div>
  );
}
