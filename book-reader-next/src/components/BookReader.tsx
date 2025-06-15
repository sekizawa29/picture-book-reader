'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BookMetadata, PageDisplayInfo } from '@/lib/types'
import { getBookDataManager } from '@/lib/bookData'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useGestures } from '@/hooks/useGestures'

interface BookReaderProps {
  bookId: string
}

export default function BookReader({ bookId }: BookReaderProps) {
  const [book, setBook] = useState<BookMetadata | null>(null)
  const [currentSpread, setCurrentSpread] = useState(0)
  const [pageDisplay, setPageDisplay] = useState<PageDisplayInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState({ left: false, right: false })
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  
  const { viewportInfo, enterFullscreenMode } = useFullscreen()
  const containerRef = useRef<HTMLDivElement>(null)
  const leftImageRef = useRef<HTMLImageElement>(null)
  const rightImageRef = useRef<HTMLImageElement>(null)

  // 画像サイズ計算
  const calculateOptimalSizes = useCallback(() => {
    if (!aspectRatio || !viewportInfo.usableWidth || !viewportInfo.usableHeight) {
      return { width: 0, height: 0 }
    }

    const availableWidth = viewportInfo.usableWidth
    const availableHeight = viewportInfo.usableHeight

    // 見開きの場合は横幅を2倍で計算
    const spreadWidth = availableWidth
    const spreadHeight = availableHeight

    // アスペクト比を保持しながら最大サイズを計算
    const calculatedWidth = Math.min(spreadWidth, spreadHeight * aspectRatio * 2)
    const calculatedHeight = Math.min(spreadHeight, spreadWidth / aspectRatio / 2)

    // 各ページのサイズ
    const pageWidth = calculatedWidth / 2
    const pageHeight = calculatedHeight

    return { width: pageWidth, height: pageHeight }
  }, [aspectRatio, viewportInfo])

  // ページ表示情報の更新
  const updatePageDisplay = useCallback((spreadIndex: number) => {
    if (!book) return

    const leftPageIndex = spreadIndex * 2
    const rightPageIndex = spreadIndex * 2 + 1
    const totalSpreads = Math.ceil(book.pages.length / 2)

    const leftPageUrl = leftPageIndex < book.pages.length 
      ? getBookDataManager().getPageUrl(book, leftPageIndex)
      : null
    const rightPageUrl = rightPageIndex < book.pages.length
      ? getBookDataManager().getPageUrl(book, rightPageIndex)
      : null

    setPageDisplay({
      leftPageUrl,
      rightPageUrl,
      spreadIndex,
      totalSpreads,
      isLastSpread: spreadIndex >= totalSpreads - 1,
      isFirstSpread: spreadIndex === 0,
    })
  }, [book])

  // ページ遷移
  const goToNextSpread = useCallback(() => {
    if (!pageDisplay || pageDisplay.isLastSpread) return
    
    setDirection('left')
    setImageLoaded({ left: false, right: false })
    setCurrentSpread(prev => {
      const next = prev + 1
      updatePageDisplay(next)
      return next
    })
  }, [pageDisplay, updatePageDisplay])

  const goToPrevSpread = useCallback(() => {
    if (!pageDisplay || pageDisplay.isFirstSpread) return
    
    setDirection('right')
    setImageLoaded({ left: false, right: false })
    setCurrentSpread(prev => {
      const next = prev - 1
      updatePageDisplay(next)
      return next
    })
  }, [pageDisplay, updatePageDisplay])

  // ジェスチャー処理
  const { gestureProps, handleKeyDown } = useGestures({
    onSwipeLeft: goToNextSpread,
    onSwipeRight: goToPrevSpread,
    onTapLeft: goToPrevSpread,
    onTapRight: goToNextSpread,
  })

  // キーボードイベント
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 書籍データの読み込み
  useEffect(() => {
    const loadBook = async () => {
      try {
        const bookManager = getBookDataManager()
        await bookManager.init()
        
        const bookData = bookManager.getBookById(bookId)
        if (!bookData) {
          console.error('書籍が見つかりません:', bookId)
          return
        }

        setBook(bookData)

        // 読書進捗の復元
        const progress = bookManager.getReadingProgress(bookId)
        const initialSpread = progress?.currentSpread || 0
        setCurrentSpread(initialSpread)
        updatePageDisplay(initialSpread)

      } catch (error) {
        console.error('書籍データの読み込みエラー:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBook()
  }, [bookId, updatePageDisplay])

  // アスペクト比の計算
  useEffect(() => {
    if (!pageDisplay?.leftPageUrl) return

    const img = new window.Image()
    img.onload = () => {
      setAspectRatio(img.naturalWidth / img.naturalHeight)
    }
    img.src = pageDisplay.leftPageUrl
  }, [pageDisplay?.leftPageUrl])

  // 読書進捗の保存
  useEffect(() => {
    if (!book || !pageDisplay) return

    getBookDataManager().saveReadingProgress(
      book.id,
      currentSpread,
      pageDisplay.totalSpreads
    )
  }, [book, currentSpread, pageDisplay])

  // フルスクリーン初期化
  useEffect(() => {
    enterFullscreenMode()
  }, [enterFullscreenMode])

  // コントロール自動非表示
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000)
    return () => clearTimeout(timer)
  }, [currentSpread])

  // 画像読み込み完了チェック
  const handleImageLoad = useCallback((side: 'left' | 'right') => {
    setImageLoaded(prev => ({ ...prev, [side]: true }))
  }, [])

  if (isLoading || !book || !pageDisplay) {
    return (
      <div className="fullscreen-container safe-area flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">本を読み込み中...</p>
        </div>
      </div>
    )
  }

  const { width: pageWidth, height: pageHeight } = calculateOptimalSizes()
  const bothImagesLoaded = imageLoaded.left && (imageLoaded.right || !pageDisplay.rightPageUrl)

  return (
    <div 
      ref={containerRef}
      className="fullscreen-container safe-area bg-white overflow-hidden touch-optimized"
      {...gestureProps}
      onMouseMove={() => setShowControls(true)}
    >
      {/* ナビゲーションボタン */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 z-50 flex flex-col gap-2"
          >
            <Link href="/">
              <button className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-colors">
                🏠
              </button>
            </Link>
            <button 
              onClick={() => setShowControls(!showControls)}
              className="w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-colors"
            >
              ⚙️
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* メイン表示エリア */}
      <div className="w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSpread}
            custom={direction}
            initial={(direction) => ({
              x: direction === 'left' ? '100%' : direction === 'right' ? '-100%' : 0,
              opacity: 0
            })}
            animate={{ x: 0, opacity: 1 }}
            exit={(direction) => ({
              x: direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0,
              opacity: 0
            })}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 1
            }}
            className="flex items-center justify-center gpu-accelerated"
            style={{
              width: pageWidth * 2,
              height: pageHeight,
            }}
          >
            {/* 見開き表示 */}
            <div className="flex items-center justify-center">
              {/* 左ページ */}
              {pageDisplay.leftPageUrl && (
                <div 
                  className="relative flex-shrink-0"
                  style={{ width: pageWidth, height: pageHeight }}
                >
                  <Image
                    ref={leftImageRef}
                    src={pageDisplay.leftPageUrl}
                    alt={`${book.title} - ページ ${currentSpread * 2 + 1}`}
                    fill
                    className="object-contain"
                    onLoad={() => handleImageLoad('left')}
                    priority
                    sizes={`${pageWidth}px`}
                  />
                </div>
              )}

              {/* 右ページ */}
              {pageDisplay.rightPageUrl && (
                <div 
                  className="relative flex-shrink-0"
                  style={{ width: pageWidth, height: pageHeight }}
                >
                  <Image
                    ref={rightImageRef}
                    src={pageDisplay.rightPageUrl}
                    alt={`${book.title} - ページ ${currentSpread * 2 + 2}`}
                    fill
                    className="object-contain"
                    onLoad={() => handleImageLoad('right')}
                    priority
                    sizes={`${pageWidth}px`}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ローディングオーバーレイ */}
      <AnimatePresence>
        {!bothImagesLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-40"
          >
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* コントロールパネル */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 backdrop-blur-lg rounded-full px-6 py-3 shadow-lg z-50"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={goToPrevSpread}
                disabled={pageDisplay.isFirstSpread}
                className="w-10 h-10 bg-orange-500 disabled:bg-gray-300 text-white rounded-full transition-colors"
              >
                ←
              </button>
              
              <span className="text-sm font-medium min-w-[60px] text-center">
                {currentSpread + 1} / {pageDisplay.totalSpreads}
              </span>
              
              <button
                onClick={goToNextSpread}
                disabled={pageDisplay.isLastSpread}
                className="w-10 h-10 bg-orange-500 disabled:bg-gray-300 text-white rounded-full transition-colors"
              >
                →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}