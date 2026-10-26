import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    watch: {
      // Editors that write "safe save" temp files into src/ can leave locked
      // paths behind; watching them makes chokidar throw EBUSY on Windows.
      ignored: ['**/*.tmpdir/**', '**/*.tmp'],
    },
  },
})
