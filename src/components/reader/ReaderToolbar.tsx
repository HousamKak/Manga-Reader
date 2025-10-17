import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Settings,
  Maximize,
  Minimize,
  BookOpen,
  Eye,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RectangleVertical,
  RectangleHorizontal,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { ReadingMode, ImageFit } from '@/types/reader.types';

interface ReaderToolbarProps {
  title: string;
  chapterNumber: number;
  currentPage: number;
  totalPages: number;
  totalChapters: number;
  readingMode: ReadingMode;
  imageFit: ImageFit;
  fullscreen: boolean;
  onBack: () => void;
  onSettingsClick: () => void;
  onChapterListClick: () => void;
  onToggleFullscreen: () => void;
  onToggleReadingMode: () => void;
  onImageFitChange: (fit: ImageFit) => void;
  onChapterChange: (chapter: number) => void;
  onPageChange: (page: number) => void;
  onReloadChapter: () => void;
  reloadingChapter?: boolean;
  className?: string;
}

export function ReaderToolbar({
  title,
  chapterNumber,
  currentPage,
  totalPages,
  totalChapters,
  readingMode,
  imageFit,
  fullscreen,
  onBack,
  onSettingsClick,
  onChapterListClick,
  onToggleFullscreen,
  onToggleReadingMode,
  onImageFitChange,
  onChapterChange,
  onPageChange,
  onReloadChapter,
  reloadingChapter = false,
  className
}: ReaderToolbarProps) {
  const [chapterInput, setChapterInput] = useState(chapterNumber.toString());
  const [pageInput, setPageInput] = useState((currentPage + 1).toString());

  useEffect(() => {
    setChapterInput(chapterNumber.toString());
  }, [chapterNumber]);

  useEffect(() => {
    setPageInput((currentPage + 1).toString());
  }, [currentPage]);
  const readingModeIcons = {
    continuous: Eye,
    single: BookOpen,
    double: BookOpen
  };

  const ReadingModeIcon = readingModeIcons[readingMode];

  const imageFitIcons = {
    width: RectangleHorizontal,
    height: RectangleVertical,
    contain: Minimize2,
    cover: Maximize2
  };

  const ImageFitIcon = imageFitIcons[imageFit];

  const imageFitLabels = {
    width: 'Fit Width',
    height: 'Fit Height',
    contain: 'Contain',
    cover: 'Cover'
  };

  const imageFitOptions: ImageFit[] = ['width', 'height', 'contain', 'cover'];

  const cycleImageFit = () => {
    const currentIndex = imageFitOptions.indexOf(imageFit);
    const nextIndex = (currentIndex + 1) % imageFitOptions.length;
    onImageFitChange(imageFitOptions[nextIndex]);
  };

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b z-50',
        className
      )}
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-2 py-2 sm:flex-nowrap sm:gap-4 sm:px-4 sm:py-3">
        {/* Left Section */}
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} title="Back to Library">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex flex-col min-w-0">
            <h1 className="font-semibold text-xs sm:text-sm truncate leading-4">{title}</h1>
          </div>
        </div>

        {/* Middle Section - Chapter and Page Controls */}
        <div className="flex flex-1 flex-wrap items-center justify-center gap-2 sm:flex-nowrap sm:justify-center sm:gap-3 min-w-[240px]">
          {/* Previous Chapter Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (chapterNumber > 1) {
                onChapterChange(chapterNumber - 1);
              }
            }}
            disabled={chapterNumber <= 1}
            title="Previous Chapter"
            className="h-8 w-8 p-0 sm:h-7 sm:w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            <span className="text-[0.7rem] text-muted-foreground whitespace-nowrap sm:text-xs">
              Ch:
            </span>
            <input
              type="number"
              min={1}
              max={totalChapters}
              value={chapterInput}
              onChange={(e) => setChapterInput(e.target.value)}
              onBlur={() => {
                const ch = parseInt(chapterInput);
                if (!isNaN(ch) && ch >= 1 && ch <= totalChapters) {
                  onChapterChange(ch);
                } else {
                  setChapterInput(chapterNumber.toString());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const ch = parseInt(chapterInput);
                  if (!isNaN(ch) && ch >= 1 && ch <= totalChapters) {
                    onChapterChange(ch);
                  } else {
                    setChapterInput(chapterNumber.toString());
                  }
                }
              }}
              className="h-8 w-14 px-2 text-[0.75rem] text-center border rounded sm:h-8 sm:w-16 sm:text-xs"
            />
            <span className="text-[0.7rem] text-muted-foreground sm:text-xs">
              / {totalChapters}
            </span>
          </div>

          {/* Next Chapter Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (chapterNumber < totalChapters) {
                onChapterChange(chapterNumber + 1);
              }
            }}
            disabled={chapterNumber >= totalChapters}
            title="Next Chapter"
            className="h-8 w-8 p-0 sm:h-7 sm:w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            <span className="text-[0.7rem] text-muted-foreground whitespace-nowrap sm:text-xs">
              Pg:
            </span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => {
                const pg = parseInt(pageInput);
                if (!isNaN(pg) && pg >= 1 && pg <= totalPages) {
                  onPageChange(pg - 1); // Convert to 0-based
                } else {
                  setPageInput((currentPage + 1).toString());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const pg = parseInt(pageInput);
                  if (!isNaN(pg) && pg >= 1 && pg <= totalPages) {
                    onPageChange(pg - 1); // Convert to 0-based
                  } else {
                    setPageInput((currentPage + 1).toString());
                  }
                }
              }}
              className="h-8 w-14 px-2 text-[0.75rem] text-center border rounded sm:h-8 sm:w-16 sm:text-xs"
            />
            <span className="text-[0.7rem] text-muted-foreground sm:text-xs">
              / {totalPages}
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={cycleImageFit}
            title={`Image Fit: ${imageFitLabels[imageFit]} (Click to cycle)`}
          >
            <ImageFitIcon className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleReadingMode}
            title={`Reading Mode: ${readingMode}`}
          >
            <ReadingModeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReloadChapter}
            title="Reload chapter pages"
            disabled={reloadingChapter}
          >
            <RotateCcw className={cn('h-5 w-5', reloadingChapter && 'animate-spin')} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onChapterListClick}
            title="Chapter List"
          >
            <BookOpen className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
