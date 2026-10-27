export type MediaCategory = 'live' | 'movie' | 'series' | 'radio';

export type MainNavView = 'home' | 'live' | 'movie' | 'series' | 'radio' | 'favorites' | 'recent' | 'multiview';

export interface EpgProgram {
  title: string;
  start: string; // e.g. "20:00"
  end: string;   // e.g. "21:30"
  desc?: string;
  category?: string;
  progress?: number; // 0 to 100
}

export interface PlaylistItem {
  id: string;
  name: string;
  logo?: string;
  backdrop?: string; // High-res horizontal cinematic backdrop (for Apple TV / Netflix Hero billboard)
  tagline?: string;
  group: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  category: MediaCategory;
  resolution?: string; // '4K' | 'FHD' | 'HD' | 'SD'
  country?: string;
  language?: string;
  synopsis?: string;
  duration?: string;
  year?: number;
  rating?: number;
  genres?: string[];
  seriesInfo?: {
    season: number;
    episode: number;
    totalEpisodes?: number;
  };
  epg?: EpgProgram[];
}

export interface PlaylistProfile {
  id: string;
  name: string;
  type: 'm3u_url' | 'm3u_file' | 'xtream' | 'preset';
  url?: string;
  server?: string;
  username?: string;
  password?: string;
  channelCount: number;
  updatedAt: string;
  channels: PlaylistItem[];
}

export interface PlayerSettings {
  aspectRatio: '16:9' | '4:3' | 'fill' | 'original';
  volume: number;
  muted: boolean;
  autoPlayNext: boolean;
  playbackSpeed: number;
  language: 'ar' | 'en';
  proxyStreams: boolean;
  theme: 'cinematic' | 'midnight' | 'emerald';
  pipSupported: boolean;
}

export interface MultiSlot {
  id: number;
  channel: PlaylistItem | null;
  volume: number;
  muted: boolean;
  isPlaying: boolean;
}

export interface WatchProgress {
  itemId: string;
  item: PlaylistItem;
  currentTime: number; // in seconds
  duration: number; // in seconds
  progressPercent: number; // 0 to 100
  lastWatchedAt: number; // timestamp in ms
  completed: boolean; // true if > 92%
}

export type ViewMode = 'single' | 'multiview-2' | 'multiview-4';

