import { buildMangaPageUrl, parseMangaUrl } from '@/utils/urlBuilder';
import { checkImageExists } from '@/utils/imageLoader';
import { MangaUrlPattern, DiscoveryResult, Chapter, Page } from '@/types/manga.types';

/**
 * Discovers the total number of chapters for a manga
 * Uses binary search for efficiency
 * Note: Checks page 0 as it's the standard for manga.pics
 */
export async function discoverChapterCount(
  baseUrl: string,
  mangaSlug: string,
  maxChapters: number = 500
): Promise<DiscoveryResult> {
  try {
    let low = 1;
    let high = maxChapters;
    let lastValidChapter = 0;

    // Binary search to find the last chapter
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const testUrl = buildMangaPageUrl({
        baseUrl,
        mangaSlug,
        chapterNumber: mid,
        pageNumber: 0 // Check page 0 to verify chapter exists
      });

      const exists = await checkImageExists(testUrl);

      if (exists) {
        lastValidChapter = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (lastValidChapter === 0) {
      return {
        success: false,
        error: 'No chapters found'
      };
    }

    return {
      success: true,
      totalChapters: lastValidChapter
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Discovers the total number of pages in a chapter
 * Uses binary search for efficiency
 * Note: Pages start from 0, so we search from 0 to maxPages-1
 */
export async function discoverPageCount(
  baseUrl: string,
  mangaSlug: string,
  chapterNumber: number,
  maxPages: number = 100
): Promise<DiscoveryResult> {
  try {
    let low = 0;
    let high = maxPages;
    let lastValidPage = -1;

    // Binary search to find the last page (0-indexed)
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const testUrl = buildMangaPageUrl({
        baseUrl,
        mangaSlug,
        chapterNumber,
        pageNumber: mid
      });

      const exists = await checkImageExists(testUrl);

      if (exists) {
        lastValidPage = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (lastValidPage === -1) {
      return {
        success: false,
        error: 'No pages found'
      };
    }

    return {
      success: true,
      totalPages: lastValidPage + 1 // Return count (0-indexed page + 1)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Discovers all chapters for a manga with progress callback
 * Only discovers chapter count, not page details (pages discovered on-demand)
 */
export async function discoverAllChapters(
  baseUrl: string,
  mangaSlug: string,
  mangaId: string,
  onProgress?: (current: number, total: number) => void
): Promise<Chapter[]> {
  const chapterResult = await discoverChapterCount(baseUrl, mangaSlug);

  if (!chapterResult.success || !chapterResult.totalChapters) {
    throw new Error(chapterResult.error || 'Failed to discover chapters');
  }

  const chapters: Chapter[] = [];

  // Create chapter entries without discovering pages yet
  for (let i = 1; i <= chapterResult.totalChapters; i++) {
    chapters.push({
      id: `${mangaId}-ch${i}`,
      mangaId,
      chapterNumber: i,
      totalPages: undefined, // Will be discovered on-demand
      pages: [], // Empty initially
      isDiscovered: false, // Not fully discovered yet
      progress: 0
    });

    if (onProgress) {
      onProgress(i, chapterResult.totalChapters);
    }
  }

  return chapters;
}

/**
 * Discovers pages for a specific chapter on-demand
 */
export async function discoverChapterPages(
  baseUrl: string,
  mangaSlug: string,
  mangaId: string,
  chapterNumber: number
): Promise<Page[]> {
  const pageResult = await discoverPageCount(baseUrl, mangaSlug, chapterNumber);

  if (!pageResult.success || !pageResult.totalPages) {
    throw new Error(pageResult.error || 'Failed to discover pages');
  }

  const pages: Page[] = [];

  // Pages are 0-indexed, so start from 0
  for (let j = 0; j < pageResult.totalPages; j++) {
    pages.push({
      id: `${mangaId}-ch${chapterNumber}-p${j}`,
      chapterId: `${mangaId}-ch${chapterNumber}`,
      pageNumber: j,
      imageUrl: buildMangaPageUrl({
        baseUrl,
        mangaSlug,
        chapterNumber,
        pageNumber: j
      }),
      isLoaded: false,
      isCached: false
    });
  }

  return pages;
}

/**
 * Validates a manga URL and extracts information
 */
export function validateAndParseMangaUrl(url: string): MangaUrlPattern | null {
  return parseMangaUrl(url);
}

/**
 * Generates page URLs for a chapter without discovery
 */
export function generateChapterPages(
  baseUrl: string,
  mangaSlug: string,
  mangaId: string,
  chapterNumber: number,
  pageCount: number
): Page[] {
  const pages: Page[] = [];

  // Pages are 0-indexed
  for (let i = 0; i < pageCount; i++) {
    pages.push({
      id: `${mangaId}-ch${chapterNumber}-p${i}`,
      chapterId: `${mangaId}-ch${chapterNumber}`,
      pageNumber: i,
      imageUrl: buildMangaPageUrl({
        baseUrl,
        mangaSlug,
        chapterNumber,
        pageNumber: i
      }),
      isLoaded: false,
      isCached: false
    });
  }

  return pages;
}
