import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type { Database, Json } from '@/types/database.types';
import type { Manga, Chapter, Page } from '@/types/manga.types';
import type { AppSettings } from '@/types/settings.types';
import { getSupabaseClient, getCurrentUserId } from './supabaseClient';

interface MangaReaderDB extends DBSchema {
  imageCache: {
    key: string;
    value: {
      url: string;
      blob: Blob;
      timestamp: number;
      size: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

type MangaRow = Database['public']['Tables']['manga']['Row'];
type ChapterRow = Database['public']['Tables']['chapters']['Row'];
type PageRow = Database['public']['Tables']['pages']['Row'];
type SettingsRow = Database['public']['Tables']['settings']['Row'];

type MangaRowWithRelations = MangaRow & {
  chapters?: (ChapterRow & { pages?: PageRow[] })[];
};

let db: IDBPDatabase<MangaReaderDB> | null = null;

const INDEXED_DB_NAME = 'manga-reader-db';
const INDEXED_DB_VERSION = 2;
const SETTINGS_STORAGE_KEY = 'manga-reader-settings';
const GLOBAL_SETTINGS_ID = 'global';

// ---------------------------------------------------------------------------
// IndexedDB helpers (image cache only)
// ---------------------------------------------------------------------------

export async function initDB(): Promise<IDBPDatabase<MangaReaderDB>> {
  if (db) return db;

  db = await openDB<MangaReaderDB>(INDEXED_DB_NAME, INDEXED_DB_VERSION, {
    upgrade(database, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const imageCacheStore = database.createObjectStore('imageCache', {
          keyPath: 'url'
        });
        imageCacheStore.createIndex('by-timestamp', 'timestamp');
      }

      if (oldVersion < 2) {
        // Remove legacy stores once used for manga/settings persistence.
        const legacyDatabase = database as unknown as IDBDatabase;
        const stores = Array.from(legacyDatabase.objectStoreNames);

        if (stores.includes('manga')) {
          legacyDatabase.deleteObjectStore('manga');
        }

        if (stores.includes('settings')) {
          legacyDatabase.deleteObjectStore('settings');
        }

        // Ensure the image cache store exists with the required index.
        if (!database.objectStoreNames.contains('imageCache')) {
          const imageCacheStore = database.createObjectStore('imageCache', {
            keyPath: 'url'
          });
          imageCacheStore.createIndex('by-timestamp', 'timestamp');
        } else {
          const imageCacheStore = transaction.objectStore('imageCache');
          if (!imageCacheStore.indexNames.contains('by-timestamp')) {
            imageCacheStore.createIndex('by-timestamp', 'timestamp');
          }
        }
      }
    }
  });

  return db;
}

// ---------------------------------------------------------------------------
// Supabase serialization helpers
// ---------------------------------------------------------------------------

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function parseIsoTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function toIsoTimestamp(value: number): string {
  return new Date(value).toISOString();
}

function parseLastRead(data: MangaRow['last_read']): Manga['lastRead'] | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }

  const payload = data as Record<string, unknown>;
  const chapterId = typeof payload.chapterId === 'string' ? payload.chapterId : undefined;
  const page = typeof payload.page === 'number' ? payload.page : undefined;
  const timestampValue = payload.timestamp;
  const timestamp =
    typeof timestampValue === 'number'
      ? timestampValue
      : typeof timestampValue === 'string'
        ? Number(timestampValue)
        : undefined;

  if (!chapterId || page === undefined || timestamp === undefined || Number.isNaN(timestamp)) {
    return undefined;
  }

  return {
    chapterId,
    page,
    timestamp
  };
}

function toLastReadPayload(lastRead: Manga['lastRead'] | undefined): Json | null {
  if (!lastRead) return null;

  return {
    chapterId: lastRead.chapterId,
    page: lastRead.page,
    timestamp: lastRead.timestamp
  };
}

function deserializePage(row: PageRow): Page {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    pageNumber: row.page_number,
    imageUrl: row.image_url,
    isLoaded: false,
    isCached: row.is_cached,
    loadError: row.load_error ?? undefined
  };
}

function deserializeChapter(row: ChapterRow & { pages?: PageRow[] }): Chapter {
  const pages = ensureArray(row.pages)
    .sort((a, b) => a.page_number - b.page_number)
    .map(deserializePage);

  return {
    id: row.id,
    mangaId: row.manga_id,
    chapterNumber: row.chapter_number,
    title: row.title ?? undefined,
    totalPages: row.total_pages ?? undefined,
    pages,
    isDiscovered: row.is_discovered,
    lastReadPage: row.last_read_page ?? undefined,
    progress: row.progress
  };
}

