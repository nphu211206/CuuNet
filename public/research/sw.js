const CACHE = 'cuunet-research-v4';
const ASSETS = [
  './index.html',
  './style.css',
  './app.mjs',
  './verification.mjs',
  './vendor/tf.min.js',
  './vendor/fflate.js',
  './vendor/leaflet.js',
  './vendor/leaflet.css',
  './vendor/images/marker-icon.png',
  './vendor/images/marker-shadow.png',
  './vendor/images/marker-icon-2x.png',
  './CuuNet_ERA5Land_L7_basins.geojson',
  './model_bundle_bao_ha.zip',
  './model_bundle_gianh.zip',
  './model_bundle_can_tho.zip'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('cuunet-research-') && k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method === 'GET' && new URL(event.request.url).origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(hit => hit || fetch(event.request))
    );
  }
});
