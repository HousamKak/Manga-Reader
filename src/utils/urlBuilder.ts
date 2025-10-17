import { MangaUrlPattern } from '@/types/manga.types';

/**
 * Builds a manga page URL from the pattern
 * Example: https://manga.pics/my-gift-lvl-9999-unlimited-gacha/chapter-105/3.jpg
 */
export function buildMangaPageUrl(pattern: MangaUrlPattern): string {
  const { baseUrl, mangaSlug, chapterNumber, pageNumber } = pattern;
  return `${baseUrl}/${mangaSlug}/chapter-${chapterNumber}/${pageNumber}.jpg`;
}

/**
 * Parses a manga URL to extract the pattern components
 */
export function parseMangaUrl(url: string): MangaUrlPattern | null {
  try {
    // Pattern: https://manga.pics/{manga-slug}/chapter-{number}/{page}.jpg
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);

    if (pathParts.length < 3) return null;

    const mangaSlug = pathParts[0];
    const chapterPart = pathParts[1];
    const pagePart = pathParts[2];

    const chapterMatch = chapterPart.match(/chapter-(\d+)/);
    const pageMatch = pagePart.match(/(\d+)\.jpg/);

    if (!chapterMatch || !pageMatch) return null;

    return {
      baseUrl: `${urlObj.protocol}//${urlObj.host}`,
      mangaSlug,
      chapterNumber: parseInt(chapterMatch[1]),
      pageNumber: parseInt(pageMatch[1])
    };
  } catch {
    return null;
  }
}

/**
 * Validates a manga URL format
 */
export function validateMangaUrl(url: string): boolean {
  return parseMangaUrl(url) !== null;
}

/**
 * Extracts the manga slug from a URL
 */
export function extractMangaSlug(url: string): string | null {
  const pattern = parseMangaUrl(url);
  return pattern?.mangaSlug || null;
}
