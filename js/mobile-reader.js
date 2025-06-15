// モバイル絵本リーダー メイン機能
class MobileBookReader {
    constructor() {
        this.currentSpread = 1; // 見開きの番号 (1=ページ1-2, 2=ページ3-4)
        this.totalPages = 4;
        this.totalSpreads = 2; // 見開きの総数
        this.pages = [
            'images/b1.png',
            'images/b2.png', 
            'images/b3.png',
            'images/b4.png'
        ];
        
        this.isFullscreen = false;
        this.autoHideTimer = null;
        this.preloadedImages = new Map();
        this.currentScale = 1;
        this.minScale = 1;
        this.maxScale = 3;
        
        this.init();
    }
    
    init() {
        this.initElements();
        this.initEventListeners();
        this.initGestures();
        this.preloadImages();
        this.updatePageInfo();
        this.showHelp();
        
        // 初期化後に自動フルスクリーン（ユーザー操作後に実行される必要がある）
        this.requestFullscreenOnFirstInteraction();
    }
    
    initElements() {
        this.app = document.getElementById('app');
        this.bookContainer = document.getElementById('bookContainer');
        this.bookReader = document.getElementById('bookReader');
        this.spreadContainer = document.getElementById('spreadContainer');
        this.pageSpread = document.querySelector('.page-spread');
        this.leftPageImg = document.getElementById('leftPage');
        this.rightPageImg = document.getElementById('rightPage');
        this.pageInfo = document.getElementById('pageInfo');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.controls = document.getElementById('controls');
        this.helpOverlay = document.getElementById('helpOverlay');
        this.hideHelpBtn = document.getElementById('hideHelp');
        this.prevArea = document.getElementById('prevArea');
        this.nextArea = document.getElementById('nextArea');
    }
    
    initEventListeners() {
        // ナビゲーションボタン
        this.prevBtn.addEventListener('click', () => this.prevPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // タッチエリア
        this.prevArea.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevPage();
            this.showTouchFeedback(e);
        });
        
