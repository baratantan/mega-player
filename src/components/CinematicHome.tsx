import React, { useState, useMemo } from 'react';
import { 
  Tv, 
  Film, 
  Clapperboard, 
  Radio, 
  Grid2X2, 
  Star, 
  Sparkles, 
  Flame, 
  TrendingUp,
  History,
  Baby
} from 'lucide-react';
import { PlaylistItem, MainNavView, WatchProgress } from '../types';
import { Language, translations } from '../utils/translations';
import { HeroBillboard } from './HeroBillboard';
import { ContentCarousel } from './ContentCarousel';
import { useIptv } from '../context/IptvContext';

interface CinematicHomeProps {
  channels: PlaylistItem[];
  favorites: string[];
  recentChannels: PlaylistItem[];
  watchProgressList?: WatchProgress[];
  watchProgressMap?: Record<string, WatchProgress>;
  onPlay: (item: PlaylistItem) => void;
  onOpenDetails: (item: PlaylistItem) => void;
  onToggleFavorite: (id: string) => void;
  onSelectTab: (tab: MainNavView) => void;
  onOpenAddModal?: (tab?: 'url' | 'file' | 'xtream' | 'preset') => void;
  lang: Language;
}

export const CinematicHome: React.FC<CinematicHomeProps> = ({
  channels,
  favorites,
  recentChannels,
  watchProgressList = [],
  watchProgressMap = {},
  onPlay,
  onOpenDetails,
  onToggleFavorite,
  onSelectTab,
  onOpenAddModal,
  lang,
}) => {
  const t = translations[lang];
  const { isKidsMode, activeProfile, isChannelsLoading, switchProfile } = useIptv();

  // Dynamic ambient backdrop based on hovered item
  const [hoveredBackdrop, setHoveredBackdrop] = useState<string | null>(null);

  // Continue watching items based on saved progress and recent items
  const continueWatchingItems = useMemo(() => {
    const fromProgress = watchProgressList
      .filter(p => !p.completed && p.currentTime > 5)
      .map(p => {
        const found = channels.find(c => c.id === p.itemId);
        if (found) return found;
        return p.item;
      })
      .filter(Boolean) as PlaylistItem[];

    const combined: PlaylistItem[] = [...fromProgress];
    for (const r of recentChannels) {
      if (!combined.some(c => c.id === r.id)) {
        combined.push(r);
      }
    }
    return combined.slice(0, 20);
  }, [watchProgressList, channels, recentChannels]);

  // Group items by category & attributes (memoized)
  const liveChannels = useMemo(() => channels.filter(c => c.category === 'live'), [channels]);
  const movieChannels = useMemo(() => channels.filter(c => c.category === 'movie'), [channels]);
  const seriesChannels = useMemo(() => channels.filter(c => c.category === 'series'), [channels]);
  const radioChannels = useMemo(() => channels.filter(c => c.category === 'radio'), [channels]);

  const featuredBillboardItems = useMemo(() => {
    const withArt = channels.filter(c => c.backdrop || (c.category !== 'live' && c.logo) || c.rating);
    if (withArt.length > 0) return withArt.slice(0, 8);
    return channels.slice(0, 8);
  }, [channels]);

  // If channels are loading in the background from IndexedDB
  const isWaitingForChannels = isChannelsLoading || (activeProfile && (activeProfile.channelCount || 0) > 0 && channels.length === 0);

  if (channels.length === 0) {
    return (
      <div className="relative min-h-screen bg-[#050811] text-white pt-28 pb-20 px-4 flex flex-col items-center justify-center text-center">
        {/* Dynamic Background Glow */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-20 blur-3xl bg-gradient-to-tr from-cyan-900 via-slate-900 to-indigo-950" />

        <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col items-center gap-5">
          {isWaitingForChannels ? (
            <>
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin shadow-xl shadow-cyan-500/30" />
                <Tv className="w-7 h-7 text-cyan-400 absolute" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">
                  {lang === 'ar' ? 'جاري تجهيز ومزامنة القنوات...' : 'Loading Subscription Channels...'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'ar'
                    ? `جاري قراءة بيانات باقة "${activeProfile?.name || 'الباقة'}" وحفظها في الذاكرة السريعة دون استهلاك لموارد الهاتف.`
                    : `Loading channels for "${activeProfile?.name || 'Subscription'}" into local high-speed cache.`}
                </p>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full w-2/3 animate-pulse rounded-full" />
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Tv className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">
                  {lang === 'ar' ? 'لا توجد قنوات في هذه الباقة' : 'No Channels in this Playlist'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'ar'
                    ? 'يمكنك إضافة اشتراك جديد (Xtream / M3U) أو التبديل إلى باقة Cinema Pro الافتراضية.'
                    : 'Add a new subscription or switch back to the Cinema Pro default playlist.'}
                </p>
              </div>

              <div className="flex flex-col w-full gap-2.5 pt-2">
                {onOpenAddModal && (
                  <button
                    onClick={() => onOpenAddModal('url')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition active:scale-95"
                  >
                    {lang === 'ar' ? '+ إضافة اشتراك أو ملف' : '+ Add Playlist'}
                  </button>
                )}
                <button
                  onClick={() => switchProfile('default_preset')}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition"
                >
                  {lang === 'ar' ? 'تشغيل الباقة الافتراضية (Cinema Pro)' : 'Switch to Default Preset'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050811] text-white pb-20 overflow-x-hidden">
      {/* Dynamic Background Backdrop Blur (Ambient Illumination) */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20 blur-3xl transition-all duration-1000 scale-125"
        style={{
          backgroundImage: hoveredBackdrop ? `url(${hoveredBackdrop})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 space-y-8 sm:space-y-12">
        {/* 1. Hero Billboard Spotlight (Top Netflix/Apple TV banner) */}
        <HeroBillboard
          featuredItems={featuredBillboardItems.length > 0 ? featuredBillboardItems : channels.slice(0, 5)}
          onPlay={onPlay}
          onOpenDetails={onOpenDetails}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          lang={lang}
        />

        {/* Kids Mode Safe Viewing Banner */}
        {isKidsMode && (
          <div className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/40 flex items-center justify-between gap-4 shadow-xl shadow-purple-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{lang === 'ar' ? 'وضع الأطفال والعائلة نَشِط' : 'Kids Mode Active'}</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">
                      {lang === 'ar' ? 'محتوى آمن 100%' : 'Family Safe'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    {lang === 'ar' ? 'تمت تصفية القنوات والأفلام لتناسب الأطفال والعائلة مع قفل الباقات الحساسة تلقائياً.' : 'Channels & VOD are filtered for safe family viewing.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Fast Access Category Hub Pills (Cinema / Live / Series / Multi-View) */}
        <div className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <button
              tabIndex={0}
              data-tv-focusable="true"
              onClick={() => onSelectTab('live')}
              className="tv-focusable group p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900/60 border border-cyan-500/20 hover:border-cyan-400/60 flex items-center gap-3.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-950/40 text-start cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-focus:scale-110 transition-transform">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-white block group-hover:text-cyan-300 group-focus:text-cyan-300">
                  {t.liveTv}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {liveChannels.length} {t.allChannels}
                </span>
              </div>
            </button>

            <button
              tabIndex={0}
              data-tv-focusable="true"
              onClick={() => onSelectTab('movie')}
              className="tv-focusable group p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900/60 border border-amber-500/20 hover:border-amber-400/60 flex items-center gap-3.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-950/40 text-start cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-focus:scale-110 transition-transform">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-white block group-hover:text-amber-300 group-focus:text-amber-300">
                  {t.movies}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {movieChannels.length} {lang === 'ar' ? 'أفلام 4K' : '4K Movies'}
                </span>
              </div>
            </button>

            <button
              tabIndex={0}
              data-tv-focusable="true"
              onClick={() => onSelectTab('series')}
              className="tv-focusable group p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900/60 border border-purple-500/20 hover:border-purple-400/60 flex items-center gap-3.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-950/40 text-start cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-focus:scale-110 transition-transform">
                <Clapperboard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-white block group-hover:text-purple-300 group-focus:text-purple-300">
                  {t.series}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {seriesChannels.length} {lang === 'ar' ? 'سلاسل ومواسم' : 'Series'}
                </span>
              </div>
            </button>

            <button
              tabIndex={0}
              data-tv-focusable="true"
              onClick={() => onSelectTab('multiview')}
              className="tv-focusable group p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/20 hover:border-indigo-400/60 flex items-center gap-3.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-950/40 text-start cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-focus:scale-110 transition-transform">
                <Grid2X2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-white block group-hover:text-indigo-300 group-focus:text-indigo-300">
                  {t.multiScreen}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {lang === 'ar' ? 'شاشات متعددة' : 'Quad View'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 3. Continue Watching Horizontal Rail (Continue Watching) */}
        {continueWatchingItems.length > 0 && (
          <ContentCarousel
            title={lang === 'ar' ? 'متابعة المشاهدة (المشاهدات الأخيرة)' : 'Continue Watching'}
            subtitle={lang === 'ar' ? 'تابع المشاهدة من حيث توقفت مع حفظ التوقيت التلقائي' : 'Pick up right where you left off'}
            items={continueWatchingItems}
            onPlay={onPlay}
            onOpenDetails={onOpenDetails}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            lang={lang}
            cardShape="backdrop"
            watchProgressMap={watchProgressMap}
            onHoverItem={(item) => setHoveredBackdrop(item?.backdrop || item?.logo || null)}
          />
        )}

        {/* 4. Top Live Channels Horizontal Grid (with logos) */}
        <ContentCarousel
          title={lang === 'ar' ? 'قنوات البث التلفزيوني المباشر' : 'Live Television Channels'}
          subtitle={lang === 'ar' ? 'أخبار، رياضة، علوم، وثائقيات، وإسلاميات بجودة فائقة' : 'News, Sports, Science and Islamic channels'}
          items={liveChannels}
          onPlay={onPlay}
          onOpenDetails={onOpenDetails}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          lang={lang}
          cardShape="backdrop"
          watchProgressMap={watchProgressMap}
          onHoverItem={(item) => setHoveredBackdrop(item?.backdrop || item?.logo || null)}
        />

        {/* 5. 4K Cinema Movies Carousel */}
        <ContentCarousel
          title={lang === 'ar' ? 'أفلام سينمائية عالمية بجودة 4K' : '4K Cinema Blockbusters'}
          subtitle={lang === 'ar' ? 'أحدث الإنتاجات السينمائية بتجربة مسرحية متكاملة' : 'High bitrate theater releases and features'}
          items={movieChannels}
          onPlay={onPlay}
          onOpenDetails={onOpenDetails}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          lang={lang}
          cardShape="poster"
          watchProgressMap={watchProgressMap}
          onHoverItem={(item) => setHoveredBackdrop(item?.backdrop || item?.logo || null)}
        />

        {/* 6. Popular Series & Shows */}
        {seriesChannels.length > 0 && (
          <ContentCarousel
            title={lang === 'ar' ? 'مسلسلات وسلاسل وثائقية حصرية' : 'Exclusive Series & Shows'}
            subtitle={lang === 'ar' ? 'حلقات كاملة ومواسم بجودة عالية' : 'Binge-worthy original docuseries and dramas'}
            items={seriesChannels}
            onPlay={onPlay}
            onOpenDetails={onOpenDetails}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            lang={lang}
            cardShape="poster"
            watchProgressMap={watchProgressMap}
            onHoverItem={(item) => setHoveredBackdrop(item?.backdrop || item?.logo || null)}
          />
        )}

        {/* 7. Radio & Audio Stations */}
        {radioChannels.length > 0 && (
          <ContentCarousel
            title={t.radio}
            subtitle={lang === 'ar' ? 'بث إذاعي حي ومباشر على مدار الساعة' : 'Live Radio Broadcasts'}
            items={radioChannels}
            onPlay={onPlay}
            onOpenDetails={onOpenDetails}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            lang={lang}
            cardShape="logo"
          />
        )}
      </div>
    </div>
  );
};
