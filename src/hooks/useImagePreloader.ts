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
    if (!enabled || urls.length === 0) return;

    const abortController = new AbortController();
    setLoading(true);

    const load = async () => {
      const urlsToLoad = urls.filter(
        (url) => !loadedUrls.has(url) && !failedUrls.has(url)
      );

      for (let i = 0; i < urlsToLoad.length; i += maxConcurrent) {
        if (abortController.signal.aborted) break;

        const batch = urlsToLoad.slice(i, i + maxConcurrent);
        const results = await Promise.allSettled(
          batch.map((url) => preloadImage(url))
        );

        results.forEach((result, index) => {
          const url = batch[index];
          if (result.status === 'fulfilled') {
            setLoadedUrls((prev) => new Set(prev).add(url));
          } else {
            setFailedUrls((prev) => new Set(prev).add(url));
          }
        });
      }

      setLoading(false);
    };

    load();

    return () => {
      abortController.abort();
    };
  }, [urls, enabled, maxConcurrent]);

  return {
    loadedUrls,
    failedUrls,
    loading,
    isLoaded: (url: string) => loadedUrls.has(url),
    hasFailed: (url: string) => failedUrls.has(url)
  };
}
