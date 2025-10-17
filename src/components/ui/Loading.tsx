import { cn } from '@/utils/cn';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ size = 'md', className }: LoadingProps) {
  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-solid border-amber-700 border-r-transparent text-amber-700',
        {
          'h-4 w-4': size === 'sm',
          'h-8 w-8': size === 'md',
          'h-12 w-12': size === 'lg'
        },
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-library-pattern text-stone-800">
      <Loading size="lg" />
      {message && (
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-stone-600">
          {message}
        </p>
      )}
    </div>
  );
}
