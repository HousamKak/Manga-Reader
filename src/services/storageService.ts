import { Manga } from "@/types/manga.types";
import { AppSettings } from "@/types/settings.types";
import { DBSchema, IDBPDatabase, openDB } from "idb";

interface MangaReaderDB extends DBSchema {
  manga: {
    key: string;
    value: Manga;
    indexes: { "by-date": number };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  imageCache: {
    key: string;
    value: {
      url: string;
      blob: Blob;
      timestamp: number;
      size: number;
    };
    indexes: { "by-timestamp": number };
  };
}

let db: IDBPDatabase<MangaReaderDB> | null = null;

const ensureMangaDefaults = (manga: Manga): Manga => {
  const partial = manga as Partial<Manga>;
  return {
    ...manga,
    status: (partial.status as Manga["status"]) ?? "plan",
    tags: Array.isArray(partial.tags) ? (partial.tags as string[]) : [],
  };
};

/**
 * Initializes the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<MangaReaderDB>> {
  if (db) return db;

  db = await openDB<MangaReaderDB>("manga-reader-db", 2, {
    upgrade(database, _oldVersion) {
      // Create manga store if it doesn't exist
      if (!database.objectStoreNames.contains("manga")) {
        const mangaStore = database.createObjectStore("manga", {
          keyPath: "id",
        });
        mangaStore.createIndex("by-date", "dateAdded");
      }

      // Create settings store if it doesn't exist
      if (!database.objectStoreNames.contains("settings")) {
        database.createObjectStore("settings", {
          keyPath: "id",
        });
      }

      // Create image cache store if it doesn't exist
      if (!database.objectStoreNames.contains("imageCache")) {
        const imageCacheStore = database.createObjectStore("imageCache", {
          keyPath: "url",
        });
        imageCacheStore.createIndex("by-timestamp", "timestamp");
      }
    },
  });

  return db;
}

/**
 * Saves a manga to the database
 */
export async function saveManga(manga: Manga): Promise<void> {
  const database = await initDB();
  const mangaToSave = ensureMangaDefaults(manga);
  console.log("[StorageService] Saving manga to IndexedDB:", mangaToSave);
  console.log(
    "[StorageService] sourceId in saved manga:",
    mangaToSave.sourceId
  );
  await database.put("manga", mangaToSave);
}

/**
 * Gets a manga by ID
 */
export async function getManga(id: string): Promise<Manga | undefined> {
  const database = await initDB();
  const manga = await database.get("manga", id);
  const result = manga ? ensureMangaDefaults(manga) : undefined;
  console.log("[StorageService] Retrieved manga:", result);
  console.log(
    "[StorageService] sourceId in retrieved manga:",
    result?.sourceId
  );
  return result;
}

/**
 * Gets all manga sorted by date added (newest first)
 */
export async function getAllManga(): Promise<Manga[]> {
  const database = await initDB();
  const manga = await database.getAllFromIndex("manga", "by-date");
  return manga.reverse().map(ensureMangaDefaults);
}

/**
 * Deletes a manga from the database
 */
export async function deleteManga(id: string): Promise<void> {
  const database = await initDB();
  await database.delete("manga", id);
}

const SETTINGS_STORAGE_KEY = "manga-reader-settings";

function getBrowserLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
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
    console.error("Failed to save settings to localStorage:", error);
  }
}

function readSettingsFromLocalStorage(): AppSettings | null {
  const storage = getBrowserLocalStorage();
  if (!storage) return null;

  try {
    const stored = storage.getItem(SETTINGS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AppSettings) : null;
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
    return null;
  }
}

/**
 * Saves app settings to both IndexedDB and localStorage
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  writeSettingsToLocalStorage(settings);

  // Save to IndexedDB as well
  const database = await initDB();
  await database.put("settings", { ...settings, id: "app-settings" } as any);
}

/**
 * Gets app settings from localStorage (fast) or IndexedDB (fallback)
 */
export async function getSettings(): Promise<AppSettings | undefined> {
  const localSettings = readSettingsFromLocalStorage();
  if (localSettings) {
    return localSettings;
  }

  // Fallback to IndexedDB
  const database = await initDB();
  const settings = await database.get("settings", "app-settings");

  if (settings) {
    writeSettingsToLocalStorage(settings);
  }

  return settings as AppSettings | undefined;
}

/**
 * Caches an image blob
 */
export async function cacheImage(url: string, blob: Blob): Promise<void> {
  const database = await initDB();
  await database.put("imageCache", {
    url,
    blob,
    timestamp: Date.now(),
    size: blob.size,
  });
}

/**
 * Gets a cached image
 */
export async function getCachedImage(url: string): Promise<Blob | undefined> {
  const database = await initDB();
  const cached = await database.get("imageCache", url);
  return cached?.blob;
}

/**
 * Gets the total cache size in bytes
 */
export async function getCacheSize(): Promise<number> {
  const database = await initDB();
  const allCached = await database.getAll("imageCache");
  return allCached.reduce((total, item) => total + item.size, 0);
}

/**
 * Clears old cache entries to stay under the size limit
 */
export async function pruneCache(maxSizeBytes: number): Promise<void> {
  const database = await initDB();
  const allCached = await database.getAllFromIndex(
    "imageCache",
    "by-timestamp"
  );

  let totalSize = allCached.reduce((sum, item) => sum + item.size, 0);

  // Remove oldest entries until under the limit
  for (const item of allCached) {
    if (totalSize <= maxSizeBytes) break;
    await database.delete("imageCache", item.url);
    totalSize -= item.size;
  }
}

/**
 * Clears all cached images
 */
export async function clearCache(): Promise<void> {
  const database = await initDB();
  await database.clear("imageCache");
}

/**
 * LocalStorage helpers for temporary data
 */
export const localStorageHelper = {
  get<T>(key: string): T | null {
    try {
      const storage = getBrowserLocalStorage();
      if (!storage) return null;
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      const storage = getBrowserLocalStorage();
      storage?.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  },

  remove(key: string): void {
    const storage = getBrowserLocalStorage();
    storage?.removeItem(key);
  },

  clear(): void {
    const storage = getBrowserLocalStorage();
    storage?.clear();
  },
};
