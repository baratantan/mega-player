import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Star, 
  Info, 
  Tv
} from 'lucide-react';
import { PlaylistItem, WatchProgress } from '../types';
import { Language } from '../utils/translations';

interface ContentCarouselProps {
  title: string;
  subtitle?: string;
  items: PlaylistItem[];
  onPlay: (item: PlaylistItem) => void;
  onOpenDetails: (item: PlaylistItem) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  lang: Language;
  cardShape?: 'poster' | 'backdrop' | 'logo';
  onHoverItem?: (item: PlaylistItem | null) => void;
  watchProgressMap?: Record<string, WatchProgress>;
}

export const ContentCarousel: React.FC<ContentCarouselProps> = ({
  title,
  subtitle,
  items,
  onPlay,
  onOpenDetails,
  favorites,
  onToggleFavorite,
  lang,
  cardShape = 'poster',
  onHoverItem,
  watchProgressMap,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const amount = direction === 'left' ? -420 : 420;
    scrollContainerRef.current.scrollBy({
      left: amount,
      behavior: 'smooth',
    });
  };

  if (items.length === 0) return null;

  return (
    <section className="space-y-3 sm:space-y-4 px-4 sm:px-8 lg:px-12">
      {/* Row Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono font-medium">
              {items.length}
            </span>
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Arrow Navigation */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scroll('left')}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.08] transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scroll('right')}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.08] transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </motion.button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-4 sm:gap-5 overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const isFav = favorites.includes(item.id);

          return (
            <motion.div
              key={item.id}
              tabIndex={0}
              data-tv-focusable="true"
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onFocus={() => {
                onHoverItem?.(item);
                if (scrollContainerRef.current) {
                  // Ensure auto-scrolling horizontally in track
                }
              }}
              onBlur={() => onHoverItem?.(null)}
              onMouseEnter={() => onHoverItem?.(item)}
              onMouseLeave={() => onHoverItem?.(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onPlay(item);
                } else if (e.key === 'i' || e.key === 'I') {
                  e.preventDefault();
                  onOpenDetails(item);
                } else if (e.key === 'f' || e.key === 'F') {
                  e.preventDefault();
                  onToggleFavorite(item.id);
                }
              }}
              className={`tv-focusable group relative shrink-0 snap-start rounded-2xl bg-[#0a0f1d] border border-white/[0.08] hover:border-cyan-500/60 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 ${
                cardShape === 'poster'
                  ? 'w-40 sm:w-48 md:w-52'
                  : cardShape === 'backdrop'
                  ? 'w-64 sm:w-72 md:w-80'
                  : 'w-36 sm:w-40 md:w-44'
              }`}
            >
              {/* Media Art */}
              <div
                className={`relative w-full bg-[#070b18] overflow-hidden ${
                  cardShape === 'poster'
                    ? 'aspect-[2/3]'
                    : cardShape === 'backdrop'
                    ? 'aspect-[16/9]'
                    : 'aspect-square p-4 flex items-center justify-center'
                }`}
              >
                {item.logo || item.backdrop ? (
                  <img
                    src={cardShape === 'backdrop' && item.backdrop ? item.backdrop : item.logo || item.backdrop}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-transform duration-500 ${
                      cardShape === 'logo' ? 'object-contain p-2' : ''
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-600">
                    <Tv className="w-10 h-10 text-cyan-500/40 mb-1" />
                    <span className="text-[10px] text-center text-slate-400">{item.name}</span>
                  </div>
                )}

                {/* Badges on artwork */}
                <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                  {item.category === 'live' ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[9px] font-black uppercase shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  ) : item.resolution ? (
                    <span className="px-1.5 py-0.5 rounded bg-black/80 text-cyan-300 border border-cyan-500/30 text-[9px] font-black font-mono">
                      {item.resolution}
                    </span>
                  ) : null}

                  {item.rating && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[9px] flex items-center gap-0.5 shadow">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {item.rating}
                    </span>
                  )}
                </div>

                {/* TV Remote Focus Highlight Badge (Luminous Pill Indicator) */}
                <div className="tv-focus-indicator absolute top-2 inset-x-2 flex items-center justify-center pointer-events-none z-30">
                  <span className="px-2.5 py-1 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black shadow-lg shadow-cyan-400/50 flex items-center gap-1">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>{lang === 'ar' ? 'اضغط Enter للتشغيل' : 'Press Enter'}</span>
                  </span>
                </div>

                {/* Hover / Focus Action Overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(item);
                    }}
                    className="w-10 h-10 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-400/40 transition cursor-pointer"
                    title={lang === 'ar' ? 'تشغيل' : 'Play'}
                  >
                    <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(item);
                    }}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition cursor-pointer"
                    title={lang === 'ar' ? 'تفاصيل' : 'Info'}
                  >
                    <Info className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-yellow-400 border border-white/20 flex items-center justify-center transition cursor-pointer"
                    title={lang === 'ar' ? 'المفضلة' : 'Favorite'}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-current text-amber-400' : ''}`} />
                  </motion.button>
                </div>

                {/* Netflix-style Playback Progress Bar (Continue Watching) */}
                {(() => {
                  const prog = watchProgressMap?.[item.id];
                  if (!prog || prog.percentage <= 0) return null;
                  return (
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm px-2.5 py-1.5 z-20">
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, prog.percentage)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-300">
                        <span className="text-cyan-400 font-bold">{Math.round(prog.percentage)}%</span>
                        {prog.duration > 0 && (
                          <span className="text-slate-400">
                            {lang === 'ar' ? 'متبقي ' : 'left '}
                            {Math.max(0, Math.floor((prog.duration - prog.currentTime) / 60))}m
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Card Meta Info */}
              <div className="p-3 bg-[#0a0f1d]">
                <h3 
                  onClick={() => onPlay(item)}
                  className="font-bold text-xs text-slate-200 group-hover:text-cyan-300 group-focus:text-cyan-300 truncate cursor-pointer transition-colors"
                >
                  {item.name}
                </h3>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span className="truncate pe-1">{item.group}</span>
                  {item.year && <span>{item.year}</span>}
                  {item.duration && <span>{item.duration}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
