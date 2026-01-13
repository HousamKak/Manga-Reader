import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Power, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MangaSource, SourcePatternType } from '@/types/source.types';
import {
  loadSources,
  addSource,
  updateSource,
  deleteSource,
  toggleSourceActive,
  validateSourceUrl
} from '@/services/sourceService';

export function SourceManager() {
  const [sources, setSources] = useState<MangaSource[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MangaSource>>({
    name: '',
    baseUrl: '',
    patternType: 'standard',
    fileExtension: 'jpg',
    chapterFormat: 'chapter-{number}',
    pathPrefix: '',
    description: '',
    isActive: true,
    isCustom: true
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadSourcesData();
  }, []);

  const loadSourcesData = () => {
    const loadedSources = loadSources();
    setSources(loadedSources);
  };

  const handleToggleActive = (sourceId: string) => {
    toggleSourceActive(sourceId);
    loadSourcesData();
  };

  const handleDelete = (sourceId: string) => {
    if (window.confirm('Are you sure you want to delete this source?')) {
      deleteSource(sourceId);
      loadSourcesData();
    }
  };

  const handleStartEdit = (source: MangaSource) => {
    setEditingId(source.id);
    setFormData({
      name: source.name,
      baseUrl: source.baseUrl,
      patternType: source.patternType,
      fileExtension: source.fileExtension,
      chapterFormat: source.chapterFormat,
      pathPrefix: source.pathPrefix || '',
      description: source.description || '',
      isActive: source.isActive,
      isCustom: source.isCustom
    });
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setFormData({
      name: '',
      baseUrl: '',
      patternType: 'standard',
      fileExtension: 'jpg',
      chapterFormat: 'chapter-{number}',
      pathPrefix: '',
      description: '',
      isActive: true,
      isCustom: true
    });
    setError('');
  };

  const handleSave = () => {
    setError('');

    if (!formData.name || !formData.baseUrl || !formData.fileExtension || !formData.chapterFormat) {
      setError('Please fill in all required fields');
      return;
    }

    if (!validateSourceUrl(formData.baseUrl)) {
      setError('Invalid base URL');
      return;
    }

    if (editingId) {
      // Update existing source
      updateSource(editingId, formData);
    } else {
      // Add new source
      addSource(formData as Omit<MangaSource, 'id' | 'dateAdded'>);
    }

    handleCancelEdit();
    loadSourcesData();
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setFormData({
      name: '',
      baseUrl: '',
      patternType: 'standard',
      fileExtension: 'jpg',
      chapterFormat: 'chapter-{number}',
      pathPrefix: '',
      description: '',
      isActive: true,
      isCustom: true
    });
    setError('');
  };

  const renderSourceForm = () => (
    <div className="border-2 border-amber-700 bg-[hsl(var(--parchment-light))] p-4 rounded-lg space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Source Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="My Custom Source"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Base URL *</label>
          <Input
            value={formData.baseUrl}
            onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
            placeholder="https://cdn.example.com"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium mb-1">Pattern Type *</label>
          <select
            value={formData.patternType}
            onChange={(e) => setFormData({ ...formData, patternType: e.target.value as SourcePatternType })}
            className="w-full rounded border-2 border-stone-600 bg-[hsl(var(--parchment))] px-3 py-2 text-sm"
            aria-label="Pattern Type"
          >
            <option value="standard">Standard</option>
            <option value="prefixed">Prefixed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">File Extension *</label>
          <Input
            value={formData.fileExtension}
            onChange={(e) => setFormData({ ...formData, fileExtension: e.target.value })}
            placeholder="jpg, webp, png"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Chapter Format *</label>
          <Input
            value={formData.chapterFormat}
            onChange={(e) => setFormData({ ...formData, chapterFormat: e.target.value })}
            placeholder="chapter-{number}"
          />
        </div>
      </div>

      {formData.patternType === 'prefixed' && (
        <div>
          <label className="block text-sm font-medium mb-1">Path Prefix</label>
          <Input
            value={formData.pathPrefix}
            onChange={(e) => setFormData({ ...formData, pathPrefix: e.target.value })}
            placeholder="/file/leveling"
          />
          <p className="text-xs text-muted-foreground mt-1">
            For URLs like: baseUrl/prefix/manga/chapter/page.ext
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description of this source"
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleCancelEdit} size="sm">
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button onClick={handleSave} size="sm">
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-amber-900">Manga Sources</h3>
          <p className="text-sm text-muted-foreground">
            Manage your manga image sources and URL patterns
          </p>
        </div>
        {!isAddingNew && !editingId && (
          <Button onClick={handleStartAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Source
          </Button>
        )}
      </div>

      {isAddingNew && renderSourceForm()}

      <div className="space-y-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className={`border-2 ${
              source.isActive ? 'border-amber-700' : 'border-stone-400'
            } bg-[hsl(var(--parchment))] p-3 rounded-lg ${
              !source.isActive ? 'opacity-60' : ''
            }`}
          >
            {editingId === source.id ? (
              renderSourceForm()
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-stone-900">{source.name}</h4>
                    {!source.isCustom && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                        Built-in
                      </span>
                    )}
                    {!source.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-600 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-600 break-all">{source.baseUrl}</p>
                  {source.description && (
                    <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-stone-500">
                    <span>Type: {source.patternType}</span>
                    <span>Format: {source.fileExtension}</span>
                    <span>Chapter: {source.chapterFormat}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(source.id)}
                    title={source.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <Power className={`h-4 w-4 ${source.isActive ? 'text-green-600' : 'text-stone-400'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(source)}
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {source.isCustom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(source.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {sources.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No sources configured. Add your first source to get started.</p>
        </div>
      )}
    </div>
  );
}
