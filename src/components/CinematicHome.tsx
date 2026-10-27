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
  History
} from 'lucide-react';
import { PlaylistItem, MainNavView, WatchProgress } from '../types';
import { Language, translations } from '../utils/translations';
import { HeroBillboard } from './HeroBillboard';
import { ContentCarousel } from './ContentCarousel';

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
  lang,
}) => {
  const t = translations[lang];

  // Dynamic ambient backdrop based on hovered item
  const [hoveredBackdrop, setHoveredBackdrop] = useState<string | null>(null);

  // Continue watching items based on saved progress and recent items
  const continueWatchingItems = useMemo(() => {
    const fromProgress = watchProgressList
      .filter(p => !p.completed && p.currentTime > 5)
      .map(p => {
        const found = channels.find(c => c.id === p.id);
        if (found) return found;
        return {
          id: p.id,
          name: p.name,
          url: p.url,
          logo: p.logo,
          backdrop: p.backdrop,
          category: p.category,
          group: p.group || 'VOD',
        } as PlaylistItem;
      });

    const combined: PlaylistItem[] = [...fromProgress];
    for (const r of recentChannels) {
      if (!combined.some(c => c.id === r.id)) {
        combined.push(r);
      }
    }
    return combined;
  }, [watchProgressList, channels, recentChannels]);

  // Group items by category & attributes
  const featuredBillboardItems = channels.filter(c => c.backdrop || c.rating);
  const liveChannels = channels.filter(c => c.category === 'live');
  const movieChannels = channels.filter(c => c.category === 'movie');
  const seriesChannels = channels.filter(c => c.category === 'series');
  const radioChannels = channels.filter(c => c.category === 'radio');
  const favoriteItems = channels.filter(c => favorites.includes(c.id));

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
