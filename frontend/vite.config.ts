import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy /api requests to the Go gateway in development.
      // In production (Vercel mock deployment) this proxy is unused —
      // all API calls return fixture data via mock mode.
      "/api": {
        target: process.env.VITE_API_URL ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
