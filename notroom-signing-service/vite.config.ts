import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["lucide-react", "@radix-ui/react-slot"],
          "form-vendor": ["react-hook-form", "zod", "@hookform/resolvers"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === "production" ? "hidden" : true,
    reportCompressedSize: true,
    minify: mode === "production" ? "esbuild" : false,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
}))
