import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { getAnchor, onAnchorChange } from '~/lib/anchors';
import { activeProject, getState, patchProject, setState } from '~/lib/store';
import { TOUR, endTour, nextStep, prevStep, startTour, useTourStep } from '~/lib/tour';

/** Only used before the card has been laid out once and can be measured. */
const TIP_FALLBACK_HEIGHT = 236;

interface Placement {
  top: number;
  left: number;
  arrow: number;
  width: number;
  /** Which side of the anchor the card ended up on, so the arrow can follow. */
  side: 'above' | 'below';
  ring: { top: number; left: number; width: number; height: number };
}

/**
 * The spotlight and its card. Anchors come from the shared registry, so the
 * tour can point at controls that live in the header island as easily as at
 * ones in the app screen.
 */
export default function TourGuide() {
  const step = useTourStep();
  const [place, setPlace] = useState<Placement | null>(null);
  const card = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tour') === '1') {
      startTour();
      // Drop the flag so a reload does not start the tour over again.
      const url = new URL(window.location.href);
      url.searchParams.delete('tour');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  const measure = useCallback(() => {
    const current = TOUR[step - 1];
    if (!current) {
      setPlace(null);
      return;
    }

    const node = getAnchor(current.anchor);
    if (!node) return;

    let box = node.getBoundingClientRect();
    if (box.top < 64 || box.bottom > window.innerHeight - 64) {
      const want = window.scrollY + box.top - Math.max(72, (window.innerHeight - box.height) / 2 - 40);
      window.scrollTo({ top: Math.max(0, want), behavior: 'auto' });
      box = node.getBoundingClientRect();
    }

    const width = Math.min(320, window.innerWidth - 32);
    const left = Math.max(16, Math.min(box.left + box.width / 2 - width / 2, window.innerWidth - width - 16));
    const arrow = Math.max(14, Math.min(box.left + box.width / 2 - left - 5, width - 24));

    // The card's real height, not a guess. A guess put the card in the wrong
    // place whenever the copy ran short or long, which is what made the last
    // steps look like they were pointing at nothing.
    const height = card.current?.offsetHeight || TIP_FALLBACK_HEIGHT;

    const below = box.bottom + 14;
    const side = below + height > window.innerHeight - 16 ? 'above' : 'below';
    const top =
      side === 'below'
        ? below
        : Math.max(16, Math.min(box.top - height - 14, window.innerHeight - height - 16));

    setPlace({
      top,
      left,
      arrow,
      width,
      side,
      ring: {
        top: box.top - 5,
        left: box.left - 5,
        width: box.width + 10,
        height: box.height + 10,
      },
    });
  }, [step]);

  useEffect(() => {
    if (!step) {
      setPlace(null);
      return;
    }
    // The anchor for a step often appears in the same tick that opened it, so
    // measuring is deferred until the DOM has caught up.
    const timer = setTimeout(measure, 90);
    const off = onAnchorChange(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      clearTimeout(timer);
      off();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [step, measure]);

  if (!step) return null;

  const current = TOUR[step - 1];
  if (!current) return null;

  const advance = () => {
    nextStep(() => {
      const project = activeProject(getState());
      if (project) patchProject(project.id, (entry) => ({ ...entry, open: { ...entry.open, twitter: true } }));
    });
    if (step >= TOUR.length) setState({ tourSeen: true });
  };

  const finish = () => {
    setState({ tourSeen: true });
    endTour();
  };

  return (
    <div>
      {place ? (
        <div
          style={`position:fixed;z-index:90;pointer-events:none;border:1px solid var(--color-accent);border-radius:var(--radius-md);box-shadow:0 0 0 3px color-mix(in srgb, var(--color-accent) 22%, transparent);transition:all .28s cubic-bezier(.4,0,.2,1);top:${place.ring.top}px;left:${place.ring.left}px;width:${place.ring.width}px;height:${place.ring.height}px`}
        />
      ) : null}

      <div
        ref={card}
        class="elev-lg"
        style={`position:fixed;z-index:92;width:${place?.width ?? 320}px;max-width:calc(100vw - 32px);background:var(--color-bg);border:1px solid var(--color-accent);border-radius:var(--radius-md);padding:18px;animation:tipIn .24s ease;top:${
          place?.top ?? 120
        }px;left:${place?.left ?? 16}px`}
      >
        <div
          style={`position:absolute;${
            place?.side === 'above'
              ? 'bottom:-6px;border-right:1px solid var(--color-accent);border-bottom:1px solid var(--color-accent)'
              : 'top:-6px;border-left:1px solid var(--color-accent);border-top:1px solid var(--color-accent)'
          };left:${place?.arrow ?? 20}px;width:10px;height:10px;background:var(--color-bg);transform:rotate(45deg)`}
        />
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px">
          <div style="font-family:var(--font-heading);font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:var(--color-accent);font-variant-numeric:tabular-nums">
            {step} / {TOUR.length}
          </div>
        </div>
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:8px 0 6px">
          {current.title}
        </h4>
        <p style="font-size:13px;line-height:1.75;margin:0;text-wrap:pretty">{current.body}</p>
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:16px">
          <button
            class="btn btn-ghost"
            onClick={prevStep}
            disabled={step <= 1}
            style={`font-size:12px;cursor:default;opacity:${step <= 1 ? 0.3 : 1}`}
          >
            Back
          </button>
          <button class="btn btn-primary" onClick={advance} style="font-size:12px">
            {step === TOUR.length ? 'Done' : current.anchor === 'plus' ? 'Press it' : 'Next'}
          </button>
        </div>
      </div>

      <button
        class="btn btn-secondary"
        onClick={finish}
        style="position:fixed;z-index:92;right:20px;bottom:20px;font-size:13px;white-space:nowrap;background:var(--color-bg)"
      >
        Skip the tour
      </button>
    </div>
  );
}
