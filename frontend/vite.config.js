import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 相对路径：让产物能挂在 GitHub Pages 的子目录（/docs）下
  base: './',
  build: {
    // 打包直接输出到仓库根的 docs/ —— 供 Pages「Deploy from a branch」选 /docs 托管
    outDir: '../docs',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
});