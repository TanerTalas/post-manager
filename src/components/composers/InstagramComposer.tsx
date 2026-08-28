import { useRef, useState } from 'preact/hooks';
import { LIMITS } from '~/data/platforms';
import { addMedia, removeMedia, setMedia, useMedia, type MediaItem } from '~/lib/media';
import { readField, readFlag, setField } from '~/lib/store';
import type { Project } from '~/lib/types';

interface Props {
  project: Project;
}

const SANS = "-apple-system, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif";
const BLUE = '#4a5bf5';

function tabStyle(on: boolean): string {
  return `border:1px solid ${on ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.3)'};border-radius:999px;padding:7px 18px;background:${
    on ? 'rgba(0,0,0,0.08)' : 'transparent'
  };color:${on ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)'};font-family:${SANS};font-size:14px;font-weight:600;cursor:pointer`;
}

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  label: string;
}

function Toggle({ on, onToggle, label }: ToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={label}
      aria-pressed={on}
      style={`flex:none;position:relative;width:44px;height:24px;padding:0;border:0;border-radius:999px;background:${
        on ? BLUE : '#dbdbdb'
      };cursor:pointer;transition:background .2s ease`}
    >
      <span
        style={`position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:rgba(0,0,0,0.25) 0 1px 3px;transform:translateX(${
          on ? '20px' : '0'
        });transition:transform .2s ease`}
      />
    </button>
  );
}

interface SectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: preact.ComponentChildren;
  last?: boolean;
}

