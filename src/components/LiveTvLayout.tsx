import React, { useState, useEffect, useRef, useMemo } from 'react';
import Hls from 'hls.js';
import { 
  Tv, 
  Search, 
  Star, 
  Play, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  ListFilter,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Activity,
  X
} from 'lucide-react';
import { PlaylistItem, PlayerSettings } from '../types';
import { Language, translations } from '../utils/translations';

interface LiveTvLayoutProps {
  channels: PlaylistItem[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onPlayFullscreen: (channel: PlaylistItem) => void;
  onBackToHome: () => void;
  lang: Language;
}

export const LiveTvLayout: React.FC<LiveTvLayoutProps> = ({
  channels,
  favorites,
  onToggleFavorite,
  onPlayFullscreen,
  onBackToHome,
  lang,
}) => {
  const t = translations[lang];

  // Extract distinct groups
  const liveChannels = useMemo(() => {
    return channels.filter(c => c.category === 'live');
  }, [channels]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    liveChannels.forEach(c => {
      if (c.group) set.add(c.group);
    });
    return Array.from(set);
  }, [liveChannels]);

  // States
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [channelSearch, setChannelSearch] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<PlaylistItem>(() => {
    return liveChannels[0] || channels[0];
  });
  const [previewMuted, setPreviewMuted] = useState<boolean>(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(true);

  // Embedded Preview Player
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Filter channels based on group & search
  const filteredChannels = useMemo(() => {
    return liveChannels.filter(c => {
      if (selectedGroup === 'FAVORITES') {
        if (!favorites.includes(c.id)) return false;
      } else if (selectedGroup !== 'ALL' && c.group !== selectedGroup) {
        return false;
      }

      if (channelSearch.trim()) {
        const q = channelSearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q);
      }

      return true;
    });
  }, [liveChannels, selectedGroup, channelSearch, favorites]);

