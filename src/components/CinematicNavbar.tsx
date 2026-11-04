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
  Baby,
  Bug,
  AlertTriangle,
  Smartphone,
  Crown
} from 'lucide-react';
import { PlaylistProfile, MainNavView } from '../types';
import { Language, translations } from '../utils/translations';
import { useIptv } from '../context/IptvContext';
import { errorLogService } from '../services/errorLogService';

interface CinematicNavbarProps {
  lang: Language;
  activeTab: MainNavView;
  onSelectTab: (tab: MainNavView) => void;
  playlists: PlaylistProfile[];
  activePlaylistId: string;
  onSelectPlaylist: (id: string) => void;
  onOpenAddModal: (tab?: 'url' | 'file' | 'xtream' | 'preset') => void;
  onOpenSettings: () => void;
  onOpenErrorModal: () => void;
  onOpenEpg: () => void;
  onOpenMultiView: () => void;
  onOpenSearch: () => void;
  onToggleLang: () => void;
  isScrolled: boolean;
  onOpenAndroidInstall?: () => void;
  onOpenLicenseModal?: () => void;
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
  onOpenErrorModal,
  onOpenEpg,
  onOpenMultiView,
  onOpenSearch,
  onToggleLang,
  isScrolled,
  onOpenAndroidInstall,
  onOpenLicenseModal,
}) => {
  const t = translations[lang];
  const { isKidsMode } = useIptv();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [errorCount, setErrorCount] = useState<number>(() => errorLogService.getCount());

  // Listen for real-time error log updates
  useEffect(() => {
    const unsub = errorLogService.subscribe(() => {
      setErrorCount(errorLogService.getCount());
    });
    return unsub;
  }, []);

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
    <>
      {/* Top Header */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-black/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl py-2 sm:py-3'
            : 'bg-gradient-to-b from-black/95 via-black/60 to-transparent py-2.5 sm:py-4'
        }`}
      >
        <div className="max-w-[1700px] mx-auto px-2 sm:px-6 lg:px-12 flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 sm:gap-6 lg:gap-8 shrink-0">
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-2 sm:gap-3 group text-start focus:outline-none"
            >
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/50 transition-all duration-300 shrink-0">
                <div className="w-full h-full bg-[#070b19] rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                  <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-sm sm:text-lg font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  CINEMA<span className="text-cyan-400">PRO</span>
                </span>
                <span className="hidden xs:inline-block px-1 sm:px-1.5 py-0.2 text-[8px] sm:text-[9px] font-black rounded bg-gradient-to-r from-red-600 to-rose-600 text-white uppercase tracking-wider">
                  4K
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
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
                    {link.icon}
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Quick Tools & Actions */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            
            {/* Global Search Button */}
            <button
              id="navbar-search-btn"
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold backdrop-blur-xl transition cursor-pointer group shrink-0"
              title={lang === 'ar' ? 'بحث ذكي' : 'Smart Search'}
            >
              <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="hidden lg:inline">{lang === 'ar' ? 'بحث ذكي' : 'Smart Search'}</span>
              <kbd className="hidden xl:inline-block px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-cyan-400 border border-white/10">
                Ctrl K
              </kbd>
            </button>

            {/* Multi-Screen Quick Launch (Large screens only) */}
            <button
              onClick={onOpenMultiView}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition shrink-0"
              title={t.multiScreen}
            >
              <Grid2X2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{t.multiScreen}</span>
            </button>

            {/* EPG Timeline Guide (Large screens only) */}
            <button
              onClick={onOpenEpg}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition shrink-0"
              title={t.programGuide}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{t.programGuide}</span>
            </button>

            {/* Active Playlist Selector Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08] text-xs font-semibold transition backdrop-blur-xl"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="max-w-[70px] sm:max-w-[120px] truncate text-[11px] sm:text-xs">
                  {activePlaylist?.name || t.playlists}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
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

            {/* Kids Mode Active Indicator */}
            {isKidsMode && (
              <button
                onClick={onOpenSettings}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition animate-pulse cursor-pointer shadow-md shadow-purple-950/40 shrink-0"
                title={lang === 'ar' ? 'وضع الأطفال مُفعّل' : 'Kids Mode Active'}
              >
                <Baby className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden md:inline">{lang === 'ar' ? 'أطفال' : 'Kids'}</span>
              </button>
            )}

            {/* Prominent Add Source / M3U / Xtream Button */}
            <button
              onClick={() => onOpenAddModal('url')}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition active:scale-95 shrink-0 cursor-pointer"
              title={lang === 'ar' ? 'إضافة اشتراك (M3U / ملف / Xtream / باقات مجانية)' : 'Add Playlist (M3U / File / Xtream / Free)'}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{lang === 'ar' ? '+ إضافة اشتراك / M3U' : '+ Add Playlist'}</span>
              <span className="sm:hidden text-[11px] font-black">{lang === 'ar' ? '+ M3U' : '+ Add'}</span>
            </button>

            {/* DEDICATED ERROR LOGS & AUTO-FIX BUTTON (زر سجل وتشخيص وإصلاح الأخطاء) */}
            <button
              onClick={onOpenErrorModal}
              className={`relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                errorCount > 0
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 animate-pulse'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08]'
              }`}
              title={lang === 'ar' ? 'سجل وتشخيص وإصلاح الأخطاء' : 'Error Logs & Auto-Repair'}
            >
              <Bug className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${errorCount > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">
                {lang === 'ar' ? 'الأخطاء والإصلاح' : 'Fix & Errors'}
              </span>
              {errorCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] bg-rose-600 text-white font-mono font-black">
                  {errorCount}
                </span>
              )}
            </button>

            {/* ANDROID APP INSTALL BUTTON (تثبيت تطبيق أندرويد حقيقي) */}
            {onOpenAndroidInstall && (
              <button
                onClick={onOpenAndroidInstall}
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition shrink-0 cursor-pointer shadow-sm hover:shadow-emerald-500/20"
                title={lang === 'ar' ? 'تثبيت تطبيق أندرويد الحقيقي (بدون متصفح)' : 'Install Real Android App'}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">
                  {lang === 'ar' ? 'تطبيق أندرويد' : 'Android App'}
                </span>
                <span className="sm:hidden text-[10px]">
                  {lang === 'ar' ? 'أندرويد' : 'App'}
                </span>
              </button>
            )}

            {/* VIP PLAYER LICENSE BUTTON (ترقية وشراء ترخيص التطبيق) */}
            {onOpenLicenseModal && (
              <button
                onClick={onOpenLicenseModal}
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/40 text-xs font-black transition shrink-0 cursor-pointer shadow-sm hover:shadow-amber-500/20"
                title={lang === 'ar' ? 'ترخيص وتفعيل نسخة المشغل VIP' : 'VIP Player License'}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">
                  {lang === 'ar' ? 'ترخيص VIP' : 'VIP License'}
                </span>
                <span className="sm:hidden text-[10px]">
                  VIP
                </span>
              </button>
            )}

            {/* SETTINGS BUTTON (دائماً ظاهر وواضح) */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition shrink-0 cursor-pointer"
              title={t.settings}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Language Switch */}
            <button
              onClick={onToggleLang}
              className="px-2 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-[11px] font-bold transition shrink-0"
              title={lang === 'ar' ? 'English' : 'العربية'}
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (شريط تنقل سفلي متناسق وخفيف للهواتف بخمس خانات واضحة) */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#070b19]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb"
      >
        {/* 1. Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex-1 py-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'home' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'home' ? 'bg-cyan-500/20 text-cyan-400' : ''}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <span>{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
        </button>

        {/* 2. Live TV */}
        <button
          onClick={() => onSelectTab('live')}
          className={`flex-1 py-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'live' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'live' ? 'bg-cyan-500/20 text-cyan-400' : ''}`}>
            <Tv className="w-4 h-4" />
          </div>
          <span>{t.liveTv}</span>
        </button>

        {/* 3. Movies & Series */}
        <button
          onClick={() => onSelectTab('movie')}
          className={`flex-1 py-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'movie' || activeTab === 'series' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'movie' || activeTab === 'series' ? 'bg-cyan-500/20 text-cyan-400' : ''}`}>
            <Film className="w-4 h-4" />
          </div>
          <span>{t.movies}</span>
        </button>

        {/* 4. Favorites */}
        <button
          onClick={() => onSelectTab('favorites')}
          className={`flex-1 py-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition cursor-pointer ${
            activeTab === 'favorites' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-xl ${activeTab === 'favorites' ? 'bg-cyan-500/20 text-cyan-400' : ''}`}>
            <Star className="w-4 h-4" />
          </div>
          <span>{t.favorites}</span>
        </button>

        {/* 5. Settings & Subscriptions */}
        <button
          onClick={onOpenSettings}
          className="flex-1 py-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white transition cursor-pointer"
        >
          <div className="relative p-1.5 rounded-xl">
            <Settings className="w-4 h-4" />
            {errorCount > 0 && (
              <span className="absolute top-0 end-0 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </div>
          <span>{t.settings}</span>
        </button>
      </nav>
    </>
  );
};
