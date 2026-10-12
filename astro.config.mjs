// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Deployed as a GitHub Pages *project* site, so every URL lives under /tuntunir-boi/.
// Internal links must go through `import.meta.env.BASE_URL` to pick up that prefix.
export default defineConfig({
  site: 'https://deepyaman.github.io',
  base: '/tuntunir-boi',
  integrations: [mdx()],
});
