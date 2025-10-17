import { Trash2, Play, Pencil } from 'lucide-react';
import { Manga } from '@/types/manga.types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface MangaCardProps {
  manga: Manga;
  onRead: (manga: Manga) => void;
  onDelete: (manga: Manga) => void;
  onEdit: (manga: Manga) => void;
  className?: string;
}

const statusColors: Record<Manga['status'], string> = {
  plan: 'bg-amber-200/70 text-amber-900 border-amber-700/70',
  reading: 'bg-emerald-200/70 text-emerald-900 border-emerald-700/70',
  done: 'bg-slate-300/70 text-slate-900 border-slate-700/70'
};

export function MangaCard({ manga, onRead, onDelete, onEdit, className }: MangaCardProps) {
  const lastRead = manga.lastRead;
  const progress = lastRead
    ? manga.chapters.find((c) => c.id === lastRead.chapterId)
    : null;

  return (
    <Card
      className={cn(
        'overflow-hidden border-2 border-stone-700/70 bg-[hsl(var(--parchment))] shadow-lg shadow-stone-900/20 transition-transform hover:-translate-y-1 hover:shadow-xl',
        className
      )}
    >
      <div
        className="group relative h-64 cursor-pointer overflow-hidden bg-gradient-to-br from-stone-500/20 via-amber-300/30 to-stone-700/30"
        onClick={() => onRead(manga)}
        role="button"
        tabIndex={0}
      >
        <div
          className={cn(
            'absolute left-4 top-4 inline-flex rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-widest',
            statusColors[manga.status] ?? statusColors.plan
          )}
        >
          {manga.status === 'plan' && 'In The Scriptorium'}
          {manga.status === 'reading' && 'Being Read'}
          {manga.status === 'done' && 'Tale Completed'}
        </div>

        {manga.coverImage ? (
          <img
            src={manga.coverImage}
            alt={manga.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-4">
            <Play className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to read</p>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-stone-900/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Button size="lg">
            <Play className="mr-2 h-5 w-5" />
            Continue Reading
          </Button>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(manga);
            }}
            title="Curate Tags & Status"
            className="border border-stone-500/70 bg-[hsl(var(--parchment))]/90 text-stone-800 hover:bg-amber-200/80"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(manga);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="space-y-3 p-5">
        <h3 className="font-display text-lg font-semibold uppercase tracking-[0.3em] text-stone-900 leading-snug break-words">
          {manga.title}
        </h3>

        <div className="space-y-1 text-xs uppercase tracking-wide text-stone-700">
          <p>{manga.totalChapters || '?'} known chapters</p>

          {lastRead && progress && (
            <p className="text-amber-800">
              Chapter {progress.chapterNumber} · Page {lastRead.page}
            </p>
          )}

          <p className="text-stone-600">
            Inscribed {new Date(manga.dateAdded).toLocaleDateString()}
          </p>
        </div>

        {manga.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {manga.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-stone-600/50 bg-stone-200/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
