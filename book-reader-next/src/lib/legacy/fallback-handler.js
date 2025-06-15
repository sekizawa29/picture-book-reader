// フォールバック処理とエラーハンドリング
class FallbackHandler {
    constructor() {
        this.isViewportManagerAvailable = false;
        this.isCSSVariableSupported = false;
        this.isModernBrowser = false;
        
        this.init();
    }
    
    init() {
        this.detectFeatureSupport();
        this.setupFallbacks();
        this.handleViewportManagerFailure();
    }
    
    detectFeatureSupport() {
        // ViewportManagerの利用可否チェック
        this.isViewportManagerAvailable = !!(window.viewportManager && 
            typeof window.viewportManager.getOptimalSizes === 'function');
        
        // CSS変数サポートチェック
        this.isCSSVariableSupported = window.CSS && CSS.supports('color', 'var(--test)');
        
        // モダンブラウザチェック
        this.isModernBrowser = !!(window.fetch && window.Promise && Array.from);
        
        console.log('Feature Support:', {
            viewportManager: this.isViewportManagerAvailable,
            cssVariables: this.isCSSVariableSupported,
            modernBrowser: this.isModernBrowser
        });
    }
    
    setupFallbacks() {
        // ViewportManagerが利用できない場合のフォールバック
        if (!this.isViewportManagerAvailable) {
            this.setupBasicViewportHandling();
        }
        
        // CSS変数が利用できない場合のフォールバック
        if (!this.isCSSVariableSupported) {
            this.setupLegacyCSS();
        }
        
        // 古いブラウザ向けの処理
        if (!this.isModernBrowser) {
            this.setupLegacyBrowserSupport();
        }
    }
    
    setupBasicViewportHandling() {
        console.log('Setting up basic viewport handling (fallback)');
        
        // 基本的なビューポート調整
        const adjustBasicViewport = () => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const isLandscape = windowWidth > windowHeight;
            
            // 基本的なページサイズ計算
            let maxWidth, maxHeight;
            
            if (isLandscape) {
                maxWidth = Math.floor((windowWidth - 40) / 2);
                maxHeight = windowHeight - 100;
            } else {
                maxWidth = Math.floor((windowWidth - 20) / 2);
                maxHeight = windowHeight - 180;
            }
            
            // 最小サイズの保証
            maxWidth = Math.max(maxWidth, 120);
            maxHeight = Math.max(maxHeight, 160);
            
            // CSSで直接設定
            this.applyFallbackStyles(maxWidth, maxHeight);
        };
        
        // 初回実行
        adjustBasicViewport();
        
