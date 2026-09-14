import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // IISでbackend(Django)がフロントエンドの静的ファイルも配信する構成のため、
  // ビルド時はDjangoのSTATIC_URL配下のパスをベースにする（devサーバーはそのまま/）。
  base: command === 'build' ? '/static/react/' : '/',
  test: {
    environment: 'jsdom',
  },
}))
