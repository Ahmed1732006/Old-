/* IN THE VOID — native PDF viewer fix. Images/videos unchanged. */
(function(){
  'use strict';
  if(window.__inVoidNativePdfFix) return;
  window.__inVoidNativePdfFix=true;

  // Let Android/Chrome's native PDF viewer render the original PDF.
  // This preserves the PDF's embedded Arabic fonts/encoding and provides
  // native pinch-to-zoom and two-finger panning instead of canvas re-rendering.
  function openNativePdf(frame){
    if(!frame || frame.dataset.nativePdfOpened==='1') return;
    const url=frame.getAttribute('src') || frame.src || '';
    if(!url || url==='about:blank') return;
    frame.dataset.nativePdfOpened='1';
    window.location.assign(url);
  }

  function watchPdf(){
    document.querySelectorAll('.midad-media-pdf').forEach(openNativePdf);
  }

  const observer=new MutationObserver(watchPdf);
  function start(){
    watchPdf();
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
    setInterval(watchPdf,500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
