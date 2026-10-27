import React, { useState } from 'react';
import { 
  Tv, 
  Plus, 
  Search, 
  Globe, 
  Settings, 
  Grid2X2, 
  X, 
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { PlaylistProfile } from '../types';
import { Language, translations } from '../utils/translations';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  playlists: PlaylistProfile[];
  activePlaylistId: string;
  onSelectPlaylist: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenMultiView: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalChannelsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onOpenAddModal,
  onOpenSettings,
  onOpenMultiView,
  searchQuery,
  onSearchChange,
  totalChannelsCount,
}) => {
  const t = translations[lang];
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Active Playlist */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-cyan-500/20">
              <Tv className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {t.appTitle}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase">
                  PRO
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-400 font-medium">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Playlist Selector Dropdown */}
          <div className="relative">
            <button
              id="playlist-selector-btn"
              onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition"
              title={t.playlists}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[110px] sm:max-w-[150px] truncate">
                {activePlaylist?.name || t.playlists}
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {totalChannelsCount}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showPlaylistMenu && (
              <div className="absolute top-full mt-1.5 start-0 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  {t.playlists} ({playlists.length})
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 my-1">
                  {playlists.map(pl => (
                    <button
                      key={pl.id}
                      onClick={() => {
                        onSelectPlaylist(pl.id);
                        setShowPlaylistMenu(false);
                      }}
                      className={`w-full text-start px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                        pl.id === activePlaylistId
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate pe-2">
                        <p className="truncate font-medium">{pl.name}</p>
                        <p className="text-[10px] text-slate-400">{pl.channels.length} {t.allChannels.toLowerCase()}</p>
                      </div>
                      {pl.type === 'preset' && (
                        <span className="shrink-0 text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                          <Sparkles className="w-2.5 h-2.5 inline me-1" />
                          Free
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowPlaylistMenu(false);
                      onOpenAddModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t.addPlaylist}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md min-w-[200px] order-last sm:order-none">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full ps-9 pe-9 py-1.5 text-xs sm:text-sm bg-slate-900/90 text-slate-100 placeholder-slate-500 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute end-3 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Actions & Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Multi-View Button */}
          <button
            id="multi-view-toggle-btn"
            onClick={onOpenMultiView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition shadow-sm"
            title={t.multiScreen}
          >
            <Grid2X2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.multiScreen}</span>
          </button>

          {/* Add Playlist Modal Trigger */}
          <button
            id="add-playlist-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.addPlaylist}</span>
          </button>

          {/* Language Toggle */}
          <button
            id="lang-toggle-btn"
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition"
            title="تبديل اللغة / Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Settings Modal */}
          <button
            id="settings-modal-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition"
            title={t.settings}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
