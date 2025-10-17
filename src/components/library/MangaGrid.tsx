import { Manga } from '@/types/manga.types';
import { MangaCard } from './MangaCard';
import { cn } from '@/utils/cn';

interface MangaGridProps {
  manga: Manga[];
  onRead: (manga: Manga) => void;
  onDelete: (manga: Manga) => void;
  onEdit: (manga: Manga) => void;
  className?: string;
}

export function MangaGrid({ manga, onRead, onDelete, onEdit, className }: MangaGridProps) {
  if (manga.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-2xl uppercase tracking-[0.4em] text-stone-600">
          No Tomes Inscribed
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-stone-500">
          Summon a new manuscript to begin your collection.
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
        <MangaCard key={m.id} manga={m} onRead={onRead} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  );
}
