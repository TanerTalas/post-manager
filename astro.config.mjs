import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Every page is a file. The contact endpoint is not an Astro route at all:
  // it lives in /api and Vercel picks it up as a serverless function, which
  // keeps the site itself free of a server runtime.
  output: 'static',

  // Absolute URLs for canonical links and the OG image. Point this at the real
  // domain once there is one.
  site: 'https://post-manager.vercel.app',

  // The reference design opens Projects on the same screen as the app, so the
  // route map's two names point at one page.
  redirects: {
    '/projects': '/app',
  },

  integrations: [preact()],

  // The content security policy is written after the build by scripts/csp.mjs,
  // not by Astro's own CSP support. Astro always leaves one inline <style> of
  // its own, which puts a hash in style-src, and a hash there makes browsers
  // ignore 'unsafe-inline' in the same directive. The design lives in style
  // attributes, so that would take the whole layout down.

  build: {
    // Every rule in a linked stylesheet, so the pages carry as little inline
    // style as possible and the policy stays simple.
    inlineStylesheets: 'never',
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
