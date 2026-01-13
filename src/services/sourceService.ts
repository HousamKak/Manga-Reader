import { MangaSource, PREDEFINED_SOURCES } from "@/types/source.types";

const STORAGE_KEY = "manga-reader-sources";

/**
 * Generate a unique ID for a source
 */
function generateSourceId(): string {
  return `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load all sources from storage
 */
export function loadSources(): MangaSource[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load sources:", error);
  }

  // Initialize with predefined sources (they already have stable IDs)
  saveSources(PREDEFINED_SOURCES);
  return PREDEFINED_SOURCES;
}

/**
 * Save sources to storage
 */
export function saveSources(sources: MangaSource[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  } catch (error) {
    console.error("Failed to save sources:", error);
  }
}

/**
 * Get a source by ID
 */
export function getSourceById(sourceId: string): MangaSource | null {
  const sources = loadSources();
  const found = sources.find((s) => s.id === sourceId) || null;
  console.log(`[SourceService] getSourceById("${sourceId}"):`, found ? { id: found.id, name: found.name, baseUrl: found.baseUrl } : 'NOT FOUND');
  console.log(`[SourceService] Available source IDs:`, sources.map(s => s.id));
  return found;
}

/**
 * Get all active sources
 */
export function getActiveSources(): MangaSource[] {
  return loadSources().filter((s) => s.isActive);
}

/**
 * Add a new source
 */
export function addSource(
  sourceData: Omit<MangaSource, "id" | "dateAdded">
): MangaSource {
  const sources = loadSources();

  const newSource: MangaSource = {
    ...sourceData,
    id: generateSourceId(),
    dateAdded: Date.now(),
    isCustom: true,
  };

  sources.push(newSource);
  saveSources(sources);

  return newSource;
}

/**
 * Update an existing source
 */
export function updateSource(
  sourceId: string,
  updates: Partial<Omit<MangaSource, "id" | "dateAdded">>
): boolean {
  const sources = loadSources();
  const index = sources.findIndex((s) => s.id === sourceId);

  if (index === -1) return false;

  sources[index] = {
    ...sources[index],
    ...updates,
  };

  saveSources(sources);
  return true;
}

/**
 * Delete a source (only custom sources can be deleted)
 */
export function deleteSource(sourceId: string): boolean {
  const sources = loadSources();
  const source = sources.find((s) => s.id === sourceId);

  if (!source || !source.isCustom) {
    return false;
  }

  const filteredSources = sources.filter((s) => s.id !== sourceId);
  saveSources(filteredSources);

  return true;
}

/**
 * Toggle source active status
 */
export function toggleSourceActive(sourceId: string): boolean {
  const sources = loadSources();
  const source = sources.find((s) => s.id === sourceId);

  if (!source) return false;

  source.isActive = !source.isActive;
  saveSources(sources);

  return true;
}

/**
 * Get default source (first active source)
 */
export function getDefaultSource(): MangaSource | null {
  const activeSources = getActiveSources();
  return activeSources.length > 0 ? activeSources[0] : null;
}

/**
 * Validate source URL pattern
 */
export function validateSourceUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
