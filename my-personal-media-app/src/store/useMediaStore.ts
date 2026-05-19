import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AnimeApiMirror, AnimeApiProvider, AnimeApiSource } from "../types/anime";
import type {
  AppSettings,
  ContinueWatchingEntry,
  VidSrcLookupSource,
  VidSrcMirror,
} from "../types/video";
import { DEFAULT_MIRRORS, inferUrlFormat, normalizeBaseUrl } from "../utils/vidsrc";

export const DEFAULT_MIRURO_API_BASE_URL = "https://api.miruro.com";
export const DEFAULT_ACTIVE_MIRURO_API_BASE_URL = "https://api.jikan.moe/v4";
export const DEFAULT_ACTIVE_ANIME_API_MIRROR_ID = "jikan";
export const DEFAULT_MIRURO_API_MIRRORS: AnimeApiMirror[] = [
  {
    id: "jikan",
    label: "Jikan / MyAnimeList",
    baseUrl: "https://api.jikan.moe/v4",
    provider: "jikan",
    enabled: true,
  },
  {
    id: "miruro-vercel",
    label: "Miruro Vercel",
    baseUrl: "https://miruro-api.vercel.app",
    provider: "miruro",
    enabled: true,
  },
  {
    id: "anilist",
    label: "AniList GraphQL",
    baseUrl: "https://graphql.anilist.co",
    provider: "anilist",
    enabled: true,
  },
  {
    id: "anipub",
    label: "AniPub",
    baseUrl: "https://anipub.xyz",
    provider: "anipub",
    enabled: true,
  },
];

const REMOVED_ANIME_API_BASE_URLS = new Set([
  "https://api.miruro.com",
  "https://anime-api-delta.vercel.app",
  "https://consumet-api-psi.vercel.app",
  "https://api.consumet.org",
  "https://animeclud.shop",
  "https://www.animeclud.shop",
]);

type MirrorInput = {
  label: string;
  baseUrl: string;
  urlFormat?: VidSrcMirror["urlFormat"];
  enabled?: boolean;
};

type AnimeApiMirrorInput = {
  label: string;
  baseUrl: string;
  provider?: AnimeApiProvider;
  enabled?: boolean;
};

type MediaState = {
  watchlistIds: string[];
  continueWatching: Record<string, ContinueWatchingEntry>;
  settings: AppSettings;
  toggleWatchlist: (videoId: string) => void;
  removeFromWatchlist: (videoId: string) => void;
  recordContinueWatching: (entry: ContinueWatchingEntry) => void;
  clearContinueWatching: (videoId: string) => void;
  clearAllContinueWatching: () => void;
  setWarningsEnabled: (enabled: boolean) => void;
  setMatureAnimeSectionEnabled: (enabled: boolean) => void;
  setVidSrcLookupSource: (lookupSource: VidSrcLookupSource) => void;
  setMiruroApiBaseUrl: (baseUrl: string) => void;
  setActiveMirror: (mirrorId: string) => void;
  addMirror: (mirror: MirrorInput) => void;
  updateMirror: (mirrorId: string, mirror: Partial<MirrorInput>) => void;
  toggleMirror: (mirrorId: string) => void;
  removeMirror: (mirrorId: string) => void;
  resetMirrors: () => void;
  setActiveAnimeApiMirror: (mirrorId: string) => void;
  addAnimeApiMirror: (mirror: AnimeApiMirrorInput) => void;
  updateAnimeApiMirror: (mirrorId: string, mirror: Partial<AnimeApiMirrorInput>) => void;
  toggleAnimeApiMirror: (mirrorId: string) => void;
  removeAnimeApiMirror: (mirrorId: string) => void;
  resetAnimeApiMirrors: () => void;
};

const defaultSettings: AppSettings = {
  mirrors: DEFAULT_MIRRORS,
  activeMirrorId: DEFAULT_MIRRORS[0].id,
  warnBeforeExternalPlayer: true,
  vidSrcLookupSource: "auto",
  miruroApiBaseUrl: DEFAULT_ACTIVE_MIRURO_API_BASE_URL,
  animeApiMirrors: DEFAULT_MIRURO_API_MIRRORS,
  activeAnimeApiMirrorId: DEFAULT_ACTIVE_ANIME_API_MIRROR_ID,
  showMatureAnimeSection: false,
};

