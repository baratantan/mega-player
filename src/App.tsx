/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlaylistItem, 
  PlayerSettings,
  MainNavView
} from './types';
import { Language, translations } from './utils/translations';
import { useIptv } from './context/IptvContext';
import { CinematicNavbar } from './components/CinematicNavbar';
import { CinematicHome } from './components/CinematicHome';
import { TivimateLiveTv } from './components/TivimateLiveTv';
import { CinematicVod } from './components/CinematicVod';
import { ChannelList } from './components/ChannelList';
import { VideoPlayer } from './components/VideoPlayer';
import { MultiScreenView } from './components/MultiScreenView';
import { AddPlaylistModal } from './components/AddPlaylistModal';
import { EpgModal } from './components/EpgModal';
import { SettingsModal } from './components/SettingsModal';
import { ErrorDiagnosticsModal } from './components/ErrorDiagnosticsModal';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { SearchModal } from './components/SearchModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { PremiumLicenseModal } from './components/PremiumLicenseModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTvNavigation } from './hooks/useTvNavigation';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Gamepad2, Heart, HeartOff, PlayCircle, CheckCircle2, Info, Smartphone, Download, X as CloseIcon } from 'lucide-react';

const STORAGE_KEY_SETTINGS = 'iptv_cinema_settings_v2';
const STORAGE_KEY_LANG = 'iptv_cinema_lang_v2';
const STORAGE_KEY_DISMISSED_INSTALL = 'iptv_cinema_dismissed_install_v1';

