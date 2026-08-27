import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The client runs on :5173 and talks to the Express API on :8080.
// We proxy the API + OGC paths in dev so the browser sees a single origin
// (no CORS preflight) and the app can call fetch("/v1/...") directly.
const API_TARGET = process.env.VITE_API_TARGET || "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/v1": { target: API_TARGET, changeOrigin: true },
      "/geoserver": { target: API_TARGET, changeOrigin: true },
      "/health": { target: API_TARGET, changeOrigin: true },
    },
  },
});
