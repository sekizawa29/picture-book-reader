// Service Worker for Book Library PWA with Viewport Optimization
const CACHE_NAME = 'book-library-v4';
const urlsToCache = [
    './',
    './index.html',
    './reader.html',
    './manifest.json',
    './css/mobile.css',
    './css/fullscreen.css',
    './css/library.css',
    './css/viewport-optimized.css',
    './js/mobile-reader.js',
    './js/gesture.js',
    './js/pwa.js',
    './js/library.js',
    './js/book-data.js',
    './js/viewport-manager.js',
    './js/fallback-handler.js',
    './books/book1/b1.png',
    './books/book1/b2.png',
    './books/book1/b3.png',
    './books/book1/b4.png',
    './books/book1/metadata.json',
    './books/book2/b1.png',
    './books/book2/b2.png',
    './books/book2/b3.png',
    './books/book2/b4.png',
    './books/book2/metadata.json'
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