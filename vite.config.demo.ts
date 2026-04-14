import { defineConfig } from 'vite';
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  base: './',
  plugins: [cssInjectedByJs()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
