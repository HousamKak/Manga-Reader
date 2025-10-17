# Manga Reader

A modern, ad-free manga reader web application built with React, TypeScript, and Vite. Read your legally purchased manga with an intuitive interface, smooth scrolling, and comprehensive reading features.

## Features

### 📖 Reading Experience
- **Multiple Reading Modes**: Continuous scroll, single page, and double page layouts
- **Zoom & Pan**: Built-in zoom and pan functionality for detailed viewing
- **Image Preloading**: Smart preloading for smooth reading experience
- **Auto-Hide UI**: Minimal interface that hides automatically while reading
- **Fullscreen Support**: Distraction-free fullscreen reading mode

### 🎨 Customization
- **Reading Directions**: Support for LTR (Left-to-Right) and RTL (Right-to-Left)
- **Background Colors**: White, black, and sepia backgrounds
- **Image Fit Options**: Fit to width, height, contain, or cover
- **Theme Support**: Light, dark, and auto theme modes

### ⚡ Performance
- **Intelligent Caching**: IndexedDB-based image caching
- **Progressive Loading**: Lazy loading with configurable preload settings
- **PWA Support**: Install as a standalone app with offline capabilities
- **Optimized Memory**: Virtualization and smart resource management

### 🎮 Controls
- **Keyboard Shortcuts**: Full keyboard navigation support
  - Arrow keys for navigation
  - `F` for fullscreen
  - `M` to toggle reading mode
  - `H` to toggle UI visibility
- **Touch Gestures**: Swipe navigation on mobile devices
- **Mouse Controls**: Click to show/hide UI, scroll for continuous mode

### 📚 Library Management
- **Auto-Discovery**: Automatically discover all chapters and pages
- **Reading Progress**: Track your reading progress across chapters
- **Chapter Selector**: Quick navigation between chapters
- **Manga Organization**: Organize your manga collection

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Adding a Manga

1. Click the "Add Manga" button in the library
2. Enter just the manga slug (e.g., `my-gift-lvl-9999-unlimited-gacha`)
3. Optionally enable auto-discovery to find all chapters automatically
4. Click "Add Manga"

**Note**:
- The app automatically uses `manga.pics` as the source
- The title is auto-generated from the slug (e.g., "My Gift Lvl 9999 Unlimited Gacha")
- Just enter the slug exactly as it appears in the manga URL
- Example: For `https://manga.pics/my-gift-lvl-9999-unlimited-gacha/chapter-1/1.jpg`, just enter `my-gift-lvl-9999-unlimited-gacha`

### Reading a Manga

1. Click on any manga card in your library
2. Use arrow keys, swipe gestures, or on-screen controls to navigate
3. Press `F` for fullscreen, `M` to change reading mode
4. Click anywhere to show/hide the UI
5. Access settings anytime via the toolbar

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← → | Previous/Next page |
| ↑ ↓ | Scroll up/down (continuous mode) |
| F | Toggle fullscreen |
| Esc | Exit fullscreen |
| M | Toggle reading mode |
| H | Toggle UI visibility |
| Home | Go to first page |
| End | Go to last page |

## Technology Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Full type safety
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **IndexedDB (idb)**: Client-side storage
- **React Zoom Pan Pinch**: Image zoom and pan
- **React Router**: Client-side routing
- **Lucide React**: Beautiful icons

## Project Structure

```
src/
├── components/         # React components
│   ├── library/       # Library page components
│   ├── reader/        # Reader page components
│   ├── settings/      # Settings components
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
├── pages/             # Page components
├── services/          # Business logic and services
├── stores/            # Zustand state stores
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Features in Detail

### Smart Chapter Discovery

The app uses binary search to efficiently discover:
- Total number of chapters available
- Number of pages in each chapter
- Automatically generates proper URLs for all pages

### Image Caching

- Images are cached in IndexedDB for offline access
- Configurable cache size limit
- LRU (Least Recently Used) eviction policy
- Manual cache clearing option

### Progress Tracking

- Automatically saves your reading position
- Resume where you left off
- Visual progress indicators
- Per-chapter completion tracking

### PWA Capabilities

- Install as a standalone app on mobile and desktop
- Offline reading for cached chapters
- Fast loading with service worker caching
- Native app-like experience

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with modern JavaScript support

## Privacy & Security

- All data stored locally in your browser
- No external servers or tracking
- No analytics or data collection
- Content Security Policy headers
- Input validation and sanitization

## Troubleshooting

### Images not loading
- Check if the URL format is correct
- Verify you have access to the manga source
- Check browser console for CORS errors
- Try clearing the cache in settings

### Performance issues
- Reduce the number of preload pages in settings
- Lower the cache size limit
- Disable image preloading if needed
- Close other browser tabs to free up memory

### Discovery taking too long
- The binary search algorithm is efficient but may take time for large manga
- You can add manga without auto-discovery and manually navigate
- Progress is shown during discovery

## License

This project is for personal use with legally purchased manga content. Ensure you have proper rights to access any manga you add to your library.

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## Acknowledgments

- Built with inspiration from modern manga reader applications
- Uses open-source libraries and tools from the React ecosystem
- Icons provided by Lucide React
