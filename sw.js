/* Offline support: cache every app file on install, serve from cache first.
 * Bump VERSION whenever you change any app file so phones pick up the update. */
const VERSION = 'cna-v0.23.14';
// The help chat's on-device AI files (about 37 MB, in app/ai/) are fetched the first time the chat opens and kept
// in their own cache, which survives app updates. Change AI_CACHE only if those files change.
const AI_CACHE = 'cna-ai-v2';
const isAI = (url) => /\/ai\//.test(new URL(url).pathname);
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/styles.css',
  './icons/icon-192.png', './icons/icon-512.png',
  './js/core/time.js', './js/core/planner.js', './js/core/store.js',
  './js/data/curriculum.js', './js/data/questions.js', './js/data/skills.js', './js/data/states.js', './js/data/sources.js', './js/data/exam.js', './js/data/abbreviations.js',
  './js/app.js', './js/views/home.js', './js/views/calendar.js', './js/views/learn.js', './js/views/tests.js', './js/views/more.js', './js/tour.js', './js/data/helpbot-kb.js', './js/helpbot-engine.js', './js/helpbot-online.js', './js/helpbot-fda.js', './js/data/medlineplus.js', './js/data/ok-course-standards.js', './js/data/fed-reference.js', './js/data/gov-library.js', './js/data/medlineplus-version.js', './js/medline-update.js', './js/helpbot.js', './js/ai-worker.js', './js/updater.js',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' bypasses the browser's HTTP cache so an update never stores stale copies.
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== AI_CACHE && k !== 'cna-ai-vecs' && k !== 'cna-mlp-data').map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // MedlinePlus update files (root app/data/) always come from the network so the app sees new versions;
  // the updater stores what it downloads itself (js/medline-update.js). App modules under js/data/ are
  // part of the offline shell and must not be mistaken for those update files.
  const pathname = new URL(e.request.url).pathname;
  if (pathname.includes('/data/') && !pathname.includes('/js/data/')) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      if (res.ok) caches.open(isAI(e.request.url) ? AI_CACHE : VERSION).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
