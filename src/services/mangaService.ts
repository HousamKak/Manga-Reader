import { buildMangaPageUrl, buildSourcePageUrl, parseMangaUrl } from '@/utils/urlBuilder';
import { checkImageExists } from '@/utils/imageLoader';
import { MangaUrlPattern, DiscoveryResult, Chapter, Page } from '@/types/manga.types';
import { getSourceById } from './sourceService';

const PAGE_START_CANDIDATES = [0, 1, 2];

/**
 * Discovers the total number of chapters for a manga
 * Uses exponential probing to find an upper bound, then binary search
 * Automatically adapts to manga that start page numbering at 0 or 1
 * Supports both legacy baseUrl and new sourceId
 */
export async function discoverChapterCount(
  baseUrl: string,
  mangaSlug: string,
  maxChapters: number = 4096,
  sourceId?: string
): Promise<DiscoveryResult> {
  try {
    const source = sourceId ? getSourceById(sourceId) : null;
    const existenceCache = new Map<number, boolean>();
    let firstPageNumber: number | null = null;

    const chapterExists = async (chapterNumber: number): Promise<boolean> => {
      if (chapterNumber <= 0) return false;

      if (existenceCache.has(chapterNumber)) {
        return existenceCache.get(chapterNumber)!;
      }

      const candidates =
        firstPageNumber !== null
          ? [firstPageNumber, ...PAGE_START_CANDIDATES.filter((value) => value !== firstPageNumber)]
          : PAGE_START_CANDIDATES;

      for (const pageNumber of candidates) {
        const testUrl = source
          ? buildSourcePageUrl({ source, mangaSlug, chapterNumber, pageNumber })
          : buildMangaPageUrl({ baseUrl, mangaSlug, chapterNumber, pageNumber });

        if (await checkImageExists(testUrl)) {
          firstPageNumber = pageNumber;
          existenceCache.set(chapterNumber, true);
          return true;
        }
      }

      existenceCache.set(chapterNumber, false);
      return false;
    };

    let lastValidChapter = 0;
    let probe = 1;
    let firstInvalidChapter = maxChapters + 1;

    while (probe <= maxChapters) {
      const exists = await chapterExists(probe);
      if (!exists) {
        firstInvalidChapter = probe;
        break;
      }

      lastValidChapter = probe;

      if (probe === maxChapters) {
        break;
      }

      const nextProbe = probe * 2;
      probe = nextProbe > maxChapters ? maxChapters : nextProbe;
      if (probe === lastValidChapter) {
        // Prevent infinite loop if maxChapters was hit exactly
        firstInvalidChapter = maxChapters + 1;
        break;
      }
    }

    if (lastValidChapter === 0) {
      return {
        success: false,
        error: 'No chapters found'
      };
    }

    let low = lastValidChapter + 1;
    let high = Math.min(firstInvalidChapter - 1, maxChapters);

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (await chapterExists(mid)) {
        lastValidChapter = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return {
      success: true,
      totalChapters: lastValidChapter,
      firstPageNumber: firstPageNumber ?? 0
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
 * Uses exponential probing + binary search and adapts to page numbering offsets
 * Supports both legacy baseUrl and new sourceId
 */
export async function discoverPageCount(
  baseUrl: string,
  mangaSlug: string,
  chapterNumber: number,
  maxPages: number = 512,
  sourceId?: string
): Promise<DiscoveryResult> {
  try {
    const source = sourceId ? getSourceById(sourceId) : null;
    const existenceCache = new Map<number, boolean>();

    const detectFirstPageNumber = async (): Promise<number | null> => {
      for (const candidate of PAGE_START_CANDIDATES) {
        const testUrl = source
          ? buildSourcePageUrl({ source, mangaSlug, chapterNumber, pageNumber: candidate })
          : buildMangaPageUrl({ baseUrl, mangaSlug, chapterNumber, pageNumber: candidate });

        if (await checkImageExists(testUrl)) {
          existenceCache.set(candidate, true);
          return candidate;
        }
      }

      return null;
    };

    const firstPageNumber = await detectFirstPageNumber();
    if (firstPageNumber === null) {
      return {
        success: false,
        error: 'No pages found'
      };
    }

    const pageExists = async (relativeIndex: number): Promise<boolean> => {
      if (relativeIndex < 0) return false;

      if (existenceCache.has(firstPageNumber + relativeIndex)) {
        return existenceCache.get(firstPageNumber + relativeIndex)!;
      }

      const actualPageNumber = firstPageNumber + relativeIndex;
      const testUrl = source
        ? buildSourcePageUrl({ source, mangaSlug, chapterNumber, pageNumber: actualPageNumber })
        : buildMangaPageUrl({ baseUrl, mangaSlug, chapterNumber, pageNumber: actualPageNumber });

      const exists = await checkImageExists(testUrl);
      existenceCache.set(actualPageNumber, exists);
      return exists;
    };

    let lastValidRelativeIndex = 0; // We already know first page exists
    let probe = 1;
    let firstInvalidRelativeIndex = maxPages + 1;

    while (probe <= maxPages) {
      const exists = await pageExists(probe);
      if (!exists) {
        firstInvalidRelativeIndex = probe;
        break;
      }

      lastValidRelativeIndex = probe;

      if (probe === maxPages) {
        break;
      }

      const nextProbe = probe * 2;
      probe = nextProbe > maxPages ? maxPages : nextProbe;
      if (probe === lastValidRelativeIndex) {
        firstInvalidRelativeIndex = maxPages + 1;
        break;
      }
    }

    let low = lastValidRelativeIndex + 1;
    let high = Math.min(firstInvalidRelativeIndex - 1, maxPages);

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (await pageExists(mid)) {
        lastValidRelativeIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const totalPages = lastValidRelativeIndex + 1;

    return {
      success: true,
      totalPages,
      firstPageNumber
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
 * Supports both legacy baseUrl and new sourceId
 */
export async function discoverAllChapters(
  baseUrl: string,
  mangaSlug: string,
  mangaId: string,
  onProgress?: (current: number, total: number) => void,
  sourceId?: string
): Promise<Chapter[]> {
  const chapterResult = await discoverChapterCount(baseUrl, mangaSlug, 4096, sourceId);

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
 * Supports both legacy baseUrl and new sourceId
 */
export async function discoverChapterPages(
  baseUrl: string,
  mangaSlug: string,
  mangaId: string,
  chapterNumber: number,
  sourceId?: string
): Promise<Page[]> {
  const source = sourceId ? getSourceById(sourceId) : null;
  const pageResult = await discoverPageCount(baseUrl, mangaSlug, chapterNumber, 512, sourceId);

  if (!pageResult.success || !pageResult.totalPages) {
    throw new Error(pageResult.error || 'Failed to discover pages');
  }

  const pages: Page[] = [];
  const firstPageNumber = pageResult.firstPageNumber ?? 0;

  // Pages are 0-indexed, so start from 0
  for (let j = 0; j < pageResult.totalPages; j++) {
    const actualPageNumber = firstPageNumber + j;

    pages.push({
      id: `${mangaId}-ch${chapterNumber}-p${j}`,
      chapterId: `${mangaId}-ch${chapterNumber}`,
      pageNumber: j,
      imageUrl: source
        ? buildSourcePageUrl({ source, mangaSlug, chapterNumber, pageNumber: actualPageNumber })
        : buildMangaPageUrl({ baseUrl, mangaSlug, chapterNumber, pageNumber: actualPageNumber }),
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
 * Supports both legacy baseUrl and new sourceId
 */
export function generateChapterPages(
  baseUrl: string,
  mangaSlug: string,
  mangaId: string,
  chapterNumber: number,
  pageCount: number,
  firstPageNumber: number = 0,
  sourceId?: string
): Page[] {
  const source = sourceId ? getSourceById(sourceId) : null;
  const pages: Page[] = [];

  // Pages are 0-indexed
  for (let i = 0; i < pageCount; i++) {
    const actualPageNumber = firstPageNumber + i;

    pages.push({
      id: `${mangaId}-ch${chapterNumber}-p${i}`,
      chapterId: `${mangaId}-ch${chapterNumber}`,
      pageNumber: i,
      imageUrl: source
        ? buildSourcePageUrl({ source, mangaSlug, chapterNumber, pageNumber: actualPageNumber })
        : buildMangaPageUrl({ baseUrl, mangaSlug, chapterNumber, pageNumber: actualPageNumber }),
      isLoaded: false,
      isCached: false
    });
  }

  return pages;
}
