import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMangaStore } from '@/stores/mangaStore';
import { useReaderStore } from '@/stores/readerStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { useAutoHideUI } from '@/hooks/useAutoHideUI';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { ImageViewer } from '@/components/reader/ImageViewer';
import { ReaderToolbar } from '@/components/reader/ReaderToolbar';
import { PageControls } from '@/components/reader/PageControls';
import { ChapterSelector } from '@/components/reader/ChapterSelector';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { LoadingScreen } from '@/components/ui/Loading';
import { cn } from '@/utils/cn';

export function Reader() {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>();
  const navigate = useNavigate();

  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reloadingChapter, setReloadingChapter] = useState(false);
  const initialPageAppliedRef = useRef(false);

  const { currentManga, loadManga, updateReadingProgress, discoverChapter } = useMangaStore();
  const {
    currentPage,
    uiVisible,
    navigation,
    setManga,
    setChapter,
    setPage,
    nextPage,
    previousPage,
    toggleUI,
    setUIVisible,
    setNavigation
  } = useReaderStore();
  const { settings, updateSettings } = useSettingsStore();

  // Load manga data
  useEffect(() => {
    if (mangaId) {
      loadManga(mangaId);
      setManga(mangaId);
    }
  }, [mangaId]);

  // Set current chapter
  useEffect(() => {
    if (chapterId) {
      setChapter(chapterId);
    }
  }, [chapterId]);

  // Discover pages if needed (only once per chapter)
  useEffect(() => {
    if (chapterId && mangaId) {
      const chapterNumber = parseInt(chapterId);

      // Discover pages for this chapter if not already discovered
      discoverChapter(mangaId, chapterNumber).catch((error) => {
        console.error('Failed to discover chapter pages:', error);
      });
    }
  }, [chapterId, mangaId]); // Remove currentManga dependency to prevent re-renders

  useEffect(() => {
    initialPageAppliedRef.current = false;
  }, [chapterId]);

  // Update navigation state
  useEffect(() => {
    if (!currentManga || !chapterId) return;

    const chapterNumber = parseInt(chapterId);
    const chapterIndex = currentManga.chapters.findIndex((c) => c.chapterNumber === chapterNumber);
    const currentChapter = currentManga.chapters[chapterIndex];

    if (!currentChapter) return;

    const totalPages = currentChapter.totalPages || currentChapter.pages.length || 1;

    setNavigation({
      hasNextPage: currentPage < totalPages - 1, // 0-indexed, so last page is totalPages - 1
      hasPreviousPage: currentPage > 0, // Can go back if not on page 0
      hasNextChapter: chapterIndex < currentManga.chapters.length - 1,
      hasPreviousChapter: chapterIndex > 0,
      currentChapterIndex: chapterIndex,
      totalChapters: currentManga.chapters.length
    });
  }, [currentManga, chapterId, currentPage]);

  // Update reading progress
  useEffect(() => {
    if (mangaId && chapterId && currentPage >= 0) {
      const chapterNumber = parseInt(chapterId);
      const chapter = currentManga?.chapters.find(c => c.chapterNumber === chapterNumber);
      if (chapter) {
        updateReadingProgress(mangaId, chapter.id, currentPage);
      }
    }
  }, [mangaId, chapterId, currentPage, currentManga]);

  // Auto-hide UI
  useAutoHideUI(() => setUIVisible(false), settings.autoHideDelay, settings.autoHideUI);

  // Get current chapter and pages
  const chapterNumber = chapterId ? parseInt(chapterId) : null;
  const currentChapter = chapterNumber
    ? currentManga?.chapters.find((c) => c.chapterNumber === chapterNumber)
    : null;
  const currentPageData = currentChapter?.pages[currentPage]; // Pages are 0-indexed

  useEffect(() => {
    if (!currentManga || !chapterId) return;

    const lastRead = currentManga.lastRead;
    if (!lastRead) return;

    const chapterMatch = lastRead.chapterId.match(/-ch(\d+)$/);
    if (!chapterMatch) return;

    const lastChapterNumber = parseInt(chapterMatch[1], 10);
    const activeChapterNumber = parseInt(chapterId, 10);

    if (Number.isNaN(lastChapterNumber) || Number.isNaN(activeChapterNumber)) {
      return;
    }

    if (lastChapterNumber !== activeChapterNumber || initialPageAppliedRef.current) {
      return;
    }

    const totalPages =
      currentChapter?.totalPages ?? currentChapter?.pages.length ?? 0;

    const targetPage =
      totalPages > 0
        ? Math.min(Math.max(lastRead.page ?? 0, 0), totalPages - 1)
        : Math.max(lastRead.page ?? 0, 0);

    setPage(targetPage);
    initialPageAppliedRef.current = true;
  }, [currentManga, chapterId, currentChapter, setPage]);

  const handleReloadChapter = useCallback(() => {
    if (!mangaId || !chapterId || reloadingChapter) return;

    const number = parseInt(chapterId, 10);
    if (Number.isNaN(number)) return;

    setReloadingChapter(true);
    discoverChapter(mangaId, number, { force: true })
      .catch((error) => {
        console.error('Failed to reload chapter pages:', error);
      })
      .finally(() => {
        setReloadingChapter(false);
      });
  }, [mangaId, chapterId, reloadingChapter, discoverChapter]);

  // Preload adjacent pages
  const pagesToPreload = React.useMemo(() => {
    if (!currentChapter || !settings.enablePreloading) return [];

    const urls: string[] = [];
    for (let i = 1; i <= settings.preloadPages; i++) {
      const nextPage = currentChapter.pages[currentPage + i]; // 0-indexed
      if (nextPage) urls.push(nextPage.imageUrl);
    }
    return urls;
  }, [currentChapter, currentPage, settings.enablePreloading, settings.preloadPages]);

  useImagePreloader(pagesToPreload, {
    enabled: settings.enablePreloading,
    maxConcurrent: settings.maxConcurrentLoads
  });

  useEffect(() => {
    if (!mangaId || !currentManga || !chapterNumber) return;

    const totalChapters = currentManga.totalChapters;

    [1, 2].forEach((offset) => {
      const targetChapter = chapterNumber + offset;
      if (targetChapter <= 0) return;
      if (typeof totalChapters === 'number' && targetChapter > totalChapters) return;

      discoverChapter(mangaId, targetChapter).catch(() => {
        // Ignore prefetch failures; chapter may not exist yet
      });
    });
  }, [currentManga, chapterNumber, mangaId, discoverChapter]);

  // Keyboard shortcuts
  const handleShortcutAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'nextPage':
          if (navigation.hasNextPage) nextPage();
          break;
        case 'previousPage':
          if (navigation.hasPreviousPage) previousPage();
          break;
        case 'toggleFullscreen':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
          break;
        case 'exitFullscreen':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
        case 'toggleUI':
          toggleUI();
          break;
        case 'firstPage':
          setPage(0); // First page is 0
          break;
        case 'lastPage':
          if (currentChapter) {
            const totalPages = currentChapter.totalPages || currentChapter.pages.length;
            setPage(totalPages - 1); // Last page is totalPages - 1 (0-indexed)
          }
          break;
      }
    },
    [navigation, nextPage, previousPage, toggleUI, setPage, currentChapter]
  );

  useKeyboardShortcuts(handleShortcutAction, settings.enableKeyboardShortcuts);

  // Touch gestures
  useSwipeGestures(
    {
      onSwipeLeft: () => {
        if (settings.readingDirection === 'ltr' && navigation.hasNextPage) {
          nextPage();
        } else if (settings.readingDirection === 'rtl' && navigation.hasPreviousPage) {
          previousPage();
        }
      },
      onSwipeRight: () => {
        if (settings.readingDirection === 'ltr' && navigation.hasPreviousPage) {
          previousPage();
        } else if (settings.readingDirection === 'rtl' && navigation.hasNextPage) {
          nextPage();
        }
      }
    },
    { enabled: settings.enableTouchGestures }
  );

  const handleNextChapter = () => {
    if (!currentManga || !navigation.hasNextChapter) return;
    const nextChapter = currentManga.chapters[navigation.currentChapterIndex + 1];
    navigate(`/read/${mangaId}/${nextChapter.chapterNumber}`);
  };

  const handlePreviousChapter = () => {
    if (!currentManga || !navigation.hasPreviousChapter) return;
    const prevChapter = currentManga.chapters[navigation.currentChapterIndex - 1];
    navigate(`/read/${mangaId}/${prevChapter.chapterNumber}`);
  };

  const handleSelectChapter = (chapterId: string) => {
    // Extract chapter number from chapter ID
    const chapter = currentManga?.chapters.find(c => c.id === chapterId);
    if (chapter) {
      navigate(`/read/${mangaId}/${chapter.chapterNumber}`);
    }
  };

  const handleToggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  // Only show loading screen if we don't have manga data
  if (!currentManga) {
    return <LoadingScreen message="Loading manga..." />;
  }

  // If chapter doesn't exist yet, show loading
  // But if chapter exists with pages (even placeholder pages), show the reader
  if (!currentChapter) {
    return <LoadingScreen message="Loading chapter..." />;
  }

  const bgColorClass = {
    white: 'bg-white',
    black: 'bg-black',
    sepia: 'bg-[#f4ecd8]'
  }[settings.backgroundColor];

  return (
    <div
      className={cn('min-h-screen', bgColorClass)}
      onClick={() => setUIVisible(!uiVisible)}
    >
      {/* Toolbar - Always Visible */}
      <ReaderToolbar
        title={currentManga.title}
        chapterNumber={currentChapter.chapterNumber}
        currentPage={currentPage}
        totalPages={currentChapter.totalPages || currentChapter.pages.length}
        totalChapters={currentManga.chapters.length}
        readingMode={settings.readingMode}
        imageFit={settings.imageFit}
        fullscreen={!!document.fullscreenElement}
        visible={true}
        onBack={() => navigate('/')}
        onSettingsClick={() => setShowSettings(true)}
        onChapterListClick={() => setShowChapterSelector(true)}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleReadingMode={() => {
          const modes = ['continuous', 'single', 'double'] as const;
          const currentIndex = modes.indexOf(settings.readingMode);
          const nextMode = modes[(currentIndex + 1) % modes.length];
          updateSettings({ readingMode: nextMode });
        }}
        onImageFitChange={(fit) => {
          updateSettings({ imageFit: fit });
        }}
        onChapterChange={(ch) => {
          navigate(`/read/${mangaId}/${ch}`);
        }}
        onPageChange={(pg) => {
          setPage(pg);
        }}
        onReloadChapter={handleReloadChapter}
        reloadingChapter={reloadingChapter}
      />

      {/* Main Content */}
      <main className="pt-16 pb-24">
        {settings.readingMode === 'continuous' ? (
          <div className="space-y-2">
            {currentChapter.pages.length > 0 ? (
              currentChapter.pages.map((page) => (
                <div key={page.id} className="w-full flex justify-center items-center">
                  <ImageViewer
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber + 1}`}
                    imageFit={settings.imageFit}
                    zoomLevel={settings.defaultZoom}
                    className="w-full"
                  />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Loading pages...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
            {currentPageData ? (
              <ImageViewer
                src={currentPageData.imageUrl}
                alt={`Page ${currentPage + 1}`}
                imageFit={settings.imageFit}
                zoomLevel={settings.defaultZoom}
              />
            ) : (
              <LoadingScreen message="Loading page..." />
            )}
          </div>
        )}
      </main>

      {/* Page Controls (only for single/double page mode) */}
      {settings.readingMode !== 'continuous' && (
        <PageControls
          currentPage={currentPage}
          totalPages={currentChapter.totalPages || currentChapter.pages.length}
          hasNextPage={navigation.hasNextPage}
          hasPreviousPage={navigation.hasPreviousPage}
          hasNextChapter={navigation.hasNextChapter}
          hasPreviousChapter={navigation.hasPreviousChapter}
          onNextPage={nextPage}
          onPreviousPage={previousPage}
          onNextChapter={handleNextChapter}
          onPreviousChapter={handlePreviousChapter}
          onPageSelect={setPage}
          visible={uiVisible}
        />
      )}

      {/* Dialogs */}
      <ChapterSelector
        open={showChapterSelector}
        chapters={currentManga.chapters}
        currentChapterId={chapterId || null}
        onClose={() => setShowChapterSelector(false)}
        onSelectChapter={handleSelectChapter}
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