function Section({ title, open, onToggle, children, last }: SectionProps) {
  return (
    <div style={last ? '' : 'border-bottom:1px solid #dbdbdb'}>
      <button
        onClick={onToggle}
        style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:14px 16px;border:0;background:transparent;font-family:inherit;font-size:15px;font-weight:600;color:#000;text-align:left;cursor:pointer"
      >
        <span>{title}</span>
        <span style={`display:inline-flex;transform:rotate(${open ? '0deg' : '180deg'});transition:transform .25s ease`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <path d="m6 15 6-6 6 6" />
          </svg>
        </span>
      </button>
      <div style={`display:grid;grid-template-rows:${open ? '1fr' : '0fr'};transition:grid-template-rows .3s cubic-bezier(.4,0,.2,1)`}>
        <div style="overflow:hidden">{children}</div>
      </div>
    </div>
  );
}

export default function InstagramComposer({ project }: Props) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<'media' | 'text'>('media');
  const [selected, setSelected] = useState(0);
  const [shareOpen, setShareOpen] = useState(true);
  const [accessOpen, setAccessOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [alts, setAlts] = useState<Record<string, string>>({});

  const media = useMedia(project.id, 'instagram');
  const index = Math.min(selected, Math.max(0, media.length - 1));
  const active: MediaItem | null = media[index] ?? null;
  const caption = readField(project, 'instagram_caption');

  const flag = (key: string) => readFlag(project, key);
  const flip = (key: string) => setField(key, !readFlag(project, key));

  const carousel = (
    <>
      {media.length > 1 && index > 0 ? (
        <button
          onClick={() => setSelected(index - 1)}
          title="Previous media"
          aria-label="Previous media"
          style="position:absolute;top:50%;left:10px;transform:translateY(-50%);display:grid;place-items:center;width:26px;height:26px;padding:0;border:0;border-radius:50%;background:rgba(26,26,26,0.8);color:#fff;cursor:pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
      ) : null}

      {media.length > 1 && index < media.length - 1 ? (
        <button
          onClick={() => setSelected(index + 1)}
          title="Next media"
          aria-label="Next media"
          style="position:absolute;top:50%;right:10px;transform:translateY(-50%);display:grid;place-items:center;width:26px;height:26px;padding:0;border:0;border-radius:50%;background:rgba(26,26,26,0.8);color:#fff;cursor:pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      ) : null}

      {media.length > 1 ? (
        <div style="position:absolute;left:50%;bottom:16px;transform:translateX(-50%);display:flex;align-items:center;gap:6px">
          {media.map((item, position) => (
            <span
              key={item.id}
              style={`width:6px;height:6px;border-radius:50%;background:${
                position === index ? '#fff' : 'rgba(255,255,255,0.45)'
              }`}
            />
          ))}
        </div>
      ) : null}
    </>
  );

  return (
    <div>
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        ref={fileInput}
        onChange={(event) => {
          const input = event.target as HTMLInputElement;
          if (input.files?.length) {
            setSelected(media.length);
            addMedia(project.id, 'instagram', input.files, 'image');
          }
          input.value = '';
        }}
        style="display:none"
      />

      <div style="display:flex;gap:8px;margin:0 0 14px">
        <button onClick={() => setTab('media')} style={tabStyle(tab === 'media')}>
          Media
        </button>
        <button onClick={() => setTab('text')} style={tabStyle(tab === 'text')}>
          Text
        </button>
      </div>

      {tab === 'media' ? (
        <div
          style={`width:100%;margin:0 0 24px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:rgba(0,0,0,0.14) 0 0 0 1px, rgba(0,0,0,0.28) 0 8px 26px;font-family:${SANS};color:#000`}
        >
          {media.length === 0 ? (
            <>
              <div style="display:flex;align-items:center;justify-content:center;padding:15px 16px;border-bottom:1px solid #dbdbdb;font-size:16px;font-weight:600">
                Create new post
              </div>
              <div style="display:grid;place-items:center;min-height:470px;padding:40px 24px">
                <div style="display:flex;flex-direction:column;align-items:center;gap:20px">
                  <svg width="88" height="72" viewBox="0 0 88 72" fill="none" stroke="#000" stroke-width="1.5" stroke-linejoin="round">
                    <rect x="4" y="4" width="44" height="38" rx="6" />
                    <circle cx="17" cy="17" r="3.4" />
                    <path d="M8 36l11-11 9 9" />
                    <rect x="38" y="26" width="46" height="42" rx="6" fill="#fff" />
                    <path d="M56 38.5l14 8-14 8z" stroke-linecap="round" />
                  </svg>
                  <div style="font-size:20px;text-align:center">Drag photos and videos here</div>
                  <button
                    onClick={() => fileInput.current?.click()}
                    style={`border:0;border-radius:8px;padding:9px 18px;background:${BLUE};color:#fff;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer`}
                  >
                    Select from computer
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:13px 16px;border-bottom:1px solid #dbdbdb">
                <button
                  onClick={() => {
                    for (const item of media) URL.revokeObjectURL(item.url);
                    setMedia(project.id, 'instagram', []);
                    setSelected(0);
                  }}
                  title="Back"
                  aria-label="Discard media"
                  style="justify-self:start;display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;background:transparent;color:#000;cursor:pointer"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 12H4M10 6l-6 6 6 6" />
                  </svg>
                </button>
                <span style="font-size:16px;font-weight:600">Crop</span>
                <button
                  onClick={() => setTab('text')}
                  style={`justify-self:end;border:0;background:transparent;padding:2px 0;color:${BLUE};font-family:inherit;font-size:14px;font-weight:600;cursor:pointer`}
                >
                  Next
                </button>
              </div>

              <div style="position:relative;min-height:520px;background:#000">
                <div
                  style={`position:absolute;inset:0;background-image:url("${active?.url ?? ''}");background-size:contain;background-position:center;background-repeat:no-repeat`}
                />
                {carousel}

                <div style="position:absolute;right:14px;bottom:52px;display:flex;align-items:center;gap:14px">
                  <button
                    onClick={() => {
                      if (!active) return;
                      removeMedia(project.id, 'instagram', active.id);
                      setSelected((current) => Math.max(0, current - 1));
                    }}
                    title="Remove"
                    aria-label="Remove media"
                    style="display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;background:transparent;color:#fff;cursor:pointer"
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>

                  <div style="display:flex;align-items:center;gap:8px;max-width:320px;overflow-x:auto">
                    {media.map((item, position) => (
                      <button
                        key={item.id}
                        onClick={() => setSelected(position)}
                        aria-label={`Select ${item.name}`}
                        style={`flex:none;width:118px;height:118px;padding:0;border:${
                          position === index ? '2px solid #fff' : '1px solid rgba(255,255,255,0.4)'
                        };border-radius:4px;background-color:#111;background-image:url("${item.url}");background-size:cover;background-position:center;cursor:pointer`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => fileInput.current?.click()}
                    title="Add media"
                    aria-label="Add media"
                    style="flex:none;display:grid;place-items:center;width:56px;height:56px;padding:0;border:1px solid rgba(255,255,255,0.85);border-radius:50%;background:rgba(0,0,0,0.35);color:#fff;cursor:pointer"
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          style={`width:100%;margin:0 0 24px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:rgba(0,0,0,0.14) 0 0 0 1px, rgba(0,0,0,0.28) 0 8px 26px;font-family:${SANS};color:#000`}
        >
          <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:13px 16px;border-bottom:1px solid #dbdbdb">
            <button
              onClick={() => setTab('media')}
              title="Back"
              aria-label="Back to media"
              style="justify-self:start;display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;background:transparent;color:#000;cursor:pointer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 12H4M10 6l-6 6 6 6" />
              </svg>
            </button>
            <span style="font-size:16px;font-weight:600">Create new post</span>
            <span style={`justify-self:end;padding:2px 0;color:${BLUE};font-size:14px;font-weight:600`}>Share</span>
          </div>

          <div class="ig-split">
            <div style="position:relative;min-height:560px;background:#000">
              <div
                style={`position:absolute;inset:0;background-image:url("${active?.url ?? ''}");background-size:contain;background-position:center;background-repeat:no-repeat`}
              />

              {media.length === 0 ? (
                <button
                  onClick={() => setTab('media')}
                  style="position:absolute;inset:0;display:grid;place-items:center;border:0;background:transparent;color:rgba(255,255,255,0.75);font-family:inherit;font-size:14px;cursor:pointer"
                >
                  Add photos and videos first
                </button>
              ) : (
                <div style="position:absolute;top:22px;left:50%;transform:translateX(-50%);padding:9px 14px;border-radius:8px;background:#1a1a1a;color:#fff;font-size:14px;white-space:nowrap">
                  Click photo to tag people
                </div>
              )}

              {carousel}
            </div>

            <div style="border-left:1px solid #dbdbdb;max-height:640px;overflow-y:auto">
              <div style="display:flex;align-items:center;gap:10px;padding:14px 16px 8px">
                <span style="flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#efefef;color:rgba(0,0,0,0.6);font-size:11px;font-weight:600">
                  FD
                </span>
                <span style="font-size:14px;font-weight:600">fenni.dev</span>
              </div>

              <textarea
                value={caption}
                onInput={(event) => setField('instagram_caption', (event.target as HTMLTextAreaElement).value)}
                placeholder="Write a caption..."
                aria-label="Caption"
                style="width:100%;min-height:170px;padding:2px 16px 0;border:0;outline:none;resize:none;background:transparent;font-family:inherit;font-size:15px;line-height:1.5;color:#000"
              />

              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px 12px;border-bottom:1px solid #dbdbdb">
                <span style="display:grid;place-items:center;width:26px;height:26px;color:#737373">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="9.2" />
                    <path d="M8.6 14.2c.8.9 2 1.4 3.4 1.4s2.6-.5 3.4-1.4" />
                    <circle cx="9.2" cy="9.8" r="1" />
                    <circle cx="14.8" cy="9.8" r="1" />
                  </svg>
                </span>
                <span
                  style={`font-size:12px;font-variant-numeric:tabular-nums;color:${
                    caption.length > LIMITS.instagram ? '#ed4956' : '#a8a8a8'
                  }`}
                >
                  {caption.length}/{LIMITS.instagram.toLocaleString('en-US')}
                </span>
              </div>

              <div style="padding:14px 16px;border-bottom:1px solid #dbdbdb">
                <div style="display:flex;align-items:center;gap:12px">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round">
                    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h6" />
                    <path d="M20 11.5v6a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-7" />
                    <path d="m17.5 3.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#000" />
                  </svg>
                  <span style="flex:1;font-size:15px">Add AI label</span>
                  <Toggle on={flag('instagram_ai')} onToggle={() => flip('instagram_ai')} label="Add AI label" />
                </div>
                <div style="margin-top:8px;font-size:12px;line-height:1.5;color:#737373">
                  We require you to label certain realistic AI generated content.{' '}
                  <span style={`color:${BLUE}`}>Learn more</span>
                </div>
              </div>

              <Section title="Share to:" open={shareOpen} onToggle={() => setShareOpen((open) => !open)}>
                <div style="display:flex;align-items:center;gap:12px;padding:2px 16px 16px">
                  <span style="flex:none;position:relative;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#efefef;color:rgba(0,0,0,0.6);font-size:11px;font-weight:600">
                    FD
                  </span>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:14px;font-weight:600">fenni.dev</div>
                    <div style="font-size:12px;color:#737373">Threads &middot; Public</div>
                  </div>
                  <Toggle
                    on={flag('instagram_threads_share')}
                    onToggle={() => flip('instagram_threads_share')}
                    label="Share to Threads"
                  />
                </div>
              </Section>

              <Section title="Accessibility" open={accessOpen} onToggle={() => setAccessOpen((open) => !open)}>
                <div style="padding:0 16px 16px;display:flex;flex-direction:column;gap:12px">
                  <div style="font-size:12px;line-height:1.5;color:#737373">
                    Alt text describes your photos for people with visual impairments. Alt text is
                    created automatically for your photos, or you can write your own.
                  </div>
                  {media.map((item) => (
                    <div key={item.id} style="display:flex;align-items:center;gap:12px">
                      <span
                        style={`flex:none;width:56px;height:56px;border-radius:2px;background-color:#111;background-image:url("${item.url}");background-size:cover;background-position:center`}
                      />
                      <input
                        value={alts[item.id] ?? ''}
                        onInput={(event) =>
                          setAlts({ ...alts, [item.id]: (event.target as HTMLInputElement).value })
                        }
                        placeholder="Write alt text..."
                        aria-label={`Alt text for ${item.name}`}
                        style="flex:1;min-width:0;padding:12px 14px;border:1px solid #dbdbdb;border-radius:4px;outline:none;background:transparent;font-family:inherit;font-size:14px;color:#000"
                      />
                    </div>
                  ))}
                  {media.length === 0 ? (
                    <div style="font-size:13px;color:#a8a8a8">No media added yet.</div>
                  ) : null}
                </div>
              </Section>

              <Section
                title="Advanced settings"
                open={advancedOpen}
                onToggle={() => setAdvancedOpen((open) => !open)}
                last
              >
                <div style="padding:0 16px 20px;display:flex;flex-direction:column;gap:20px">
                  <div>
                    <div style="display:flex;align-items:flex-start;gap:12px">
                      <span style="flex:1;font-size:15px;line-height:1.4">
                        Hide like and view counts on this post
                      </span>
                      <Toggle
                        on={flag('instagram_hide_counts')}
                        onToggle={() => flip('instagram_hide_counts')}
                        label="Hide like and view counts"
                      />
                    </div>
                    <div style="margin-top:8px;font-size:12px;line-height:1.5;color:#737373">
                      Only you will see the total number of likes and views on this post. You can
                      change this later from the menu at the top of the post.{' '}
                      <span style={`color:${BLUE}`}>Learn more</span>
                    </div>
                  </div>

                  <div>
                    <div style="display:flex;align-items:flex-start;gap:12px">
                      <span style="flex:1;font-size:15px;line-height:1.4">Turn off commenting</span>
                      <Toggle
                        on={flag('instagram_no_comments')}
                        onToggle={() => flip('instagram_no_comments')}
                        label="Turn off commenting"
                      />
                    </div>
                    <div style="margin-top:8px;font-size:12px;line-height:1.5;color:#737373">
                      You can change this later from the menu at the top of your post.
                    </div>
                  </div>

                  <div>
                    <div style="display:flex;align-items:flex-start;gap:12px">
                      <span style="flex:1;font-size:15px;line-height:1.4">
                        Share to Threads automatically
                      </span>
                      <Toggle
                        on={flag('instagram_auto_threads')}
                        onToggle={() => flip('instagram_auto_threads')}
                        label="Share to Threads automatically"
                      />
                    </div>
                    <div style="margin-top:8px;font-size:12px;line-height:1.5;color:#737373">
                      Always share your posts on Threads. You can change your target audience in
                      Threads settings. <span style={`color:${BLUE}`}>Learn more</span>
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ig-split { display: grid; grid-template-columns: 1fr 340px; }
        @media (max-width: 900px) { .ig-split { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
