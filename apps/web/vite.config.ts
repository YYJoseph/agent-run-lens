import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@traceforge/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url))
    }
  },
  server: {
    port: 5173,
    strictPort: false
  }
});
