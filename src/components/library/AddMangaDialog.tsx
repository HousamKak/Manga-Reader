import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { isValidMangaSlug } from '@/utils/validators';
import { TagEditor } from '@/components/ui/TagEditor';
import { ReadingStatus } from '@/types/manga.types';

interface AddMangaDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    title: string;
    urlSlug: string;
    baseUrl: string;
    autoDiscover: boolean;
    status: ReadingStatus;
    tags: string[];
  }) => Promise<void>;
}

const DEFAULT_BASE_URL = 'https://manga.pics';

export function AddMangaDialog({ open, onClose, onAdd }: AddMangaDialogProps) {
  const [mangaSlug, setMangaSlug] = useState('');
  const [autoDiscover, setAutoDiscover] = useState(true);
  const [status, setStatus] = useState<ReadingStatus>('plan');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mangaSlug) {
      setError('Please enter a manga slug');
      return;
    }

    const cleanedSlug = mangaSlug.trim().toLowerCase();

    if (!isValidMangaSlug(cleanedSlug)) {
      setError('Invalid manga slug. Use only lowercase letters, numbers, and hyphens (e.g., my-gift-lvl-9999-unlimited-gacha)');
      return;
    }

    setLoading(true);

    try {
      // Auto-generate title from slug (capitalize and replace hyphens with spaces)
      const generatedTitle = cleanedSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      await onAdd({
        title: generatedTitle,
        urlSlug: cleanedSlug,
        baseUrl: DEFAULT_BASE_URL,
        autoDiscover,
        status,
        tags
      });

      // Reset form
      setMangaSlug('');
      setAutoDiscover(true);
      setStatus('plan');
      setTags([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add manga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Manga</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Manga Slug
            </label>
            <Input
              placeholder="my-gift-lvl-9999-unlimited-gacha"
              value={mangaSlug}
              onChange={(e) => setMangaSlug(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the manga slug as it appears in the URL (e.g., my-gift-lvl-9999-unlimited-gacha)
            </p>
            <p className="text-xs text-muted-foreground">
              Default source: manga.pics
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Reading Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReadingStatus)}
                disabled={loading}
                className="w-full rounded border-2 border-stone-600 bg-[hsl(var(--parchment))] px-3 py-2 text-sm uppercase tracking-wide text-stone-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="plan">In The Scriptorium (Plan)</option>
                <option value="reading">Being Read</option>
                <option value="done">Tale Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Discovery
              </label>
              <div className="flex items-center gap-2 rounded border-2 border-stone-600 bg-[hsl(var(--parchment))] px-3 py-2 shadow-inner">
                <input
                  type="checkbox"
                  id="autoDiscover"
                  checked={autoDiscover}
                  onChange={(e) => setAutoDiscover(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 accent-amber-700"
                />
                <label htmlFor="autoDiscover" className="text-sm text-stone-700">
                  Automatically discover all chapters (may take a while)
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Tags of the Realm
            </label>
            <TagEditor
              value={tags}
              onChange={setTags}
              placeholder="Add tags such as Adventure, Romance, Knightly Tales"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Manga'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
