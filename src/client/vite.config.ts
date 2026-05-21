import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: ".",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
      "/uploads/": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
    allowedHosts: ["localhost", "homeserver.tail752749.ts.net"]
  },
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
  },
});
