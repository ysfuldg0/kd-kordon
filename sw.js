const CACHE_NAME = 'kd-kordon-pro-v31-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // Sadece GET isteklerini ele al.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Firebase ve Google servislerini cache'leme.
  // Veritabanı verileri her zaman canlı Firebase'den alınmalı.
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseapp.com')
  ) {
    return;
  }

  // Sadece kendi sitemizin dosyalarını cache'le.
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(networkResponse => {

            if (!networkResponse || !networkResponse.ok) {
              return networkResponse;
            }

            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
              });

            return networkResponse;
          })
          .catch(() => {
            return caches.match('./index.html');
          });

      })
  );
});
