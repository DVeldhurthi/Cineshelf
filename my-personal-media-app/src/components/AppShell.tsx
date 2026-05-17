import { Bug, Film, Heart, Home, Settings } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { debugLog, getDebugEnvironment, installDebugConsoleBridge, useDebugStore } from "../store/useDebugStore";
import styles from "./AppShell.module.css";
import { DebugConsole } from "./DebugConsole";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/watchlist", label: "Watchlist", icon: Heart },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const isDebugOpen = useDebugStore((state) => state.isOpen);
  const toggleDebugOpen = useDebugStore((state) => state.toggleOpen);

  useEffect(() => {
    installDebugConsoleBridge();
    debugLog("tauri", "Debug console online.", getDebugEnvironment(), "success");

    const handleError = (event: ErrorEvent) => {
      debugLog(
        "window.error",
        event.message,
        {
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          error: event.error,
        },
        "error",
      );
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      debugLog("window.unhandledrejection", "Unhandled promise rejection.", event.reason, "error");
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <div className={`${styles.shell} ${isDebugOpen ? styles.shellDebugOpen : ""}`}>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand} aria-label="Cineshelf home">
          <span className={styles.brandMark}>
            <Film size={20} aria-hidden="true" />
          </span>
          <span>Cineshelf</span>
        </NavLink>

        <nav className={styles.nav} aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                }
              >
                <Icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            className={styles.debugButton}
            onClick={toggleDebugOpen}
            aria-pressed={isDebugOpen}
            title="Toggle debug console"
          >
            <Bug size={17} aria-hidden="true" />
            <span>Debug</span>
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
      <DebugConsole />
    </div>
  );
}
