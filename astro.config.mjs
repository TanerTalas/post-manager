import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  // The reference design opens Projects on the same screen as the app, so the
  // route map's two names point at one page.
  redirects: {
    '/projects': '/app',
  },
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
