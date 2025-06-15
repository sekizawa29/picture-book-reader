// 書籍データ管理
class BookDataManager {
    constructor() {
        this.books = [];
        this.booksPath = './books/';
        this.init();
    }
    
    async init() {
        await this.loadBooksData();
    }
    
    // 書籍データの読み込み
    async loadBooksData() {
        try {
            // 書籍リストの定義（実際の環境では動的に取得）
            const bookIds = ['book1']; // 今後追加される書籍のIDをここに追加
            
            for (const bookId of bookIds) {
                try {
                    const metadata = await this.loadBookMetadata(bookId);
                    if (metadata) {
                        this.books.push({
                            ...metadata,
                            path: `${this.booksPath}${bookId}/`
                        });
                    }
                } catch (error) {
                    console.warn(`書籍 ${bookId} の読み込みに失敗:`, error);
                }
            }
            
            console.log(`${this.books.length}冊の書籍を読み込みました`);
        } catch (error) {
            console.error('書籍データの読み込みエラー:', error);
        }
    }
    
    // 個別書籍のメタデータ読み込み
    async loadBookMetadata(bookId) {
        try {
            const response = await fetch(`${this.booksPath}${bookId}/metadata.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`書籍 ${bookId} のメタデータ読み込みエラー:`, error);
            return null;
        }
    }
    
    // 全書籍の取得
    getAllBooks() {
        return this.books;
    }
    
    // ID指定で書籍取得
    getBookById(bookId) {
        return this.books.find(book => book.id === bookId);
    }
    
    // カテゴリ別書籍取得
    getBooksByCategory(category) {
        return this.books.filter(book => book.category === category);
    }
    
    // タグ検索
    getBooksByTag(tag) {
        return this.books.filter(book => 
            book.tags && book.tags.includes(tag)
        );
    }
    
    // 書籍検索
    searchBooks(query) {
        const searchTerm = query.toLowerCase();
        return this.books.filter(book => 
            book.title.toLowerCase().includes(searchTerm) ||
            book.description.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            (book.tags && book.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    
    // サムネイル画像URLの取得
    getThumbnailUrl(book) {
        return `${book.path}${book.thumbnail}`;
    }
    
    // ページ画像URLの取得
    getPageUrl(book, pageIndex) {
        if (pageIndex >= 0 && pageIndex < book.pages.length) {
            return `${book.path}${book.pages[pageIndex]}`;
        }
        return null;
    }
    
    // 全ページのURLリスト取得
    getAllPageUrls(book) {
        return book.pages.map(page => `${book.path}${page}`);
    }
    
    // 書籍データの追加（動的追加用）
    addBook(bookData) {
        this.books.push(bookData);
    }
    
    // 読書進捗の保存（localStorage使用）
    saveReadingProgress(bookId, currentSpread, totalSpreads) {
        const progressKey = `reading_progress_${bookId}`;
        const progressData = {
            bookId,
            currentSpread,
            totalSpreads,
            lastRead: new Date().toISOString(),
            completed: currentSpread >= totalSpreads
        };
        localStorage.setItem(progressKey, JSON.stringify(progressData));
    }
    
    // 読書進捗の取得
    getReadingProgress(bookId) {
        const progressKey = `reading_progress_${bookId}`;
        const saved = localStorage.getItem(progressKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                console.error('読書進捗の取得エラー:', error);
            }
        }
        return null;
    }
    
    // 最近読んだ書籍の取得
    getRecentlyReadBooks(limit = 5) {
        const recentBooks = [];
        
        for (const book of this.books) {
            const progress = this.getReadingProgress(book.id);
            if (progress) {
                recentBooks.push({
                    ...book,
                    lastRead: new Date(progress.lastRead),
                    progress: progress
                });
            }
        }
        
        // 最後に読んだ日時でソート
        recentBooks.sort((a, b) => b.lastRead - a.lastRead);
        
        return recentBooks.slice(0, limit);
    }
    
    // 統計情報の取得
    getStats() {
        const totalBooks = this.books.length;
        const completedBooks = this.books.filter(book => {
            const progress = this.getReadingProgress(book.id);
            return progress && progress.completed;
        }).length;
        
        const categories = [...new Set(this.books.map(book => book.category))];
        const totalPages = this.books.reduce((sum, book) => sum + book.totalPages, 0);
        
        return {
            totalBooks,
            completedBooks,
            categories,
            totalPages,
            readingRate: totalBooks > 0 ? (completedBooks / totalBooks * 100).toFixed(1) : 0
        };
    }
}

// グローバルインスタンス
window.bookDataManager = new BookDataManager();