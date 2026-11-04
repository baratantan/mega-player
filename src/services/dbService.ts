/**
 * High-Performance IndexedDB Storage Service
 * Provides asynchronous, zero-quota-limit persistence for IPTV channel libraries.
 * Keeps LocalStorage lightweight (<5KB) and completely unblocks the UI thread.
 */

import { PlaylistItem } from '../types';

const DB_NAME = 'CinemaProIptvDB';
const DB_VERSION = 1;
const STORE_CHANNELS = 'profile_channels';

class DbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in this environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_CHANNELS)) {
          db.createObjectStore(STORE_CHANNELS, { keyPath: 'profileId' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Save channel items for a profile asynchronously in IndexedDB
   */
  async saveChannels(profileId: string, channels: PlaylistItem[]): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_CHANNELS], 'readwrite');
        const store = transaction.objectStore(STORE_CHANNELS);
        const record = { profileId, channels, count: channels.length, savedAt: Date.now() };
        const putReq = store.put(record);

        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });
    } catch (err) {
      console.warn('IndexedDB saveChannels fallback:', err);
    }
  }

  /**
   * Retrieve channels for a profile from IndexedDB
   */
  async getChannels(profileId: string): Promise<PlaylistItem[] | null> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_CHANNELS], 'readonly');
        const store = transaction.objectStore(STORE_CHANNELS);
        const getReq = store.get(profileId);

        getReq.onsuccess = () => {
          if (getReq.result && Array.isArray(getReq.result.channels)) {
            resolve(getReq.result.channels);
          } else {
            resolve(null);
          }
        };
        getReq.onerror = () => reject(getReq.error);
      });
    } catch (err) {
      console.warn('IndexedDB getChannels fallback:', err);
      return null;
    }
  }

  /**
   * Delete channels for a profile from IndexedDB
   */
  async deleteChannels(profileId: string): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_CHANNELS], 'readwrite');
        const store = transaction.objectStore(STORE_CHANNELS);
        const delReq = store.delete(profileId);

        delReq.onsuccess = () => resolve();
        delReq.onerror = () => reject(delReq.error);
      });
    } catch (err) {
      console.warn('IndexedDB deleteChannels error:', err);
    }
  }
}

export const dbService = new DbService();
