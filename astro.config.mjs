import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  // If you later deploy to GitHub Pages under a sub-path, set these:
  // site: 'https://<user>.github.io',
  // base: '/<repo-name>',
  integrations: [
    react(),
    // We import our own global.css (with the @tailwind directives + theme
    // tokens), so disable the integration's injected base stylesheet.
    tailwind({ applyBaseStyles: false }),
  ],
});