const createMirrorId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `mirror-${Date.now()}`;
};

const ensureActiveMirror = (settings: AppSettings): AppSettings => {
  const enabledMirrors = settings.mirrors.filter((mirror) => mirror.enabled);
  const activeMirror = enabledMirrors.find((mirror) => mirror.id === settings.activeMirrorId);

  if (activeMirror || enabledMirrors.length === 0) {
    return settings;
  }

  return {
    ...settings,
    activeMirrorId: enabledMirrors[0].id,
  };
};

const ensureActiveAnimeApiMirror = (settings: AppSettings): AppSettings => {
  const enabledMirrors = settings.animeApiMirrors.filter((mirror) => mirror.enabled);
  const activeMirror = enabledMirrors.find(
    (mirror) => mirror.id === settings.activeAnimeApiMirrorId,
  );

  if (activeMirror) {
    return {
      ...settings,
      miruroApiBaseUrl: activeMirror.baseUrl,
    };
  }

  if (enabledMirrors.length === 0) {
    return settings;
  }

  return {
    ...settings,
    activeAnimeApiMirrorId: enabledMirrors[0].id,
    miruroApiBaseUrl: enabledMirrors[0].baseUrl,
  };
};

const normalizeMirrorInput = (mirror: MirrorInput): VidSrcMirror => ({
  id: createMirrorId(),
  label: mirror.label.trim() || "Custom Mirror",
  baseUrl: normalizeBaseUrl(mirror.baseUrl),
  urlFormat: mirror.urlFormat ?? inferUrlFormat(mirror.baseUrl),
  enabled: mirror.enabled ?? true,
});

const normalizeApiBaseUrl = (input: string) => {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Miruro API base URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Miruro API base URL must use HTTP or HTTPS.");
  }

  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
};

const inferAnimeApiProvider = (baseUrl: string): AnimeApiProvider => {
  if (/anilist/i.test(baseUrl)) {
    return "anilist";
  }

  if (/jikan/i.test(baseUrl)) {
    return "jikan";
  }

  if (/anipub/i.test(baseUrl)) {
    return "anipub";
  }

  if (/consumet/i.test(baseUrl)) {
    return "consumet";
  }

  return "miruro";
};

const normalizeAnimeApiMirrorInput = (mirror: AnimeApiMirrorInput): AnimeApiMirror => ({
  id: createMirrorId(),
  label: mirror.label.trim() || "Custom Anime API",
  baseUrl: normalizeApiBaseUrl(mirror.baseUrl),
  provider: mirror.provider ?? inferAnimeApiProvider(mirror.baseUrl),
  enabled: mirror.enabled ?? true,
});

type PersistedAppSettings = Partial<AppSettings> & {
  vidSrcIdMode?: VidSrcLookupSource;
};

type PersistedMediaState = Partial<Pick<MediaState, "watchlistIds" | "continueWatching">> & {
  settings?: PersistedAppSettings;
};

const normalizeStoredMirror = (mirror: Partial<VidSrcMirror>): VidSrcMirror | null => {
  if (!mirror.baseUrl) {
    return null;
  }

  try {
    const normalizedBaseUrl = normalizeBaseUrl(mirror.baseUrl);

    return {
      id: mirror.id || createMirrorId(),
      label: mirror.label?.trim() || "Custom Mirror",
      baseUrl: normalizedBaseUrl,
      urlFormat: mirror.urlFormat ?? inferUrlFormat(normalizedBaseUrl),
      enabled: mirror.enabled ?? true,
    };
  } catch {
    return null;
  }
};

const normalizeStoredAnimeApiMirror = (
  mirror: Partial<AnimeApiMirror>,
): AnimeApiMirror | null => {
  if (!mirror.baseUrl) {
    return null;
  }

  try {
    const normalizedBaseUrl = normalizeApiBaseUrl(mirror.baseUrl);

    if (REMOVED_ANIME_API_BASE_URLS.has(normalizedBaseUrl)) {
      return null;
    }

    return {
      id: mirror.id || createMirrorId(),
      label: mirror.label?.trim() || "Custom Anime API",
      baseUrl: normalizedBaseUrl,
      provider: mirror.provider ?? inferAnimeApiProvider(normalizedBaseUrl),
      enabled: mirror.enabled ?? true,
    };
  } catch {
    return null;
  }
};

