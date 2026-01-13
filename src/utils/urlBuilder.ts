import { MangaUrlPattern } from "@/types/manga.types";
import { SourceUrlPattern } from "@/types/source.types";

/**
 * Builds a manga page URL from the pattern (legacy support)
 * Example: https://manga.pics/my-gift-lvl-9999-unlimited-gacha/chapter-105/3.jpg
 */
export function buildMangaPageUrl(pattern: MangaUrlPattern): string {
  const { baseUrl, mangaSlug, chapterNumber, pageNumber } = pattern;
  return `${baseUrl}/${mangaSlug}/chapter-${chapterNumber}/${pageNumber}.jpg`;
}

/**
 * Builds a manga page URL using source configuration
 * Supports multiple URL patterns based on source type
 */
export function buildSourcePageUrl(pattern: SourceUrlPattern): string {
  const { source, mangaSlug, chapterNumber, pageNumber } = pattern;
  const { baseUrl, patternType, pathPrefix, fileExtension, chapterFormat } =
    source;

  // Build chapter part with format
  const chapterPart = chapterFormat.replace(
    "{number}",
    chapterNumber.toString()
  );

  // Build URL based on pattern type
  switch (patternType) {
    case "prefixed":
      // Example: https://cdn.black-clover.org/file/leveling/hells-paradise/chapter-11/2.webp
      return `${baseUrl}${pathPrefix}/${mangaSlug}/${chapterPart}/${pageNumber}.${fileExtension}`;

    case "standard":
    default:
      // Example: https://manga.pics/my-gift/chapter-105/3.jpg
      return `${baseUrl}/${mangaSlug}/${chapterPart}/${pageNumber}.${fileExtension}`;
  }
}

/**
 * Parses a manga URL to extract the pattern components
 * Supports multiple URL patterns
 */
export function parseMangaUrl(url: string): MangaUrlPattern | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter((p) => p);

    if (pathParts.length < 3) return null;

    // Try to detect pattern type
    let mangaSlug = "";
    let chapterPart = "";
    let pagePart = "";

    // Check for prefixed pattern (e.g., /file/leveling/manga-name/chapter-X/page.ext)
    if (pathParts.length >= 5 && pathParts[0] === "file") {
      mangaSlug = pathParts[2];
      chapterPart = pathParts[3];
      pagePart = pathParts[4];
    } else {
      // Standard pattern
      mangaSlug = pathParts[0];
      chapterPart = pathParts[1];
      pagePart = pathParts[2];
    }

    // Extract chapter number
    const chapterMatch =
      chapterPart.match(/chapter-?(\d+)/i) || chapterPart.match(/(\d+)/);
    if (!chapterMatch) return null;

    // Extract page number and extension
    const pageMatch = pagePart.match(/(\d+)\.(jpg|webp|png|jpeg)/i);
    if (!pageMatch) return null;

    return {
      baseUrl: `${urlObj.protocol}//${urlObj.host}`,
      mangaSlug,
      chapterNumber: parseInt(chapterMatch[1]),
      pageNumber: parseInt(pageMatch[1]),
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
