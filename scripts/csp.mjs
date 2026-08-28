import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Stamps a content security policy into every built page.
 *
 * Written here rather than in vercel.json because script hashes change with the
 * build, and a headers file committed to the repo would drift the moment Astro
 * or one of the page scripts changed. A meta tag is generated from the very
 * bytes that shipped, so it cannot go stale.
 *
 * Astro's own experimental CSP is not used: it also hashes inline styles, and a
 * hash in style-src makes browsers ignore 'unsafe-inline' in that directive,
 * which would block the style attributes the whole design is built from.
 *
 * frame-ancestors is absent on purpose. A meta policy cannot carry it, so it is
 * set as a real header in vercel.json alongside X-Frame-Options.
 */

const DIST = 'dist';
const TURNSTILE = 'https://challenges.cloudflare.com';
const FONT_CSS = 'https://fonts.googleapis.com';
const FONT_FILES = 'https://fonts.gstatic.com';

const BASE = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  // Media previews are object URLs. Nothing is fetched from a third party.
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  `font-src 'self' ${FONT_FILES}`,
  // The design's measurements live in style attributes. No hash may appear in
  // this directive or 'unsafe-inline' stops counting.
  `style-src 'self' 'unsafe-inline' ${FONT_CSS}`,
  `frame-src ${TURNSTILE}`,
  `connect-src 'self' ${TURNSTILE}`,
  'upgrade-insecure-requests',
];

async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith('.html')) found.push(path);
  }
  return found;
}

function scriptHashes(html) {
  const hashes = new Set();
  const pattern = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const [, attributes, body] = match;
    if (/\ssrc=/.test(attributes) || !body.length) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
  return [...hashes].sort();
}

const files = await htmlFiles(DIST);
let stamped = 0;

for (const file of files) {
  const html = await readFile(file, 'utf8');
  // Redirect stubs are a meta refresh and nothing else: no head, no script, no
  // style, so there is nothing for a policy to protect.
  if (!html.includes('<head>')) continue;

  const policy = [
    ...BASE,
    `script-src 'self' ${TURNSTILE} ${scriptHashes(html).join(' ')}`.trim(),
  ].join('; ');

  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy.replace(/"/g, '&quot;')}">`;
  await writeFile(file, html.replace('<head>', `<head>${meta}`), 'utf8');
  stamped += 1;
}

console.log(
  `content security policy stamped into ${stamped} pages, ${files.length - stamped} redirect stub(s) skipped`,
);
