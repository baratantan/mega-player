import { PlaylistItem, MediaCategory, EpgProgram } from '../types';

// Generate dynamic realistic EPG program list for live TV based on current time
export function generateMockEpg(channelName: string, group: string): EpgProgram[] {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const isArabic = /[\u0600-\u06FF]/.test(channelName) || group.includes('عرب') || group.includes('إسلام');
  
  let programTemplates: Array<{ titleAr: string; titleEn: string; descAr: string; descEn: string }> = [];

  if (group.toLowerCase().includes('sport') || group.includes('رياض')) {
    programTemplates = [
      { titleAr: 'استوديو التحليل المباشر', titleEn: 'Match Day Live Studio', descAr: 'تغطية حية وتحليل لأهم مباريات اليوم ومجريات الدوري.', descEn: 'Live in-depth tactical analysis and highlights.' },
      { titleAr: 'بث مباشر: قمة الجولة', titleEn: 'Live: Match of the Week', descAr: 'نقل حي ومباشر للمباراة مع تعليق احترافي وأحدث الإحصائيات.', descEn: 'Live match broadcast with expert commentary.' },
      { titleAr: 'حصاد الأهداف وملخص الجولة', titleEn: 'Goal Highlights & Round-Up', descAr: 'استعراض لأجمل الأهداف وأبرز اللقطات التحكيمية.', descEn: 'Complete replay of top goals and pivotal moments.' },
      { titleAr: 'عالم السرعة ورياضة المحركات', titleEn: 'Motorsports & Speed Special', descAr: 'سباقات السيارات والدراجات النارية وأحدث المستجدات.', descEn: 'High-octane racing and documentary features.' },
    ];
  } else if (group.toLowerCase().includes('news') || group.includes('أخبار')) {
    programTemplates = [
      { titleAr: 'النشرة الإخبارية الرئيسية', titleEn: 'Prime Time News Bulletin', descAr: 'متابعة شاملة لآخر التطورات السياسية والاقتصادية محلياً ودولياً.', descEn: 'Comprehensive coverage of top global headlines.' },
      { titleAr: 'حوار اليوم والملف الساخن', titleEn: 'Debate of the Day', descAr: 'نقاش مفتوح مع نخبة من المحللين وصناع القرار.', descEn: 'Interviews and panel discussions on current affairs.' },
      { titleAr: 'عين على الاقتصاد والأسواق', titleEn: 'Global Markets & Economy', descAr: 'حركة البورصات، أسعار النفط، وتحليل العملات الرقمية.', descEn: 'Financial markets report and economic outlook.' },
      { titleAr: 'جولة الصحافة والمستجدات', titleEn: 'Press Review & World Wire', descAr: 'قراءة في عناوين الصحف العالمية وأبرز مقالات الرأي.', descEn: 'Headlines from international print and digital media.' },
    ];
  } else if (group.toLowerCase().includes('doc') || group.includes('وثائق')) {
    programTemplates = [
      { titleAr: 'أسرار أعماق المحيطات', titleEn: 'Mysteries of the Deep Oceans', descAr: 'رحلة استكشافية مذهلة في أعماق البحار والمخلوقات النادرة.', descEn: 'Stunning 4K exploration into underwater marine life.' },
      { titleAr: 'عجائب الكون والفضاء السحيق', titleEn: 'Cosmos: Edge of the Universe', descAr: 'أحدث اكتشافات تلسكوب جيمس ويب والمجرات البعيدة.', descEn: 'New space discoveries and cosmic phenomena.' },
      { titleAr: 'تاريخ الحضارات القديمة', titleEn: 'Ancient Civilizations Unearthed', descAr: 'أسرار الفراعنة وبابل وعجائب العالم القديم.', descEn: 'Archaeological wonders and ancient history.' },
      { titleAr: 'رواد الابتكار والتكنولوجيا', titleEn: 'Tech Pioneers & Future AI', descAr: 'كيف يغير الذكاء الاصطناعي والثورات التقنية مستقبل البشرية.', descEn: 'How emerging AI is transforming human civilization.' },
    ];
  } else if (group.toLowerCase().includes('islam') || group.includes('إسلام') || group.includes('قرآن')) {
    programTemplates = [
      { titleAr: 'تلاوة قرآنية مباركة عطرة', titleEn: 'Blessed Holy Quran Recitation', descAr: 'تلاوة ندية بأصوات كبار القراء في العالم الإسلامي.', descEn: 'Heartfelt Quran recitation with soul-soothing reciters.' },
      { titleAr: 'بث مباشر من الحرمين الشريفين', titleEn: 'Live from the Two Holy Mosques', descAr: 'نقل حي للصلوات والأجواء الإيمانية في مكة المكرمة والمدينة المنورة.', descEn: 'Live continuous feed from Makkah and Madinah.' },
      { titleAr: 'برنامج نور الهدى وتفسير الآيات', titleEn: 'Light of Guidance: Tafseer', descAr: 'وقفات وتأملات في معاني القرآن الكريم والسيرة النبوية.', descEn: 'Spiritual insights and ethical teachings.' },
      { titleAr: 'أدعية وأذكار المساء', titleEn: 'Evening Supplications & Remembrance', descAr: 'أدعية مأثورة وأذكار مباركة تشرح الصدور.', descEn: 'Daily evening supplications and remembrance.' },
    ];
  } else {
    programTemplates = [
      { titleAr: 'عرض ترفيهي وموسيقي منوع', titleEn: 'Variety Entertainment Showcase', descAr: 'فقرات فنية ومقابلات حصرية مع نجوم الفن والإبداع.', descEn: 'Music, entertainment and interviews.' },
      { titleAr: 'برنامج المنوعات والموضة لايف', titleEn: 'Lifestyle & Culture Live', descAr: 'أحدث صيحات الموضة، الفنون، ووجهات السفر العالمية.', descEn: 'Art, lifestyle and world travel spotlights.' },
      { titleAr: 'فيلم السهرة المميز', titleEn: 'Prime Time Feature Film', descAr: 'عرض سينمائي حائز على جوائز عالمية.', descEn: 'Award-winning cinema feature presentation.' },
      { titleAr: 'بانوراما الليل وسهرات شبابية', titleEn: 'Late Night Panorama', descAr: 'أجواء ليلية شبابية ومقاطع طريفة وموسيقى هادئة.', descEn: 'Late night music and trending media recap.' },
    ];
  }

  // Create 4 sequential time blocks (each ~1-2 hours)
  const epgList: EpgProgram[] = [];
  const baseHour = Math.floor(currentHour / 2) * 2; // block of 2 hours

  for (let i = 0; i < 4; i++) {
    const startH = (baseHour + i * 2) % 24;
    const endH = (baseHour + (i + 1) * 2) % 24;
    const startStr = `${String(startH).padStart(2, '0')}:00`;
    const endStr = `${String(endH).padStart(2, '0')}:00`;

    const template = programTemplates[i % programTemplates.length];
    const isCurrent = (currentHour >= startH && currentHour < (startH + 2)) || (startH > endH && (currentHour >= startH || currentHour < endH));
    
    // calculate progress if current
    let progress = 0;
    if (isCurrent) {
      const minutesPassed = ((currentHour - startH + 24) % 24) * 60 + currentMinute;
      progress = Math.min(100, Math.max(0, Math.round((minutesPassed / 120) * 100)));
    }

    epgList.push({
      title: isArabic ? template.titleAr : template.titleEn,
      desc: isArabic ? template.descAr : template.descEn,
      start: startStr,
      end: endStr,
      progress: isCurrent ? progress : undefined,
    });
  }

  return epgList;
}

