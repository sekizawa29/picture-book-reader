// 動的ビューポート管理
class ViewportManager {
    constructor() {
        this.isInitialized = false;
        this.debugMode = false;
        this.currentOrientation = null;
        this.safeAreaSupport = this.checkSafeAreaSupport();
        
        this.init();
    }
    
    init() {
        this.createCSSVariables();
        this.setupEventListeners();
        this.updateViewportVariables();
        this.detectDevice();
        this.isInitialized = true;
        
        console.log('ViewportManager initialized');
    }
    
    createCSSVariables() {
        const root = document.documentElement;
        
        // 初期値設定
        root.style.setProperty('--vh-full', '100vh');
        root.style.setProperty('--vh-safe', '100vh');
        root.style.setProperty('--vw-safe', '100vw');
        root.style.setProperty('--safe-top', '0px');
        root.style.setProperty('--safe-bottom', '0px');
        root.style.setProperty('--safe-left', '0px');
        root.style.setProperty('--safe-right', '0px');
        root.style.setProperty('--viewport-scale', '1');
        root.style.setProperty('--page-max-height', '100vh');
        root.style.setProperty('--page-max-width', '49vw');
    }
    
    setupEventListeners() {
        // 画面サイズ変更
        window.addEventListener('resize', () => {
            this.updateViewportVariables();
        });
        
        // 向き変更
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateViewportVariables();
            }, 500); // iOS対応の遅延
        });
        
        // ページ表示時
        window.addEventListener('pageshow', () => {
            this.updateViewportVariables();
        });
        
        // フルスクリーン変更
        document.addEventListener('fullscreenchange', () => {
            this.updateViewportVariables();
        });
        
        document.addEventListener('webkitfullscreenchange', () => {
            this.updateViewportVariables();
        });
    }
    
    updateViewportVariables() {
        const root = document.documentElement;
        
        // 実際の表示可能領域を計算
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const screenHeight = screen.height;
        const screenWidth = screen.width;
        
        // 100vhの実際の値を計算（ブラウザUIを除外）
        const actualVh = windowHeight * 0.01;
        root.style.setProperty('--vh-actual', `${actualVh}px`);
        
        // フルスクリーン判定
        const isFullscreen = this.isInFullscreen();
        
        // セーフエリアを考慮した高さ
        let safeHeight = windowHeight;
        let safeWidth = windowWidth;
        
        if (this.safeAreaSupport) {
            // セーフエリア取得
            const safeTop = this.getSafeAreaInset('top');
            const safeBottom = this.getSafeAreaInset('bottom');
            const safeLeft = this.getSafeAreaInset('left');
            const safeRight = this.getSafeAreaInset('right');
            
            safeHeight = windowHeight - safeTop - safeBottom;
            safeWidth = windowWidth - safeLeft - safeRight;
            
            root.style.setProperty('--safe-top', `${safeTop}px`);
            root.style.setProperty('--safe-bottom', `${safeBottom}px`);
            root.style.setProperty('--safe-left', `${safeLeft}px`);
            root.style.setProperty('--safe-right', `${safeRight}px`);
        }
        
        // デバイス別調整
        const deviceAdjustment = this.getDeviceAdjustment();
        const adjustedHeight = Math.floor(safeHeight * deviceAdjustment.heightRatio);
        const adjustedWidth = Math.floor(safeWidth * deviceAdjustment.widthRatio);
        
        // 見開き表示用の最適サイズ計算
        const spreadOptimization = this.calculateSpreadOptimization(adjustedWidth, adjustedHeight);
        
        // CSS変数を更新
        root.style.setProperty('--vh-safe', `${adjustedHeight}px`);
        root.style.setProperty('--vw-safe', `${adjustedWidth}px`);
        root.style.setProperty('--page-max-height', `${spreadOptimization.maxHeight}px`);
        root.style.setProperty('--page-max-width', `${spreadOptimization.maxWidth}px`);
        root.style.setProperty('--viewport-scale', spreadOptimization.scale);
        
        // 向きの検出と記録
        this.currentOrientation = windowWidth > windowHeight ? 'landscape' : 'portrait';
        
        if (this.debugMode) {
            this.showDebugInfo({
                windowHeight,
                windowWidth,
                safeHeight,
                safeWidth,
                adjustedHeight,
                adjustedWidth,
                spreadOptimization,
                isFullscreen,
                orientation: this.currentOrientation
            });
        }
        
        // カスタムイベントを発火
        window.dispatchEvent(new CustomEvent('viewportUpdated', {
            detail: {
                safeHeight: adjustedHeight,
                safeWidth: adjustedWidth,
                orientation: this.currentOrientation,
                spreadOptimization
            }
        }));
    }
    
    calculateSpreadOptimization(width, height) {
        const isLandscape = width > height;
        
        // 見開き用の基本計算
        let maxWidth, maxHeight, scale;
        
        if (isLandscape) {
            // 横向き：画面幅を最大活用
            maxWidth = Math.floor((width - 20) / 2); // 10pxマージン × 2
            maxHeight = height - 100; // コントロール分を引く
            scale = 1;
        } else {
            // 縦向き：高さを重視
            const availableHeight = height - 160; // ヘッダー・コントロール分
            const availableWidth = Math.floor((width - 20) / 2);
            
            // アスペクト比を考慮（一般的な絵本は3:4比率）
            const idealRatio = 3 / 4;
            const maxHeightByWidth = availableWidth / idealRatio;
            
            if (maxHeightByWidth <= availableHeight) {
                maxHeight = Math.floor(maxHeightByWidth);
                maxWidth = availableWidth;
            } else {
                maxHeight = availableHeight;
                maxWidth = Math.floor(availableHeight * idealRatio);
            }
            
            scale = Math.min(availableWidth / 150, availableHeight / 200); // 基準サイズとの比率
        }
        
        return {
            maxWidth: Math.max(maxWidth, 100), // 最小サイズ保証
            maxHeight: Math.max(maxHeight, 133), // 最小サイズ保証（3:4比率）
            scale: Math.max(scale, 0.5) // 最小スケール保証
        };
    }
    
    getDeviceAdjustment() {
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        
        // デバイス別の表示調整
        if (isIOS) {
            if (this.isInFullscreen()) {
                return { heightRatio: 1.0, widthRatio: 1.0 };
            } else {
                // Safari UIを考慮
                return { heightRatio: 0.92, widthRatio: 0.98 };
            }
        } else if (isAndroid) {
            if (this.isInFullscreen()) {
                return { heightRatio: 1.0, widthRatio: 1.0 };
            } else {
                // Android Chrome UIを考慮
                return { heightRatio: 0.94, widthRatio: 0.98 };
            }
        } else {
            // デスクトップ・その他
            return { heightRatio: 0.95, widthRatio: 0.98 };
        }
    }
    
    detectDevice() {
        const userAgent = navigator.userAgent;
        const deviceInfo = {
            isIOS: /iPad|iPhone|iPod/.test(userAgent),
            isAndroid: /Android/.test(userAgent),
            isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
            isChrome: /Chrome/.test(userAgent),
            isMobile: /Mobi|Android/i.test(userAgent),
            pixelRatio: window.devicePixelRatio || 1
        };
        
        // デバイス情報をグローバル変数として保存
        window.deviceInfo = deviceInfo;
        
        console.log('Device detected:', deviceInfo);
        return deviceInfo;
    }
    
    checkSafeAreaSupport() {
        const testElement = document.createElement('div');
        testElement.style.paddingTop = 'env(safe-area-inset-top)';
        document.body.appendChild(testElement);
        
        const computed = window.getComputedStyle(testElement);
        const hasSupport = computed.paddingTop !== '0px' && computed.paddingTop !== '';
        
        document.body.removeChild(testElement);
        return hasSupport;
    }
    
    getSafeAreaInset(side) {
        if (!this.safeAreaSupport) return 0;
        
        const testElement = document.createElement('div');
        testElement.style.position = 'fixed';
        testElement.style[`padding-${side}`] = `env(safe-area-inset-${side})`;
        document.body.appendChild(testElement);
        
        const computed = window.getComputedStyle(testElement);
        const value = computed[`padding${side.charAt(0).toUpperCase() + side.slice(1)}`];
        const pixels = parseFloat(value) || 0;
        
        document.body.removeChild(testElement);
        return pixels;
    }
    
    isInFullscreen() {
        return !!(document.fullscreenElement || 
                 document.webkitFullscreenElement || 
                 document.mozFullScreenElement || 
                 document.msFullscreenElement);
    }
    
    enableDebugMode() {
        this.debugMode = true;
        this.updateViewportVariables();
    }
    
    disableDebugMode() {
        this.debugMode = false;
        const debugInfo = document.getElementById('viewport-debug');
        if (debugInfo) debugInfo.remove();
    }
    
    showDebugInfo(data) {
        let debugDiv = document.getElementById('viewport-debug');
        if (!debugDiv) {
            debugDiv = document.createElement('div');
            debugDiv.id = 'viewport-debug';
            debugDiv.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
                font-family: monospace;
                z-index: 9999;
                max-width: 300px;
                line-height: 1.4;
            `;
            document.body.appendChild(debugDiv);
        }
        
        debugDiv.innerHTML = `
            <strong>Viewport Debug Info</strong><br>
            Window: ${data.windowWidth} × ${data.windowHeight}<br>
            Safe: ${data.safeWidth} × ${data.safeHeight}<br>
            Adjusted: ${data.adjustedWidth} × ${data.adjustedHeight}<br>
            Page Max: ${data.spreadOptimization.maxWidth} × ${data.spreadOptimization.maxHeight}<br>
            Scale: ${data.spreadOptimization.scale}<br>
            Orientation: ${data.orientation}<br>
            Fullscreen: ${data.isFullscreen}<br>
            Safe Area: ${this.safeAreaSupport ? 'Yes' : 'No'}
        `;
    }
    
    // 外部から呼び出し可能なメソッド
    getOptimalSizes() {
        const root = document.documentElement;
        return {
            maxHeight: root.style.getPropertyValue('--page-max-height'),
            maxWidth: root.style.getPropertyValue('--page-max-width'),
            safeHeight: root.style.getPropertyValue('--vh-safe'),
            safeWidth: root.style.getPropertyValue('--vw-safe'),
            scale: root.style.getPropertyValue('--viewport-scale')
        };
    }
    
    forceUpdate() {
        this.updateViewportVariables();
    }
}

// グローバルインスタンス
window.viewportManager = new ViewportManager();

// デバッグ用のグローバル関数
window.toggleViewportDebug = () => {
    if (window.viewportManager.debugMode) {
        window.viewportManager.disableDebugMode();
    } else {
        window.viewportManager.enableDebugMode();
    }
};