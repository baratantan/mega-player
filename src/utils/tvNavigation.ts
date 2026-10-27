/**
 * Spatial TV Remote & D-Pad Keyboard Navigation Engine
 * Provides native Apple TV / Android TV / TiviMate style arrow navigation
 */

export interface TvNavigationOptions {
  isModalOpen?: boolean;
  activeModalSelector?: string;
  onItemSelect?: (element: HTMLElement) => void;
  lang?: 'ar' | 'en';
}

/**
 * Calculates Euclidean distance with directional weighting
 */
function calculateDistance(
  currRect: DOMRect,
  targetRect: DOMRect,
  direction: 'up' | 'down' | 'left' | 'right'
): number {
  const currCenterX = currRect.left + currRect.width / 2;
  const currCenterY = currRect.top + currRect.height / 2;

  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  const dx = targetCenterX - currCenterX;
  const dy = targetCenterY - currCenterY;

  // Strict directional filtering
  switch (direction) {
    case 'right':
      if (targetRect.left < currRect.left + 5) return Infinity;
      return Math.abs(dx) + Math.abs(dy) * 2.5;

    case 'left':
      if (targetRect.right > currRect.right - 5) return Infinity;
      return Math.abs(dx) + Math.abs(dy) * 2.5;

    case 'down':
      if (targetRect.top < currRect.top + 5) return Infinity;
      return Math.abs(dy) + Math.abs(dx) * 2.0;

    case 'up':
      if (targetRect.bottom > currRect.bottom - 5) return Infinity;
      return Math.abs(dy) + Math.abs(dx) * 2.0;

    default:
      return Infinity;
  }
}

/**
 * Retrieves all visible focusable elements within scope
 */
export function getFocusableElements(container: HTMLElement | Document = document): HTMLElement[] {
  const selector = '[data-tv-focusable="true"], .tv-focusable, button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]';
  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

  return elements.filter((el) => {
    // Check if element is visible and displayed
    if (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

/**
 * Finds the nearest element in the given arrow direction
 */
export function findNextFocusable(
  currentElement: HTMLElement,
  direction: 'up' | 'down' | 'left' | 'right',
  container: HTMLElement | Document = document
): HTMLElement | null {
  const elements = getFocusableElements(container).filter((el) => el !== currentElement);
  if (elements.length === 0) return null;

  const currentRect = currentElement.getBoundingClientRect();

  let bestElement: HTMLElement | null = null;
  let minDistance = Infinity;

  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    const distance = calculateDistance(currentRect, rect, direction);

    if (distance < minDistance) {
      minDistance = distance;
      bestElement = el;
    }
  }

  return bestElement;
}

/**
 * Focuses an element smoothly and centers it in view
 */
export function applyTvFocus(element: HTMLElement) {
  element.focus({ preventScroll: true });
  
  // Custom smooth scroll into view
  try {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  } catch (e) {
    element.scrollIntoView();
  }
}
