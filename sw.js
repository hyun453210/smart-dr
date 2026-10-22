/* 화면 파일만 저장해 두고(오프라인에서도 화면은 열림), 데이터(/api)는 항상 서버에서 받는다 */
const CACHE='sdr-gh-v1';
const SHELL=['./','index.html','m.html','common.js','config.js','login.css','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||/config\.js$/.test(u.pathname)) return;
  e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const c=r.clone(); caches.open(CACHE).then(x=>x.put(e.request,c)); } return r; }).catch(()=>caches.match(e.request).then(r=>r||caches.match(/m\.html$/.test(u.pathname)?'m.html':'index.html')))); });
