import { cn } from '@/utils/cn';
import { ReadingStatus } from '@/types/manga.types';

interface StatusBannerProps {
  status: ReadingStatus;
  className?: string;
}

const statusConfig: Record<ReadingStatus, {
  color: string;
  bgColor: string;
  label: string;
  borderColor: string;
}> = {
  plan: {
    color: 'text-amber-900',
    bgColor: 'bg-amber-100/90',
    borderColor: 'border-amber-700',
    label: 'In The Scriptorium'
  },
  reading: {
    color: 'text-emerald-900',
    bgColor: 'bg-emerald-100/90',
    borderColor: 'border-emerald-700',
    label: 'Being Read'
  },
  done: {
    color: 'text-slate-900',
    bgColor: 'bg-slate-200/90',
    borderColor: 'border-slate-700',
    label: 'Tale Completed'
  }
};

export function StatusBanner({ status, className }: StatusBannerProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 border-2 rounded-sm font-display text-[10px] uppercase tracking-[0.2em] font-semibold shadow-md',
        config.color,
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <span className="w-2 h-2 rounded-full border border-current bg-current" />
      {config.label}
    </div>
  );
}
