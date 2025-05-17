// Nostr Buzz Service Worker

const CACHE_NAME = 'nostr-buzz-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/maskable-icon-192x192.png',
  '/maskable-icon-512x512.png'
];

// Assets that should be cached but aren't essential
const CACHE_ASSETS = [
  '/assets/index-*.js',
  '/assets/index-*.css',
  '/shortcuts/wallet.png',
  '/shortcuts/scan.png'
];

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching App Shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        // Cache additional assets but don't block installation if they fail
        return caches.open(CACHE_NAME + '-assets')
          .then((cache) => {
            return Promise.allSettled(
              CACHE_ASSETS.map(url => 
                fetch(url)
                  .then(response => {
                    if (response.ok) {
                      return cache.put(url, response);
                    }
                    return Promise.resolve();
                  })
                  .catch(() => Promise.resolve()) // Ignore if asset doesn't exist
              )
            );
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME && key !== CACHE_NAME + '-assets') {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
          return Promise.resolve();
        }));
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients for newest version');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first with cache fallback for API,
// cache first with network fallback for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // For API requests, use network first strategy
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // For page navigations, use network first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // For static assets, use cache first strategy
  event.respondWith(cacheFirstStrategy(event.request));
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME + '-assets');
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If both cache and network fail, return a simple offline page
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    // For images, return a placeholder
    if (request.destination === 'image') {
      return caches.match('/placeholder.png');
    }
    
    // For other assets, just throw the error
    throw error;
  }
}

// Network-first strategy for API requests and navigation
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response if it's valid
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If both network and cache fail, return the offline page for navigations
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    // For other requests, just throw the error
    throw error;
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'New Notification', body: 'Something happened in the app' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Failed to parse push notification data', e);
  }
  
  const options = {
    body: data.body,
    icon: '/android-chrome-192x192.png',
    badge: '/badge-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((windowClients) => {
        const url = event.notification.data.url;
        
        // Check if there is already a window/tab open with this URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
