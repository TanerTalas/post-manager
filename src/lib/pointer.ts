import { useEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

/** How far the mouse has to travel before a press counts as a drag, in pixels. */
const DRAG_THRESHOLD = 4;

/**
 * Drag to scroll, for a mouse only.
 *
 * Touch and pen are left entirely to the browser: it already pans a horizontal
 * strip, with momentum and rubber banding, far better than a pointermove
 * handler can. The strips used to set `touch-action: pan-y`, which switched the
 * native gesture off and left this handler doing all the work, which is why a
 * swipe on a phone crawled a few pixels instead of flicking.
 *
 * Nothing is captured until the pointer has actually moved. Capturing on the
 * press would retarget the whole sequence to the strip, and the click would
 * never reach the button inside it that the reader was aiming at.
 */
export function useDragScroll(target: RefObject<HTMLElement | null>) {
  const press = useRef<{ x: number; left: number; id: number; dragging: boolean } | null>(null);

  const release = () => {
    const el = target.current;
    if (el && press.current?.dragging) {
      try {
        if (el.hasPointerCapture(press.current.id)) el.releasePointerCapture(press.current.id);
      } catch {
        /* nothing left to release */
      }
    }
    press.current = null;
  };

  return {
    onPointerDown: (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      const el = target.current;
      if (!el) return;
      press.current = { x: event.clientX, left: el.scrollLeft, id: event.pointerId, dragging: false };
    },

    onPointerMove: (event: PointerEvent) => {
      const el = target.current;
      const state = press.current;
      if (!el || !state) return;

      const travelled = event.clientX - state.x;
      if (!state.dragging) {
        if (Math.abs(travelled) < DRAG_THRESHOLD) return;
        state.dragging = true;
        // Now that it is a drag, keep receiving moves past the strip's edge.
        try {
          el.setPointerCapture(state.id);
        } catch {
          /* the pointer went away, carry on without capture */
        }
      }

      // Otherwise the browser starts selecting text mid drag.
      event.preventDefault();
      el.scrollLeft = state.left - travelled;
    },

    onPointerUp: release,
    onPointerCancel: release,
    onPointerLeave: release,
  };
}

/**
 * Whether the device has a pointer that can hover at all. Starts true so the
 * server rendered markup matches a desktop, then corrects itself on a phone.
 *
 * Controls that only appear on hover are unreachable by touch, so they have to
 * be shown outright where hovering does not exist.
 */
export function useHasHover(): boolean {
  const [hasHover, setHasHover] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover)');
    const update = () => setHasHover(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return hasHover;
}