export default function App() {
  // 1. IPTV Context Integration
  const {
    channels,
    profiles,
    activeProfile,
    switchProfile,
    favorites,
    toggleFavorite,
    recents,
    addToRecents,
    watchProgressList,
    watchProgressMap,
    toast,
  } = useIptv();

  // 2. Language state
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    return saved === 'en' ? 'en' : 'ar';
  });

  // 3. Player settings
  const [settings, setSettings] = useState<PlayerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      aspectRatio: '16:9',
      volume: 1,
      muted: false,
      autoPlayNext: true,
      playbackSpeed: 1,
      language: 'ar',
      proxyStreams: true,
      theme: 'cinematic',
      pipSupported: true,
    };
  });

  // 4. Navigation and View
  const [activeTab, setActiveTab] = useState<MainNavView>('home');
  const [currentPlayingItem, setCurrentPlayingItem] = useState<PlaylistItem | null>(null);
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<PlaylistItem | null>(null);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addModalInitialTab, setAddModalInitialTab] = useState<'url' | 'file' | 'xtream' | 'preset'>('url');
  const [isEpgModalOpen, setIsEpgModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'android' | 'subscription' | 'diagnostics' | 'parental' | 'general' | 'shortcuts' | 'logs'>('subscription');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAndroidInstallOpen, setIsAndroidInstallOpen] = useState<boolean>(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false);
  const [dismissedMobileBanner, setDismissedMobileBanner] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_DISMISSED_INSTALL) === 'true';
  });

  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePWAInstall();

  // Screen Wake-Lock: Keeps Android phone screen awake while watching video streams
  useEffect(() => {
    let wakeLockSentinel: any = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && currentPlayingItem) {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        } catch (e) {
          console.warn('Wake Lock request ignored:', e);
        }
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [currentPlayingItem]);

  const handleOpenAddModal = (tab: 'url' | 'file' | 'xtream' | 'preset' = 'url') => {
    setAddModalInitialTab(tab);
    setIsAddModalOpen(true);
  };

  // TV / D-Pad Remote Navigation System
  const isAnyModalOpen = isAddModalOpen || isEpgModalOpen || isSettingsOpen || isErrorModalOpen || isSearchOpen || isAndroidInstallOpen || isLicenseModalOpen || !!selectedMovieForDetails || !!currentPlayingItem;
  const { isTvModeActive } = useTvNavigation({
    isModalOpen: isAnyModalOpen,
    activeTab,
    lang,
  });

  // Navbar scroll tracking
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANG, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Play item
  const handlePlayItem = (item: PlaylistItem) => {
    setCurrentPlayingItem(item);
    addToRecents(item);
  };

  const handleResetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleToggleLang = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const recentIds = useMemo(() => recents.map(r => r.id), [recents]);

  return (
    <div 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#050811] text-white flex flex-col font-['Tajawal','Cairo',sans-serif] selection:bg-cyan-500 selection:text-black overflow-x-hidden"
    >
      {/* Floating Cinematic Glass Navbar (Apple TV / Netflix) */}
      <CinematicNavbar
        lang={lang}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        playlists={profiles}
        activePlaylistId={activeProfile?.id || 'default_preset'}
        onSelectPlaylist={switchProfile}
        onOpenAddModal={handleOpenAddModal}
        onOpenSettings={() => {
          setSettingsInitialTab('subscription');
          setIsSettingsOpen(true);
        }}
        onOpenErrorModal={() => setIsErrorModalOpen(true)}
        onOpenEpg={() => setIsEpgModalOpen(true)}
        onOpenMultiView={() => setActiveTab('multiview')}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleLang={handleToggleLang}
        isScrolled={isScrolled}
        onOpenAndroidInstall={() => setIsAndroidInstallOpen(true)}
        onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
      />

      {/* ANDROID APP INSTALL INVITATION BANNER (شريط تحويل الموقع لتطبيق أندرويد حقيقي) */}
      {!isStandalone && !isInstalled && !dismissedMobileBanner && (
        <div className="pt-16 sm:pt-20 px-3 sm:px-6 max-w-[1700px] mx-auto w-full">
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-indigo-950/80 border border-cyan-500/30 backdrop-blur-xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 p-[1px] shrink-0 shadow-md shadow-cyan-500/20">
                <div className="w-full h-full bg-[#080d1a] rounded-[11px] flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-white">
                    {lang === 'ar' ? 'حوّل الموقع إلى تطبيق أندرويد حقيقي' : 'Transform to Real Android App'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    4K APK
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                  {lang === 'ar' 
                    ? 'مشاهدة سينمائية كاملة بدون شريط المتصفح Chrome مع سرعة فائقة وتحديث فوري'
                    : 'Watch fullscreen without Chrome URL bar, with instant startup and wake lock'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAndroidInstallOpen(true)}
                className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/25 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}</span>
              </button>

              <button
                onClick={() => {
                  setDismissedMobileBanner(true);
                  localStorage.setItem(STORAGE_KEY_DISMISSED_INSTALL, 'true');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                title={lang === 'ar' ? 'إغلاق' : 'Dismiss'}
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View Switcher with Smooth Page Transitions */}
      <main className={`flex-1 flex flex-col min-w-0 min-h-0 bg-[#050811] pb-16 md:pb-0 ${
        !isStandalone && !isInstalled && !dismissedMobileBanner ? 'pt-2' : ''
      }`}>
        <ErrorBoundary fallbackTitle={lang === 'ar' ? 'تعذر تحميل هذه الصفحة' : 'Failed to display this view'}>
          <AnimatePresence mode="wait">
            {/* 1. CINEMATIC HOME */}
            {activeTab === 'home' && (
              <motion.div
                key="tab-home"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex-1 flex flex-col"
              >
                <CinematicHome
                  channels={channels}
                  favorites={favorites}
                  recentChannels={recents}
                  watchProgressList={watchProgressList}
                  watchProgressMap={watchProgressMap}
                  onPlay={handlePlayItem}
                  onOpenDetails={setSelectedMovieForDetails}
                  onToggleFavorite={toggleFavorite}
                  onSelectTab={setActiveTab}
                  onOpenAddModal={handleOpenAddModal}
                  lang={lang}
                />
              </motion.div>
            )}

          {/* 2. TIVIMATE LIVE TV */}
          {activeTab === 'live' && (
            <motion.div
              key="tab-live"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex-1 flex flex-col min-h-0"
            >
              <TivimateLiveTv
                channels={channels}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onPlayFullscreen={handlePlayItem}
                onBackToHome={() => setActiveTab('home')}
                lang={lang}
              />
            </motion.div>
          )}

          {/* 3. MOVIES / SERIES */}
          {(activeTab === 'movie' || activeTab === 'series') && (
            <motion.div
              key={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              <CinematicVod
                category={activeTab}
                channels={channels}
                favorites={favorites}
                watchProgressMap={watchProgressMap}
                onToggleFavorite={toggleFavorite}
                onPlay={handlePlayItem}
                onOpenDetails={setSelectedMovieForDetails}
                onBackToHome={() => setActiveTab('home')}
                lang={lang}
              />
            </motion.div>
          )}

          {/* 4. MULTI-SCREEN VIEW */}
          {activeTab === 'multiview' && (
            <motion.div
              key="tab-multiview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="pt-20 flex-1"
            >
              <MultiScreenView
                allChannels={channels}
                onClose={() => setActiveTab('home')}
                lang={lang}
              />
            </motion.div>
          )}

          {/* 5. RADIO / FAVORITES / RECENT */}
          {(activeTab === 'radio' || activeTab === 'favorites' || activeTab === 'recent') && (
            <motion.div
              key={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="pt-20 px-4 sm:px-8 max-w-[1700px] mx-auto w-full flex-1"
            >
              <ChannelList
                channels={channels}
                favorites={favorites}
                recentIds={recentIds}
                activeTab={activeTab}
                searchQuery=""
                onToggleFavorite={toggleFavorite}
                onPlayChannel={handlePlayItem}
                onOpenMovieDetails={setSelectedMovieForDetails}
                lang={lang}
              />
            </motion.div>
          )}
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* FULL-THEATER CINEMATIC VIDEO PLAYER OVERLAY */}
      {currentPlayingItem && (
        <VideoPlayer
          channel={currentPlayingItem}
          allChannels={channels}
          onClose={() => setCurrentPlayingItem(null)}
          onSelectChannel={handlePlayItem}
          settings={settings}
          onUpdateSettings={(newSet) => setSettings(prev => ({ ...prev, ...newSet }))}
          onOpenDiagnostics={() => setIsErrorModalOpen(true)}
          lang={lang}
        />
      )}

      {/* SEARCH SPOTLIGHT MODAL (Apple TV / Ctrl+K) */}
      <AnimatePresence>
        {isSearchOpen && (
          <SearchModal
            channels={channels}
            onPlay={handlePlayItem}
            onOpenDetails={setSelectedMovieForDetails}
            onClose={() => setIsSearchOpen(false)}
            lang={lang}
          />
        )}
      </AnimatePresence>

      {/* MODALS */}
      {isAddModalOpen && (
        <AddPlaylistModal
          onClose={() => setIsAddModalOpen(false)}
          lang={lang}
          initialTab={addModalInitialTab}
        />
      )}

      {isEpgModalOpen && (
        <EpgModal
          channels={channels}
          onPlayChannel={handlePlayItem}
          onClose={() => setIsEpgModalOpen(false)}
          lang={lang}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSet) => setSettings(prev => ({ ...prev, ...newSet }))}
          onResetAllData={handleResetAllData}
          onClose={() => setIsSettingsOpen(false)}
          lang={lang}
          onToggleLang={handleToggleLang}
          initialTab={settingsInitialTab}
          onOpenAddPlaylistModal={handleOpenAddModal}
        />
      )}

      {isErrorModalOpen && (
        <ErrorDiagnosticsModal
          onClose={() => setIsErrorModalOpen(false)}
          lang={lang}
          settings={settings}
          onUpdateSettings={(newSet) => setSettings(prev => ({ ...prev, ...newSet }))}
          onOpenSettingsTab={(tab) => {
            setSettingsInitialTab(tab);
            setIsSettingsOpen(true);
          }}
        />
      )}

      {selectedMovieForDetails && (
        <MovieDetailsModal
          movie={selectedMovieForDetails}
          onPlay={handlePlayItem}
          onClose={() => setSelectedMovieForDetails(null)}
          lang={lang}
        />
      )}

      {/* ANDROID REAL APP INSTALL MODAL */}
      <AndroidInstallModal
        isOpen={isAndroidInstallOpen}
        onClose={() => setIsAndroidInstallOpen(false)}
        lang={lang}
      />

      {/* PREMIUM VIP PLAYER LICENSE & MONETIZATION MODAL */}
      <PremiumLicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        lang={lang}
      />

      {/* GLOBAL TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-sm sm:max-w-md w-auto"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 text-white text-xs shadow-2xl shadow-cyan-500/25 ring-1 ring-cyan-400/30">
              {toast.type === 'fav_add' ? (
                <div className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/30">
                  <Heart className="w-3.5 h-3.5 fill-pink-500" />
                </div>
              ) : toast.type === 'fav_remove' ? (
                <div className="w-6 h-6 rounded-lg bg-slate-700/50 text-slate-300 flex items-center justify-center shrink-0 border border-slate-600/40">
                  <HeartOff className="w-3.5 h-3.5" />
                </div>
              ) : toast.type === 'resume' ? (
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                  <PlayCircle className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              )}
              <div className="flex flex-col text-start">
                <span className="font-bold text-slate-100 text-xs sm:text-sm">{toast.title}</span>
                {toast.subtitle && (
                  <span className="text-[11px] text-cyan-300 font-medium">{toast.subtitle}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TV D-PAD REMOTE MODE FLOATING HUD */}
      <AnimatePresence>
        {isTvModeActive && !isAnyModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-cyan-500/40 text-slate-200 text-xs shadow-2xl shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Gamepad2 className="w-4 h-4 animate-pulse" />
                <span>{lang === 'ar' ? 'وضع الريموت' : 'TV Remote'}</span>
              </div>
              <div className="h-3.5 w-px bg-slate-700" />
              <div className="flex items-center gap-3 text-[11px] text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-300">↑ ↓ ← →</span>
                  <span>{lang === 'ar' ? 'تنقل' : 'Navigate'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-300">Enter</span>
                  <span>{lang === 'ar' ? 'تشغيل' : 'Play'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-amber-300">F</span>
                  <span>{lang === 'ar' ? 'المفضلة' : 'Favorite'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-cyan-300">I</span>
                  <span>{lang === 'ar' ? 'تفاصيل' : 'Info'}</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
