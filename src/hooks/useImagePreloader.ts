import { cacheImage, pruneCache } from "@/services/storageService";
import { preloadImage } from "@/utils/imageLoader";
import { useEffect, useRef, useState } from "react";

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || urls.length === 0) {
      setLoading(false);
      return;
    }

    // Cancel previous loads
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);

    const load = async () => {
      const urlsToLoad = urls.filter(
        (url) =>
          !loadedUrls.has(url) &&
          !failedUrls.has(url) &&
          !loadingUrlsRef.current.has(url)
      );

      if (urlsToLoad.length === 0) {
        setLoading(false);
        return;
      }

      // Mark as loading
      urlsToLoad.forEach((url) => loadingUrlsRef.current.add(url));

      for (let i = 0; i < urlsToLoad.length; i += maxConcurrent) {
        if (signal.aborted) break;

        const batch = urlsToLoad.slice(i, i + maxConcurrent);

        // Preload AND cache in parallel
        const results = await Promise.allSettled(
          batch.map(async (url) => {
            if (signal.aborted) throw new Error("Aborted");

            // Preload the image
            await preloadImage(url);

            // Fetch and cache the blob for faster future loads
            try {
              const response = await fetch(url);
              if (response.ok) {
                const blob = await response.blob();
                await cacheImage(url, blob);
              }
            } catch {
              // Caching failed, but image loaded - not critical
            }

            return url;
          })
        );

        if (signal.aborted) break;

        results.forEach((result, index) => {
          const url = batch[index];
          loadingUrlsRef.current.delete(url);

          if (result.status === "fulfilled") {
            setLoadedUrls((prev) => new Set(prev).add(url));
          } else {
            setFailedUrls((prev) => new Set(prev).add(url));
          }
        });
      }

      if (!signal.aborted) {
        setLoading(false);

        // Prune cache periodically to keep it under 100MB
        // Run async without awaiting to avoid blocking
        pruneCache(100 * 1024 * 1024).catch(() => {
          // Silently ignore cache pruning errors
        });
      }
    };

    load();

    return () => {
      abortControllerRef.current?.abort();
      // Clear loading refs for these URLs
      urls.forEach((url) => loadingUrlsRef.current.delete(url));
    };
  }, [urls.join(","), enabled, maxConcurrent]); // Use join for stable URL comparison

  return {
    loadedUrls,
    failedUrls,
    loading,
    isLoaded: (url: string) => loadedUrls.has(url),
    hasFailed: (url: string) => failedUrls.has(url),
  };
}
