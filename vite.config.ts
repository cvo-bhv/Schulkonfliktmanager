import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // <--- Diese Zeile ist entscheidend!
  plugins: [react()],
  base: './', // This ensures all asset paths in the build are relative (e.g., "./assets/index.js")
});