const mergeMirrorsWithDefaults = (mirrors: VidSrcMirror[]) => {
  const normalizedMirrors = mirrors
    .map((mirror) => normalizeStoredMirror(mirror))
    .filter((mirror): mirror is VidSrcMirror => Boolean(mirror));
  const byBaseUrl = new Map(normalizedMirrors.map((mirror) => [mirror.baseUrl, mirror]));

  return [
    ...DEFAULT_MIRRORS.map((defaultMirror) => {
      const storedMirror = byBaseUrl.get(defaultMirror.baseUrl);

      return storedMirror
        ? {
            ...defaultMirror,
            label: storedMirror.label || defaultMirror.label,
            enabled: storedMirror.enabled,
          }
        : defaultMirror;
    }),
    ...normalizedMirrors.filter(
      (mirror) =>
        !DEFAULT_MIRRORS.some((defaultMirror) => defaultMirror.baseUrl === mirror.baseUrl),
    ),
  ];
};

const mergeAnimeApiMirrorsWithDefaults = (
  mirrors: Partial<AnimeApiMirror>[],
  legacyBaseUrl: string,
) => {
  const normalizedMirrors = mirrors
    .map((mirror) => normalizeStoredAnimeApiMirror(mirror))
    .filter((mirror): mirror is AnimeApiMirror => Boolean(mirror));
  const legacyMirror = (() => {
    try {
      const legacyNormalizedBaseUrl = normalizeApiBaseUrl(legacyBaseUrl);

      if (
        DEFAULT_MIRURO_API_MIRRORS.some(
          (defaultMirror) => defaultMirror.baseUrl === legacyNormalizedBaseUrl,
        ) ||
        normalizedMirrors.some((mirror) => mirror.baseUrl === legacyNormalizedBaseUrl) ||
        REMOVED_ANIME_API_BASE_URLS.has(legacyNormalizedBaseUrl)
      ) {
        return null;
      }

      return {
        id: "saved-miruro-api",
        label: "Saved Miruro API",
        baseUrl: legacyNormalizedBaseUrl,
        provider: inferAnimeApiProvider(legacyNormalizedBaseUrl),
        enabled: true,
      };
    } catch {
      return null;
    }
  })();
  const allStoredMirrors = legacyMirror ? [...normalizedMirrors, legacyMirror] : normalizedMirrors;
  const byBaseUrl = new Map(allStoredMirrors.map((mirror) => [mirror.baseUrl, mirror]));

  return [
    ...DEFAULT_MIRURO_API_MIRRORS.map((defaultMirror) => {
      const storedMirror = byBaseUrl.get(defaultMirror.baseUrl);

      return storedMirror
        ? {
            ...defaultMirror,
            label: storedMirror.label || defaultMirror.label,
            provider: storedMirror.provider,
            enabled: defaultMirror.enabled,
          }
        : defaultMirror;
    }),
    ...allStoredMirrors.filter(
      (mirror) =>
        !DEFAULT_MIRURO_API_MIRRORS.some(
          (defaultMirror) => defaultMirror.baseUrl === mirror.baseUrl,
        ),
    ),
  ];
};

export const getEnabledMiruroApiBaseUrls = (settings: AppSettings) => {
  return getEnabledAnimeApiSources(settings)
    .filter((source) => source.provider === "miruro")
    .map((source) => source.baseUrl);
};

