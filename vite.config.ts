import { defineConfig } from 'vite';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

export default defineConfig({
  plugins: [libInjectCss()],
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
