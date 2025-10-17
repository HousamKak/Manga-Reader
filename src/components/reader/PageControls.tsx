import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface PageControlsProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  hasNextChapter: boolean;
  hasPreviousChapter: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onNextChapter: () => void;
  onPreviousChapter: () => void;
  onPageSelect: (page: number) => void;
  visible?: boolean;
  className?: string;
}

export function PageControls({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  hasNextChapter,
  hasPreviousChapter,
  onNextPage,
  onPreviousPage,
  onNextChapter,
  onPreviousChapter,
  onPageSelect,
  visible = true,
  className
}: PageControlsProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4',
        'transition-transform duration-300',
        visible ? 'translate-y-0' : 'translate-y-full',
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* Previous Chapter */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousChapter}
          disabled={!hasPreviousChapter}
          title="Previous Chapter"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          onClick={onPreviousPage}
          disabled={!hasPreviousPage}
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Page Selector */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <span className="text-sm whitespace-nowrap">Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage + 1} // Display as 1-based for users
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                onPageSelect(page - 1); // Convert to 0-based for internal use
              }
            }}
            className="w-16 px-2 py-1 text-center border rounded"
          />
          <span className="text-sm text-muted-foreground">of {totalPages}</span>
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          onClick={onNextPage}
          disabled={!hasNextPage}
          title="Next Page (Right Arrow)"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Next Chapter */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNextChapter}
          disabled={!hasNextChapter}
          title="Next Chapter"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
