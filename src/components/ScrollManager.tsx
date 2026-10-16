import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Enterprise-grade scroll management for Makthaba:
 * - When navigating to a new route, instantaneously scrolls the new page to top.
 * - When returning via browser Back/Forward (POP), accurately restores saved scroll position.
 * - Disables smooth scrolling on <html> during route transitions to prevent animated jumps.
 * - Handles asynchronous DOM expansions gracefully.
 * - Preserves scroll position during in-page state or query parameter updates.
 */
export default function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const prevPathRef = useRef<string>(location.pathname);

  // Disable browser's automatic scroll restoration to prevent conflicts
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Save scroll position for the current location key / path
  useEffect(() => {
    const saveCurrentScroll = () => {
      const key = location.key || location.pathname;
      scrollPositions.current.set(key, window.scrollY);
    };

    window.addEventListener('scroll', saveCurrentScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', saveCurrentScroll);
    };
  }, [location.key, location.pathname]);

  // Execute scroll adjustment synchronously before paint
  useLayoutEffect(() => {
    const isNewPath = prevPathRef.current !== location.pathname;
    prevPathRef.current = location.pathname;

    const html = document.documentElement;
    const originalBehavior = html.style.scrollBehavior;
    // Set to auto to ensure instant, non-animated transition
    html.style.scrollBehavior = 'auto';

    if (navType === 'POP') {
      // Browser Back or Forward: restore saved position
      const key = location.key || location.pathname;
      const targetY = scrollPositions.current.get(key) ?? 0;
      window.scrollTo(0, targetY);

      // Secondary check after rendering cycle for async or image elements
      const timer = setTimeout(() => {
        window.scrollTo(0, targetY);
        html.style.scrollBehavior = originalBehavior;
      }, 60);

      return () => clearTimeout(timer);
    } else {
      // Internal navigation (PUSH or REPLACE)
      if (isNewPath) {
        // Different route: always open at top
        window.scrollTo(0, 0);
      }

      const timer = setTimeout(() => {
        html.style.scrollBehavior = originalBehavior;
      }, 60);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.key, navType]);

  return null;
}
