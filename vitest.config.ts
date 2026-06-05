import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@traceforge/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url))
    }
  },
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true
  }
});
