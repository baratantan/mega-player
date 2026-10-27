import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { PlaylistItem, PlaylistProfile, MediaCategory, WatchProgress } from '../types';
import { iptvService, IptvLoadProgress, PRESET_PLAYLISTS, PresetPlaylist } from '../services/iptvService';
import { storageService } from '../services/storageService';
import { DEFAULT_CHANNELS } from '../data/defaultChannels';

export interface IptvToast {
  id: string;
  title: string;
  subtitle?: string;
  type: 'fav_add' | 'fav_remove' | 'resume' | 'info';
}

interface IptvContextType {
  // Playback & Library Data
  channels: PlaylistItem[];
  liveChannels: PlaylistItem[];
  movieChannels: PlaylistItem[];
  seriesChannels: PlaylistItem[];
  radioChannels: PlaylistItem[];
  featuredBillboardItems: PlaylistItem[];
  categoryGroups: {
    live: string[];
    movie: string[];
    series: string[];
    radio: string[];
  };

  // Profiles & Synchronization
  profiles: PlaylistProfile[];
  activeProfile: PlaylistProfile | null;
  isLoading: boolean;
  loadProgress: IptvLoadProgress | null;
  error: string | null;

  // Import & API Actions
  importM3uUrl: (url: string, playlistName?: string) => Promise<boolean>;
  importM3uFile: (file: File, playlistName?: string) => Promise<boolean>;
  importXtreamCodes: (server: string, user: string, pass: string, playlistName?: string) => Promise<boolean>;
  loadPreset: (preset: PresetPlaylist) => Promise<boolean>;
  switchProfile: (profileId: string) => void;
  deleteProfile: (profileId: string) => void;
  refreshCurrentPlaylist: () => Promise<void>;

  // User Library (Favorites)
  favorites: string[];
  toggleFavorite: (id: string, customItem?: PlaylistItem) => boolean;
  isFavorite: (id: string) => boolean;

  // Continue Watching & Watch Progress (المشاهدات الأخيرة ونقطة التوقف)
  watchProgressList: WatchProgress[];
  watchProgressMap: Record<string, WatchProgress>;
  saveWatchProgress: (item: PlaylistItem, currentTime: number, duration: number) => void;
  getWatchProgress: (itemId: string) => WatchProgress | null;
  deleteWatchProgress: (itemId: string) => void;
  clearAllWatchProgress: () => void;
  recents: PlaylistItem[];
  addToRecents: (item: PlaylistItem) => void;
  clearRecents: () => void;

  // Visual Toasts & Alerts
  toast: IptvToast | null;
  showToast: (title: string, subtitle?: string, type?: IptvToast['type']) => void;
}

const IptvContext = createContext<IptvContextType | null>(null);

