import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Helper to recursively find all HTML files
function getHtmlFiles(dir) {
  const files = {};
  fs.readdirSync(dir, { withFileTypes: true }).forEach((file) => {
    if (file.isDirectory() && file.name !== 'node_modules' && file.name !== 'dist') {
      Object.assign(files, getHtmlFiles(resolve(dir, file.name)));
    } else if (file.name.endsWith('.html')) {
      const name = file.name.replace('.html', '');
      files[name] = resolve(dir, file.name);
    }
  });
  return files;
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: getHtmlFiles(__dirname) // Build all HTML pages!
    }
  },
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
