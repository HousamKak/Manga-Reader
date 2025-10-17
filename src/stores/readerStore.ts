import { create } from 'zustand';
import { ReaderState, NavigationState } from '@/types/reader.types';

interface ReaderStore extends ReaderState {
  navigation: NavigationState;

  // Actions
  setManga: (mangaId: string) => void;
  setChapter: (chapterId: string) => void;
  setPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleUI: () => void;
  setUIVisible: (visible: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetZoomPan: () => void;
  setNavigation: (navigation: Partial<NavigationState>) => void;
}

export const useReaderStore = create<ReaderStore>((set, get) => ({
  mangaId: null,
  chapterId: null,
  currentPage: 0, // Start from page 0
  isLoading: false,
  error: null,
  uiVisible: true,
  zoom: 1,
  panX: 0,
  panY: 0,
  navigation: {
    hasNextPage: false,
    hasPreviousPage: false,
    hasNextChapter: false,
    hasPreviousChapter: false,
    currentChapterIndex: 0,
    totalChapters: 0
  },

  setManga: (mangaId: string) => {
    set({ mangaId });
  },

  setChapter: (chapterId: string) => {
    set({ chapterId, currentPage: 0 }); // Start from page 0
  },

  setPage: (page: number) => {
    set({ currentPage: page });
  },

  nextPage: () => {
    const { currentPage, navigation } = get();
    if (navigation.hasNextPage) {
      set({ currentPage: currentPage + 1 });
    }
  },

  previousPage: () => {
    const { currentPage, navigation } = get();
    if (navigation.hasPreviousPage) {
      set({ currentPage: currentPage - 1 });
    }
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  toggleUI: () => {
    set((state) => ({ uiVisible: !state.uiVisible }));
  },

  setUIVisible: (visible: boolean) => {
    set({ uiVisible: visible });
  },

  setZoom: (zoom: number) => {
    set({ zoom });
  },

  setPan: (x: number, y: number) => {
    set({ panX: x, panY: y });
  },

  resetZoomPan: () => {
    set({ zoom: 1, panX: 0, panY: 0 });
  },

  setNavigation: (navigation: Partial<NavigationState>) => {
    set((state) => ({
      navigation: { ...state.navigation, ...navigation }
    }));
  }
}));
