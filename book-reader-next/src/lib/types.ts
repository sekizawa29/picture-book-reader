// 書籍データの型定義
export interface BookMetadata {
  id: string
  title: string
  description: string
  pages: string[]
  totalPages: number
  thumbnail: string
  author: string
  publishDate: string
  category: string
  tags: string[]
  readingTime: string
  ageRange: string
}

// 読書進捗の型定義
export interface ReadingProgress {
  bookId: string
  currentSpread: number
  totalSpreads: number
  lastRead: string
  completed: boolean
}

// 画面サイズ情報の型定義
export interface ViewportInfo {
  width: number
  height: number
  safeAreaTop: number
  safeAreaBottom: number
  safeAreaLeft: number
  safeAreaRight: number
  usableWidth: number
  usableHeight: number
}

// ページ表示情報の型定義
export interface PageDisplayInfo {
  leftPageUrl: string | null
  rightPageUrl: string | null
  spreadIndex: number
  totalSpreads: number
  isLastSpread: boolean
  isFirstSpread: boolean
}

// ジェスチャー情報の型定義
export interface GestureInfo {
  type: 'swipe' | 'tap' | 'pinch'
  direction?: 'left' | 'right' | 'up' | 'down'
  position?: { x: number; y: number }
  scale?: number
}