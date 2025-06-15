// 本棚メイン機能
class LibraryManager {
    constructor() {
        this.filteredBooks = [];
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        this.initElements();
        this.initEventListeners();
        await this.loadLibrary();
    }
    
    initElements() {
        // メイン要素
        this.app = document.getElementById('app');
        this.booksGrid = document.getElementById('booksGrid');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.noResults = document.getElementById('noResults');
        this.booksTitle = document.getElementById('booksTitle');
        
        // ヘッダー・統計
        this.totalBooksSpan = document.getElementById('totalBooks');
        this.headerStats = document.getElementById('headerStats');
        
        // 検索関連
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.categoryFilters = document.getElementById('categoryFilters');
        
        // その他
        this.refreshBtn = document.getElementById('refreshBtn');
        this.recentSection = document.getElementById('recentSection');
        this.recentBooks = document.getElementById('recentBooks');
        this.statsModal = document.getElementById('statsModal');
        this.closeStatsModal = document.getElementById('closeStatsModal');
        this.statsContent = document.getElementById('statsContent');
    }
    
    initEventListeners() {
        // 検索機能
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim();
            this.updateSearchUI();
            this.filterAndDisplayBooks();
        });
        
        this.clearSearchBtn.addEventListener('click', () => {
            this.clearSearch();
        });
        
        // リフレッシュボタン
        this.refreshBtn.addEventListener('click', () => {
            this.refreshLibrary();
        });
        
        // 統計モーダル
        this.headerStats.addEventListener('click', () => {
            this.showStatsModal();
        });
        
        this.closeStatsModal.addEventListener('click', () => {
            this.hideStatsModal();
        });
        
        this.statsModal.addEventListener('click', (e) => {
            if (e.target === this.statsModal) {
                this.hideStatsModal();
            }
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.statsModal.style.display !== 'none') {
                this.hideStatsModal();
            }
            if (e.key === '/' && e.target !== this.searchInput) {
                e.preventDefault();
                this.searchInput.focus();
            }
        });
    }
    
    async loadLibrary() {
        this.showLoading(true);
        
        try {
            // BookDataManagerの読み込み完了を待つ
            await this.waitForBookData();
            
            const books = window.bookDataManager.getAllBooks();
            this.filteredBooks = [...books];
            
            this.updateHeaderStats();
            this.createCategoryFilters();
            this.displayBooks();
            this.displayRecentBooks();
            
        } catch (error) {
            console.error('本棚の読み込みエラー:', error);
            this.showError('本棚の読み込みに失敗しました');
        } finally {
            this.showLoading(false);
        }
    }
    
    async waitForBookData() {
        return new Promise((resolve) => {
            const checkData = () => {
                if (window.bookDataManager && window.bookDataManager.books.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkData, 100);
                }
            };
            checkData();
        });
    }
    
    updateHeaderStats() {
        const stats = window.bookDataManager.getStats();
        this.totalBooksSpan.textContent = stats.totalBooks;
        
        // ヘッダーに読書率も表示
        const existingRate = this.headerStats.querySelector('.reading-rate');
        if (!existingRate && stats.completedBooks > 0) {
            const rateElement = document.createElement('span');
            rateElement.className = 'stat-item reading-rate';
            rateElement.innerHTML = `
                <span class="stat-icon">📈</span>
                <span>${stats.readingRate}%</span>
            `;
            this.headerStats.appendChild(rateElement);
        }
    }
    
    createCategoryFilters() {
        const books = window.bookDataManager.getAllBooks();
        const categories = [...new Set(books.map(book => book.category))];
        
        // 既存のフィルターをクリア（「すべて」ボタンは残す）
        const allBtn = this.categoryFilters.querySelector('[data-category="all"]');
        this.categoryFilters.innerHTML = '';
        this.categoryFilters.appendChild(allBtn);
        
        // カテゴリボタンを追加
        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.dataset.category = category;
            btn.innerHTML = `
                <span class="category-icon">📂</span>${category}
            `;
            btn.addEventListener('click', () => this.filterByCategory(category));
            this.categoryFilters.appendChild(btn);
        });
    }
    
    displayBooks() {
        this.booksGrid.innerHTML = '';
        
        if (this.filteredBooks.length === 0) {
            this.showNoResults(true);
            return;
        }
        
        this.showNoResults(false);
        
        this.filteredBooks.forEach(book => {
            const bookCard = this.createBookCard(book);
            this.booksGrid.appendChild(bookCard);
        });
        
        // タイトル更新
        this.updateSectionTitle();
    }
    
    createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.addEventListener('click', () => this.openBook(book));
        
        // 読書進捗を取得
        const progress = window.bookDataManager.getReadingProgress(book.id);
        const progressPercent = progress ? 
            Math.round((progress.currentSpread / progress.totalSpreads) * 100) : 0;
        
        card.innerHTML = `
            <div class="book-thumbnail">
                <img src="${window.bookDataManager.getThumbnailUrl(book)}" 
                     alt="${book.title}" 
                     loading="lazy">
                ${progress ? `
                    <div class="reading-progress ${progress.completed ? 'progress-complete' : ''}">
                        ${progress.completed ? '完読' : `${progressPercent}%`}
                    </div>
                ` : ''}
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <div class="book-meta">
                    <div class="book-author">👤 ${book.author}</div>
                    <div class="book-details">
                        <span class="book-pages">
                            <span>📄</span> ${book.totalPages}ページ
                        </span>
                        <span class="book-time">
                            <span>⏱️</span> ${book.readingTime || '5分'}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        // タッチフィードバック
        card.addEventListener('touchstart', () => {
            card.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('touchend', () => {
            card.style.transform = '';
        });
        
        return card;
    }
    
    displayRecentBooks() {
        const recentBooks = window.bookDataManager.getRecentlyReadBooks(5);
        
        if (recentBooks.length === 0) {
            this.recentSection.style.display = 'none';
            return;
        }
        
        this.recentSection.style.display = 'block';
        this.recentBooks.innerHTML = '';
        
        recentBooks.forEach(book => {
            const card = this.createCompactBookCard(book);
            this.recentBooks.appendChild(card);
        });
    }
    
    createCompactBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card compact';
        card.style.minWidth = '100px';
        card.style.scrollSnapAlign = 'start';
        card.addEventListener('click', () => this.openBook(book));
        
        card.innerHTML = `
            <div class="book-thumbnail">
                <img src="${window.bookDataManager.getThumbnailUrl(book)}" 
                     alt="${book.title}" 
                     loading="lazy">
            </div>
            <div class="book-info" style="padding: 10px;">
                <h3 class="book-title" style="font-size: 12px; line-height: 1.2;">
                    ${book.title}
                </h3>
            </div>
        `;
        
        return card;
    }
    
    openBook(book) {
        // 選択した本をリーダーで開く
        const readerUrl = `reader.html?book=${book.id}`;
        
        // タッチフィードバック
        this.showTouchFeedback();
        
        // 少し遅延してページ遷移（フィードバック表示のため）
        setTimeout(() => {
            window.location.href = readerUrl;
        }, 150);
    }
    
    showTouchFeedback() {
        // 簡単なフィードバック表示
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 152, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 50%;
            font-size: 24px;
            z-index: 2000;
            pointer-events: none;
        `;
        feedback.textContent = '📖';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 500);
    }
    
    filterByCategory(category) {
        this.currentCategory = category;
        
        // ボタンのアクティブ状態を更新
        this.categoryFilters.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        this.filterAndDisplayBooks();
    }
    
    filterAndDisplayBooks() {
        const allBooks = window.bookDataManager.getAllBooks();
        
        // カテゴリフィルター
        let filtered = this.currentCategory === 'all' ? 
            [...allBooks] : 
            allBooks.filter(book => book.category === this.currentCategory);
        
        // 検索フィルター
        if (this.searchQuery) {
            filtered = window.bookDataManager.searchBooks(this.searchQuery)
                .filter(book => this.currentCategory === 'all' || book.category === this.currentCategory);
        }
        
        this.filteredBooks = filtered;
        this.displayBooks();
    }
    
    updateSectionTitle() {
        let title = 'すべての本';
        
        if (this.searchQuery) {
            title = `検索結果: "${this.searchQuery}"`;
        } else if (this.currentCategory !== 'all') {
            title = this.currentCategory;
        }
        
        this.booksTitle.innerHTML = `
            <span class="section-icon">📖</span>${title}
            <span style="font-size: 16px; color: #666; font-weight: normal;">
                (${this.filteredBooks.length}冊)
            </span>
        `;
    }
    
    updateSearchUI() {
        this.clearSearchBtn.style.display = this.searchQuery ? 'flex' : 'none';
    }
    
    clearSearch() {
        this.searchQuery = '';
        this.searchInput.value = '';
        this.updateSearchUI();
        this.filterAndDisplayBooks();
        this.searchInput.focus();
    }
    
    async refreshLibrary() {
        // リフレッシュアニメーション
        this.refreshBtn.style.transform = 'rotate(360deg)';
        
        await this.loadLibrary();
        
        setTimeout(() => {
            this.refreshBtn.style.transform = '';
        }, 300);
    }
    
    showStatsModal() {
        const stats = window.bookDataManager.getStats();
        const recentBooks = window.bookDataManager.getRecentlyReadBooks();
        
        this.statsContent.innerHTML = `
            <div class="stats-grid" style="display: grid; gap: 20px;">
                <div class="stat-card" style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <div style="font-size: 32px; margin-bottom: 10px;">📚</div>
                    <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">${stats.totalBooks}</div>
                    <div style="color: #666;">総書籍数</div>
                </div>
                
                <div class="stat-card" style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <div style="font-size: 32px; margin-bottom: 10px;">✅</div>
                    <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${stats.completedBooks}</div>
                    <div style="color: #666;">読了書籍</div>
                </div>
                
                <div class="stat-card" style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <div style="font-size: 32px; margin-bottom: 10px;">📈</div>
                    <div style="font-size: 24px; font-weight: bold; color: var(--secondary-color);">${stats.readingRate}%</div>
                    <div style="color: #666;">読書完了率</div>
                </div>
                
                <div class="stat-card" style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                    <div style="font-size: 32px; margin-bottom: 10px;">📄</div>
                    <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${stats.totalPages}</div>
                    <div style="color: #666;">総ページ数</div>
                </div>
            </div>
            
            ${recentBooks.length > 0 ? `
                <div style="margin-top: 30px;">
                    <h4 style="margin: 0 0 15px; color: #333;">最近の読書活動</h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${recentBooks.map(book => `
                            <div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;" 
                                 onclick="window.location.href='reader.html?book=${book.id}'">
                                <img src="${window.bookDataManager.getThumbnailUrl(book)}" 
                                     style="width: 40px; height: 53px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #333;">${book.title}</div>
                                    <div style="font-size: 12px; color: #666;">
                                        ${new Date(book.lastRead).toLocaleDateString('ja-JP')}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        this.statsModal.style.display = 'flex';
    }
    
    hideStatsModal() {
        this.statsModal.style.display = 'none';
    }
    
    showLoading(show) {
        this.isLoading = show;
        this.loadingIndicator.style.display = show ? 'block' : 'none';
        this.booksGrid.style.display = show ? 'none' : 'grid';
    }
    
    showNoResults(show) {
        this.noResults.style.display = show ? 'block' : 'none';
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f44336;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// 本棚管理の初期化
document.addEventListener('DOMContentLoaded', () => {
    window.libraryManager = new LibraryManager();
});

// ページ表示時の処理
window.addEventListener('pageshow', (e) => {
    if (e.persisted && window.libraryManager) {
        // ブラウザバック時に最新状態を表示
        window.libraryManager.displayRecentBooks();
        window.libraryManager.updateHeaderStats();
    }
});