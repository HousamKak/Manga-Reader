import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { clearCache, getCacheSize } from "@/services/storageService";
import { AppSettings } from "@/types/settings.types";
import React from "react";
import { SourceManager } from "./SourceManager";

interface SettingsPanelProps {
  open: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

export function SettingsPanel({
  open,
  settings,
  onClose,
  onUpdate,
}: SettingsPanelProps) {
  const [cacheSize, setCacheSize] = React.useState<number>(0);

  React.useEffect(() => {
    if (open) {
      getCacheSize().then((size) => setCacheSize(size));
    }
  }, [open]);

  const handleClearCache = async () => {
    await clearCache();
    setCacheSize(0);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Reading Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Reading</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reading Mode
                </label>
                <select
                  value={settings.readingMode}
                  onChange={(e) =>
                    onUpdate({ readingMode: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="continuous">Continuous Scroll</option>
                  <option value="single">Single Page</option>
                  <option value="double">Double Page</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Reading Direction
                </label>
                <select
                  value={settings.readingDirection}
                  onChange={(e) =>
                    onUpdate({ readingDirection: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="ltr">Left to Right</option>
                  <option value="rtl">Right to Left</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Image Fit
                </label>
                <select
                  value={settings.imageFit}
                  onChange={(e) =>
                    onUpdate({ imageFit: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="width">Fit to Width</option>
                  <option value="height">Fit to Height</option>
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Background Color
                </label>
                <select
                  value={settings.backgroundColor}
                  onChange={(e) =>
                    onUpdate({ backgroundColor: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="white">White</option>
                  <option value="black">Black</option>
                  <option value="sepia">Sepia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Zoom Level: {Math.round(settings.defaultZoom * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.defaultZoom}
                  onChange={(e) =>
                    onUpdate({ defaultZoom: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>50%</span>
                  <span>100%</span>
                  <span>200%</span>
                  <span>300%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPageNumbers"
                  checked={settings.showPageNumbers}
                  onChange={(e) =>
                    onUpdate({ showPageNumbers: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="showPageNumbers" className="text-sm">
                  Show page numbers
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoHideUI"
                  checked={settings.autoHideUI}
                  onChange={(e) => onUpdate({ autoHideUI: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="autoHideUI" className="text-sm">
                  Auto-hide UI when reading
                </label>
              </div>
            </div>
          </section>

          {/* Performance Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Performance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preload Pages: {settings.preloadPages}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={settings.preloadPages}
                  onChange={(e) =>
                    onUpdate({ preloadPages: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Number of pages to preload ahead
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Cache Size: {settings.maxCacheSize} MB
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={settings.maxCacheSize}
                  onChange={(e) =>
                    onUpdate({ maxCacheSize: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enablePreloading"
                  checked={settings.enablePreloading}
                  onChange={(e) =>
                    onUpdate({ enablePreloading: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="enablePreloading" className="text-sm">
                  Enable image preloading
                </label>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Appearance</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => onUpdate({ theme: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </section>

          {/* Controls */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Controls</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableKeyboardShortcuts"
                  checked={settings.enableKeyboardShortcuts}
                  onChange={(e) =>
                    onUpdate({ enableKeyboardShortcuts: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="enableKeyboardShortcuts" className="text-sm">
                  Enable keyboard shortcuts
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableTouchGestures"
                  checked={settings.enableTouchGestures}
                  onChange={(e) =>
                    onUpdate({ enableTouchGestures: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="enableTouchGestures" className="text-sm">
                  Enable touch gestures
                </label>
              </div>
            </div>
          </section>

          {/* Cache Management */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Storage</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Current cache size: {formatBytes(cacheSize)}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearCache}
              >
                Clear Cache
              </Button>
            </div>
          </section>

          {/* Source Management */}
          <section>
            <SourceManager />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
