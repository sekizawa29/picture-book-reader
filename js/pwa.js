// PWA機能とサービスワーカー管理
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.init();
    }
    
    init() {
        this.checkInstallStatus();
        this.setupInstallPrompt();
        this.registerServiceWorker();
    }
    
    // インストール状態をチェック
    checkInstallStatus() {
        // PWAとしてインストール済みかチェック
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            this.isInstalled = true;
            document.body.classList.add('pwa-installed');
        }
    }
    
    // インストールプロンプトの設定
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // デフォルトのインストールプロンプトを防ぐ
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        // インストール完了後
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            document.body.classList.add('pwa-installed');
            this.hideInstallButton();
            this.showInstallSuccessMessage();
        });
    }
    
    // サービスワーカー登録
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered successfully:', registration);
                
                // アップデート確認
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateMessage();
                            }
                        });
                    }
                });
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
    
    // インストールボタンを表示
    showInstallButton() {
        if (this.isInstalled) return;
        
        const installBtn = document.createElement('button');
        installBtn.id = 'install-btn';
        installBtn.className = 'install-btn';
        installBtn.innerHTML = '📱 アプリとして追加';
        installBtn.title = 'ホーム画面に追加してアプリとして使用';
        
        installBtn.addEventListener('click', () => this.promptInstall());
        
        document.body.appendChild(installBtn);
        
        // スタイル追加
        if (!document.getElementById('pwa-styles')) {
            const style = document.createElement('style');
            style.id = 'pwa-styles';
            style.textContent = `
                .install-btn {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 1001;
                    background: #4CAF50;
                    border: none;
                    border-radius: 25px;
                    padding: 10px 16px;
                    font-size: 14px;
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                }
                .install-btn:hover {
                    background: #45a049;
                    transform: scale(1.05);
                }
                .install-btn:active {
                    transform: scale(0.95);
                }
                @media (max-width: 480px) {
                    .install-btn {
                        top: 70px;
                        right: 15px;
                        font-size: 12px;
                        padding: 8px 12px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // インストールボタンを非表示
    hideInstallButton() {
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            installBtn.remove();
        }
    }
    
    // インストールプロンプト表示
    async promptInstall() {
        if (!this.deferredPrompt) return;
        
        // インストールプロンプトを表示
        this.deferredPrompt.prompt();
        
        // ユーザーの選択を待つ
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        this.deferredPrompt = null;
        this.hideInstallButton();
    }
    
    // インストール成功メッセージ
    showInstallSuccessMessage() {
        const message = this.createMessage('🎉 アプリがホーム画面に追加されました！', '#4CAF50');
        this.showMessage(message, 3000);
    }
    
    // アップデートメッセージ
    showUpdateMessage() {
        const message = this.createMessage('🔄 新しいバージョンが利用可能です', '#2196F3', () => {
            window.location.reload();
        });
        this.showMessage(message, 5000);
    }
    
    // メッセージ作成
    createMessage(text, color, action = null) {
        const message = document.createElement('div');
        message.className = 'pwa-message';
        message.innerHTML = `
            <div class="message-content">
                <span>${text}</span>
                ${action ? '<button class="message-action">更新</button>' : ''}
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${color};
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 2000;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-size: 14px;
            max-width: 90vw;
            text-align: center;
        `;
        
        if (action) {
            const actionBtn = message.querySelector('.message-action');
            actionBtn.style.cssText = `
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 15px;
                padding: 4px 12px;
                margin-left: 10px;
                color: white;
                cursor: pointer;
            `;
            actionBtn.addEventListener('click', action);
        }
        
        return message;
    }
    
    // メッセージ表示
    showMessage(message, duration) {
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, duration);
    }
    
    // オフライン状態の管理
    setupOfflineHandling() {
        window.addEventListener('online', () => {
            const message = this.createMessage('🌐 オンラインに復帰しました', '#4CAF50');
            this.showMessage(message, 2000);
        });
        
        window.addEventListener('offline', () => {
            const message = this.createMessage('📱 オフラインモードで動作中', '#FF9800');
            this.showMessage(message, 3000);
        });
    }
    
    // PWA統計情報
    trackPWAUsage() {
        // PWAとして起動されたかどうかを記録
        if (this.isInstalled) {
            localStorage.setItem('pwa-launch-count', 
                (parseInt(localStorage.getItem('pwa-launch-count') || '0') + 1).toString()
            );
        }
    }
}

// サービスワーカーファイルの内容を生成
function generateServiceWorker() {
    const swContent = `
// Service Worker for Book Reader PWA
const CACHE_NAME = 'book-reader-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './css/mobile.css',
    './css/fullscreen.css',
    './js/mobile-reader.js',
    './js/gesture.js',
    './js/pwa.js',
    './images/b1.png',
    './images/b2.png',
    './images/b3.png',
    './images/b4.png'
];

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

// リクエスト時の処理
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュから見つかった場合はそれを返す
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
`;
    return swContent;
}

// PWAマネージャー初期化
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
    window.pwaManager.setupOfflineHandling();
    window.pwaManager.trackPWAUsage();
});