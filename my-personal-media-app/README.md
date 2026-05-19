# Cineshelf

A private personal desktop media streaming shell built with Tauri 2, React 18,
TypeScript, Vite, React Router DOM v6, Zustand, and CSS Modules.

Movies and TV shows use the existing configurable VidSrc mirrors. Anime is
loaded dynamically from a configurable Miruro-compatible API and opens streams in
the same Tauri player-window flow.

## Security Model

- VidSrc embeds are not mounted until the warning modal is accepted, unless the
  warning is explicitly disabled in Settings.
- The player iframe uses a restrictive sandbox:
  `allow-scripts allow-same-origin allow-presentation`.
- The iframe also uses `referrerPolicy="no-referrer"` and does not grant forms,
  downloads, popups, or top navigation.
- `Open in External Browser` uses Tauri's opener plugin in desktop builds and
  falls back to `window.open` during web development.
- Mirrors are fully configurable in Settings. Base URLs are normalized, must use
  HTTPS, and can use either query-parameter or path-segment URL formats.

Use this app only for private personal catalog entries and content you have the
right to access.

## Folder Structure

```text
my-personal-media-app/
  src/
    App.tsx
    main.tsx
    styles/global.css
    data/
      videos.json
      catalog.ts
    types/
      search.ts
      video.ts
    utils/
      openExternal.ts
      vidsrc.ts
    store/
      useMediaStore.ts
    components/
      AppShell.tsx
      EpisodeSelector.tsx
      EmptyState.tsx
      HeroBanner.tsx
      MediaRow.tsx
      PlayerFrame.tsx
      SearchControls.tsx
      VideoCard.tsx
      WarningModal.tsx
      *.module.css
    pages/
      HomePage.tsx
      SettingsPage.tsx
      WatchPage.tsx
      WatchlistPage.tsx
      *.module.css
  src-tauri/
    tauri.conf.json
    capabilities/default.json
    src/
      lib.rs
      main.rs
```

## VidSrc URL Patterns

```text
Query movie: {baseUrl}/embed/movie?imdb={imdbId}
Query TV:    {baseUrl}/embed/tv?imdb={imdbId}&season={season}&episode={episode}
Path movie:  {baseUrl}/embed/movie/{imdbId}
Path TV:     {baseUrl}/embed/tv/{imdbId}/{season}-{episode}
Legacy TV:   {baseUrl}/embed/tv/{imdbId}/{season}/{episode}
```

Default mirrors:

- `https://vidsrc-embed.ru`
- `https://vidsrc-embed.su`
- `https://vidsrcme.su`
- `https://vsrc.su`
- `https://vidsrc.to`
- `https://vidsrc.me`
- `https://vidsrcme.ru`

The VidSrc embed endpoints above are free/no-key URLs. They may still report
"media unavailable" for individual IMDb IDs when a given mirror does not have
that title.

## Anime API

The Anime section uses a Miruro-compatible API base URL from Settings. The
default is:

```text
https://animeclud.shop
```

The app fetches anime collections, search, details, episodes, and stream sources
through a small Tauri command so the desktop app is not blocked by browser CORS.
If the public API instance changes, update the base URL in Settings.

## Install

```bash
npm install
```

## Poster Images

Poster images are loaded from IMDb IDs through Metahub-style poster URLs:

```text
https://images.metahub.space/poster/medium/{imdbId}/img
```

This provider does not require a paid account or API key. The URL pattern is
documented in Stremio's add-on guide and uses IMDb IDs already present in the
catalog.

## Run Web Dev Server

```bash
npm run dev
```

Open the shown local URL, usually `http://localhost:1420`.

## Run Desktop App

```bash
npm run tauri dev
```

## Build Frontend

```bash
npm run build
```

## Build Desktop Bundle

```bash
npm run tauri build
```

## Build Windows Installers

Build the Windows `.exe` and `.msi` installers on a Windows 10/11 laptop. This
is the recommended path because Tauri `.msi` output uses WiX, which only runs on
Windows.

Install prerequisites on Windows:

- Node.js LTS
- Rust via `rustup`
- Microsoft C++ Build Tools with the Desktop development workload
- WebView2 Runtime, if it is not already installed

From the project folder on Windows:

```powershell
npm install
npm run tauri:build:windows
```

If Tauri says the only bundle values are `ios`, `app`, and `dmg`, the command is
being run on macOS. Run the Windows installer commands from PowerShell or
Windows Terminal on the Windows laptop.

Build only the NSIS setup `.exe`:

```powershell
npm run tauri:build:windows:exe
```

Build only the `.msi`:

```powershell
npm run tauri:build:windows:msi
```

Windows artifacts are written under:

```text
src-tauri\target\release\bundle\
```

Typical outputs:

```text
src-tauri\target\release\bundle\nsis\Cineshelf_0.1.0_x64-setup.exe
src-tauri\target\release\bundle\msi\Cineshelf_0.1.0_x64_en-US.msi
```
