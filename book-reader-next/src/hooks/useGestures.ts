'use client'

import { useCallback, useRef, useState } from 'react'
import { GestureInfo } from '@/lib/types'

interface UseGesturesProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onTapLeft?: () => void
  onTapRight?: () => void
  onPinchZoom?: (scale: number) => void
  sensitivity?: number
}

export const useGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onTapLeft,
  onTapRight,
  onPinchZoom,
  sensitivity = 50
}: UseGesturesProps) => {
  const [isTracking, setIsTracking] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })
  const startTime = useRef(0)
  const initialDistance = useRef(0)
  const lastScale = useRef(1)

  // タッチスタート
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return

    setIsTracking(true)
    startPos.current = { x: touch.clientX, y: touch.clientY }
    startTime.current = Date.now()

    // ピンチズーム用の初期距離
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      initialDistance.current = distance
      lastScale.current = 1
    }
  }, [])

  // タッチムーブ
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTracking) return

    // ピンチズーム処理
    if (e.touches.length === 2 && onPinchZoom) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      if (initialDistance.current > 0) {
        const scale = distance / initialDistance.current
        if (Math.abs(scale - lastScale.current) > 0.1) {
          onPinchZoom(scale)
          lastScale.current = scale
        }
      }
    }
  }, [isTracking, onPinchZoom])

  // タッチエンド
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isTracking) return

    const touch = e.changedTouches[0]
    if (!touch) return

    const endPos = { x: touch.clientX, y: touch.clientY }
    const deltaX = endPos.x - startPos.current.x
    const deltaY = endPos.y - startPos.current.y
    const deltaTime = Date.now() - startTime.current
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    setIsTracking(false)

    // スワイプ判定（速い動作で十分な距離移動）
    if (distance > sensitivity && deltaTime < 300) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平スワイプ
        if (deltaX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      }
      return
    }

    // タップ判定（短時間で小さな移動）
    if (distance < 20 && deltaTime < 300) {
      const element = e.currentTarget as HTMLElement
      const rect = element.getBoundingClientRect()
      const centerX = rect.width / 2
      
      if (endPos.x - rect.left < centerX) {
        onTapLeft?.()
      } else {
        onTapRight?.()
      }
    }
  }, [isTracking, sensitivity, onSwipeLeft, onSwipeRight, onTapLeft, onTapRight])

  // マウスイベント（デスクトップ用）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsTracking(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    startTime.current = Date.now()
  }, [])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isTracking) return

    const endPos = { x: e.clientX, y: e.clientY }
    const deltaX = endPos.x - startPos.current.x
    const deltaY = endPos.y - startPos.current.y
    const deltaTime = Date.now() - startTime.current
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    setIsTracking(false)

    // クリック判定
    if (distance < 10 && deltaTime < 300) {
      const element = e.currentTarget as HTMLElement
      const rect = element.getBoundingClientRect()
      const centerX = rect.width / 2
      
      if (endPos.x - rect.left < centerX) {
        onTapLeft?.()
      } else {
        onTapRight?.()
      }
    }
  }, [isTracking, onTapLeft, onTapRight])

  // キーボードイベント
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        onSwipeRight?.() // 左矢印で前のページ（右スワイプ相当）
        break
      case 'ArrowRight':
        e.preventDefault()
        onSwipeLeft?.() // 右矢印で次のページ（左スワイプ相当）
        break
      case ' ':
        e.preventDefault()
        onSwipeLeft?.() // スペースで次のページ
        break
    }
  }, [onSwipeLeft, onSwipeRight])

  return {
    gestureProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
    },
    isTracking,
    handleKeyDown,
  }
}