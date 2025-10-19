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
- Automatic chapter and page discovery against `manga.pics`.
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
- npm (bundled with Node.js)
- Supabase CLI (v1.200 or newer)
- Docker Desktop (for running the local Supabase stack)

### Installation
1. Clone the repository or download the project.
2. Copy the environment template and fill it with your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the local Supabase stack (one-time setup, requires Docker):
   ```bash
   supabase start
   ```
5. Apply the database schema and seed data:
   ```bash
   supabase db reset --seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```
7. Open `http://localhost:5173` in your browser.

> The Supabase CLI writes generated service credentials to `supabase/.env`. Copy the `anon` key from there into your `.env` file as `VITE_SUPABASE_ANON_KEY`. The API URL is `http://127.0.0.1:54321` by default, which matches the template.

### Useful Scripts
- `npm run build` - type-check and generate a production build in `dist/`.
- `npm run preview` - serve the production build locally.
- `npm run lint` - run ESLint across the project.

## Using the App

### Adding Manga
1. Click **Add Manga** in the library view.
2. Enter the slug from the manga URL (for example the slug in `https://manga.pics/my-gift...`).
3. Leave **Automatically discover all chapters** checked to probe chapters and pages immediately (you can disable it).
4. Submit the form; the title is auto-generated from the slug and discovery runs in the background.

See `MANGA_SOURCES.md` for tips on confirming slug spelling.

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

## Database & Storage
- Manga metadata, chapters, and pages are now persisted in Supabase (PostgreSQL) for reliable syncing across devices.
- Application settings are stored in Supabase and mirrored to `localStorage` for fast reads and offline resilience.
- Images remain cached locally in IndexedDB so reading performance is unaffected by network latency.
- Row-Level Security policies limit access to the anonymous role (for the Docker stack) or the authenticated user if you enable Supabase Auth.
- Clearing the browser storage removes cached images and the local settings mirror; clearing the Supabase database removes all manga metadata.

## Deployment
- Branch `main` deploys to GitHub Pages (production) via `.github/workflows/deploy.yml`. Configure repository secrets `PROD_SUPABASE_URL` and `PROD_SUPABASE_ANON_KEY` so the build can target the production Supabase instance.
- Branch `develop` deploys to Cloudflare Pages (UAT) through `.github/workflows/deploy-cloudflare.yml`. Provide secrets `UAT_SUPABASE_URL`, `UAT_SUPABASE_ANON_KEY`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and set the repository variable `UAT_CLOUDFLARE_PROJECT` to the Cloudflare Pages project name (for example `manga-housamkak-uat`).
- Both workflows run linting before builds; CI still covers the full lint/build/migration checks in `.github/workflows/ci.yml`.

## Project Structure

```
supabase/
  config.toml            # Local Supabase stack configuration
  migrations/            # SQL migrations (schema, policies, triggers)
  seed.sql               # Default settings seed
src/
  components/
    library/      # Library UI (grid, cards, add dialog)
    reader/       # Reader toolbar, chapter selector, image viewer
    settings/     # Settings panel and form controls
    ui/           # Shared UI primitives
  hooks/          # Reusable logic (preloading, gestures, auto-hide)
  pages/          # Route-level screens (Library, Reader)
  services/       # Data access, discovery, storage helpers
  stores/         # Zustand stores for manga, reader, settings
  types/          # Shared TypeScript definitions
  utils/          # URL builders, validators, helpers
```

## Troubleshooting
- **Images not loading**: Verify the slug and chapter or page exist, then check the browser console for network or CORS errors.
- **Slow discovery**: Large series may take time; you can disable auto-discovery and explore chapters manually.
- **Performance issues**: Lower the preload count, reduce cache size, or disable preloading in settings.
- **Stale pages**: Use the toolbar reload action to force a chapter refresh.

## License

The application is intended for personal use with manga that you have legal rights to access. Ensure you respect the content owner's terms.

## Contributing

Suggestions and improvements are welcome through issues or pull requests.
