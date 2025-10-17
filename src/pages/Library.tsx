import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, RefreshCcw, Settings } from 'lucide-react';
import { useMangaStore } from '@/stores/mangaStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { MangaGrid } from '@/components/library/MangaGrid';
import { AddMangaDialog } from '@/components/library/AddMangaDialog';
import { EditMangaDialog } from '@/components/library/EditMangaDialog';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingScreen } from '@/components/ui/Loading';
import { Manga, ReadingStatus } from '@/types/manga.types';

type StatusFilter = 'all' | ReadingStatus;
type SortOption = 'recent' | 'title' | 'status' | 'progress';

const statusLabels: Record<ReadingStatus, string> = {
  plan: 'In The Scriptorium',
  reading: 'Being Read',
  done: 'Tale Completed'
};

const statusOrder: Record<ReadingStatus, number> = {
  plan: 0,
  reading: 1,
  done: 2
};

const extractChapterNumber = (chapterId: string | undefined): number | null => {
  if (!chapterId) return null;
  const match = chapterId.match(/-ch(\d+)$/);
  if (!match) return null;
  const number = parseInt(match[1], 10);
  return Number.isNaN(number) ? null : number;
};

const computeProgress = (manga: Manga): number => {
  if (manga.status === 'done') return 1;

  const totalChapters = manga.totalChapters ?? manga.chapters.length;
  if (!totalChapters || totalChapters <= 0) return 0;

  const currentChapter = extractChapterNumber(manga.lastRead?.chapterId);
  if (!currentChapter) return 0;

  return Math.min(1, currentChapter / totalChapters);
};

