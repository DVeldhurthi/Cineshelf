# Cineshelf

Cineshelf is a desktop media browser and player for Windows and macOS. It lets users search, browse, organize, and play movies, TV shows, and anime from the sources included in the app.

## Features

### Movies and TV Shows

- Browse available movie and TV show sources.
- Search for movies and TV shows.
- Add movies and TV shows to your watch list.
- Favorite movies and TV shows for easier access later.

### Anime

- Browse available anime sources.
- Search for anime after movie and TV show results.
- Some anime can be added to favorites.
- Mature anime content can be enabled or disabled in settings whenever desired.

### Search

Cineshelf includes a quick search menu.

Use **Command + K** on macOS or **Control + K** on Windows to open search.

Search results prioritize movies and TV shows first, then anime.

### Watch List

Cineshelf includes a watch list feature so users can save content they want to watch later.

### Favorites

Users can favorite:

- Movies
- TV shows
- Some anime

Favorites are saved for quick access inside the app.

## Sources

Cineshelf includes built-in source lists for:

- Anime
- Movies
- TV shows

These source lists are provided by the app and are not currently editable by the user.

## Playback Security Warning

When the app tries to play something, Cineshelf may show a security warning before opening or loading the player.

This warning exists to let users know when the app is about to load external media content.

This warning behavior can be changed in the app settings.

## Settings

The settings page allows users to control app behavior, including:

- Enabling or disabling mature anime content
- Changing the playback security warning behavior

## Downloads

Cineshelf is available for:

- Windows
- macOS Apple Silicon

### Windows

Windows users should download and run the `.exe` setup installer from the latest GitHub release.

### macOS Apple Silicon

macOS Apple Silicon users should download the `.zip` file from the latest GitHub release, unzip it, and open `Cineshelf.app`.

## macOS Security Note

The macOS build is currently unsigned.

If macOS says the app is damaged or cannot be opened, move `Cineshelf.app` to the Applications folder and run this command in Terminal:

```bash
xattr -cr /Applications/Cineshelf.app
```

Then right-click `Cineshelf.app` and choose **Open**.

## Windows Security Note

The Windows build is currently unsigned.

Windows SmartScreen may show a warning when opening the installer. This is expected for unsigned apps.

## Current Limitations

- Source lists are built into the app and are not currently editable.
- Favorites are supported for movies, TV shows, and some anime.
- Search prioritizes movies and TV shows before anime.
- macOS and Windows builds are unsigned.

## Disclaimer

Cineshelf is a personal media browsing project. Users are responsible for following the laws and terms that apply to their region and to any media sources they use.
