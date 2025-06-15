// タッチジェスチャー処理
class GestureHandler {
    constructor(element, callbacks) {
        this.element = element;
        this.callbacks = callbacks;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.isDragging = false;
        this.minSwipeDistance = 50; // スワイプと認識する最小距離
        this.maxSwipeTime = 300; // スワイプと認識する最大時間
        this.startTime = 0;
        
        this.init();
    }
    
    init() {
        // タッチイベント
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // マウスイベント（デスクトップでのテスト用）
        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.element.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        
        // ピンチズーム用
        this.element.addEventListener('gesturestart', this.handleGestureStart.bind(this), { passive: false });
        this.element.addEventListener('gesturechange', this.handleGestureChange.bind(this), { passive: false });
        this.element.addEventListener('gestureend', this.handleGestureEnd.bind(this), { passive: false });
    }
    
    // タッチ開始
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
            this.currentX = this.startX;
            this.currentY = this.startY;
            this.startTime = Date.now();
            this.isDragging = true;
            
            if (this.callbacks.onStart) {
                this.callbacks.onStart(e);
            }
        }
    }
    
    // タッチ移動
    handleTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;
        
        e.preventDefault();
        this.currentX = e.touches[0].clientX;
        this.currentY = e.touches[0].clientY;
        
        if (this.callbacks.onMove) {
            this.callbacks.onMove(e, {
                deltaX: this.currentX - this.startX,
                deltaY: this.currentY - this.startY
            });
        }
    }
    
    // タッチ終了
    handleTouchEnd(e) {
        if (!this.isDragging) return;
        
        const endTime = Date.now();
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = endTime - this.startTime;
        
        this.isDragging = false;
        
        // スワイプ判定
        if (distance > this.minSwipeDistance && duration < this.maxSwipeTime) {
            const direction = this.getSwipeDirection(deltaX, deltaY);
            if (this.callbacks.onSwipe) {
                this.callbacks.onSwipe(direction, { deltaX, deltaY, distance, duration });
            }
        } else if (distance < 10) {
            // タップ判定
            if (this.callbacks.onTap) {
                this.callbacks.onTap(e, { x: this.startX, y: this.startY });
            }
        }
        
        if (this.callbacks.onEnd) {
            this.callbacks.onEnd(e);
        }
    }
    
    // マウス処理（デスクトップ用）
    handleMouseDown(e) {
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentX = this.startX;
        this.currentY = this.startY;
        this.startTime = Date.now();
        this.isDragging = true;
        
        if (this.callbacks.onStart) {
            this.callbacks.onStart(e);
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        
        if (this.callbacks.onMove) {
            this.callbacks.onMove(e, {
                deltaX: this.currentX - this.startX,
                deltaY: this.currentY - this.startY
            });
        }
    }
    
    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        const endTime = Date.now();
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = endTime - this.startTime;
        
        this.isDragging = false;
        
        // スワイプ判定
        if (distance > this.minSwipeDistance && duration < this.maxSwipeTime) {
            const direction = this.getSwipeDirection(deltaX, deltaY);
            if (this.callbacks.onSwipe) {
                this.callbacks.onSwipe(direction, { deltaX, deltaY, distance, duration });
            }
        } else if (distance < 10) {
            // クリック判定
            if (this.callbacks.onTap) {
                this.callbacks.onTap(e, { x: this.startX, y: this.startY });
            }
        }
        
        if (this.callbacks.onEnd) {
            this.callbacks.onEnd(e);
        }
    }
    
    // ピンチズーム処理
    handleGestureStart(e) {
        e.preventDefault();
        if (this.callbacks.onPinchStart) {
            this.callbacks.onPinchStart(e);
        }
    }
    
    handleGestureChange(e) {
        e.preventDefault();
        if (this.callbacks.onPinchChange) {
            this.callbacks.onPinchChange(e, e.scale);
        }
    }
    
    handleGestureEnd(e) {
        e.preventDefault();
        if (this.callbacks.onPinchEnd) {
            this.callbacks.onPinchEnd(e);
        }
    }
    
    // スワイプ方向を取得
    getSwipeDirection(deltaX, deltaY) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        if (absDeltaX > absDeltaY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }
    
    // タッチフィードバック表示
    showTouchFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.className = 'touch-feedback';
        feedback.style.left = x + 'px';
        feedback.style.top = y + 'px';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 600);
    }
    
    // ジェスチャーハンドラーを破棄
    destroy() {
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
        this.element.removeEventListener('mousedown', this.handleMouseDown);
        this.element.removeEventListener('mousemove', this.handleMouseMove);
        this.element.removeEventListener('mouseup', this.handleMouseUp);
        this.element.removeEventListener('mouseleave', this.handleMouseUp);
        this.element.removeEventListener('gesturestart', this.handleGestureStart);
        this.element.removeEventListener('gesturechange', this.handleGestureChange);
        this.element.removeEventListener('gestureend', this.handleGestureEnd);
    }
}

// ハンマー.js風の軽量ジェスチャー認識
class SimpleGestures {
    static createSwipeHandler(element, onSwipe) {
        return new GestureHandler(element, {
            onSwipe: onSwipe
        });
    }
    
    static createTapHandler(element, onTap) {
        return new GestureHandler(element, {
            onTap: onTap
        });
    }
    
    static createPinchHandler(element, onPinch) {
        return new GestureHandler(element, {
            onPinchChange: onPinch
        });
    }
}