import { useRef, useState } from 'preact/hooks';
import { EMOJIS } from '~/data/platforms';
import { addChainPost, bucketFor, chainPosts, removeChainPost, setChainPost } from '~/lib/chain';
import { addMedia, removeMedia, useMedia } from '~/lib/media';
import { readField, setField } from '~/lib/store';
import type { Project } from '~/lib/types';

interface Props {
  project: Project;
}

const KEYS = { body: 'threads_body', thread: 'threads_thread' };
const SANS = "-apple-system, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif";

export default function ThreadsComposer({ project }: Props) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const target = useRef(0);
  const [emojiFor, setEmojiFor] = useState(-1);

  const posts = chainPosts(project, KEYS);
  const topic = readField(project, 'threads_topic');

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
            addMedia(project.id, bucketFor('threads', target.current), input.files, 'image');
          }
          input.value = '';
        }}
        style="display:none"
      />

      <div
        style={`width:100%;margin:0 0 20px;border:1px solid rgba(0,0,0,0.1);border-radius:20px;background:#fff;color:#000;font-family:${SANS};box-shadow:rgba(0,0,0,0.07) 0 6px 22px;overflow:hidden`}
      >
        <div style="display:flex;align-items:center;justify-content:center;padding:13px 18px;border-bottom:1px solid rgba(0,0,0,0.09)">
          <span style="font-size:16px;font-weight:700">New thread</span>
        </div>

        <div style="display:flex;flex-direction:column;padding:16px 18px 4px">
          {posts.map((text, position) => (
            <ChainPost
              key={position}
              project={project}
              position={position}
              text={text}
              topic={topic}
              emojiOpen={emojiFor === position}
              onToggleEmoji={() => setEmojiFor((current) => (current === position ? -1 : position))}
              onAddMedia={() => {
                target.current = position;
                fileInput.current?.click();
              }}
              onRemove={() => {
                removeChainPost(project, KEYS, position);
                setEmojiFor(-1);
              }}
            />
          ))}

          <div
            onClick={() => addChainPost(project, KEYS)}
            style="display:flex;align-items:center;gap:12px;padding:0 0 16px;cursor:pointer"
          >
            <span style="flex:none;display:grid;place-items:center;width:24px;height:24px;margin-left:6px;border-radius:50%;background:#f2f2f2;color:#c4c4c4;font-size:11px;font-weight:600">
              f
            </span>
            <span style="font-size:15px;color:#999">Add to thread</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PostProps {
  project: Project;
  position: number;
  text: string;
  topic: string;
  emojiOpen: boolean;
  onToggleEmoji: () => void;
  onAddMedia: () => void;
  onRemove: () => void;
}

