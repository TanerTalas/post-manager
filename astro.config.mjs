import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  // Absolute URLs for canonical links and the OG image. Point this at the real
  // domain once there is one.
  site: 'https://post-manager.local',
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
