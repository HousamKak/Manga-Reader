import { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ImageFit } from '@/types/reader.types';
import { cn } from '@/utils/cn';
import { Loading } from '@/components/ui/Loading';

interface ImageViewerProps {
  src: string;
  alt: string;
  imageFit: ImageFit;
  zoomLevel?: number;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

export function ImageViewer({
  src,
  alt,
  imageFit,
  zoomLevel = 1,
  onLoad,
  onError,
  className
}: ImageViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  const fitClass = {
    width: 'w-full h-auto max-w-full',
    height: 'h-screen w-auto',
    contain: 'w-full h-auto object-contain',
    cover: 'w-full h-auto object-cover'
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
      doubleClick={{ mode: 'reset' }}
      panning={{ disabled: false }}
      key={`zoom-${zoomLevel}`} // Force re-render when zoom changes
    >
      <TransformComponent
        wrapperClass={cn('w-full flex justify-center', className)}
        contentClass="flex justify-center w-full"
      >
        <div className="relative flex justify-center w-full">
          {loading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center min-h-[400px]">
              <Loading size="lg" />
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={cn(
              fitClass,
              'block transition-all duration-500 ease-out',
              loading ? 'blur-md scale-[1.01] brightness-110' : 'blur-0 scale-100 brightness-100'
            )}
            onLoad={handleLoad}
            onError={handleError}
            draggable={false}
            loading="lazy"
            decoding="async"
            style={{ margin: '0 auto' }}
          />
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
}
