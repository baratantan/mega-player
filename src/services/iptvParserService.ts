/**
 * IPTV M3U & M3U8 Dedicated Parser Service
 * خدمة معالجة وتحليل ملفات وروابط M3U واستخراج البيانات الأساسية:
 * - اسم القناة أو الفيلم (Channel/Movie Name)
 * - رابط البث المباشر أو الفيديو (Stream URL)
 * - شعار القناة أو البوستر (tvg-logo)
 * - المجموعة أو التصنيف (group-title / Category)
 * - المعرفات الإضافية (tvg-id, tvg-name, resolution, language, country, epg)
 */

import { PlaylistItem, MediaCategory, EpgProgram } from '../types';
import { generateMockEpg } from '../utils/m3uParser';
import { errorLogService } from './errorLogService';

export interface ParsedChannelItem {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group: string;
  category: MediaCategory;
  tvgId?: string;
  tvgName?: string;
  country?: string;
  language?: string;
  resolution?: '4K' | 'FHD' | 'HD' | 'SD';
  rawExtinf?: string;
  epg?: EpgProgram[];
}

export interface M3uParseResult {
  items: ParsedChannelItem[];
  totalCount: number;
  liveCount: number;
  movieCount: number;
  seriesCount: number;
  radioCount: number;
  groups: string[];
  durationMs: number;
}

export interface M3uParseProgress {
  percent: number;
  status: string;
  processedLines?: number;
  totalLines?: number;
  foundItems?: number;
}

