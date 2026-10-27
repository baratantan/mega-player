import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Hls from 'hls.js';
import { 
  Tv, 
  Search, 
  Star, 
  Play, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Calendar, 
  ArrowLeft, 
  ArrowRight,
  X,
  LayoutGrid,
  Columns3,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  Radio
} from 'lucide-react';
import { PlaylistItem, EpgProgram } from '../types';
import { Language, translations } from '../utils/translations';

interface TivimateLiveTvProps {
  channels: PlaylistItem[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onPlayFullscreen: (channel: PlaylistItem) => void;
  onBackToHome: () => void;
  lang: Language;
}

// Generate an extended 24-hour timeline block for the full EPG Matrix
const TIMELINE_HOURS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00'
];

interface MatrixProgram {
  id: string;
  title: string;
  desc: string;
  category: string;
  startHour: number; // 0 - 23
  durationHours: number; // 1, 2, or 3
  startStr: string;
  endStr: string;
  isNow: boolean;
  progress: number;
}

export const TivimateLiveTv: React.FC<TivimateLiveTvProps> = ({
  channels,
  favorites,
  onToggleFavorite,
  onPlayFullscreen,
  onBackToHome,
  lang,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const liveChannels = useMemo(() => {
    return channels.filter(c => c.category === 'live');
  }, [channels]);

  // Extract distinct category groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    liveChannels.forEach(c => {
      if (c.group) set.add(c.group);
    });
    return Array.from(set);
  }, [liveChannels]);

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<PlaylistItem>(() => {
    return liveChannels[0] || channels[0];
  });
  const [activeProgramModal, setActiveProgramModal] = useState<{
    channel: PlaylistItem;
    program: MatrixProgram;
  } | null>(null);

  const [previewMuted, setPreviewMuted] = useState<boolean>(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(true);

  // References for smooth scrolling
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  // Live clock and current hour calculation
  const [nowDate, setNowDate] = useState<Date>(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = nowDate.getHours();
  const currentMinute = nowDate.getMinutes();
  const currentTimeString = nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Embedded Preview Video Player
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return liveChannels.filter(c => {
      if (selectedGroup === 'FAVORITES') {
        if (!favorites.includes(c.id)) return false;
      } else if (selectedGroup !== 'ALL' && c.group !== selectedGroup) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q);
      }

      return true;
    });
  }, [liveChannels, selectedGroup, searchQuery, favorites]);

  // Generate continuous timeline program blocks for every channel
  const channelSchedules = useMemo(() => {
    const map = new Map<string, MatrixProgram[]>();

    filteredChannels.forEach(channel => {
      const progs: MatrixProgram[] = [];
      const grp = channel.group.toLowerCase();
      const isSports = grp.includes('sport') || grp.includes('رياض');
      const isNews = grp.includes('news') || grp.includes('أخبار');
      const isDoc = grp.includes('doc') || grp.includes('وثائق');
      const isIslam = grp.includes('islam') || grp.includes('إسلام') || grp.includes('قرآن');

      // Create 12 sequential 2-hour program blocks across the 24-hour day
      for (let block = 0; block < 12; block++) {
        const startH = (block * 2);
        const endH = (block * 2 + 2) % 24;
        const startStr = `${String(startH).padStart(2, '0')}:00`;
        const endStr = `${String(endH).padStart(2, '0')}:00`;

        const isNow = currentHour >= startH && currentHour < (startH + 2);
        let progress = 0;
        if (isNow) {
          const minutesPassed = (currentHour - startH) * 60 + currentMinute;
          progress = Math.min(100, Math.max(0, Math.round((minutesPassed / 120) * 100)));
        }

        let title = '';
        let desc = '';
        let cat = 'عام';

        if (isSports) {
          cat = 'رياضة';
          const titles = [
            'الاستوديو التحليلي لمباريات اليوم',
            'بث مباشر: قمة الجولة والأهداف',
            'حصاد الدوري وملخص الفرص',
            'عالم السرعة وسباقات الفورمولا',
            'أعظم اللحظات الكروية في التاريخ',
            'كواليس الأندية وتصريحات النجوم'
          ];
          title = titles[block % titles.length];
          desc = 'تغطية تحليلية واستعراض لأدق التفاصيل التكتيكية مع نخبة من كبار المحللين الرياضيين.';
        } else if (isNews) {
          cat = 'أخبار';
          const titles = [
            'نشرة الأخبار الحية على مدار الساعة',
            'حوار اليوم: قراءة في الملفات الساخنة',
            'عين على الأسواق وحركة الاقتصاد العالمي',
            'جولة في الصحافة الإقليمية والدولية',
            'بانوراما الأحداث والتحقيقات الاستقصائية',
            'تغطية خاصة: مستقبل الطاقة والتكنولوجيا'
          ];
          title = titles[block % titles.length];
          desc = 'متابعة شاملة لآخر التطورات السياسية والاقتصادية محلياً ودولياً مع شبكة المراسلين حول العالم.';
        } else if (isDoc) {
          cat = 'وثائقي';
          const titles = [
            'أسرار أعماق المحيطات والكائنات الغامضة',
            'رحلة إلى حافة الكون والمجرات البعيدة',
            'حضارات العالم القديم وكنوز الفراعنة',
            'عجائب المملكة الحيوانية في السافانا',
            'رواد الابتكار وثورة الذكاء الاصطناعي',
            'براكين الأرض والظواهر الجيولوجية النادرة'
          ];
          title = titles[block % titles.length];
          desc = 'سلسلة وثائقية استثنائية مصورة بأحدث تقنيات 4K فائقة الدقة والوضوح.';
        } else if (isIslam) {
          cat = 'ديني';
          const titles = [
            'تلاوة ندية مباركة من آيات الذكر الحكيم',
            'نقل حي ومباشر للصلوات من الحرمين الشريفين',
            'برنامج نور الهدى وتأملات في السيرة',
            'فتاوى وأحكام فقهية مع كبار العلماء',
            'أدعية وأذكار الصباح والمساء',
            'روائع القصص القرآني والعبر الإيمانية'
          ];
          title = titles[block % titles.length];
          desc = 'أجواء إيمانية وتلاوات عذبة بأصوات خيرة القراء وبرامج إرشادية وتفسيرية.';
        } else {
          cat = 'ترفيه';
          const titles = [
            'برنامج المنوعات الصباحي ولقاءات النجوم',
            'فيلم الظهيرة المميز: مغامرة وأكشن',
            'عالم السينما وأسرار الإنتاج الهوليوودي',
            'سهرة المساء الموسيقية وعروض حية',
            'فيلم السهرة الكلاسيكي الحائز على الأوسكار',
            'بانوراما فنية ومقتطفات سينمائية عالمية'
          ];
          title = titles[block % titles.length];
          desc = 'باقة من أروع البرامج الترفيهية والأفلام المختارة لعشاق المشاهدة المميزة.';
        }

        // Check if channel has custom EPG to override current block
        if (isNow && channel.epg?.[0]) {
          title = channel.epg[0].title;
          if (channel.epg[0].desc) desc = channel.epg[0].desc;
        }

        progs.push({
          id: `${channel.id}_prog_${block}`,
          title,
          desc,
          category: cat,
          startHour: startH,
          durationHours: 2,
          startStr,
          endStr,
          isNow,
          progress
        });
      }

      map.set(channel.id, progs);
    });

    return map;
  }, [filteredChannels, currentHour, currentMinute]);

  // HLS stream binding for mini-player
  useEffect(() => {
    if (!selectedChannel || !previewVideoRef.current) return;
    const video = previewVideoRef.current;
    const streamUrl = selectedChannel.url;

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
  }, [selectedChannel?.id, selectedChannel?.url]);

  // Smooth Horizontal Scrolling Functions
  const scrollHorizontally = (direction: 'left' | 'right') => {
    if (gridContainerRef.current) {
      const offset = direction === 'left' ? -350 : 350;
      gridContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Jump smoothly to the current hour column in EPG Grid
  const scrollToNow = () => {
    if (gridContainerRef.current) {
      // Each 2-hour block is ~280px wide
      const currentBlockIndex = Math.floor(currentHour / 2);
      const targetX = currentBlockIndex * 280;
      
      // In RTL, scroll offset direction depends on browser rendering
      if (isRtl) {
        gridContainerRef.current.scrollTo({ left: -targetX, behavior: 'smooth' });
      } else {
        gridContainerRef.current.scrollTo({ left: targetX, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#050811] text-white overflow-hidden pt-16 sm:pt-20">
      {/* TiviMate Top Sub-bar with View Switchers & Jump Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-14 px-4 sm:px-8 bg-black/50 border-b border-white/10 flex items-center justify-between shrink-0 gap-3"
      >
        {/* Left: Breadcrumb & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition cursor-pointer"
          >
            {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isRtl ? 'الرئيسية' : 'Home'}</span>
          </motion.button>
          
          <span className="text-white/20 hidden sm:inline">/</span>
          
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-md shadow-red-500" />
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider hidden sm:inline">
              TiviMate EPG Matrix
            </span>
          </div>
        </div>

        {/* Center: View Switcher Tabs (EPG Grid Matrix vs 3-Column Split) */}
        <div className="flex items-center p-1 rounded-xl bg-black/60 border border-white/10 shadow-inner">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isRtl ? 'شبكة جدول البث (EPG Grid)' : 'EPG Matrix'}</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>{isRtl ? 'المعاينة الثلاثية' : 'Split View'}</span>
          </button>
        </div>

        {/* Right: Search, Jump to Now & Live Clock */}
        <div className="flex items-center gap-3 shrink-0">
          {viewMode === 'grid' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToNow}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-black transition cursor-pointer shadow-sm shadow-cyan-500/20"
              title={isRtl ? 'الانتقال إلى الوقت الحالي في الجدول' : 'Jump to Current Time'}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRtl ? 'الآن' : 'Now'}</span>
            </motion.button>
          )}

          <div className="relative w-36 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full ps-8 pe-3 py-1.5 text-xs bg-white/[0.04] text-white rounded-xl border border-white/[0.08] focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-2 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs font-mono font-black text-cyan-400 hidden sm:inline px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/20">
            {currentTimeString}
          </span>
        </div>
      </motion.div>

      {/* Category Pills Strip */}
      <div className="px-4 sm:px-8 py-2 bg-[#070b18] border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        <button
          onClick={() => setSelectedGroup('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            selectedGroup === 'ALL'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/5'
          }`}
        >
          {t.allCategories} ({liveChannels.length})
        </button>

        <button
          onClick={() => setSelectedGroup('FAVORITES')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            selectedGroup === 'FAVORITES'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/5'
          }`}
        >
          <Star className="w-3 h-3 fill-current text-amber-400" />
          <span>{t.favorites} ({favorites.length})</span>
        </button>

        {groups.map(grp => (
          <button
            key={grp}
            onClick={() => setSelectedGroup(grp)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedGroup === grp
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-black shadow-sm'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/5'
            }`}
          >
            {grp}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: FULL EPG TIMELINE GRID MATRIX (Sticky Channel Column on the Right) */}
      {/* ========================================================================= */}
      {viewMode === 'grid' ? (
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-[#050811]">
          {/* Main 2D Scrollable Matrix Stage */}
          <div 
            ref={gridContainerRef}
            className="flex-1 min-h-0 overflow-auto scroll-smooth relative select-none scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent"
          >
            <div className="inline-block min-w-full align-top">
              {/* TIMELINE TIME HEADER ROW (Sticky Top) */}
              <div className="sticky top-0 z-30 flex bg-[#070b18]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
                {/* Fixed Corner Cell over Sticky Channel Column (Sticky Right in RTL) */}
                <div 
                  className={`w-64 sm:w-72 md:w-80 shrink-0 sticky ${isRtl ? 'right-0 z-40 border-s' : 'left-0 z-40 border-e'} bg-[#0a0f1f] border-white/10 p-3 flex items-center justify-between shadow-2xl`}
                >
                  <div className="flex items-center gap-2 text-xs font-black text-white">
                    <Tv className="w-4 h-4 text-cyan-400" />
                    <span>{isRtl ? 'القنوات التلفزيونية' : 'Channels'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => scrollHorizontally('left')}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition cursor-pointer"
                      title={isRtl ? 'التمرير يساراً' : 'Scroll Left'}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                    <button
                      onClick={() => scrollHorizontally('right')}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition cursor-pointer"
                      title={isRtl ? 'التمرير يميناً' : 'Scroll Right'}
                    >
                      <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                </div>

                {/* Time Slots Headers (12 blocks of 2 hours each = 24h timeline) */}
                <div className="flex shrink-0">
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const startH = idx * 2;
                    const endH = (idx * 2 + 2) % 24;
                    const isNow = currentHour >= startH && currentHour < (startH + 2);
                    const timeLabel = `${String(startH).padStart(2, '0')}:00 - ${String(endH).padStart(2, '0')}:00`;

                    return (
                      <div
                        key={idx}
                        className={`w-[280px] shrink-0 px-3 py-3 border-e border-white/10 flex items-center justify-between text-xs font-mono font-bold transition-colors ${
                          isNow
                            ? 'bg-cyan-950/50 text-cyan-300 border-b-2 border-b-cyan-400'
                            : 'text-slate-400 hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {isNow && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                          <span>{timeLabel}</span>
                        </span>
                        {isNow && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/40 uppercase tracking-widest font-sans font-black">
                            {t.nowPlaying}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CHANNELS AND EPG ROWS */}
              <div className="divide-y divide-white/5">
                {filteredChannels.map((channel, cIdx) => {
                  const isFav = favorites.includes(channel.id);
                  const isSelected = selectedChannel?.id === channel.id;
                  const schedules = channelSchedules.get(channel.id) || [];

                  return (
                    <div 
                      key={channel.id}
                      className={`flex group/row transition-colors ${
                        isSelected ? 'bg-cyan-950/20' : 'hover:bg-white/[0.015]'
                      }`}
                    >
                      {/* ========================================================================= */}
                      {/* STICKY CHANNEL CARD (Fixed on the Right in RTL, Left in LTR) */}
                      {/* ========================================================================= */}
                      <div
                        tabIndex={0}
                        data-tv-focusable="true"
                        onClick={() => setSelectedChannel(channel)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            onPlayFullscreen(channel);
                          } else if (e.key === 'f' || e.key === 'F') {
                            e.preventDefault();
                            onToggleFavorite(channel.id);
                          }
                        }}
                        className={`tv-focusable w-64 sm:w-72 md:w-80 shrink-0 sticky ${
                          isRtl ? 'right-0 z-20 border-s' : 'left-0 z-20 border-e'
                        } bg-[#0a0f1d] group-hover/row:bg-[#0d1428] border-white/10 p-3 flex items-center justify-between gap-3 shadow-[-8px_0_15px_rgba(0,0,0,0.6)] cursor-pointer transition-colors`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Channel Number */}
                          <span className="text-[11px] font-mono font-bold text-slate-500 w-5 text-center shrink-0">
                            {cIdx + 1}
                          </span>

                          {/* Channel Logo */}
                          <div className="relative w-11 h-11 rounded-xl bg-black/70 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover/row:border-cyan-500/40 transition">
                            {channel.logo ? (
                              <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Tv className="w-5 h-5 text-slate-500" />
                            )}
                            <span className="absolute bottom-0.5 end-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-black animate-pulse" />
                          </div>

                          {/* Channel Metadata */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className={`text-xs font-black truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                                {channel.name}
                              </h4>
                              {channel.resolution && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/90 text-cyan-400 border border-cyan-500/30 font-mono font-bold shrink-0">
                                  {channel.resolution}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                              {channel.group}
                            </span>
                          </div>
                        </div>

                        {/* Direct Play & Favorite Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(channel.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 transition cursor-pointer"
                            title={t.favorites}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-current' : ''}`} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayFullscreen(channel);
                            }}
                            className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition shadow-md shadow-cyan-500/30 cursor-pointer"
                            title={t.fullScreen}
                          >
                            <Play className="w-3 h-3 fill-current translate-x-0.5" />
                          </motion.button>
                        </div>
                      </div>

                      {/* ========================================================================= */}
                      {/* TIMELINE PROGRAM CELLS FOR THIS CHANNEL ROW */}
                      {/* ========================================================================= */}
                      <div className="flex shrink-0">
                        {schedules.map((prog) => {
                          return (
                            <div
                              key={prog.id}
                              onClick={() => {
                                setSelectedChannel(channel);
                                setActiveProgramModal({ channel, program: prog });
                              }}
                              className={`w-[280px] shrink-0 p-2.5 border-e border-white/5 cursor-pointer relative group transition-all duration-200 ${
                                prog.isNow
                                  ? 'bg-gradient-to-r from-cyan-950/40 via-emerald-950/20 to-transparent hover:bg-cyan-950/60'
                                  : 'hover:bg-white/[0.04]'
                              }`}
                            >
                              {/* Program Box Card */}
                              <div className={`h-full p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                                prog.isNow
                                  ? 'bg-gradient-to-br from-[#0c1a2f] to-[#071322] border-cyan-500/50 shadow-md shadow-cyan-950/40'
                                  : 'bg-white/[0.02] border-white/[0.06] group-hover:border-white/20'
                              }`}>
                                <div>
                                  <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                                    <span className={prog.isNow ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                                      {prog.startStr} - {prog.endStr}
                                    </span>
                                    {prog.isNow ? (
                                      <span className="px-1.5 py-0.2 rounded bg-red-500 text-white font-sans font-black uppercase text-[8px] animate-pulse">
                                        {t.liveBadge}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-slate-500 font-sans">{prog.category}</span>
                                    )}
                                  </div>
                                  <h5 className={`text-xs font-black line-clamp-1 group-hover:text-cyan-300 transition ${
                                    prog.isNow ? 'text-white' : 'text-slate-200'
                                  }`}>
                                    {prog.title}
                                  </h5>
                                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-snug">
                                    {prog.desc}
                                  </p>
                                </div>

                                {/* Progress Bar if Now Playing */}
                                {prog.isNow && (
                                  <div className="mt-2 w-full h-1 bg-black/60 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-400 rounded-full"
                                      style={{ width: `${prog.progress}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Floating Mini-Player Bar at the Bottom */}
          <div className="h-16 px-4 sm:px-8 bg-[#070b18] border-t border-white/10 flex items-center justify-between shrink-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-black border border-white/10 p-1 flex items-center justify-center shrink-0">
                {selectedChannel.logo ? (
                  <img src={selectedChannel.logo} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Tv className="w-5 h-5 text-cyan-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white truncate">{selectedChannel.name}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">({selectedChannel.group})</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {selectedChannel.tagline || (isRtl ? 'البث المباشر عالي الدقة' : 'Live HD Streaming')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPlayFullscreen(selectedChannel)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-2 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                <span>{isRtl ? 'مشاهدة البث الآن' : 'Watch Live'}</span>
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: CLASSIC 3-COLUMN SPLIT VIEW (Channels, Player Stage & EPG) */
        /* ========================================================================= */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Column 1: Groups (Width: 2.5 cols) */}
          <div className="md:col-span-3 lg:col-span-2.5 bg-[#070b18] border-b md:border-b-0 md:border-e border-white/5 flex flex-col min-h-0">
            <div className="p-3 border-b border-white/5 text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center justify-between">
              <span>{t.allCategories}</span>
              <span className="text-cyan-400 font-mono">{groups.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedGroup('ALL')}
                className={`w-full text-start px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  selectedGroup === 'ALL'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/25'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                <span className="truncate">{t.allCategories}</span>
                <span className="text-[10px] font-mono opacity-80">{liveChannels.length}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedGroup('FAVORITES')}
                className={`w-full text-start px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  selectedGroup === 'FAVORITES'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                    : 'text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span className="truncate">{t.favorites}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">{favorites.length}</span>
              </motion.button>

              {groups.map(grp => (
                <motion.button
                  key={grp}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedGroup(grp)}
                  className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    selectedGroup === grp
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="truncate pe-1">{grp}</span>
                  <span className="text-[10px] font-mono opacity-60">
                    {liveChannels.filter(c => c.group === grp).length}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Column 2: Channels List (Width: 4.5 cols) */}
          <div className="md:col-span-4 lg:col-span-4.5 bg-[#050811] border-b md:border-b-0 md:border-e border-white/5 flex flex-col min-h-0">
            <div className="p-3 bg-black/30 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 truncate">
                {selectedGroup === 'ALL' ? t.allChannels : selectedGroup}
              </span>
              <span className="text-[11px] text-cyan-400 font-mono font-bold">
                {filteredChannels.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredChannels.map((channel, index) => {
                const isSelected = selectedChannel?.id === channel.id;
                const isFav = favorites.includes(channel.id);
                const currentEpg = channel.epg?.[0];

                return (
                  <motion.div
                    key={channel.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedChannel(channel)}
                    className={`group p-2.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/80 via-[#0a182d] to-transparent border border-cyan-500/50 shadow-xl shadow-cyan-950/50'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] font-mono font-bold text-slate-500 w-5 text-center shrink-0">
                        {index + 1}
                      </span>

                      <div className="relative w-11 h-11 rounded-xl bg-black/60 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        {channel.logo ? (
                          <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <Tv className="w-5 h-5 text-slate-500" />
                        )}
                        <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-black animate-pulse" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-black truncate ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                            {channel.name}
                          </h4>
                          {channel.resolution && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                              {channel.resolution}
                            </span>
                          )}
                        </div>

                        {currentEpg && (
                          <div className="mt-1">
                            <p className="text-[10px] text-slate-400 truncate">
                              {currentEpg.title}
                            </p>
                            <div className="mt-1 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                                style={{ width: `${currentEpg.progress || 45}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(channel.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-400 transition cursor-pointer"
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-current' : ''}`} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayFullscreen(channel);
                        }}
                        className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-md shadow-cyan-500/30 cursor-pointer"
                        title={t.fullScreen}
                      >
                        <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Live Preview Player Stage & EPG List (Width: 5 cols) */}
          <div className="md:col-span-5 lg:col-span-5 bg-[#070b18] p-4 sm:p-5 flex flex-col justify-between min-h-0 overflow-y-auto space-y-4">
            <AnimatePresence mode="wait">
              {selectedChannel && (
                <motion.div
                  key={selectedChannel.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col space-y-4"
                >
                  {/* Mini Video Player Screen */}
                  <div className="relative aspect-video w-full rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl group">
                    <video
                      ref={previewVideoRef}
                      playsInline
                      autoPlay
                      muted={previewMuted}
                      className="w-full h-full object-contain"
                    />

                    {isPreviewLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-[11px] text-cyan-300 font-bold">جاري استقبال البث المباشر...</span>
                      </div>
                    )}

                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white text-[10px] font-black uppercase shadow">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {t.liveBadge}
                      </span>
                      {selectedChannel.resolution && (
                        <span className="px-2 py-0.5 rounded-md bg-black/80 text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/30">
                          {selectedChannel.resolution}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/60 to-transparent flex items-center justify-between">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPreviewMuted(!previewMuted)}
                        className="p-2 rounded-xl bg-black/80 hover:bg-black text-white border border-white/10 transition cursor-pointer"
                      >
                        {previewMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onPlayFullscreen(selectedChannel)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-2 transition cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'مشاهدة بملء الشاشة' : 'Full Theater'}</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Channel Metadata */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-white">{selectedChannel.name}</h3>
                      <span className="text-xs font-semibold text-cyan-400">{selectedChannel.group}</span>
                    </div>
                    {selectedChannel.tagline && (
                      <p className="text-xs text-slate-400">{selectedChannel.tagline}</p>
                    )}
                  </div>

                  {/* EPG Timeline */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-white">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Calendar className="w-4 h-4" />
                        <span>{t.programGuide}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isRtl ? 'جدول بث اليوم' : 'Daily Schedule'}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {selectedChannel.epg?.map((prog, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition ${
                            idx === 0
                              ? 'bg-gradient-to-r from-emerald-950/30 to-slate-900 border-emerald-500/40 text-emerald-200'
                              : 'bg-white/[0.02] border-white/5 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span className="text-cyan-400 font-mono">{prog.start} - {prog.end}</span>
                            {idx === 0 && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800 animate-pulse">
                                {t.nowPlaying}
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-white mb-0.5">{prog.title}</h5>
                          {prog.desc && <p className="text-[10px] text-slate-400 line-clamp-2">{prog.desc}</p>}
                          {prog.progress !== undefined && (
                            <div className="mt-2 w-full h-1 bg-black/60 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prog.progress}%` }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Program Details Modal */}
      <AnimatePresence>
        {activeProgramModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b1021] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-cyan-950/50 relative"
            >
              <button
                onClick={() => setActiveProgramModal(null)}
                className="absolute top-5 end-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 p-1 flex items-center justify-center shrink-0">
                  {activeProgramModal.channel.logo ? (
                    <img src={activeProgramModal.channel.logo} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Tv className="w-6 h-6 text-cyan-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{activeProgramModal.channel.name}</h3>
                    {activeProgramModal.channel.resolution && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-black text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                        {activeProgramModal.channel.resolution}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-cyan-400 font-semibold">{activeProgramModal.channel.group}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {activeProgramModal.program.startStr} - {activeProgramModal.program.endStr}
                  </span>
                  {activeProgramModal.program.isNow && (
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase animate-pulse">
                      {t.liveBadge} ({activeProgramModal.program.progress}%)
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-black text-white">
                  {activeProgramModal.program.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeProgramModal.program.desc}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveProgramModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  {t.close}
                </button>

                <button
                  onClick={() => {
                    const ch = activeProgramModal.channel;
                    setActiveProgramModal(null);
                    onPlayFullscreen(ch);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 flex items-center gap-2 transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  <span>{isRtl ? 'تشغيل القناة الآن' : 'Watch Channel'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

