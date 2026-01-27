// Service Worker para PWA
const CACHE_NAME = 'inhouse-delivery-v2'
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
        // Activar inmediatamente
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
      // Tomar control inmediatamente
      self.clients.claim()
    })
  )
})

// Estrategia: Network First, luego Cache, luego Offline
self.addEventListener('fetch', (event) => {
  // Solo manejar solicitudes GET
  if (event.request.method !== 'GET') return

  // Ignorar solicitudes de API (queremos que fallen para mostrar el error)
  if (event.request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachear respuestas válidas
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clonar la respuesta
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
      .catch(async () => {
        // Intentar obtener del cache
        const cachedResponse = await caches.match(event.request)

        if (cachedResponse) {
          return cachedResponse
        }

        // Si es una navegación (página HTML), mostrar página offline
        if (event.request.mode === 'navigate') {
          const offlineResponse = await caches.match(OFFLINE_URL)
          if (offlineResponse) {
            return offlineResponse
          }
        }

        // Para otros recursos, retornar error genérico
        return new Response('Sin conexión', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain',
          }),
        })
      })
  )
})
