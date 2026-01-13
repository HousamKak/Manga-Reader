# Manga Reader

A modern, ad-free manga reader built with React, TypeScript, and Vite. The app focuses on a smooth reading experience, local-first data storage, and fast navigation between chapters and pages of manga that you own.

## Key Features

### Reading Experience

- Continuous scroll, single page, and double page modes with on-screen controls for quick switching.
- Zoom and pan support powered by `react-zoom-pan-pinch`.
- Smart preloading around the current page to minimise loading gaps.
- Auto-hide interface that reappears on click or key press.
- Fullscreen toggle with graceful fallback when unsupported.

### Customisation

- Reading direction options (left-to-right or right-to-left).
- Adjustable background (white, black, or sepia) and configurable image fit.
- Default zoom level and preload depth stored per user.
- Theme preference (light, dark, auto) synced across sessions.

### Library Management

- Add manga by slug (for example `my-gift-lvl-9999-unlimited-gacha`).
- **Multiple manga sources** with support for different URL patterns and file formats.
- **Source management** - add, edit, and manage custom manga sources.
- Automatic chapter and page discovery with source-specific URL patterns.
- Last-read position tracking per manga with resume support.
- Library overview with delete, progress, and chapter discovery status indicators.

### Performance and Offline Capability

- IndexedDB-backed storage for manga metadata, reader settings, and image cache.
- LRU-style cache pruning with adjustable size limit.
- Optional preloading and concurrency controls for resource management.
- PWA-ready Vite configuration for installable builds.

### Input Controls

- Keyboard navigation, swipe gestures, and mouse or tap interactions.
- Chapter selector drawer and settings panel accessible within the reader.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

### Installation

1. Clone the repository or download the project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

### Useful Scripts

- `npm run build` - type-check and generate a production build in `dist/`.
- `npm run preview` - serve the production build locally.
- `npm run lint` - run ESLint across the project.

## Using the App

### Adding Manga

1. Click **Add Manga** in the library view.
2. Enter the manga name (spaces will be converted to dashes automatically).
3. **Select a manga source** from the dropdown (defaults to Manga Pics).
4. Leave **Automatically discover all chapters** checked to probe chapters and pages immediately (you can disable it).
5. Submit the form; the title is auto-generated from the slug and discovery runs in the background.

See `MANGA_SOURCES.md` for detailed information about available sources and how to add custom sources.

### Managing Manga Sources

1. Open Settings (gear icon).
2. Scroll to the **Manga Sources** section.
3. View all available sources (built-in and custom).
4. **Add Custom Source**: Click "Add Source" and fill in:
   - Source name, base URL, pattern type
   - File extension (jpg, webp, png)
   - Chapter format and optional path prefix
5. **Edit/Delete**: Use the icons next to each source.
6. **Activate/Deactivate**: Toggle sources on/off with the power icon.

#### Built-in Sources

- **Manga Pics** (default): `https://manga.pics` - JPG format
- **Black Clover CDN**: `https://cdn.black-clover.org` - WebP format with `/file/leveling` prefix
- **Raven Scans**: `https://ravenscans.com/manga` - JPG format

### Library View

- Displays every manga stored locally with progress indicators.
- Discovery progress banner shows chapter and page probing status.
- Delete a manga to remove its metadata and cached state from the browser.

### Reader View

- Toolbar provides chapter navigation, reading mode toggle, image fit, and fullscreen controls.
- Chapter selector lists discovered chapters; select one to jump instantly.
- Settings panel exposes reading direction, background colour, preload depth, cache size, and more.
- Continuous mode renders all pages vertically; single and double page modes use page controls with next and previous chapter shortcuts.

### Keyboard Shortcuts

| Key        | Action                   |
| ---------- | ------------------------ |
| ArrowRight | Next page                |
| ArrowLeft  | Previous page            |
| ArrowDown  | Scroll down (continuous) |
| ArrowUp    | Scroll up (continuous)   |
| F          | Toggle fullscreen        |
| Escape     | Exit fullscreen          |
| M          | Toggle reading mode      |
| H          | Toggle UI visibility     |
| Home       | Go to first page         |
| End        | Go to last page          |

Touch gestures (swipe left and right) and mouse clicks are also supported for navigation when enabled in settings.

## Data Storage and Privacy

- Manga metadata, settings, and cached images live entirely in the browser (IndexedDB plus a localStorage mirror for fast settings reads).
- No external servers, analytics, or tracking scripts are involved.
- Clearing the browser storage removes all saved manga and preferences.

## Project Structure

```
src/
  components/
    library/      # Library UI (grid, cards, add dialog)
    reader/       # Reader toolbar, chapter selector, image viewer
    settings/     # Settings panel, source manager, form controls
    ui/           # Shared UI primitives
  hooks/          # Reusable logic (preloading, gestures, auto-hide)
  pages/          # Route-level screens (Library, Reader)
  services/       # Data access, discovery, storage, source management
  stores/         # Zustand stores for manga, reader, settings
  types/          # Shared TypeScript definitions
  utils/          # URL builders, validators, helpers
```

## Troubleshooting

- **Images not loading**: Verify the manga slug and ensure the selected source is correct. Try a different source or check the browser console for network or CORS errors.
- **Source not working**: Check if the source is active in settings, verify the URL pattern matches the actual source structure.
- **Slow discovery**: Large series may take time; you can disable auto-discovery and explore chapters manually.
- **Performance issues**: Lower the preload count, reduce cache size, or disable preloading in settings.
- **Stale pages**: Use the toolbar reload action to force a chapter refresh.

## License

The application is intended for personal use with manga that you have legal rights to access. Ensure you respect the content owner's terms.

## Contributing

Suggestions and improvements are welcome through issues or pull requests.
