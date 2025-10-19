import { cn } from '@/utils/cn';
import { ReadingStatus } from '@/types/manga.types';

interface WaxSealProps {
  status: ReadingStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<ReadingStatus, { color: string; letter: string; label: string }> = {
  plan: {
    color: 'bg-gradient-to-br from-amber-400 to-amber-600',
    letter: 'P',
    label: 'Planned'
  },
  reading: {
    color: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    letter: 'R',
    label: 'Reading'
  },
  done: {
    color: 'bg-gradient-to-br from-slate-400 to-slate-600',
    letter: 'C',
    label: 'Completed'
  }
};

const sizeClasses = {
  sm: 'w-10 h-10 text-xs',
  md: 'w-14 h-14 text-sm',
  lg: 'w-20 h-20 text-xl'
};

export function WaxSeal({ status, className, size = 'md' }: WaxSealProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'wax-seal flex items-center justify-center font-display font-bold text-white/90',
        config.color,
        sizeClasses[size],
        className
      )}
      title={config.label}
    >
      <span className="relative z-10 drop-shadow-lg">{config.letter}</span>
    </div>
  );
}
