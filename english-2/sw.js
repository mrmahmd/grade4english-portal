'use strict';
const CACHE='alandalus-english2-v1';
const ROOT=new URL('./',self.location.href).href;
const CORE=['./','index.html','css/styles.css?v=20260907-1','js/data.js?v=20260907-1','js/progress.js?v=20260907-1','js/cloud.js?v=20260907-1','js/app.js?v=20260907-1','assets/images/hero.webp'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('alandalus-english2-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||!e.request.url.startsWith(ROOT))return;
  e.respondWith(fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return response;}).catch(async()=>{const found=await caches.match(e.request);if(found)return found;return new Response('Offline. Reconnect to load this lesson asset.',{status:503});}));
});
