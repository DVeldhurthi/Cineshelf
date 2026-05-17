import { useEffect, useState } from "react";
import { Check, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useMediaStore } from "../store/useMediaStore";
import type { VidSrcLookupSource, VidSrcUrlFormat } from "../types/video";
import { isDefaultMirror, normalizeBaseUrl } from "../utils/vidsrc";
import styles from "./SettingsPage.module.css";

type MirrorDraft = {
  label: string;
  baseUrl: string;
  urlFormat: VidSrcUrlFormat;
};

const getMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to save mirror.";

const formatUrlFormat = (format: VidSrcUrlFormat) => {
  if (format === "query") {
    return "Query params";
  }

  if (format === "path") {
    return "Path season-episode";
  }

  return "Legacy slash path";
};

export function SettingsPage() {
  const settings = useMediaStore((state) => state.settings);
  const setWarningsEnabled = useMediaStore((state) => state.setWarningsEnabled);
  const setVidSrcLookupSource = useMediaStore((state) => state.setVidSrcLookupSource);
  const setActiveMirror = useMediaStore((state) => state.setActiveMirror);
  const addMirror = useMediaStore((state) => state.addMirror);
  const updateMirror = useMediaStore((state) => state.updateMirror);
  const toggleMirror = useMediaStore((state) => state.toggleMirror);
  const removeMirror = useMediaStore((state) => state.removeMirror);
  const resetMirrors = useMediaStore((state) => state.resetMirrors);

  const [drafts, setDrafts] = useState<Record<string, MirrorDraft>>({});
  const [newMirror, setNewMirror] = useState<MirrorDraft>({
    label: "",
    baseUrl: "",
    urlFormat: "path",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        settings.mirrors.map((mirror) => [
          mirror.id,
          {
            label: mirror.label,
            baseUrl: mirror.baseUrl,
            urlFormat: mirror.urlFormat,
          },
        ]),
      ),
    );
  }, [settings.mirrors]);

  const showSuccess = (value: string) => {
    setMessage(value);
    setError(null);
  };

  const showError = (value: string) => {
    setError(value);
    setMessage(null);
  };

  const saveMirror = (mirrorId: string) => {
    const draft = drafts[mirrorId];

    if (!draft) {
      return;
    }

    try {
      const normalizedBaseUrl = normalizeBaseUrl(draft.baseUrl);
      updateMirror(mirrorId, {
        label: draft.label,
        baseUrl: normalizedBaseUrl,
        urlFormat: draft.urlFormat,
      });
      showSuccess("Mirror saved.");
    } catch (saveError) {
      showError(getMessage(saveError));
    }
  };

  const createMirror = () => {
    try {
      addMirror({
        label: newMirror.label,
        baseUrl: normalizeBaseUrl(newMirror.baseUrl),
        urlFormat: newMirror.urlFormat,
        enabled: true,
      });
      setNewMirror({ label: "", baseUrl: "", urlFormat: "path" });
      showSuccess("Mirror added.");
    } catch (createError) {
      showError(getMessage(createError));
    }
  };

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
            <p>Lookup</p>
            <h2>VidSrc Lookup Source</h2>
          </div>
          <label className={styles.selectControl}>
            <span>Source</span>
            <select
              value={settings.vidSrcLookupSource}
              onChange={(event) =>
                setVidSrcLookupSource(event.currentTarget.value as VidSrcLookupSource)
              }
            >
              <option value="auto">Auto: prefer TheMovieDB.org when available</option>
              <option value="imdb">IMDb.com</option>
              <option value="tmdb">TheMovieDB.org when available</option>
            </select>
          </label>
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
          <button type="button" className={styles.resetButton} onClick={resetMirrors}>
            <RotateCcw size={16} aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>

        <div className={styles.feedback} aria-live="polite">
          {message ? <span className={styles.success}>{message}</span> : null}
          {error ? <span className={styles.error}>{error}</span> : null}
        </div>

        <div className={styles.mirrorList}>
          {settings.mirrors.map((mirror) => {
            const draft = drafts[mirror.id] ?? {
              label: mirror.label,
              baseUrl: mirror.baseUrl,
              urlFormat: mirror.urlFormat,
            };
            const isActive = settings.activeMirrorId === mirror.id;

            return (
              <article key={mirror.id} className={styles.mirrorRow}>
                <div className={styles.mirrorMeta}>
                  <span>{isDefaultMirror(mirror) ? "Default" : "Custom"}</span>
                  <strong>{mirror.label}</strong>
                  <code>{mirror.baseUrl}</code>
                  <em>{formatUrlFormat(mirror.urlFormat)}</em>
                </div>

                <div className={styles.mirrorFields}>
                  <label>
                    <span>Name</span>
                    <input
                      value={draft.label}
                      onChange={(event) =>
                        setDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [mirror.id]: {
                            ...draft,
                            label: event.currentTarget.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Base URL</span>
                    <input
                      value={draft.baseUrl}
                      onChange={(event) =>
                        setDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [mirror.id]: {
                            ...draft,
                            baseUrl: event.currentTarget.value,
                          },
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>URL format</span>
                    <select
                      value={draft.urlFormat}
                      onChange={(event) =>
                        setDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [mirror.id]: {
                            ...draft,
                            urlFormat: event.currentTarget.value as VidSrcUrlFormat,
                          },
                        }))
                      }
                    >
                      <option value="query">Query params</option>
                      <option value="path">Path season-episode</option>
                      <option value="legacyPath">Legacy slash path</option>
                    </select>
                  </label>
                </div>

                <div className={styles.mirrorActions}>
                  <button
                    type="button"
                    className={isActive ? styles.activeButton : ""}
                    onClick={() => setActiveMirror(mirror.id)}
                  >
                    <Check size={16} aria-hidden="true" />
                    <span>{isActive ? "Active" : "Use"}</span>
                  </button>
                  <button type="button" onClick={() => toggleMirror(mirror.id)}>
                    <span>{mirror.enabled ? "Enabled" : "Disabled"}</span>
                  </button>
                  <button type="button" onClick={() => saveMirror(mirror.id)}>
                    <Save size={16} aria-hidden="true" />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => removeMirror(mirror.id)}
                    aria-label={`Remove ${mirror.label}`}
                    title="Remove mirror"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.addMirror}>
          <div>
            <h3>Add Mirror</h3>
            <p>HTTPS base URLs are normalized before they are saved.</p>
          </div>
          <label>
            <span>Name</span>
            <input
              value={newMirror.label}
              onChange={(event) =>
                setNewMirror((current) => ({
                  ...current,
                  label: event.currentTarget.value,
                }))
              }
              placeholder="Private Mirror"
            />
          </label>
          <label>
            <span>Base URL</span>
            <input
              value={newMirror.baseUrl}
              onChange={(event) =>
                setNewMirror((current) => ({
                  ...current,
                  baseUrl: event.currentTarget.value,
                }))
              }
              placeholder="https://example.com"
            />
          </label>
          <label>
            <span>URL format</span>
            <select
              value={newMirror.urlFormat}
              onChange={(event) =>
                setNewMirror((current) => ({
                  ...current,
                  urlFormat: event.currentTarget.value as VidSrcUrlFormat,
                }))
              }
            >
              <option value="query">Query params</option>
              <option value="path">Path season-episode</option>
              <option value="legacyPath">Legacy slash path</option>
            </select>
          </label>
          <button type="button" onClick={createMirror}>
            <Plus size={16} aria-hidden="true" />
            <span>Add</span>
          </button>
        </div>
      </section>
    </div>
  );
}