/**
 * Parses raw M3U / M3U8 playlist text into an array of PlaylistItem
 */
export function parseM3U(m3uText: string, playlistName = 'Custom Playlist'): PlaylistItem[] {
  const lines = m3uText.split(/\r?\n/);
  const items: PlaylistItem[] = [];

  let currentInfo: Partial<PlaylistItem> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentInfo = {};

      // Extract attributes: tvg-id, tvg-name, tvg-logo, group-title, etc.
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const countryMatch = line.match(/tvg-country="([^"]*)"/i);
      const languageMatch = line.match(/tvg-language="([^"]*)"/i);

      // Channel name is after the last comma
      const lastCommaIndex = line.lastIndexOf(',');
      let channelName = lastCommaIndex !== -1 ? line.substring(lastCommaIndex + 1).trim() : 'Channel ' + (items.length + 1);

      // Clean up common channel tags
      channelName = channelName.replace(/\s+/g, ' ').trim();

      currentInfo.tvgId = tvgIdMatch ? tvgIdMatch[1] : undefined;
      currentInfo.tvgName = tvgNameMatch ? tvgNameMatch[1] : undefined;
      currentInfo.logo = tvgLogoMatch ? tvgLogoMatch[1] : undefined;
      currentInfo.group = groupMatch ? groupMatch[1].trim() : 'General';
      currentInfo.country = countryMatch ? countryMatch[1] : undefined;
      currentInfo.language = languageMatch ? languageMatch[1] : undefined;
      currentInfo.name = channelName;

      // Detect resolution from name or group
      if (/\b(4K|UHD|2160p)\b/i.test(channelName)) {
        currentInfo.resolution = '4K';
      } else if (/\b(FHD|1080p)\b/i.test(channelName)) {
        currentInfo.resolution = 'FHD';
      } else if (/\b(HD|720p)\b/i.test(channelName)) {
        currentInfo.resolution = 'HD';
      } else {
        currentInfo.resolution = 'SD';
      }
    } else if (!line.startsWith('#') && line.length > 5) {
      // It's a stream URL!
      const streamUrl = line;
      const id = 'ch_' + Math.random().toString(36).substring(2, 10) + '_' + items.length;

      // Determine category (Live, Movie, Series, Radio)
      let category: MediaCategory = 'live';
      const groupLower = (currentInfo.group || '').toLowerCase();
      const urlLower = streamUrl.toLowerCase();
      const nameLower = (currentInfo.name || '').toLowerCase();

      if (
        groupLower.includes('movie') ||
        groupLower.includes('film') ||
        groupLower.includes('vod') ||
        groupLower.includes('أفلام') ||
        groupLower.includes('سينما') ||
        urlLower.includes('/movie/') ||
        /\.(mp4|mkv|avi)$/i.test(urlLower)
      ) {
        category = 'movie';
      } else if (
        groupLower.includes('series') ||
        groupLower.includes('show') ||
        groupLower.includes('مسلسل') ||
        urlLower.includes('/series/')
      ) {
        category = 'series';
      } else if (
        groupLower.includes('radio') ||
        groupLower.includes('راديو') ||
        groupLower.includes('إذاعة') ||
        urlLower.includes('/radio/') ||
        /\.(mp3|aac|ogg)$/i.test(urlLower)
      ) {
        category = 'radio';
      }

      const item: PlaylistItem = {
        id,
        name: currentInfo.name || `Stream ${items.length + 1}`,
        logo: currentInfo.logo,
        group: currentInfo.group || (category === 'movie' ? 'Movies' : category === 'series' ? 'Series' : 'General'),
        url: streamUrl,
        tvgId: currentInfo.tvgId,
        tvgName: currentInfo.tvgName,
        category,
        resolution: currentInfo.resolution || 'HD',
        country: currentInfo.country,
        language: currentInfo.language,
        epg: category === 'live' ? generateMockEpg(currentInfo.name || '', currentInfo.group || '') : undefined,
      };

      items.push(item);
      currentInfo = {};
    }
  }

  return items;
}

