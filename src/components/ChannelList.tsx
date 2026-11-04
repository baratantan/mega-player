import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, 
  List, 
  Filter, 
  Sparkles, 
  Tv, 
  Star,
  Clapperboard,
  Film,
  Radio,
  History
} from 'lucide-react';
import { PlaylistItem, MediaCategory } from '../types';
import { ChannelCard } from './ChannelCard';
import { Language, translations } from '../utils/translations';
import { MainTab } from './Sidebar';

interface ChannelListProps {
  channels: PlaylistItem[];
  favorites: string[];
  recentIds: string[];
  activeTab: MainTab;
  searchQuery: string;
  onToggleFavorite: (id: string) => void;
  onPlayChannel: (channel: PlaylistItem) => void;
  onOpenMovieDetails?: (channel: PlaylistItem) => void;
  lang: Language;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  favorites,
  recentIds,
  activeTab,
  searchQuery,
  onToggleFavorite,
  onPlayChannel,
  onOpenMovieDetails,
  lang,
}) => {
  const t = translations[lang];
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedResolution, setSelectedResolution] = useState<string>('ALL');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Filter channels based on activeTab, search, group, resolution
  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      // Tab filter
      if (activeTab === 'favorites') {
        if (!favorites.includes(channel.id)) return false;
      } else if (activeTab === 'recent') {
        if (!recentIds.includes(channel.id)) return false;
      } else if (activeTab === 'live' || activeTab === 'movie' || activeTab === 'series' || activeTab === 'radio') {
        if (channel.category !== activeTab) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = channel.name.toLowerCase().includes(q);
        const matchesGroup = channel.group.toLowerCase().includes(q);
        const matchesCountry = channel.country?.toLowerCase().includes(q);
        if (!matchesName && !matchesGroup && !matchesCountry) return false;
      }

      // Group filter
      if (selectedGroup !== 'ALL' && channel.group !== selectedGroup) {
        return false;
      }

      // Resolution filter
      if (selectedResolution !== 'ALL' && channel.resolution !== selectedResolution) {
        return false;
      }

      return true;
    });
  }, [channels, favorites, recentIds, activeTab, searchQuery, selectedGroup, selectedResolution]);

  // Extract distinct groups for the active tab
  const availableGroups = useMemo(() => {
    const relevant = channels.filter(c => {
      if (activeTab === 'favorites') return favorites.includes(c.id);
      if (activeTab === 'recent') return recentIds.includes(c.id);
      if (activeTab === 'live' || activeTab === 'movie' || activeTab === 'series' || activeTab === 'radio') {
        return c.category === activeTab;
      }
      return true;
    });

    const groups = new Set<string>();
    relevant.forEach(c => {
      if (c.group) groups.add(c.group);
    });
    return Array.from(groups);
  }, [channels, favorites, recentIds, activeTab]);

  const [visibleCount, setVisibleCount] = useState<number>(48);

  React.useEffect(() => {
    setVisibleCount(48);
  }, [selectedGroup, selectedResolution, searchQuery, activeTab]);

  const visibleChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  return (
    <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 overflow-y-auto">
      {/* Top Header & Group Filter Bar */}
      <div className="flex flex-col gap-3.5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              {activeTab === 'live' && <Tv className="w-6 h-6 text-cyan-400" />}
              {activeTab === 'movie' && <Film className="w-6 h-6 text-amber-400" />}
              {activeTab === 'series' && <Clapperboard className="w-6 h-6 text-purple-400" />}
              {activeTab === 'radio' && <Radio className="w-6 h-6 text-emerald-400" />}
              {activeTab === 'favorites' && <Star className="w-6 h-6 text-yellow-400 fill-current" />}
              {activeTab === 'recent' && <History className="w-6 h-6 text-blue-400" />}
              
              <span>
                {activeTab === 'live' && t.liveTv}
                {activeTab === 'movie' && t.movies}
                {activeTab === 'series' && t.series}
                {activeTab === 'radio' && t.radio}
                {activeTab === 'favorites' && t.favorites}
                {activeTab === 'recent' && t.recent}
              </span>
              <span className="text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                {filteredChannels.length}
              </span>
            </h1>
          </div>

          {/* Controls: Resolution & Layout */}
          <div className="flex items-center gap-2">
            {/* Resolution Filter (Only for video) */}
            {activeTab !== 'radio' && (
              <select
                value={selectedResolution}
                onChange={(e) => setSelectedResolution(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">كل الجودات (All Res)</option>
                <option value="4K">4K Ultra HD</option>
                <option value="FHD">1080p FHD</option>
                <option value="HD">720p HD</option>
              </select>
            )}

            {/* Layout Mode Toggles */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  layoutMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  layoutMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Group Categories Filter */}
        {availableGroups.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedGroup === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {t.allCategories}
            </button>
            {availableGroups.map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  selectedGroup === grp
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Channels Grid / List */}
      {filteredChannels.length > 0 ? (
        <>
          <div
          className={
            layoutMode === 'grid'
              ? activeTab === 'movie' || activeTab === 'series'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4'
                : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4'
              : 'flex flex-col gap-2.5'
          }
        >
          {visibleChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isFavorite={favorites.includes(channel.id)}
              onToggleFavorite={onToggleFavorite}
              onPlay={onPlayChannel}
              onOpenDetails={onOpenMovieDetails}
              lang={lang}
              layoutMode={layoutMode}
            />
          ))}
        </div>

        {visibleChannels.length < filteredChannels.length && (
          <div className="py-6 flex items-center justify-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 48)}
              className="px-8 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              {lang === 'ar' ? `تحميل المزيد (تم عرض ${visibleChannels.length} من ${filteredChannels.length})` : `Load More (${visibleChannels.length} of ${filteredChannels.length})`}
            </button>
          </div>
        )}
        </>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900/30 rounded-3xl border border-slate-800/60 my-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
            {activeTab === 'favorites' ? (
              <Star className="w-8 h-8 text-yellow-500/60" />
            ) : activeTab === 'recent' ? (
              <History className="w-8 h-8 text-blue-500/60" />
            ) : (
              <Tv className="w-8 h-8 text-slate-500" />
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-300 mb-1">
            {activeTab === 'favorites'
              ? t.noFavoritesYet
              : activeTab === 'recent'
              ? t.noRecentYet
              : t.noChannelsFound}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? `لا توجد نتائج تطابق "${searchQuery}". جرب كلمة بحث أخرى.`
              : 'يمكنك اختيار قائمة تشغيل أخرى أو إضافة باقة جديدة عبر زر إضافة قائمة.'}
          </p>
        </div>
      )}
    </div>
  );
};