export function Library() {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [discoveringManga, setDiscoveringManga] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingManga, setEditingManga] = useState<Manga | null>(null);

  const {
    manga,
    isLoading,
    discoveryProgress,
    loadAllManga,
    addManga,
    removeManga,
    updateManga,
    discoverMangaChapters
  } = useMangaStore();

  const { settings, loadSettings, updateSettings } = useSettingsStore();

  useEffect(() => {
    loadAllManga();
    loadSettings();
  }, []);

  const availableTags = useMemo(
    () =>
      Array.from(
        new Set(
          manga.flatMap((item) => (Array.isArray(item.tags) ? item.tags : []))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [manga]
  );

  useEffect(() => {
    setSelectedTags((current) => current.filter((tag) => availableTags.includes(tag)));
  }, [availableTags]);

  const filteredManga = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return manga.filter((item) => {
      const status = item.status ?? 'plan';
      const statusMatch = statusFilter === 'all' || status === statusFilter;

      const tags = Array.isArray(item.tags) ? item.tags : [];
      const tagsMatch =
        selectedTags.length === 0 ||
        selectedTags.every((tag) =>
          tags.some((value) => value.toLowerCase() === tag.toLowerCase())
        );

      const titleMatch =
        normalizedSearch.length === 0 ||
        item.title.toLowerCase().includes(normalizedSearch);

      return statusMatch && tagsMatch && titleMatch;
    });
  }, [manga, statusFilter, selectedTags, searchTerm]);

  const sortedManga = useMemo(() => {
    const list = [...filteredManga];

    list.sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status': {
          const statusDifference =
            statusOrder[(a.status ?? 'plan')] - statusOrder[(b.status ?? 'plan')];
          return statusDifference !== 0 ? statusDifference : a.title.localeCompare(b.title);
        }
        case 'progress': {
          const progressDifference = computeProgress(b) - computeProgress(a);
          return progressDifference !== 0 ? progressDifference : a.title.localeCompare(b.title);
        }
        case 'recent':
        default:
          return b.dateAdded - a.dateAdded;
      }
    });

    return list;
  }, [filteredManga, sortOption]);

  const handleAddManga = async (data: {
    title: string;
    urlSlug: string;
    baseUrl: string;
    autoDiscover: boolean;
    status: ReadingStatus;
    tags: string[];
  }) => {
    const newManga = await addManga({
      title: data.title,
      urlSlug: data.urlSlug,
      baseUrl: data.baseUrl,
      status: data.status,
      tags: data.tags,
      chapters: []
    });

    if (data.autoDiscover) {
      setDiscoveringManga(newManga.id);
      discoverMangaChapters(newManga.id, data.baseUrl, data.urlSlug).finally(() =>
        setDiscoveringManga(null)
      );
    }
  };

  const handleReadManga = (mangaItem: Manga) => {
    const firstAvailableChapter = () => {
      if (!mangaItem.chapters || mangaItem.chapters.length === 0) return 1;
      return (
        [...mangaItem.chapters]
          .map((chapter) => chapter.chapterNumber)
          .filter((num) => typeof num === 'number' && num > 0)
          .sort((a, b) => a - b)[0] || 1
      );
    };

    const lastReadChapterNumber = extractChapterNumber(mangaItem.lastRead?.chapterId);
    let targetChapterNumber = lastReadChapterNumber ?? firstAvailableChapter();

    if (
      mangaItem.chapters &&
      mangaItem.chapters.length > 0 &&
      !mangaItem.chapters.some((chapter) => chapter.chapterNumber === targetChapterNumber)
    ) {
      targetChapterNumber = firstAvailableChapter();
    }

    if (targetChapterNumber < 1) {
      targetChapterNumber = 1;
    }

    if (mangaItem.status === 'plan') {
      updateManga(mangaItem.id, { status: 'reading' }).catch(() => {
        // ignore transition errors; reading will continue regardless
      });
    }

    navigate(`/read/${mangaItem.id}/${targetChapterNumber}`);
  };

  const handleDeleteManga = async (mangaItem: Manga) => {
    if (confirm(`Delete "${mangaItem.title}"?`)) {
      await removeManga(mangaItem.id);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setSelectedTags([]);
    setSearchTerm('');
    setSortOption('recent');
  };

  const handleSaveMetadata = async (id: string, updates: Partial<Manga>) => {
    await updateManga(id, updates);
  };

  if (isLoading && manga.length === 0) {
    return <LoadingScreen message="Summoning your library..." />;
  }

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Tomes' },
    { value: 'plan', label: statusLabels.plan },
    { value: 'reading', label: statusLabels.reading },
    { value: 'done', label: statusLabels.done }
  ];

  return (
    <div className="min-h-screen bg-library-pattern text-stone-900 dark:text-stone-100">
      <header className="sticky top-0 z-20 border-b-4 border-stone-800 bg-[hsl(var(--parchment))]/95 backdrop-blur">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <h1 className="font-display text-3xl uppercase tracking-[0.4em] text-stone-900">
              The Grand Scriptorium
            </h1>
            <p className="text-sm uppercase tracking-[0.3em] text-stone-600">
              {sortedManga.length} of {manga.length} tomes catalogued
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Inscribe Manga
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="mr-2 h-5 w-5" />
              Scriptor Tools
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b-4 border-stone-800 bg-stone-900/10 py-6">
        <div className="container mx-auto space-y-4 px-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
                className={
                  statusFilter === option.value
                    ? 'shadow-lg shadow-amber-700/40'
                    : 'border-stone-600 text-stone-700 hover:border-amber-600 hover:text-amber-900'
                }
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableTags.length === 0 ? (
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                No tags scribed yet — add some to weave your collection.
              </p>
            ) : (
              availableTags.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] transition ${
                      selected
                        ? 'border-amber-700 bg-amber-300 text-amber-900 shadow-inner'
                        : 'border-stone-500 bg-stone-200/70 text-stone-700 hover:border-amber-600 hover:bg-amber-200 hover:text-amber-900'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search the archives…"
                className="w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-stone-600">
                Sort by
              </span>
              <select
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as SortOption)}
                className="rounded border-2 border-stone-700 bg-[hsl(var(--parchment))] px-3 py-2 text-xs uppercase tracking-[0.3em] text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="recent">Most Recently Inscribed</option>
                <option value="title">Alphabetical</option>
                <option value="status">Status</option>
                <option value="progress">Reading Progress</option>
              </select>
            </div>

            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          {discoveringManga && discoveryProgress && (
            <div className="flex items-center gap-3 rounded border-2 border-amber-700 bg-amber-200/70 px-4 py-3 text-sm font-semibold text-amber-900">
              <Loader2 className="h-5 w-5 animate-spin" />
              Discovering chapters... {discoveryProgress.current} of {discoveryProgress.total}
            </div>
          )}
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        <MangaGrid
          manga={sortedManga}
          onRead={handleReadManga}
          onDelete={handleDeleteManga}
          onEdit={(mangaItem) => setEditingManga(mangaItem)}
        />
      </main>

      <AddMangaDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddManga}
      />

      <EditMangaDialog
        open={!!editingManga}
        manga={editingManga}
        onClose={() => setEditingManga(null)}
        onSave={handleSaveMetadata}
      />

      <SettingsPanel
        open={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onUpdate={updateSettings}
      />
    </div>
  );
}
