import { BookMetadata, ReadingProgress } from './types'

export class BookDataManager {
  private books: BookMetadata[] = []
  private readonly booksPath = '/books/'

  async init(): Promise<void> {
    await this.loadBooksData()
  }

  private async loadBooksData(): Promise<void> {
    try {
      // 書籍リストの定義
      const bookIds = ['book1', 'book2']
      
      for (const bookId of bookIds) {
        try {
          const metadata = await this.loadBookMetadata(bookId)
          if (metadata) {
            this.books.push({
              ...metadata,
              path: `${this.booksPath}${bookId}/`
            } as BookMetadata & { path: string })
          }
        } catch (error) {
          console.warn(`書籍 ${bookId} の読み込みに失敗:`, error)
        }
      }
      
      console.log(`${this.books.length}冊の書籍を読み込みました`)
    } catch (error) {
      console.error('書籍データの読み込みエラー:', error)
    }
  }

  private async loadBookMetadata(bookId: string): Promise<BookMetadata | null> {
    try {
      const response = await fetch(`${this.booksPath}${bookId}/metadata.json`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`書籍 ${bookId} のメタデータ読み込みエラー:`, error)
      return null
    }
  }

  getAllBooks(): BookMetadata[] {
    return this.books
  }

  getBookById(bookId: string): BookMetadata | undefined {
    return this.books.find(book => book.id === bookId)
  }

  getBooksByCategory(category: string): BookMetadata[] {
    return this.books.filter(book => book.category === category)
  }

  searchBooks(query: string): BookMetadata[] {
    const searchTerm = query.toLowerCase()
    return this.books.filter(book => 
      book.title.toLowerCase().includes(searchTerm) ||
      book.description.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm) ||
      (book.tags && book.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    )
  }

  getThumbnailUrl(book: BookMetadata): string {
    return `${this.booksPath}${book.id}/${book.thumbnail}`
  }

  getPageUrl(book: BookMetadata, pageIndex: number): string | null {
    if (pageIndex >= 0 && pageIndex < book.pages.length) {
      return `${this.booksPath}${book.id}/${book.pages[pageIndex]}`
    }
    return null
  }

  getAllPageUrls(book: BookMetadata): string[] {
    return book.pages.map(page => `${this.booksPath}${book.id}/${page}`)
  }

  // 読書進捗の保存
  saveReadingProgress(bookId: string, currentSpread: number, totalSpreads: number): void {
    if (typeof window === 'undefined') return
    
    const progressKey = `reading_progress_${bookId}`
    const progressData: ReadingProgress = {
      bookId,
      currentSpread,
      totalSpreads,
      lastRead: new Date().toISOString(),
      completed: currentSpread >= totalSpreads
    }
    localStorage.setItem(progressKey, JSON.stringify(progressData))
  }

  // 読書進捗の取得
  getReadingProgress(bookId: string): ReadingProgress | null {
    if (typeof window === 'undefined') return null
    
    const progressKey = `reading_progress_${bookId}`
    const saved = localStorage.getItem(progressKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (error) {
        console.error('読書進捗の取得エラー:', error)
      }
    }
    return null
  }

  // 最近読んだ書籍の取得
  getRecentlyReadBooks(limit: number = 5): (BookMetadata & { lastRead: Date; progress: ReadingProgress })[] {
    if (typeof window === 'undefined') return []
    
    const recentBooks: (BookMetadata & { lastRead: Date; progress: ReadingProgress })[] = []
    
    for (const book of this.books) {
      const progress = this.getReadingProgress(book.id)
      if (progress) {
        recentBooks.push({
          ...book,
          lastRead: new Date(progress.lastRead),
          progress: progress
        })
      }
    }
    
    // 最後に読んだ日時でソート
    recentBooks.sort((a, b) => b.lastRead.getTime() - a.lastRead.getTime())
    
    return recentBooks.slice(0, limit)
  }
}

// シングルトンインスタンス
let bookDataManager: BookDataManager | null = null

export const getBookDataManager = (): BookDataManager => {
  if (!bookDataManager) {
    bookDataManager = new BookDataManager()
  }
  return bookDataManager
}