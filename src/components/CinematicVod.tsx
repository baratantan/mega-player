import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Film, 
  Clapperboard, 
  Search, 
  Star, 
  Play, 
  Info, 
  ArrowLeft, 
  ArrowRight,
  X
} from 'lucide-react';
import { PlaylistItem, WatchProgress } from '../types';
import { Language, translations } from '../utils/translations';

interface CinematicVodProps {
  category: 'movie' | 'series';
  channels: PlaylistItem[];
  favorites: string[];
  watchProgressMap?: Record<string, WatchProgress>;
  onToggleFavorite: (id: string) => void;
  onPlay: (item: PlaylistItem) => void;
  onOpenDetails: (item: PlaylistItem) => void;
  onBackToHome: () => void;
  lang: Language;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } 
  },
};

export const CinematicVod: React.FC<CinematicVodProps> = ({
  category,
  channels,
  favorites,
  watchProgressMap,
  onToggleFavorite,
  onPlay,
  onOpenDetails,
  onBackToHome,
  lang,
}) => {
  const t = translations[lang];

  const items = useMemo(() => {
    return channels.filter(c => c.category === category);
  }, [channels, category]);

  // Extract distinct genres
  const groups = useMemo(() => {
    const set = new Set<string>();
    items.forEach(c => {
      if (c.group) set.add(c.group);
    });
    return Array.from(set);
  }, [items]);

  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedGroup !== 'ALL' && item.group !== selectedGroup) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || (item.group && item.group.toLowerCase().includes(q));
      }
      return true;
    });
  }, [items, selectedGroup, searchQuery]);

  return (
    <div className="flex-1 min-h-screen bg-[#050811] text-white pt-20 pb-20 px-4 sm:px-8 lg:px-12 space-y-8">
      {/* Top Breadcrumb & Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition cursor-pointer"
          >
            {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </motion.button>
          <span className="text-white/20">/</span>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              {category === 'movie' ? <Film className="w-5 h-5 text-amber-400" /> : <Clapperboard className="w-5 h-5 text-purple-400" />}
              <span>{category === 'movie' ? t.movies : t.series}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono text-xs">
              {filteredItems.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-56 sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={category === 'movie' ? (lang === 'ar' ? 'بحث عن فيلم أو تصنيف...' : 'Search movies...') : (lang === 'ar' ? 'بحث عن مسلسل أو موسم...' : 'Search series...')}
            className="w-full ps-9 pe-3 py-2 text-xs bg-white/[0.05] text-white rounded-xl border border-white/[0.1] focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute end-2.5 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Genre Filter Pills (Netflix style) */}
      {groups.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
        >
          <motion.button
            tabIndex={0}
            data-tv-focusable="true"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelectedGroup('ALL')}
            className={`tv-focusable px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedGroup === 'ALL'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08]'
            }`}
          >
            {t.allCategories} ({items.length})
          </motion.button>
          {groups.map(grp => (
            <motion.button
              key={grp}
              tabIndex={0}
              data-tv-focusable="true"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedGroup(grp)}
              className={`tv-focusable px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedGroup === grp
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/25'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08]'
              }`}
            >
              {grp}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* High-res Poster Grid with Smooth Layout and Staggered Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${category}-${selectedGroup}-${searchQuery ? 'search' : 'all'}`}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"
        >
          {filteredItems.map(item => {
            const isFav = favorites.includes(item.id);

            return (
              <motion.div
                key={item.id}
                tabIndex={0}
                data-tv-focusable="true"
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
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
                className="tv-focusable group relative rounded-2xl bg-[#0a0f1d] border border-white/[0.08] hover:border-cyan-500/60 overflow-hidden cursor-pointer transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 flex flex-col justify-between"
              >
                {/* Poster Art */}
                <div className="relative aspect-[2/3] w-full bg-[#070b18] overflow-hidden">
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-600">
                      <Film className="w-12 h-12 text-cyan-500/30 mb-2" />
                      <span className="text-[10px] text-center text-slate-400">{item.name}</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                    {item.resolution && (
                      <span className="px-2 py-0.5 rounded bg-black/80 text-cyan-300 border border-cyan-500/30 text-[9px] font-black font-mono">
                        {item.resolution}
                      </span>
                    )}
                    {item.rating && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-black text-[9px] flex items-center gap-0.5 shadow">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {item.rating}
                      </span>
                    )}
                  </div>

                  {/* TV Focus Indicator Pill */}
                  <div className="tv-focus-indicator absolute top-2 inset-x-2 flex items-center justify-center pointer-events-none z-30">
                    <span className="px-2.5 py-1 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black shadow-lg shadow-cyan-400/50 flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{lang === 'ar' ? 'تشغيل' : 'Play'}</span>
                    </span>
                  </div>

                  {/* Hover / Focus Play & Info Overlay */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2.5">
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(item);
                      }}
                      className="w-12 h-12 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-400/40 transition cursor-pointer"
                    >
                      <Play className="w-6 h-6 fill-current translate-x-0.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetails(item);
                      }}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition cursor-pointer"
                    >
                      <Info className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Netflix-style Playback Progress Bar */}
                  {(() => {
                    const prog = watchProgressMap?.[item.id];
                    if (!prog || prog.percentage <= 0) return null;
                    return (
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-sm px-2 py-1 z-20">
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, prog.percentage)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[8px] font-mono text-slate-300">
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

                {/* Meta info */}
                <div className="p-3.5 bg-[#0a0f1d] flex flex-col justify-between flex-1">
                  <div>
                    <h3 
                      onClick={() => onPlay(item)}
                      className="font-bold text-xs text-white group-hover:text-cyan-300 group-focus:text-cyan-300 truncate cursor-pointer transition-colors"
                    >
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="truncate pe-1">{item.group}</span>
                      {item.year && <span>{item.year}</span>}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-cyan-400 font-mono">{item.duration || 'Feature'}</span>
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className="text-slate-400 hover:text-amber-400 transition"
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {filteredItems.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-slate-500 text-xs"
        >
          <Film className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
          <span>{t.noChannelsFound}</span>
        </motion.div>
      )}
    </div>
  );
};
