import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Info, 
  Star, 
  Plus, 
  Check, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PlaylistItem } from '../types';
import { Language, translations } from '../utils/translations';

interface HeroBillboardProps {
  featuredItems: PlaylistItem[];
  onPlay: (item: PlaylistItem) => void;
  onOpenDetails: (item: PlaylistItem) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  lang: Language;
}

export const HeroBillboard: React.FC<HeroBillboardProps> = ({
  featuredItems,
  onPlay,
  onOpenDetails,
  favorites,
  onToggleFavorite,
  lang,
}) => {
  const t = translations[lang];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cap billboard items strictly to top 8 featured items to avoid thousands of DOM elements
  const displayItems = React.useMemo(() => {
    return (featuredItems || []).slice(0, 8);
  }, [featuredItems]);

  const activeItem = displayItems[currentIndex] || displayItems[0];

  // Auto rotate billboard every 8 seconds
  useEffect(() => {
    if (displayItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % displayItems.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [displayItems.length, currentIndex]);

  const handleNext = () => {
    if (displayItems.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % displayItems.length);
  };

  const handlePrev = () => {
    if (displayItems.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + displayItems.length) % displayItems.length);
  };

  if (!activeItem) return null;

  const isFav = favorites.includes(activeItem.id);
  const artworkUrl = activeItem.backdrop || activeItem.logo;

  return (
    <div className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[88vh] min-h-[520px] max-h-[920px] overflow-hidden">
      {/* High-Resolution Dynamic Backdrop Artwork with Crossfade Animation */}
      <div className="absolute inset-0 select-none overflow-hidden bg-gradient-to-br from-slate-950 via-cyan-950/40 to-[#050811]">
        <AnimatePresence mode="wait">
          {artworkUrl ? (
            <motion.img
              key={activeItem.id}
              src={artworkUrl}
              alt={activeItem.name}
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
              animate={{ opacity: 0.85, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
              transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
              className="w-full h-full object-cover object-center transform"
              onError={(e) => {
                // If image fails, hide it gracefully
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <motion.div
              key={`fallback-${activeItem.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="w-full h-full bg-gradient-to-tr from-cyan-950/60 via-slate-900 to-indigo-950/50 flex items-center justify-center"
            />
          )}
        </AnimatePresence>

        {/* Dynamic Dark Gradient Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050811] via-[#050811]/40 to-transparent rtl:bg-gradient-to-l rtl:from-[#050811] rtl:via-[#050811]/40 rtl:to-transparent" />
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#050811]/90 to-transparent" />
      </div>

      {/* Hero Content Area with Staggered Entrance */}
      <div className="relative z-10 h-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col justify-end pb-16 sm:pb-20 lg:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-5"
          >
            {/* Top Feature Pill & Tags */}
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-wrap items-center gap-2.5"
            >
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-red-600/30">
                <Sparkles className="w-3.5 h-3.5" />
                {activeItem.category === 'live' ? t.liveBadge : (lang === 'ar' ? 'مختار سينمائي 4K' : 'Featured 4K')}
              </span>

              {activeItem.resolution && (
                <span className="px-2.5 py-0.5 rounded-lg bg-black/60 text-cyan-400 border border-cyan-500/40 text-xs font-black">
                  {activeItem.resolution}
                </span>
              )}

              {activeItem.rating && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {activeItem.rating}
                </span>
              )}

              {activeItem.year && (
                <span className="text-xs font-semibold text-slate-300">
                  {activeItem.year}
                </span>
              )}

              {activeItem.duration && (
                <span className="text-xs font-semibold text-slate-400">
                  • {activeItem.duration}
                </span>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-2xl"
            >
              {activeItem.name}
            </motion.h1>

            {/* Tagline / Genres */}
            {activeItem.tagline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-sm sm:text-base font-bold text-cyan-300 drop-shadow"
              >
                {activeItem.tagline}
              </motion.p>
            )}

            {/* Synopsis */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-xs sm:text-sm text-slate-300/90 line-clamp-3 leading-relaxed max-w-2xl drop-shadow"
            >
              {activeItem.synopsis || (lang === 'ar' ? 'استمتع بالبث السينمائي عالي الجودة والأداء الفائق عبر منصة Cinema Pro.' : 'Experience breathtaking high definition digital streaming on Cinema Pro.')}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <motion.button
                id="billboard-play-btn"
                tabIndex={0}
                data-tv-focusable="true"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPlay(activeItem)}
                className="tv-focusable px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/30 flex items-center gap-2.5 transition-all duration-200 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
                <span>{lang === 'ar' ? 'تشغيل الآن' : 'Watch Now'}</span>
              </motion.button>

              <motion.button
                id="billboard-details-btn"
                tabIndex={0}
                data-tv-focusable="true"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onOpenDetails(activeItem)}
                className="tv-focusable px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <Info className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تفاصيل العمل' : 'More Info'}</span>
              </motion.button>

              <motion.button
                tabIndex={0}
                data-tv-focusable="true"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onToggleFavorite(activeItem.id)}
                className={`tv-focusable p-3.5 rounded-2xl border backdrop-blur-xl transition-all cursor-pointer ${
                  isFav
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/10 hover:bg-white/20 text-slate-300 border-white/20'
                }`}
                title={t.favorites}
              >
                {isFav ? <Check className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5" />}
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Slide Switchers */}
        <div className="absolute bottom-16 sm:bottom-20 end-4 sm:end-8 lg:end-12 flex items-center gap-3 z-20">
          <motion.button
            tabIndex={0}
            data-tv-focusable="true"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrev}
            className="tv-focusable p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xl transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </motion.button>
          <div className="flex items-center gap-1.5">
            {displayItems.map((_, idx) => (
              <button
                key={idx}
                tabIndex={0}
                data-tv-focusable="true"
                onClick={() => setCurrentIndex(idx)}
                className={`tv-focusable h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-cyan-400 shadow-md shadow-cyan-400' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
          <motion.button
            tabIndex={0}
            data-tv-focusable="true"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className="tv-focusable p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-xl transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
