import React, { useState, useEffect } from 'react';
import { Play, Star, Clock, Calendar, X, Film, Sparkles, Youtube, CheckCircle2, User, Clapperboard } from 'lucide-react';
import { PlaylistItem } from '../types';
import { Language, translations } from '../utils/translations';
import { tmdbService, EnrichedMediaMetadata } from '../services/tmdbService';
import { useIptv } from '../context/IptvContext';

interface MovieDetailsModalProps {
  movie: PlaylistItem | null;
  onPlay: (movie: PlaylistItem) => void;
  onClose: () => void;
  lang: Language;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  onPlay,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const { watchProgressMap } = useIptv();
  
  const [enriched, setEnriched] = useState<EnrichedMediaMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState<boolean>(true);
  const [showTrailer, setShowTrailer] = useState<boolean>(false);

  // Check if item has watch progress
  const progress = movie ? watchProgressMap[movie.id] : null;

  useEffect(() => {
    if (!movie) return;
    let isMounted = true;
    setLoadingMetadata(true);
    setShowTrailer(false);

    tmdbService.getEnrichedMetadata(movie.name, movie.logo, movie.backdrop)
      .then(data => {
        if (isMounted) {
          setEnriched(data);
          setLoadingMetadata(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingMetadata(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movie]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        if (showTrailer) {
          setShowTrailer(false);
        } else {
          onClose();
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (movie && !showTrailer) {
          e.preventDefault();
          onPlay(movie);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movie, onPlay, onClose, showTrailer]);

  if (!movie) return null;

  const displayTitle = enriched?.title || movie.name;
  const displayOverview = enriched?.overview || movie.synopsis || (lang === 'ar' ? 'استمتع بمشاهدة هذا العمل السينمائي بأعلى جودة متوفرة وصوت محيطي نقي.' : 'Enjoy this cinematic blockbuster in ultra-high bitrate.');
  const displayPoster = enriched?.posterUrl || movie.logo;
  const displayBackdrop = enriched?.backdropUrl || movie.backdrop || movie.logo;
  const displayRating = enriched?.rating || movie.rating || 8.4;
  const displayYear = enriched?.year || movie.year || 2024;
  const displayDuration = enriched?.duration || movie.duration || '1h 50m';
  const displayGenres = enriched?.genres || movie.genres || (lang === 'ar' ? ['سينما', 'تشويق'] : ['Cinema', 'Action']);
  const trailerKey = enriched?.trailerYoutubeKey || movie.trailerYoutubeKey;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 relative">
        
        {/* Backdrop Banner Header with overlay gradient */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-950 overflow-hidden shrink-0">
          {displayBackdrop ? (
            <img
              src={displayBackdrop}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center brightness-75 scale-105 filter blur-[0.5px]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-cyan-950 via-slate-900 to-indigo-950" />
          )}

          {/* Deep Dark Gradients for seamless integration */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-transparent to-slate-900/40" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 end-4 w-9 h-9 rounded-full bg-slate-950/80 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition shadow-lg z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Resolution Badge */}
          <div className="absolute top-4 start-4 flex items-center gap-2 z-10">
            <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-cyan-500/90 text-slate-950 shadow-md">
              {movie.resolution || '4K ULTRA HD'}
            </span>
            {enriched?.source === 'catalog' && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-current" />
                TMDB Verified
              </span>
            )}
          </div>

          {/* Trailer Modal Player Inside Header */}
          {showTrailer && trailerKey && (
            <div className="absolute inset-0 z-30 bg-black flex flex-col">
              <div className="absolute top-3 end-3 z-40">
                <button
                  onClick={() => setShowTrailer(false)}
                  className="px-3 py-1 rounded-full bg-black/80 text-white text-xs font-bold border border-white/20 flex items-center gap-1 hover:bg-rose-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'إغلاق الإعلان' : 'Close Trailer'}
                </button>
              </div>
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0`}
                title="Trailer"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 -mt-10 relative z-10">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            
            {/* Floating Mini Poster */}
            <div className="w-24 sm:w-32 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/80 shadow-2xl shrink-0 hidden sm:block">
              {displayPoster ? (
                <img
                  src={displayPoster}
                  alt={movie.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Film className="w-8 h-8 text-cyan-400/50" />
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 space-y-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {displayTitle}
              </h2>

              {/* Meta Chips */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1.5 border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                  {displayRating} / 10
                </span>

                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {displayYear}
                </span>

                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {displayDuration}
                </span>

                <span className="px-2 py-1 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold">
                  {movie.group || (lang === 'ar' ? 'سينما 4K' : '4K Cinema')}
                </span>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {displayGenres.map((g, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Continue Watching Progress Banner (if exists) */}
          {progress && progress.progressPercent > 0 && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">
                    {lang === 'ar' ? 'لديك نقطة توقف سابقة' : 'Resume Playback Available'}
                  </div>
                  <div className="text-[11px] text-cyan-300 font-mono">
                    {Math.floor(progress.currentTime / 60)}:{(Math.floor(progress.currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(progress.duration / 60)}:{(Math.floor(progress.duration % 60)).toString().padStart(2, '0')} ({progress.progressPercent}%)
                  </div>
                </div>
              </div>
              <div className="w-24 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Overview / Story Synopsis */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {lang === 'ar' ? 'قصة العمل السينمائي:' : 'Synopsis:'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed font-normal">
              {displayOverview}
            </p>
          </div>

          {/* Cast & Director */}
          {(enriched?.cast || enriched?.director) && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              {enriched.director && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clapperboard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-slate-300">{lang === 'ar' ? 'المخرج:' : 'Director:'}</span>
                  <span>{enriched.director}</span>
                </div>
              )}
              {enriched.cast && enriched.cast.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <User className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300 me-2">{lang === 'ar' ? 'طاقم التمثيل:' : 'Cast:'}</span>
                    <span className="text-slate-400">{enriched.cast.join(' • ')}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Trailer Button */}
          {trailerKey ? (
            <button
              onClick={() => setShowTrailer(prev => !prev)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-rose-400 hover:text-rose-300 font-bold text-xs border border-rose-500/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Youtube className="w-4 h-4 fill-current" />
              <span>{showTrailer ? (lang === 'ar' ? 'إخفاء الإعلان' : 'Hide Trailer') : (lang === 'ar' ? 'مشاهدة الإعلان الرسمي' : 'Watch Official Trailer')}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 ms-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              {t.close}
            </button>

            <button
              onClick={() => {
                onPlay(movie);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {progress && progress.progressPercent > 0
                  ? (lang === 'ar' ? 'استئناف المشاهدة' : 'Resume Movie')
                  : (lang === 'ar' ? 'تشغيل الفيلم الآن' : 'Play Movie Now')}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
