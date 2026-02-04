import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "LevaVanilla",
      fileName: "leva-vanilla",
      formats: ["es"],
    },
  },
});
