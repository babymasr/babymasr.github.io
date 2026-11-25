// Baby Masr service worker: offline cache. Bump VERSION on each release.
const VERSION = 'bm-v2-2';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(VERSION).then(c => c.addAll(['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './privacy.html']))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // Firebase, YouTube etc. go straight to the network
    e.respondWith((async () => {
        const cache = await caches.open(VERSION);
        if (req.mode === 'navigate') {
            try { const r = await fetch(req); cache.put(req, r.clone()); return r; }
            catch { return (await cache.match(req)) || (await cache.match('./')) || Response.error(); }
        }
        const hit = await cache.match(req);
        const net = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => hit);
        return hit || net;
    })());
});