function deserializeManga(row: MangaRowWithRelations): Manga {
  const chapters = ensureArray(row.chapters)
    .sort((a, b) => a.chapter_number - b.chapter_number)
    .map((chapter) => deserializeChapter(chapter));

  return {
    id: row.id,
    title: row.title,
    urlSlug: row.slug,
    baseUrl: row.base_url,
    coverImage: row.cover_image ?? undefined,
    totalChapters: row.total_chapters ?? undefined,
    status: row.status ?? 'plan',
    tags: ensureArray(row.tags),
    chapters,
    lastRead: parseLastRead(row.last_read),
    dateAdded: parseIsoTimestamp(row.date_added),
    dateUpdated: parseIsoTimestamp(row.date_updated)
  };
}

function serializeManga(manga: Manga, userId: string | null): Database['public']['Tables']['manga']['Insert'] {
  return {
    id: manga.id,
    user_id: userId,
    title: manga.title,
    slug: manga.urlSlug,
    base_url: manga.baseUrl,
    cover_image: manga.coverImage ?? null,
    total_chapters: manga.totalChapters ?? null,
    status: manga.status,
    tags: manga.tags ?? [],
    last_read: toLastReadPayload(manga.lastRead),
    date_added: toIsoTimestamp(manga.dateAdded),
    date_updated: toIsoTimestamp(manga.dateUpdated)
  };
}

function serializeChapters(chapters: Chapter[]): Database['public']['Tables']['chapters']['Insert'][] {
  return chapters.map((chapter) => ({
    id: chapter.id,
    manga_id: chapter.mangaId,
    chapter_number: chapter.chapterNumber,
    title: chapter.title ?? null,
    total_pages: chapter.totalPages ?? null,
    is_discovered: chapter.isDiscovered,
    last_read_page: chapter.lastReadPage ?? null,
    progress: chapter.progress
  }));
}

function serializePages(chapters: Chapter[]): Database['public']['Tables']['pages']['Insert'][] {
  const records: Database['public']['Tables']['pages']['Insert'][] = [];

  chapters.forEach((chapter) => {
    chapter.pages.forEach((page) => {
      records.push({
        id: page.id,
        chapter_id: chapter.id,
        page_number: page.pageNumber,
        image_url: page.imageUrl,
        is_cached: page.isCached,
        load_error: page.loadError ?? null
      });
    });
  });

  return records;
}

// ---------------------------------------------------------------------------
// Manga persistence via Supabase
// ---------------------------------------------------------------------------

export async function saveManga(manga: Manga): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const payload = serializeManga(manga, userId);

  const { error: mangaError } = await supabase.from('manga').upsert(payload);
  if (mangaError) {
    throw new Error(`Failed to save manga: ${mangaError.message}`);
  }

  // Replace chapters and pages in a straightforward way to keep logic simple.
  const { error: deleteChaptersError } = await supabase.from('chapters').delete().eq('manga_id', manga.id);
  if (deleteChaptersError) {
    throw new Error(`Failed to reset chapters: ${deleteChaptersError.message}`);
  }

  const chapterRecords = serializeChapters(manga.chapters);

  if (chapterRecords.length > 0) {
    const { error: upsertChaptersError } = await supabase.from('chapters').upsert(chapterRecords);
    if (upsertChaptersError) {
      throw new Error(`Failed to save chapters: ${upsertChaptersError.message}`);
    }

    const pageRecords = serializePages(manga.chapters);
    if (pageRecords.length > 0) {
      const { error: upsertPagesError } = await supabase.from('pages').upsert(pageRecords);
      if (upsertPagesError) {
        throw new Error(`Failed to save pages: ${upsertPagesError.message}`);
      }
    }
  }
}

