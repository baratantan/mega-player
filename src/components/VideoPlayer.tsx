import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  PictureInPicture, 
  Settings, 
  ListFilter, 
  Tv, 
  Camera, 
  Activity, 
  Clock, 
  SkipBack, 
  SkipForward, 
  X, 
  AlertCircle, 
  RefreshCw, 
  Check,
  Radio,
  Sliders,
  Flame,
  Volume1,
  Gamepad2,
  Star,
  Sparkles,
  History
} from 'lucide-react';
import { PlaylistItem, PlayerSettings } from '../types';
import { Language, translations } from '../utils/translations';
import { useIptv } from '../context/IptvContext';


interface VideoPlayerProps {
  channel: PlaylistItem;
  allChannels: PlaylistItem[];
  onClose: () => void;
  onSelectChannel: (channel: PlaylistItem) => void;
  settings: PlayerSettings;
  onUpdateSettings: (newSettings: Partial<PlayerSettings>) => void;
  lang: Language;
}

interface OsdMessage {
  id: string;
  type: 'volume' | 'mute' | 'seek' | 'play' | 'pause' | 'aspect' | 'channel';
  title: string;
  subtitle?: string;
  value?: number; // e.g. volume 0-100
  icon?: React.ReactNode;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  allChannels,
  onClose,
  onSelectChannel,
  settings,
  onUpdateSettings,
  lang,
}) => {
  const t = translations[lang];
  const { isFavorite, toggleFavorite, saveWatchProgress, getWatchProgress, showToast } = useIptv();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoNodeRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const hasResumedRef = useRef<boolean>(false);
  const lastSaveTimeRef = useRef<number>(0);

  const isFav = isFavorite(channel.id);

  // Core Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(settings.volume);
  const [isMuted, setIsMuted] = useState<boolean>(settings.muted);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [useProxyFallback, setUseProxyFallback] = useState<boolean>(false);

  // Resume notification banner state
  const [resumedFromTime, setResumedFromTime] = useState<number | null>(null);

  // OSD Feedback HUD State
  const [osd, setOsd] = useState<OsdMessage | null>(null);
  const osdTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Advanced Drawers & Modals
  const [showQuickZap, setShowQuickZap] = useState<boolean>(false);
  const [showEpgDrawer, setShowEpgDrawer] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepRemainingSec, setSleepRemainingSec] = useState<number | null>(null);
  const [screenshotToast, setScreenshotToast] = useState<boolean>(false);
  const [showRemoteHelp, setShowRemoteHelp] = useState<boolean>(true);

  // Stream Diagnostics
  const [streamStats, setStreamStats] = useState<{
    resolution: string;
    bitrate: string;
    bufferLength: number;
    playerEngine: string;
    codec: string;
  }>({
    resolution: '1920x1080',
    bitrate: 'Auto (High Quality)',
    bufferLength: 0,
    playerEngine: 'Video.js 8 (HTML5 / HLS)',
    codec: 'H.264 / AAC',
  });

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger OSD Notification (Visual Feedback on TV Screen)
  const showOsdNotice = useCallback((newOsd: OsdMessage) => {
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    setOsd(newOsd);
    setShowControls(true);
    osdTimeoutRef.current = setTimeout(() => {
      setOsd(null);
    }, 1800);
  }, []);

  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showQuickZap && !showEpgDrawer && !showStatsModal && !showSettingsMenu) {
        setShowControls(false);
        setShowRemoteHelp(false);
      }
    }, 3500);
  }, [isPlaying, showQuickZap, showEpgDrawer, showStatsModal, showSettingsMenu]);

  // Request Fullscreen immediately on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      if (containerRef.current && !document.fullscreenElement) {
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          // If browser restricts automatic fullscreen without user click, fallback gracefully
          console.log('Auto-fullscreen notice:', err);
        }
      }
    };

    enterFullscreen();

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Determine media type for Video.js source
  const getSourceConfig = useCallback((url: string, proxy: boolean) => {
    const finalUrl = proxy ? `/api/proxy?url=${encodeURIComponent(url)}` : url;
    const lower = url.toLowerCase();

    if (lower.includes('.m3u8') || lower.includes('/live/') || lower.includes('.hls')) {
      return { src: finalUrl, type: 'application/x-mpegURL' };
    }
    if (lower.endsWith('.mp4')) {
      return { src: finalUrl, type: 'video/mp4' };
    }
    if (lower.endsWith('.webm')) {
      return { src: finalUrl, type: 'video/webm' };
    }
    if (lower.endsWith('.mkv')) {
      return { src: finalUrl, type: 'video/mp4' };
    }
    // Default fallback to HLS for IPTV streams
    return { src: finalUrl, type: 'application/x-mpegURL' };
  }, []);

  // Initialize and update Video.js Player instance
  useEffect(() => {
    if (!videoNodeRef.current) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    // Create video element for Video.js
    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-fluid', 'vjs-theme-cinema');
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('crossorigin', 'anonymous');
    videoNodeRef.current.innerHTML = '';
    videoNodeRef.current.appendChild(videoElement);

    const sourceObj = getSourceConfig(channel.url, useProxyFallback);

    const playerOptions: Record<string, any> = {
      autoplay: true,
      controls: false, // We use custom cinema HUD
      responsive: true,
      fluid: true,
      preload: 'auto',
      sources: [sourceObj],
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          fastQualityChange: true,
          smoothQualityChange: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
    };

    const player = videojs(videoElement, playerOptions, () => {
      playerRef.current = player;
      player.volume(volume);
      player.muted(isMuted);

      player.on('play', () => {
        setIsPlaying(true);
        setIsLoading(false);
      });

      player.on('pause', () => {
        setIsPlaying(false);
      });

      player.on('waiting', () => {
        setIsLoading(true);
      });

      player.on('playing', () => {
        setIsLoading(false);
        setIsPlaying(true);
      });

      player.on('timeupdate', () => {
        const curr = player.currentTime() || 0;
        const dur = player.duration() || 0;
        setCurrentTime(curr);
        setDuration(dur);

        // Update buffer diagnostics
        const bufferedTimeRange = player.buffered();
        if (bufferedTimeRange && bufferedTimeRange.length > 0) {
          const bufEnd = bufferedTimeRange.end(bufferedTimeRange.length - 1);
          setStreamStats(prev => ({
            ...prev,
            bufferLength: Math.max(0, parseFloat((bufEnd - curr).toFixed(1))),
          }));
        }
      });

      player.on('loadedmetadata', () => {
        setIsLoading(false);
        const w = (player as any).videoWidth?.() || 1920;
        const h = (player as any).videoHeight?.() || 1080;
        if (w && h) {
          setStreamStats(prev => ({
            ...prev,
            resolution: `${w}x${h}`,
          }));
        }

        // Resume Playback ("Continue Watching" feature)
        if (!hasResumedRef.current && channel.category !== 'live') {
          hasResumedRef.current = true;
          const saved = getWatchProgress(channel.id);
          const dur = player.duration() || 0;
          if (saved && saved.currentTime > 5 && (dur === 0 || saved.currentTime < dur - 15)) {
            player.currentTime(saved.currentTime);
            setCurrentTime(saved.currentTime);
            setResumedFromTime(saved.currentTime);
            showOsdNotice({
              id: 'resume',
              type: 'channel',
              title: lang === 'ar' ? `استئناف المشاهدة من ${formatTime(saved.currentTime)}` : `Resumed from ${formatTime(saved.currentTime)}`,
              subtitle: channel.name,
              icon: <History className="w-8 h-8 text-cyan-400 animate-pulse" />,
            });
          }
        }
      });

      player.on('timeupdate', () => {
        const curr = player.currentTime() || 0;
        const dur = player.duration() || 0;
        setCurrentTime(curr);
        setDuration(dur);

        // Save playback progress periodically (every 4 seconds)
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 4000 && curr > 2 && dur > 0) {
          lastSaveTimeRef.current = now;
          saveWatchProgress(channel, curr, dur);
        }

        // Update buffer diagnostics
        const bufferedTimeRange = player.buffered();
        if (bufferedTimeRange && bufferedTimeRange.length > 0) {
          const bufEnd = bufferedTimeRange.end(bufferedTimeRange.length - 1);
          setStreamStats(prev => ({
            ...prev,
            bufferLength: Math.max(0, parseFloat((bufEnd - curr).toFixed(1))),
          }));
        }
      });

      player.on('pause', () => {
        setIsPlaying(false);
        const curr = player.currentTime() || 0;
        const dur = player.duration() || 0;
        if (curr > 2 && dur > 0) {
          saveWatchProgress(channel, curr, dur);
        }
      });

      player.on('error', () => {
        const err = player.error();
        console.warn('Video.js Player Error:', err);

        if (!useProxyFallback) {
          console.warn('Attempting CORS proxy fallback...');
          setUseProxyFallback(true);
        } else {
          setHasError(true);
          setErrorMessage(lang === 'ar' ? 'تعذر تشغيل هذا البث، قد يكون السيرفر غير متوفر.' : 'Failed to load stream.');
          setIsLoading(false);
        }
      });
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [channel.id, channel.url, useProxyFallback, getSourceConfig, lang]);

  // Handle Play/Pause
  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;

    if (p.paused()) {
      p.play();
      setIsPlaying(true);
      showOsdNotice({
        id: 'play',
        type: 'play',
        title: lang === 'ar' ? 'تشغيل' : 'Play',
        subtitle: channel.name,
        icon: <Play className="w-8 h-8 fill-current text-cyan-400" />,
      });
    } else {
      p.pause();
      setIsPlaying(false);
      showOsdNotice({
        id: 'pause',
        type: 'pause',
        title: lang === 'ar' ? 'إيقاف مؤقت' : 'Paused',
        subtitle: channel.name,
        icon: <Pause className="w-8 h-8 fill-current text-amber-400" />,
      });
    }
  }, [channel.name, lang, showOsdNotice]);

  // Handle Mute Toggle
  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;

    const nextMuted = !isMuted;
    p.muted(nextMuted);
    setIsMuted(nextMuted);
    onUpdateSettings({ muted: nextMuted });

    showOsdNotice({
      id: 'mute',
      type: 'mute',
      title: nextMuted ? (lang === 'ar' ? 'كتم الصوت' : 'Muted') : (lang === 'ar' ? 'تشغيل الصوت' : 'Unmuted'),
      subtitle: `${Math.round(volume * 100)}%`,
      icon: nextMuted ? (
        <VolumeX className="w-8 h-8 text-red-400" />
      ) : (
        <Volume2 className="w-8 h-8 text-cyan-400" />
      ),
    });
  }, [isMuted, volume, lang, onUpdateSettings, showOsdNotice]);

  // Handle Volume Change
  const changeVolume = useCallback((delta: number) => {
    const p = playerRef.current;
    if (!p) return;

    const currentVol = isMuted ? 0 : volume;
    const nextVol = Math.max(0, Math.min(1, Math.round((currentVol + delta) * 100) / 100));

    p.volume(nextVol);
    if (nextVol > 0 && isMuted) {
      p.muted(false);
      setIsMuted(false);
    }
    setVolume(nextVol);
    onUpdateSettings({ volume: nextVol, muted: nextVol === 0 });

    showOsdNotice({
      id: 'volume',
      type: 'volume',
      title: lang === 'ar' ? 'مستوى الصوت' : 'Volume',
      value: Math.round(nextVol * 100),
      subtitle: `${Math.round(nextVol * 100)}%`,
      icon: nextVol === 0 ? (
        <VolumeX className="w-8 h-8 text-red-400" />
      ) : nextVol < 0.5 ? (
        <Volume1 className="w-8 h-8 text-cyan-400" />
      ) : (
        <Volume2 className="w-8 h-8 text-cyan-400" />
      ),
    });
  }, [volume, isMuted, lang, onUpdateSettings, showOsdNotice]);

  // Handle Seek Forward / Backward (Rewind & Fast-Forward 10s)
  const seekDelta = useCallback((seconds: number) => {
    const p = playerRef.current;
    if (!p) return;

    const curr = p.currentTime() || 0;
    const dur = p.duration() || 0;
    const target = Math.max(0, dur > 0 ? Math.min(dur, curr + seconds) : curr + seconds);

    p.currentTime(target);
    setCurrentTime(target);

    const isForward = seconds > 0;
    showOsdNotice({
      id: 'seek',
      type: 'seek',
      title: isForward
        ? (lang === 'ar' ? `تقديم +${seconds} ثانية` : `Forward +${seconds}s`)
        : (lang === 'ar' ? `تأخير ${seconds} ثانية` : `Rewind ${seconds}s`),
      subtitle: dur > 0 ? `${formatTime(target)} / ${formatTime(dur)}` : formatTime(target),
      icon: isForward ? (
        <RotateCw className="w-8 h-8 text-cyan-400" />
      ) : (
        <RotateCcw className="w-8 h-8 text-amber-400" />
      ),
    });
  }, [lang, showOsdNotice]);

  // Handle Toggle Favorite (Star / KeyF)
  const handleToggleFavorite = useCallback(() => {
    const isAdded = toggleFavorite(channel.id, channel);
    showOsdNotice({
      id: 'fav_' + Date.now(),
      type: 'channel',
      title: isAdded
        ? (lang === 'ar' ? 'تمت الإضافة إلى المفضلة ⭐' : 'Added to Favorites ⭐')
        : (lang === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from Favorites'),
      subtitle: channel.name,
      icon: <Star className={`w-8 h-8 ${isAdded ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />,
    });
  }, [channel, toggleFavorite, lang, showOsdNotice]);

  // Restart playback from beginning
  const handleRestartFromBeginning = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.currentTime(0);
      setCurrentTime(0);
      setResumedFromTime(null);
      showOsdNotice({
        id: 'restart',
        type: 'seek',
        title: lang === 'ar' ? 'البدء من البداية ↺' : 'Restarted from Beginning',
        subtitle: channel.name,
        icon: <RotateCcw className="w-8 h-8 text-cyan-400" />,
      });
    }
  }, [channel.name, lang, showOsdNotice]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        showOsdNotice({
          id: 'fullscreen',
          type: 'aspect',
          title: lang === 'ar' ? 'ملء الشاشة الكامل' : 'Full Screen',
          icon: <Maximize className="w-8 h-8 text-cyan-400" />,
        });
      } catch (err) {
        console.error('Fullscreen request failed:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
        showOsdNotice({
          id: 'windowed',
          type: 'aspect',
          title: lang === 'ar' ? 'الخروج من ملء الشاشة' : 'Exit Full Screen',
          icon: <Minimize className="w-8 h-8 text-slate-300" />,
        });
      } catch (err) {
        console.error('Exit fullscreen failed:', err);
      }
    }
  }, [lang, showOsdNotice]);

  // Handle Picture-in-Picture
  const togglePiP = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    const videoEl = p.el()?.querySelector('video');
    if (!videoEl) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoEl.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  }, []);

  // Channel Zapping (Next / Previous Channel)
  const zapChannel = useCallback((dir: 'next' | 'prev') => {
    const currentIndex = allChannels.findIndex(c => c.id === channel.id);
    if (currentIndex === -1) return;

    let targetIndex = dir === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= allChannels.length) targetIndex = 0;
    if (targetIndex < 0) targetIndex = allChannels.length - 1;

    const nextChan = allChannels[targetIndex];
    onSelectChannel(nextChan);

    showOsdNotice({
      id: 'zap',
      type: 'channel',
      title: nextChan.name,
      subtitle: `${nextChan.group} • ${dir === 'next' ? 'التالي' : 'السابق'}`,
      icon: <Tv className="w-8 h-8 text-cyan-400" />,
    });
  }, [allChannels, channel.id, onSelectChannel, showOsdNotice]);

  // Aspect Ratio Switcher
  const cycleAspectRatio = useCallback(() => {
    const ratios: Array<'16:9' | '4:3' | 'fill' | 'original'> = ['16:9', '4:3', 'fill', 'original'];
    const currIdx = ratios.indexOf(settings.aspectRatio || '16:9');
    const nextRatio = ratios[(currIdx + 1) % ratios.length];
    onUpdateSettings({ aspectRatio: nextRatio });

    showOsdNotice({
      id: 'ratio',
      type: 'aspect',
      title: lang === 'ar' ? 'نسبة أبعاد الشاشة' : 'Aspect Ratio',
      subtitle: nextRatio.toUpperCase(),
      icon: <Sliders className="w-8 h-8 text-cyan-400" />,
    });
  }, [settings.aspectRatio, onUpdateSettings, lang, showOsdNotice]);

  // Comprehensive TV Remote & Keyboard D-Pad Navigation Engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;

      switch (e.code) {
        // Play / Pause Toggle
        case 'Space':
        case 'Enter':
        case 'NumpadEnter':
        case 'MediaPlayPause':
          e.preventDefault();
          togglePlay();
          break;

        // Fast-Forward / Seek +10s
        case 'ArrowRight':
        case 'MediaTrackNext':
        case 'MediaFastForward':
          e.preventDefault();
          seekDelta(10);
          break;

        // Rewind / Seek -10s
        case 'ArrowLeft':
        case 'MediaTrackPrevious':
        case 'MediaRewind':
          e.preventDefault();
          seekDelta(-10);
          break;

        // Volume Up
        case 'ArrowUp':
        case 'AudioVolumeUp':
          e.preventDefault();
          changeVolume(0.05);
          break;

        // Volume Down
        case 'ArrowDown':
        case 'AudioVolumeDown':
          e.preventDefault();
          changeVolume(-0.05);
          break;

        // Mute Toggle
        case 'KeyM':
        case 'AudioVolumeMute':
          e.preventDefault();
          toggleMute();
          break;

        // Favorite Toggle (Star 'F' key)
        case 'KeyF':
          e.preventDefault();
          handleToggleFavorite();
          break;

        // Fullscreen Toggle ('Z' key or Alt+Enter)
        case 'KeyZ':
          e.preventDefault();
          toggleFullscreen();
          break;

        // Channel Next / Prev (Page Up / Page Down or [ ] keys)
        case 'PageUp':
        case 'BracketRight':
          e.preventDefault();
          zapChannel('next');
          break;
        case 'PageDown':
        case 'BracketLeft':
          e.preventDefault();
          zapChannel('prev');
          break;

        // Aspect Ratio
        case 'KeyA':
          e.preventDefault();
          cycleAspectRatio();
          break;

        // Quick Channel List Drawer
        case 'KeyL':
        case 'KeyC':
          e.preventDefault();
          setShowQuickZap(prev => !prev);
          break;

        // EPG Guide Drawer
        case 'KeyG':
        case 'KeyE':
          e.preventDefault();
          if (channel.epg && channel.epg.length > 0) {
            setShowEpgDrawer(prev => !prev);
          }
          break;

        // Diagnostics Info
        case 'KeyI':
          e.preventDefault();
          setShowStatsModal(prev => !prev);
          break;

        // Picture-in-Picture
        case 'KeyP':
          e.preventDefault();
          togglePiP();
          break;

        // Exit / Back
        case 'Escape':
        case 'Backspace':
        case 'BrowserBack':
          e.preventDefault();
          if (showQuickZap) {
            setShowQuickZap(false);
          } else if (showEpgDrawer) {
            setShowEpgDrawer(false);
          } else if (showStatsModal) {
            setShowStatsModal(false);
          } else if (showSettingsMenu) {
            setShowSettingsMenu(false);
          } else if (document.fullscreenElement) {
            document.exitFullscreen?.();
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    seekDelta,
    changeVolume,
    toggleMute,
    handleToggleFavorite,
    toggleFullscreen,
    zapChannel,
    cycleAspectRatio,
    togglePiP,
    showQuickZap,
    showEpgDrawer,
    showStatsModal,
    showSettingsMenu,
    channel.epg,
    onClose,
  ]);

  // Sleep Timer Countdown Loop
  useEffect(() => {
    if (!sleepRemainingSec) return;
    if (sleepRemainingSec <= 0) {
      playerRef.current?.pause();
      setIsPlaying(false);
      setSleepTimerMinutes(null);
      setSleepRemainingSec(null);
      return;
    }

    const interval = setInterval(() => {
      setSleepRemainingSec(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepRemainingSec]);

  // Screenshot capture
  const takeScreenshot = () => {
    const p = playerRef.current;
    if (!p) return;
    const videoEl = p.el()?.querySelector('video');
    if (!videoEl) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 1920;
      canvas.height = videoEl.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.download = `IPTV_Cinema_${channel.name.replace(/\s+/g, '_')}_${Date.now()}.png`;
        link.href = dataUri;
        link.click();

        setScreenshotToast(true);
        setTimeout(() => setScreenshotToast(false), 3000);
      }
    } catch (err) {
      console.warn('Screenshot capture restricted by CORS origin:', err);
      setScreenshotToast(true);
      setTimeout(() => setScreenshotToast(false), 3000);
    }
  };

  // Set Sleep Timer
  const setSleepTimer = (mins: number | null) => {
    setSleepTimerMinutes(mins);
    if (mins) {
      setSleepRemainingSec(mins * 60);
    } else {
      setSleepRemainingSec(null);
    }
    setShowSettingsMenu(false);
  };

  // Format seconds to string
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isLive = channel.category === 'live' || !duration || duration === Infinity || duration === 0;

  // Aspect ratio styling
  const getAspectRatioClass = () => {
    switch (settings.aspectRatio) {
      case '4:3':
        return 'aspect-[4/3] max-w-[80vw] max-h-[100vh] mx-auto';
      case 'fill':
        return 'w-full h-full object-fill [&_video]:object-fill';
      case 'original':
        return 'w-auto h-auto max-w-full max-h-full mx-auto';
      case '16:9':
      default:
        return 'w-full h-full object-contain [&_video]:object-contain';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video.js Native Video Node Wrapper */}
      <div 
        ref={videoNodeRef}
        onClick={togglePlay}
        className={`w-full h-full flex items-center justify-center ${getAspectRatioClass()} [&_.video-js]:w-full [&_.video-js]:h-full [&_.video-js]:bg-black`}
      />

      {/* CENTER OSD (On-Screen Display) FOR REMOTE ACTIONS */}
      <AnimatePresence>
        {osd && (
          <motion.div
            key={osd.id + (osd.value || '') + osd.title}
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10 }}
            transition={{ type: 'spring', damping: 22, stiffness: 350 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
          >
            <div className="flex flex-col items-center gap-3 px-8 py-6 rounded-3xl bg-slate-950/85 backdrop-blur-2xl border border-cyan-500/40 text-white shadow-2xl shadow-cyan-950/80 min-w-[240px] text-center ring-1 ring-white/10">
              {osd.icon}
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">{osd.title}</h3>
                {osd.subtitle && (
                  <p className="text-xs font-mono text-cyan-300 font-semibold">{osd.subtitle}</p>
                )}
              </div>
              {/* Visual Volume Bar in OSD */}
              {osd.type === 'volume' && osd.value !== undefined && (
                <div className="w-36 h-2 bg-slate-800 rounded-full overflow-hidden mt-1 p-0.5 border border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-150"
                    style={{ width: `${osd.value}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[3px] pointer-events-none z-30">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin shadow-xl shadow-cyan-500/30" />
            <Tv className="w-6 h-6 text-cyan-400 absolute animate-pulse" />
          </div>
          <span className="text-xs font-bold text-cyan-200 mt-4 tracking-wide font-mono">
            {lang === 'ar' ? 'جاري الاتصال بالسيرفر...' : 'Connecting to Stream...'}
          </span>
        </div>
      )}

      {/* Error Overlay with Proxy Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center z-40">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-xl shadow-red-950">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{errorMessage}</h3>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            {useProxyFallback
              ? (lang === 'ar' ? 'تمت المحاولة عبر خادم البروكسي الداخلي ولكن السيرفر غير مستجيب حالياً.' : 'Stream unavailable via internal proxy fallback.')
              : (lang === 'ar' ? 'قد يتطلب هذا البث خادم وسيط لتجاوز قيود CORS.' : 'CORS proxy fallback might be required.')}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setHasError(false);
                setUseProxyFallback(!useProxyFallback);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              {t.retry}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Screenshot Captured Toast */}
      {screenshotToast && (
        <div className="absolute top-16 start-1/2 -translate-x-1/2 z-40 bg-emerald-600/95 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-black backdrop-blur-xl border border-emerald-400/40 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          {t.screenshotTaken}
        </div>
      )}

      {/* TOP HEADER HUD */}
      <div
        className={`absolute top-0 inset-x-0 bg-gradient-to-b from-black/95 via-black/60 to-transparent p-4 sm:p-6 transition-all duration-300 flex items-center justify-between gap-4 z-20 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {channel.logo && (
            <img
              src={channel.logo}
              alt={channel.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl bg-slate-900/90 border border-white/15 object-contain p-1 shrink-0 shadow-lg"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-sm sm:text-base text-white truncate">
                {channel.name}
              </h2>
              {isLive ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm shadow-red-600/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {t.liveBadge}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/90 text-slate-950 text-[10px] font-black">
                  VOD 4K
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 truncate mt-0.5">
              {channel.group} {channel.resolution && `• ${channel.resolution}`}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Favorite Toggle Star Button */}
          <button
            id="player-favorite-toggle-btn"
            onClick={handleToggleFavorite}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-black backdrop-blur-xl transition cursor-pointer ${
              isFav
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-white/15'
            }`}
            title={`${isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'} (F)`}
          >
            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isFav ? (lang === 'ar' ? 'مفضل ⭐' : 'Favorited') : (lang === 'ar' ? 'المفضلة (F)' : 'Favorite (F)')}</span>
          </button>

          {/* Sleep Timer */}
          {sleepRemainingSec !== null && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>{Math.floor(sleepRemainingSec / 60)}m {sleepRemainingSec % 60}s</span>
            </div>
          )}

          {/* Quick Zap List Drawer Trigger */}
          <button
            onClick={() => setShowQuickZap(!showQuickZap)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/15 text-xs font-bold backdrop-blur-xl transition cursor-pointer"
            title="Channels (L)"
          >
            <ListFilter className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">{t.allChannels}</span>
          </button>

          {/* EPG Drawer Trigger */}
          {channel.epg && channel.epg.length > 0 && (
            <button
              onClick={() => setShowEpgDrawer(!showEpgDrawer)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/15 text-xs font-bold backdrop-blur-xl transition cursor-pointer"
              title="EPG Guide (G)"
            >
              <Tv className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">{t.programGuide}</span>
            </button>
          )}

          {/* Close Button */}
          <button
            id="close-player-btn"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-red-600 text-slate-300 hover:text-white border border-white/15 transition cursor-pointer"
            title={`${t.close} (Esc)`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RESUME PLAYBACK BANNER (Continue Watching) */}
      <AnimatePresence>
        {resumedFromTime !== null && showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-28 start-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-950/90 border border-cyan-500/40 backdrop-blur-xl shadow-2xl text-white text-xs ring-1 ring-white/10"
          >
            <History className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-white">
                {lang === 'ar' ? 'تم استئناف المشاهدة من حيث توقفت' : 'Resumed from where you left off'}
              </span>
              <span className="text-[11px] font-mono text-cyan-300">
                {formatTime(resumedFromTime)}
              </span>
            </div>
            <button
              onClick={handleRestartFromBeginning}
              className="ms-2 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'البدء من البداية' : 'Start from Beginning'}</span>
            </button>
            <button
              onClick={() => setResumedFromTime(null)}
              className="p-1 text-slate-400 hover:text-white transition"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK ZAP CHANNEL DRAWER */}
      <AnimatePresence>
        {showQuickZap && (
          <motion.div
            initial={{ opacity: 0, x: lang === 'ar' ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: lang === 'ar' ? 30 : -30 }}
            className="absolute top-16 start-4 bottom-24 w-72 sm:w-84 bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-4 z-30 flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <span className="text-xs font-black text-white flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-cyan-400" />
                {t.allChannels} ({allChannels.length})
              </span>
              <button
                onClick={() => setShowQuickZap(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 pe-1">
              {allChannels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => {
                    onSelectChannel(ch);
                    setShowQuickZap(false);
                  }}
                  className={`w-full text-start p-2.5 rounded-2xl text-xs flex items-center justify-between transition cursor-pointer ${
                    ch.id === channel.id
                      ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-200 font-bold border border-cyan-400/50'
                      : 'text-slate-300 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="truncate pe-2">
                    <p className="truncate font-semibold">{ch.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{ch.group}</p>
                  </div>
                  {ch.resolution && (
                    <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                      {ch.resolution}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EPG GUIDE DRAWER */}
      <AnimatePresence>
        {showEpgDrawer && channel.epg && (
          <motion.div
            initial={{ opacity: 0, x: lang === 'ar' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: lang === 'ar' ? -30 : 30 }}
            className="absolute top-16 end-4 bottom-24 w-84 bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-4 z-30 flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-800">
              <span className="text-xs font-black text-emerald-400 flex items-center gap-2">
                <Tv className="w-4 h-4" />
                {t.programGuide}
              </span>
              <button
                onClick={() => setShowEpgDrawer(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pe-1">
              {channel.epg.map((prog, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border ${
                    idx === 0
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-100 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 border border-slate-700">
                      {prog.start} - {prog.end}
                    </span>
                    {idx === 0 && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-red-400 animate-pulse">
                        {t.nowPlaying}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold mb-1">{prog.title}</h4>
                  {prog.desc && <p className="text-[11px] text-slate-400 leading-relaxed">{prog.desc}</p>}
                  {prog.progress !== undefined && (
                    <div className="mt-2.5 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${prog.progress}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STREAM STATS MODAL */}
      <AnimatePresence>
        {showStatsModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-40">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900/95 border border-white/15 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  {t.diagnostics}
                </h3>
                <button onClick={() => setShowStatsModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Stream Engine</span>
                  <span className="text-cyan-300 font-mono font-bold">{streamStats.playerEngine}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Channel Name</span>
                  <span className="text-slate-200 font-semibold truncate max-w-[160px]">{channel.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Resolution</span>
                  <span className="text-cyan-400 font-mono font-bold">{streamStats.resolution}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Buffer Health</span>
                  <span className="text-emerald-400 font-mono font-bold">{streamStats.bufferLength}s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Codecs</span>
                  <span className="text-slate-200 font-mono">{streamStats.codec}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">CORS Proxy</span>
                  <span className={`font-bold ${useProxyFallback ? 'text-amber-400' : 'text-slate-400'}`}>
                    {useProxyFallback ? 'Active (Proxied)' : 'Direct Link'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOTTOM CONTROLS HUD */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-4 sm:p-6 transition-all duration-300 flex flex-col gap-3.5 z-20 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Scrubber Progress Bar for VOD Movies & Series */}
        {!isLive && duration > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-cyan-300 font-bold w-12 text-end">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1 flex items-center h-4 group/bar cursor-pointer">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const target = parseFloat(e.target.value);
                  if (playerRef.current) {
                    playerRef.current.currentTime(target);
                  }
                  setCurrentTime(target);
                }}
                className="w-full h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              />
            </div>
            <span className="text-xs font-mono text-slate-400 w-12">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* Main Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Playback, Zapping & Seek */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Prev Channel Zap */}
            <button
              onClick={() => zapChannel('prev')}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Previous (PageDown)"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/Pause Button */}
            <button
              id="player-play-toggle-btn"
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/30 transform hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next Channel Zap */}
            <button
              onClick={() => zapChannel('next')}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Next (PageUp)"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* 10s Seek Rewind & Fast-Forward */}
            <button
              onClick={() => seekDelta(-10)}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Rewind 10s (←)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => seekDelta(10)}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Forward 10s (→)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume & Mute */}
            <div className="flex items-center gap-2 ms-2">
              <button
                onClick={toggleMute}
                className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Mute (M)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-cyan-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  changeVolume(val - (isMuted ? 0 : volume));
                }}
                className="w-16 sm:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Right: Favorite, Aspect Ratio, Screenshot, PiP, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Favorite Star Button */}
            <button
              onClick={handleToggleFavorite}
              className={`p-2.5 rounded-2xl transition cursor-pointer ${
                isFav
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={`${isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'} (F)`}
            >
              <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {/* Aspect Ratio Switcher */}
            <button
              onClick={cycleAspectRatio}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title={`Aspect Ratio: ${settings.aspectRatio} (A)`}
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Screenshot */}
            <button
              onClick={takeScreenshot}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title={t.screenshot}
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Stream Diagnostics */}
            <button
              onClick={() => setShowStatsModal(true)}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title={`${t.diagnostics} (I)`}
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Quick Settings Dropdown (Sleep Timer) */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title={t.settings}
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettingsMenu && (
                <div className="absolute bottom-full mb-2 end-0 w-56 bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl p-4 z-50 text-xs backdrop-blur-xl">
                  <div className="font-bold text-slate-300 mb-2 pb-1 border-b border-slate-800">
                    {t.sleepTimer}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[15, 30, 60].map(mins => (
                      <button
                        key={mins}
                        onClick={() => setSleepTimer(mins)}
                        className={`px-2 py-1.5 rounded-xl text-center font-bold transition cursor-pointer ${
                          sleepTimerMinutes === mins
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                    {sleepTimerMinutes !== null && (
                      <button
                        onClick={() => setSleepTimer(null)}
                        className="col-span-3 mt-1.5 py-1.5 rounded-xl bg-red-950/60 text-red-300 hover:bg-red-900/60 text-center font-bold"
                      >
                        {t.sleepTimerOff}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Picture-in-Picture */}
            <button
              onClick={togglePiP}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Picture-in-Picture (P)"
            >
              <PictureInPicture className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              id="player-fullscreen-toggle-btn"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title={isFullscreen ? `${t.exitFullScreen} (Z)` : `${t.fullScreen} (Z)`}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-cyan-400" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* TV REMOTE CONTROLS QUICK BAR */}
        {showRemoteHelp && (
          <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 overflow-x-auto scrollbar-none">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-300">Enter / Space</span>
              <span>{lang === 'ar' ? 'تشغيل/إيقاف' : 'Play/Pause'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-300">← →</span>
              <span>{lang === 'ar' ? 'تقديم/تأخير 10ث' : 'Seek 10s'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-300">↑ ↓</span>
              <span>{lang === 'ar' ? 'الصوت' : 'Volume'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-300">M</span>
              <span>{lang === 'ar' ? 'كتم' : 'Mute'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-mono text-[10px] font-bold">F</span>
              <span className="text-amber-300 font-semibold">{lang === 'ar' ? 'المفضلة ⭐' : 'Favorite ⭐'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-300">Z</span>
              <span>{lang === 'ar' ? 'شاشة كاملة' : 'Fullscreen'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-300">Esc</span>
              <span>{lang === 'ar' ? 'خروج' : 'Exit'}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
