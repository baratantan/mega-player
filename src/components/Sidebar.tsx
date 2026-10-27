import React from 'react';
import { 
  Home,
  Tv, 
  Film, 
  Clapperboard, 
  Radio, 
  Star, 
  History, 
  Grid2X2, 
  CalendarDays,
  Keyboard,
  Info
} from 'lucide-react';
import { MainNavView } from '../types';
import { Language, translations } from '../utils/translations';

export type MainTab = MainNavView;

interface SidebarProps {
  lang: Language;
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  counts: {
    live: number;
    movie: number;
    series: number;
    radio: number;
    favorites: number;
    recent: number;
  };
  onOpenEpg: () => void;
  onOpenShortcuts: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  lang,
  activeTab,
  onSelectTab,
  counts,
  onOpenEpg,
  onOpenShortcuts,
}) => {
  const t = translations[lang];

  const navItems: Array<{
    id: MainTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
    color: string;
  }> = [
    {
      id: 'home',
      label: lang === 'ar' ? 'الرئيسية (Dashboard)' : 'Home Hub',
      icon: <Home className="w-4 h-4" />,
      color: 'text-cyan-400',
    },
    {
      id: 'live',
      label: t.liveTv,
      icon: <Tv className="w-4 h-4" />,
      count: counts.live,
      color: 'text-red-400',
    },
    {
      id: 'movie',
      label: t.movies,
      icon: <Film className="w-4 h-4" />,
      count: counts.movie,
      color: 'text-amber-400',
    },
    {
      id: 'series',
      label: t.series,
      icon: <Clapperboard className="w-4 h-4" />,
      count: counts.series,
      color: 'text-purple-400',
    },
    {
      id: 'radio',
      label: t.radio,
      icon: <Radio className="w-4 h-4" />,
      count: counts.radio,
      color: 'text-emerald-400',
    },
    {
      id: 'favorites',
      label: t.favorites,
      icon: <Star className="w-4 h-4 fill-current" />,
      count: counts.favorites,
      color: 'text-yellow-400',
    },
    {
      id: 'recent',
      label: t.recent,
      icon: <History className="w-4 h-4" />,
      count: counts.recent,
      color: 'text-blue-400',
    },
    {
      id: 'multiview',
      label: t.multiScreen,
      icon: <Grid2X2 className="w-4 h-4" />,
      color: 'text-indigo-400',
    },
  ];

  return (
    <aside className="w-full md:w-56 lg:w-60 shrink-0 bg-slate-950 md:border-e border-slate-800/80 p-2.5 sm:p-3 flex md:flex-col justify-between overflow-x-auto md:overflow-y-auto">
      {/* Primary Navigation */}
      <div className="flex md:flex-col gap-1 w-full">
        <div className="hidden md:block px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-white border border-cyan-500/40 shadow-sm shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? item.color : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Utilities (Desktop) */}
      <div className="hidden md:flex flex-col gap-1 pt-3 mt-3 border-t border-slate-800/80">
        <button
          id="epg-guide-btn"
          onClick={onOpenEpg}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
        >
          <CalendarDays className="w-4 h-4 text-emerald-400" />
          <span>{t.programGuide}</span>
        </button>

        <button
          id="keyboard-shortcuts-btn"
          onClick={onOpenShortcuts}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
        >
          <Keyboard className="w-4 h-4 text-slate-400" />
          <span>{t.keyboardShortcuts}</span>
        </button>
      </div>
    </aside>
  );
};
