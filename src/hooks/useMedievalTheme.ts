import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

type MedievalThemeTime = 'morning' | 'evening' | 'night';

function getMedievalTimeOfDay(): MedievalThemeTime {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 20) {
    return 'evening';
  } else {
    return 'night';
  }
}

export function useMedievalTheme() {
  const { settings } = useSettingsStore();

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const medievalTheme = settings.medievalTheme === 'auto'
        ? getMedievalTimeOfDay()
        : settings.medievalTheme;

      // Remove all medieval theme classes
      root.classList.remove('medieval-morning', 'medieval-evening', 'medieval-night');

      // Add the appropriate class
      root.classList.add(`medieval-${medievalTheme}`);
    };

    applyTheme();

    // If auto mode, check every minute for time changes
    if (settings.medievalTheme === 'auto') {
      const interval = setInterval(applyTheme, 60000);
      return () => clearInterval(interval);
    }
  }, [settings.medievalTheme]);
}