        // リサイズ・回転時の調整
        window.addEventListener('resize', adjustBasicViewport);
        window.addEventListener('orientationchange', () => {
            setTimeout(adjustBasicViewport, 500);
        });
    }
    
    applyFallbackStyles(maxWidth, maxHeight) {
        const styleId = 'fallback-viewport-styles';
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            .page-image {
                max-width: ${maxWidth}px !important;
                max-height: ${maxHeight}px !important;
            }
            
            .page-spread {
                max-width: ${maxWidth * 2 + 20}px !important;
                max-height: ${maxHeight}px !important;
            }
            
            .spread-container {
                width: 100vw !important;
                height: 100vh !important;
                padding: 10px !important;
            }
        `;
    }
    
    setupLegacyCSS() {
        console.log('Setting up legacy CSS support');
        
        // CSS変数を使わない固定スタイル
        const legacyStyleId = 'legacy-css-fallback';
        let styleElement = document.getElementById(legacyStyleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = legacyStyleId;
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            .spread-container {
                width: 100% !important;
                height: 100% !important;
                min-height: 400px !important;
                max-height: 100vh !important;
            }
            
            .page-image {
                max-width: 48vw !important;
                max-height: 80vh !important;
            }
            
            @media (orientation: landscape) {
                .page-image {
                    max-width: 47vw !important;
                    max-height: 90vh !important;
                }
            }
            
            @media (max-width: 480px) {
                .page-image {
                    max-width: 46vw !important;
                    max-height: 75vh !important;
                }
            }
        `;
    }
    
    setupLegacyBrowserSupport() {
        console.log('Setting up legacy browser support');
        
        // 古いブラウザ向けのPolyfill
        if (!window.CustomEvent) {
            this.polyfillCustomEvent();
        }
        
        if (!Array.from) {
            this.polyfillArrayFrom();
        }
        
        // 古いブラウザでのタッチ操作改善
        this.improveLegacyTouch();
    }
    
    polyfillCustomEvent() {
        function CustomEvent(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            const evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
    }
    
    polyfillArrayFrom() {
        Array.from = Array.from || function(arrayLike) {
            return Array.prototype.slice.call(arrayLike);
        };
    }
    
    improveLegacyTouch() {
        // 古いブラウザでのタッチ操作改善
        const touchAreas = document.querySelectorAll('.touch-area');
        
        Array.from(touchAreas).forEach(area => {
            // 古いブラウザ向けのクリックイベント
            area.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // タッチフィードバック
                this.style.backgroundColor = 'rgba(0,0,0,0.1)';
                setTimeout(() => {
                    this.style.backgroundColor = '';
                }, 150);
            });
        });
    }
    
    handleViewportManagerFailure() {
        // ViewportManagerの初期化失敗を監視
        setTimeout(() => {
            if (!window.viewportManager || !window.viewportManager.isInitialized) {
                console.warn('ViewportManager failed to initialize, using fallback');
                this.setupBasicViewportHandling();
                
                // エラー通知（デバッグ用）
                if (window.bookReader && typeof window.bookReader.showError === 'function') {
                    window.bookReader.showError('高度な表示最適化が利用できません（基本モードで動作）');
                }
            }
        }, 2000);
    }
    
    // 画像読み込み失敗時のフォールバック
    setupImageFallback() {
        const images = document.querySelectorAll('.page-image');
        
        Array.from(images).forEach(img => {
            img.addEventListener('error', () => {
                console.warn('Image failed to load:', img.src);
                
                // 代替画像または placeholder の表示
                img.style.backgroundColor = '#f0f0f0';
                img.style.border = '2px dashed #ccc';
                img.alt = '画像を読み込めませんでした';
            });
        });
    }
    
    // ネットワーク接続状況の監視
    setupNetworkFallback() {
        if ('serviceWorker' in navigator) {
            // オフライン時の処理
            window.addEventListener('offline', () => {
                this.showNetworkStatus('オフラインモードです', 'warning');
            });
            
            window.addEventListener('online', () => {
                this.showNetworkStatus('オンラインに復帰しました', 'success');
            });
        }
    }
    
    showNetworkStatus(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            font-size: 14px;
            background: ${type === 'warning' ? '#ff9800' : '#4CAF50'};
        `;
        statusDiv.textContent = message;
        
        document.body.appendChild(statusDiv);
        
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 3000);
    }
    
    // 緊急時の最小限表示モード
    enableEmergencyMode() {
        console.warn('Enabling emergency display mode');
        
        const emergencyStyleId = 'emergency-mode-styles';
        let styleElement = document.getElementById(emergencyStyleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = emergencyStyleId;
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            .page-image {
                max-width: 45vw !important;
                max-height: 70vh !important;
                width: auto !important;
                height: auto !important;
            }
            
            .page-spread {
                flex-direction: row !important;
                gap: 5px !important;
            }
            
            .spread-container {
                padding: 5px !important;
            }
            
            @media (max-width: 400px) {
                .page-image {
                    max-width: 44vw !important;
                    max-height: 65vh !important;
                }
            }
        `;
    }
}

// フォールバックハンドラーの初期化
document.addEventListener('DOMContentLoaded', () => {
    window.fallbackHandler = new FallbackHandler();
    
    // 画像フォールバックの設定
    window.addEventListener('load', () => {
        if (window.fallbackHandler) {
            window.fallbackHandler.setupImageFallback();
            window.fallbackHandler.setupNetworkFallback();
        }
    });
});

// 緊急モード用のグローバル関数
window.enableEmergencyDisplayMode = () => {
    if (window.fallbackHandler) {
        window.fallbackHandler.enableEmergencyMode();
    }
};