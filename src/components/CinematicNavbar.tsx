import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Search, 
  Film, 
  Clapperboard, 
  Radio, 
  Grid2X2, 
  CalendarDays, 
  Plus, 
  Settings, 
  Globe, 
  Sparkles,
  ChevronDown,
  Layers,
  Star,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { PlaylistProfile, MainNavView } from '../types';
import { Language, translations } from '../utils/translations';

interface CinematicNavbarProps {
  lang: Language;
  activeTab: MainNavView;
  onSelectTab: (tab: MainNavView) => void;
  playlists: PlaylistProfile[];
  activePlaylistId: string;
  onSelectPlaylist: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenEpg: () => void;
  onOpenMultiView: () => void;
  onOpenSearch: () => void;
  onToggleLang: () => void;
  isScrolled: boolean;
}

export const CinematicNavbar: React.FC<CinematicNavbarProps> = ({
  lang,
  activeTab,
  onSelectTab,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onOpenAddModal,
  onOpenSettings,
  onOpenEpg,
  onOpenMultiView,
  onOpenSearch,
  onToggleLang,
  isScrolled,
}) => {
  const t = translations[lang];
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const activePlaylist = playlists.find(p => p.id === activePlaylistId) || playlists[0];

  const navLinks: Array<{ id: MainNavView; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: lang === 'ar' ? 'الرئيسية' : 'Home', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'live', label: t.liveTv, icon: <Tv className="w-4 h-4" /> },
    { id: 'movie', label: t.movies, icon: <Film className="w-4 h-4" /> },
    { id: 'series', label: t.series, icon: <Clapperboard className="w-4 h-4" /> },
    { id: 'radio', label: t.radio, icon: <Radio className="w-4 h-4" /> },
    { id: 'favorites', label: t.favorites, icon: <Star className="w-4 h-4" /> },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
        isScrolled
          ? 'bg-black/85 backdrop-blur-2xl border-b border-white/10 shadow-2xl py-3'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6 lg:gap-8 shrink-0">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 group text-start focus:outline-none"
          >
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/50 transition-all duration-300">
              <div className="w-full h-full bg-[#070b19] rounded-[14px] flex items-center justify-center">
                <Tv className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  CINEMA<span className="text-cyan-400">PRO</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-gradient-to-r from-red-600 to-rose-600 text-white uppercase tracking-wider">
                  4K IPTV
                </span>
              </div>
            </div>
          </button>

          {/* Desktop Navigation Links (Apple TV / Netflix Pill Bar) */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1.5 rounded-2xl border border-white/[0.08] backdrop-blur-xl">
            {navLinks.map(link => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onSelectTab(link.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Quick Tools & Playlist Pill */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Global Search Button */}
          <button
            id="navbar-search-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold backdrop-blur-xl transition cursor-pointer group"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'بحث ذكي' : 'Smart Search'}</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-cyan-400 border border-white/10">
              Ctrl K
            </kbd>
          </button>

          {/* Multi-Screen Quick Launch */}
          <button
            onClick={onOpenMultiView}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
            title={t.multiScreen}
          >
            <Grid2X2 className="w-3.5 h-3.5" />
            <span>{t.multiScreen}</span>
          </button>

          {/* EPG Timeline Guide */}
          <button
            onClick={onOpenEpg}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
            title={t.programGuide}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{t.programGuide}</span>
          </button>

          {/* Active Playlist Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08] text-xs font-semibold transition backdrop-blur-xl"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[110px] sm:max-w-[140px] truncate">{activePlaylist?.name || t.playlists}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showPlaylistMenu && (
              <div className="absolute end-0 mt-2 w-64 bg-[#0a0f1d] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
                  <span>{t.playlists}</span>
                  <button
                    onClick={() => {
                      setShowPlaylistMenu(false);
                      onOpenAddModal();
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'إضافة قائمة' : 'Add'}</span>
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto py-1 space-y-1">
                  {playlists.map(pl => (
                    <button
                      key={pl.id}
                      onClick={() => {
                        onSelectPlaylist(pl.id);
                        setShowPlaylistMenu(false);
                      }}
                      className={`w-full text-start p-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                        pl.id === activePlaylistId
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="truncate pe-2">{pl.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-slate-400 font-mono">
                        {pl.channelCount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Source Quick Button */}
          <button
            onClick={onOpenAddModal}
            className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 transition active:scale-95"
            title={t.addPlaylist}
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition"
            title={t.settings}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Language Switch */}
          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-[11px] font-bold transition"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 pt-2.5 mt-2 border-t border-white/5 bg-black/60">
        {navLinks.map(link => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold transition ${
                isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
