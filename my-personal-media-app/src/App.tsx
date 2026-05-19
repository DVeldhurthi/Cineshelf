import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ExternalPlayerPage } from "./pages/ExternalPlayerPage";

const AnimePage = lazy(() => import("./pages/AnimePage").then((module) => ({ default: module.AnimePage })));
const AnimePlayerPage = lazy(() =>
  import("./pages/AnimePlayerPage").then((module) => ({ default: module.AnimePlayerPage })),
);
const AnimeWatchPage = lazy(() =>
  import("./pages/AnimeWatchPage").then((module) => ({ default: module.AnimeWatchPage })),
);
const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);
const WatchPage = lazy(() => import("./pages/WatchPage").then((module) => ({ default: module.WatchPage })));
const WatchlistPage = lazy(() =>
  import("./pages/WatchlistPage").then((module) => ({ default: module.WatchlistPage })),
);

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return null;
}

function App() {
  if (window.location.hash.startsWith("#/external-player")) {
    return <ExternalPlayerPage />;
  }

  return (
    <HashRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/anime-player" element={<AnimePlayerPage />} />
          <Route path="/external-player" element={<ExternalPlayerPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/anime" element={<AnimePage />} />
            <Route path="/anime/:id" element={<AnimeWatchPage />} />
            <Route path="/watch/:id" element={<WatchPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
