import { defineConfig } from 'vite';
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [cssInjectedByJs()],
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'LevaVanilla',
      fileName: 'leva-vanilla',
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
});