        this.nextArea.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextPage();
            this.showTouchFeedback(e);
        });
        
        // ヘルプ
        this.hideHelpBtn.addEventListener('click', () => this.hideHelp());
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // フルスクリーン状態変更
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());
        
        // 画像読み込み完了
        this.leftPageImg.addEventListener('load', () => this.handleImageLoad());
        this.leftPageImg.addEventListener('error', () => this.handleImageError());
        this.rightPageImg.addEventListener('load', () => this.handleImageLoad());
        this.rightPageImg.addEventListener('error', () => this.handleImageError());
        
        // 自動非表示用
        this.bookContainer.addEventListener('mousemove', () => this.resetAutoHide());
        this.bookContainer.addEventListener('touchstart', () => this.resetAutoHide());
    }
    
    initGestures() {
        // スワイプジェスチャー
        this.gestureHandler = new GestureHandler(this.bookReader, {
            onSwipe: (direction, data) => this.handleSwipe(direction, data),
            onTap: (e, data) => this.handleTap(e, data),
            onPinchChange: (e, scale) => this.handlePinch(e, scale),
            onPinchEnd: () => this.handlePinchEnd()
        });
    }
    
    // 見開きページ操作
    nextPage() {
        if (this.currentSpread < this.totalSpreads) {
            this.currentSpread++;
            this.updateSpread('next');
        }
    }
    
    prevPage() {
        if (this.currentSpread > 1) {
            this.currentSpread--;
            this.updateSpread('prev');
        }
    }
    
    goToSpread(spreadNumber) {
        if (spreadNumber >= 1 && spreadNumber <= this.totalSpreads) {
            this.currentSpread = spreadNumber;
            this.updateSpread();
        }
    }
    
    updateSpread(direction = null) {
        const leftPageIndex = (this.currentSpread - 1) * 2;
        const rightPageIndex = leftPageIndex + 1;
        
        // 左ページ
        if (leftPageIndex < this.totalPages) {
            this.leftPageImg.src = this.pages[leftPageIndex];
            this.leftPageImg.alt = `ページ ${leftPageIndex + 1}`;
        }
        
        // 右ページ
        if (rightPageIndex < this.totalPages) {
            this.rightPageImg.src = this.pages[rightPageIndex];
            this.rightPageImg.alt = `ページ ${rightPageIndex + 1}`;
        }
        
        this.updatePageInfo();
        this.resetScale();
        
        // ページめくりアニメーション
        if (direction) {
            this.playPageTurnAnimation(direction);
        }
    }
    
    playPageTurnAnimation(direction) {
        // アニメーションクラスをリセット
        this.pageSpread.classList.remove('slide-in-left', 'slide-in-right');
        
        // フェードアウト
        this.pageSpread.style.opacity = '0';
        
        setTimeout(() => {
            // アニメーション方向を設定
            if (direction === 'next') {
                this.pageSpread.classList.add('slide-in-right');
            } else {
                this.pageSpread.classList.add('slide-in-left');
            }
            
            this.pageSpread.style.opacity = '1';
            
            // アニメーション完了後にクラスを削除
            setTimeout(() => {
                this.pageSpread.classList.remove('slide-in-left', 'slide-in-right');
            }, 400);
        }, 150);
    }
    
    updatePageInfo() {
        const leftPageNum = (this.currentSpread - 1) * 2 + 1;
        const rightPageNum = leftPageNum + 1;
        
        if (rightPageNum <= this.totalPages) {
            this.pageInfo.textContent = `${leftPageNum}-${rightPageNum} / ${this.totalPages}`;
        } else {
            this.pageInfo.textContent = `${leftPageNum} / ${this.totalPages}`;
        }
        
        // ボタンの有効/無効状態
        this.prevBtn.disabled = this.currentSpread === 1;
        this.nextBtn.disabled = this.currentSpread === this.totalSpreads;
    }
    
    // フルスクリーン処理
    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    enterFullscreen() {
        const element = this.bookContainer;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
        
        // iOS Safari用
        if ('standalone' in window.navigator && !window.navigator.standalone) {
            this.showIOSFullscreenMessage();
        }
    }
    
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    
    handleFullscreenChange() {
        this.isFullscreen = !!(document.fullscreenElement || 
                              document.webkitFullscreenElement || 
                              document.mozFullScreenElement || 
                              document.msFullscreenElement);
        
        if (this.isFullscreen) {
            this.fullscreenBtn.textContent = '🔍';
            this.fullscreenBtn.title = 'フルスクリーン終了';
            this.app.classList.add('immersive-mode');
            this.startAutoHide();
        } else {
            this.fullscreenBtn.textContent = '📖';
            this.fullscreenBtn.title = '全画面表示';
            this.app.classList.remove('immersive-mode');
            this.stopAutoHide();
        }
    }
    
    // ジェスチャー処理
    handleSwipe(direction, data) {
        switch (direction) {
            case 'left':
                this.nextPage();
                break;
            case 'right':
                this.prevPage();
                break;
            case 'up':
                if (!this.isFullscreen) {
                    this.enterFullscreen();
                }
                break;
            case 'down':
                if (this.isFullscreen) {
                    this.exitFullscreen();
                }
                break;
        }
    }
    
    handleTap(e, data) {
        const rect = this.bookReader.getBoundingClientRect();
        const x = data.x - rect.left;
        const centerX = rect.width / 2;
        
        if (x < centerX) {
            this.prevPage();
        } else {
            this.nextPage();
        }
        
        this.showTouchFeedback(e);
        this.resetAutoHide();
    }
    
    handlePinch(e, scale) {
        this.currentScale = Math.max(this.minScale, Math.min(this.maxScale, scale));
        this.pageSpread.style.transform = `scale(${this.currentScale})`;
    }
    
    handlePinchEnd() {
        if (this.currentScale < 1.1) {
            this.resetScale();
        }
    }
    
    resetScale() {
        this.currentScale = 1;
        this.pageSpread.style.transform = 'scale(1)';
    }
    
    // キーボード処理
    handleKeydown(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.prevPage();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
                e.preventDefault();
                this.nextPage();
                break;
            case 'f':
            case 'F11':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'Escape':
                if (this.isFullscreen) {
                    this.exitFullscreen();
                }
                break;
            case 'Home':
                e.preventDefault();
                this.goToSpread(1);
                break;
            case 'End':
                e.preventDefault();
                this.goToSpread(this.totalSpreads);
                break;
        }
    }
    
    // 画像処理
    preloadImages() {
        this.pages.forEach((imagePath, index) => {
            const img = new Image();
            img.onload = () => {
                this.preloadedImages.set(index, img);
            };
            img.src = imagePath;
        });
    }
    
    handleImageLoad() {
        // 画像読み込み完了時の処理
        this.pageSpread.style.opacity = '1';
    }
    
    handleImageError() {
        console.error('画像の読み込みに失敗しました');
    }
    
    // UI制御
    showTouchFeedback(e) {
        const rect = this.bookReader.getBoundingClientRect();
        let x, y;
        
        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        } else {
            x = e.clientX || rect.left + rect.width / 2;
            y = e.clientY || rect.top + rect.height / 2;
        }
        
        if (this.gestureHandler) {
            this.gestureHandler.showTouchFeedback(x, y);
        }
    }
    
    startAutoHide() {
        this.stopAutoHide();
        this.autoHideTimer = setTimeout(() => {
            this.app.classList.add('auto-hide-controls');
        }, 3000);
    }
    
    stopAutoHide() {
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
        this.app.classList.remove('auto-hide-controls');
    }
    
    resetAutoHide() {
        this.app.classList.remove('auto-hide-controls');
        if (this.isFullscreen) {
            this.startAutoHide();
        }
    }
    
    showHelp() {
        this.helpOverlay.classList.remove('hidden');
    }
    
    hideHelp() {
        this.helpOverlay.classList.add('hidden');
        // ヘルプを閉じた後、フルスクリーンを試行
        setTimeout(() => {
            this.enterFullscreen();
        }, 500);
    }
    
    showIOSFullscreenMessage() {
        // iOS Safari用のフルスクリーン案内
        const message = document.createElement('div');
        message.className = 'ios-fullscreen-message';
        message.innerHTML = `
            <div class="message-content">
                <p>📱 フルスクリーン表示するには</p>
                <p>共有ボタン → ホーム画面に追加</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        message.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 3000; color: white; text-align: center;
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 5000);
    }
    
    requestFullscreenOnFirstInteraction() {
        const handler = () => {
            // 最初のユーザー操作時にフルスクリーンを試行
            document.removeEventListener('touchstart', handler);
            document.removeEventListener('click', handler);
            
            // ヘルプが表示されていない場合のみフルスクリーン実行
            if (this.helpOverlay.classList.contains('hidden')) {
                setTimeout(() => {
                    this.enterFullscreen();
                }, 100);
            }
        };
        
        document.addEventListener('touchstart', handler, { once: true });
        document.addEventListener('click', handler, { once: true });
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.bookReader = new MobileBookReader();
});

// ページ読み込み完了後の追加初期化
window.addEventListener('load', () => {
    // サービスワーカー登録（PWA）
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
});