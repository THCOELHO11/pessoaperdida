/* Service worker — uso offline. Aumente CACHE_VERSION ao publicar uma nova versão. */
const CACHE_VERSION = 'busca-pp-v1';
const PRECACHE = ['./','index.html','pdf-lib.min.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png',
  'GUIA_DE_COMANDO_EM_BRANCO.pdf','GUIA_PRATICO_POP_BAR-001.pdf','POP_BAR-001.pdf',
  'FICHA_PERFIL_ABATIDO.pdf','FICHA_PERFIL_AUTISTA.pdf','FICHA_PERFIL_CACADOR.pdf','FICHA_PERFIL_CAMINHANTE.pdf',
  'FICHA_PERFIL_CRIANCA_7_9_ANOS.pdf','FICHA_PERFIL_DEMENCIA.pdf'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_VERSION).then(c=>Promise.all(PRECACHE.map(u=>c.add(u).catch(()=>null)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req = e.request, url = new URL(req.url);
  if(req.method!=='GET' || url.origin!==location.origin || url.pathname.startsWith('/api/')) return;
  /* rede primeiro (pega atualizações); sem rede, usa o que está guardado */
  e.respondWith(fetch(req).then(res=>{
    const ct = (res.headers.get('content-type')||'').toLowerCase();
    const isPdf = /\.pdf$/i.test(url.pathname);
    if(res.ok && !(isPdf && ct.indexOf('html')>=0)){
      const copy = res.clone(); caches.open(CACHE_VERSION).then(c=>c.put(req,copy)).catch(()=>{});
    }
    return res;
  }).catch(()=>caches.match(req, {ignoreSearch:true}).then(r=> r || (req.mode==='navigate' ? caches.match('index.html') : Response.error()))));
});
