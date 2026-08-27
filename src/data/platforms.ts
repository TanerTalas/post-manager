export type PlatformId = 'reddit' | 'linkedin' | 'instagram' | 'twitter' | 'threads';

export interface Platform {
  id: PlatformId;
  name: string;
  icon: string;
}

export const PLATFORMS: Platform[] = [
  { id: 'reddit', name: 'Reddit', icon: '/icons/reddit.svg' },
  { id: 'linkedin', name: 'LinkedIn', icon: '/icons/linkedin.svg' },
  { id: 'instagram', name: 'Instagram', icon: '/icons/instagram.svg' },
  { id: 'twitter', name: 'Twitter / X', icon: '/icons/x.svg' },
  { id: 'threads', name: 'Threads', icon: '/icons/threads.svg' },
];

export const PLATFORM_IDS = PLATFORMS.map((p) => p.id);

/** Content keys, shaped as `<platform>_<field>`. Persisted verbatim. */
export const FIELDS = [
  'notes',
  'reddit_sub',
  'reddit_title',
  'reddit_body',
  'reddit_link',
  'reddit_flair',
  'reddit_nsfw',
  'linkedin_body',
  'instagram_caption',
  'instagram_location',
  'instagram_alt',
  'twitter_body',
  'threads_body',
  'threads_topic',
] as const;

export type FieldKey = (typeof FIELDS)[number];

export const RD_FLAIRS = [
  'No flair',
  'Resource',
  'Discussion',
  'News',
  'Showoff Saturday',
  'Question',
  'Article',
  'Career',
];

export const RD_SUBS = ['webdev', 'devops', 'javascript', 'SideProject', 'programming'];

export const EMOJIS = [
  '😀', '😄', '😊', '🙂', '😉', '😍', '🤩', '😎', '🤔', '🙌',
  '👏', '👍', '🙏', '💪', '🤝', '✍️', '🔥', '✨', '💡', '🎯',
  '🚀', '📈', '📊', '🧠', '⚙️', '🛠️', '🧩', '🔍', '📌', '📝',
  '📚', '🗓️', '⏱️', '✅', '❗', '❤️', '🎉', '🥳', '☕', '🌍',
];

/** Character budgets the composers surface to the writer. */
export const LIMITS = {
  twitter: 280,
  twitterWarn: 260,
  twitterMedia: 4,
  linkedin: 3000,
  instagram: 2200,
  redditTitle: 300,
} as const;