export const getEnabledAnimeApiSources = (settings: AppSettings): AnimeApiSource[] => {
  const activeMirror = settings.animeApiMirrors.find(
    (mirror) => mirror.id === settings.activeAnimeApiMirrorId && mirror.enabled,
  );
  const enabledMirrors = settings.animeApiMirrors.filter((mirror) => mirror.enabled);
  const orderedMirrors = activeMirror
    ? [activeMirror, ...enabledMirrors.filter((mirror) => mirror.id !== activeMirror.id)]
    : enabledMirrors;
  const sources = orderedMirrors.map((mirror) => ({
    id: mirror.id,
    label: mirror.label,
    baseUrl: mirror.baseUrl,
    provider: mirror.provider,
  }));

  if (sources.length === 0) {
    return [
      {
        id: "fallback-miruro",
        label: "Miruro API",
        baseUrl: settings.miruroApiBaseUrl || DEFAULT_MIRURO_API_BASE_URL,
        provider: inferAnimeApiProvider(settings.miruroApiBaseUrl || DEFAULT_MIRURO_API_BASE_URL),
      },
    ];
  }

  return sources.filter(
    (source, index) =>
      sources.findIndex(
        (candidate) =>
          candidate.baseUrl === source.baseUrl && candidate.provider === source.provider,
      ) === index,
  );
};

const migratePersistedState = (
  persistedState: unknown,
): Pick<MediaState, "watchlistIds" | "continueWatching" | "settings"> => {
  const state = persistedState as PersistedMediaState;
  const storedSettings = state.settings;
  const { vidSrcIdMode: legacyVidSrcIdMode, ...currentStoredSettings } = storedSettings ?? {};
  const mirrors = mergeMirrorsWithDefaults(storedSettings?.mirrors ?? DEFAULT_MIRRORS);
  const legacyMiruroApiBaseUrl = storedSettings?.miruroApiBaseUrl ?? defaultSettings.miruroApiBaseUrl;
  const animeApiMirrors = mergeAnimeApiMirrorsWithDefaults(
    storedSettings?.animeApiMirrors ?? [],
    legacyMiruroApiBaseUrl,
  );
  const storedActiveMirrorId = storedSettings?.activeMirrorId;
  const storedActiveAnimeApiMirrorId = storedSettings?.activeAnimeApiMirrorId;
  const vidSrcLookupSource =
    storedSettings?.vidSrcLookupSource ??
    legacyVidSrcIdMode ??
    defaultSettings.vidSrcLookupSource;
  const miruroApiBaseUrl = (() => {
    try {
      return normalizeApiBaseUrl(legacyMiruroApiBaseUrl);
    } catch {
      return defaultSettings.miruroApiBaseUrl;
    }
  })();
  const activeMirrorId =
    storedActiveMirrorId &&
    mirrors.some((mirror) => mirror.id === storedActiveMirrorId && mirror.enabled)
      ? storedActiveMirrorId
      : DEFAULT_MIRRORS[0].id;
  const activeAnimeApiMirrorId =
    storedActiveAnimeApiMirrorId &&
    animeApiMirrors.some(
      (mirror) => mirror.id === storedActiveAnimeApiMirrorId && mirror.enabled,
    )
      ? storedActiveAnimeApiMirrorId
      : animeApiMirrors.find((mirror) => mirror.baseUrl === miruroApiBaseUrl && mirror.enabled)?.id ??
        animeApiMirrors.find((mirror) => mirror.enabled)?.id ??
        DEFAULT_ACTIVE_ANIME_API_MIRROR_ID;
  const activeAnimeApiMirror = animeApiMirrors.find(
    (mirror) => mirror.id === activeAnimeApiMirrorId,
  );

  return {
    watchlistIds: state.watchlistIds ?? [],
    continueWatching: state.continueWatching ?? {},
    settings: {
      ...defaultSettings,
      ...currentStoredSettings,
      mirrors,
      activeMirrorId,
      vidSrcLookupSource,
      miruroApiBaseUrl: activeAnimeApiMirror?.baseUrl ?? miruroApiBaseUrl,
      animeApiMirrors,
      activeAnimeApiMirrorId,
    },
  };
};