export class M3uParserService {
  /**
   * 1. دالة معالجة وتحليل نص M3U المباشر (Raw M3U String Parser)
   * تستخرج بدقة عالية:
   * - اسم القناة (Channel Name)
   * - رابط البث (Stream URL)
   * - الشعار (tvg-logo)
   * - المجموعة / التصنيف (group-title)
   */
  public parseM3uText(
    m3uContent: string,
    defaultGroup: string = 'General',
    onProgress?: (progress: M3uParseProgress) => void
  ): M3uParseResult {
    const startTime = performance.now();
    const lines = m3uContent.split(/\r?\n/);
    const totalLines = lines.length;
    const items: ParsedChannelItem[] = [];
    const groupsSet = new Set<string>();

    let currentItem: Partial<ParsedChannelItem> = {};

    for (let i = 0; i < totalLines; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      // Periodically report progress for huge playlists (e.g. 50k+ lines)
      if (onProgress && i % 2500 === 0) {
        const percent = Math.min(95, Math.round((i / totalLines) * 100));
        onProgress({
          percent,
          status: `جاري معالجة الأسطر (${i}/${totalLines})...`,
          processedLines: i,
          totalLines,
          foundItems: items.length,
        });
      }

      // Detect and parse #EXTINF metadata tag
      if (line.startsWith('#EXTINF:')) {
        currentItem = {
          rawExtinf: line,
        };

        // 1. Extract tvg-logo (شعار القناة / بوستر الفيلم)
        // Handles both quoted and unquoted: tvg-logo="url" or tvg-logo='url' or tvg-logo=url
        const logoMatch = line.match(/tvg-logo=(?:"([^"]*)"|'([^']*)'|([^\s,]+))/i);
        const logoUrl = logoMatch ? (logoMatch[1] || logoMatch[2] || logoMatch[3])?.trim() : undefined;
        if (logoUrl && logoUrl.length > 4) {
          currentItem.logo = logoUrl;
        }

        // 2. Extract group-title (المجموعة / التصنيف / الباقة)
        const groupMatch = line.match(/group-title=(?:"([^"]*)"|'([^']*)'|([^\s,]+))/i);
        const groupName = groupMatch ? (groupMatch[1] || groupMatch[2] || groupMatch[3])?.trim() : undefined;
        currentItem.group = groupName || defaultGroup;

        // 3. Extract tvg-id & tvg-name
        const tvgIdMatch = line.match(/tvg-id=(?:"([^"]*)"|'([^']*)'|([^\s,]+))/i);
        if (tvgIdMatch) currentItem.tvgId = tvgIdMatch[1] || tvgIdMatch[2] || tvgIdMatch[3];

        const tvgNameMatch = line.match(/tvg-name=(?:"([^"]*)"|'([^']*)'|([^\s,]+))/i);
        if (tvgNameMatch) currentItem.tvgName = tvgNameMatch[1] || tvgNameMatch[2] || tvgNameMatch[3];

        // 4. Extract tvg-country & tvg-language
        const countryMatch = line.match(/tvg-country=(?:"([^"]*)"|'([^']*)'|([^\s,]+))/i);
        if (countryMatch) currentItem.country = countryMatch[1] || countryMatch[2] || countryMatch[3];

        const langMatch = line.match(/tvg-language=(?:"([^"]*)"|'([^']*)'|([^\s,]+))/i);
        if (langMatch) currentItem.language = langMatch[1] || langMatch[2] || langMatch[3];

        // 5. Extract Channel / Stream Name (اسم القناة بعد آخر فاصلة)
        const lastCommaIndex = line.lastIndexOf(',');
        let channelName = lastCommaIndex !== -1 ? line.substring(lastCommaIndex + 1).trim() : '';

        // Fallback to tvg-name or tvg-id if name after comma is empty
        if (!channelName) {
          channelName = currentItem.tvgName || currentItem.tvgId || `Stream ${items.length + 1}`;
        }

        // Clean extra spacing
        channelName = channelName.replace(/\s+/g, ' ').trim();
        currentItem.name = channelName;

        // Detect resolution tags in title or group
        if (/\b(4K|UHD|2160p)\b/i.test(channelName)) {
          currentItem.resolution = '4K';
        } else if (/\b(FHD|1080p)\b/i.test(channelName)) {
          currentItem.resolution = 'FHD';
        } else if (/\b(HD|720p)\b/i.test(channelName)) {
          currentItem.resolution = 'HD';
        } else {
          currentItem.resolution = 'SD';
        }
      }
      // Check for stream URL line (Non-comment line with stream protocol or extension)
      else if (!line.startsWith('#') && (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('mms://') || line.length > 8)) {
        const streamUrl = line.trim();
        const cleanGroup = currentItem.group || defaultGroup;
        const channelName = currentItem.name || `Channel ${items.length + 1}`;
        const itemId = `m3u_${Date.now()}_${items.length}_${Math.random().toString(36).substring(2, 7)}`;

        // Smart Category Detection
        const category = this.detectCategory(channelName, cleanGroup, streamUrl);

        const fullItem: ParsedChannelItem = {
          id: itemId,
          name: channelName,
          url: streamUrl,
          logo: currentItem.logo,
          group: cleanGroup,
          category,
          tvgId: currentItem.tvgId,
          tvgName: currentItem.tvgName,
          country: currentItem.country,
          language: currentItem.language,
          resolution: currentItem.resolution || 'HD',
          rawExtinf: currentItem.rawExtinf,
          epg: category === 'live' ? generateMockEpg(channelName, cleanGroup) : undefined,
        };

        items.push(fullItem);
        groupsSet.add(cleanGroup);

        // Reset info for next item
        currentItem = {};
      }
    }

    const durationMs = Math.round(performance.now() - startTime);

    let liveCount = 0;
    let movieCount = 0;
    let seriesCount = 0;
    let radioCount = 0;

    items.forEach((item) => {
      if (item.category === 'live') liveCount++;
      else if (item.category === 'movie') movieCount++;
      else if (item.category === 'series') seriesCount++;
      else if (item.category === 'radio') radioCount++;
    });

    if (onProgress) {
      onProgress({
        percent: 100,
        status: `اكتمل التحليل: ${items.length} قناة ومحتوى (${durationMs}ms)`,
        processedLines: totalLines,
        totalLines,
        foundItems: items.length,
      });
    }

    return {
      items,
      totalCount: items.length,
      liveCount,
      movieCount,
      seriesCount,
      radioCount,
      groups: Array.from(groupsSet),
      durationMs,
    };
  }

  /**
   * 2. دالة استقبال رابط ملف m3u عن بُعد (Remote URL Fetcher & Parser)
   * تدعم تنزيل القائمة وتمريرها لمحلل النصوص
   */
  public async parseFromUrl(
    url: string,
    options?: {
      playlistName?: string;
      onProgress?: (progress: M3uParseProgress) => void;
      useProxy?: boolean;
    }
  ): Promise<M3uParseResult> {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      throw new Error('يرجى إدخال رابط M3U صالح.');
    }

    options?.onProgress?.({
      percent: 10,
      status: 'جاري الاتصال برابط قائمة التشغيل...',
    });

    let textContent = '';

