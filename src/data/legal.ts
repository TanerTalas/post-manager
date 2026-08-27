export type LegalSlug = 'privacy' | 'terms' | 'cookies' | 'contact';

export interface LegalSection {
  head: string;
  text: string;
}

export interface LegalPage {
  slug: LegalSlug;
  href: string;
  /** Label used in the side and mobile navigation. */
  nav: string;
  title: string;
  kicker: string;
  body: LegalSection[];
}

/**
 * Draft wording carried over from the reference design. These pages are
 * revisited last, once the app behaviour has settled.
 */
export const LEGAL: Record<Exclude<LegalSlug, 'contact'>, LegalPage> = {
  privacy: {
    slug: 'privacy',
    href: '/privacy',
    nav: 'Privacy Policy',
    title: 'Privacy Policy',
    kicker: 'Last revised 12 August 2026',
    body: [
      {
        head: 'What is collected',
        text: 'Nothing leaves your browser. Post Manager has no account system, no analytics and no server that receives your drafts. The text you type is written to your browser’s local storage and read back from it the next time you open the page.',
      },
      {
        head: 'What is not stored',
        text: 'Images and video are never saved. They are held in memory while the page is open and discarded when you close or reload it. If a draft depends on a specific image, keep the file yourself.',
      },
      {
        head: 'Clearing your data',
        text: 'Because everything lives in your browser, clearing your browsing data removes every project. There is no copy anywhere else and no way for us to restore one. Your browser settings are the only control you need.',
      },
      {
        head: 'Third parties',
        text: 'The page loads its typefaces from a font provider and nothing else. No advertising, tracking or embedded social scripts are present.',
      },
    ],
  },
  terms: {
    slug: 'terms',
    href: '/terms',
    nav: 'Terms of Use',
    title: 'Terms of Use',
    kicker: 'Last revised 12 August 2026',
    body: [
      {
        head: 'What this tool is',
        text: 'Post Manager is a drafting aid. It shows you approximations of each platform’s composer so you can write with the right shape in mind. It does not publish anything, and it is not affiliated with any of the platforms it imitates.',
      },
      {
        head: 'Your content is yours',
        text: 'You keep every right to what you write here. No licence is granted to anyone by using the tool, because nothing is transmitted anywhere.',
      },
      {
        head: 'Availability',
        text: 'The tool is offered as it is, without a promise that it will keep working, stay online, or preserve your drafts. Treat it as a scratchpad, not an archive.',
      },
      {
        head: 'Fair use',
        text: 'Do not use the tool to prepare content that is unlawful where you are, or that you intend to publish in violation of a platform’s own rules.',
      },
    ],
  },
  cookies: {
    slug: 'cookies',
    href: '/cookies',
    nav: 'Cookies',
    title: 'Cookies',
    kicker: 'Last revised 12 August 2026',
    body: [
      {
        head: 'No cookies are set',
        text: 'Post Manager sets no cookies of its own. It uses local storage, which behaves differently: it is not sent with network requests and it never leaves your device.',
      },
      {
        head: 'What is kept there',
        text: 'Your projects, their names, the platforms you have activated, which composers you left open, and whether you have already seen the tour. Nothing that identifies you.',
      },
      {
        head: 'Why it is kept',
        text: 'So that reopening the page puts you back exactly where you were: the same tabs, the same project in front of you, the same text in every box. Without it every reload would start from an empty page.',
      },
      {
        head: 'Removing it',
        text: 'Clearing site data for this page in your browser settings removes all of it at once. Deleting a project from inside the tool removes just that project.',
      },
    ],
  },
};

export const LEGAL_NAV: { href: string; label: string; slug: LegalSlug }[] = [
  { href: '/privacy', label: 'Privacy Policy', slug: 'privacy' },
  { href: '/terms', label: 'Terms of Use', slug: 'terms' },
  { href: '/cookies', label: 'Cookies', slug: 'cookies' },
  { href: '/contact', label: 'Contact Me', slug: 'contact' },
];

export const DRAFT_NOTE =
  'Draft text. This page will be replaced with the final wording before launch.';