/**
 * Parses Xtream Codes JSON responses for Live, VOD, and Series
 */
export function parseXtreamLiveStreams(
  streams: any[],
  categoriesMap: Map<number, string>,
  serverUrl: string,
  user: string,
  pass: string
): PlaylistItem[] {
  let cleanServer = serverUrl.trim();
  if (!cleanServer.startsWith('http://') && !cleanServer.startsWith('https://')) {
    cleanServer = 'http://' + cleanServer;
  }
  if (cleanServer.endsWith('/')) {
    cleanServer = cleanServer.slice(0, -1);
  }

  return streams.map((stream, idx) => {
    const streamId = stream.stream_id;
    const catId = Number(stream.category_id);
    const group = categoriesMap.get(catId) || 'General';
    const streamUrl = `${cleanServer}/live/${user}/${pass}/${streamId}.m3u8`;

    return {
      id: `xtream_live_${streamId}_${idx}`,
      name: stream.name || `Channel ${streamId}`,
      logo: stream.stream_icon || undefined,
      group: group,
      url: streamUrl,
      tvgId: stream.epg_channel_id || undefined,
      category: 'live' as MediaCategory,
      resolution: stream.name?.includes('4K') ? '4K' : stream.name?.includes('FHD') ? 'FHD' : 'HD',
      epg: generateMockEpg(stream.name || '', group),
    };
  });
}

export function parseXtreamVodStreams(
  vods: any[],
  categoriesMap: Map<number, string>,
  serverUrl: string,
  user: string,
  pass: string
): PlaylistItem[] {
  let cleanServer = serverUrl.trim();
  if (!cleanServer.startsWith('http://') && !cleanServer.startsWith('https://')) {
    cleanServer = 'http://' + cleanServer;
  }
  if (cleanServer.endsWith('/')) {
    cleanServer = cleanServer.slice(0, -1);
  }

  return vods.map((vod, idx) => {
    const streamId = vod.stream_id;
    const catId = Number(vod.category_id);
    const group = categoriesMap.get(catId) || 'Movies';
    const containerExt = vod.container_extension || 'mp4';
    const streamUrl = `${cleanServer}/movie/${user}/${pass}/${streamId}.${containerExt}`;

    return {
      id: `xtream_vod_${streamId}_${idx}`,
      name: vod.name || `Movie ${streamId}`,
      logo: vod.stream_icon || undefined,
      group: group,
      url: streamUrl,
      category: 'movie' as MediaCategory,
      rating: vod.rating ? Number(vod.rating) : undefined,
      year: vod.year ? Number(vod.year) : undefined,
      resolution: 'HD',
      synopsis: vod.plot || vod.description || undefined,
    };
  });
}
