import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/check-room': 'http://localhost:3000',
      '/api': 'http://localhost:8080',
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      },
      '/recordings': 'http://localhost:3000',
      '/upload-recording': 'http://localhost:3000'
    }
  }
});
