/* IN THE VOID — offline cache + reliable live PDF fix loader */
const CACHE_NAME='in-the-void-offline-v4';
const APP_SHELL=['./','./index.html','./2.html','./app/index.html','./manifest.webmanifest','./sw.js','./site-fixes.js'];
const HTML_FIX_PATHS=['/app/index.html','/admin-manager.html','/admin-videos.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
async function withFixes(response,url){
  if(!response||!response.ok)return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  try{
    let html=await response.text();
    html=html.replace(/<script[^>]*site-fixes\.js[^>]*><\/script>/gi,'');
    const fixSrc=url.pathname.endsWith('/app/index.html')?'../site-fixes.js':'./site-fixes.js';
    const injected=html.replace('</body>',`<script src="${fixSrc}?v=4"></script></body>`);
    const headers=new Headers(response.headers);
    headers.set('content-type','text/html; charset=UTF-8');
    return new Response(injected,{status:response.status,statusText:response.statusText,headers});
  }catch(_){return response;}
}
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  event.respondWith((async()=>{
    const url=new URL(req.url);
    const shouldFix=HTML_FIX_PATHS.some(p=>url.pathname.endsWith(p));
    try{
      let fresh=await fetch(req,{cache:'no-store'});
      if(shouldFix)fresh=await withFixes(fresh,url);
      if(fresh&&(fresh.ok||fresh.type==='opaque')){const cache=await caches.open(CACHE_NAME);try{await cache.put(req,fresh.clone());}catch(_){}}
      return fresh;
    }catch(_){
      let cached=await caches.match(req);
      if(cached&&shouldFix)cached=await withFixes(cached,url);
      if(cached)return cached;
      if(req.mode==='navigate'){
        const fallback=await caches.match('./2.html')||await caches.match('./index.html');
        if(fallback)return fallback;
      }
      return new Response('',{status:503,statusText:'Offline'});
    }
  })());
});