export const IptvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Profiles Management
  const [profiles, setProfiles] = useState<PlaylistProfile[]>(() => {
    return iptvService.getStoredProfiles();
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    const storedActiveId = iptvService.getActiveProfileId();
    const initialProfiles = iptvService.getStoredProfiles();
    if (storedActiveId && initialProfiles.some(p => p.id === storedActiveId)) {
      return storedActiveId;
    }
    return initialProfiles[0]?.id || 'default_preset';
  });

  // Active playlist channels
  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || profiles[0] || null;
  }, [profiles, activeProfileId]);

  const channels = useMemo(() => {
    return activeProfile?.channels || DEFAULT_CHANNELS;
  }, [activeProfile]);

  // Loading & Progress State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<IptvLoadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Favorites state synced via storageService
  const [favorites, setFavorites] = useState<string[]>(() => {
    return storageService.getFavorites();
  });

  // Watch Progress list synced via storageService
  const [watchProgressList, setWatchProgressList] = useState<WatchProgress[]>(() => {
    return storageService.getAllWatchProgress();
  });

  // Toast Notification HUD
  const [toast, setToast] = useState<IptvToast | null>(null);
  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((title: string, subtitle?: string, type: IptvToast['type'] = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({
      id: `toast_${Date.now()}`,
      title,
      subtitle,
      type,
    });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  const [recents, setRecents] = useState<PlaylistItem[]>(() => {
    return iptvService.getStoredRecents();
  });

  // Watch Progress Map for O(1) lookups
  const watchProgressMap = useMemo(() => {
    const map: Record<string, WatchProgress> = {};
    watchProgressList.forEach(p => {
      map[p.itemId] = p;
    });
    return map;
  }, [watchProgressList]);

  // Save profiles changes
  useEffect(() => {
    iptvService.saveProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    if (activeProfileId) {
      iptvService.saveActiveProfileId(activeProfileId);
    }
  }, [activeProfileId]);

  useEffect(() => {
    iptvService.saveRecents(recents);
  }, [recents]);

  // Segment channels by category
  const liveChannels = useMemo(() => {
    return channels.filter(c => c.category === 'live');
  }, [channels]);

  const movieChannels = useMemo(() => {
    return channels.filter(c => c.category === 'movie');
  }, [channels]);

  const seriesChannels = useMemo(() => {
    return channels.filter(c => c.category === 'series');
  }, [channels]);

  const radioChannels = useMemo(() => {
    return channels.filter(c => c.category === 'radio');
  }, [channels]);

  // Dynamic Category Groups per section
  const categoryGroups = useMemo(() => {
    const extractGroups = (items: PlaylistItem[]) => {
      const set = new Set<string>();
      items.forEach(item => {
        if (item.group) set.add(item.group);
      });
      return Array.from(set);
    };

    return {
      live: extractGroups(liveChannels),
      movie: extractGroups(movieChannels),
      series: extractGroups(seriesChannels),
      radio: extractGroups(radioChannels),
    };
  }, [liveChannels, movieChannels, seriesChannels, radioChannels]);

  // Featured Billboard Items (Prefer 4K and items with backdrops)
  const featuredBillboardItems = useMemo(() => {
    const withBackdrop = channels.filter(c => c.backdrop || (c.category !== 'live' && c.logo));
    if (withBackdrop.length >= 3) {
      return withBackdrop.slice(0, 8);
    }
    return DEFAULT_CHANNELS.slice(0, 5);
  }, [channels]);

  // Toggle Favorite
  const toggleFavorite = useCallback((id: string, customItem?: PlaylistItem): boolean => {
    const isAdded = storageService.toggleFavorite(id);
    setFavorites(storageService.getFavorites());

    // Find item name for toast
    const targetItem = customItem || channels.find(c => c.id === id) || DEFAULT_CHANNELS.find(c => c.id === id);
    const itemName = targetItem?.name || '';

    if (isAdded) {
      showToast(
        'تمت الإضافة إلى المفضلة ⭐',
        itemName ? `${itemName} محفوظة في قائمة المفضلة` : undefined,
        'fav_add'
      );
    } else {
      showToast(
        'تمت الإزالة من المفضلة',
        itemName ? `تم حذف ${itemName} من المفضلة` : undefined,
        'fav_remove'
      );
    }

    return isAdded;
  }, [channels, showToast]);

  const isFavorite = useCallback((id: string): boolean => {
    return storageService.isFavorite(id);
  }, []);

  // Save watch progress timestamp and update state
  const saveWatchProgress = useCallback((item: PlaylistItem, currentTime: number, duration: number) => {
    if (!item || !item.id) return;
    storageService.saveWatchProgress(item, currentTime, duration);
    setWatchProgressList(storageService.getAllWatchProgress());
  }, []);

  const getWatchProgress = useCallback((itemId: string): WatchProgress | null => {
    return storageService.getWatchProgress(itemId);
  }, []);

  const deleteWatchProgress = useCallback((itemId: string) => {
    storageService.deleteWatchProgress(itemId);
    setWatchProgressList(storageService.getAllWatchProgress());
    showToast('تمت الإزالة من سجل المشاهدة', undefined, 'info');
  }, [showToast]);

  const clearAllWatchProgress = useCallback(() => {
    storageService.clearAllWatchProgress();
    setWatchProgressList([]);
    showToast('تم مسح سجل المشاهدة بالكامل', undefined, 'info');
  }, [showToast]);

  // Add item to recent history
  const addToRecents = useCallback((item: PlaylistItem) => {
    setRecents(prev => {
      const filtered = prev.filter(r => r.id !== item.id);
      return [item, ...filtered].slice(0, 30);
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
  }, []);

  // Switch Active Profile
  const switchProfile = useCallback((profileId: string) => {
    if (profiles.some(p => p.id === profileId)) {
      setActiveProfileId(profileId);
      setError(null);
    }
  }, [profiles]);

  // Delete Profile
  const deleteProfile = useCallback((profileId: string) => {
    setProfiles(prev => {
      const updated = prev.filter(p => p.id !== profileId);
      if (updated.length === 0) {
        // Fallback to default preset
        const defaultProfile: PlaylistProfile = {
          id: 'default_preset',
          name: 'Cinema Pro 4K (الباقة الرئيسية)',
          type: 'preset',
          channelCount: DEFAULT_CHANNELS.length,
          updatedAt: new Date().toISOString(),
          channels: DEFAULT_CHANNELS,
        };
        return [defaultProfile];
      }
      return updated;
    });

    if (activeProfileId === profileId) {
      const remaining = profiles.filter(p => p.id !== profileId);
      if (remaining.length > 0) {
        setActiveProfileId(remaining[0].id);
      }
    }
  }, [activeProfileId, profiles]);

  // Import M3U URL
  const importM3uUrl = useCallback(async (url: string, playlistName?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setLoadProgress({ percent: 10, status: 'جاري بدء استيراد الرابط...' });

    try {
      const { profile } = await iptvService.fetchAndParseM3uUrl(
        url,
        playlistName,
        (progress) => setLoadProgress(progress)
      );

      setProfiles(prev => [profile, ...prev.filter(p => p.id !== profile.id)]);
      setActiveProfileId(profile.id);
      return true;
    } catch (err: any) {
      console.error('importM3uUrl error:', err);
      setError(err?.message || 'تعذر تحميل أو تحليل رابط M3U.');
      return false;
    } finally {
      setIsLoading(false);
      setTimeout(() => setLoadProgress(null), 1200);
    }
  }, []);

  // Import M3U File
  const importM3uFile = useCallback(async (file: File, playlistName?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setLoadProgress({ percent: 10, status: 'جاري قراءة الملف...' });

    try {
      const { profile } = await iptvService.parseM3uFile(
        file,
        playlistName,
        (progress) => setLoadProgress(progress)
      );

      setProfiles(prev => [profile, ...prev.filter(p => p.id !== profile.id)]);
      setActiveProfileId(profile.id);
      return true;
    } catch (err: any) {
      console.error('importM3uFile error:', err);
      setError(err?.message || 'تعذر قراءة أو استيراد ملف M3U.');
      return false;
    } finally {
      setIsLoading(false);
      setTimeout(() => setLoadProgress(null), 1200);
    }
  }, []);

  // Import Xtream Codes API
  const importXtreamCodes = useCallback(async (
    server: string,
    user: string,
    pass: string,
    playlistName?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setLoadProgress({ percent: 10, status: 'جاري الاتصال بسيرفر Xtream...' });

    try {
      const { profile } = await iptvService.connectXtreamCodes(
        server,
        user,
        pass,
        playlistName,
        (progress) => setLoadProgress(progress)
      );

      setProfiles(prev => [profile, ...prev.filter(p => p.id !== profile.id)]);
      setActiveProfileId(profile.id);
      return true;
    } catch (err: any) {
      console.error('importXtreamCodes error:', err);
      setError(err?.message || 'فشل الاتصال بسيرفر Xtream Codes.');
      return false;
    } finally {
      setIsLoading(false);
      setTimeout(() => setLoadProgress(null), 1200);
    }
  }, []);

  // Load Preset
  const loadPreset = useCallback(async (preset: PresetPlaylist): Promise<boolean> => {
    if (preset.url === 'internal://default') {
      const profile: PlaylistProfile = {
        id: 'default_preset',
        name: preset.name,
        type: 'preset',
        channelCount: DEFAULT_CHANNELS.length,
        updatedAt: new Date().toISOString(),
        channels: DEFAULT_CHANNELS,
      };

      setProfiles(prev => [profile, ...prev.filter(p => p.id !== profile.id)]);
      setActiveProfileId(profile.id);
      return true;
    }

    return importM3uUrl(preset.url, preset.name);
  }, [importM3uUrl]);

  // Refresh Current Playlist
  const refreshCurrentPlaylist = useCallback(async () => {
    if (!activeProfile) return;

    if (activeProfile.type === 'm3u_url' && activeProfile.url) {
      await importM3uUrl(activeProfile.url, activeProfile.name);
    } else if (
      activeProfile.type === 'xtream' &&
      activeProfile.server &&
      activeProfile.username &&
      activeProfile.password
    ) {
      await importXtreamCodes(
        activeProfile.server,
        activeProfile.username,
        activeProfile.password,
        activeProfile.name
      );
    }
  }, [activeProfile, importM3uUrl, importXtreamCodes]);

  const contextValue = useMemo(() => ({
    channels,
    liveChannels,
    movieChannels,
    seriesChannels,
    radioChannels,
    featuredBillboardItems,
    categoryGroups,
    profiles,
    activeProfile,
    isLoading,
    loadProgress,
    error,
    importM3uUrl,
    importM3uFile,
    importXtreamCodes,
    loadPreset,
    switchProfile,
    deleteProfile,
    refreshCurrentPlaylist,
    favorites,
    toggleFavorite,
    isFavorite,
    watchProgressList,
    watchProgressMap,
    saveWatchProgress,
    getWatchProgress,
    deleteWatchProgress,
    clearAllWatchProgress,
    recents,
    addToRecents,
    clearRecents,
    toast,
    showToast,
  }), [
    channels,
    liveChannels,
    movieChannels,
    seriesChannels,
    radioChannels,
    featuredBillboardItems,
    categoryGroups,
    profiles,
    activeProfile,
    isLoading,
    loadProgress,
    error,
    importM3uUrl,
    importM3uFile,
    importXtreamCodes,
    loadPreset,
    switchProfile,
    deleteProfile,
    refreshCurrentPlaylist,
    favorites,
    toggleFavorite,
    isFavorite,
    watchProgressList,
    watchProgressMap,
    saveWatchProgress,
    getWatchProgress,
    deleteWatchProgress,
    clearAllWatchProgress,
    recents,
    addToRecents,
    clearRecents,
    toast,
    showToast,
  ]);

  return (
    <IptvContext.Provider value={contextValue}>
      {children}
    </IptvContext.Provider>
  );
};

export const useIptv = (): IptvContextType => {
  const context = useContext(IptvContext);
  if (!context) {
    throw new Error('useIptv must be used within an IptvProvider');
  }
  return context;
};
