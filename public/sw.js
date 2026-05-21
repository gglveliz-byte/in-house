// Service Worker para PWA - In-House Delivery Elite
const CACHE_NAME = 'inhouse-delivery-v3'
const OFFLINE_URL = '/offline.html'

const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
]

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache abierto')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        self.skipWaiting()
      })
  )
})

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando cache antiguo', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      self.clients.claim()
    })
  )
})

// Estrategia: Network First con fallback a Cache y página Offline inteligente
self.addEventListener('fetch', (event) => {
  // Solo manejar solicitudes GET
  if (event.request.method !== 'GET') return

  // Ignorar solicitudes de API que no sean de assets estáticos o configuraciones públicas
  if (event.request.url.includes('/api/') && !event.request.url.includes('/api/push/')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachear respuestas válidas (status 200 o 304)
        if (!response || (response.status !== 200 && response.status !== 304)) {
          return response
        }

        const url = new URL(event.request.url)
        const isNextAsset = url.pathname.includes('/_next/')
        const isStaticAsset = urlsToCache.includes(url.pathname) || 
                              url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff2?|json)$/) ||
                              url.search.includes('_rsc=')

        // Cachear si es una solicitud local (basic), CORS permitida o un fragmento de Next.js (opaque)
        if (response.type === 'basic' || response.type === 'cors' || (isNextAsset && response.type === 'opaque') || isStaticAsset) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }

        return response
      })
      .catch(async () => {
        // Intentar recuperar desde el cache en caso de pérdida de red
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) {
          return cachedResponse
        }

        // Si es una navegación de página principal (HTML), redirigir a offline.html
        if (event.request.mode === 'navigate') {
          const offlineResponse = await caches.match(OFFLINE_URL)
          if (offlineResponse) {
            return offlineResponse
          }
        }

        // Enviar respuesta fallback genérica para otros recursos
        return new Response('Sin conexión de red', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' }),
        })
      })
  )
})

// Listener para recibir notificaciones push en segundo plano
self.addEventListener('push', (event) => {
  console.log('Service Worker: Evento Push recibido')
  let data = { title: 'In-House Delivery', body: 'Actualización de pedido disponible.', link: '/' }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = { title: 'In-House Delivery', body: event.data.text(), link: '/' }
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.link || '/'
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Listener para click en notificación push en segundo plano
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Click en la notificación')
  event.notification.close()

  const urlToOpen = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Buscar si hay alguna pestaña abierta de la aplicación y navegar en ella
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i]
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.navigate(urlToOpen).then((c) => c?.focus())
          }
        }
        // Si no hay pestañas abiertas, abrir una nueva
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})
