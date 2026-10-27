import React from 'react';
import { Play, Star, Clock, Calendar, X, Film, Sparkles } from 'lucide-react';
import { PlaylistItem } from '../types';
import { Language, translations } from '../utils/translations';

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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (movie) {
          e.preventDefault();
          onPlay(movie);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movie, onPlay, onClose]);

  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95">
        {/* Poster side */}
        <div className="md:w-5/12 bg-slate-950 relative aspect-[16/10] md:aspect-auto">
          {movie.logo ? (
            <img
              src={movie.logo}
              alt={movie.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Film className="w-16 h-16 text-cyan-500/50" />
            </div>
          )}
          {movie.resolution && (
            <span className="absolute top-3 start-3 px-2.5 py-1 text-xs font-black rounded-lg bg-slate-950/80 text-cyan-400 border border-cyan-500/30">
              {movie.resolution}
            </span>
          )}
        </div>

        {/* Content Side */}
        <div className="md:w-7/12 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                {movie.name}
              </h2>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
              {movie.rating && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1 border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {movie.rating} / 10
                </span>
              )}
              {movie.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {movie.year}
                </span>
              )}
              {movie.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {movie.duration}
                </span>
              )}
            </div>

            <div className="mb-4">
              <span className="text-xs font-bold text-slate-300 block mb-1">
                {lang === 'ar' ? 'نبذة عن العمل:' : 'Synopsis:'}
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                {movie.synopsis || (lang === 'ar' ? 'استمتع بمشاهدة هذا العمل السينمائي بجودة فائقة الدقة.' : 'Enjoy watching this feature title in high definition.')}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              {t.close}
            </button>
            <button
              onClick={() => {
                onPlay(movie);
                onClose();
              }}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950 flex items-center gap-2 transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
              <span>{lang === 'ar' ? 'تشغيل الفيلم الآن' : 'Play Movie'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
