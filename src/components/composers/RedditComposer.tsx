import { useEffect, useRef, useState } from 'preact/hooks';
import { LIMITS, NO_FLAIR, RD_FLAIRS, RD_SUBS } from '~/data/platforms';
import { addMedia, removeMedia, setMedia, useMedia } from '~/lib/media';
import { readField, readFlag, setField } from '~/lib/store';
import type { Project } from '~/lib/types';
import { translator, type Lang } from '~/i18n';

const MUTED = '#8ba2ad';
const DANGER = '#ff585b';

interface Props {
  project: Project;
  lang: Lang;
}

/** Strips the rich body back to plain text, to decide which placeholder shows. */
function bodyText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const roundBtn =
  'display:grid;place-items:center;flex:none;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit';

export default function RedditComposer({ project, lang }: Props) {
  const t = translator(lang);
  const body = useRef<HTMLDivElement | null>(null);
  const range = useRef<Range | null>(null);
  const loadedFor = useRef<string | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const videoInput = useRef<HTMLInputElement | null>(null);

  const [subOpen, setSubOpen] = useState(false);
  const [flairOpen, setFlairOpen] = useState(false);
  const [flairDraft, setFlairDraft] = useState('');
  const [nsfwDraft, setNsfwDraft] = useState(false);
  const [flairQuery, setFlairQuery] = useState('');
  const [showAllFlairs, setShowAllFlairs] = useState(false);
  const [linkPanel, setLinkPanel] = useState(false);
  const [linkDraft, setLinkDraft] = useState('');
  const [linkTouched, setLinkTouched] = useState(false);
  const [linkMenu, setLinkMenu] = useState(false);
  const [inlineLink, setInlineLink] = useState<{ text: string; url: string } | null>(null);

  const media = useMedia(project.id, 'reddit');
  const images = media.filter((item) => item.kind === 'image');
  const video = media.find((item) => item.kind === 'video') ?? null;

  const title = readField(project, 'reddit_title');
  const link = readField(project, 'reddit_link').trim();
  const flair = readField(project, 'reddit_flair');
  const nsfw = readFlag(project, 'reddit_nsfw');
  const html = readField(project, 'reddit_body');

  // A link or a video takes the post over; images and links exclude each other.
  const locked = Boolean(link) || Boolean(video);
  const linkOff = locked || images.length > 0;
  const videoOff = locked || images.length > 0;
  const optional = Boolean(link) || media.length > 0;

  // The rich body is uncontrolled, so it is written only when the project
  // underneath it changes. Re-writing on every keystroke would drop the caret.
  useEffect(() => {
    const el = body.current;
    if (!el || loadedFor.current === project.id) return;
    loadedFor.current = project.id;
    el.innerHTML = html;
  }, [project.id, html]);

  useEffect(() => {
    const onSelect = () => {
      const selection = window.getSelection();
      const el = body.current;
      if (selection?.rangeCount && el && selection.anchorNode && el.contains(selection.anchorNode)) {
        range.current = selection.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener('selectionchange', onSelect);
    return () => document.removeEventListener('selectionchange', onSelect);
  }, []);

  const sync = () => {
    if (body.current) setField('reddit_body', body.current.innerHTML);
  };

  const restoreRange = () => {
    const el = body.current;
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    if (!selection) return;
    if (range.current && el.contains(range.current.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(range.current);
      return;
    }
    const end = document.createRange();
    end.selectNodeContents(el);
    end.collapse(false);
    selection.removeAllRanges();
    selection.addRange(end);
  };

  const wrap = (before: string, after: string) => {
    if (!body.current) return;
    restoreRange();
    const selected = window.getSelection()?.toString() ?? '';
    document.execCommand('insertText', false, before + selected + after);
    sync();
  };

  const insertNode = (template: string) => {
    const el = body.current;
    if (!el) return;
    restoreRange();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const target = selection.getRangeAt(0);
    const text = selection.toString();
    const holder = document.createElement('div');
    holder.innerHTML = template.replace('{{TEXT}}', text ? escapeHtml(text) : '​');
    const node = holder.firstChild;
    if (!node) return;

    target.deleteContents();
    target.insertNode(node);

    const after = document.createRange();
    after.selectNodeContents(node);
    after.collapse(false);
    selection.removeAllRanges();
    selection.addRange(after);
    range.current = after.cloneRange();
    sync();
  };

  const insertLink = (text: string, url: string) => {
    restoreRange();
    const safeUrl = url.replace(/"/g, '&quot;');
    document.execCommand(
      'insertHTML',
      false,
      `<span style="color:#4aa3ff" data-href="${escapeHtml(safeUrl)}">${escapeHtml(text || url)}</span>&nbsp;`,
    );
    sync();
  };

  const openFlair = () => {
    setFlairDraft(flair);
    setNsfwDraft(nsfw);
    setFlairQuery('');
    setShowAllFlairs(false);
    setSubOpen(false);
    setFlairOpen(true);
  };

  const commitLink = () => {
    const value = linkDraft.trim();
    if (!value) {
      setLinkTouched(true);
      return;
    }
    setField('reddit_link', value);
    setLinkPanel(false);
    setLinkTouched(false);
  };

  const flairLabel = (entry: string) => (entry === NO_FLAIR ? t('reddit.noFlair') : entry);
  const flairList = RD_FLAIRS.filter((entry) =>
    flairLabel(entry).toLowerCase().includes(flairQuery.trim().toLowerCase()),
  );
  const shownFlairs = showAllFlairs ? flairList : flairList.slice(0, 5);

  return (
    <div style="width:100%;margin:0 0 24px;background:#0e1113;border:1px solid rgba(255,255,255,0.09);border-radius:18px;padding:18px 22px 12px;display:flex;flex-direction:column;gap:18px;font-family:-apple-system, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif;color:#e5ebee;line-height:1.3">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="position:relative">
          <button
            onClick={() => setSubOpen((open) => !open)}
            class="hov-dark"
            style="display:flex;align-items:center;gap:9px;height:46px;padding:4px 14px 4px 5px;border:1px solid rgba(255,255,255,0.18);border-radius:999px;background:transparent;color:#e5ebee;font-family:inherit;font-size:16px;font-weight:700;cursor:pointer"
          >
            <span style="display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:50%;background:#f5f1ee">
              <img src="/icons/reddit.svg" alt="" width={22} height={22} style="display:block;width:22px;height:22px" />
            </span>
            <span>r/{readField(project, 'reddit_sub').trim() || t('reddit.chooseCommunity')}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />
            </svg>
          </button>

          {subOpen ? (
            <div style="position:absolute;left:0;top:54px;z-index:30;width:308px;padding:10px;background:#181c1f;border:1px solid rgba(255,255,255,0.12);border-radius:14px;box-shadow:0 12px 34px rgba(0,0,0,0.55);animation:tipIn .16s ease">
              <input
                value={readField(project, 'reddit_sub')}
                onInput={(event) => setField('reddit_sub', (event.target as HTMLInputElement).value)}
                placeholder={t('reddit.searchCommunities')}
                style="width:100%;height:38px;padding:0 14px;border:1px solid rgba(255,255,255,0.14);border-radius:999px;background:rgba(255,255,255,0.06);color:#e5ebee;font-family:inherit;font-size:14px;outline:none"
              />
              <div style="display:flex;flex-direction:column;gap:2px;margin-top:8px">
                {RD_SUBS.map((name) => (
                  <button
                    key={name}
                    class="hov-dark"
                    onClick={() => {
                      setField('reddit_sub', name);
                      setSubOpen(false);
                    }}
                    style="display:flex;align-items:center;gap:10px;padding:9px 10px;border:0;border-radius:8px;background:transparent;color:#e5ebee;font-family:inherit;font-size:14px;text-align:left;cursor:pointer"
                  >
                    r/{name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={imageInput}
        onChange={(event) => {
          const input = event.target as HTMLInputElement;
          if (input.files?.length) addMedia(project.id, 'reddit', input.files, 'image');
          input.value = '';
        }}
        style="display:none"
      />
      <input
        type="file"
        accept="video/*"
        ref={videoInput}
        onChange={(event) => {
          const input = event.target as HTMLInputElement;
          const file = input.files?.[0];
          input.value = '';
          if (!file) return;
          setMedia(project.id, 'reddit', []);
          addMedia(project.id, 'reddit', [file], 'video');
        }}
        style="display:none"
      />

      <div style="position:relative;padding-top:2px">
        <input
          value={title}
          onInput={(event) => setField('reddit_title', (event.target as HTMLInputElement).value)}
          maxLength={LIMITS.redditTitle}
          aria-label={t('reddit.postTitle')}
          style="width:100%;padding:0;border:0;outline:none;background:transparent;font-family:inherit;font-size:20px;font-weight:700;line-height:1.35;color:#e5ebee"
        />
        {!title ? (
          <span style={`position:absolute;left:0;top:2px;pointer-events:none;font-size:20px;font-weight:700;line-height:1.35;color:${MUTED}`}>
            {t('reddit.title')}
            <span style={`color:${DANGER}`}>*</span>
          </span>
        ) : null}
      </div>

      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        {!flair && !nsfw ? (
          <button
            onClick={openFlair}
            class="hov-dark"
            style="display:flex;align-items:center;gap:9px;height:38px;padding:0 17px;border:1px solid rgba(255,255,255,0.24);border-radius:999px;background:transparent;color:#e5ebee;font-family:inherit;font-size:14px;font-weight:600;white-space:nowrap;cursor:pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
              <path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h8.6l8 8a1 1 0 0 1 0 2.4Z" />
              <circle cx="7.5" cy="7.5" r="1.3" />
            </svg>
            {t('reddit.addFlair')}
          </button>
        ) : null}

        {flair ? (
          <span style="display:inline-flex;align-items:center;height:32px;padding:0 15px;border-radius:999px;background:#dde3e6;color:#0b1416;font-size:13px;font-weight:600">
            {flair}
          </span>
        ) : null}

        {nsfw ? (
          <span style={`display:inline-flex;align-items:center;height:32px;padding:0 13px;border-radius:999px;border:1px solid ${DANGER};color:${DANGER};font-size:12px;font-weight:700;letter-spacing:0.04em`}>
            {t('reddit.nsfw')}
          </span>
        ) : null}

        {flair || nsfw ? (
          <button
            onClick={openFlair}
            class="hov-dark"
            title={t('reddit.editFlair')}
            aria-label={t('reddit.editFlair')}
            style="display:grid;place-items:center;flex:none;width:34px;height:34px;padding:0;border:1px solid rgba(255,255,255,0.28);border-radius:50%;background:transparent;color:#e5ebee;cursor:pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        ) : null}
      </div>

      {linkPanel ? (
        <div style="border:1px solid rgba(255,255,255,0.13);border-radius:16px;padding:16px 18px 18px;background:#0b0e10">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
            <span style="font-size:17px;font-weight:700">{t('reddit.addLink')}</span>
            <button
              onClick={() => {
                setLinkPanel(false);
                setLinkTouched(false);
              }}
              class="hov-dark-strong"
              title={t('common.close')}
              aria-label={t('common.close')}
              style="display:grid;place-items:center;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,0.12);color:#e5ebee;cursor:pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div style="margin-top:14px;border:2px solid #e5ebee;border-radius:16px;padding:9px 16px 11px">
            <div style={`font-size:13px;color:${MUTED}`}>
              {t('reddit.linkUrl')} <span style={`color:${DANGER}`}>*</span>
            </div>
            <input
              value={linkDraft}
              autofocus
              onInput={(event) => {
                setLinkDraft((event.target as HTMLInputElement).value);
                setLinkTouched(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitLink();
                }
                if (event.key === 'Escape') setLinkPanel(false);
              }}
              onBlur={() => {
                if (linkDraft.trim()) commitLink();
                else setLinkTouched(true);
              }}
              placeholder="https://"
              style="width:100%;margin-top:4px;padding:0;border:0;outline:none;background:transparent;font-family:inherit;font-size:15px;color:#e5ebee"
            />
          </div>
          {linkTouched && !linkDraft.trim() ? (
            <div style={`display:flex;align-items:center;gap:8px;margin-top:10px;color:${DANGER};font-size:14px`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5.5M12 16.5h.01" />
              </svg>
              {t('reddit.fillField')}
            </div>
          ) : null}
        </div>
      ) : null}

      {!linkPanel && link ? (
        <div style="position:relative;display:flex;align-items:center;gap:12px;border:1px solid rgba(255,255,255,0.13);border-radius:16px;padding:15px 14px 15px 20px">
          <span style="flex:1;min-width:0;font-size:15px;color:#7cb8dc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            {link}
          </span>
          <button
            onClick={() => setLinkMenu((open) => !open)}
            class="hov-dark-strong"
            title={t('reddit.linkOptions')}
            aria-label={t('reddit.linkOptions')}
            style="display:grid;place-items:center;flex:none;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,0.12);color:#e5ebee;cursor:pointer"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5.5" cy="12" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="18.5" cy="12" r="1.7" />
            </svg>
          </button>

          {linkMenu ? (
            <div style="position:absolute;right:10px;top:56px;z-index:30;width:180px;padding:6px;background:#181c1f;border:1px solid rgba(255,255,255,0.12);border-radius:12px;box-shadow:0 12px 34px rgba(0,0,0,0.55);animation:tipIn .16s ease">
              <button
                class="hov-dark"
                onClick={() => {
                  setLinkDraft(link);
                  setLinkMenu(false);
                  setLinkTouched(false);
                  setLinkPanel(true);
                }}
                style="display:block;width:100%;padding:9px 10px;border:0;border-radius:8px;background:transparent;color:#e5ebee;font-family:inherit;font-size:14px;text-align:left;cursor:pointer"
              >
                {t('reddit.editLink')}
              </button>
              <button
                class="hov-remove"
                onClick={() => {
                  setField('reddit_link', '');
                  setLinkMenu(false);
                  setLinkPanel(false);
                }}
                style={`display:block;width:100%;padding:9px 10px;border:0;border-radius:8px;background:transparent;color:${DANGER};font-family:inherit;font-size:14px;text-align:left;cursor:pointer`}
              >
                {t('reddit.removeLink')}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {images.length ? (
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          {images.map((item) => (
            <div key={item.id} style="position:relative;width:104px;height:104px;border-radius:10px;overflow:hidden;background:#1a1f22">
              <div
                title={item.name}
                style={`width:100%;height:100%;background-image:url("${item.url}");background-size:cover;background-position:center`}
              />
              <button
                onClick={() => removeMedia(project.id, 'reddit', item.id)}
                class="hov-scrim"
                title={t('common.remove')}
                aria-label={`${t('common.remove')}: ${item.name}`}
                style="position:absolute;top:6px;right:6px;display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:50%;background:rgba(0,0,0,0.65);color:#fff;cursor:pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {video ? (
        <div style="display:flex;align-items:center;gap:12px;border:1px solid rgba(255,255,255,0.13);border-radius:14px;padding:12px 14px">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9bb0ba" stroke-width="1.6" stroke-linecap="round" style="flex:none">
            <rect x="3" y="6" width="12.5" height="12" rx="2.5" />
            <path d="m16.6 11 4.4-2.8v7.6L16.6 13Z" />
          </svg>
          <span style="flex:1;min-width:0;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            {video.name}
          </span>
          <button
            onClick={() => removeMedia(project.id, 'reddit', video.id)}
            class="hov-dark-strong"
            title={t('reddit.removeVideo')}
            aria-label={t('reddit.removeVideo')}
            style="display:grid;place-items:center;flex:none;width:30px;height:30px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,0.12);color:#e5ebee;cursor:pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : null}

      <div style="position:relative">
        <div
          ref={body}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={t('reddit.postBody')}
          onInput={(event) => setField('reddit_body', (event.target as HTMLDivElement).innerHTML)}
          style="display:block;width:100%;min-height:150px;padding:0;outline:none;font-family:inherit;font-size:15px;line-height:1.6;color:#e5ebee;white-space:pre-wrap;word-break:break-word"
        />
        {!bodyText(html) ? (
          <span style={`position:absolute;left:0;top:0;pointer-events:none;font-size:16px;line-height:1.5;color:${MUTED}`}>
            {optional ? (
              t('reddit.bodyOptional')
            ) : (
              <>
                {t('reddit.bodyRequired')}
                <span style={`color:${DANGER}`}>*</span>
              </>
            )}
          </span>
        ) : null}
      </div>

      <div style="display:flex;align-items:center;gap:2px;flex-wrap:wrap;color:#9bb0ba;font-size:15px">
        <button
          class="hov-dark-ink"
          onClick={() => {
            if (linkOff) return;
            setLinkDraft(link);
            setLinkTouched(false);
            setLinkMenu(false);
            setLinkPanel(true);
          }}
          disabled={linkOff}
          title={t(linkOff ? 'reddit.linkOrMedia' : 'reddit.addLink')}
          aria-label={t('reddit.addLink')}
          style={`${roundBtn};cursor:${linkOff ? 'default' : 'pointer'};opacity:${linkOff ? 0.35 : 1}`}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
            <path d="M9.5 14.5 14.5 9.5" />
            <path d="M8.8 11.4 7 13.2a3.7 3.7 0 0 0 5.2 5.2l1.8-1.8" />
            <path d="M15.2 12.6 17 10.8a3.7 3.7 0 0 0-5.2-5.2L10 7.4" />
          </svg>
        </button>

        <button

          class="hov-dark-ink"
          onClick={() => imageInput.current?.click()}
          disabled={locked}
          title={t(locked ? 'reddit.linkOrMedia' : 'reddit.addImage')}
          aria-label={t('reddit.addImage')}
          style={`${roundBtn};cursor:${locked ? 'default' : 'pointer'};opacity:${locked ? 0.35 : 1}`}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="3" y="4.5" width="18" height="15" rx="2" />
            <path d="m3.5 16.5 4.6-5 3.4 3.6 2.6-2.6 6.4 5.4" />
            <circle cx="8.4" cy="9.4" r="1.4" />
          </svg>
        </button>

        <button

          class="hov-dark-ink"
          onClick={() => videoInput.current?.click()}
          disabled={videoOff}
          title={t(videoOff ? 'reddit.videoAlone' : 'reddit.addVideo')}
          aria-label={t('reddit.addVideo')}
          style={`${roundBtn};cursor:${videoOff ? 'default' : 'pointer'};opacity:${videoOff ? 0.35 : 1}`}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <rect x="3" y="6" width="12.5" height="12" rx="2.5" />
            <path d="m16.6 11 4.4-2.8v7.6L16.6 13Z" />
          </svg>
        </button>

        <span style="width:1px;height:22px;background:rgba(255,255,255,0.14);margin:0 8px" />

        <button class="hov-dark-ink" onClick={() => wrap('**', '**')} title={t('reddit.bold')} style={`${roundBtn};font-family:inherit;font-size:16px;font-weight:700;cursor:pointer`}>
          B
        </button>
        <button class="hov-dark-ink" onClick={() => wrap('*', '*')} title={t('reddit.italic')} style={`${roundBtn};font-family:var(--font-serif);font-size:17px;font-style:italic;cursor:pointer`}>
          i
        </button>
        <button class="hov-dark-ink" onClick={() => wrap('~~', '~~')} title={t('reddit.strike')} style={`${roundBtn};font-family:inherit;font-size:15px;text-decoration:line-through;cursor:pointer`}>
          S
        </button>
        <button
          class="hov-dark-ink"
          onClick={() => wrap('^(', ')')}
          title={t('reddit.superscript')}
          style={`${roundBtn};font-family:inherit;font-size:15px;cursor:pointer`}
        >
          X²
        </button>
        <button
          class="hov-dark-ink"
          onClick={() => wrap('## ', '')}
          title={t('reddit.heading')}
          style={`${roundBtn};display:flex;align-items:baseline;justify-content:center;font-family:inherit;cursor:pointer`}
        >
          <span style="font-size:12px">t</span>
          <span style="font-size:17px">T</span>
        </button>

        <span style="width:1px;height:22px;background:rgba(255,255,255,0.14);margin:0 8px" />

        <button

          class="hov-dark-ink"
          onClick={() => setInlineLink({ text: '', url: '' })}
          title={t('reddit.insertLink')}
          aria-label={t('reddit.insertLink')}
          style={`${roundBtn};cursor:pointer`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
            <path d="M9.5 14.5 14.5 9.5" />
            <path d="M8.8 11.4 7 13.2a3.7 3.7 0 0 0 5.2 5.2l1.8-1.8" />
            <path d="M15.2 12.6 17 10.8a3.7 3.7 0 0 0-5.2-5.2L10 7.4" />
          </svg>
        </button>

        <button class="hov-dark-ink" onClick={() => wrap('- ', '')} title={t('reddit.bulleted')} aria-label={t('reddit.bulleted')} style={`${roundBtn};cursor:pointer`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
            <path d="M9 7h11M9 12h11M9 17h11" />
            <circle cx="4.6" cy="7" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="4.6" cy="12" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="4.6" cy="17" r="1.2" fill="currentColor" stroke="none" />
          </svg>
        </button>

        <button class="hov-dark-ink" onClick={() => wrap('1. ', '')} title={t('reddit.numbered')} aria-label={t('reddit.numbered')} style={`${roundBtn};cursor:pointer`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
            <path d="M9 7h11M9 12h11M9 17h11" />
            <path d="M4 5.6 5.2 5v3.4M3.6 11.2h1.8L3.6 13.6h1.9M3.6 15.6h1.8v1.4H3.8v1.4h1.6" />
          </svg>
        </button>

        <button

          class="hov-dark-ink"
          onClick={() =>
            insertNode(
              '<span style="background:#4e5558;color:#e5ebee;border-radius:2px;padding:2px 6px">{{TEXT}}</span>',
            )
          }
          title={t('reddit.spoiler')}
          aria-label={t('reddit.spoiler')}
          style={`${roundBtn};cursor:pointer`}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <path d="M12 3.4 3.6 8v8L12 20.6 20.4 16V8Z" />
            <path d="M12 8.4v4.2M12 15.6h.01" />
          </svg>
        </button>

        <button

          class="hov-dark-ink"
          onClick={() =>
            insertNode(
              '<div style="border-left:3px solid rgba(255,255,255,0.35);padding:2px 0 2px 16px;margin:10px 0">{{TEXT}}</div>',
            )
          }
          title={t('reddit.quote')}
          style={`${roundBtn};font-family:inherit;font-size:15px;font-weight:600;cursor:pointer`}
        >
          66
        </button>

        <button

          class="hov-dark-ink"
          onClick={() =>
            insertNode(
              '<code style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:3px;padding:1px 5px">{{TEXT}}</code>',
            )
          }
          title={t('reddit.inlineCode')}
          style={`${roundBtn};font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;cursor:pointer`}
        >
          &lt;/&gt;
        </button>

        <button

          class="hov-dark-ink"
          onClick={() =>
            insertNode(
              '<div style="border:1px solid rgba(255,255,255,0.22);border-radius:4px;padding:11px 14px;margin:10px 0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px">{{TEXT}}</div>',
            )
          }
          title={t('reddit.codeBlock')}
          aria-label={t('reddit.codeBlock')}
          style={`${roundBtn};cursor:pointer`}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
            <path d="m10 9.6-2.2 2.4 2.2 2.4M14 9.6l2.2 2.4-2.2 2.4" />
          </svg>
        </button>
      </div>

      <div style="height:1px;background:rgba(255,255,255,0.12);margin-bottom:6px" />

      {flairOpen ? (
        <div
          style="position:fixed;inset:0;z-index:88;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,0.6);animation:fadeIn .18s ease"
          onClick={() => setFlairOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style="width:100%;max-width:560px;max-height:86vh;overflow:auto;background:#0e1113;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px 26px 26px;font-family:-apple-system, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif;color:#e5ebee;line-height:1.3"
          >
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
              <span style="font-size:21px;font-weight:700">{t('reddit.addFlair')}</span>
              <button
                onClick={() => setFlairOpen(false)}
                class="hov-dark-strong"
                title="Close"
                aria-label="Close"
                style="display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,0.12);color:#e5ebee;cursor:pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={`font-size:15px;color:${MUTED};margin-top:22px`}>{t('reddit.flair')}</div>
            <input
              value={flairQuery}
              onInput={(event) => setFlairQuery((event.target as HTMLInputElement).value)}
              placeholder={t('reddit.searchFlair')}
              style="width:100%;height:42px;margin-top:12px;padding:0 16px;border:1px solid rgba(255,255,255,0.16);border-radius:999px;background:rgba(255,255,255,0.05);color:#e5ebee;font-family:inherit;font-size:14px;outline:none"
            />

            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px">
              {shownFlairs.map((entry) => {
                const on = flairDraft === entry || (entry === NO_FLAIR && !flairDraft);
                return (
                  <button
                    key={entry}
                    onClick={() => setFlairDraft(entry)}
                    style={`display:inline-flex;align-items:center;height:36px;padding:0 16px;border-radius:999px;border:1px solid ${
                      on ? '#e5ebee' : 'rgba(255,255,255,0.22)'
                    };background:${on ? '#dde3e6' : 'transparent'};color:${
                      on ? '#0b1416' : '#e5ebee'
                    };font-family:inherit;font-size:13px;font-weight:600;cursor:pointer`}
                  >
                    {flairLabel(entry)}
                  </button>
                );
              })}
            </div>

            {flairList.length > 5 ? (
              <button
                onClick={() => setShowAllFlairs((all) => !all)}
                style="margin-top:12px;padding:6px 4px;border:0;background:transparent;color:#e5ebee;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer"
              >
                {t(showAllFlairs ? 'reddit.showFewer' : 'reddit.showAll')}
              </button>
            ) : null}

            <div style={`font-size:15px;color:${MUTED};margin-top:26px`}>{t('reddit.tags')}</div>

            <div style="display:flex;align-items:center;gap:16px;margin-top:16px">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e5ebee" stroke-width="1.3" style="flex:none">
                <path d="M12 2.6 21.4 12 12 21.4 2.6 12Z" />
                <text x="12" y="14.6" text-anchor="middle" font-size="7" fill="#e5ebee" stroke="none" font-family="Helvetica, Arial, sans-serif">
                  18
                </text>
              </svg>
              <div style="flex:1;min-width:0">
                <div style="font-size:17px;font-weight:600">{t('reddit.nsfwFull')}</div>
                <div style={`font-size:13px;color:${MUTED};margin-top:3px`}>{t('reddit.nsfwNote')}</div>
              </div>
              <button
                onClick={() => setNsfwDraft((on) => !on)}
                title={t('reddit.toggleNsfw')}
                aria-pressed={nsfwDraft}
                style="flex:none;padding:0;border:0;background:transparent;cursor:pointer"
              >
                <span
                  style={`display:flex;align-items:center;justify-content:${
                    nsfwDraft ? 'flex-end' : 'flex-start'
                  };width:56px;height:32px;padding:3px;border-radius:999px;background:${
                    nsfwDraft ? '#4aa3ff' : 'rgba(255,255,255,0.22)'
                  }`}
                >
                  <span style="width:26px;height:26px;border-radius:50%;background:#fff" />
                </span>
              </button>
            </div>

            <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:30px">
              <button
                onClick={() => setFlairOpen(false)}
                class="hov-lift-dark"
                style="height:44px;padding:0 26px;border:0;border-radius:999px;background:rgba(255,255,255,0.1);color:#e5ebee;font-family:inherit;font-size:15px;font-weight:600;cursor:pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  setField('reddit_flair', flairDraft);
                  setField('reddit_nsfw', nsfwDraft);
                  setFlairOpen(false);
                }}
                class="hov-lift-light"
                style="height:44px;padding:0 32px;border:0;border-radius:999px;background:#e5ebee;color:#0b1416;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer"
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {inlineLink ? (
        <div
          style="position:fixed;inset:0;z-index:89;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,0.6);animation:fadeIn .18s ease"
          onClick={() => setInlineLink(null)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style="width:100%;max-width:500px;background:#0e1113;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px 26px 26px;font-family:-apple-system, system-ui, 'Segoe UI', Helvetica, Arial, sans-serif;color:#e5ebee;line-height:1.3"
          >
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
              <span style="font-size:21px;font-weight:700">{t('reddit.insertLinkTitle')}</span>
              <button
                onClick={() => setInlineLink(null)}
                class="hov-dark-strong"
                title="Close"
                aria-label="Close"
                style="display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,0.12);color:#e5ebee;cursor:pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={`font-size:13px;color:${MUTED};margin-top:20px`}>{t('reddit.linkText')}</div>
            <input
              value={inlineLink.text}
              onInput={(event) =>
                setInlineLink({ ...inlineLink, text: (event.target as HTMLInputElement).value })
              }
              placeholder={t('reddit.linkTextPlaceholder')}
              style="width:100%;height:42px;margin-top:6px;padding:0 14px;border:1px solid rgba(255,255,255,0.16);border-radius:10px;background:rgba(255,255,255,0.05);color:#e5ebee;font-family:inherit;font-size:15px;outline:none"
            />

            <div style={`font-size:13px;color:${MUTED};margin-top:16px`}>
              {t('reddit.url')} <span style={`color:${DANGER}`}>*</span>
            </div>
            <input
              value={inlineLink.url}
              autofocus
              onInput={(event) =>
                setInlineLink({ ...inlineLink, url: (event.target as HTMLInputElement).value })
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  const url = inlineLink.url.trim();
                  if (!url) return;
                  const text = inlineLink.text.trim();
                  setInlineLink(null);
                  setTimeout(() => insertLink(text, url), 0);
                }
                if (event.key === 'Escape') setInlineLink(null);
              }}
              placeholder="https://"
              style="width:100%;height:42px;margin-top:6px;padding:0 14px;border:1px solid rgba(255,255,255,0.16);border-radius:10px;background:rgba(255,255,255,0.05);color:#e5ebee;font-family:inherit;font-size:15px;outline:none"
            />

            <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:26px">
              <button
                onClick={() => setInlineLink(null)}
                class="hov-lift-dark"
                style="height:44px;padding:0 26px;border:0;border-radius:999px;background:rgba(255,255,255,0.1);color:#e5ebee;font-family:inherit;font-size:15px;font-weight:600;cursor:pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  const url = inlineLink.url.trim();
                  if (!url) return;
                  const text = inlineLink.text.trim();
                  setInlineLink(null);
                  setTimeout(() => insertLink(text, url), 0);
                }}
                disabled={!inlineLink.url.trim()}
                style={`height:44px;padding:0 32px;border:0;border-radius:999px;background:#e5ebee;color:#0b1416;font-family:inherit;font-size:15px;font-weight:700;cursor:${
                  inlineLink.url.trim() ? 'pointer' : 'default'
                };opacity:${inlineLink.url.trim() ? 1 : 0.5}`}
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
