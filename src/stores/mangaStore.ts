import {
  discoverAllChapters,
  discoverChapterPages,
} from "@/services/mangaService";
import { getSourceById } from "@/services/sourceService";
import {
  deleteManga,
  getAllManga,
  getManga,
  saveManga,
} from "@/services/storageService";
import { Chapter, Manga } from "@/types/manga.types";
import { buildMangaPageUrl, buildSourcePageUrl } from "@/utils/urlBuilder";
import { create } from "zustand";

const normalizeManga = (manga: Manga): Manga => {
  const partial = manga as Partial<Manga>;
  return {
    ...manga,
    status: (partial.status as Manga["status"]) ?? "plan",
    tags: Array.isArray(partial.tags) ? (partial.tags as string[]) : [],
  };
};

const mangaUpdateQueue = new Map<string, Promise<void>>();

interface MangaStore {
  manga: Manga[];
  currentManga: Manga | null;
  isLoading: boolean;
  error: string | null;
  discoveryProgress: { current: number; total: number } | null;

  // Actions
  loadAllManga: () => Promise<void>;
  loadManga: (id: string) => Promise<void>;
  addManga: (
    manga: Omit<Manga, "id" | "dateAdded" | "dateUpdated">
  ) => Promise<Manga>;
  updateManga: (id: string, updates: Partial<Manga>) => Promise<void>;
  removeManga: (id: string) => Promise<void>;
  discoverMangaChapters: (
    mangaId: string,
    baseUrl: string,
    urlSlug: string
  ) => Promise<void>;
  discoverChapter: (
    mangaId: string,
    chapterNumber: number,
    options?: { force?: boolean }
  ) => Promise<void>;
  updateReadingProgress: (
    mangaId: string,
    chapterId: string,
    page: number
  ) => Promise<void>;
  setCurrentManga: (manga: Manga | null) => void;
}

