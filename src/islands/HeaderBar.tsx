import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Icon, paths } from '~/components/Icon';
import { setAnchor } from '~/lib/anchors';
import { goTo } from '~/lib/navigate';
import { registerTourCommands } from '~/lib/tour';
import {
  createProject,
  renameProject,
  selectProject,
  setState,
  useHydrated,
  useStore,
} from '~/lib/store';

const TAB_WIDTH = 168;

interface Props {
  /** Which route the shell is rendering, so the right tab reads as active. */
  route: 'home' | 'app';
}

interface Naming {
  target: string | null;
  value: string;
}

export default function HeaderBar({ route }: Props) {
  const state = useStore();
  const ready = useHydrated();
  const [hover, setHover] = useState<string | null>(null);
  const [naming, setNaming] = useState<Naming | null>(null);
  const [info, setInfo] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: true });
  const strip = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const namingRef = useRef<Naming | null>(null);

  const measure = useCallback(() => {
    const el = strip.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 1,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, state.order.length, state.homeTab]);

  const nudge = (direction: number) => {
    const el = strip.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(140, el.clientWidth * 0.6), behavior: 'smooth' });
  };

  const activeId = route === 'home' ? 'home' : state.active;

  const openNaming = (target: string | null, value: string) => {
    setNaming({ target, value });
    setInfo(false);
  };

  const commitNaming = () => {
    if (!naming) return;
    const name = naming.value.trim() || 'Untitled project';
    if (naming.target) {
      renameProject(naming.target, name);
      setNaming(null);
    } else {
      createProject(name);
      setNaming(null);
      if (route !== 'app') goTo('/app');
    }
  };

  // The tour presses these controls for the reader, so it needs a way in.
  useEffect(() => {
    registerTourCommands({
      openNaming: (preset) => openNaming(null, preset),
      commitNaming: () => {
        const name = namingRef.current?.value.trim() || 'Untitled project';
        createProject(name);
        setNaming(null);
      },
    });
    return () => registerTourCommands(null);
  }, []);

  namingRef.current = naming;

  const pickTab = (id: string) => {
    if (id === 'home') {
      if (route !== 'home') goTo('/');
      return;
    }
    selectProject(id);
    if (route !== 'app') goTo('/app');
  };

  const closeHomeTab = (event: MouseEvent) => {
    event.stopPropagation();
    setState({ homeTab: false });
    if (route === 'home') goTo('/app');
  };

  const dim = 'color-mix(in srgb, var(--color-text) 45%, transparent)';

  const tabs = [
    ...(state.homeTab ? [{ id: 'home', label: 'Home', closable: true }] : []),
    ...state.order.map((id) => ({
      id,
      label: state.projects[id]?.name ?? 'Untitled',
      closable: false,
    })),
  ];

  return (
    <>
      <header
        data-shell-header
        style="position:sticky;top:0;z-index:40;background:var(--color-bg);border-bottom:1px solid var(--color-divider);transition:top .34s cubic-bezier(.4,0,.2,1)"
      >
        <div data-shell-chrome style="transition:opacity .26s ease">
          <div style="display:flex;align-items:center;gap:14px;padding:12px 20px 10px;max-width:1180px;margin:0 auto;width:100%">
            <a href="/" style="display:flex;align-items:flex-end;gap:10px;margin-right:auto;color:inherit">
              <span style="display:flex;align-items:flex-end;justify-content:center;flex:none;width:34px;height:27px;border:1.5px solid var(--color-accent);border-bottom:0;border-radius:5px 5px 0 0;background:color-mix(in srgb, var(--color-accent) 8%, transparent);padding-bottom:3px">
                <span style="font-weight:600;font-size:14px;letter-spacing:-0.03em;line-height:1;color:var(--color-accent-700)">
                  pm
                </span>
              </span>
              <span style="font-weight:600;font-size:14px;letter-spacing:0.2em;text-transform:uppercase;line-height:1;padding-bottom:4px">
                Post Manager
              </span>
            </a>

            <button
              class="btn btn-secondary btn-icon"
              ref={(el) => setAnchor('help', el)}
              onClick={() => setInfo((open) => !open)}
              title="About storage"
              aria-label="About storage"
              style="border-radius:50%"
            >
              <Icon size={16} width={2}>
                {paths.help}
              </Icon>
            </button>

            <button
              class="btn btn-secondary"
              onClick={() => setState({ lang: state.lang === 'EN' ? 'TR' : 'EN' })}
              title="Language"
              style="padding:7px 12px;font-size:12px;letter-spacing:0.1em;font-variant-numeric:tabular-nums"
            >
              <Icon size={15} width={1.5}>
                {paths.globe}
              </Icon>
              {state.lang}
            </button>
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;gap:8px;padding:0 20px;max-width:1180px;margin:0 auto;width:100%">
          <button
            class="btn btn-ghost btn-icon"
            onClick={() => nudge(-1)}
            disabled={edges.start}
            aria-label="Scroll tabs left"
            style={`cursor:default;flex:none;margin-top:1px;opacity:${edges.start ? 0.3 : 1}`}
          >
            <Icon>{paths.chevronLeft}</Icon>
          </button>

          <div
            ref={strip}
            class="noscroll"
            onScroll={measure}
            onPointerDown={(event) => {
              const el = strip.current;
              if (el) drag.current = { x: event.clientX, left: el.scrollLeft };
            }}
            onPointerMove={(event) => {
              const el = strip.current;
              if (el && drag.current) {
                el.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
              }
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerLeave={() => (drag.current = null)}
            style="flex:1;display:flex;gap:2px;overflow-x:auto;padding-bottom:34px;touch-action:pan-y;cursor:grab"
          >
            {tabs.map((tab) => {
              const on = tab.id === activeId;
              return (
                <div
                  key={tab.id}
                  onMouseEnter={() => setHover(tab.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => pickTab(tab.id)}
                  style={`position:relative;flex:none;width:${TAB_WIDTH}px;height:38px;display:flex;align-items:center;gap:6px;padding:0 10px;cursor:pointer;border:1px solid ${
                    on ? 'var(--color-divider)' : 'transparent'
                  };border-bottom-color:${
                    on ? 'var(--color-surface)' : 'var(--color-divider)'
                  };border-radius:var(--radius-md) var(--radius-md) 0 0;background:${
                    on ? 'var(--color-surface)' : 'transparent'
                  };color:${on ? 'var(--color-text)' : dim}`}
                >
                  <span style="flex:1;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    {tab.label}
                  </span>

                  {tab.closable && hover === tab.id ? (
                    <button
                      onClick={closeHomeTab}
                      title="Close tab"
                      aria-label="Close tab"
                      style="flex:none;display:grid;place-items:center;width:18px;height:18px;border:0;background:transparent;color:inherit;cursor:pointer;padding:0;opacity:0.7"
                    >
                      <Icon size={12} width={2}>
                        {paths.close}
                      </Icon>
                    </button>
                  ) : null}

                  {!tab.closable && (on || hover === tab.id) ? (
                    <button
                      ref={(el) => {
                        if (on) setAnchor('pencil', el);
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        openNaming(tab.id, tab.label);
                      }}
                      title="Rename project"
                      aria-label="Rename project"
                      style="position:absolute;left:50%;bottom:-30px;transform:translateX(-50%);display:grid;place-items:center;width:26px;height:26px;border:1px solid var(--color-accent);border-radius:50%;background:var(--color-bg);color:var(--color-accent);cursor:pointer;padding:0"
                    >
                      <Icon size={14}>{paths.pencil}</Icon>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <button
            class="btn btn-ghost btn-icon"
            onClick={() => nudge(1)}
            disabled={edges.end}
            aria-label="Scroll tabs right"
            style={`cursor:default;flex:none;margin-top:1px;opacity:${edges.end ? 0.3 : 1}`}
          >
            <Icon>{paths.chevronRight}</Icon>
          </button>

          <button
            class="btn btn-primary btn-icon"
            ref={(el) => setAnchor('plus', el)}
            onClick={() => openNaming(null, '')}
            title="New project"
            aria-label="New project"
            style="flex:none;width:34px;height:34px;margin-top:2px"
          >
            <Icon>{paths.plus}</Icon>
          </button>
        </div>
      </header>

      {ready && naming ? (
        <div
          class="dialog-backdrop"
          style="z-index:80;background:color-mix(in srgb, #2d2b2b 34%, transparent);animation:fadeIn .18s ease"
        >
          <div
            class="elev-lg"
            ref={(el) => setAnchor('naming', el)}
            style="width:100%;max-width:440px;background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:24px"
          >
            <h3 style="font-family:var(--font-heading);font-weight:600;font-size:23px;margin:0 0 4px">
              {naming.target ? 'Rename this project' : 'Name your project'}
            </h3>
            <p style="font-size:13px;line-height:1.7;margin:0 0 18px;color:color-mix(in srgb, var(--color-text) 60%, transparent);text-wrap:pretty">
              {naming.target
                ? 'Only you see this name. Change it as often as you like.'
                : 'Something you will recognise in a week. It is only a label, so nothing rides on it.'}
            </p>
            <input
              class="input"
              autofocus
              value={naming.value}
              onInput={(event) =>
                setNaming({ target: naming.target, value: (event.target as HTMLInputElement).value })
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitNaming();
                if (event.key === 'Escape') setNaming(null);
              }}
              placeholder="e.g. Q4 Roadmap Post"
              style="min-height:42px;font-size:15px"
            />
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px">
              <button class="btn btn-secondary" onClick={() => setNaming(null)} style="font-size:13px">
                Cancel
              </button>
              <button class="btn btn-primary" onClick={commitNaming} style="font-size:13px">
                {naming.target ? 'Rename' : 'Create project'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {ready && info ? (
        <div
          class="dialog-backdrop"
          style="z-index:80;background:color-mix(in srgb, #2d2b2b 34%, transparent);animation:fadeIn .18s ease"
          onClick={() => setInfo(false)}
        >
          <div
            class="elev-lg"
            onClick={(event) => event.stopPropagation()}
            style="width:100%;max-width:480px;background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:26px"
          >
            <h3 style="font-family:var(--font-heading);font-weight:600;font-size:23px;margin:0 0 14px">
              Where your work lives
            </h3>
            <p style="font-size:15px;line-height:1.75;margin:0 0 10px;text-wrap:pretty">
              Your text stays in this browser and comes back exactly as you left it. Images and video
              are never saved.
            </p>
            <p style="font-size:15px;line-height:1.75;margin:0;text-wrap:pretty">
              Clear your browsing data and the projects go with it.
            </p>
            <hr class="hr" style="margin:20px 0" />
            <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between">
              <span style="font-size:16px;font-weight:600">Feeling lost?</span>
              <div style="display:flex;gap:10px">
                <button class="btn btn-secondary" onClick={() => setInfo(false)} style="font-size:13px">
                  Close
                </button>
                <button
                  class="btn btn-primary"
                  onClick={() => {
                    setInfo(false);
                    goTo('/app?tour=1');
                  }}
                  style="font-size:13px"
                >
                  Take the tour
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
