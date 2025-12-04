// Service Worker для приложения "Мой Риск"
// Версия кэша
const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `my-risk-cache-${CACHE_VERSION}`;

// Файлы для кэширования при установке
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  // Иконки (если есть)
  // './assets/favicon.ico',
  // './assets/icon-192.png',
  // './assets/icon-512.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Установка');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Кэширование файлов');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Установка завершена');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Активация');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем старые кэши
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Активация завершена');
      return self.clients.claim();
    })
  );
});

// Обработка запросов (стратегия Cache First с fallback на Network)
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к API и внешним ресурсам
  if (event.request.url.includes('api.') || 
      event.request.url.includes('google-analytics') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Если есть в кэше, возвращаем из кэша
        if (cachedResponse) {
          console.log('[Service Worker] Запрос из кэша:', event.request.url);
          return cachedResponse;
        }

        // Иначе загружаем из сети
        return fetch(event.request)
          .then((networkResponse) => {
            // Клонируем ответ для кэширования
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('[Service Worker] Добавлено в кэш:', event.request.url);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.log('[Service Worker] Ошибка загрузки:', error);
            
            // Если запрос к HTML-странице и нет в кэше, возвращаем оффлайн страницу
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            // Для других типов запросов возвращаем заглушку
            return new Response('Оффлайн режим', {
              status: 503,
              statusText: 'Нет подключения к интернету',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Фоновая синхронизация (для будущих функций)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Фоновая синхронизация:', event.tag);
});

// Пуш-уведомления (для будущих функций)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Пуш-уведомление:', event);
  
  const title = 'Мой Риск';
  const options = {
    body: 'Напоминание о проверке здоровья',
    icon: './assets/icon-192.png',
    badge: './assets/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Клик по уведомлению');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          const client = clientList[0];
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: event.notification.data
          });
        } else {
          clients.openWindow('/');
        }
      })
  );
});
