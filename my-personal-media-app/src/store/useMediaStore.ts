import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AppSettings,
  ContinueWatchingEntry,
  VidSrcLookupSource,
  VidSrcMirror,
} from "../types/video";
import { DEFAULT_MIRRORS, inferUrlFormat, normalizeBaseUrl } from "../utils/vidsrc";

type MirrorInput = {
  label: string;
  baseUrl: string;
  urlFormat?: VidSrcMirror["urlFormat"];
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
  setVidSrcLookupSource: (lookupSource: VidSrcLookupSource) => void;
  setActiveMirror: (mirrorId: string) => void;
  addMirror: (mirror: MirrorInput) => void;
  updateMirror: (mirrorId: string, mirror: Partial<MirrorInput>) => void;
  toggleMirror: (mirrorId: string) => void;
  removeMirror: (mirrorId: string) => void;
  resetMirrors: () => void;
};

const defaultSettings: AppSettings = {
  mirrors: DEFAULT_MIRRORS,
  activeMirrorId: DEFAULT_MIRRORS[0].id,
  warnBeforeExternalPlayer: true,
  vidSrcLookupSource: "auto",
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

const normalizeMirrorInput = (mirror: MirrorInput): VidSrcMirror => ({
  id: createMirrorId(),
  label: mirror.label.trim() || "Custom Mirror",
  baseUrl: normalizeBaseUrl(mirror.baseUrl),
  urlFormat: mirror.urlFormat ?? inferUrlFormat(mirror.baseUrl),
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

const migratePersistedState = (
  persistedState: unknown,
): Pick<MediaState, "watchlistIds" | "continueWatching" | "settings"> => {
  const state = persistedState as PersistedMediaState;
  const storedSettings = state.settings;
  const { vidSrcIdMode: legacyVidSrcIdMode, ...currentStoredSettings } = storedSettings ?? {};
  const mirrors = mergeMirrorsWithDefaults(storedSettings?.mirrors ?? DEFAULT_MIRRORS);
  const storedActiveMirrorId = storedSettings?.activeMirrorId;
  const vidSrcLookupSource =
    storedSettings?.vidSrcLookupSource ??
    legacyVidSrcIdMode ??
    defaultSettings.vidSrcLookupSource;
  const activeMirrorId =
    storedActiveMirrorId &&
    mirrors.some((mirror) => mirror.id === storedActiveMirrorId && mirror.enabled)
      ? storedActiveMirrorId
      : DEFAULT_MIRRORS[0].id;

  return {
    watchlistIds: state.watchlistIds ?? [],
    continueWatching: state.continueWatching ?? {},
    settings: {
      ...defaultSettings,
      ...currentStoredSettings,
      mirrors,
      activeMirrorId,
      vidSrcLookupSource,
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

      setVidSrcLookupSource: (lookupSource) =>
        set((state) => ({
          settings: {
            ...state.settings,
            vidSrcLookupSource: lookupSource,
          },
        })),

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
    }),
    {
      name: "private-media-desktop-store",
      version: 6,
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
