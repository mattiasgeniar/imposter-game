/// <reference types="vitest/config" />
import { execFileSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function gitInfo() {
  try {
    return { commit: git('rev-parse', '--short', 'HEAD'), date: git('log', '-1', '--format=%cI') }
  } catch {
    return { commit: 'dev', date: new Date().toISOString() }
  }
}

const { commit: APP_COMMIT, date: APP_COMMIT_DATE } = gitInfo()

const v = (file: string) => `${file}?v=${APP_COMMIT}`

export default defineConfig({
  define: {
    __APP_COMMIT__: JSON.stringify(APP_COMMIT),
    __APP_COMMIT_DATE__: JSON.stringify(APP_COMMIT_DATE),
  },
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  plugins: [
    react(),
    {
      name: 'imposter-html-cache-bust',
      transformIndexHtml(html) {
        return html.replace(
          /(href=")(\/?(?:favicon-32|icon-192|apple-touch-icon)\.png)(")/g,
          `$1$2?v=${APP_COMMIT}$3`,
        )
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'],
      manifest: {
        name: 'Imposter',
        short_name: 'Imposter',
        description: 'Een offline imposter-spel voor op één toestel.',
        theme_color: '#0b0d12',
        background_color: '#0b0d12',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'nl-BE',
        icons: [
          { src: v('icon-192.png'), sizes: '192x192', type: 'image/png' },
          { src: v('icon-512.png'), sizes: '512x512', type: 'image/png' },
          { src: v('icon-maskable.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,mp3}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
