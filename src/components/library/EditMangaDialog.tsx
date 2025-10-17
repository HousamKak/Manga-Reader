import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TagEditor } from '@/components/ui/TagEditor';
import { Manga, ReadingStatus } from '@/types/manga.types';

interface EditMangaDialogProps {
  open: boolean;
  manga: Manga | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Manga>) => Promise<void>;
}

const statusLabels: Record<ReadingStatus, string> = {
  plan: 'In The Scriptorium',
  reading: 'Being Read',
  done: 'Tale Completed'
};

export function EditMangaDialog({ open, manga, onClose, onSave }: EditMangaDialogProps) {
  const [status, setStatus] = useState<ReadingStatus>('plan');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && manga) {
      setStatus(manga.status ?? 'plan');
      setTags(manga.tags ?? []);
      setError(null);
    }
  }, [open, manga]);

  if (!manga) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave(manga.id, {
        status,
        tags
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update manga');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-[hsl(var(--parchment))]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display tracking-wider text-stone-800">
            Curate “{manga.title}”
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div>
            <label className="block text-sm font-medium uppercase tracking-wide text-stone-700">
              Reading Status
            </label>
            <div className="mt-2 rounded border-2 border-stone-700 bg-stone-100 px-3 py-2 shadow-inner shadow-stone-900/10">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as ReadingStatus)}
                className="w-full bg-transparent font-semibold uppercase tracking-wide text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium uppercase tracking-wide text-stone-700">
              Tags of Note
            </label>
            <TagEditor
              value={tags}
              onChange={setTags}
              placeholder="Add tags such as Arcane, Chivalry, Dragon Lore"
              className="mt-2"
            />
          </div>

          {error && (
            <div className="rounded border-2 border-red-600 bg-red-100 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Scribing…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
