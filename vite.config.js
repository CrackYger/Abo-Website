import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ base: 'https://github.com/CrackYger/Abo-Website/edit/main/vite.config.js' })


export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.js'
  }
})
