import React from 'react';
import { Check } from 'lucide-react';
import { Chapter } from '@/types/manga.types';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { cn } from '@/utils/cn';

interface ChapterSelectorProps {
  open: boolean;
  chapters: Chapter[];
  currentChapterId: string | null;
  onClose: () => void;
  onSelectChapter: (chapterId: string) => void;
}

export function ChapterSelector({
  open,
  chapters,
  currentChapterId,
  onClose,
  onSelectChapter
}: ChapterSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Chapter</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {chapters.map((chapter) => {
            // currentChapterId is now the chapter number from URL
            const isActive = currentChapterId && chapter.chapterNumber === parseInt(currentChapterId);
            const progress = chapter.progress || 0;

            return (
              <button
                key={chapter.id}
                onClick={() => {
                  onSelectChapter(chapter.id);
                  onClose();
                }}
                className={cn(
                  'w-full text-left p-4 rounded-lg border transition-colors',
                  'hover:bg-accent hover:border-accent-foreground',
                  isActive && 'bg-accent border-accent-foreground'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Chapter {chapter.chapterNumber}
                      </span>
                      {isActive && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    {chapter.title && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {chapter.title}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{chapter.totalPages || '?'} pages</span>
                      {progress > 0 && (
                        <span className="text-primary">• {Math.round(progress)}% read</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {progress > 0 && (
                  <div className="w-full bg-muted h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
