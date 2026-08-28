import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Icon, paths } from '~/components/Icon';
import { PLATFORMS, type PlatformId } from '~/data/platforms';
import { setAnchor } from '~/lib/anchors';
import {
  activeProject,
  deleteProject,
  readField,
  setAllRows,
  setField,
  setState,
  togglePlatform,
  useHydrated,
  useStore,
} from '~/lib/store';
import { PlatformRow } from '~/components/PlatformRow';
import { useDragScroll } from '~/lib/pointer';

const dim = 'color-mix(in srgb, var(--color-text) 55%, transparent)';

export default function AppScreen() {
  const state = useStore();
  const ready = useHydrated();
  const project = activeProject(state);

  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<PlatformId | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: true });
  const strip = useRef<HTMLDivElement | null>(null);
  const dragScroll = useDragScroll(strip);

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
  }, [measure]);

  // Before hydration there is no stored state to draw from, so the screen holds
  // its shape and stays empty rather than flashing the wrong project.
  if (!ready) return <div style="min-height:60vh" />;

  if (!project) {
    return (
      <div style="padding:60px 0;text-align:center">
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:34px;letter-spacing:-0.015em;margin:0">
          Nothing open yet
        </h2>
        <p style={`font-size:15px;line-height:1.7;max-width:40ch;margin:16px auto 0;color:${dim};text-wrap:pretty`}>
          Press the plus in the tab bar to start a project
        </p>
      </div>
    );
  }

  const selected = project.selected;
  const anyOpen = selected.some((id) => project.open[id]);

  const askToggle = (id: PlatformId) => {
    const turningOff = selected.includes(id);
    if (turningOff && !state.neverConfirm) {
      setConfirm(id);
      return;
    }
    togglePlatform(id);
  };

  const copyNotes = () => {
    const text = readField(project, 'notes');
    if (navigator.clipboard) void navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const nudge = (direction: number) => {
    const el = strip.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(140, el.clientWidth * 0.6), behavior: 'smooth' });
  };

  const confirmName = confirm ? (PLATFORMS.find((p) => p.id === confirm)?.name ?? '') : '';

  return (
    <div>
      <div style="display:flex;align-items:center;gap:8px">
        <button
          class="btn btn-ghost btn-icon"
          onClick={() => nudge(-1)}
          disabled={edges.start}
          aria-label="Scroll platforms left"
          style={`cursor:default;flex:none;opacity:${edges.start ? 0.3 : 1}`}
        >
          <Icon>{paths.chevronLeft}</Icon>
        </button>

        <div
          ref={strip}
          class="noscroll"
          onScroll={measure}
          {...dragScroll}
          style="flex:1;display:flex;gap:8px;overflow-x:auto;padding:2px;cursor:grab"
        >
          {PLATFORMS.map((platform) => {
            const on = selected.includes(platform.id);
            return (
              <button
                key={platform.id}
                class="hov-chip"
                onClick={() => askToggle(platform.id)}
                aria-pressed={on}
                style={`flex:none;display:flex;align-items:center;gap:8px;height:40px;padding:0 14px;font:inherit;font-size:13px;cursor:pointer;border:1px solid ${
                  on ? 'var(--color-accent)' : 'var(--color-divider)'
                };border-radius:var(--radius-md);background:transparent;color:${
                  on ? 'var(--color-accent-700)' : 'color-mix(in srgb, var(--color-text) 45%, transparent)'
                };white-space:nowrap`}
              >
                <span
                  style={`flex:none;width:18px;height:18px;background:center/contain no-repeat url(${platform.icon});opacity:${
                    on ? 1 : 0.45
                  }`}
                />
                {platform.name}
              </button>
            );
          })}
        </div>

        <button
          class="btn btn-ghost btn-icon"
          onClick={() => nudge(1)}
          disabled={edges.end}
          aria-label="Scroll platforms right"
          style={`cursor:default;flex:none;opacity:${edges.end ? 0.3 : 1}`}
        >
          <Icon>{paths.chevronRight}</Icon>
        </button>
      </div>

      <div style="margin-top:34px">
        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:8px">
          <div style={`font-family:var(--font-heading);font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:color-mix(in srgb, var(--color-text) 60%, transparent)`}>
            Notes
          </div>
          <button
            class="btn btn-ghost btn-icon"
            onClick={copyNotes}
            title="Copy notes"
            aria-label="Copy notes"
            style="width:28px;height:28px"
          >
            {copied ? (
              <Icon size={15} width={1.7}>
                {paths.check}
              </Icon>
            ) : (
              <Icon size={15} width={1.5}>
                {paths.copy}
              </Icon>
            )}
          </button>
        </div>
        <textarea
          class="input"
          value={readField(project, 'notes')}
          onInput={(event) => setField('notes', (event.target as HTMLTextAreaElement).value)}
          placeholder="Angle, hooks, links, anything you don't want to lose."
          style="min-height:96px;line-height:1.7;font-size:14px"
        />
      </div>

      <div style="margin-top:44px">
        <div
          onClick={() => setAllRows(!anyOpen)}
          style="display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;padding-bottom:10px;border-bottom:1px solid var(--color-text)"
        >
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:21px;margin:0;letter-spacing:-0.01em">
            Social Medias
          </h3>
          <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--color-accent)">
            {anyOpen ? 'Collapse all' : 'Expand all'}
          </span>
        </div>

        {PLATFORMS.filter((platform) => selected.includes(platform.id)).map((platform) => (
          <PlatformRow key={platform.id} platform={platform} project={project} />
        ))}

        {selected.length === 0 ? (
          <p style={`font-size:14px;line-height:1.8;margin:26px 0;color:${dim};text-wrap:pretty`}>
            No platform is active. Pick one above. Anything you&apos;ve already written stays exactly
            where it was.
          </p>
        ) : null}
      </div>

      <div style="margin-top:56px;border-top:1px solid var(--color-divider);padding-top:22px;display:flex;flex-wrap:wrap;gap:26px;align-items:flex-start;justify-content:space-between">
        <p style={`flex:1;min-width:260px;max-width:62ch;font-size:13px;line-height:1.8;margin:0;color:color-mix(in srgb, var(--color-text) 62%, transparent);text-wrap:pretty`}>
          Your text stays in this browser and is here again next time you open the page. Images and
          video are never saved. Clear your browsing data and the projects go with it.
        </p>
        <button
          class="btn btn-outline-danger"
          ref={(el) => setAnchor('delete', el)}
          onClick={() => setPendingDelete(true)}
          style="font-size:13px;white-space:nowrap"
        >
          <Icon size={15} width={1.5}>
            {paths.trash}
          </Icon>
          Delete project
        </button>
      </div>

      {confirm ? (
        <div
          class="dialog-backdrop"
          style="z-index:85;background:color-mix(in srgb, #2d2b2b 34%, transparent);animation:fadeIn .18s ease"
        >
          <div
            class="elev-lg"
            style="width:100%;max-width:430px;background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:24px"
          >
            <p style="font-size:15px;line-height:1.8;margin:0;text-wrap:pretty">
              Turn {confirmName} off? Nothing you&apos;ve written will be deleted, don&apos;t worry. It
              comes back the moment you switch it on again.
            </p>
            <div style="display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;margin-top:22px">
              <button
                class="btn btn-ghost"
                onClick={() => {
                  setState({ neverConfirm: true });
                  togglePlatform(confirm);
                  setConfirm(null);
                }}
                style="font-size:13px;white-space:nowrap"
              >
                Don&apos;t show again
              </button>
              <button
                class="btn btn-primary"
                onClick={() => {
                  togglePlatform(confirm);
                  setConfirm(null);
                }}
                style="font-size:13px;white-space:nowrap"
              >
                Fine, turn it off
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div
          class="dialog-backdrop"
          style="z-index:85;background:color-mix(in srgb, #2d2b2b 34%, transparent);animation:fadeIn .18s ease"
        >
          <div
            class="elev-lg"
            style="width:100%;max-width:430px;background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius-md);padding:24px"
          >
            <h3 style="font-family:var(--font-heading);font-weight:600;font-size:22px;margin:0 0 10px">
              Delete {project.name}?
            </h3>
            <p style={`font-size:14px;line-height:1.8;margin:0;color:color-mix(in srgb, var(--color-text) 65%, transparent);text-wrap:pretty`}>
              The tab and every draft inside it go away. This one can&apos;t be undone.
            </p>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:22px">
              <button class="btn btn-secondary" onClick={() => setPendingDelete(false)} style="font-size:13px">
                Keep it
              </button>
              <button
                class="btn btn-danger"
                onClick={() => {
                  deleteProject(project.id);
                  setPendingDelete(false);
                }}
                style="font-size:13px;white-space:nowrap"
              >
                Delete project
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
