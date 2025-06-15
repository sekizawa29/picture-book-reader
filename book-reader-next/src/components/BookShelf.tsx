'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookMetadata } from '@/lib/types'
import { getBookDataManager } from '@/lib/bookData'

interface BookShelfProps {
  onBookSelect?: (bookId: string) => void
}

export default function BookShelf({ onBookSelect }: BookShelfProps) {
  const [books, setBooks] = useState<BookMetadata[]>([])
  const [recentBooks, setRecentBooks] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const bookManager = getBookDataManager()
        await bookManager.init()
        
        const allBooks = bookManager.getAllBooks()
        const recent = bookManager.getRecentlyReadBooks(5)
        
        setBooks(allBooks)
        setRecentBooks(recent)
      } catch (error) {
        console.error('書籍データの読み込みエラー:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBooks()
  }, [])

  // フィルタリングされた書籍リスト
  const filteredBooks = books.filter(book => {
    const matchesSearch = searchQuery === '' || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // カテゴリリスト
  const categories = ['all', ...Array.from(new Set(books.map(book => book.category)))]

  if (isLoading) {
    return (
      <div className="fullscreen-container safe-area flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">書籍を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fullscreen-container safe-area bg-gradient-to-br from-orange-50 to-orange-100">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <h1 className="text-xl font-bold">絵本リーダー</h1>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span>📖</span>
                {books.length}冊
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* 検索セクション */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
            {/* 検索バー */}
            <div className="mb-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="本のタイトル、作者、タグで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            {/* カテゴリフィルター */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'すべて' : category}
                </button>
              ))}
            </div>
          </div>

          {/* 最近読んだ本 */}
          {recentBooks.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>⏰</span>
                最近読んだ本
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recentBooks.map((book) => (
                  <motion.div
                    key={book.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0"
                  >
                    <Link href={`/book/${book.id}`}>
                      <div className="bg-white rounded-xl shadow-md overflow-hidden w-24 cursor-pointer">
                        <div className="aspect-[3/4] relative">
                          <Image
                            src={getBookDataManager().getThumbnailUrl(book)}
                            alt={book.title}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                        <div className="p-2">
                          <h3 className="text-xs font-medium text-gray-800 line-clamp-2">
                            {book.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* 書籍グリッド */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>📚</span>
              すべての本
            </h2>
            
            {filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">📖</span>
                <h3 className="text-lg font-medium text-gray-800 mb-2">本が見つかりません</h3>
                <p className="text-gray-600">検索条件を変更してみてください</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredBooks.map((book) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="gpu-accelerated"
                  >
                    <Link href={`/book/${book.id}`}>
                      <div className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer touch-optimized">
                        <div className="aspect-[3/4] relative">
                          <Image
                            src={getBookDataManager().getThumbnailUrl(book)}
                            alt={book.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                          />
                          {/* 読書進捗表示 */}
                          {(() => {
                            const progress = getBookDataManager().getReadingProgress(book.id)
                            if (progress) {
                              return (
                                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                                  progress.completed ? 'bg-green-500 text-white' : 'bg-black bg-opacity-50 text-white'
                                }`}>
                                  {progress.completed ? '完読' : `${Math.round((progress.currentSpread / progress.totalSpreads) * 100)}%`}
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
                            {book.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2">{book.author}</p>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span>📄</span>
                              {book.totalPages}p
                            </span>
                            <span className="flex items-center gap-1">
                              <span>⏱️</span>
                              {book.readingTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}