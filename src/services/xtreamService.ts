/**
 * Dedicated Xtream Codes API Service
 * خدمة مخصصة عالية الكفاءة للاتصال بواجهة برمجة تطبيقات Xtream Codes API
 * - مصادقة الحساب (Authentication & Server Info)
 * - جلب وتصنيف القنوات المباشرة (Live Categories & Streams)
 * - جلب وتصنيف مكتبة الأفلام (VOD Categories & Streams)
 * - جلب وتصنيف مكتبة المسلسلات والحلقات (Series Categories & Series Streams)
 * - جلب معلومات تفصيلية للأفلام والمسلسلات ودليل البرامج EPG
 */

import { PlaylistItem, MediaCategory } from '../types';
import { generateMockEpg } from '../utils/m3uParser';

export interface XtreamCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface XtreamUserInfo {
  username: string;
  password?: string;
  auth: number;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  max_connections: string;
  allowed_output_formats: string[];
  created_at?: string;
  message?: string;
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  rtmp_port: string;
  timezone: string;
  timestamp_now: number;
  time_now: string;
  process?: boolean;
}

export interface XtreamAuthResponse {
  user_info?: XtreamUserInfo;
  server_info?: XtreamServerInfo;
}

export interface XtreamCategory {
  category_id: string | number;
  category_name: string;
  parent_id?: number;
}

export interface XtreamLiveStream {
  num?: number;
  name: string;
  stream_type?: string;
  stream_id: number | string;
  stream_icon?: string;
  epg_channel_id?: string;
  added?: string;
  category_id: string | number;
  custom_sid?: string;
  tv_archive?: number;
  direct_source?: string;
}

export interface XtreamVodStream {
  num?: number;
  name: string;
  stream_type?: string;
  stream_id: number | string;
  stream_icon?: string;
  rating?: string | number;
  rating_5based?: number;
  added?: string;
  category_id: string | number;
  container_extension?: string;
  custom_sid?: string;
  direct_source?: string;
  plot?: string;
  description?: string;
  year?: string | number;
}

export interface XtreamSeriesItem {
  num?: number;
  name: string;
  series_id: number | string;
  cover?: string;
  stream_icon?: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  last_modified?: string;
  rating?: string | number;
  rating_5based?: number;
  backdrop_path?: string[];
  youtube_trailer?: string;
  episode_run_time?: string;
  category_id: string | number;
}

export interface XtreamEpisode {
  id: string | number;
  episode_num: number | string;
  title: string;
  container_extension?: string;
  info?: {
    plot?: string;
    duration?: string;
    rating?: string;
    releasedate?: string;
    movie_image?: string;
  };
  custom_sid?: string;
  added?: string;
  season?: number | string;
  direct_source?: string;
}

export interface XtreamSeriesInfo {
  seasons?: Array<{
    air_date?: string;
    episode_count?: number;
    id?: number;
    name?: string;
    overview?: string;
    season_number: number;
    cover?: string;
    cover_big?: string;
  }>;
  info?: {
    name?: string;
    cover?: string;
    plot?: string;
    cast?: string;
    director?: string;
    genre?: string;
    releaseDate?: string;
    rating?: string;
    backdrop_path?: string[];
    youtube_trailer?: string;
    episode_run_time?: string;
  };
  episodes?: Record<string, XtreamEpisode[]>;
}

export interface XtreamFetchProgress {
  percent: number;
  stage: 'auth' | 'live_categories' | 'live_streams' | 'vod_categories' | 'vod_streams' | 'series_categories' | 'series' | 'processing' | 'done';
  status: string;
  totalItems?: number;
  liveCount?: number;
  vodCount?: number;
  seriesCount?: number;
}

export interface XtreamFetchOptions {
  includeLive?: boolean;
  includeVod?: boolean;
  includeSeries?: boolean;
  liveCategoryId?: string | number;
  vodCategoryId?: string | number;
  seriesCategoryId?: string | number;
  streamFormat?: 'm3u8' | 'ts';
  onProgress?: (progress: XtreamFetchProgress) => void;
}

export interface XtreamCompleteData {
  authInfo: XtreamAuthResponse;
  liveCategories: XtreamCategory[];
  liveStreams: XtreamLiveStream[];
  vodCategories: XtreamCategory[];
  vodStreams: XtreamVodStream[];
  seriesCategories: XtreamCategory[];
  series: XtreamSeriesItem[];
  items: PlaylistItem[];
  stats: {
    totalItems: number;
    liveCount: number;
    vodCount: number;
    seriesCount: number;
    durationMs: number;
  };
}