    // 1. Try local proxy first if enabled/preferred
    if (options?.useProxy !== false) {
      try {
        options?.onProgress?.({
          percent: 30,
          status: 'جاري تنزيل الملف عبر البروكسي الآمن...',
        });
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(cleanUrl)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          textContent = await res.text();
        }
      } catch (e) {
        console.warn('Proxy download failed, attempting direct download:', e);
      }
    }

    // 2. Direct fetch fallback
    if (!textContent) {
      options?.onProgress?.({
        percent: 45,
        status: 'جاري التحميل المباشر من السيرفر...',
      });
      try {
        const directRes = await fetch(cleanUrl);
        if (!directRes.ok) {
          const err = new Error(`فشل تحميل الرابط: رمز الاستجابة ${directRes.status}`);
          errorLogService.logNetworkError({
            url: cleanUrl,
            status: directRes.status,
            message: err.message,
            details: `Failed to download M3U playlist file directly (HTTP ${directRes.status})`,
          });
          throw err;
        }
        textContent = await directRes.text();
      } catch (err: any) {
        errorLogService.logNetworkError({
          url: cleanUrl,
          status: 'M3U_DOWNLOAD_FAILED',
          message: err?.message || 'فشل تحميل ملف M3U',
          details: err?.stack,
        });
        throw err;
      }
    }

    if (!textContent || textContent.length < 10) {
      throw new Error('الرابط لا يحتوي على بيانات M3U صالحة أو الملف فارغ.');
    }

    options?.onProgress?.({
      percent: 70,
      status: 'جاري استخراج القنوات والشعارات والتصنيفات...',
    });

    return this.parseM3uText(textContent, options?.playlistName || 'General', options?.onProgress);
  }

  /**
   * 3. دالة استقبال ملف مرفوع من المستخدم (Uploaded File Parser)
   * تدعم قراءة ملفات .m3u و .m3u8 و .txt المرفوعة عبر المتصفح
   */
  public async parseFromFile(
    file: File,
    options?: {
      playlistName?: string;
      onProgress?: (progress: M3uParseProgress) => void;
    }
  ): Promise<M3uParseResult> {
    if (!file) {
      throw new Error('لم يتم تحديد أي ملف للرفع.');
    }

    options?.onProgress?.({
      percent: 15,
      status: `جاري قراءة محتوى الملف: ${file.name}...`,
    });

    const text = await file.text();
    if (!text || text.length < 10) {
      throw new Error('الملف المرفوع فارغ أو تالف.');
    }

    options?.onProgress?.({
      percent: 50,
      status: 'جاري تحليل الأسطر واستخراج وسوم القنوات...',
    });

    const defaultName = options?.playlistName || file.name.replace(/\.[^/.]+$/, '');
    return this.parseM3uText(text, defaultName, options?.onProgress);
  }

  /**
   * Smart Category Detector based on keywords in title, group name, and stream URL
   */
  private detectCategory(name: string, group: string, url: string): MediaCategory {
    const nameLower = name.toLowerCase();
    const groupLower = group.toLowerCase();
    const urlLower = url.toLowerCase();

    // 1. Radio (راديو / إذاعة)
    if (
      groupLower.includes('radio') ||
      groupLower.includes('راديو') ||
      groupLower.includes('إذاعة') ||
      groupLower.includes('fm') ||
      urlLower.includes('/radio/') ||
      /\.(mp3|aac|ogg|wav)$/i.test(urlLower)
    ) {
      return 'radio';
    }

    // 2. Movies / VOD (أفلام / سينما)
    if (
      groupLower.includes('movie') ||
      groupLower.includes('film') ||
      groupLower.includes('vod') ||
      groupLower.includes('cinema') ||
      groupLower.includes('أفلام') ||
      groupLower.includes('سينما') ||
      groupLower.includes('فيلم') ||
      urlLower.includes('/movie/') ||
      /\.(mp4|mkv|avi|mov)$/i.test(urlLower)
    ) {
      return 'movie';
    }

    // 3. Series (مسلسلات)
    if (
      groupLower.includes('series') ||
      groupLower.includes('show') ||
      groupLower.includes('season') ||
      groupLower.includes('مسلسل') ||
      groupLower.includes('مسلسلات') ||
      urlLower.includes('/series/')
    ) {
      return 'series';
    }

    // 4. Default to Live Channel
    return 'live';
  }
}

// Export singleton instance for global access
export const m3uParserService = new M3uParserService();
