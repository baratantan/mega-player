import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Film, 
  Clapperboard, 
  Radio, 
  CalendarDays, 
  Grid2X2, 
  Star, 
  History, 
  Layers, 
  Plus, 
  Settings, 
  Globe, 
  Play, 
  Search,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import { PlaylistItem, PlaylistProfile } from '../types';
import { Language, translations } from '../utils/translations';
import { MainTab } from './Sidebar';

interface DashboardHomeProps {
  lang: Language;
  activePlaylist: PlaylistProfile;
  playlists: PlaylistProfile[];
  counts: {
    live: number;
    movie: number;
    series: number;
    radio: number;
    favorites: number;
    recent: number;
  };
  recentChannels: PlaylistItem[];
  favoriteChannels: PlaylistItem[];
  featuredLiveChannels: PlaylistItem[];
  onNavigateTab: (tab: MainTab) => void;
  onPlayChannel: (channel: PlaylistItem) => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenEpg: () => void;
  onOpenMultiView: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  lang,
  activePlaylist,
  playlists,
  counts,
  recentChannels,
  favoriteChannels,
  featuredLiveChannels,
  onNavigateTab,
  onPlayChannel,
  onOpenAddModal,
  onOpenSettings,
  onOpenEpg,
  onOpenMultiView,
}) => {
  const t = translations[lang];

  // Digital clock for top bar
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
        {/* Top Information Hub & Account Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <Tv className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  {t.appTitle}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {lang === 'ar' ? 'حساب نشط' : 'Active VIP'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {activePlaylist?.name || t.playlists} • <span className="text-cyan-400">{activePlaylist?.channelCount || 0}</span> {t.allChannels}
              </p>
            </div>
          </div>

          {/* Digital Clock & Date */}
          <div className="flex items-center gap-6">
            <div className="text-end hidden sm:block">
              <div className="text-lg font-black font-mono tracking-wider text-white">
                {timeStr}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                {dateStr}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenEpg}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">{t.programGuide}</span>
              </button>

              <button
                onClick={onOpenMultiView}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
              >
                <Grid2X2 className="w-4 h-4" />
                <span className="hidden md:inline">{t.multiScreen}</span>
              </button>

              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* PRIMARY BENTO TILES (IPTV Smarters / Apple TV Style Navigation Hub) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* TILE 1: LIVE TV (بث مباشر) */}
          <div
            id="hub-tile-live"
            onClick={() => onNavigateTab('live')}
            className="group relative h-48 sm:h-52 rounded-3xl bg-gradient-to-br from-cyan-950/60 via-slate-900/90 to-slate-950 border border-cyan-500/30 hover:border-cyan-400 p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-950/50 flex flex-col justify-between"
          >
            {/* Ambient Background Glow & Watermark */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
            <Tv className="absolute -bottom-3 -right-3 w-28 h-28 text-cyan-500/5 group-hover:text-cyan-500/10 transition-all pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Tv className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[11px] font-black uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {t.liveBadge}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
                {t.liveTv}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{counts.live} {t.allChannels}</span>
                <span className="text-cyan-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  {lang === 'ar' ? 'دخول' : 'Open'} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </p>
            </div>
          </div>

          {/* TILE 2: MOVIES (أفلام ومسرحيات VOD) */}
          <div
            id="hub-tile-movie"
            onClick={() => onNavigateTab('movie')}
            className="group relative h-48 sm:h-52 rounded-3xl bg-gradient-to-br from-amber-950/50 via-slate-900/90 to-slate-950 border border-amber-500/30 hover:border-amber-400 p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-950/50 flex flex-col justify-between"
          >
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
            <Film className="absolute -bottom-3 -right-3 w-28 h-28 text-amber-500/5 group-hover:text-amber-500/10 transition-all pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Film className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                4K / FHD
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                {t.movies}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{counts.movie} {lang === 'ar' ? 'فيلم وعمل سينمائي' : 'Movies'}</span>
                <span className="text-amber-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  {lang === 'ar' ? 'دخول' : 'Open'} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </p>
            </div>
          </div>

          {/* TILE 3: SERIES (مسلسلات وحلقات) */}
          <div
            id="hub-tile-series"
            onClick={() => onNavigateTab('series')}
            className="group relative h-48 sm:h-52 rounded-3xl bg-gradient-to-br from-purple-950/50 via-slate-900/90 to-slate-950 border border-purple-500/30 hover:border-purple-400 p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-950/50 flex flex-col justify-between"
          >
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
            <Clapperboard className="absolute -bottom-3 -right-3 w-28 h-28 text-purple-500/5 group-hover:text-purple-500/10 transition-all pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Clapperboard className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-bold">
                Series
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-purple-300 transition-colors">
                {t.series}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{counts.series} {lang === 'ar' ? 'مسلسل وموسم' : 'Series'}</span>
                <span className="text-purple-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  {lang === 'ar' ? 'دخول' : 'Open'} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </p>
            </div>
          </div>

          {/* TILE 4: MULTI-VIEW & EPG (العرض المتعدد ودليل البرامج) */}
          <div
            id="hub-tile-multiview"
            onClick={onOpenMultiView}
            className="group relative h-48 sm:h-52 rounded-3xl bg-gradient-to-br from-indigo-950/50 via-slate-900/90 to-slate-950 border border-indigo-500/30 hover:border-indigo-400 p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-950/50 flex flex-col justify-between"
          >
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
            <Grid2X2 className="absolute -bottom-3 -right-3 w-28 h-28 text-indigo-500/5 group-hover:text-indigo-500/10 transition-all pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Grid2X2 className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold">
                Quad View
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-indigo-300 transition-colors">
                {t.multiScreen}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{lang === 'ar' ? '2 إلى 4 شاشات متزامنة' : '2-4 Multi Streams'}</span>
                <span className="text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  {lang === 'ar' ? 'تشغيل' : 'Launch'} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* QUICK ACCESS STRIPS: RECENTLY WATCHED (شاهدت مؤخراً) */}
        {recentChannels.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <span>{t.recent}</span>
              </h3>
              <button
                onClick={() => onNavigateTab('recent')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                {lang === 'ar' ? 'عرض الكل' : 'View All'} ({recentChannels.length})
              </button>
            </div>

            {/* Horizontal Scroll Rail */}
            <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-thin">
              {recentChannels.slice(0, 8).map(channel => (
                <div
                  key={channel.id}
                  onClick={() => onPlayChannel(channel)}
                  className="group shrink-0 w-52 sm:w-56 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center gap-3 shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shrink-0 overflow-hidden relative">
                    {channel.logo ? (
                      <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Tv className="w-5 h-5 text-slate-500" />
                    )}
                    <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 truncate">
                      {channel.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {channel.group}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-cyan-500 text-slate-300 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition">
                    <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FEATURED LIVE CHANNELS RAIL (القنوات المميزة المقترحة) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'ar' ? 'قنوات مقترحة سريعة التشغيل' : 'Featured Live Channels'}</span>
            </h3>
            <button
              onClick={() => onNavigateTab('live')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              {lang === 'ar' ? 'تصفح كل القنوات' : 'Browse Live TV'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {featuredLiveChannels.slice(0, 6).map(channel => (
              <div
                key={channel.id}
                onClick={() => onPlayChannel(channel)}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-3 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2.5 shadow-md hover:shadow-xl hover:shadow-cyan-950/30"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 overflow-hidden group-hover:scale-105 transition-transform">
                  {channel.logo ? (
                    <img src={channel.logo} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Tv className="w-7 h-7 text-slate-500" />
                  )}
                </div>
                <div className="w-full">
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 truncate">
                    {channel.name}
                  </h4>
                  <span className="text-[10px] font-medium text-slate-400 block truncate mt-0.5">
                    {channel.group}
                  </span>
                </div>
                <div className="w-full pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="text-cyan-400 font-bold">{channel.resolution || 'HD'}</span>
                  <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM METRICS & SYSTEM STATUS BAR */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>IPTV Engine v2.5 Core</span>
            </span>
            <span>•</span>
            <span>HLS & Xtream Codes Active</span>
            <span>•</span>
            <span>{counts.radio} {t.radio}</span>
            <span>•</span>
            <span>{counts.favorites} {t.favorites}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addPlaylist}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