export async function getManga(id: string): Promise<Manga | undefined> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('manga')
    .select(
      `
        *,
        chapters:chapters (
          *,
          pages:pages (*)
        )
      `
    )
    .eq('id', id)
    .order('chapter_number', { referencedTable: 'chapters', ascending: true })
    .order('page_number', { referencedTable: 'pages', ascending: true })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load manga: ${error.message}`);
  }

  if (!data) return undefined;

  return deserializeManga(data as MangaRowWithRelations);
}

export async function getAllManga(): Promise<Manga[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('manga')
    .select(
      `
        *,
        chapters:chapters (
          *,
          pages:pages (*)
        )
      `
    )
    .order('date_added', { ascending: false })
    .order('chapter_number', { referencedTable: 'chapters', ascending: true })
    .order('page_number', { referencedTable: 'pages', ascending: true });

  if (error) {
    throw new Error(`Failed to load manga library: ${error.message}`);
  }

  return ensureArray(data as MangaRowWithRelations[]).map(deserializeManga);
}

export async function deleteManga(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('manga').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete manga: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Settings persistence via Supabase (with localStorage mirror)
// ---------------------------------------------------------------------------

function getBrowserLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (_error) {
    return null;
  }
}

function writeSettingsToLocalStorage(settings: AppSettings): void {
  const storage = getBrowserLocalStorage();
  if (!storage) return;

  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

function readSettingsFromLocalStorage(): AppSettings | null {
  const storage = getBrowserLocalStorage();
  if (!storage) return null;

  try {
    const stored = storage.getItem(SETTINGS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AppSettings) : null;
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  writeSettingsToLocalStorage(settings);

  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const recordId = userId ?? GLOBAL_SETTINGS_ID;

  const { error } = await supabase.from('settings').upsert({
    id: recordId,
    user_id: userId,
    data: settings as unknown as Json
  });

  if (error) {
    throw new Error(`Failed to save settings to Supabase: ${error.message}`);
  }
}

export async function getSettings(): Promise<AppSettings | undefined> {
  const localSettings = readSettingsFromLocalStorage();
  if (localSettings) {
    return localSettings;
  }

  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const recordId = userId ?? GLOBAL_SETTINGS_ID;

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', recordId)
    .maybeSingle<SettingsRow>();

  if (error) {
    throw new Error(`Failed to load settings from Supabase: ${error.message}`);
  }

  if (!data && userId) {
    // Fallback to the global settings row when a user-specific entry is missing.
    const { data: globalSettings, error: globalError } = await supabase
      .from('settings')
      .select('*')
      .eq('id', GLOBAL_SETTINGS_ID)
      .maybeSingle<SettingsRow>();

    if (globalError) {
      throw new Error(`Failed to load global settings: ${globalError.message}`);
    }

    if (globalSettings) {
      const parsed = globalSettings.data as unknown as AppSettings;
      writeSettingsToLocalStorage(parsed);
      return parsed;
    }

    return undefined;
  }

  if (!data) return undefined;

  const parsed = data.data as unknown as AppSettings;
  writeSettingsToLocalStorage(parsed);
  return parsed;
}

// ---------------------------------------------------------------------------
// Image cache helpers (IndexedDB)
// ---------------------------------------------------------------------------

export async function cacheImage(url: string, blob: Blob): Promise<void> {
  const database = await initDB();
  await database.put('imageCache', {
    url,
    blob,
    timestamp: Date.now(),
    size: blob.size
  });
}

export async function getCachedImage(url: string): Promise<Blob | undefined> {
  const database = await initDB();
  const cached = await database.get('imageCache', url);
  return cached?.blob;
}

export async function getCacheSize(): Promise<number> {
  const database = await initDB();
  const allCached = await database.getAll('imageCache');
  return allCached.reduce((total, item) => total + item.size, 0);
}

export async function pruneCache(maxSizeBytes: number): Promise<void> {
  const database = await initDB();
  const allCached = await database.getAllFromIndex('imageCache', 'by-timestamp');

  let totalSize = allCached.reduce((sum, item) => sum + item.size, 0);

  for (const item of allCached) {
    if (totalSize <= maxSizeBytes) break;
    await database.delete('imageCache', item.url);
    totalSize -= item.size;
  }
}

export async function clearCache(): Promise<void> {
  const database = await initDB();
  await database.clear('imageCache');
}

// ---------------------------------------------------------------------------
// Browser localStorage helpers (unchanged API)
// ---------------------------------------------------------------------------

export const localStorageHelper = {
  get<T>(key: string): T | null {
    try {
      const storage = getBrowserLocalStorage();
      if (!storage) return null;
      const item = storage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      const storage = getBrowserLocalStorage();
      storage?.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  remove(key: string): void {
    const storage = getBrowserLocalStorage();
    storage?.removeItem(key);
  },

  clear(): void {
    const storage = getBrowserLocalStorage();
    storage?.clear();
  }
};
