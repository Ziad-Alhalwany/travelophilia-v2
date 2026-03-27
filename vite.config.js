import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // إعداد الـ Alias بشكل نظيف عشان Shadcn والمستقبل
      "@": resolve(process.cwd(), "./src"),
    },
  },

  // مهم: نخلي Vite يركز في الـ entries بتاعة الفرونت بس
  optimizeDeps: {
    entries: ["index.html", "src/main.jsx"],
  },

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
