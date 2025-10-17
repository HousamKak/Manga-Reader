export interface Manga {
  id: string;
  title: string;
  urlSlug: string; // e.g., "my-gift-lvl-9999-unlimited-gacha"
  baseUrl: string; // e.g., "https://manga.pics"
  coverImage?: string;
  totalChapters?: number;
  chapters: Chapter[];
  lastRead?: {
    chapterId: string;
    page: number;
    timestamp: number;
  };
  dateAdded: number;
  dateUpdated: number;
}

export interface Chapter {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title?: string;
  totalPages?: number;
  pages: Page[];
  isDiscovered: boolean; // Whether pages have been auto-discovered
  lastReadPage?: number;
  progress: number; // 0-100
}

export interface Page {
  id: string;
  chapterId: string;
  pageNumber: number;
  imageUrl: string;
  isLoaded: boolean;
  isCached: boolean;
  loadError?: string;
}

export interface MangaUrlPattern {
  baseUrl: string;
  mangaSlug: string;
  chapterNumber: number;
  pageNumber: number;
}

export interface DiscoveryResult {
  success: boolean;
  totalChapters?: number;
  totalPages?: number;
  error?: string;
}
