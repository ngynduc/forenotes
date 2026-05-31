import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/.git/**", "**/.gsd/**", "**/dist/**"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/client/src"),
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
});
