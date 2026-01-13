export type SourcePatternType = 'standard' | 'prefixed' | 'custom';

export interface MangaSource {
  id: string;
  name: string;
  baseUrl: string;
  patternType: SourcePatternType;
  pathPrefix?: string; // e.g., "/file/leveling" for Black Clover source
  fileExtension: string; // e.g., "jpg", "webp", "png"
  chapterFormat: string; // e.g., "chapter-{number}", "{number}"
  description?: string;
  isActive: boolean;
  isCustom: boolean; // Whether user added this or it's predefined
  dateAdded: number;
}

export interface SourceUrlPattern {
  source: MangaSource;
  mangaSlug: string;
  chapterNumber: number;
  pageNumber: number;
}

// Predefined sources that come with the app
export const PREDEFINED_SOURCES: Omit<MangaSource, 'id' | 'dateAdded'>[] = [
  {
    name: 'Manga Pics',
    baseUrl: 'https://manga.pics',
    patternType: 'standard',
    fileExtension: 'jpg',
    chapterFormat: 'chapter-{number}',
    description: 'Default manga source with standard URL pattern',
    isActive: true,
    isCustom: false
  },
  {
    name: 'Black Clover CDN',
    baseUrl: 'https://cdn.black-clover.org',
    patternType: 'prefixed',
    pathPrefix: '/file/leveling',
    fileExtension: 'webp',
    chapterFormat: 'chapter-{number}',
    description: 'Black Clover CDN with WebP images',
    isActive: true,
    isCustom: false
  },
  {
    name: 'Raven Scans',
    baseUrl: 'https://ravenscans.com/manga',
    patternType: 'standard',
    fileExtension: 'jpg',
    chapterFormat: 'chapter-{number}',
    description: 'Raven Scans manga source',
    isActive: true,
    isCustom: false
  }
];
