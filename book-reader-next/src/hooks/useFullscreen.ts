'use client'

import { useState, useEffect, useCallback } from 'react'
import { ViewportInfo } from '@/lib/types'

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>({
    width: 0,
    height: 0,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    safeAreaLeft: 0,
    safeAreaRight: 0,
    usableWidth: 0,
    usableHeight: 0,
  })

  // ビューポート情報の更新
  const updateViewportInfo = useCallback(() => {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    
    // Safe Area の取得（CSS env() の値を取得）
    const computedStyle = getComputedStyle(document.documentElement)
    const safeAreaTop = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0')
    const safeAreaBottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0')
    const safeAreaLeft = parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
    const safeAreaRight = parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
    
    const usableWidth = width - safeAreaLeft - safeAreaRight
    const usableHeight = height - safeAreaTop - safeAreaBottom

    setViewportInfo({
      width,
      height,
      safeAreaTop,
      safeAreaBottom,
      safeAreaLeft,
      safeAreaRight,
      usableWidth,
      usableHeight,
    })
  }, [])

  // フルスクリーン状態の監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // ビューポート変更の監視
  useEffect(() => {
    updateViewportInfo()
    
    const handleResize = () => {
      updateViewportInfo()
    }

    const handleOrientationChange = () => {
      // オリエンテーション変更後の遅延実行
      setTimeout(updateViewportInfo, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [updateViewportInfo])

  // フルスクリーン切り替え
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen()
      } catch (error) {
        console.error('フルスクリーン化に失敗:', error)
      }
    } else {
      try {
        await document.exitFullscreen()
      } catch (error) {
        console.error('フルスクリーン解除に失敗:', error)
      }
    }
  }, [])

  // 自動フルスクリーン（モバイル用）
  const enterFullscreenMode = useCallback(() => {
    if (typeof window === 'undefined') return

    // iOS Safari では window.scrollTo(0, 1) でアドレスバーを隠す
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    
    if (isIOS && isSafari) {
      setTimeout(() => {
        window.scrollTo(0, 1)
      }, 100)
    }

    // Android Chrome では meta viewport を調整
    const viewport = document.querySelector('meta[name=viewport]')
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      )
    }
  }, [])

  return {
    isFullscreen,
    viewportInfo,
    toggleFullscreen,
    enterFullscreenMode,
    updateViewportInfo,
  }
}