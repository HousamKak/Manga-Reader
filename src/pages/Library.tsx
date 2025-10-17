import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Loader2 } from 'lucide-react';
import { useMangaStore } from '@/stores/mangaStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { MangaGrid } from '@/components/library/MangaGrid';
import { AddMangaDialog } from '@/components/library/AddMangaDialog';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/Loading';
import { Manga } from '@/types/manga.types';

export function Library() {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [discoveringManga, setDiscoveringManga] = useState<string | null>(null);

  const {
    manga,
    isLoading,
    discoveryProgress,
    loadAllManga,
    addManga,
    removeManga,
    discoverMangaChapters
  } = useMangaStore();

  const { settings, loadSettings, updateSettings } = useSettingsStore();

  useEffect(() => {
    loadAllManga();
    loadSettings();
  }, []);

  const handleAddManga = async (data: {
    title: string;
    urlSlug: string;
    baseUrl: string;
    autoDiscover: boolean;
  }) => {
    const newManga = await addManga({
      title: data.title,
      urlSlug: data.urlSlug,
      baseUrl: data.baseUrl,
      chapters: []
    });

    // Start discovery in background if enabled
    if (data.autoDiscover) {
      setDiscoveringManga(newManga.id);
      // Run discovery in background (don't await)
      discoverMangaChapters(newManga.id, data.baseUrl, data.urlSlug)
        .finally(() => setDiscoveringManga(null));
    }
  };

  const handleReadManga = (manga: Manga) => {
    const extractChapterNumber = (chapterId: string | undefined): number | null => {
      if (!chapterId) return null;
      const match = chapterId.match(/-ch(\d+)$/);
      if (!match) return null;
      const number = parseInt(match[1], 10);
      return Number.isNaN(number) ? null : number;
    };

    const firstAvailableChapter = () => {
      if (!manga.chapters || manga.chapters.length === 0) return 1;
      return [...manga.chapters]
        .map((chapter) => chapter.chapterNumber)
        .filter((num) => typeof num === 'number' && num > 0)
        .sort((a, b) => a - b)[0] || 1;
    };

    const lastReadChapterNumber = extractChapterNumber(manga.lastRead?.chapterId);
    let targetChapterNumber = lastReadChapterNumber ?? firstAvailableChapter();

    if (
      manga.chapters &&
      manga.chapters.length > 0 &&
      !manga.chapters.some((chapter) => chapter.chapterNumber === targetChapterNumber)
    ) {
      targetChapterNumber = firstAvailableChapter();
    }

    if (targetChapterNumber < 1) {
      targetChapterNumber = 1;
    }

    navigate(`/read/${manga.id}/${targetChapterNumber}`);
  };

  const handleDeleteManga = async (manga: Manga) => {
    if (confirm(`Delete "${manga.title}"?`)) {
      await removeManga(manga.id);
    }
  };

  if (isLoading && manga.length === 0) {
    return <LoadingScreen message="Loading your library..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manga Reader</h1>
            <p className="text-sm text-muted-foreground">
              {manga.length} {manga.length === 1 ? 'manga' : 'manga'} in library
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Add Manga
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Discovery Progress */}
      {discoveringManga && discoveryProgress && (
        <div className="bg-primary/10 border-b py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">
                Discovering chapters... {discoveryProgress.current} of{' '}
                {discoveryProgress.total}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <MangaGrid
          manga={manga}
          onRead={handleReadManga}
          onDelete={handleDeleteManga}
        />
      </main>

      {/* Dialogs */}
      <AddMangaDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddManga}
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
