import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Genera los íconos de la PWA (Android, iOS y favicon) a partir de un solo SVG.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: minimal2023Preset,
  images: ['public/logo.svg'],
});
