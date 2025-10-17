import { Manga } from '@/types/manga.types';
import { MangaCard } from './MangaCard';
import { cn } from '@/utils/cn';

interface MangaGridProps {
  manga: Manga[];
  onRead: (manga: Manga) => void;
  onDelete: (manga: Manga) => void;
  className?: string;
}

export function MangaGrid({ manga, onRead, onDelete, className }: MangaGridProps) {
  if (manga.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No manga in your library</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add a manga to get started
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6',
        className
      )}
    >
      {manga.map((m) => (
        <MangaCard key={m.id} manga={m} onRead={onRead} onDelete={onDelete} />
      ))}
    </div>
  );
}
