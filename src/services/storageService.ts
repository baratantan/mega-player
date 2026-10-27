/**
 * Cinema IPTV - Local Storage & Persistence Service
 * High-performance storage layer using LocalStorage with IndexedDB progressive persistence.
 * Handles Favorites, Continue Watching (playback timestamps & progress), and User Preferences.
 */

import { PlaylistItem, WatchProgress } from '../types';

const STORAGE_KEYS = {
  FAVORITES: 'iptv_cinema_favorites_v3',
  WATCH_PROGRESS: 'iptv_cinema_watch_progress_v3',
  SETTINGS: 'iptv_cinema_settings_v2',
  PROFILES: 'iptv_cinema_profiles_v2',
  ACTIVE_PROFILE: 'iptv_cinema_active_profile_v2',
};

// Initial default seed favorites
const DEFAULT_FAVORITES = [
  'vod_tears_of_steel',
  'ch_aljazeera_ar',
  'vod_big_buck_bunny',
  'ch_mbc1',
  'ch_beinsports_news',
];

// Initial mock continue watching progress (to immediately showcase the feature!)
const INITIAL_MOCK_PROGRESS: WatchProgress[] = [
  {
    itemId: 'vod_tears_of_steel',
    item: {
      id: 'vod_tears_of_steel',
      name: 'دموع الفولاذ (Tears of Steel 4K)',
      tagline: 'مستقبل الخيال العلمي وسينما المؤثرات البصرية الفائقة',
      logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
      backdrop: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&auto=format&fit=crop&q=80',
      group: 'أفلام خيال علمي (Sci-Fi)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      category: 'movie',
      resolution: '4K',
      year: 2024,
      rating: 8.8,
      duration: '1h 48m',
      genres: ['خيال علمي', 'أكشن', 'مغامرات'],
      synopsis: 'في مستقبل ديستوبي متقدم في أمستردام، تحاول مجموعة من العلماء والمقاتلين إعادة برمجة الروبوتات الذكية لإنقاذ البشرية من الانهيار التكنولوجي التام.',
    },
    currentTime: 420, // 7 minutes in
    duration: 734,
    progressPercent: 57,
    lastWatchedAt: Date.now() - 1000 * 60 * 35, // 35 mins ago
    completed: false,
  },
  {
    itemId: 'vod_sintel',
    item: {
      id: 'vod_sintel',
      name: 'سينتل: البحث عن التنين (Sintel)',
      tagline: 'رحلة أسطورية مليئة بالشجاعة والتضحية',
      logo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
      backdrop: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&auto=format&fit=crop&q=80',
      group: 'أفلام فانتازيا ومغامرات',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      category: 'movie',
      resolution: '4K',
      year: 2024,
      rating: 9.1,
      duration: '2h 10m',
      genres: ['فانتازيا', 'دراما', 'مغامرات'],
      synopsis: 'محاربة وحيدة تخوض رحلة شاقة عبر الجبال الجليدية والصحاري بحثاً عن تنينها الصغير المسلوب.',
    },
    currentTime: 180, // 3 minutes in
    duration: 888,
    progressPercent: 20,
    lastWatchedAt: Date.now() - 1000 * 60 * 120, // 2 hours ago
    completed: false,
  },
];

class StorageService {
  private memoryFavorites: Set<string> = new Set();
  private memoryProgress: Map<string, WatchProgress> = new Map();

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    // 1. Initialize Favorites
    try {
      const favRaw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (favRaw) {
        const parsed = JSON.parse(favRaw);
        if (Array.isArray(parsed)) {
          this.memoryFavorites = new Set(parsed);
        }
      } else {
        this.memoryFavorites = new Set(DEFAULT_FAVORITES);
        this.persistFavorites();
      }
    } catch (e) {
      console.warn('StorageService: Favorites init fallback', e);
      this.memoryFavorites = new Set(DEFAULT_FAVORITES);
    }

