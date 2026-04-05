import { defineConfig } from 'vite';
export default defineConfig({
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
