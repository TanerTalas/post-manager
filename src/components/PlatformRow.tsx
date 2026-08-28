import type { Platform } from '~/data/platforms';
import type { Project } from '~/lib/types';
import { setAnchor } from '~/lib/anchors';
import { toggleRow } from '~/lib/store';
import type { Lang } from '~/i18n';
import RedditComposer from '~/components/composers/RedditComposer';
import LinkedInComposer from '~/components/composers/LinkedInComposer';
import InstagramComposer from '~/components/composers/InstagramComposer';
import TwitterComposer from '~/components/composers/TwitterComposer';
import ThreadsComposer from '~/components/composers/ThreadsComposer';

interface Props {
  platform: Platform;
  project: Project;
  lang: Lang;
}

const COMPOSERS = {
  reddit: RedditComposer,
  linkedin: LinkedInComposer,
  instagram: InstagramComposer,
  twitter: TwitterComposer,
  threads: ThreadsComposer,
} as const;

/**
 * One collapsible band per active platform. The band header stays in the site's
 * own visual language, the composer inside it wears the platform's.
 */
export function PlatformRow({ platform, project, lang }: Props) {
  const open = project.open[platform.id] === true;
  const Composer = COMPOSERS[platform.id];

  return (
    <div style="border-bottom:1px solid var(--color-divider)">
      <div
        ref={(el) => {
          if (platform.id === 'twitter') setAnchor('twitter', el);
        }}
        onClick={() => toggleRow(platform.id)}
        style="display:flex;align-items:center;gap:12px;padding:16px 2px;cursor:pointer"
      >
        <span
          style={`display:inline-flex;color:var(--color-accent);transform:rotate(${
            open ? '90deg' : '0deg'
          });transition:transform .3s ease`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
        <span style="display:grid;place-items:center;flex:none;width:26px;height:26px">
          <img
            src={platform.icon}
            alt=""
            width={22}
            height={22}
            style="display:block;width:22px;height:22px;object-fit:contain"
          />
        </span>
        <span style="font-size:16px;font-weight:600">{platform.name}</span>
      </div>

      <div
        style={`display:grid;grid-template-rows:${
          open ? '1fr' : '0fr'
        };transition:grid-template-rows .38s cubic-bezier(.4,0,.2,1)`}
      >
        <div style="overflow:hidden">
          <Composer project={project} lang={lang} />
        </div>
      </div>
    </div>
  );
}
