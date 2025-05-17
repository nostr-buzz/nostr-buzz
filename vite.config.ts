import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Fix WebSocket connectivity issues
    hmr: {
      // Use port 24678 to avoid conflicts with other services
      port: 24678,
      // Force WebSocket protocol to use safe options
      protocol: "ws",
      host: "localhost",
    },
    // Use strict ports to avoid port conflicts
    strictPort: false,
    // Allow connections from network
    host: true,
  },
  build: {
    // Generate manifest for PWA
    manifest: true,
    // Improve output for PWA
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@/components/ui"],
          "pwa-core": ["@/pwa.ts"],
        },
      },
    },
  },
})
