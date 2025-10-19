import { ReaderSettings } from './reader.types';

export interface AppSettings extends ReaderSettings {
  theme: 'light' | 'dark' | 'auto';
  medievalTheme: 'morning' | 'evening' | 'night' | 'auto';
  language: string;
  maxCacheSize: number; // in MB
  enableKeyboardShortcuts: boolean;
  enableTouchGestures: boolean;
  enablePreloading: boolean;
  maxConcurrentLoads: number;
  libraryViewMode: 'grid' | 'bookshelf';
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: string;
  description: string;
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'ArrowRight', action: 'nextPage', description: 'Next page' },
  { key: 'ArrowLeft', action: 'previousPage', description: 'Previous page' },
  { key: 'ArrowDown', action: 'scrollDown', description: 'Scroll down' },
  { key: 'ArrowUp', action: 'scrollUp', description: 'Scroll up' },
  { key: 'f', action: 'toggleFullscreen', description: 'Toggle fullscreen' },
  { key: 'Escape', action: 'exitFullscreen', description: 'Exit fullscreen' },
  { key: 'm', action: 'toggleReadingMode', description: 'Toggle reading mode' },
  { key: 'h', action: 'toggleUI', description: 'Toggle UI visibility' },
  { key: 'Home', action: 'firstPage', description: 'Go to first page' },
  { key: 'End', action: 'lastPage', description: 'Go to last page' },
];
