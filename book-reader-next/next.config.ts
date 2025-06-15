import type { NextConfig } from 'next'
import withPWAInit from 'next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  sw: 'sw.js',
  reloadOnOnline: true,
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export', // 静的エクスポート
  trailingSlash: true, // GitHub Pages対応
  basePath: process.env.NODE_ENV === 'production' ? '/picture-book-reader' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/picture-book-reader/' : '',
  images: {
    unoptimized: true, // 静的エクスポート時は必須
  },
}

export default withPWA(nextConfig)
