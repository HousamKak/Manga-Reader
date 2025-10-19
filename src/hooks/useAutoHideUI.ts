import { useCallback, useEffect, useRef } from 'react';

export function useAutoHideUI(
  onHide: () => void,
  delay: number = 3000,
  enabled: boolean = true
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onHide();
    }, delay);
  }, [delay, enabled, onHide]);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, delay, resetTimer]);

  return { resetTimer };
}
