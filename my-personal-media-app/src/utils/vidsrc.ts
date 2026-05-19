import type { AppSettings, VidSrcLookupSource, VidSrcMirror, Video } from "../types/video";

export const DEFAULT_MIRRORS: VidSrcMirror[] = [
  {
    id: "vidsrc-embed-ru",
    label: "VidSrc Embed",
    baseUrl: "https://vidsrc-embed.ru",
    urlFormat: "path",
    enabled: true,
  },
  {
    id: "vidsrc-embed-su",
    label: "VidSrc Embed SU",
    baseUrl: "https://vidsrc-embed.su",
    urlFormat: "path",
    enabled: true,
  },
  {
    id: "vidsrcme-su",
    label: "VidSrcMe SU",
    baseUrl: "https://vidsrcme.su",
    urlFormat: "path",
    enabled: true,
  },
  {
    id: "vsrc-su",
    label: "VSrc.su",
    baseUrl: "https://vsrc.su",
    urlFormat: "path",
    enabled: true,
  },
  {
    id: "vidsrc-to",
    label: "VidSrc.to",
    baseUrl: "https://vidsrc.to",
    urlFormat: "legacyPath",
    enabled: true,
  },
  {
    id: "vidsrc-me",
    label: "VidSrc.me",
    baseUrl: "https://vidsrc.me",
    urlFormat: "legacyPath",
    enabled: true,
  },
  {
    id: "vidsrcme-ru",
    label: "VidSrcMe.ru",
    baseUrl: "https://vidsrcme.ru",
    urlFormat: "legacyPath",
    enabled: true,
  },
];

type BuildVidSrcUrlOptions = {
  autoplay?: boolean;
  autonext?: boolean;
  lookupSource?: VidSrcLookupSource;
};

type VidSrcLookup = {
  key: "imdb" | "tmdb";
  value: string;
  mode: "imdb" | "tmdb";
  source: "IMDb.com" | "TheMovieDB.org";
  sourceUrl: string;
};

export const normalizeBaseUrl = (input: string) => {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Mirror URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);

  if (url.protocol !== "https:") {
    throw new Error("Mirror URLs must use HTTPS.");
  }

  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
};

const canonicalVidSrcHosts: Record<string, string> = {
  "vidsrc-embed.ru": "vsembed.ru",
  "vidsrc-embed.su": "vsembed.ru",
  "vsrc.su": "vsembed.ru",
  "vidsrc.me": "vidsrcme.ru",
};

export const canonicalizeKnownVidSrcUrl = (input: string) => {
  const url = new URL(input);
  const canonicalHost = canonicalVidSrcHosts[url.hostname.toLowerCase()];

  if (canonicalHost) {
    url.hostname = canonicalHost;
  }

  return url.toString();
};

export const inferUrlFormat = (baseUrl: string): VidSrcMirror["urlFormat"] => {
  try {
    const url = new URL(normalizeBaseUrl(baseUrl));
    return ["vidsrc-embed.ru", "vidsrc-embed.su", "vidsrcme.su", "vsrc.su", "vsembed.ru"].includes(
      url.hostname,
    )
      ? "path"
      : "legacyPath";
  } catch {
    return "legacyPath";
  }
};

const getEmbedEndpoint = (baseUrl: string, video: Video) => {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const endpointType = video.kind === "tv" ? "tv" : "movie";
  const endpointUrl = new URL(normalizedBase);
  const cleanPath = endpointUrl.pathname.replace(/\/+$/, "");

  if (/\/embed\/(movie|tv)$/i.test(cleanPath)) {
    endpointUrl.pathname = cleanPath.replace(/\/embed\/(movie|tv)$/i, `/embed/${endpointType}`);
  } else if (/\/embed$/i.test(cleanPath)) {
    endpointUrl.pathname = `${cleanPath}/${endpointType}`;
  } else {
    endpointUrl.pathname = `${cleanPath}/embed/${endpointType}`;
  }

  endpointUrl.search = "";
  endpointUrl.hash = "";

  return endpointUrl;
};

const addPlaybackParams = (url: string, video: Video, options: BuildVidSrcUrlOptions) => {
  const outputUrl = new URL(url);
  outputUrl.searchParams.set("autoplay", options.autoplay ? "1" : "0");

  if (video.kind === "tv") {
    outputUrl.searchParams.set("autonext", options.autonext ? "1" : "0");
  }

  return outputUrl.toString();
};

const buildImdbSourceUrl = (imdbId: string) => `https://www.imdb.com/title/${imdbId}/`;

const buildTmdbSourceUrl = (video: Video) => {
  if (!video.tmdbId) {
    return null;
  }

  const mediaType = video.kind === "tv" ? "tv" : "movie";
  return `https://www.themoviedb.org/${mediaType}/${video.tmdbId}`;
};

