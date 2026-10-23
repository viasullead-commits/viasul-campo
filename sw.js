// Service worker: guarda o app, a biblioteca do mapa e os pedaços de mapa já vistos → funciona offline.
const CACHE = 'viasul-campo-2026-10-22.29';
const BASE = ['index.html', 'manifest.json', 'icone.svg', 'icone-192.png', 'icone-512.png', 'icone-maskable.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE.map(u => new Request(u, {cache: 'reload'}))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && !k.startsWith('tiles')).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = e.request.url;
  if (e.request.method !== 'GET' || u.includes('script.google.com') || u.includes('googleusercontent.com')) return;   // servidor: sempre rede
  if (u.includes('tile.openstreetmap.org') || u.includes('server.arcgisonline.com')) {   // mapa/satélite: usa o que já foi baixado, e guarda os novos
    e.respondWith(caches.open('tiles').then(c => c.match(e.request).then(r => r || fetch(e.request).then(n => { c.put(e.request, n.clone()); return n; }).catch(() => r))));
    return;
  }
  // app: internet primeiro (pega a versão nova), guardado só se estiver sem sinal
  // cache: 'no-cache' → sempre confere com o site (o GitHub manda o navegador guardar 10 min e o celular ficava na versão velha)
  // a PÁGINA do app ("/viasul-campo/", "index.html", "?x=…") fica numa chave só → o ícone instalado (abre index.html) nunca pega cópia velha
  const pagina = e.request.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(u).pathname);
  const chave = pagina ? new URL('index.html', self.registration.scope).href : e.request;
  e.respondWith(fetch(e.request.url, {cache: 'no-cache'}).then(n => { if (n.ok) { const copia = n.clone(); caches.open(CACHE).then(c => c.put(chave, copia)); } return n; })
    .catch(() => caches.match(chave, {ignoreSearch: true})));
});
