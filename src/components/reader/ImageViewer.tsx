import { Loading } from "@/components/ui/Loading";
import { getCachedImage } from "@/services/storageService";
import { ImageFit } from "@/types/reader.types";
import { cn } from "@/utils/cn";
import { memo, useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

interface ImageViewerProps {
  src: string;
  alt: string;
  imageFit: ImageFit;
  zoomLevel?: number;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

export const ImageViewer = memo(function ImageViewer({
  src,
  alt,
  imageFit,
  zoomLevel = 1,
  onLoad,
  onError,
  className,
}: ImageViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [displaySrc, setDisplaySrc] = useState<string>(src);
  const [isTouchInput, setIsTouchInput] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const MAX_RETRIES = 2;

  // Check cache and load image
  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;

    const loadImage = async () => {
      setLoading(true);
      setError(false);
      setRetryCount(0);

      // Try to get from cache first
      try {
        const cached = await getCachedImage(src);
        if (cancelled) return;

        if (cached) {
          blobUrl = URL.createObjectURL(cached);
          setDisplaySrc(blobUrl);
          return;
        }
      } catch {
        // Cache miss, use original URL
      }

      if (!cancelled) {
        setDisplaySrc(src);
      }
    };

    loadImage();

    return () => {
      cancelled = true;
      // Clean up blob URL to prevent memory leaks
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src]);

  const handleLoad = async () => {
    // Force decode before removing blur for crisp rendering
    if (imgRef.current && "decode" in imgRef.current) {
      try {
        await imgRef.current.decode();
      } catch {
        // Decode failed, continue anyway
      }
    }

    // Use requestAnimationFrame to ensure rendering is complete
    requestAnimationFrame(() => {
      setLoading(false);
      onLoad?.();
    });
  };

  const handleError = () => {
    if (retryCount < MAX_RETRIES) {
      // Retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(() => {
        setRetryCount((c) => c + 1);
        // Add retry parameter to bypass cache
        const separator = src.includes("?") ? "&" : "?";
        setDisplaySrc(src + `${separator}retry=${retryCount + 1}`);
      }, delay);
    } else {
      setLoading(false);
      setError(true);
      onError?.();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(pointer: coarse)");

    const updateTouchState = () => {
      const navigatorAny = navigator as Navigator & {
        msMaxTouchPoints?: number;
      };

      const touchDetected =
        mediaQuery.matches ||
        "ontouchstart" in window ||
        (navigator.maxTouchPoints ?? 0) > 0 ||
        (navigatorAny.msMaxTouchPoints ?? 0) > 0;

      setIsTouchInput(touchDetected);
    };

    updateTouchState();

    const handleChange = () => updateTouchState();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const fitClass = {
    width: "w-full h-auto max-w-full",
    height: "h-screen w-auto",
    contain: "w-full h-auto object-contain",
    cover: "w-full h-auto object-cover",
  }[imageFit];

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-muted">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load image</p>
          <p className="text-sm text-muted-foreground">{src}</p>
        </div>
      </div>
    );
  }

  return (
    <TransformWrapper
      initialScale={zoomLevel}
      minScale={0.5}
      maxScale={4}
      wheel={{ disabled: true }} // Disable wheel zoom to allow page scrolling
      doubleClick={{ mode: "reset" }}
      panning={{ disabled: isTouchInput }}
      pinch={{ disabled: false }}
      key={`zoom-${zoomLevel}`} // Force re-render when zoom changes
    >
      <TransformComponent
        wrapperClass={cn("w-full flex justify-center", className)}
        wrapperStyle={isTouchInput ? { touchAction: "pan-y" } : undefined}
        contentClass="flex justify-center w-full"
      >
        <div className="relative flex justify-center w-full">
          {loading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center min-h-[400px]">
              <Loading size="lg" />
            </div>
          )}
          <img
            ref={imgRef}
            src={displaySrc}
            alt={alt}
            className={cn(
              fitClass,
              "block transition-opacity duration-200",
              loading ? "opacity-0" : "opacity-100"
            )}
            onLoad={handleLoad}
            onError={handleError}
            draggable={false}
            decoding="async"
            fetchpriority="high"
            style={{ margin: "0 auto" }}
          />
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
});

ImageViewer.displayName = "ImageViewer";
