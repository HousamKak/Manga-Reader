import { cn } from '@/utils/cn';

interface OrnamentalDividerProps {
  className?: string;
  symbol?: string;
}

export function OrnamentalDivider({ className, symbol = '❖' }: OrnamentalDividerProps) {
  return (
    <div className={cn('ornamental-divider', className)}>
      <style>{`
        .ornamental-divider::before {
          content: '${symbol}';
        }
      `}</style>
    </div>
  );
}
