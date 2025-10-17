/**
 * Preloads an image and returns a promise
 */
export function preloadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Preloads multiple images with a concurrency limit
 */
export async function preloadImages(
  urls: string[],
  maxConcurrent: number = 6
): Promise<PromiseSettledResult<string>[]> {
  const results: PromiseSettledResult<string>[] = [];

  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(
      batch.map(url => preloadImage(url))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Checks if an image URL is accessible
 * Uses Image element to bypass CORS restrictions for discovery
 */
export async function checkImageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);

    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      img.src = '';
      resolve(false);
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Fetches an image as a blob for caching
 */
export async function fetchImageBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return await response.blob();
}

/**
 * Converts a blob to a data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
