import { useMediaStore } from "../store/useMediaStore";
import type { AnimeApiMirror, AnimeApiProvider } from "../types/anime";
import type { VidSrcLookupSource, VidSrcUrlFormat } from "../types/video";
import { isDefaultMirror } from "../utils/vidsrc";
import styles from "./SettingsPage.module.css";

const formatUrlFormat = (format: VidSrcUrlFormat) => {
  if (format === "query") {
    return "Query params";
  }

  if (format === "path") {
    return "Path season-episode";
  }

  return "Legacy slash path";
};

const formatAnimeProvider = (provider: AnimeApiProvider) => {
  if (provider === "anilist") {
    return "AniList relations";
  }

  if (provider === "jikan") {
    return "Jikan metadata";
  }

  if (provider === "anipub") {
    return "AniPub embeds";
  }

  return provider === "consumet" ? "Consumet sources" : "Miruro-compatible";
};

const formatLookupSource = (source: VidSrcLookupSource) => {
  if (source === "imdb") {
    return "IMDb.com";
  }

  if (source === "tmdb") {
    return "TheMovieDB.org";
  }

  return "Auto: prefer TheMovieDB.org";
};

const isDefaultAnimeApiMirror = (mirror: AnimeApiMirror) =>
  [
    "jikan",
    "miruro-vercel",
    "anilist",
    "anipub",
  ].includes(mirror.id);

export function SettingsPage() {
  const settings = useMediaStore((state) => state.settings);
  const setWarningsEnabled = useMediaStore((state) => state.setWarningsEnabled);
  const setMatureAnimeSectionEnabled = useMediaStore((state) => state.setMatureAnimeSectionEnabled);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p>Playback controls</p>
        <h1>Settings</h1>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p>Security</p>
            <h2>External Player Warning</h2>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.warnBeforeExternalPlayer}
              onChange={(event) => setWarningsEnabled(event.currentTarget.checked)}
            />
            <span />
          </label>
        </div>
        <p className={styles.panelCopy}>
          When enabled, the app asks before mounting any VidSrc iframe.
        </p>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p>Anime</p>
            <h2>Mature Anime Section</h2>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.showMatureAnimeSection}
              onChange={(event) => setMatureAnimeSectionEnabled(event.currentTarget.checked)}
            />
            <span />
          </label>
        </div>
        <p className={styles.panelCopy}>
          When disabled, mature or adult-tagged anime is hidden from anime rows and search. When enabled,
          those titles are separated into their own section instead of being mixed into regular browsing.
        </p>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p>Anime</p>
            <h2>Anime API Mirrors</h2>
          </div>
          <div className={styles.settingValue}>
            <span>Active API</span>
            <strong>
              {settings.animeApiMirrors.find(
                (mirror) => mirror.id === settings.activeAnimeApiMirrorId,
              )?.label ?? "Automatic"}
            </strong>
          </div>
        </div>

        <div className={styles.mirrorList}>
          {settings.animeApiMirrors.map((mirror) => {
            const isActive = settings.activeAnimeApiMirrorId === mirror.id;

            return (
              <article key={mirror.id} className={styles.animeMirrorRow}>
                <div className={styles.mirrorMeta}>
                  <span>{isDefaultAnimeApiMirror(mirror) ? "Default" : "Custom"}</span>
                  <strong>{mirror.label}</strong>
                  <code>{mirror.baseUrl}</code>
                  <em>{formatAnimeProvider(mirror.provider)}</em>
                </div>

                <div className={styles.sourceStatus}>
                  <span className={isActive ? styles.primaryStatus : styles.neutralStatus}>
                    {isActive ? "Tried first" : "Backup"}
                  </span>
                  <span className={mirror.enabled ? styles.enabledStatus : styles.disabledStatus}>
                    {mirror.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <p className={styles.panelCopy}>
          Anime rows and search use the active metadata API first, while enabled playback sources
          are used for episodes, servers, and stream links. If one public source drops a title or
          its episode pipe fails, the app tries the next configured source before showing a playback
          error.
        </p>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p>Lookup</p>
            <h2>VidSrc Lookup Source</h2>
          </div>
          <div className={styles.settingValue}>
            <span>Source</span>
            <strong>{formatLookupSource(settings.vidSrcLookupSource)}</strong>
          </div>
        </div>
        <p className={styles.panelCopy}>
          VidSrc receives IDs extracted from IMDb.com title URLs or TheMovieDB.org movie and TV URLs.
          Auto mode uses TheMovieDB.org when a catalog entry has that source.
        </p>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p>Mirrors</p>
            <h2>VidSrc Embed Sources</h2>
          </div>
          <div className={styles.settingValue}>
            <span>Active source</span>
            <strong>
              {settings.mirrors.find((mirror) => mirror.id === settings.activeMirrorId)?.label ??
                "Automatic"}
            </strong>
          </div>
        </div>

        <div className={styles.mirrorList}>
          {settings.mirrors.map((mirror) => {
            const isActive = settings.activeMirrorId === mirror.id;

            return (
              <article key={mirror.id} className={styles.mirrorRow}>
                <div className={styles.mirrorMeta}>
                  <span>{isDefaultMirror(mirror) ? "Default" : "Custom"}</span>
                  <strong>{mirror.label}</strong>
                  <code>{mirror.baseUrl}</code>
                  <em>{formatUrlFormat(mirror.urlFormat)}</em>
                </div>

                <div className={styles.sourceStatus}>
                  <span className={isActive ? styles.primaryStatus : styles.neutralStatus}>
                    {isActive ? "Active" : "Backup"}
                  </span>
                  <span className={mirror.enabled ? styles.enabledStatus : styles.disabledStatus}>
                    {mirror.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
