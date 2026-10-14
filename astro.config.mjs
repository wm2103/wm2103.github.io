import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import lazyImages from './scripts/markdown-images.mjs';
export default defineConfig({
  site: process.env.SITE_URL || 'https://wm2103.github.io',
  output: 'static',
  trailingSlash: 'always',
  publicDir: './static',
  markdown: {
    processor: satteri({ hastPlugins: [lazyImages] }),
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, wrap: false },
  },
});