export class XtreamService {
  /**
   * تنسيق وتنظيف رابط الخادم
   */
  public cleanServerUrl(serverUrl: string): string {
    let clean = serverUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    return clean;
  }

  /**
   * إنشاء رابط الطلب الأساسي عبر البروكسي الداخلي لتفادي CORS
   */
  private buildProxyUrl(
    credentials: XtreamCredentials,
    action?: string,
    extraParams?: Record<string, string | number | undefined>
  ): string {
    const cleanServer = this.cleanServerUrl(credentials.serverUrl);
    const params = new URLSearchParams();
    params.append('server', cleanServer);
    params.append('username', credentials.username.trim());
    params.append('password', credentials.password.trim());

    if (action) {
      params.append('action', action);
    }

    if (extraParams) {
      for (const [key, value] of Object.entries(extraParams)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
    }

    return `/api/xtream?${params.toString()}`;
  }

  /**
   * دالة مساعدة عامة لتنفيذ طلبات الـ API وإرجاع JSON
   */
  private async executeQuery<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`خطأ في استجابة السيرفر: ${response.status} (${response.statusText})`);
    }
    return response.json();
  }

  // =========================================================================
  // 1. مصادقة الحساب والتحقق من الصلاحيات (Authentication)
  // =========================================================================

  public async authenticate(credentials: XtreamCredentials): Promise<XtreamAuthResponse> {
    const url = this.buildProxyUrl(credentials);
    const data = await this.executeQuery<XtreamAuthResponse>(url);

    if (!data || !data.user_info) {
      throw new Error('فشل الاتصال: السيرفر لم يرجع بيانات مصادقة صالحة.');
    }

    if (data.user_info.auth === 0 || data.user_info.status !== 'Active') {
      const reason = data.user_info.message || data.user_info.status || 'بيانات الدخول غير صحيحة أو الحساب غير مفعل.';
      throw new Error(`تم رفض تسجيل الدخول من خادم Xtream: ${reason}`);
    }

    return data;
  }

  // =========================================================================
  // 2. قنوات البث المباشر (Live TV Streams & Categories)
  // =========================================================================

  /**
   * جلب تصنيفات القنوات الحية: get_live_categories
   */
  public async getLiveCategories(credentials: XtreamCredentials): Promise<XtreamCategory[]> {
    const url = this.buildProxyUrl(credentials, 'get_live_categories');
    const result = await this.executeQuery<any>(url);
    return Array.isArray(result) ? result : [];
  }

  /**
   * جلب قائمة القنوات الحية: get_live_streams
   * يدعم جلب فئة محددة أو كافة القنوات
   */
  public async getLiveStreams(
    credentials: XtreamCredentials,
    categoryId?: string | number
  ): Promise<XtreamLiveStream[]> {
    const extraParams = categoryId ? { category_id: categoryId } : undefined;
    const url = this.buildProxyUrl(credentials, 'get_live_streams', extraParams);
    const result = await this.executeQuery<any>(url);
    return Array.isArray(result) ? result : [];
  }

  // =========================================================================
  // 3. مكتبة الأفلام والسينما (VOD Movies & Categories)
  // =========================================================================

  /**
   * جلب تصنيفات الأفلام: get_vod_categories
   */
  public async getVodCategories(credentials: XtreamCredentials): Promise<XtreamCategory[]> {
    const url = this.buildProxyUrl(credentials, 'get_vod_categories');
    const result = await this.executeQuery<any>(url);
    return Array.isArray(result) ? result : [];
  }

  /**
   * جلب قائمة الأفلام: get_vod_streams
   * يدعم جلب فئة محددة أو كافة الأفلام
   */
  public async getVodStreams(
    credentials: XtreamCredentials,
    categoryId?: string | number
  ): Promise<XtreamVodStream[]> {
    const extraParams = categoryId ? { category_id: categoryId } : undefined;
    const url = this.buildProxyUrl(credentials, 'get_vod_streams', extraParams);
    const result = await this.executeQuery<any>(url);
    return Array.isArray(result) ? result : [];
  }

  /**
   * جلب تفاصيل ومعلومات فيلم محدد: get_vod_info
   */
  public async getVodInfo(
    credentials: XtreamCredentials,
    vodId: string | number
  ): Promise<any> {
    const url = this.buildProxyUrl(credentials, 'get_vod_info', { vod_id: vodId });
    return this.executeQuery<any>(url);
  }

  // =========================================================================
  // 4. مكتبة المسلسلات والعروض (Series & Categories)
  // =========================================================================

  /**
   * جلب تصنيفات المسلسلات: get_series_categories
   */
  public async getSeriesCategories(credentials: XtreamCredentials): Promise<XtreamCategory[]> {
    const url = this.buildProxyUrl(credentials, 'get_series_categories');
    const result = await this.executeQuery<any>(url);
    return Array.isArray(result) ? result : [];
  }

  /**
   * جلب قائمة المسلسلات: get_series
   * يدعم جلب فئة محددة أو كافة المسلسلات
   */
  public async getSeries(
    credentials: XtreamCredentials,
    categoryId?: string | number
  ): Promise<XtreamSeriesItem[]> {
    const extraParams = categoryId ? { category_id: categoryId } : undefined;
    const url = this.buildProxyUrl(credentials, 'get_series', extraParams);
    const result = await this.executeQuery<any>(url);
    return Array.isArray(result) ? result : [];
  }

  /**
   * جلب مواسم وحلقات وتفاصيل مسلسل محدد: get_series_info
   */
  public async getSeriesInfo(
    credentials: XtreamCredentials,
    seriesId: string | number
  ): Promise<XtreamSeriesInfo> {
    const url = this.buildProxyUrl(credentials, 'get_series_info', { series_id: seriesId });
    return this.executeQuery<XtreamSeriesInfo>(url);
  }

  // =========================================================================
  // 5. دليل البرامج الإلكتروني (Short EPG)
  // =========================================================================

  /**
   * جلب دليل البرامج لقناة محددة: get_short_epg
   */
  public async getShortEpg(
    credentials: XtreamCredentials,
    streamId: string | number,
    limit: number = 10
  ): Promise<any> {
    const url = this.buildProxyUrl(credentials, 'get_short_epg', {
      stream_id: streamId,
      limit,
    });
    return this.executeQuery<any>(url);
  }

  // =========================================================================
  // 6. دالة التجميع الشاملة والفائقة السرعة (Comprehensive Separate Fetcher)
  // =========================================================================

  /**
   * تجلب البيانات بشكل منفصل ومتوازي وبكفاءة عالية لكل من:
   * 1. القنوات الحية (get_live_categories / get_live_streams)
   * 2. الأفلام (get_vod_categories / get_vod_streams)
   * 3. المسلسلات (get_series_categories / get_series)
   * وتقوم ببناء الروابط المباشرة وهيكلة البيانات لتطبيق العرض.
   */
  public async fetchAllSeparately(
    credentials: XtreamCredentials,
    options: XtreamFetchOptions = {}
  ): Promise<XtreamCompleteData> {
    const startTime = performance.now();
    const cleanServer = this.cleanServerUrl(credentials.serverUrl);
    const { username, password } = credentials;

    const includeLive = options.includeLive !== false;
    const includeVod = options.includeVod !== false;
    const includeSeries = options.includeSeries !== false;
    const streamExt = options.streamFormat || 'm3u8';

    // الخطوة 1: المصادقة والتحقق من الحساب
    options.onProgress?.({
      percent: 10,
      stage: 'auth',
      status: 'جاري مصادقة حساب Xtream Codes والتحقق من الصلاحيات...',
    });

    const authInfo = await this.authenticate(credentials);
    const user = authInfo.user_info;

    options.onProgress?.({
      percent: 25,
      stage: 'live_categories',
      status: `مرحباً ${user?.username}! جاري جلب الأقسام والتصنيفات...`,
    });

    // الخطوة 2: جلب البيانات بشكل منفصل ومتوازي
    const tasks: [
      Promise<XtreamCategory[]>,
      Promise<XtreamCategory[]>,
      Promise<XtreamCategory[]>,
      Promise<XtreamLiveStream[]>,
      Promise<XtreamVodStream[]>,
      Promise<XtreamSeriesItem[]>
    ] = [
      includeLive ? this.getLiveCategories(credentials).catch(() => []) : Promise.resolve([]),
      includeVod ? this.getVodCategories(credentials).catch(() => []) : Promise.resolve([]),
      includeSeries ? this.getSeriesCategories(credentials).catch(() => []) : Promise.resolve([]),
      includeLive ? this.getLiveStreams(credentials, options.liveCategoryId).catch(() => []) : Promise.resolve([]),
      includeVod ? this.getVodStreams(credentials, options.vodCategoryId).catch(() => []) : Promise.resolve([]),
      includeSeries ? this.getSeries(credentials, options.seriesCategoryId).catch(() => []) : Promise.resolve([]),
    ];

    options.onProgress?.({
      percent: 50,
      stage: 'live_streams',
      status: 'جاري تحميل قنوات البث المباشر والأفلام والمسلسلات بالتوازي...',
    });

    const [
      liveCategories,
      vodCategories,
      seriesCategories,
      liveStreams,
      vodStreams,
      series,
    ] = await Promise.all(tasks);

    options.onProgress?.({
      percent: 85,
      stage: 'processing',
      status: 'جاري ربط الفئات وتوليد روابط البث المباشر المشفرة...',
    });

    // إنشاء خرائط أسماء الفئات للوصول الفوري O(1)
    const liveCatsMap = new Map<string, string>();
    liveCategories.forEach((c) => liveCatsMap.set(String(c.category_id), c.category_name));

    const vodCatsMap = new Map<string, string>();
    vodCategories.forEach((c) => vodCatsMap.set(String(c.category_id), c.category_name));

    const seriesCatsMap = new Map<string, string>();
    seriesCategories.forEach((c) => seriesCatsMap.set(String(c.category_id), c.category_name));

    const items: PlaylistItem[] = [];

    // 1. معالجة قنوات البث المباشر (Live Streams)
    liveStreams.forEach((stream, index) => {
      const groupName = liveCatsMap.get(String(stream.category_id)) || 'Live TV';
      const streamId = stream.stream_id;
      // بناء رابط البث المباشر: http://server:port/live/username/password/stream_id.m3u8
      const streamUrl = `${cleanServer}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.${streamExt}`;

      items.push({
        id: `xt_live_${streamId}_${index}`,
        name: stream.name || `Channel ${streamId}`,
        logo: stream.stream_icon || undefined,
        group: groupName,
        url: streamUrl,
        tvgId: stream.epg_channel_id || undefined,
        category: 'live' as MediaCategory,
        resolution: stream.name?.includes('4K') ? '4K' : stream.name?.includes('FHD') ? 'FHD' : 'HD',
        epg: generateMockEpg(stream.name || '', groupName),
      });
    });

    // 2. معالجة مكتبة الأفلام (VOD Movies)
    vodStreams.forEach((vod, index) => {
      const groupName = vodCatsMap.get(String(vod.category_id)) || 'Movies';
      const streamId = vod.stream_id;
      const ext = vod.container_extension || 'mp4';
      // بناء رابط الفيلم: http://server:port/movie/username/password/stream_id.ext
      const streamUrl = `${cleanServer}/movie/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${streamId}.${ext}`;

      items.push({
        id: `xt_vod_${streamId}_${index}`,
        name: vod.name || `Movie ${streamId}`,
        logo: vod.stream_icon || undefined,
        backdrop: vod.stream_icon || undefined,
        group: groupName,
        url: streamUrl,
        category: 'movie' as MediaCategory,
        rating: vod.rating ? parseFloat(String(vod.rating)) : undefined,
        year: vod.year ? parseInt(String(vod.year), 10) : undefined,
        resolution: 'FHD',
        synopsis: vod.plot || vod.description || undefined,
      });
    });

    // 3. معالجة مكتبة المسلسلات (Series)
    series.forEach((ser, index) => {
      const groupName = seriesCatsMap.get(String(ser.category_id)) || 'Series';
      const seriesId = ser.series_id;
      const streamUrl = `${cleanServer}/series/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${seriesId}.mp4`;

      items.push({
        id: `xt_ser_${seriesId}_${index}`,
        name: ser.name || `Series ${seriesId}`,
        logo: ser.cover || ser.stream_icon || undefined,
        backdrop: ser.backdrop_path?.[0] || ser.cover || undefined,
        group: groupName,
        url: streamUrl,
        category: 'series' as MediaCategory,
        rating: ser.rating ? parseFloat(String(ser.rating)) : undefined,
        year: ser.releaseDate ? parseInt(ser.releaseDate.substring(0, 4), 10) : undefined,
        resolution: 'FHD',
        genres: ser.genre ? ser.genre.split(',').map((g) => g.trim()) : undefined,
        synopsis: ser.plot || undefined,
      });
    });

    const durationMs = Math.round(performance.now() - startTime);
    const liveCount = liveStreams.length;
    const vodCount = vodStreams.length;
    const seriesCount = series.length;

    options.onProgress?.({
      percent: 100,
      stage: 'done',
      status: `اكتمل جلب البيانات بنجاح: ${items.length} عنصر (${liveCount} قنوات حية، ${vodCount} أفلام، ${seriesCount} مسلسلات) في ${durationMs}ms`,
      totalItems: items.length,
      liveCount,
      vodCount,
      seriesCount,
    });

    return {
      authInfo,
      liveCategories,
      liveStreams,
      vodCategories,
      vodStreams,
      seriesCategories,
      series,
      items,
      stats: {
        totalItems: items.length,
        liveCount,
        vodCount,
        seriesCount,
        durationMs,
      },
    };
  }
}

// تصدير نسخة عامة Singleton جاهزة للاستخدام
export const xtreamService = new XtreamService();
