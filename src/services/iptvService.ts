import { PlaylistItem, PlaylistProfile, MediaCategory, EpgProgram } from '../types';
import { generateMockEpg, parseM3U } from '../utils/m3uParser';
import { DEFAULT_CHANNELS } from '../data/defaultChannels';
import { xtreamService, XtreamAuthResponse, XtreamFetchProgress, parseXtreamUrl } from './xtreamService';
import { dbService } from './dbService';
export type { XtreamAuthResponse };
export { parseXtreamUrl };

export interface IptvLoadProgress {
  percent: number;
  status: string;
  totalItems?: number;
  liveCount?: number;
  vodCount?: number;
  seriesCount?: number;
}

export interface PresetPlaylist {
  id: string;
  name: string;
  description: string;
  url: string;
  badge: string;
  channelCountEstimate: string;
  icon: string;
}

export const PRESET_PLAYLISTS: PresetPlaylist[] = [
  {
    id: 'preset_curated_cinema',
    name: 'Cinema Pro 4K & Global Live (مدمج سينمائي مجاني)',
    description: 'باقة سينمائية حصرية فائقة الدقة 4K مع أفلام، مسلسلات، وقنوات إخبارية ووثائقية مباشرة جاهزة للتشغيل.',
    url: 'internal://default',
    badge: '4K Ultra HD',
    channelCountEstimate: `${DEFAULT_CHANNELS.length}+ قنوات وأفلام`,
    icon: 'Sparkles',
  },
  {
    id: 'preset_quran_islamic',
    name: 'القنوات العربية والإسلامية المباشرة (مجاني)',
    description: 'باقة القنوات الفضائية العربية وإذاعات القرآن الكريم المباشرة وتلاوات كبار القراء على مدار الساعة.',
    url: 'https://iptv-org.github.io/iptv/languages/ara.m3u',
    badge: 'Arabic & Islamic Live',
    channelCountEstimate: '180+ قناة وإذاعة عربية',
    icon: 'Radio',
  },
  {
    id: 'preset_iptv_org_worldwide',
    name: 'IPTV-Org International Channels (قنوات عالمية حرة)',
    description: 'آلاف القنوات التلفزيونية العامة والمفتوحة من مختلف دول العالم مصنفة حسب اللغة والنوع.',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    badge: 'Global IPTV',
    channelCountEstimate: '5,000+ قنوات',
    icon: 'Tv',
  },
  {
    id: 'preset_news_global',
    name: 'Global News & Live Feeds (أخبار العالم المباشرة)',
    description: 'بث حي ومباشر لأبرز القنوات الإخبارية العالمية (الجزيرة، BBC، DW، France24، Bloomberg، Sky News).',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    badge: 'Live News',
    channelCountEstimate: '300+ قنوات إخبارية',
    icon: 'Radio',
  },
  {
    id: 'preset_sports_global',
    name: 'Sports & Extreme Action (رياضة وسباقات)',
    description: 'قنوات الرياضات الحرة، سباقات السيارات، الرياضات الشتوية، والرياضات المائية.',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    badge: 'Sports',
    channelCountEstimate: '150+ قنوات رياضية',
    icon: 'Flame',
  },
  {
    id: 'preset_documentary_nature',
    name: 'Documentaries & Science (وثائقيات وفضاء)',
    description: 'قنوات الطبيعة، العلوم، الفضاء، والتاريخ (NASA TV, Nature Docs, Science TV).',
    url: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
    badge: 'Documentary',
    channelCountEstimate: '120+ قنوات وثائقية',
    icon: 'Camera',
  },
  {
    id: 'preset_animation_family',
    name: 'Animation & Family Movies (أنيميشن وعائلة)',
    description: 'أفلام ورسوم متحركة مفتوحة المصدر وعروض عائلية بدقة عالية.',
    url: 'https://iptv-org.github.io/iptv/categories/animation.m3u',
    badge: 'Kids & Family',
    channelCountEstimate: '90+ قنوات كرتون',
    icon: 'Film',
  },
];

const STORAGE_KEY_PROFILES = 'iptv_player_profiles_v2';
const STORAGE_KEY_ACTIVE_PROFILE_ID = 'iptv_player_active_profile_id_v2';
const STORAGE_KEY_FAVORITES = 'iptv_player_favorites_v2';
const STORAGE_KEY_RECENTS = 'iptv_player_recents_v2';

