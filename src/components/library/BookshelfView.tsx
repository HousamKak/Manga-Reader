import { Manga } from '@/types/manga.types';
import { cn } from '@/utils/cn';

interface BookshelfViewProps {
  manga: Manga[];
  onRead: (manga: Manga) => void;
  onDelete: (manga: Manga) => void;
  onEdit: (manga: Manga) => void;
}

export function BookshelfView({ manga, onRead }: BookshelfViewProps) {
  const booksPerShelf = 16;

  return (
    <div className="space-y-20 py-8"
    >

      {/* Bookshelf rows */}
      {Array.from({ length: Math.ceil(manga.length / booksPerShelf) }).map((_, shelfIndex) => {
        const shelfManga = manga.slice(shelfIndex * booksPerShelf, (shelfIndex + 1) * booksPerShelf);

        return (
          <div key={shelfIndex} className="relative min-h-[300px]">
            {/* Books on shelf */}
            <div className="absolute bottom-14 left-8 flex items-end gap-3">
              {shelfManga.map((item, index) => (
                <BookSpine
                  key={item.id}
                  manga={item}
                  onClick={() => onRead(item)}
                  index={index}
                />
              ))}
            </div>

            {/* Shelf with dim lighting */}
            <div className="absolute bottom-0 left-0 right-0">
              <div
                className="h-14 rounded-sm relative"
                style={{
                  background: 'linear-gradient(180deg, #3d2f22 0%, #2a1f18 50%, #1f1510 100%)',
                  boxShadow: `
                    0 -2px 20px rgba(255, 140, 0, 0.15),
                    inset 0 2px 8px rgba(0,0,0,0.5),
                    0 4px 15px rgba(0,0,0,0.6)
                  `
                }}
              >
                {/* Firelight reflection on shelf */}
                <div
                  className="absolute inset-0 rounded-sm opacity-30"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.1) 50%, transparent)',
                    animation: 'fireFlicker 2.5s ease-in-out infinite'
                  }}
                />

                {/* Shelf front edge */}
                <div className="absolute -bottom-1 left-0 right-0 h-3 bg-gradient-to-b from-[#2a1f18] to-[#1a120e] rounded-b-sm shadow-lg" />

                {/* Support brackets - dimly lit */}
                <div
                  className="absolute top-3 left-8 w-7 h-9 rounded-sm shadow-inner opacity-70"
                  style={{
                    background: 'linear-gradient(to right, #4a3728, #3d2f22)',
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6), 0 0 8px rgba(255, 140, 0, 0.1)'
                  }}
                />
                <div
                  className="absolute top-3 right-8 w-7 h-9 rounded-sm shadow-inner opacity-70"
                  style={{
                    background: 'linear-gradient(to left, #4a3728, #3d2f22)',
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6), 0 0 8px rgba(255, 140, 0, 0.1)'
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface BookSpineProps {
  manga: Manga;
  onClick: () => void;
  index: number;
}

function BookSpine({ manga, onClick, index }: BookSpineProps) {
  const getSpineColor = () => {
    // Generate rich leather brown tones
    const hash = manga.id.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Brown leather hues: 20-35 (deep browns, chestnuts, mahogany)
    const hue = 20 + (Math.abs(hash) % 15);
    const saturation = 45 + (Math.abs(hash >> 8) % 15);
    const lightness = 28 + (Math.abs(hash >> 16) % 12);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const spineColor = getSpineColor();
  const height = 220 + (Math.abs(manga.id.charCodeAt(0)) % 40);

  // Generate natural leaning pattern - books lean on each other
  const getTilt = () => {
    // Create a subtle wave pattern where books lean together in groups
    const groupSize = 4;
    const positionInGroup = index % groupSize;
    const groupIndex = Math.floor(index / groupSize);

    // Alternate group direction
    const groupDirection = (groupIndex % 2 === 0) ? 1 : -1;

    // Very gentle lean - less than 2 degrees to avoid collision
    const leanIntensity = [0.5, 1, 1.2, 0.8]; // Very subtle curve

    return leanIntensity[positionInGroup] * groupDirection;
  };

  const tilt = getTilt();

  // Calculate progress percentage
  const getProgress = () => {
    if (!manga.lastRead || !manga.totalChapters) return 0;
    const chapterId = manga.lastRead.chapterId;
    const match = chapterId.match(/-ch(\d+)$/);
    if (!match) return 0;
    const currentChapter = parseInt(match[1], 10);
    return Math.min(100, (currentChapter / manga.totalChapters) * 100);
  };

  const progress = getProgress();

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer transition-all duration-300 origin-bottom',
        'hover:-translate-y-3 hover:shadow-2xl active:translate-y-0 hover:scale-105'
      )}
      style={{
        background: `linear-gradient(135deg,
          ${spineColor} 0%,
          ${spineColor}f5 35%,
          ${spineColor}dd 65%,
          ${spineColor}cc 100%)`,
        height: `${height}px`,
        width: '75px',
        transform: `rotate(${tilt}deg)`,
        boxShadow: `
          6px 6px 24px rgba(0,0,0,0.6),
          inset -5px 0 12px rgba(0,0,0,0.5),
          inset 5px 0 12px rgba(255,255,255,0.15),
          inset 0 -4px 10px rgba(0,0,0,0.3),
          inset 0 4px 8px rgba(255,255,255,0.08),
          0 0 0 1px rgba(101, 67, 33, 0.4)
        `,
        backgroundColor: spineColor,
        borderRadius: '3px' // Rounded corners all around
      }}
      title={manga.title}
    >
      {/* Rich leather texture overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 35%, rgba(255,255,255,0.12), transparent 45%),
            radial-gradient(circle at 75% 65%, rgba(0,0,0,0.2), transparent 50%),
            repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)
          `,
          opacity: 0.7,
          borderRadius: '3px'
        }}
      />

      {/* Leather grain detail */}
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 30% 20%, rgba(139, 69, 19, 0.2), transparent 40%),
            radial-gradient(ellipse at 70% 80%, rgba(101, 67, 33, 0.15), transparent 40%),
            radial-gradient(ellipse at 50% 50%, rgba(160, 82, 45, 0.1), transparent 60%)
          `,
          borderRadius: '3px'
        }}
      />

      {/* Decorative top band with gold trim */}
      <div
        className="absolute top-0 left-0 right-0 h-3"
        style={{
          background: 'linear-gradient(to right, rgba(80,50,25,0.8), rgba(120,80,40,0.85), rgba(80,50,25,0.8))',
          boxShadow: `
            inset 0 1px 3px rgba(0,0,0,0.4),
            0 1px 0 rgba(212,175,55,0.3)
          `,
          borderRadius: '3px 3px 0 0' // Rounded top corners
        }}
      >
        {/* Gold embossed line */}
        <div
          className="absolute bottom-0 left-2 right-2 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.6), transparent)'
          }}
        />
      </div>

      {/* Decorative bottom band with gold trim */}
      <div
        className="absolute bottom-0 left-0 right-0 h-3"
        style={{
          background: 'linear-gradient(to right, rgba(80,50,25,0.8), rgba(120,80,40,0.85), rgba(80,50,25,0.8))',
          boxShadow: `
            inset 0 -1px 3px rgba(0,0,0,0.4),
            0 -1px 0 rgba(212,175,55,0.3)
          `,
          borderRadius: '0 0 3px 3px' // Rounded bottom corners
        }}
      >
        {/* Gold embossed line */}
        <div
          className="absolute top-0 left-2 right-2 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.6), transparent)'
          }}
        />
      </div>

      {/* Decorative spine ribbing */}
      <div className="absolute left-0 top-8 bottom-8 w-1.5 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 w-full h-0.5 rounded-full"
            style={{
              top: `${i * 20 + 10}%`,
              background: 'linear-gradient(to right, rgba(0,0,0,0.3), rgba(255,255,255,0.15))',
              boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.3)'
            }}
          />
        ))}
      </div>

      {/* Elegant embossed title */}
      <div
        className="absolute inset-0 flex items-center justify-center px-3 py-10 overflow-hidden"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}
      >
        <span
          className="font-display text-[13px] uppercase tracking-wider text-center font-bold"
          style={{
            color: 'rgba(255, 250, 240, 1)',
            textShadow: `
              0 2px 4px rgba(0,0,0,0.9),
              0 0 25px rgba(255,215,0,0.4),
              1px 1px 0px rgba(212,175,55,0.6),
              -1px -1px 2px rgba(0,0,0,0.7),
              0 0 15px rgba(255,200,100,0.3)
            `,
            lineHeight: '1.5',
            letterSpacing: '0.12em',
            filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.3))',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {manga.title}
        </span>
      </div>

      {/* Ornate progress bar with jewel-like appearance */}
      {progress > 0 && (
        <div className="absolute left-3 right-6 bottom-4 h-2 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.3))',
            boxShadow: `
              inset 0 2px 4px rgba(0,0,0,0.6),
              0 1px 2px rgba(212,175,55,0.2)
            `,
            border: '1px solid rgba(101,67,33,0.4)'
          }}
        >
          <div
            className="h-full relative rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(to right, #d4af37, #f9e79f, #ffd700, #f9e79f, #d4af37)',
              boxShadow: `
                0 0 8px rgba(255,215,0,0.6),
                inset 0 1px 2px rgba(255,255,255,0.4),
                inset 0 -1px 2px rgba(0,0,0,0.2)
              `
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/20 rounded-full" />
            {/* Shimmering effect */}
            <div
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      )}

      {/* Subtle embossed pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.15) 20px, rgba(255,255,255,0.15) 21px)
          `,
          borderRadius: '3px'
        }}
      />

      {/* Enhanced firelight glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: `
            0 0 30px rgba(255, 140, 0, 0.5),
            inset 0 0 20px rgba(255, 120, 0, 0.2),
            0 -5px 15px rgba(255, 200, 100, 0.3)
          `,
          borderRadius: '3px'
        }}
      />

      {/* Decorative corner embellishments */}
      <div className="absolute top-4 left-2 w-4 h-4 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.6), transparent)',
          clipPath: 'polygon(0 0, 100% 0, 0 100%)'
        }}
      />
      <div className="absolute bottom-4 left-2 w-4 h-4 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.6), transparent)',
          clipPath: 'polygon(0 0, 0 100%, 100% 100%)'
        }}
      />

      {/* Firelight reflection highlight */}
      <div
        className="absolute top-4 left-2 w-1 h-32 bg-gradient-to-b from-orange-200/20 via-orange-300/10 to-transparent rounded-full blur-sm opacity-60"
        style={{
          animation: 'fireFlicker 2s ease-in-out infinite'
        }}
      />

      {/* Warm firelight on book face */}
      <div
        className="absolute inset-0 rounded-sm pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 30% 40%, rgba(255, 140, 0, 0.15), transparent 60%)',
          animation: 'fireFlicker 3.5s ease-in-out infinite'
        }}
      />
    </button>
  );
}
