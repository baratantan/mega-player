import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Plus, 
  X, 
  Maximize2, 
  Grid2X2, 
  Layout, 
  Sparkles,
  Search
} from 'lucide-react';
import { PlaylistItem, MultiSlot } from '../types';
import { Language, translations } from '../utils/translations';
import { errorLogService } from '../services/errorLogService';

interface MultiScreenViewProps {
  allChannels: PlaylistItem[];
  onClose: () => void;
  lang: Language;
}

export const MultiScreenView: React.FC<MultiScreenViewProps> = ({
  allChannels,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const [screenCount, setScreenCount] = useState<2 | 4>(2);
  const [activeSlotModal, setActiveSlotModal] = useState<number | null>(null);
  const [channelSearch, setChannelSearch] = useState<string>('');

  // Initial slots state
  const [slots, setSlots] = useState<MultiSlot[]>([
    { id: 0, channel: allChannels[0] || null, volume: 1, muted: false, isPlaying: true },
    { id: 1, channel: allChannels[1] || null, volume: 1, muted: true, isPlaying: true },
    { id: 2, channel: allChannels[2] || null, volume: 1, muted: true, isPlaying: true },
    { id: 3, channel: allChannels[3] || null, volume: 1, muted: true, isPlaying: true },
  ]);

  const activeSlots = slots.slice(0, screenCount);

  const handleSelectChannelForSlot = (slotId: number, ch: PlaylistItem) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, channel: ch, isPlaying: true } : s));
    setActiveSlotModal(null);
    setChannelSearch('');
  };

  const handleToggleMuteSlot = (slotId: number) => {
    // When unmuting one slot, mute others for clean audio focus
    setSlots(prev => prev.map(s => {
      if (s.id === slotId) {
        return { ...s, muted: !s.muted };
      }
      // If we just unmuted this slot, mute others
      return s.id === slotId ? s : { ...s, muted: true };
    }));
  };

  const handleRemoveChannelFromSlot = (slotId: number) => {
    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, channel: null } : s));
  };

  // Filter channels for selector modal
  const filteredChannelsForModal = allChannels.filter(c => {
    if (!channelSearch.trim()) return true;
    const q = channelSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 p-4 sm:p-6 overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Grid2X2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">
              {t.multiScreen}
            </h1>
            <p className="text-xs text-slate-400">
              {lang === 'ar' ? 'شاهد مباريات وقنوات متعددة في شاشة واحدة متزامنة' : 'Watch multiple live streams simultaneously'}
            </p>
          </div>
        </div>

        {/* Screen Layout Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setScreenCount(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                screenCount === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>{t.screens2}</span>
            </button>
            <button
              onClick={() => setScreenCount(4)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                screenCount === 4 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid2X2 className="w-3.5 h-3.5" />
              <span>{t.screens4}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div
        className={`flex-1 grid gap-3 mt-4 min-h-[450px] ${
          screenCount === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {activeSlots.map(slot => (
          <MultiSlotPlayer
            key={slot.id}
            slot={slot}
            onOpenSelectModal={() => setActiveSlotModal(slot.id)}
            onToggleMute={() => handleToggleMuteSlot(slot.id)}
            onRemoveChannel={() => handleRemoveChannelFromSlot(slot.id)}
            lang={lang}
          />
        ))}
      </div>

      {/* Channel Select Modal for Slot */}
      {activeSlotModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tv className="w-4 h-4 text-cyan-400" />
                {t.slotSelectChannel} #{activeSlotModal + 1}
              </h3>
              <button
                onClick={() => setActiveSlotModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                <input
                  type="text"
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full ps-9 pe-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredChannelsForModal.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChannelForSlot(activeSlotModal, ch)}
                  className="w-full p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 text-start flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {ch.logo ? (
                      <img src={ch.logo} alt="" className="w-8 h-8 rounded object-contain bg-slate-900 p-0.5" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-slate-500">
                        <Tv className="w-4 h-4" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="font-bold text-xs text-slate-200 truncate">{ch.name}</p>
                      <p className="text-[10px] text-slate-400">{ch.group}</p>
                    </div>
                  </div>
                  {ch.resolution && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-700">
                      {ch.resolution}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Single Slot Player Component
interface MultiSlotPlayerProps {
  slot: MultiSlot;
  onOpenSelectModal: () => void;
  onToggleMute: () => void;
  onRemoveChannel: () => void;
  lang: Language;
}

const MultiSlotPlayer: React.FC<MultiSlotPlayerProps> = ({
  slot,
  onOpenSelectModal,
  onToggleMute,
  onRemoveChannel,
  lang,
}) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isSlotLoading, setIsSlotLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!slot.channel || !videoRef.current) return;
    const video = videoRef.current;
    const streamUrl = slot.channel.url;

    setIsSlotLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsSlotLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          errorLogService.logPlayerError({
            channelName: slot.channel?.name,
            channelUrl: streamUrl,
            errorCode: data.details || 'HLS_FATAL_ERROR',
            message: `HLS Multi-View Playback Error: ${data.type}`,
            details: `Fatal: ${data.fatal} | Attempting proxy fallback`,
          });
          // try with proxy
          hls.loadSource(`/api/proxy?url=${encodeURIComponent(streamUrl)}`);
        }
      });
    } else {
      video.src = streamUrl;
      video.onerror = () => {
        errorLogService.logPlayerError({
          channelName: slot.channel?.name,
          channelUrl: streamUrl,
          errorCode: video.error?.code ? `MEDIA_ERR_${video.error.code}` : 'HTML5_VIDEO_ERROR',
          message: 'Native video element error in multi-view slot',
          details: `Source: ${streamUrl}`,
        });
      };
      video.play().catch(() => {});
      setIsSlotLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [slot.channel?.id, slot.channel?.url]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = slot.muted;
    }
  }, [slot.muted]);

  if (!slot.channel) {
    return (
      <div 
        onClick={onOpenSelectModal}
        className="group relative bg-slate-900/50 hover:bg-slate-900/80 border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer transition"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center mb-3 shadow transition">
          <Plus className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold text-slate-300 group-hover:text-indigo-300">
          {t.slotSelectChannel} #{slot.id + 1}
        </p>
      </div>
    );
  }

  return (
    <div className="group/slot relative bg-black rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted={slot.muted}
        className="w-full h-full object-contain"
      />

      {isSlotLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Slot Header overlay */}
      <div className="absolute top-2 inset-x-2 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl opacity-0 group-hover/slot:opacity-100 transition">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-white truncate max-w-[140px]">
            {slot.channel.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Audio focus toggle */}
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              !slot.muted ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title={slot.muted ? t.soundOn : t.soundOff}
          >
            {slot.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Change Channel */}
          <button
            onClick={onOpenSelectModal}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            title={t.changeChannel}
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          {/* Remove */}
          <button
            onClick={onRemoveChannel}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white text-xs transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