const getImdbIdFromSource = (video: Video) => {
  if (!video.imdbUrl) {
    return video.imdbId;
  }

  try {
    const url = new URL(video.imdbUrl);
    const match = url.pathname.match(/\/title\/(tt\d+)/i);
    return match?.[1] ?? video.imdbId;
  } catch {
    return video.imdbId;
  }
};

const getTmdbIdFromSource = (video: Video) => {
  if (!video.tmdbUrl) {
    return video.tmdbId;
  }

  try {
    const url = new URL(video.tmdbUrl);
    const match = url.pathname.match(/\/(?:movie|tv)\/(\d+)/i);
    return match?.[1] ?? video.tmdbId;
  } catch {
    return video.tmdbId;
  }
};

export const getVideoLookupSources = (video: Video) => {
  const imdbValue = getImdbIdFromSource(video);
  const tmdbValue = getTmdbIdFromSource(video);

  return {
    imdb: {
      key: "imdb",
      value: imdbValue,
      mode: "imdb",
      source: "IMDb.com",
      sourceUrl: video.imdbUrl ?? buildImdbSourceUrl(imdbValue),
    } satisfies VidSrcLookup,
    tmdb: tmdbValue
      ? ({
          key: "tmdb",
          value: tmdbValue,
          mode: "tmdb",
          source: "TheMovieDB.org",
          sourceUrl: video.tmdbUrl ?? buildTmdbSourceUrl(video) ?? "",
        } satisfies VidSrcLookup)
      : null,
  };
};

export const getVidSrcLookupId = (
  video: Video,
  lookupSource: VidSrcLookupSource = "auto",
): VidSrcLookup => {
  const sources = getVideoLookupSources(video);

  if (lookupSource === "tmdb" && sources.tmdb) {
    return sources.tmdb;
  }

  if (lookupSource === "imdb" || !sources.tmdb) {
    return sources.imdb;
  }

  return sources.tmdb;
};

export const buildVidSrcUrl = (
  mirrorOrBaseUrl: VidSrcMirror | string,
  video: Video,
  season?: number,
  episode?: number,
  options: BuildVidSrcUrlOptions = {},
) => {
  const mirror =
    typeof mirrorOrBaseUrl === "string"
      ? {
          baseUrl: mirrorOrBaseUrl,
          urlFormat: inferUrlFormat(mirrorOrBaseUrl),
        }
      : mirrorOrBaseUrl;
  const endpoint = getEmbedEndpoint(mirror.baseUrl, video);
  const urlFormat = mirror.urlFormat ?? inferUrlFormat(mirror.baseUrl);
  const tvSeason = season ?? video.seasons?.[0]?.season ?? 1;
  const tvEpisode = episode ?? 1;
  const autoplay = options.autoplay ?? false;
  const lookup = getVidSrcLookupId(video, options.lookupSource);

  if (urlFormat === "query") {
    endpoint.searchParams.set(lookup.key, lookup.value);
    endpoint.searchParams.set("autoplay", autoplay ? "1" : "0");

    if (video.kind === "tv") {
      endpoint.searchParams.set("season", String(tvSeason));
      endpoint.searchParams.set("episode", String(tvEpisode));
      endpoint.searchParams.set("autonext", options.autonext ? "1" : "0");
    }

    return canonicalizeKnownVidSrcUrl(endpoint.toString());
  }

  if (video.kind === "tv") {
    if (urlFormat === "legacyPath") {
      return canonicalizeKnownVidSrcUrl(addPlaybackParams(
        `${endpoint.origin}${endpoint.pathname}/${lookup.value}/${tvSeason}/${tvEpisode}`,
        video,
        {
          autoplay,
          autonext: options.autonext,
        },
      ));
    }

    return canonicalizeKnownVidSrcUrl(addPlaybackParams(
      `${endpoint.origin}${endpoint.pathname}/${lookup.value}/${tvSeason}-${tvEpisode}`,
      video,
      {
        autoplay,
        autonext: options.autonext,
      },
    ));
  }

  return canonicalizeKnownVidSrcUrl(
    addPlaybackParams(`${endpoint.origin}${endpoint.pathname}/${lookup.value}`, video, {
      autoplay,
    }),
  );
};

export const getActiveMirror = (settings: AppSettings) => {
  const enabledMirrors = settings.mirrors.filter((mirror) => mirror.enabled);
  return (
    enabledMirrors.find((mirror) => mirror.id === settings.activeMirrorId) ??
    enabledMirrors[0] ??
    DEFAULT_MIRRORS[0]
  );
};

export const isDefaultMirror = (mirror: VidSrcMirror) =>
  DEFAULT_MIRRORS.some((defaultMirror) => defaultMirror.baseUrl === mirror.baseUrl);