  // Load preview stream when activeChannel changes
  useEffect(() => {
    if (!activeChannel || !previewVideoRef.current) return;
    const video = previewVideoRef.current;
    const streamUrl = activeChannel.url;

    setIsPreviewLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsPreviewLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          // fallback to proxy
          hls.loadSource(`/api/proxy?url=${encodeURIComponent(streamUrl)}`);
        }
      });
    } else {
      video.src = streamUrl;
      video.play().catch(() => {});
      setIsPreviewLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel?.id, activeChannel?.url]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden">
      {/* Top Header Bar with Breadcrumb Navigation */}
      <div className="h-14 px-4 sm:px-6 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            id="live-back-to-home-btn"
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition"
          >
            {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{lang === 'ar' ? 'الرئيسية' : 'Home Hub'}</span>
          </button>

          <span className="text-slate-600">/</span>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-white">
              {t.liveTv}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
              {filteredChannels.length} {t.allChannels}
            </span>
          </div>
        </div>

        {/* Search bar inside header */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5" />
          <input
            type="text"
            value={channelSearch}
            onChange={(e) => setChannelSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full ps-8 pe-3 py-1.5 text-xs bg-slate-900/90 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
          />
          {channelSearch && (
            <button
              onClick={() => setChannelSearch('')}
              className="absolute end-2.5 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3-COLUMN PROFESSIONAL MASTER-DETAIL LAYOUT */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
        {/* COLUMN 1: CATEGORIES & GROUPS (Width: 3 cols on desktop) */}
        <div className="md:col-span-3 lg:col-span-3 bg-slate-950/80 border-b md:border-b-0 md:border-e border-slate-800/80 flex flex-col min-h-0">
          <div className="p-3 bg-slate-950 border-b border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.allCategories}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {groups.length + 2}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* All Channels option */}
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`w-full text-start px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                selectedGroup === 'ALL'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                  : 'text-slate-300 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Tv className="w-4 h-4 shrink-0" />
                <span className="truncate">{t.allCategories}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-950/40">
                {liveChannels.length}
              </span>
            </button>

            {/* Favorites option */}
            <button
              onClick={() => setSelectedGroup('FAVORITES')}
              className={`w-full text-start px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                selectedGroup === 'FAVORITES'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Star className="w-4 h-4 shrink-0 text-yellow-400 fill-current" />
                <span className="truncate">{t.favorites}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-950/40">
                {favorites.length}
              </span>
            </button>

            {/* Custom Groups */}
            {groups.map(group => {
              const groupCount = liveChannels.filter(c => c.group === group).length;
              return (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`w-full text-start px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                    selectedGroup === group
                      ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="truncate pe-2">{group}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {groupCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: CHANNEL LIST (Width: 4 cols on desktop) */}
        <div className="md:col-span-4 lg:col-span-4 bg-slate-900/40 border-b md:border-b-0 md:border-e border-slate-800/80 flex flex-col min-h-0">
          <div className="p-3 bg-slate-950/90 border-b border-slate-800/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 truncate">
              {selectedGroup === 'ALL' ? t.allChannels : selectedGroup}
            </span>
            <span className="text-[11px] text-cyan-400 font-bold">
              {filteredChannels.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredChannels.map(channel => {
              const isActive = activeChannel?.id === channel.id;
              const isFav = favorites.includes(channel.id);
              const currentEpg = channel.epg?.[0];

              return (
                <div
                  key={channel.id}
                  tabIndex={0}
                  data-tv-focusable="true"
                  onClick={() => setActiveChannel(channel)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onPlayFullscreen(channel);
                    } else if (e.key === 'f' || e.key === 'F') {
                      e.preventDefault();
                      onToggleFavorite(channel.id);
                    }
                  }}
                  className={`tv-focusable group p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/50 shadow-md'
                      : 'bg-slate-900/50 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      {channel.logo ? (
                        <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Tv className="w-5 h-5 text-slate-500" />
                      )}
                      <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className={`text-xs font-bold truncate ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {channel.name}
                        </h4>
                        {channel.resolution && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                            {channel.resolution}
                          </span>
                        )}
                      </div>
                      {currentEpg && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {currentEpg.title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(channel.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-yellow-400 transition"
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'text-yellow-400 fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayFullscreen(channel);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 transition"
                      title={t.fullScreen}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredChannels.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                {t.noChannelsFound}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: EMBEDDED LIVE PREVIEW PLAYER & EPG (Width: 5 cols on desktop) */}
        <div className="md:col-span-5 lg:col-span-5 bg-slate-950 p-4 sm:p-5 flex flex-col justify-between min-h-0 overflow-y-auto">
          {activeChannel ? (
            <div className="space-y-4">
              {/* Mini Video Player Stage */}
              <div className="relative aspect-video w-full rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl group">
                <video
                  ref={previewVideoRef}
                  playsInline
                  autoPlay
                  muted={previewMuted}
                  className="w-full h-full object-contain"
                />

                {isPreviewLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                    <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-2" />
                    <span className="text-[11px] text-cyan-300 font-medium">جاري تشغيل المعاينة...</span>
                  </div>
                )}

                {/* Top overlay badge */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600/90 text-white text-[10px] font-black uppercase shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {t.liveBadge}
                  </span>

                  {activeChannel.resolution && (
                    <span className="px-2 py-0.5 rounded-md bg-black/80 text-cyan-400 text-[10px] font-bold border border-slate-700">
                      {activeChannel.resolution}
                    </span>
                  )}
                </div>

                {/* Bottom Video Controls Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewMuted(!previewMuted)}
                    className="p-1.5 rounded-lg bg-slate-900/80 text-slate-200 hover:text-white border border-slate-700 transition"
                  >
                    {previewMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>

                  <button
                    onClick={() => onPlayFullscreen(activeChannel)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'مشاهدة ملء الشاشة' : 'Theater Mode'}</span>
                  </button>
                </div>
              </div>

              {/* Active Channel Details */}
              <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-extrabold text-sm text-white">
                    {activeChannel.name}
                  </h3>
                  <button
                    onClick={() => onToggleFavorite(activeChannel.id)}
                    className="p-1 text-slate-400 hover:text-yellow-400 transition"
                  >
                    <Star className={`w-4 h-4 ${favorites.includes(activeChannel.id) ? 'text-yellow-400 fill-current' : ''}`} />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  {activeChannel.group} • {activeChannel.country || 'Global'}
                </p>
              </div>

              {/* EPG Program Timeline for Active Channel */}
              {activeChannel.epg && activeChannel.epg.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t.programGuide}</span>
                  </div>

                  <div className="space-y-2">
                    {activeChannel.epg.map((prog, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${
                          idx === 0
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-cyan-400">{prog.start} - {prog.end}</span>
                          {idx === 0 && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-red-400 animate-pulse">
                              {t.nowPlaying}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-bold text-slate-200">{prog.title}</h5>
                        {prog.desc && <p className="text-[10px] text-slate-400 mt-0.5">{prog.desc}</p>}
                        {prog.progress !== undefined && (
                          <div className="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prog.progress}%` }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              اختر قناة للبدء
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