function ChainPost({
  project,
  position,
  text,
  topic,
  emojiOpen,
  onToggleEmoji,
  onAddMedia,
  onRemove,
}: PostProps) {
  const media = useMedia(project.id, bucketFor('threads', position));
  const first = position === 0;

  return (
    <div style="display:flex;gap:12px">
      <div style="flex:none;display:flex;flex-direction:column;align-items:center;width:36px">
        <span style="flex:none;display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:#ececec;color:#8a8a8a;font-size:14px;font-weight:600">
          f
        </span>
        <span style="flex:1;width:2px;margin:8px 0 2px;border-radius:2px;background:rgba(0,0,0,0.13)" />
      </div>

      <div style="flex:1;min-width:0;padding-bottom:16px">
        <div style="display:flex;align-items:center;gap:7px;min-height:36px">
          <span style="flex:none;font-size:15px;font-weight:700">fenni.dev</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8b8b8" stroke-width="2.2" stroke-linecap="round" style="flex:none">
            <path d="m9 18 6-6-6-6" />
          </svg>

          {first ? (
            <input
              value={topic}
              onInput={(event) => setField('threads_topic', (event.target as HTMLInputElement).value)}
              placeholder="Community or topic"
              aria-label="Community or topic"
              style="min-width:172px;max-width:100%;padding:0;border:0;outline:none;background:transparent;font-family:inherit;font-size:15px;font-weight:600;color:#000"
            />
          ) : (
            <>
              {topic ? (
                <span style="min-width:0;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  {topic}
                </span>
              ) : null}
              <span style="flex:none;padding:2px 9px;border-radius:999px;background:#f0f0f0;color:#8a8a8a;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums">
                {position + 1}
              </span>
            </>
          )}

          <span style="flex:1" />

          {!first ? (
            <button
              onClick={onRemove}
              class="hov-light"
              title="Remove this post"
              aria-label="Remove this post"
              style="flex:none;display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;border-radius:50%;background:transparent;color:#000;cursor:pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          ) : null}
        </div>

        <textarea
          value={text}
          onInput={(event) =>
            setChainPost(
              project,
              { body: 'threads_body', thread: 'threads_thread' },
              position,
              (event.target as HTMLTextAreaElement).value,
            )
          }
          placeholder={first ? "What's new?" : 'Say more'}
          aria-label={first ? 'Post text' : `Post ${position + 1} text`}
          rows={1}
          style="width:100%;min-height:26px;margin-top:2px;resize:none;border:0;outline:none;background:transparent;font-family:inherit;font-size:15px;line-height:1.45;color:#000;padding:0"
        />

        {media.length ? (
          <div style="display:flex;gap:6px;margin-top:12px">
            {media.map((item) => (
              <div
                key={item.id}
                style={`position:relative;flex:1;min-width:0;height:196px;border-radius:14px;overflow:hidden;background-color:#f0f0f0;background-image:url("${item.url}");background-size:cover;background-position:center`}
              >
                <button
                  onClick={() => removeMedia(project.id, bucketFor('threads', position), item.id)}
                  class="hov-scrim"
                  title="Remove"
                  aria-label={`Remove ${item.name}`}
                  style="position:absolute;top:8px;right:8px;display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;border-radius:50%;background:rgba(0,0,0,0.62);color:#fff;cursor:pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div style="position:relative;display:flex;align-items:center;gap:4px;margin-top:10px;color:#999">
          {media.length ? (
            <button
              onClick={onAddMedia}
              class="hov-light"
              title="Add image"
              style="display:flex;align-items:center;gap:7px;height:32px;padding:0 12px 0 8px;border:0;border-radius:999px;background:transparent;color:inherit;font-family:inherit;font-size:14px;cursor:pointer"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                <rect x="3" y="4.5" width="18" height="15" rx="3.5" />
                <path d="m4 16 4.5-4.5 4 4 3-2.5L20 17" />
              </svg>
              Add
            </button>
          ) : (
            <button
              onClick={onAddMedia}
              class="hov-light"
              title="Add image"
              aria-label="Add image"
              style="display:grid;place-items:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                <rect x="3" y="4.5" width="18" height="15" rx="3.5" />
                <path d="m4 16 4.5-4.5 4 4 3-2.5L20 17" />
              </svg>
            </button>
          )}

          <button
            onClick={onToggleEmoji}
            class="hov-light"
            title="Emoji"
            aria-label="Emoji"
            style={`display:grid;place-items:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:${
              emojiOpen ? 'rgba(0,0,0,0.05)' : 'transparent'
            };color:inherit;cursor:pointer`}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
              <circle cx="12" cy="12" r="8.6" />
              <path d="M8.7 14.4a4.3 4.3 0 0 0 6.6 0M9.2 9.6h.01M14.8 9.6h.01" />
            </svg>
          </button>

          {emojiOpen ? (
            <div style="position:absolute;left:0;top:38px;z-index:20;width:300px;padding:10px;border:1px solid rgba(0,0,0,0.1);border-radius:14px;background:#fff;box-shadow:rgba(0,0,0,0.16) 0 8px 24px">
              <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:2px">
                {EMOJIS.map((character) => (
                  <button
                    key={character}
                    class="hov-light"
                    onClick={() =>
                      setChainPost(
                        project,
                        { body: 'threads_body', thread: 'threads_thread' },
                        position,
                        text + character,
                      )
                    }
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
