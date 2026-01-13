# Image Loading Issues & Proposed Fixes

## Issues Identified

### 1. **Blur Effect Persists/Images Load Blurry**
**Problem:** The ImageViewer applies a blur effect while loading (`blur-md`) but the transition timing may not align with actual image load completion.

**Root Cause:**
- `loading` state transitions on `onLoad` event, but the image may not have fully rendered
- Browser lazy loading (`loading="lazy"`) can delay actual rendering
- Transition duration (500ms) may be too long/short

### 2. **Unreliable Image Loading**
**Problem:** Images don't always load, especially when navigating quickly.

**Root Causes:**
- **Race conditions:** Multiple re-renders trigger new image load attempts
- **Preloader hook inefficiency:** `useImagePreloader` doesn't cancel in-flight requests when URLs change
- **No retry mechanism:** Failed images aren't retried
- **Cache misses:** IndexedDB cache isn't being utilized in the actual image rendering

### 3. **Lazy Loading Conflicts**
**Problem:** Browser native lazy loading conflicts with custom preloading logic.

**Issue:** `loading="lazy"` in ImageViewer defers loading until image is near viewport, but `useImagePreloader` tries to load ahead. These work against each other.

### 4. **Memory & Performance Issues**
**Problems:**
- Image cache in IndexedDB exists but is never actually used
- Preloader doesn't clean up properly
- No debouncing on rapid page changes
- Creating new Image() objects repeatedly for same URLs

## Comprehensive Fixes

### Fix 1: Improved Image Loading Component

**Replace ImageViewer.tsx with robust loading:**

```typescript
// Key improvements:
// 1. Remove lazy loading to prevent conflicts
// 2. Add retry logic
// 3. Better transition timing
// 4. Force image decode before showing
// 5. Use cached blob URLs when available

export function ImageViewer({ src, alt, imageFit, zoomLevel = 1, onLoad, onError, className }: ImageViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [displaySrc, setDisplaySrc] = useState<string>(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const MAX_RETRIES = 2;

  // Check cache first
  useEffect(() => {
    let cancelled = false;
    
    const loadImage = async () => {
      setLoading(true);
      setError(false);
      
      // Try to get from cache first
      try {
        const cached = await getCachedImage(src);
        if (cancelled) return;
        
        if (cached) {
          const blobUrl = URL.createObjectURL(cached);
          setDisplaySrc(blobUrl);
          return;
        }
      } catch (e) {
        // Cache miss, use original URL
      }
      
      setDisplaySrc(src);
    };
    
    loadImage();
    
    return () => {
      cancelled = true;
    };
  }, [src]);

  const handleLoad = async () => {
    // Force decode before removing blur
    if (imgRef.current && 'decode' in imgRef.current) {
      try {
        await imgRef.current.decode();
      } catch {
        // Decode failed, continue anyway
      }
    }
    
    // Small delay to ensure rendering
    requestAnimationFrame(() => {
      setLoading(false);
      onLoad?.();
    });
  };

  const handleError = () => {
    if (retryCount < MAX_RETRIES) {
      // Retry with exponential backoff
      setTimeout(() => {
        setRetryCount(c => c + 1);
        setDisplaySrc(src + `?retry=${retryCount + 1}`);
      }, Math.pow(2, retryCount) * 1000);
    } else {
      setLoading(false);
      setError(true);
      onError?.();
    }
  };

  // Remove loading="lazy" - conflicts with preloading
  // Add fetchpriority="high" for current page
  // Reduce transition time to 200ms for snappier feel
  return (
    <img
      ref={imgRef}
      src={displaySrc}
      alt={alt}
      className={cn(
        fitClass,
        'block transition-all duration-200',
        loading ? 'blur-sm opacity-80' : 'blur-0 opacity-100'
      )}
      onLoad={handleLoad}
      onError={handleError}
      draggable={false}
      decoding="async"
      fetchpriority="high"
    />
  );
}
```

### Fix 2: Better Preloading Hook

**Replace useImagePreloader.ts:**

```typescript
export function useImagePreloader(urls: string[], options: PreloadOptions = {}) {
  const { enabled = true, maxConcurrent = 6 } = options;
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || urls.length === 0) return;

    // Cancel previous loads
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setLoading(true);

    const load = async () => {
      const urlsToLoad = urls.filter(
        (url) => !loadedUrls.has(url) && !failedUrls.has(url) && !loadingUrlsRef.current.has(url)
      );

      if (urlsToLoad.length === 0) {
        setLoading(false);
        return;
      }

      // Mark as loading
      urlsToLoad.forEach(url => loadingUrlsRef.current.add(url));

      for (let i = 0; i < urlsToLoad.length; i += maxConcurrent) {
        if (abortControllerRef.current?.signal.aborted) break;

        const batch = urlsToLoad.slice(i, i + maxConcurrent);
        
        // Preload AND cache in parallel
        const results = await Promise.allSettled(
          batch.map(async (url) => {
            const img = await preloadImage(url);
            // Fetch and cache the blob
            try {
              const response = await fetch(url);
              if (response.ok) {
                const blob = await response.blob();
                await cacheImage(url, blob);
              }
            } catch {
              // Caching failed, but image loaded
            }
            return img;
          })
        );

        results.forEach((result, index) => {
          const url = batch[index];
          loadingUrlsRef.current.delete(url);
          
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
      abortControllerRef.current?.abort();
      // Clear loading refs
      urls.forEach(url => loadingUrlsRef.current.delete(url));
    };
  }, [urls.join(','), enabled, maxConcurrent]); // Use join for stable comparison

  return {
    loadedUrls,
    failedUrls,
    loading,
    isLoaded: (url: string) => loadedUrls.has(url),
    hasFailed: (url: string) => failedUrls.has(url)
  };
}
```

### Fix 3: Debounced Page Navigation

**Add to Reader.tsx:**

```typescript
const debouncedSetPage = useMemo(
  () => debounce((page: number) => setPage(page), 100),
  [setPage]
);

// Use debouncedSetPage instead of setPage for rapid navigation
```

### Fix 4: Utilize Image Cache

**Current problem:** Cache exists but images are loaded directly via URL, never using cached blobs.

**Solution:** Modify ImageViewer to check cache first (shown in Fix 1).

### Fix 5: Better Error Boundaries

**Add error boundary around image viewer:**

```typescript
class ImageErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Failed to render image</div>;
    }
    return this.props.children;
  }
}
```

## Implementation Priority

1. **High Priority:**
   - Fix 1: ImageViewer improvements (removes blur issues, adds retry)
   - Fix 2: Better preloader with caching
   
2. **Medium Priority:**
   - Fix 3: Debounced navigation
   - Fix 4: Utilize cache in rendering

3. **Low Priority:**
   - Fix 5: Error boundaries

## Testing Checklist

After implementing fixes:
- [ ] Images load without blur on first view
- [ ] Previously loaded images display instantly
- [ ] Rapid page navigation doesn't break loading
- [ ] Failed images retry automatically
- [ ] Network tab shows images being cached
- [ ] Preloading works ahead of current page
- [ ] No memory leaks after many page loads
