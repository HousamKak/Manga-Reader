import { cn } from '@/utils/cn';
import { Hourglass } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'spinner' | 'hourglass' | 'quill';
}

export function Loading({ size = 'md', className, variant = 'hourglass' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  if (variant === 'hourglass') {
    return (
      <Hourglass
        className={cn(
          'hourglass-loading text-amber-700',
          sizeClasses[size],
          className
        )}
        role="status"
      />
    );
  }

  if (variant === 'quill') {
    return (
      <div className={cn('relative', sizeClasses[size], className)} role="status">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="quill-writing w-full h-full text-amber-900"
        >
          <path
            d="M3 21l18-18-3-3-18 18 3 3zm15-16.5l1.5 1.5-13.5 13.5-1.5-1.5 13.5-13.5z"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-solid border-amber-700 border-r-transparent text-amber-700',
        sizeClasses[size],
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-library-pattern text-stone-800 parchment-texture">
      <div className="illuminated-border bg-[hsl(var(--parchment))] p-8 rounded-lg shadow-2xl">
        <Loading size="lg" variant="hourglass" />
        {message && (
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-stone-600 font-display">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
