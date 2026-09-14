/* IN THE VOID — PDF viewer fix only. No admin/member back-button changes. */
(function(){
  'use strict';
  if(window.__inVoidPdfFixV2) return;
  window.__inVoidPdfFixV2=true;
  const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  let pdfJsPromise=null;
  const css=document.createElement('style');css.textContent=`
    .midad-media-pdf{display:none!important}
    .iv-pdf-stage{position:relative;width:100%;height:100%;min-height:0;background:#202228;overflow:hidden}
    .iv-pdf-scroll{width:100%;height:100%;overflow:auto;box-sizing:border-box;padding:12px 8px 28px;touch-action:pan-x pan-y;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
    .iv-pdf-page{display:flex;justify-content:center;margin:0 auto 12px}
    .iv-pdf-page canvas{display:block;background:#fff;height:auto;max-width:none;box-shadow:0 2px 14px rgba(0,0,0,.42)}
    .iv-pdf-tools{position:absolute;z-index:8;top:10px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:13px;background:rgba(10,17,32,.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 8px 22px rgba(0,0,0,.28)}
    .iv-pdf-tools button{width:38px;height:38px;border:0;border-radius:10px;background:#29354e;color:#fff;font:900 21px/1 Arial,sans-serif;cursor:pointer}
    .iv-pdf-tools span{min-width:62px;color:#e5edf8;text-align:center;font:800 11px Cairo,Tahoma,sans-serif}
    .iv-pdf-loading{min-height:45vh;display:grid;place-items:center;text-align:center;color:#dbe3f0;font:800 14px Cairo,Tahoma,sans-serif;padding:30px}
  `;document.head.appendChild(css);
  function loadPdfJs(){
    if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if(pdfJsPromise) return pdfJsPromise;
    pdfJsPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=PDFJS;s.async=true;s.onload=()=>window.pdfjsLib?resolve(window.pdfjsLib):reject(new Error('تعذر تحميل عارض PDF'));s.onerror=()=>reject(new Error('تعذر تحميل مكتبة PDF'));document.head.appendChild(s)});
    return pdfJsPromise;
  }
  async function renderPdf(container){
    if(!container||container.dataset.ivRendered==='1'||container.dataset.ivBusy==='1') return;
    const url=container.dataset.ivPdfUrl||'';if(!url||url==='about:blank') return;container.dataset.ivBusy='1';
    try{
      const pdfjs=await loadPdfJs();pdfjs.GlobalWorkerOptions.workerSrc=WORKER;
      const r=await fetch(url,{cache:'no-store'});if(!r.ok) throw new Error('تعذر قراءة ملف PDF');
      const pdf=await pdfjs.getDocument({data:new Uint8Array(await r.arrayBuffer())}).promise;
      const zoom=window.__inVoidPdfZoom||1,width=Math.max(260,Math.min(window.innerWidth-28,1100));container.innerHTML='';
      for(let n=1;n<=pdf.numPages;n++){
        const page=await pdf.getPage(n),base=page.getViewport({scale:1}),scale=Math.max(.55,Math.min(3.5,(width/base.width)*zoom)),vp=page.getViewport({scale});
        const holder=document.createElement('div');holder.className='iv-pdf-page';const canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);holder.appendChild(canvas);container.appendChild(holder);
        await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport:vp}).promise;
      }
      container.dataset.ivRendered='1';container.dataset.ivBusy='0';const count=document.querySelector('[data-iv-pdf-count]');if(count) count.textContent=pdf.numPages+' صفحة';
    }catch(err){container.dataset.ivBusy='0';container.innerHTML='<div class="iv-pdf-loading">تعذر فتح ملف PDF مباشرة.<br><br>'+String(err&&err.message||'حدث خطأ')+'</div>'}
  }
  function replaceNativePdf(){
    document.querySelectorAll('.midad-media-pdf').forEach(frame=>{
      const body=frame.closest('.midad-media-viewer-body');if(!body||body.querySelector('[data-iv-pdf-container]')) return;
      const url=frame.getAttribute('src')||frame.src||'';frame.style.display='none';
      const stage=document.createElement('div');stage.className='iv-pdf-stage';
      const tools=document.createElement('div');tools.className='iv-pdf-tools';tools.innerHTML='<button type="button" data-iv-zoom-out aria-label="تصغير">−</button><span data-iv-pdf-count>جاري الفتح…</span><button type="button" data-iv-zoom-in aria-label="تكبير">+</button>';
      const scroll=document.createElement('div');scroll.className='iv-pdf-scroll';scroll.setAttribute('data-iv-pdf-container','1');scroll.dataset.ivPdfUrl=url;scroll.innerHTML='<div class="iv-pdf-loading">جاري فتح الملف مباشرة…</div>';
      stage.appendChild(tools);stage.appendChild(scroll);body.insertBefore(stage,frame);renderPdf(scroll);
    });
  }
  document.addEventListener('click',e=>{
    const plus=e.target.closest?.('[data-iv-zoom-in]'),minus=e.target.closest?.('[data-iv-zoom-out]');if(!plus&&!minus) return;e.preventDefault();e.stopPropagation();
    const old=Number(window.__inVoidPdfZoom)||1;window.__inVoidPdfZoom=Math.max(.75,Math.min(2.5,old+(plus?0.25:-0.25)));
    document.querySelectorAll('[data-iv-pdf-container]').forEach(c=>{c.dataset.ivRendered='';c.innerHTML='<div class="iv-pdf-loading">جاري إعادة ضبط الحجم…</div>';renderPdf(c)});
  },true);
  const observer=new MutationObserver(replaceNativePdf);
  function start(){replaceNativePdf();observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class']});setInterval(replaceNativePdf,700)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
