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