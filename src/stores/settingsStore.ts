import { create } from 'zustand';
import { AppSettings } from '@/types/settings.types';
import { saveSettings, getSettings } from '@/services/storageService';

const DEFAULT_SETTINGS: AppSettings = {
  // Reader settings
  readingMode: 'continuous',
  readingDirection: 'ltr',
  imageFit: 'height',
  backgroundColor: 'white',
  showPageNumbers: true,
  preloadPages: 3,
  fullscreen: false,
  autoHideUI: true,
  autoHideDelay: 3000,
  defaultZoom: 1.0, // Default zoom level

  // App settings
  theme: 'auto',
  language: 'en',
  maxCacheSize: 500, // MB
  enableKeyboardShortcuts: true,
  enableTouchGestures: true,
  enablePreloading: true,
  maxConcurrentLoads: 6
};

interface SettingsStore {
  settings: AppSettings;
  isLoading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await getSettings();
      set({
        settings: settings || DEFAULT_SETTINGS,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...get().settings, ...updates };
      await saveSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  resetSettings: async () => {
    try {
      await saveSettings(DEFAULT_SETTINGS);
      set({ settings: DEFAULT_SETTINGS });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }
}));