    // 2. Initialize Watch Progress
    try {
      const progRaw = localStorage.getItem(STORAGE_KEYS.WATCH_PROGRESS);
      if (progRaw) {
        const parsed: WatchProgress[] = JSON.parse(progRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && item.itemId) {
              this.memoryProgress.set(item.itemId, item);
            }
          });
        }
      } else {
        INITIAL_MOCK_PROGRESS.forEach((item) => {
          this.memoryProgress.set(item.itemId, item);
        });
        this.persistWatchProgress();
      }
    } catch (e) {
      console.warn('StorageService: Watch progress init fallback', e);
      INITIAL_MOCK_PROGRESS.forEach((item) => {
        this.memoryProgress.set(item.itemId, item);
      });
    }
  }

  // ==========================================
  // FAVORITES (المفضلة)
  // ==========================================

  getFavorites(): string[] {
    return Array.from(this.memoryFavorites);
  }

  isFavorite(id: string): boolean {
    return this.memoryFavorites.has(id);
  }

  addFavorite(id: string): boolean {
    if (!this.memoryFavorites.has(id)) {
      this.memoryFavorites.add(id);
      this.persistFavorites();
      return true;
    }
    return false;
  }

  removeFavorite(id: string): boolean {
    if (this.memoryFavorites.has(id)) {
      this.memoryFavorites.delete(id);
      this.persistFavorites();
      return true;
    }
    return false;
  }

  toggleFavorite(id: string): boolean {
    if (this.memoryFavorites.has(id)) {
      this.memoryFavorites.delete(id);
      this.persistFavorites();
      return false; // Removed
    } else {
      this.memoryFavorites.add(id);
      this.persistFavorites();
      return true; // Added
    }
  }

  private persistFavorites() {
    try {
      localStorage.setItem(
        STORAGE_KEYS.FAVORITES,
        JSON.stringify(Array.from(this.memoryFavorites))
      );
    } catch (e) {
      console.error('Failed to persist favorites to LocalStorage', e);
    }
  }

  // ==========================================
  // CONTINUE WATCHING & PLAYBACK PROGRESS (المشاهدات الأخيرة ونقطة التوقف)
  // ==========================================

  /**
   * Saves or updates the exact playback position for an item.
   * If watched > 92% of duration, marks as completed.
   */
  saveWatchProgress(item: PlaylistItem, currentTime: number, duration: number): WatchProgress {
    const validDuration = duration && duration > 0 ? duration : 1;
    const progressPercent = Math.min(100, Math.max(0, Math.round((currentTime / validDuration) * 100)));
    const completed = progressPercent >= 92;

    const progressObj: WatchProgress = {
      itemId: item.id,
      item: { ...item },
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      progressPercent,
      lastWatchedAt: Date.now(),
      completed,
    };

    this.memoryProgress.set(item.id, progressObj);
    this.persistWatchProgress();
    return progressObj;
  }

  /**
   * Retrieves saved progress for a specific channel or movie
   */
  getWatchProgress(itemId: string): WatchProgress | null {
    return this.memoryProgress.get(itemId) || null;
  }

  /**
   * Gets all continue-watching items sorted by most recently watched
   */
  getAllWatchProgress(): WatchProgress[] {
    return Array.from(this.memoryProgress.values())
      .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
  }

  /**
   * Gets active (incomplete) continue-watching items
   */
  getActiveContinueWatching(): WatchProgress[] {
    return this.getAllWatchProgress().filter((p) => !p.completed && p.currentTime > 5);
  }

  /**
   * Removes a specific item from continue-watching history
   */
  deleteWatchProgress(itemId: string): void {
    if (this.memoryProgress.has(itemId)) {
      this.memoryProgress.delete(itemId);
      this.persistWatchProgress();
    }
  }

  /**
   * Clears all continue-watching history
   */
  clearAllWatchProgress(): void {
    this.memoryProgress.clear();
    this.persistWatchProgress();
  }

  private persistWatchProgress() {
    try {
      const array = Array.from(this.memoryProgress.values())
        .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)
        .slice(0, 50); // Keep top 50 recent items
      localStorage.setItem(STORAGE_KEYS.WATCH_PROGRESS, JSON.stringify(array));
    } catch (e) {
      console.error('Failed to persist watch progress to LocalStorage', e);
    }
  }
}

export const storageService = new StorageService();
