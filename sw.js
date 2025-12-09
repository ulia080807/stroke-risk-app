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
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  
  // Дополнительные ресурсы для оффлайн-режима (опционально)
  './offline.html', // Если создадите отдельную страницу для оффлайн-режима
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
      .catch((error) => {
        console.error('[Service Worker] Ошибка при кэшировании:', error);
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
  const requestUrl = new URL(event.request.url);
  
  // Пропускаем запросы к API и внешним ресурсам (кроме font-awesome)
  if (requestUrl.href.includes('api.') || 
      requestUrl.href.includes('google-analytics') ||
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
            // Проверяем, является ли ответ валидным
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Клонируем ответ для кэширования
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('[Service Worker] Добавлено в кэш:', event.request.url);
              })
              .catch((error) => {
                console.error('[Service Worker] Ошибка при кэшировании ответа:', error);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.log('[Service Worker] Ошибка загрузки:', error);
            
            // Если запрос к HTML-странице и нет в кэше, возвращаем оффлайн страницу
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            // Для изображений показываем заглушку или ничего не показываем
            if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
              // Для иконок возвращаем дефолтную иконку
              if (event.request.url.includes('icon-')) {
                return caches.match('./icon-192.png');
              }
              // Для других изображений можно вернуть заглушку или пустой ответ
              return new Response('', {
                status: 404,
                statusText: 'Изображение не найдено'
              });
            }
            
            // Для других типов запросов возвращаем заглушку
            return new Response('Оффлайн режим', {
              status: 503,
              statusText: 'Нет подключения к интернету',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8'
              })
            });
          });
      })
  );
});

// Фоновая синхронизация (для будущих функций)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Фоновая синхронизация:', event.tag);
  
  // Пример обработки синхронизации
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Реализация фоновой синхронизации
  console.log('[Service Worker] Синхронизация данных...');
}

// Пуш-уведомления (для будущих функций)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Пуш-уведомление:', event);
  
  let data = {
    title: 'Мой Риск',
    body: 'Напоминание о проверке здоровья',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'health-reminder'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('Ошибка парсинга данных уведомления:', e);
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть'
      },
      {
        action: 'close',
        title: 'Закрыть'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Клик по уведомлению:', event.notification.tag);
  
  // Закрываем уведомление
  event.notification.close();
  
  // Обработка действий в уведомлении
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Ищем уже открытую вкладку с нашим приложением
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const currentUrl = new URL(urlToOpen, self.location.origin);
        
        if (clientUrl.origin === currentUrl.origin && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: event.notification.data
          });
          return;
        }
      }
      
      // Если не нашли открытую вкладку, открываем новую
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Обработка закрытия уведомлений
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Уведомление закрыто:', event.notification.tag);
});

// Фоновая периодическая синхронизация (если поддерживается)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  // Обновление контента в фоне
  console.log('[Service Worker] Фоновое обновление контента...');
}
