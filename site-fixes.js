/* IN THE VOID — PDF-only viewer bridge. Images and videos stay unchanged. */
(function(){
  'use strict';
  if(window.__inVoidPdfBridgeV2) return;
  window.__inVoidPdfBridgeV2=true;

  function viewerPath(){
    const path=window.location.pathname;
    return /\/app\/index\.html$/.test(path) ? '../pdf-viewer.html' : './pdf-viewer.html';
  }

  function openDedicatedPdf(frame){
    if(!frame || frame.dataset.inVoidPdfOpened==='1') return;
    const url=frame.getAttribute('src') || frame.src || '';
    if(!url || url==='about:blank') return;
    frame.dataset.inVoidPdfOpened='1';
    const title=document.querySelector('.midad-media-viewer-title')?.textContent?.trim() || 'ملف PDF';
    const target=viewerPath()+'?url='+encodeURIComponent(url)+'&name='+encodeURIComponent(title);
    // Keep this inside the site's existing viewer instead of sending the PDF to Chrome.
    frame.src=target;
    frame.removeAttribute('sandbox');
    frame.style.width='100%';
    frame.style.height='100%';
    frame.style.border='0';
  }

  function watchPdf(){
    document.querySelectorAll('iframe.midad-media-pdf').forEach(openDedicatedPdf);
  }

  function installUnsupportedDownloadPage(){
    if(typeof window.openMaterialViewer!=='function' || typeof window.midadMediaType!=='function' || typeof window.midadGetMaterialUrl!=='function') return;
    if(window.openMaterialViewer.__inVoidWrapped) return;
    const original=window.openMaterialViewer;
    async function wrapped(item){
      const path=item?.filePath || item?.fileData || '';
      const name=item?.fileName || item?.name || 'الملف';
      const type=window.midadMediaType(path,name);
      if(type==='unknown' && path){
        try{
          const result=await window.midadGetMaterialUrl(path,type,name);
          if(!result?.url) throw new Error('تعذر الوصول إلى الملف');
          const page=new URL(viewerPath().replace('pdf-viewer.html','download-only.html'),window.location.href);
          page.searchParams.set('url',result.url);
          page.searchParams.set('name',name);
          window.location.assign(page.href);
          return;
        }catch(e){
          if(typeof window.showToast==='function') window.showToast(e.message||'تعذر الوصول إلى الملف','error');
          return;
        }
      }
      return original(item);
    }
    wrapped.__inVoidWrapped=true;
    window.openMaterialViewer=wrapped;
  }

  function start(){
    watchPdf();
    installUnsupportedDownloadPage();
    const observer=new MutationObserver(function(){watchPdf();installUnsupportedDownloadPage();});
    if(document.body) observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
    setInterval(function(){watchPdf();installUnsupportedDownloadPage();},500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
