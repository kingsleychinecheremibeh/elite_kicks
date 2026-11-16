import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const page = (n) => resolve(import.meta.dirname, 'web', `${n}.html`);

export default defineConfig({
  root: 'web',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    chunkSizeWarningLimit: 800,
    emptyOutDir: true,
    rollupOptions: {
      input: { index: page('index'), shop: page('shop'), kit: page('kit'), booking: page('booking'), admin: page('admin') },
    },
  },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' } },
});