export const useMangaStore = create<MangaStore>((set, get) => {
  const enqueueMangaUpdate = async (
    mangaId: string,
    updater: (current: Manga) => Manga | null
  ): Promise<void> => {
    const previous = mangaUpdateQueue.get(mangaId) ?? Promise.resolve();
    const next = previous
      .catch(() => {
        // Keep the queue alive even if a previous update failed.
      })
      .then(async () => {
        const current = await getManga(mangaId);
        if (!current) return;

        const updated = updater(current);
        if (!updated) return;

        await saveManga(updated);

        const allManga = await getAllManga();
        set({ manga: allManga.map(normalizeManga) });

        if (get().currentManga?.id === mangaId) {
          set({ currentManga: normalizeManga(updated) });
        }
      });

    mangaUpdateQueue.set(mangaId, next.catch(() => {}));
    await next;
  };

  return {
    manga: [],
    currentManga: null,
    isLoading: false,
    error: null,
    discoveryProgress: null,

  loadAllManga: async () => {
    set({ isLoading: true, error: null });
    try {
      const manga = await getAllManga();
      set({ manga: manga.map(normalizeManga), isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load manga",
        isLoading: false,
      });
    }
  },

  loadManga: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const manga = await getManga(id);
      set({
        currentManga: manga ? normalizeManga(manga) : null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load manga",
        isLoading: false,
      });
    }
  },

  addManga: async (mangaData) => {
    set({ isLoading: true, error: null });
    try {
      const newManga: Manga = {
        ...mangaData,
        status: mangaData.status ?? "plan",
        tags: mangaData.tags ?? [],
        id: `manga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: Date.now(),
        dateUpdated: Date.now(),
        chapters: [],
      };

      await saveManga(newManga);
      const manga = await getAllManga();
      set({ manga: manga.map(normalizeManga), isLoading: false });

      return newManga;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to add manga",
        isLoading: false,
      });
      throw error;
    }
  },

  updateManga: async (id: string, updates: Partial<Manga>) => {
    try {
      const manga = await getManga(id);
      if (!manga) throw new Error("Manga not found");
      await enqueueMangaUpdate(id, (current) => ({
        ...current,
        ...updates,
        dateUpdated: Date.now(),
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update manga",
      });
      throw error;
    }
  },

  removeManga: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteManga(id);
      const manga = await getAllManga();
      set({ manga: manga.map(normalizeManga), isLoading: false });

      if (get().currentManga?.id === id) {
        set({ currentManga: null });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to remove manga",
        isLoading: false,
      });
    }
  },

  discoverMangaChapters: async (
    mangaId: string,
    baseUrl: string,
    urlSlug: string
  ) => {
    set({ isLoading: true, error: null, discoveryProgress: null });
    try {
      const manga = await getManga(mangaId);
      const sourceId = manga?.sourceId;

      const chapters = await discoverAllChapters(
        baseUrl,
        urlSlug,
        mangaId,
        (current, total) => {
          set({ discoveryProgress: { current, total } });
        },
        sourceId
      );

      await get().updateManga(mangaId, {
        chapters,
        totalChapters: chapters.length,
      });

      set({ isLoading: false, discoveryProgress: null });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to discover chapters",
        isLoading: false,
        discoveryProgress: null,
      });
      throw error;
    }
  },

  discoverChapter: async (
    mangaId: string,
    chapterNumber: number,
    options = {}
  ) => {
    try {
      const { force = false } = options;
      const refreshManga = async () => {
        const latest = await getManga(mangaId);
        return latest;
      };

      let manga = await refreshManga();
      if (!manga) return;

      const chapterId = `${mangaId}-ch${chapterNumber}`;
      const ensureChapter = async (): Promise<Chapter | null> => {
        const existing =
          manga?.chapters.find((c) => c.chapterNumber === chapterNumber) ?? null;
        if (existing) return existing;

        const newChapter: Chapter = {
          id: chapterId,
          mangaId,
          chapterNumber,
          totalPages: undefined,
          pages: [],
          isDiscovered: false,
          progress: 0,
        };

        await enqueueMangaUpdate(mangaId, (current) => {
          if (
            current.chapters.some((c) => c.chapterNumber === chapterNumber)
          ) {
            return current;
          }

          const chapters = [...current.chapters, newChapter].sort(
            (a, b) => a.chapterNumber - b.chapterNumber
          );

          return { ...current, chapters, dateUpdated: Date.now() };
        });

        manga = await refreshManga();
        return (
          manga?.chapters.find((c) => c.chapterNumber === chapterNumber) ?? null
        );
      };

      let chapter = await ensureChapter();
      if (!chapter) return;

      if (force) {
        await enqueueMangaUpdate(mangaId, (current) => {
          const idx = current.chapters.findIndex(
            (c) => c.chapterNumber === chapterNumber
          );
          if (idx === -1) return current;

          const chapters = [...current.chapters];
          chapters[idx] = {
            ...chapters[idx],
            isDiscovered: false,
            totalPages: undefined,
            firstPageNumber: undefined,
            pages: [],
          };

          return { ...current, chapters, dateUpdated: Date.now() };
        });

        manga = await refreshManga();
        if (!manga) return;
        chapter =
          manga.chapters.find((c) => c.chapterNumber === chapterNumber) ?? null;
        if (!chapter) return;
      }

      if (!force && chapter.isDiscovered && chapter.pages.length > 0) {
        return;
      }

      const INITIAL_PLACEHOLDERS = 15;

      if (chapter.pages.length === 0) {
        await enqueueMangaUpdate(mangaId, (current) => {
          const idx = current.chapters.findIndex(
            (c) => c.chapterNumber === chapterNumber
          );
          if (idx === -1) return current;

          const currentChapter = current.chapters[idx];
          if (currentChapter.pages.length > 0) return current;

          const source = current.sourceId ? getSourceById(current.sourceId) : null;
          const knownTotalPages = currentChapter.totalPages ?? 0;
          const placeholderCount =
            knownTotalPages > 0 ? knownTotalPages : INITIAL_PLACEHOLDERS;
          const pageOffset = currentChapter.firstPageNumber ?? 0;

          const buildImageUrl = (pageNumber: number) =>
            source
              ? buildSourcePageUrl({
                  source,
                  mangaSlug: current.urlSlug,
                  chapterNumber,
                  pageNumber,
                })
              : buildMangaPageUrl({
                  baseUrl: current.baseUrl,
                  mangaSlug: current.urlSlug,
                  chapterNumber,
                  pageNumber,
                });

          const placeholderPages = Array.from(
            { length: placeholderCount },
            (_, index) => {
              const actualPageNumber = pageOffset + index;

              return {
                id: `${chapterId}-p${index}`,
                chapterId,
                pageNumber: index,
                imageUrl: buildImageUrl(actualPageNumber),
                isLoaded: false,
                isCached: false,
              };
            }
          );

          const chapters = [...current.chapters];
          chapters[idx] = {
            ...currentChapter,
            pages: placeholderPages,
            totalPages: currentChapter.totalPages ?? placeholderPages.length,
            firstPageNumber: currentChapter.firstPageNumber,
            isDiscovered: false,
          };

          return { ...current, chapters, dateUpdated: Date.now() };
        });

        manga = await refreshManga();
        if (!manga) return;
        chapter =
          manga.chapters.find((c) => c.chapterNumber === chapterNumber) ?? null;
        if (!chapter) return;
      }

      discoverChapterPages(
        manga.baseUrl,
        manga.urlSlug,
        mangaId,
        chapterNumber,
        manga.sourceId
      )
        .then(async ({ pages, totalPages, firstPageNumber }) => {
          await enqueueMangaUpdate(mangaId, (current) => {
            const idx = current.chapters.findIndex(
              (c) => c.chapterNumber === chapterNumber
            );
            if (idx === -1) return current;

            const chapters = [...current.chapters];
            chapters[idx] = {
              ...chapters[idx],
              pages,
              totalPages,
              firstPageNumber,
              isDiscovered: true,
            };

            return { ...current, chapters, dateUpdated: Date.now() };
          });
        })
        .catch((err) =>
          console.error("Background page discovery failed:", err)
        );
    } catch (error) {
      console.error("Failed to prepare chapter:", error);
    }
  },

  updateReadingProgress: async (
    mangaId: string,
    chapterId: string,
    page: number
  ) => {
    try {
      const manga = await getManga(mangaId);
      if (!manga) return;

      await get().updateManga(mangaId, {
        lastRead: {
          chapterId,
          page,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error("Failed to update reading progress:", error);
    }
  },

  setCurrentManga: (manga: Manga | null) => {
    set({ currentManga: manga ? normalizeManga(manga) : null });
  },
  };
});
