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

export const useMangaStore = create<MangaStore>((set, get) => ({
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

      const updatedManga: Manga = {
        ...manga,
        ...updates,
        dateUpdated: Date.now(),
      };

      await saveManga(updatedManga);

      const allManga = await getAllManga();
      set({ manga: allManga.map(normalizeManga) });

      if (get().currentManga?.id === id) {
        set({ currentManga: normalizeManga(updatedManga) });
      }
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

      const ensureChapterIndex = async (): Promise<number> => {
        let index =
          manga?.chapters.findIndex((c) => c.chapterNumber === chapterNumber) ??
          -1;

        if (index === -1 && manga) {
          const newChapter: Chapter = {
            id: chapterId,
            mangaId,
            chapterNumber,
            totalPages: undefined,
            pages: [],
            isDiscovered: false,
            progress: 0,
          };

          const chapters = [...manga.chapters, newChapter].sort(
            (a, b) => a.chapterNumber - b.chapterNumber
          );

          await get().updateManga(mangaId, { chapters });
          manga = await refreshManga();
          index =
            manga?.chapters.findIndex(
              (c) => c.chapterNumber === chapterNumber
            ) ?? -1;
        }

        return index;
      };

      let chapterIndex = await ensureChapterIndex();
      if (!manga || chapterIndex === -1) return;

      let chapter = manga.chapters[chapterIndex];

      if (force) {
        const chapters = [...manga.chapters];
        chapters[chapterIndex] = {
          ...chapter,
          isDiscovered: false,
          totalPages: undefined,
          pages: [],
        };

        await get().updateManga(mangaId, { chapters });
        manga = await refreshManga();
        if (!manga) return;

        chapterIndex = manga.chapters.findIndex(
          (c) => c.chapterNumber === chapterNumber
        );
        if (chapterIndex === -1) return;
        chapter = manga.chapters[chapterIndex];
      }

      if (!force && chapter.isDiscovered && chapter.pages.length > 0) {
        return;
      }

      const INITIAL_PLACEHOLDERS = 15;

      if (chapter.pages.length === 0) {
        const source = manga.sourceId ? getSourceById(manga.sourceId) : null;

        const firstPageUrl = source
          ? buildSourcePageUrl({
              source,
              mangaSlug: manga.urlSlug,
              chapterNumber,
              pageNumber: 0,
            })
          : buildMangaPageUrl({
              baseUrl: manga.baseUrl,
              mangaSlug: manga.urlSlug,
              chapterNumber,
              pageNumber: 0,
            });

        const placeholderPages = Array.from(
          { length: INITIAL_PLACEHOLDERS },
          (_, index) => {
            const imageUrl =
              index === 0
                ? firstPageUrl
                : source
                ? buildSourcePageUrl({
                    source,
                    mangaSlug: manga!.urlSlug,
                    chapterNumber,
                    pageNumber: index,
                  })
                : buildMangaPageUrl({
                    baseUrl: manga!.baseUrl,
                    mangaSlug: manga!.urlSlug,
                    chapterNumber,
                    pageNumber: index,
                  });

            return {
              id: `${chapterId}-p${index}`,
              chapterId,
              pageNumber: index,
              imageUrl,
              isLoaded: false,
              isCached: false,
            };
          }
        );

        const chapters = [...manga.chapters];
        chapters[chapterIndex] = {
          ...chapter,
          pages: placeholderPages,
          totalPages: placeholderPages.length,
          isDiscovered: false,
        };

        await get().updateManga(mangaId, { chapters });
        manga = await refreshManga();
        if (!manga) return;

        chapterIndex = manga.chapters.findIndex(
          (c) => c.chapterNumber === chapterNumber
        );
        if (chapterIndex === -1) return;
        chapter = manga.chapters[chapterIndex];
      }

      discoverChapterPages(
        manga.baseUrl,
        manga.urlSlug,
        mangaId,
        chapterNumber,
        manga.sourceId
      )
        .then(async (pages) => {
          const freshManga = await refreshManga();
          if (!freshManga) return;

          const idx = freshManga.chapters.findIndex(
            (c) => c.chapterNumber === chapterNumber
          );
          if (idx === -1) return;

          const updatedChapters = [...freshManga.chapters];
          updatedChapters[idx] = {
            ...updatedChapters[idx],
            pages,
            totalPages: pages.length,
            isDiscovered: true,
          };

          await get().updateManga(mangaId, { chapters: updatedChapters });
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
}));
