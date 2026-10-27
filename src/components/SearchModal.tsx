import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  Play, 
  Tv, 
  Film, 
  Clapperboard, 
  Star, 
  Sparkles, 
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { PlaylistItem, MediaCategory } from '../types';
import { Language, translations } from '../utils/translations';

interface SearchModalProps {
  channels: PlaylistItem[];
  onPlay: (item: PlaylistItem) => void;
  onOpenDetails: (item: PlaylistItem) => void;
  onClose: () => void;
  lang: Language;
}

type FilterCategory = 'all' | 'live' | 'movie' | 'series';

export const SearchModal: React.FC<SearchModalProps> = ({
  channels,
  onPlay,
  onOpenDetails,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter channels based on query and activeCategory
  const { liveResults, movieResults, seriesResults, allFlatResults } = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // Default suggestions when search query is empty
      const defaultLive = channels.filter(c => c.category === 'live').slice(0, 4);
      const defaultMovies = channels.filter(c => c.category === 'movie').slice(0, 4);
      const defaultSeries = channels.filter(c => c.category === 'series').slice(0, 3);
      
      const flat: PlaylistItem[] = [];
      if (activeCategory === 'all' || activeCategory === 'live') flat.push(...defaultLive);
      if (activeCategory === 'all' || activeCategory === 'movie') flat.push(...defaultMovies);
      if (activeCategory === 'all' || activeCategory === 'series') flat.push(...defaultSeries);

      return {
        liveResults: defaultLive,
        movieResults: defaultMovies,
        seriesResults: defaultSeries,
        allFlatResults: flat,
      };
    }

    const matches = channels.filter(item => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchGroup = item.group.toLowerCase().includes(q);
      const matchTagline = item.tagline ? item.tagline.toLowerCase().includes(q) : false;
      const matchSynopsis = item.synopsis ? item.synopsis.toLowerCase().includes(q) : false;
      const matchGenres = item.genres ? item.genres.some(g => g.toLowerCase().includes(q)) : false;
      const matchCountry = item.country ? item.country.toLowerCase().includes(q) : false;

      return matchName || matchGroup || matchTagline || matchSynopsis || matchGenres || matchCountry;
    });

    const live = matches.filter(c => c.category === 'live');
    const movies = matches.filter(c => c.category === 'movie');
    const series = matches.filter(c => c.category === 'series');

    const flat: PlaylistItem[] = [];
    if (activeCategory === 'all' || activeCategory === 'live') flat.push(...live);
    if (activeCategory === 'all' || activeCategory === 'movie') flat.push(...movies);
    if (activeCategory === 'all' || activeCategory === 'series') flat.push(...series);

    return {
      liveResults: live,
      movieResults: movies,
      seriesResults: series,
      allFlatResults: flat,
    };
  }, [channels, query, activeCategory]);

  // Reset selected index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Keyboard navigation (Arrow keys, Enter, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < allFlatResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, allFlatResults.length - 1)));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedItem = allFlatResults[selectedIndex];
        if (selectedItem) {
          if (selectedItem.category === 'movie' || selectedItem.category === 'series') {
            onOpenDetails(selectedItem);
          } else {
            onPlay(selectedItem);
          }
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allFlatResults, selectedIndex, onPlay, onOpenDetails, onClose]);

  const totalMatchesCount = liveResults.length + movieResults.length + seriesResults.length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-hidden"
    >
      {/* Click outside backdrop to close */}
      <div 
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={onClose}
      />

      {/* Centered Glassmorphism Spotlight Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-3xl bg-[#080d1d]/90 backdrop-blur-3xl border border-cyan-500/30 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Top Subtle Gradient Accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Floating Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3 bg-black/40">
          <div className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isRtl 
                ? 'ابحث بالاسم، الفيلم، التصنيف، الجودة (4K)، أو البث...'
                : 'Search by channel, movie, genre, 4K quality, or stream...'
            }
            className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-sm sm:text-base font-semibold focus:outline-none"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition cursor-pointer"
              title={isRtl ? 'مسح البحث' : 'Clear search'}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] font-mono text-slate-400">
            <span>ESC</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition cursor-pointer"
            title={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-black/25 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/25 font-black'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الكل' : 'All'}</span>
              {query && <span className="text-[10px] opacity-80">({totalMatchesCount})</span>}
            </button>

            <button
              onClick={() => setActiveCategory('live')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'live'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/25 font-black'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{t.liveTv}</span>
              {query && <span className="text-[10px] opacity-80">({liveResults.length})</span>}
            </button>

            <button
              onClick={() => setActiveCategory('movie')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'movie'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/25 font-black'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>{t.movies}</span>
              {query && <span className="text-[10px] opacity-80">({movieResults.length})</span>}
            </button>

            <button
              onClick={() => setActiveCategory('series')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === 'series'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/25 font-black'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>{t.series}</span>
              {query && <span className="text-[10px] opacity-80">({seriesResults.length})</span>}
            </button>
          </div>

          <span className="text-[11px] font-mono text-cyan-400/80 hidden sm:inline">
            {query.trim() ? `${totalMatchesCount} ${isRtl ? 'نتيجة بحث' : 'results'}` : (isRtl ? 'اقتراحات شائعة' : 'Trending suggestions')}
          </span>
        </div>

        {/* Results Body Segmented into (قنوات، أفلام، مسلسلات) */}
        <div 
          ref={listContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent"
        >
          {totalMatchesCount === 0 && query.trim() !== '' ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">{t.noChannelsFound}</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isRtl 
                  ? `لم نجد أي نتائج مطابقة لـ "${query}". جرب البحث بكلمات أخرى أو اختر فئة مختلفة.` 
                  : `No results found for "${query}". Try searching with different keywords or categories.`}
              </p>
            </div>
          ) : (
            <>
              {/* 1. قنوات البث المباشر (Live TV Section) */}
              {(activeCategory === 'all' || activeCategory === 'live') && liveResults.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs font-black text-white">
                      <span className="p-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                        <Tv className="w-3.5 h-3.5" />
                      </span>
                      <span>{isRtl ? 'قنوات البث المباشر' : 'Live TV Channels'}</span>
                      <span className="text-[11px] font-mono text-cyan-400">({liveResults.length})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      {isRtl ? 'بث فوري' : 'Live Streams'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {liveResults.map((channel) => {
                      const isSelected = allFlatResults[selectedIndex]?.id === channel.id;

                      return (
                        <div
                          key={channel.id}
                          onClick={() => {
                            onPlay(channel);
                            onClose();
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-950/80 via-[#0d1c33] to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                              : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] hover:border-cyan-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Poster / Logo Thumbnail */}
                            <div className="relative w-12 h-12 rounded-xl bg-black/60 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-cyan-500/40 transition">
                              {channel.logo ? (
                                <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <Tv className="w-5 h-5 text-slate-500" />
                              )}
                              <span className="absolute bottom-1 end-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-black animate-pulse" />
                            </div>

                            {/* Channel Metadata */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className={`text-xs font-black truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                                  {channel.name}
                                </h4>
                                {channel.resolution && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-black text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                                    {channel.resolution}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {channel.group} {channel.country ? `• ${channel.country}` : ''}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlay(channel);
                              onClose();
                            }}
                            className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold transition shrink-0 cursor-pointer shadow-sm"
                            title={isRtl ? 'تشغيل القناة' : 'Play Channel'}
                          >
                            <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. الأفلام السينمائية (Movies Section with Posters) */}
              {(activeCategory === 'all' || activeCategory === 'movie') && movieResults.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs font-black text-white">
                      <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Film className="w-3.5 h-3.5" />
                      </span>
                      <span>{isRtl ? 'الأفلام السينمائية 4K' : 'Cinema & Movies 4K'}</span>
                      <span className="text-[11px] font-mono text-cyan-400">({movieResults.length})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      {isRtl ? 'سينما فائقة الوضوح' : 'VOD Cinema'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {movieResults.map((movie) => {
                      const isSelected = allFlatResults[selectedIndex]?.id === movie.id;

                      return (
                        <div
                          key={movie.id}
                          onClick={() => {
                            onOpenDetails(movie);
                            onClose();
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-950/80 via-[#0d1c33] to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                              : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] hover:border-cyan-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Movie Poster Thumbnail */}
                            <div className="relative w-14 h-16 rounded-xl bg-black/80 border border-white/10 overflow-hidden shrink-0 group-hover:border-cyan-500/40 transition">
                              {movie.logo || movie.backdrop ? (
                                <img
                                  src={movie.logo || movie.backdrop}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                  <Film className="w-6 h-6 text-slate-600" />
                                </div>
                              )}
                              {movie.resolution && (
                                <span className="absolute top-1 start-1 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono font-bold text-cyan-400 border border-cyan-500/30">
                                  {movie.resolution}
                                </span>
                              )}
                            </div>

                            {/* Movie Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-xs sm:text-sm font-black truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                                  {movie.name}
                                </h4>
                                {movie.rating && (
                                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20 shrink-0">
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    <span>{movie.rating}</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {movie.tagline || movie.synopsis || movie.group}
                              </p>

                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                                {movie.year && <span>{movie.year}</span>}
                                {movie.duration && <span>• {movie.duration}</span>}
                                {movie.genres && (
                                  <span className="text-cyan-400/80">• {movie.genres.slice(0, 2).join(', ')}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDetails(movie);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                            >
                              {isRtl ? 'تفاصيل' : 'Details'}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlay(movie);
                                onClose();
                              }}
                              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition shadow-md shadow-cyan-500/30 cursor-pointer"
                              title={isRtl ? 'تشغيل الفيلم' : 'Play Movie'}
                            >
                              <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. المسلسلات والبرامج (Series Section with Posters) */}
              {(activeCategory === 'all' || activeCategory === 'series') && seriesResults.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs font-black text-white">
                      <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <Clapperboard className="w-3.5 h-3.5" />
                      </span>
                      <span>{isRtl ? 'المسلسلات والإنتاجات الحصرية' : 'Series & TV Shows'}</span>
                      <span className="text-[11px] font-mono text-cyan-400">({seriesResults.length})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      {isRtl ? 'مواسم وحلقات' : 'Episodes'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {seriesResults.map((series) => {
                      const isSelected = allFlatResults[selectedIndex]?.id === series.id;

                      return (
                        <div
                          key={series.id}
                          onClick={() => {
                            onOpenDetails(series);
                            onClose();
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-950/80 via-[#101a33] to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                              : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] hover:border-indigo-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Series Poster Thumbnail */}
                            <div className="relative w-14 h-16 rounded-xl bg-black/80 border border-white/10 overflow-hidden shrink-0 group-hover:border-indigo-500/40 transition">
                              {series.logo || series.backdrop ? (
                                <img
                                  src={series.logo || series.backdrop}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                  <Clapperboard className="w-6 h-6 text-slate-600" />
                                </div>
                              )}
                              <span className="absolute bottom-1 start-1 px-1 py-0.2 rounded bg-indigo-600/90 text-[8px] font-black text-white uppercase">
                                {isRtl ? 'مسلسل' : 'Series'}
                              </span>
                            </div>

                            {/* Series Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className={`text-xs sm:text-sm font-black truncate ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                                  {series.name}
                                </h4>
                                {series.rating && (
                                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20 shrink-0">
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    <span>{series.rating}</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {series.tagline || series.synopsis || series.group}
                              </p>

                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                                {series.seriesInfo && (
                                  <span className="text-cyan-400 font-bold">
                                    {isRtl ? `الموسم ${series.seriesInfo.season} • الحلقة ${series.seriesInfo.episode}` : `S${series.seriesInfo.season} E${series.seriesInfo.episode}`}
                                  </span>
                                )}
                                {series.genres && (
                                  <span>• {series.genres.slice(0, 2).join(', ')}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDetails(series);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                            >
                              {isRtl ? 'الحلقات' : 'Episodes'}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlay(series);
                                onClose();
                              }}
                              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold transition shadow-md shadow-indigo-500/30 cursor-pointer"
                              title={isRtl ? 'تشغيل المسلسل' : 'Play Series'}
                            >
                              <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Shortcut Navigation Guide */}
        <div className="p-3 sm:px-6 bg-black/50 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">↓</kbd>
              <span>{isRtl ? 'للتنقل' : 'Navigate'}</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">↵ Enter</kbd>
              <span>{isRtl ? 'للتشغيل / فتح التفاصيل' : 'Select'}</span>
            </span>
          </div>

          <span className="hidden sm:inline text-slate-500">
            {isRtl ? 'اضغط Ctrl + K في أي وقت للبحث' : 'Press Ctrl + K anytime to search'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

