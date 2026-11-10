/* Service worker for the installable planner app.
   It only handles page loads on your own site. It always fetches the latest
   page from the network first, so updates show up straight away. It keeps a
   copy only as a fallback for when you're offline.
   It never touches Supabase or any other service, and it never reads or
   changes your planner data. */
const CACHE = 'planner-pages-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('planner-pages-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || Response.error()))
  );
});
