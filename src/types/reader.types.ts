export type ReadingMode = 'continuous' | 'single' | 'double';
export type ReadingDirection = 'ltr' | 'rtl';
export type ImageFit = 'width' | 'height' | 'contain' | 'cover';
export type BackgroundColor = 'white' | 'black' | 'sepia';

export interface ReaderSettings {
  readingMode: ReadingMode;
  readingDirection: ReadingDirection;
  imageFit: ImageFit;
  backgroundColor: BackgroundColor;
  showPageNumbers: boolean;
  preloadPages: number; // Number of pages to preload ahead
  fullscreen: boolean;
  autoHideUI: boolean;
  autoHideDelay: number; // milliseconds
  defaultZoom: number; // Default zoom level (0.5 to 3.0)
}

export interface ReaderState {
  mangaId: string | null;
  chapterId: string | null;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  uiVisible: boolean;
  zoom: number;
  panX: number;
  panY: number;
}

export interface NavigationState {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  hasNextChapter: boolean;
  hasPreviousChapter: boolean;
  currentChapterIndex: number;
  totalChapters: number;
}
