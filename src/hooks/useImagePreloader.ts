import { useEffect, useState } from 'react';
import { preloadImage } from '@/utils/imageLoader';

interface PreloadOptions {
  enabled?: boolean;
  maxConcurrent?: number;
}

export function useImagePreloader(
  urls: string[],
  options: PreloadOptions = {}
) {
  const { enabled = true, maxConcurrent = 6 } = options;
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || urls.length === 0) {
      setLoading(false);
      return;
    }

    const urlsToLoad = urls.filter(
      (url) => !loadedUrls.has(url) && !failedUrls.has(url)
    );

    if (urlsToLoad.length === 0) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    setLoading(true);

    const load = async () => {
      for (let i = 0; i < urlsToLoad.length; i += maxConcurrent) {
        if (abortController.signal.aborted) break;

        const batch = urlsToLoad.slice(i, i + maxConcurrent);
        const results = await Promise.allSettled(batch.map((url) => preloadImage(url)));

        results.forEach((result, index) => {
          const url = batch[index];
          if (result.status === 'fulfilled') {
            setLoadedUrls((prev) => {
              const next = new Set(prev);
              next.add(url);
              return next;
            });
          } else {
            setFailedUrls((prev) => {
              const next = new Set(prev);
              next.add(url);
              return next;
            });
          }
        });
      }

      setLoading(false);
    };

    load();

    return () => {
      abortController.abort();
    };
  }, [urls, enabled, maxConcurrent, loadedUrls, failedUrls]);

  return {
    loadedUrls,
    failedUrls,
    loading,
    isLoaded: (url: string) => loadedUrls.has(url),
    hasFailed: (url: string) => failedUrls.has(url)
  };
}
