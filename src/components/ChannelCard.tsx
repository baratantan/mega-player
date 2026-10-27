import React, { useState } from 'react';
import { 
  Play, 
  Star, 
  Tv, 
  Film, 
  Radio, 
  Sparkles, 
  Clock, 
  Info,
  Calendar,
  Volume2
} from 'lucide-react';
import { PlaylistItem } from '../types';
import { Language, translations } from '../utils/translations';

interface ChannelCardProps {
  channel: PlaylistItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onPlay: (channel: PlaylistItem) => void;
  onOpenDetails?: (channel: PlaylistItem) => void;
  lang: Language;
  layoutMode?: 'grid' | 'list';
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFavorite,
  onToggleFavorite,
  onPlay,
  onOpenDetails,
  lang,
  layoutMode = 'grid',
}) => {
  const t = translations[lang];
  const [imgError, setImgError] = useState(false);

  const currentEpg = channel.epg && channel.epg.length > 0 ? channel.epg[0] : null;

  // Movie or Series poster card
  if (channel.category === 'movie' || channel.category === 'series') {
    return (
      <div 
        tabIndex={0}
        data-tv-focusable="true"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onPlay(channel);
          } else if (e.key === 'i' || e.key === 'I') {
            e.preventDefault();
            onOpenDetails?.(channel);
          } else if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            onToggleFavorite(channel.id);
          }
        }}
        className="tv-focusable group relative bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/40 overflow-hidden flex flex-col justify-between cursor-pointer"
      >
        {/* Poster Image Container */}
        <div className="relative aspect-[16/10] sm:aspect-[3/4] w-full bg-slate-950 overflow-hidden">
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-600 p-4">
              <Film className="w-12 h-12 mb-2 opacity-50 text-cyan-500" />
              <span className="text-xs text-center font-medium text-slate-400 line-clamp-2">
                {channel.name}
              </span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
            {channel.resolution && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30 font-mono">
                {channel.resolution}
              </span>
            )}
            {channel.rating && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/90 text-slate-950 flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-current" />
                {channel.rating}
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

          {/* Hover / Focus Overlay Play Button */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => onPlay(channel)}
              className="w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/40 transform hover:scale-110 transition active:scale-95 cursor-pointer"
              title="Play"
            >
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            </button>
            {onOpenDetails && (
              <button
                onClick={() => onOpenDetails(channel)}
                className="w-10 h-10 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 transition cursor-pointer"
                title="Info"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Info Content */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-1.5 mb-1">
            <h3 
              onClick={() => onPlay(channel)} 
              className="font-bold text-xs sm:text-sm text-slate-200 group-hover:text-cyan-400 group-focus:text-cyan-400 line-clamp-1 cursor-pointer transition"
            >
              {channel.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(channel.id);
              }}
              className="p-1 text-slate-400 hover:text-yellow-400 transition cursor-pointer"
              title={isFavorite ? t.removeFromFav : t.addToFav}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {channel.year && <span>{channel.year}</span>}
            {channel.duration && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-slate-500" />
                {channel.duration}
              </span>
            )}
            {channel.seriesInfo && (
              <span className="text-purple-400 font-semibold">
                S{channel.seriesInfo.season}:E{channel.seriesInfo.episode}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Radio Card
  if (channel.category === 'radio') {
    return (
      <div 
        tabIndex={0}
        data-tv-focusable="true"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onPlay(channel);
          }
        }}
        className="tv-focusable group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-950">
            <Radio className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-slate-200 group-hover:text-emerald-400 group-focus:text-emerald-400 truncate">
              {channel.name}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">{channel.group}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggleFavorite(channel.id)}
            className="p-2 text-slate-400 hover:text-yellow-400 transition cursor-pointer"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-current' : ''}`} />
          </button>
          <button
            onClick={() => onPlay(channel)}
            className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow transition active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          </button>
        </div>
      </div>
    );
  }

  // Live TV Card (Grid or List Layout)
  if (layoutMode === 'list') {
    return (
      <div 
        tabIndex={0}
        data-tv-focusable="true"
        onClick={() => onPlay(channel)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onPlay(channel);
          }
        }}
        className="tv-focusable group cursor-pointer bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 rounded-xl p-2.5 sm:p-3 transition-all flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo / Thumbnail */}
          <div className="relative w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden p-1">
            {channel.logo && !imgError ? (
              <img
                src={channel.logo}
                alt={channel.name}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <Tv className="w-5 h-5 text-slate-500" />
            )}
            <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-slate-900 animate-pulse" />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-200 group-hover:text-cyan-400 group-focus:text-cyan-400 truncate">
                {channel.name}
              </h3>
              {channel.resolution && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-800 text-cyan-400 border border-slate-700 font-mono">
                  {channel.resolution}
                </span>
              )}
            </div>
            {currentEpg && (
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="text-cyan-400/80 font-medium">[{currentEpg.start}]</span>
                <span>{currentEpg.title}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel.id);
            }}
            className="p-2 text-slate-400 hover:text-yellow-400 transition cursor-pointer"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-current' : ''}`} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-cyan-500 group-focus:bg-cyan-500 text-slate-300 group-hover:text-slate-950 group-focus:text-slate-950 flex items-center justify-center transition">
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          </div>
        </div>
      </div>
    );
  }

  // Live TV Default Grid Card
  return (
    <div 
      tabIndex={0}
      data-tv-focusable="true"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onPlay(channel);
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          onToggleFavorite(channel.id);
        }
      }}
      className="tv-focusable group relative bg-slate-900/80 hover:bg-slate-900 rounded-2xl border border-slate-800/90 hover:border-cyan-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/30 overflow-hidden flex flex-col justify-between cursor-pointer"
    >
      {/* Top Banner / Logo Area */}
      <div 
        onClick={() => onPlay(channel)}
        className="cursor-pointer relative h-28 w-full bg-gradient-to-b from-slate-950 to-slate-900 p-3 flex items-center justify-center overflow-hidden"
      >
        {channel.logo && !imgError ? (
          <img
            src={channel.logo}
            alt={channel.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="max-h-20 max-w-[80%] object-contain group-hover:scale-110 group-focus:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <Tv className="w-10 h-10 mb-1 text-slate-600 group-hover:text-cyan-400 group-focus:text-cyan-400 transition" />
            <span className="text-[11px] font-semibold text-slate-400 text-center px-2 truncate">
              {channel.name}
            </span>
          </div>
        )}

        {/* Live Badge */}
        <div className="absolute top-2 start-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {t.liveBadge}
        </div>

        {/* Resolution Pill */}
        {channel.resolution && (
          <div className="absolute top-2 end-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-cyan-400 border border-slate-700 text-[10px] font-extrabold font-mono">
            {channel.resolution}
          </div>
        )}

        {/* TV Focus Indicator Pill */}
        <div className="tv-focus-indicator absolute bottom-2 inset-x-2 flex items-center justify-center pointer-events-none z-30">
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black shadow-lg shadow-cyan-400/50 flex items-center gap-1">
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{lang === 'ar' ? 'تشغيل' : 'Play'}</span>
          </span>
        </div>

        {/* Play Overlay on Hover */}
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/50 transform group-hover:scale-105 transition">
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-col justify-between flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 
              onClick={() => onPlay(channel)}
              className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-cyan-400 group-focus:text-cyan-400 truncate cursor-pointer transition"
              title={channel.name}
            >
              {channel.name}
            </h3>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {channel.group}
            </p>
          </div>
          <button
            onClick={() => onToggleFavorite(channel.id)}
            className="p-1 text-slate-400 hover:text-yellow-400 transition shrink-0 cursor-pointer"
            title={isFavorite ? t.removeFromFav : t.addToFav}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-current' : ''}`} />
          </button>
        </div>

        {/* Mini EPG snippet if available */}
        {currentEpg && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-cyan-400/90 font-medium truncate pe-1 text-[10px]">
                {currentEpg.title}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">
                {currentEpg.start}
              </span>
            </div>
            {currentEpg.progress !== undefined && (
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{ width: `${currentEpg.progress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
