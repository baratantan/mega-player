import { useEffect, useState } from 'react';
import { findNextFocusable, applyTvFocus, getFocusableElements } from '../utils/tvNavigation';

interface UseTvNavigationProps {
  isModalOpen?: boolean;
  activeTab?: string;
  lang?: 'ar' | 'en';
}

export function useTvNavigation({ isModalOpen = false, lang = 'ar' }: UseTvNavigationProps) {
  const [isTvModeActive, setIsTvModeActive] = useState(false);
  const [lastNavTime, setLastNavTime] = useState<number>(0);

  useEffect(() => {
    // Hide TV mode indicator after 4 seconds of inactivity or mouse movement
    if (isTvModeActive && Date.now() - lastNavTime > 4000) {
      const timer = setTimeout(() => {
        setIsTvModeActive(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isTvModeActive, lastNavTime]);

  useEffect(() => {
    const handleMouseMove = () => {
      // Optional: don't immediately cancel TV focus, just allow mouse interactions
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is typing in an input or textarea, let normal typing happen
      const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement)?.blur();
        }
        return;
      }

      // If a modal is open, let modal manage or limit scope to modal
      if (isModalOpen) {
        return;
      }

      let direction: 'up' | 'down' | 'left' | 'right' | null = null;

      if (e.key === 'ArrowUp') direction = 'up';
      else if (e.key === 'ArrowDown') direction = 'down';
      else if (e.key === 'ArrowLeft') direction = 'left';
      else if (e.key === 'ArrowRight') direction = 'right';

      if (direction) {
        e.preventDefault();
        setIsTvModeActive(true);
        setLastNavTime(Date.now());

        const currentActive = document.activeElement as HTMLElement | null;

        // If no element currently focused or body is active, focus the first focusable element
        const isCurrentFocusable = currentActive && (
          currentActive.hasAttribute('data-tv-focusable') ||
          currentActive.classList.contains('tv-focusable') ||
          currentActive.tagName === 'BUTTON'
        );

        if (!isCurrentActiveFocusable(currentActive)) {
          const focusables = getFocusableElements();
          if (focusables.length > 0) {
            // Find preferred starting point (e.g. billboard play button or first card)
            const heroPlay = document.getElementById('billboard-play-btn');
            const initialTarget = heroPlay || focusables[0];
            applyTvFocus(initialTarget);
            return;
          }
        }

        if (currentActive) {
          const next = findNextFocusable(currentActive, direction);
          if (next) {
            applyTvFocus(next);
          }
        }
      }
    };

    function isCurrentActiveFocusable(el: HTMLElement | null): boolean {
      if (!el || el === document.body) return false;
      return (
        el.hasAttribute('data-tv-focusable') ||
        el.classList.contains('tv-focusable') ||
        el.tagName === 'BUTTON' ||
        el.tabIndex >= 0
      );
    }

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  return {
    isTvModeActive,
  };
}
