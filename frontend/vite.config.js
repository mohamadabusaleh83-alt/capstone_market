import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (mode === 'production' && !env.VITE_API_URL) {
    // only capstone-market.vercel.app falls back to the production API; other hosts will not work (I-46)
    console.warn('[warn] VITE_API_URL is not set: only the production domain will reach the API.')
  }
  return {
    plugins: [react()],
    base: '/',
  }
})
