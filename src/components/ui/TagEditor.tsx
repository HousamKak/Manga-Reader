import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TagEditorProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagEditor({ value, onChange, placeholder, className }: TagEditorProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const next = inputValue
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (next.length === 0) {
      setInputValue('');
      return;
    }

    const deduped = Array.from(new Set([...value, ...next]));
    onChange(deduped);
    setInputValue('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item.toLowerCase() !== tag.toLowerCase()));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 rounded border-2 border-stone-600/70 bg-[hsl(var(--parchment))] px-3 py-2',
          'shadow-inner shadow-stone-900/20'
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full border border-stone-500/70 bg-stone-700/20 px-3 py-1 text-xs uppercase tracking-wide text-stone-800 dark:text-stone-100"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full border border-transparent p-0.5 text-stone-600 transition hover:border-stone-500 hover:text-stone-900"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder ?? 'Add a tag and press Enter'}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-500 dark:text-stone-100"
        />
      </div>
      <p className="text-xs uppercase tracking-wide text-stone-600 dark:text-stone-300">
        Separate multiple tags with commas or press Enter after each one.
      </p>
    </div>
  );
}
