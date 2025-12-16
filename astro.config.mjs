// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // Site URL (username.github.io)
  site: 'https://AntonioWalter.github.io',
  // Base path (repository name)
  base: '/Portfolio',

  output: 'static',

  integrations: [react()],

  build: {
    assets: '_assets',
    inlineStylesheets: 'auto',
  },

  vite: {
    build: {
      cssMinify: true,
    },
  },
});