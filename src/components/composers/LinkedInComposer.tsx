import { useRef, useState } from 'preact/hooks';
import { EMOJIS } from '~/data/platforms';
import { addMedia, removeMedia, setMedia, useMedia } from '~/lib/media';
import { readField, setField } from '~/lib/store';
import type { Project } from '~/lib/types';

interface Props {
  project: Project;
}

const SANS = "-apple-system, system-ui, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

function tabStyle(on: boolean): string {
  return `border:1px solid ${on ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.3)'};border-radius:999px;padding:7px 18px;background:${
    on ? 'rgba(0,0,0,0.08)' : 'transparent'
  };color:${on ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)'};font-family:${SANS};font-size:14px;font-weight:600;cursor:pointer`;
}

export default function LinkedInComposer({ project }: Props) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const textArea = useRef<HTMLTextAreaElement | null>(null);
  const [tab, setTab] = useState<'text' | 'media'>('text');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [selected, setSelected] = useState(0);

  const media = useMedia(project.id, 'linkedin');
  const body = readField(project, 'linkedin_body');
  const active = media[Math.min(selected, Math.max(0, media.length - 1))] ?? null;

  const insertEmoji = (character: string) => {
    const el = textArea.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    setField('linkedin_body', body.slice(0, start) + character + body.slice(end));
    if (el) {
      const caret = start + character.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(caret, caret);
      });
    }
  };

  const duplicate = () => {
    if (!active) return;
    const next = media.slice();
    next.splice(selected + 1, 0, { ...active, id: `${active.id}-copy-${next.length}` });
    setMedia(project.id, 'linkedin', next);
    setSelected(selected + 1);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInput}
        onChange={(event) => {
          const input = event.target as HTMLInputElement;
          if (input.files?.length) {
            setSelected(media.length);
            addMedia(project.id, 'linkedin', input.files, 'image');
          }
          input.value = '';
        }}
        style="display:none"
      />

      <div style="display:flex;gap:8px;margin:0 0 14px">
        <button onClick={() => setTab('text')} style={tabStyle(tab === 'text')}>
          Text
        </button>
        <button onClick={() => setTab('media')} style={tabStyle(tab === 'media')}>
          Media
        </button>
      </div>

      {tab === 'text' ? (
        <div
          style={`width:100%;margin:0 0 24px;background:#fff;border-radius:8px;box-shadow:rgba(140,140,140,0.2) 0 0 0 1px, rgba(0,0,0,0.3) 0 4px 4px 0;display:flex;flex-direction:column;font-family:${SANS};color:rgba(0,0,0,0.9);font-size:16px;line-height:1.25`}
        >
          <div style="position:relative;display:flex;align-items:center;gap:8px;padding:16px 16px 4px">
            <span style="flex:none;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#e8e8e8;color:rgba(0,0,0,0.55);font-size:16px;font-weight:600">
              JD
            </span>
            <div style="min-width:0">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:17px;font-weight:600;letter-spacing:-0.01em">John Doe</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:rgba(0,0,0,0.9)">
                  <path d="M6 9h12l-6 7z" />
                </svg>
              </div>
              <div style="font-size:13px;color:rgba(0,0,0,0.6);margin-top:2px">Post to Anyone</div>
            </div>
          </div>

          <textarea
            ref={textArea}
            value={body}
            onInput={(event) => setField('linkedin_body', (event.target as HTMLTextAreaElement).value)}
            placeholder="What do you want to talk about?"
            aria-label="Post text"
            style="width:100%;min-height:300px;margin:12px 0 0;padding:0 16px;border:0;outline:none;resize:none;background:transparent;font-family:inherit;font-size:19px;line-height:1.5;color:rgba(0,0,0,0.9)"
          />

          {media.length ? (
            <div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px 0">
              {media.map((item) => (
                <div key={item.id} style="position:relative;width:112px;height:112px;border-radius:8px;overflow:hidden;background:#e8e8e8">
                  <div
                    title={item.name}
                    style={`width:100%;height:100%;background-image:url("${item.url}");background-size:cover;background-position:center`}
                  />
                  <button
                    onClick={() => removeMedia(project.id, 'linkedin', item.id)}
                    title="Remove"
                    aria-label={`Remove ${item.name}`}
                    style="position:absolute;top:6px;right:6px;display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;cursor:pointer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div style="position:relative;padding:10px 8px 2px 16px">
            <button
              onClick={() => setEmojiOpen((open) => !open)}
              title="Open emoji keyboard"
              aria-label="Open emoji keyboard"
              style={`display:grid;place-items:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:${
                emojiOpen ? 'rgba(0,0,0,0.06)' : 'transparent'
              };color:${emojiOpen ? 'rgba(0,0,0,0.9)' : '#5f5f5f'};cursor:pointer`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
                <circle cx="12" cy="12" r="9.2" />
                <path d="M8.6 14.2c.8.9 2 1.4 3.4 1.4s2.6-.5 3.4-1.4" />
                <circle cx="9.2" cy="9.8" r="1" />
                <circle cx="14.8" cy="9.8" r="1" />
              </svg>
            </button>

            {emojiOpen ? (
              <div style="position:absolute;left:12px;bottom:46px;z-index:20;width:308px;padding:10px;background:#fff;border-radius:8px;box-shadow:rgba(0,0,0,0.15) 0 0 0 1px, rgba(0,0,0,0.2) 0 6px 18px;animation:tipIn .16s ease">
                <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:2px">
                  {EMOJIS.map((character) => (
                    <button
                      key={character}
                      onClick={() => insertEmoji(character)}
                      style="height:34px;padding:0;border:0;border-radius:6px;background:transparent;font-size:20px;line-height:1;cursor:pointer"
                    >
                      {character}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div style="display:flex;align-items:center;gap:8px;padding:2px 8px 14px">
            <button
              onClick={() => fileInput.current?.click()}
              title="Add media"
              aria-label="Add media"
              style="display:grid;place-items:center;width:48px;height:48px;padding:0;border:0;border-radius:50%;background:transparent;color:#5f5f5f;cursor:pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5.6l4.6-5.6 2.5 3 3.1-3.6L19 17.2V19zM8.2 10.8a1.6 1.6 0 1 1 0-3.2 1.6 1.6 0 0 1 0 3.2z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={`width:100%;margin:0 0 24px;background:#fff;border-radius:8px;box-shadow:rgba(140,140,140,0.2) 0 0 0 1px, rgba(0,0,0,0.3) 0 4px 4px 0;display:flex;flex-direction:column;font-family:${SANS};color:rgba(0,0,0,0.9);line-height:1.25`}
        >
          <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(0,0,0,0.08)">
            <span style="font-size:20px;font-weight:600;letter-spacing:-0.01em">Editor</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 208px">
            <div style="background:#f4f6f8;padding:16px;display:flex;flex-direction:column;gap:16px;min-height:320px">
              {active ? (
                <div
                  style={`flex:1;background-image:url("${active.url}");background-size:contain;background-position:center;background-repeat:no-repeat;min-height:220px`}
                />
              ) : (
                <button
                  onClick={() => fileInput.current?.click()}
                  style="flex:1;min-height:220px;display:grid;place-items:center;gap:10px;border:1px dashed rgba(0,0,0,0.25);border-radius:8px;background:#fff;color:rgba(0,0,0,0.55);font-family:inherit;font-size:14px;cursor:pointer"
                >
                  Click to add an image
                </button>
              )}
            </div>

            <div style="border-left:1px solid rgba(0,0,0,0.08);padding:14px;display:flex;flex-direction:column;gap:12px">
              <div style="font-size:13px;color:rgba(0,0,0,0.6)">
                {media.length ? `${Math.min(selected, media.length - 1) + 1} of ${media.length}` : 'No media yet'}
              </div>

              <div style="flex:1;display:flex;flex-direction:column;gap:10px;max-height:260px;overflow-y:auto">
                {media.map((item, index) => (
                  <div key={item.id} style="display:flex;flex-direction:column;gap:4px">
                    <button
                      onClick={() => setSelected(index)}
                      aria-label={`Select ${item.name}`}
                      style={`height:112px;padding:0;border:${
                        index === selected ? '2px solid #0a66c2' : '1px solid rgba(0,0,0,0.15)'
                      };border-radius:6px;background-color:#f8fafc;background-image:url("${item.url}");background-size:contain;background-position:center;background-repeat:no-repeat;cursor:pointer`}
                    />
                    <span style="font-size:12px;color:rgba(0,0,0,0.6);font-variant-numeric:tabular-nums">
                      {index + 1}. {item.name}
                    </span>
                  </div>
                ))}
              </div>

              <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;color:#5f5f5f">
                <button
                  onClick={duplicate}
                  title="Duplicate"
                  aria-label="Duplicate"
                  style="display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15V6a2 2 0 0 1 2-2h8" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (!active) return;
                    removeMedia(project.id, 'linkedin', active.id);
                    setSelected((index) => Math.max(0, index - 1));
                  }}
                  title="Delete"
                  aria-label="Delete"
                  style="display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
                  </svg>
                </button>
                <button
                  onClick={() => fileInput.current?.click()}
                  title="Add"
                  aria-label="Add media"
                  style="display:grid;place-items:center;width:40px;height:40px;padding:0;border:1px solid rgba(0,0,0,0.4);border-radius:50%;background:transparent;color:rgba(0,0,0,0.75);cursor:pointer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
