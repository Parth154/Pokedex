import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 4200,
    strictPort: true,
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', '.localhost'],
  },
  preview: {
    host: '0.0.0.0',
    port: 4200,
    strictPort: true,
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', '.localhost'],
  },
});
