import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Clipboard,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import {
  debugLog,
  getDebugEnvironment,
  useDebugStore,
  type DebugEntry,
} from "../store/useDebugStore";
import styles from "./DebugConsole.module.css";

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);

  return `${time}.${String(date.getMilliseconds()).padStart(3, "0")}`;
};

const stringifyDetails = (details: unknown) => {
  if (details === undefined || details === null) {
    return "";
  }

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
};

const formatEntryForClipboard = (entry: DebugEntry) => {
  const details = stringifyDetails(entry.details);

  return [
    `[${new Date(entry.timestamp).toISOString()}] ${entry.level.toUpperCase()} ${entry.scope}`,
    entry.message,
    details,
  ]
    .filter(Boolean)
    .join("\n");
};

export function DebugConsole() {
  const entries = useDebugStore((state) => state.entries);
  const isOpen = useDebugStore((state) => state.isOpen);
  const isPaused = useDebugStore((state) => state.isPaused);
  const clearEntries = useDebugStore((state) => state.clearEntries);
  const setOpen = useDebugStore((state) => state.setOpen);
  const setPaused = useDebugStore((state) => state.setPaused);
  const [note, setNote] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const environment = useMemo(() => getDebugEnvironment(), []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [entries.length]);

  const submitNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedNote = note.trim();

    if (!trimmedNote) {
      return;
    }

    debugLog("manual", trimmedNote, undefined, "info");
    setNote("");
  };

  const copyLogs = async () => {
    const payload = entries.map(formatEntryForClipboard).join("\n\n---\n\n");

    try {
      await navigator.clipboard.writeText(payload || "No debug entries.");
      debugLog("debug", "Copied debug console output to clipboard.", undefined, "success");
    } catch (error) {
      debugLog("debug", "Unable to copy debug console output.", error, "error");
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className={styles.openTab}
        onClick={() => setOpen(true)}
        aria-label="Open debug console"
        title="Open debug console"
      >
        <PanelRightOpen size={18} aria-hidden="true" />
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Debug console">
      <header className={styles.header}>
        <div>
          <span>Tauri Debug</span>
          <strong>{entries.length} events</strong>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setPaused(!isPaused)}
            aria-pressed={isPaused}
            title={isPaused ? "Resume logging" : "Pause logging"}
          >
            {isPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          </button>
          <button type="button" onClick={copyLogs} title="Copy logs">
            <Clipboard size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={clearEntries} title="Clear logs">
            <Trash2 size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setOpen(false)} title="Close debug console">
            <PanelRightClose size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className={styles.environment}>
        <span>Runtime</span>
        <dl>
          <div>
            <dt>Tauri</dt>
            <dd>{environment.tauriInternalsDetected ? "detected" : "not detected"}</dd>
          </div>
          <div>
            <dt>Protocol</dt>
            <dd>{environment.protocol}</dd>
          </div>
          <div>
            <dt>Online</dt>
            <dd>{environment.online ? "yes" : "no"}</dd>
          </div>
          <div>
            <dt>URL</dt>
            <dd>{environment.href}</dd>
          </div>
        </dl>
      </section>

      <form className={styles.noteForm} onSubmit={submitNote}>
        <input
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
          placeholder="Add a debug note"
          aria-label="Debug note"
        />
        <button type="submit" title="Add note">
          <Plus size={16} aria-hidden="true" />
        </button>
      </form>

      <div className={styles.logList} ref={listRef}>
        {entries.length ? (
          entries.map((entry) => {
            const details = stringifyDetails(entry.details);

            return (
              <article key={entry.id} className={styles.entry} data-level={entry.level}>
                <div className={styles.entryMeta}>
                  <time dateTime={new Date(entry.timestamp).toISOString()}>
                    {formatTime(entry.timestamp)}
                  </time>
                  <span>{entry.level}</span>
                  <strong>{entry.scope}</strong>
                </div>
                <p>{entry.message}</p>
                {details ? <pre>{details}</pre> : null}
              </article>
            );
          })
        ) : (
          <div className={styles.empty}>No debug events yet.</div>
        )}
      </div>
    </aside>
  );
}
