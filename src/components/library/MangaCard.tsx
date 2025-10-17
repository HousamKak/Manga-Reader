import React from 'react';
import { Trash2, Play, MoreVertical } from 'lucide-react';
import { Manga } from '@/types/manga.types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface MangaCardProps {
  manga: Manga;
  onRead: (manga: Manga) => void;
  onDelete: (manga: Manga) => void;
  className?: string;
}

export function MangaCard({ manga, onRead, onDelete, className }: MangaCardProps) {
  const lastRead = manga.lastRead;
  const progress = lastRead
    ? manga.chapters.find((c) => c.id === lastRead.chapterId)
    : null;

  return (
    <Card className={cn('overflow-hidden hover:shadow-lg transition-shadow', className)}>
      {/* Cover Image */}
      <div
        className="h-64 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative group"
        onClick={() => onRead(manga)}
        role="button"
        tabIndex={0}
      >
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

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button variant="default" size="lg">
            <Play className="h-5 w-5 mr-2" />
            Continue Reading
          </Button>
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{manga.title}</h3>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{manga.totalChapters || '?'} chapters</p>

          {lastRead && progress && (
            <p className="text-primary">
              Reading Chapter {progress.chapterNumber} • Page {lastRead.page}
            </p>
          )}

          <p className="text-xs">
            Added {new Date(manga.dateAdded).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
