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
    kicker: 'Last revised 28 August 2026',
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
        head: 'When you write to me',
        text: 'The contact page is the one place where something does leave your browser, and only because you pressed send. Your name, your address and your message are passed to a mail service that delivers them to my inbox. Your address is used to reply and nothing else. Your drafts are never part of it.',
      },
      {
        head: 'Third parties',
        text: 'Three, and only three. Vercel serves the pages. Google Fonts serves the typefaces. Cloudflare Turnstile runs the spam check, and it runs on the contact page alone. Messages you send are handed to Resend, which delivers them to my inbox. No advertising, no analytics, no embedded social scripts.',
      },
    ],
  },
  terms: {
    slug: 'terms',
    href: '/terms',
    nav: 'Terms of Use',
    title: 'Terms of Use',
    kicker: 'Last revised 28 August 2026',
    body: [
      {
        head: 'What this tool is',
        text: 'Post Manager is a drafting aid. It shows you approximations of each platform’s composer so you can write with the right shape in mind. It does not publish anything, and it is not affiliated with any of the platforms it imitates.',
      },
      {
        head: 'Your content is yours',
        text: 'You keep every right to what you write here. No licence is granted to anyone by using the tool, because your drafts are never transmitted anywhere. A message you deliberately send from the contact page is the one exception, and it goes only to me.',
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
    kicker: 'Last revised 28 August 2026',
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
        head: 'The spam check',
        text: 'The contact page runs Cloudflare Turnstile, which may set a short lived cookie of its own to remember that you already passed it. It is there to tell people from bots, it does not follow you across sites, and it appears on that one page only.',
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