export const useMediaStore = create<MediaState>()(
  persist(
    (set) => ({
      watchlistIds: [],
      continueWatching: {},
      settings: defaultSettings,

      toggleWatchlist: (videoId) =>
        set((state) => {
          const exists = state.watchlistIds.includes(videoId);
          return {
            watchlistIds: exists
              ? state.watchlistIds.filter((id) => id !== videoId)
              : [videoId, ...state.watchlistIds],
          };
        }),

      removeFromWatchlist: (videoId) =>
        set((state) => ({
          watchlistIds: state.watchlistIds.filter((id) => id !== videoId),
        })),

      recordContinueWatching: (entry) =>
        set((state) => ({
          continueWatching: {
            ...state.continueWatching,
            [entry.videoId]: {
              ...entry,
              updatedAt: entry.updatedAt || Date.now(),
            },
          },
        })),

      clearContinueWatching: (videoId) =>
        set((state) => {
          const nextEntries = { ...state.continueWatching };
          delete nextEntries[videoId];

          return {
            continueWatching: nextEntries,
          };
        }),

      clearAllContinueWatching: () =>
        set({
          continueWatching: {},
        }),

      setWarningsEnabled: (enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            warnBeforeExternalPlayer: enabled,
          },
        })),

      setMatureAnimeSectionEnabled: (enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            showMatureAnimeSection: enabled,
          },
        })),

      setVidSrcLookupSource: (lookupSource) =>
        set((state) => ({
          settings: {
            ...state.settings,
            vidSrcLookupSource: lookupSource,
          },
        })),

      setMiruroApiBaseUrl: (baseUrl) =>
        set((state) => {
          const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl);
          return {
            settings: ensureActiveAnimeApiMirror({
              ...state.settings,
              miruroApiBaseUrl: normalizedBaseUrl,
              animeApiMirrors: state.settings.animeApiMirrors.map((mirror) =>
                mirror.id === state.settings.activeAnimeApiMirrorId
                  ? {
                      ...mirror,
                      baseUrl: normalizedBaseUrl,
                      provider: inferAnimeApiProvider(normalizedBaseUrl),
                    }
                  : mirror,
              ),
            }),
          };
        }),

      setActiveMirror: (mirrorId) =>
        set((state) => ({
          settings: {
            ...state.settings,
            activeMirrorId: mirrorId,
            mirrors: state.settings.mirrors.map((mirror) =>
              mirror.id === mirrorId ? { ...mirror, enabled: true } : mirror,
            ),
          },
        })),

      addMirror: (mirror) =>
        set((state) => {
          const nextMirror = normalizeMirrorInput(mirror);
          return {
            settings: ensureActiveMirror({
              ...state.settings,
              mirrors: [...state.settings.mirrors, nextMirror],
            }),
          };
        }),

      updateMirror: (mirrorId, mirrorUpdate) =>
        set((state) => ({
          settings: ensureActiveMirror({
            ...state.settings,
            mirrors: state.settings.mirrors.map((mirror) =>
              mirror.id === mirrorId
                ? {
                    ...mirror,
                    label: mirrorUpdate.label?.trim() || mirror.label,
                    baseUrl: mirrorUpdate.baseUrl
                      ? normalizeBaseUrl(mirrorUpdate.baseUrl)
                      : mirror.baseUrl,
                    urlFormat: mirrorUpdate.urlFormat ?? mirror.urlFormat,
                    enabled: mirrorUpdate.enabled ?? mirror.enabled,
                  }
                : mirror,
            ),
          }),
        })),

      toggleMirror: (mirrorId) =>
        set((state) => {
          const targetMirror = state.settings.mirrors.find((mirror) => mirror.id === mirrorId);
          const enabledCount = state.settings.mirrors.filter((mirror) => mirror.enabled).length;

          if (targetMirror?.enabled && enabledCount === 1) {
            return state;
          }

          return {
            settings: ensureActiveMirror({
              ...state.settings,
              mirrors: state.settings.mirrors.map((mirror) =>
                mirror.id === mirrorId ? { ...mirror, enabled: !mirror.enabled } : mirror,
              ),
            }),
          };
        }),

      removeMirror: (mirrorId) =>
        set((state) => {
          const remainingMirrors = state.settings.mirrors.filter(
            (mirror) => mirror.id !== mirrorId,
          );

          if (remainingMirrors.length === 0) {
            return {
              settings: defaultSettings,
            };
          }

          return {
            settings: ensureActiveMirror({
              ...state.settings,
              mirrors: remainingMirrors,
            }),
          };
        }),

      resetMirrors: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            mirrors: DEFAULT_MIRRORS,
            activeMirrorId: DEFAULT_MIRRORS[0].id,
          },
        })),

      setActiveAnimeApiMirror: (mirrorId) =>
        set((state) => ({
          settings: ensureActiveAnimeApiMirror({
            ...state.settings,
            activeAnimeApiMirrorId: mirrorId,
            animeApiMirrors: state.settings.animeApiMirrors.map((mirror) =>
              mirror.id === mirrorId ? { ...mirror, enabled: true } : mirror,
            ),
          }),
        })),

      addAnimeApiMirror: (mirror) =>
        set((state) => {
          const nextMirror = normalizeAnimeApiMirrorInput(mirror);
          return {
            settings: ensureActiveAnimeApiMirror({
              ...state.settings,
              animeApiMirrors: [...state.settings.animeApiMirrors, nextMirror],
            }),
          };
        }),

      updateAnimeApiMirror: (mirrorId, mirrorUpdate) =>
        set((state) => ({
          settings: ensureActiveAnimeApiMirror({
            ...state.settings,
            animeApiMirrors: state.settings.animeApiMirrors.map((mirror) =>
              mirror.id === mirrorId
                ? {
                    ...mirror,
                    label: mirrorUpdate.label?.trim() || mirror.label,
                    baseUrl: mirrorUpdate.baseUrl
                      ? normalizeApiBaseUrl(mirrorUpdate.baseUrl)
                      : mirror.baseUrl,
                    provider:
                      mirrorUpdate.provider ??
                      (mirrorUpdate.baseUrl ? inferAnimeApiProvider(mirrorUpdate.baseUrl) : mirror.provider),
                    enabled: mirrorUpdate.enabled ?? mirror.enabled,
                  }
                : mirror,
            ),
          }),
        })),

      toggleAnimeApiMirror: (mirrorId) =>
        set((state) => {
          const targetMirror = state.settings.animeApiMirrors.find(
            (mirror) => mirror.id === mirrorId,
          );
          const enabledCount = state.settings.animeApiMirrors.filter(
            (mirror) => mirror.enabled,
          ).length;

          if (targetMirror?.enabled && enabledCount === 1) {
            return state;
          }

          return {
            settings: ensureActiveAnimeApiMirror({
              ...state.settings,
              animeApiMirrors: state.settings.animeApiMirrors.map((mirror) =>
                mirror.id === mirrorId ? { ...mirror, enabled: !mirror.enabled } : mirror,
              ),
            }),
          };
        }),

      removeAnimeApiMirror: (mirrorId) =>
        set((state) => {
          const remainingMirrors = state.settings.animeApiMirrors.filter(
            (mirror) => mirror.id !== mirrorId,
          );

          if (remainingMirrors.length === 0) {
            return {
              settings: {
                ...state.settings,
                animeApiMirrors: DEFAULT_MIRURO_API_MIRRORS,
                activeAnimeApiMirrorId: DEFAULT_ACTIVE_ANIME_API_MIRROR_ID,
                miruroApiBaseUrl: DEFAULT_ACTIVE_MIRURO_API_BASE_URL,
              },
            };
          }

          return {
            settings: ensureActiveAnimeApiMirror({
              ...state.settings,
              animeApiMirrors: remainingMirrors,
            }),
          };
        }),

      resetAnimeApiMirrors: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            animeApiMirrors: DEFAULT_MIRURO_API_MIRRORS,
            activeAnimeApiMirrorId: DEFAULT_ACTIVE_ANIME_API_MIRROR_ID,
            miruroApiBaseUrl: DEFAULT_ACTIVE_MIRURO_API_BASE_URL,
          },
        })),
    }),
    {
      name: "private-media-desktop-store",
      version: 11,
      storage: createJSONStorage(() => localStorage),
      migrate: migratePersistedState,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...migratePersistedState(persistedState),
      }),
      partialize: (state) => ({
        watchlistIds: state.watchlistIds,
        continueWatching: state.continueWatching,
        settings: state.settings,
      }),
    },
  ),
);
