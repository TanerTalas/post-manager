import { useRef, useState } from 'preact/hooks';
import { EMOJIS, LIMITS } from '~/data/platforms';
import { addChainPost, bucketFor, chainPosts, removeChainPost, setChainPost } from '~/lib/chain';
import { addMedia, getMedia, removeMedia, useMedia } from '~/lib/media';
import type { Project } from '~/lib/types';

interface Props {
  project: Project;
}

const KEYS = { body: 'twitter_body', thread: 'twitter_thread' };
const RING_LENGTH = 56.55;

function ringColour(count: number): string {
  if (count > LIMITS.twitter) return '#f4212e';
  if (count > LIMITS.twitterWarn) return '#ffd400';
  return '#1d9bf0';
}

export default function TwitterComposer({ project }: Props) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [focus, setFocus] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const posts = chainPosts(project, KEYS);
  const index = Math.min(focus, posts.length - 1);
  const count = posts[index]?.length ?? 0;
  const focusedMedia = useMedia(project.id, bucketFor('twitter', index));

  const anything = posts.some((text, position) => {
    return text.trim().length > 0 || getMedia(project.id, bucketFor('twitter', position)).length > 0;
  });
  const full = focusedMedia.length >= LIMITS.twitterMedia;
  const colour = ringColour(count);

  const insertEmoji = (character: string) => {
    setChainPost(project, KEYS, index, (posts[index] ?? '') + character);
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
            addMedia(project.id, bucketFor('twitter', index), input.files, 'image', LIMITS.twitterMedia);
          }
          input.value = '';
        }}
        style="display:none"
      />

      <div style="width:100%;margin:0 0 20px;padding:10px 16px 6px;border-radius:16px;background:#000;color:#e7e9ea">
        <div style="display:flex;flex-direction:column;gap:2px">
          {posts.map((text, position) => (
            <ChainPost
              key={position}
              project={project}
              position={position}
              text={text}
              onFocus={() => setFocus(position)}
              onRemove={() => {
                removeChainPost(project, KEYS, position);
                setFocus((current) => Math.max(0, Math.min(current, posts.length - 2)));
              }}
            />
          ))}
        </div>

        <div style="display:flex;align-items:center;gap:7px;padding:12px 0 10px;font-size:14px;font-weight:700;color:#1d9bf0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18" />
          </svg>
          Everyone can reply
        </div>

        <div style="position:relative;display:flex;align-items:center;gap:2px;border-top:1px solid #2f3336;padding:8px 0 6px">
          <button
            onClick={() => fileInput.current?.click()}
            class="hov-twitter"
            disabled={full}
            title={full ? 'Four images is the limit for one post' : 'Add images'}
            aria-label="Add images"
            style={`display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:transparent;color:#b1b4b7;opacity:${
              full ? 0.4 : 1
            };cursor:${full ? 'default' : 'pointer'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="3" y="4" width="18" height="16" rx="2.5" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="m4 17.5 5-5 4.5 4.5 3-2.5 3.5 3.5" />
            </svg>
          </button>

          <button
            onClick={() => setEmojiOpen((open) => !open)}
            class="hov-twitter"
            title="Emoji"
            aria-label="Emoji"
            style={`display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:${
              emojiOpen ? '#181818' : 'transparent'
            };color:#b1b4b7;cursor:pointer`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <circle cx="12" cy="12" r="9" />
              <path d="M8.5 14.5a4.4 4.4 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />
            </svg>
          </button>

          <span style="flex:1" />

          {anything ? (
            <span style="display:flex;align-items:center;gap:8px;padding-right:10px;margin-right:4px;border-right:1px solid #2f3336">
              {count > LIMITS.twitterWarn ? (
                <span style={`font-size:13px;font-variant-numeric:tabular-nums;color:${colour}`}>
                  {LIMITS.twitter - count}
                </span>
              ) : null}
              <svg width="22" height="22" viewBox="0 0 24 24" style="transform:rotate(-90deg)">
                <circle cx="12" cy="12" r="9" fill="none" stroke="#2f3336" stroke-width="2" />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke={colour}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-dasharray={RING_LENGTH}
                  stroke-dashoffset={(RING_LENGTH * (1 - Math.min(1, count / LIMITS.twitter))).toFixed(1)}
                />
              </svg>
            </span>
          ) : null}

          <button
            onClick={() => setFocus(addChainPost(project, KEYS))}
            class="hov-twitter-accent"
            title="Add another post"
            aria-label="Add another post"
            style="display:grid;place-items:center;width:30px;height:30px;margin-right:10px;padding:0;border:1px solid #1d9bf0;border-radius:50%;background:transparent;color:#1d9bf0;cursor:pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {emojiOpen ? (
            <div style="position:absolute;left:0;bottom:46px;z-index:20;width:304px;padding:10px;border:1px solid #2f3336;border-radius:14px;background:#000;box-shadow:rgba(0,0,0,0.6) 0 8px 24px">
              <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:2px">
                {EMOJIS.map((character) => (
                  <button
                    key={character}
                    class="hov-twitter-soft"
                    onClick={() => insertEmoji(character)}
                    style="height:32px;padding:0;border:0;border-radius:8px;background:transparent;font-size:19px;line-height:1;cursor:pointer"
                  >
                    {character}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface PostProps {
  project: Project;
  position: number;
  text: string;
  onFocus: () => void;
  onRemove: () => void;
}

function ChainPost({ project, position, text, onFocus, onRemove }: PostProps) {
  const media = useMedia(project.id, bucketFor('twitter', position));

  return (
    <div style="display:flex;gap:12px;padding:4px 0">
      <span style="flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#16181c;color:#e7e9ea;font-family:var(--font-heading);font-size:14px">
        EY
      </span>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <textarea
            value={text}
            onInput={(event) =>
              setChainPost(project, { body: 'twitter_body', thread: 'twitter_thread' }, position, (event.target as HTMLTextAreaElement).value)
            }
            onFocus={onFocus}
            placeholder={position === 0 ? "What's happening?" : 'Add another post'}
            aria-label={position === 0 ? 'Post text' : `Post ${position + 1} text`}
            rows={2}
            style="flex:1;min-width:0;min-height:54px;resize:none;border:0;outline:none;background:transparent;color:#e7e9ea;font-family:inherit;font-size:19px;line-height:1.45;padding:7px 0 0"
          />
          {position > 0 ? (
            <button
              onClick={onRemove}
              class="hov-twitter"
              title="Remove post"
              aria-label="Remove post"
              style="flex:none;display:grid;place-items:center;width:30px;height:30px;margin-top:6px;padding:0;border:0;border-radius:50%;background:transparent;color:#1d9bf0;cursor:pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          ) : null}
        </div>

        {media.length ? (
          <div style="display:flex;flex-direction:column;gap:10px;padding-bottom:4px">
            <div style="display:flex;gap:4px">
              {media.map((item) => (
                <div
                  key={item.id}
                  style={`position:relative;flex:1;min-width:0;height:250px;border-radius:16px;overflow:hidden;background-color:#16181c;background-image:url("${item.url}");background-size:cover;background-position:center`}
                >
                  <span style="position:absolute;top:10px;left:10px;padding:5px 13px;border-radius:999px;background:rgba(0,0,0,0.72);font-size:13px;font-weight:700">
                    Edit
                  </span>
                  <button
                    onClick={() => removeMedia(project.id, bucketFor('twitter', position), item.id)}
                    class="hov-twitter-scrim"
                    title="Remove image"
                    aria-label={`Remove ${item.name}`}
                    style="position:absolute;top:9px;right:9px;display:grid;place-items:center;width:30px;height:30px;padding:0;border:0;border-radius:50%;background:rgba(0,0,0,0.72);color:#e7e9ea;cursor:pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
