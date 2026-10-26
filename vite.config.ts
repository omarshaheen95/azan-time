import { defineConfig } from 'vite';

// Tauri expects a fixed port and no clearing of its own output.
export default defineConfig({
  clearScreen: false,
  server: { port: 1420, strictPort: true, watch: { ignored: ['**/src-tauri/**'] } },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  // places.json (the city search, 2.7 MB) is its own chunk, loaded on the first search only.
  build: { target: 'chrome120', outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 3000 },
});