class IptvService {
  /**
   * Fetches remote M3U/M3U8 file with CORS proxy fallback and parses it
   */
  async fetchAndParseM3uUrl(
    url: string,
    playlistName?: string,
    onProgress?: (progress: IptvLoadProgress) => void
  ): Promise<{ profile: PlaylistProfile; items: PlaylistItem[] }> {
    onProgress?.({ percent: 15, status: 'جاري الاتصال بخادم الرابط المباشر...' });

    let textContent = '';
    const cleanUrl = url.trim();

    // 1. Try local server CORS proxy first
    try {
      onProgress?.({ percent: 35, status: 'جاري تنزيل قائمة M3U عبر الخادم الآمن...' });
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(cleanUrl)}`;
      const response = await fetch(proxyUrl);

      if (response.ok) {
        textContent = await response.text();
      } else {
        throw new Error(`Proxy status: ${response.status}`);
      }
    } catch (proxyErr) {
      console.warn('Backend proxy fetch failed, attempting direct fetch:', proxyErr);
      onProgress?.({ percent: 50, status: 'محاولة التحميل المباشر من السيرفر...' });

      try {
        const directResp = await fetch(cleanUrl);
        if (!directResp.ok) throw new Error(`Direct fetch failed: ${directResp.status}`);
        textContent = await directResp.text();
      } catch (directErr: any) {
        throw new Error(`فشل الاتصال برابط القائمة: ${directErr?.message || 'تأكد من صحة الرابط وسيرفر البث.'}`);
      }
    }

    if (!textContent || textContent.length < 10) {
      throw new Error('الرابط لم يرجع محتوى M3U صالح أو الملف فارغ.');
    }

    onProgress?.({ percent: 70, status: 'جاري فك تشفير وتصنيف القنوات والأفلام...' });

    const items = this.parseM3uTextWithDetails(textContent, playlistName || 'M3U Playlist');

    if (items.length === 0) {
      throw new Error('لم يتم العثور على أي وسائط أو قنوات صالحة داخل ملف M3U.');
    }

    const liveCount = items.filter(i => i.category === 'live').length;
    const vodCount = items.filter(i => i.category === 'movie').length;
    const seriesCount = items.filter(i => i.category === 'series').length;

    onProgress?.({
      percent: 100,
      status: `اكتمل التحميل: ${items.length} قناة ومحتوى (${liveCount} بث مباشر، ${vodCount} فيلم، ${seriesCount} مسلسل)`,
      totalItems: items.length,
      liveCount,
      vodCount,
      seriesCount,
    });

    const profile: PlaylistProfile = {
      id: 'pl_m3u_' + Date.now(),
      name: playlistName || 'M3U Playlist',
      type: 'm3u_url',
      url: cleanUrl,
      channelCount: items.length,
      updatedAt: new Date().toISOString(),
      channels: items,
    };

    return { profile, items };
  }

  /**
   * Parses local M3U / M3U8 File
   */
  async parseM3uFile(
    file: File,
    playlistName?: string,
    onProgress?: (progress: IptvLoadProgress) => void
  ): Promise<{ profile: PlaylistProfile; items: PlaylistItem[] }> {
    onProgress?.({ percent: 20, status: `جاري قراءة ملف: ${file.name}...` });

    const textContent = await file.text();

    if (!textContent || textContent.length < 10) {
      throw new Error('الملف فارغ أو لا يحتوي على كود M3U صالح.');
    }

    onProgress?.({ percent: 65, status: 'جاري تحليل القنوات وتقسيم الفئات...' });

    const name = playlistName || file.name.replace(/\.[^/.]+$/, '');
    const items = this.parseM3uTextWithDetails(textContent, name);

    if (items.length === 0) {
      throw new Error('الملف لا يحتوي على وسوم #EXTINF أو روابط قنوات صالحة.');
    }

    const liveCount = items.filter(i => i.category === 'live').length;
    const vodCount = items.filter(i => i.category === 'movie').length;
    const seriesCount = items.filter(i => i.category === 'series').length;

    onProgress?.({
      percent: 100,
      status: `تم استيراد ${items.length} وسائط بنجاح.`,
      totalItems: items.length,
      liveCount,
      vodCount,
      seriesCount,
    });

    const profile: PlaylistProfile = {
      id: 'pl_file_' + Date.now(),
      name,
      type: 'm3u_file',
      channelCount: items.length,
      updatedAt: new Date().toISOString(),
      channels: items,
    };

    return { profile, items };
  }

  /**
   * Connects to Xtream Codes API server and retrieves Live, VOD, and Series streams
   */
  async connectXtreamCodes(
    server: string,
    username: string,
    password: string,
    playlistName?: string,
    onProgress?: (progress: IptvLoadProgress) => void
  ): Promise<{
    profile: PlaylistProfile;
    items: PlaylistItem[];
    authInfo: XtreamAuthResponse;
  }> {
    const result = await xtreamService.fetchAllSeparately(
      { serverUrl: server, username, password },
      {
        onProgress: (p: XtreamFetchProgress) => {
          onProgress?.({
            percent: p.percent,
            status: p.status,
            totalItems: p.totalItems,
            liveCount: p.liveCount,
            vodCount: p.vodCount,
            seriesCount: p.seriesCount,
          });
        },
      }
    );

    const profile: PlaylistProfile = {
      id: 'pl_xtream_' + Date.now(),
      name: playlistName || `Xtream (${result.authInfo.user_info?.username || username})`,
      type: 'xtream',
      server: xtreamService.cleanServerUrl(server),
      username,
      password,
      channelCount: result.items.length,
      updatedAt: new Date().toISOString(),
      channels: result.items,
    };

    return {
      profile,
      items: result.items,
      authInfo: result.authInfo,
    };
  }

  /**
   * Parses M3U text with enhanced metadata extraction and auto-categorization
   */
  private parseM3uTextWithDetails(m3uText: string, playlistName: string): PlaylistItem[] {
    return parseM3U(m3uText, playlistName);
  }

  /**
   * Local storage profiles persistence with IndexedDB backing
   */
  getStoredProfiles(): PlaylistProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => {
            if (p.id === 'default_preset') {
              return { ...p, channels: DEFAULT_CHANNELS };
            }
            return {
              ...p,
              channels: p.channels || [],
            };
          });
        }
      }
    } catch (err) {
      console.warn('Failed to parse stored IPTV profiles:', err);
    }

    // Default Initial Preset Profile
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

  private savedProfilesToDb = new Set<string>();

  saveProfiles(profiles: PlaylistProfile[]): void {
    try {
      // 1. Strip channels array from localStorage representation to avoid quota errors and main thread freezing
      const lightweightProfiles = profiles.map(p => {
        const { channels, ...meta } = p;
        if (channels && channels.length > 0 && p.id !== 'default_preset' && !this.savedProfilesToDb.has(p.id)) {
          this.savedProfilesToDb.add(p.id);
          dbService.saveChannels(p.id, channels).catch(e => {
            console.warn('db save error', e);
            this.savedProfilesToDb.delete(p.id);
          });
        }
        return {
          ...meta,
          channelCount: channels ? channels.length : (p.channelCount || 0),
        };
      });

      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(lightweightProfiles));
    } catch (err) {
      console.warn('Failed to save profiles to localStorage:', err);
    }
  }

  /**
   * Clears saved flag so updated profile channels can be re-persisted
   */
  invalidateProfileCache(profileId: string): void {
    this.savedProfilesToDb.delete(profileId);
  }

  getActiveProfileId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE_ID);
    } catch {
      return null;
    }
  }

  saveActiveProfileId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE_ID, id);
    } catch {}
  }

  getStoredFavorites(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (raw) return JSON.parse(raw);
    } catch {}
    return ['vod_tears_of_steel', 'ch_aljazeera_ar', 'vod_big_buck_bunny'];
  }

  saveFavorites(favorites: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
    } catch {}
  }

  getStoredRecents(): PlaylistItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENTS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  saveRecents(recents: PlaylistItem[]): void {
    try {
      // Keep max 25 recent items
      const trimmed = recents.slice(0, 25);
      localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(trimmed));
    } catch {}
  }
}

export const iptvService = new IptvService();
