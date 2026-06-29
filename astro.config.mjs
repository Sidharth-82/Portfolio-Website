import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://Sidharth-82.github.io',
  base: '/portfolio',
  integrations: [
    react(),
    // We import our own global.css (with the @tailwind directives + theme
    // tokens), so disable the integration's injected base stylesheet.
    tailwind({ applyBaseStyles: false }),
  ],
});
