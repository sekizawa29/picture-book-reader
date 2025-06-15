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
  images: {
    unoptimized: true, // 既存の画像ファイルをそのまま使用
  },
}

export default withPWA(nextConfig)
