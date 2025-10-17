import { useEffect } from 'react';
import { DEFAULT_KEYBOARD_SHORTCUTS, KeyboardShortcut } from '@/types/settings.types';

type ShortcutHandler = (action: string) => void;

export function useKeyboardShortcuts(
  onAction: ShortcutHandler,
  enabled: boolean = true,
  shortcuts: KeyboardShortcut[] = DEFAULT_KEYBOARD_SHORTCUTS
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const shortcut = shortcuts.find(
        (s) =>
          s.key === event.key &&
          !!s.ctrl === event.ctrlKey &&
          !!s.alt === event.altKey &&
          !!s.shift === event.shiftKey
      );

      if (shortcut) {
        event.preventDefault();
        onAction(shortcut.action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, shortcuts, onAction]);
}
