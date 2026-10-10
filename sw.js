// MacroTrack service worker — makes the app work with no connection.
// Bump CACHE when you want every device to drop its old copy.
const CACHE = 'macrotrack-v1'

// Install: cache the page plus every file it references (JS, CSS, icons,
// manifest). The built file names are hashed, so they are read from the HTML
// instead of being hard-coded here.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    const response = await fetch('./', { cache: 'no-cache' })
    const html = await response.clone().text()
    await cache.put('./', response)
    const assets = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1])
    await cache.addAll([...new Set(assets)])
    await self.skipWaiting()
  })())
})

// Activate: remove caches from older versions and take control straight away.
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return

  // Page loads: try the network first so updates arrive, fall back to the cache offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE)
      try {
        const fresh = await fetch(request)
        cache.put('./', fresh.clone())
        return fresh
      } catch {
        return (await cache.match('./')) || Response.error()
      }
    })())
    return
  }

  // Everything else (hashed assets, icons): cache first, then network.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(request)
    if (cached) return cached
    const fresh = await fetch(request)
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
  })())
})
