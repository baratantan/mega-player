import React, { useState, useMemo } from 'react';
import { 
  Film, 
  Clapperboard, 
  Search, 
  Star, 
  Play, 
  Clock, 
  Calendar, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Filter,
  Info,
  X
} from 'lucide-react';
import { PlaylistItem, MediaCategory } from '../types';
import { Language, translations } from '../utils/translations';

interface VodLayoutProps {
  category: 'movie' | 'series' | 'radio';
  channels: PlaylistItem[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onPlay: (channel: PlaylistItem) => void;
  onOpenDetails: (channel: PlaylistItem) => void;
  onBackToHome: () => void;
  lang: Language;
}

export const VodLayout: React.FC<VodLayoutProps> = ({
  category,
  channels,
  favorites,
  onToggleFavorite,
  onPlay,
  onOpenDetails,
  onBackToHome,
  lang,
}) => {
  const t = translations[lang];

  // Filter items of this category
  const items = useMemo(() => {
    return channels.filter(c => c.category === category);
  }, [channels, category]);

  // Extract distinct genres / groups
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
        return item.name.toLowerCase().includes(q) || item.group.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, selectedGroup, searchQuery]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden">
      {/* Top Header with Breadcrumbs */}
      <div className="h-14 px-4 sm:px-6 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition"
          >
            {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{lang === 'ar' ? 'الرئيسية' : 'Home Hub'}</span>
          </button>

          <span className="text-slate-600">/</span>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              {category === 'movie' ? <Film className="w-4 h-4 text-amber-400" /> : <Clapperboard className="w-4 h-4 text-purple-400" />}
              <span>{category === 'movie' ? t.movies : t.series}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold">
              {filteredItems.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full ps-8 pe-3 py-1.5 text-xs bg-slate-900/90 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute end-2.5 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Genre Chips */}
      {groups.length > 0 && (
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedGroup === 'ALL'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {t.allCategories}
          </button>
          {groups.map(grp => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedGroup === grp
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      )}

      {/* Poster Grid */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredItems.map(item => {
            const isFav = favorites.includes(item.id);

            return (
              <div
                key={item.id}
                className="group relative bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-cyan-500/50 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-950/40"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full bg-slate-950 overflow-hidden">
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-600">
                      <Film className="w-10 h-10 text-cyan-500/50 mb-2" />
                      <span className="text-[10px] text-center text-slate-400 line-clamp-2">{item.name}</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
                    {item.resolution && (
                      <span className="px-2 py-0.5 text-[9px] font-black rounded bg-slate-950/80 text-cyan-300 border border-cyan-500/30">
                        {item.resolution}
                      </span>
                    )}
                    {item.rating && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500 text-slate-950 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {item.rating}
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                    <button
                      onClick={() => onPlay(item)}
                      className="w-11 h-11 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/40 transform hover:scale-110 active:scale-95 transition"
                    >
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </button>
                    <button
                      onClick={() => onOpenDetails(item)}
                      className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 border border-slate-700 transition"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h3 
                      onClick={() => onPlay(item)}
                      className="font-bold text-xs text-slate-200 group-hover:text-cyan-400 truncate cursor-pointer transition"
                    >
                      {item.name}
                    </h3>
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className="text-slate-400 hover:text-yellow-400 transition"
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'text-yellow-400 fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    {item.year && <span>{item.year}</span>}
                    {item.duration && <span>• {item.duration}</span>}
                    {item.seriesInfo && (
                      <span className="text-purple-400 font-semibold">
                        S{item.seriesInfo.season}:E{item.seriesInfo.episode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex items-center justify-center h-64 text-slate-500 text-xs">
            {t.noChannelsFound}
          </div>
        )}
      </div>
    </div>
  );
};
