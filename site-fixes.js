/* IN THE VOID — live-site fixes injected by sw.js */
(function(){
  'use strict';
  const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFWORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  let pdfScale=1;
  function addBackButton(){
    const path=location.pathname;
    if(!/\/(admin-manager|admin-videos)\.html$/.test(path)) return;
    const actions=document.querySelector('.header-actions, .brandbar > div:last-child');
    if(!actions || actions.querySelector('[data-site-fix-back]')) return;
    const a=document.createElement('a'); a.href='./app/index.html'; a.dataset.siteFixBack='1';
    a.className=location.pathname.endsWith('admin-videos.html')?'header-btn':'btn-gray';
    a.style.cssText='text-decoration:none;display:inline-flex;align-items:center;gap:7px;';
    a.innerHTML='<i class="fas fa-arrow-right"></i><span>رجوع للتطبيق</span>'; actions.insertBefore(a,actions.firstChild);
  }
  function ensurePdfJs(){
    if(window.pdfjsLib) return Promise.resolve();
    return new Promise((resolve,reject)=>{ const old=document.querySelector('script[data-site-fix-pdfjs]');
      if(old){old.addEventListener('load',()=>resolve());old.addEventListener('error',reject);return;}
      const s=document.createElement('script');s.src=PDFJS;s.async=true;s.dataset.siteFixPdfjs='1';s.onload=()=>resolve();s.onerror=reject;document.head.appendChild(s);
    });
  }
  function closeShell(){document.getElementById('site-pdf-fix')?.remove();}
  function openShell(title,url){
    closeShell(); pdfScale=1;
    const ov=document.createElement('div'); ov.id='site-pdf-fix';
    ov.innerHTML=`<div class="site-pdf-fix-box" dir="rtl"><div class="site-pdf-fix-head"><strong></strong><div class="site-pdf-fix-actions"><button type="button" data-pdf-fix-external>فتح في برنامج آخر</button><button type="button" data-pdf-fix-close aria-label="إغلاق">×</button></div></div><div class="site-pdf-fix-tools"><button data-pdf-fix-minus>−</button><span data-pdf-fix-count>جاري فتح PDF…</span><button data-pdf-fix-plus>+</button></div><div class="site-pdf-fix-scroll"><div class="site-pdf-fix-loading">جاري فتح الملف مباشرة…</div></div></div>`;
    ov.querySelector('strong').textContent=title||'PDF'; document.body.appendChild(ov);
    ov.querySelector('[data-pdf-fix-close]').onclick=closeShell; ov.addEventListener('click',e=>{if(e.target===ov)closeShell();});
    ov.querySelector('[data-pdf-fix-external]').onclick=()=>window.open(url,'_blank','noopener,noreferrer');
    ov.querySelector('[data-pdf-fix-plus]').onclick=()=>{pdfScale=Math.min(3,+(pdfScale+.25).toFixed(2));render(url);};
    ov.querySelector('[data-pdf-fix-minus]').onclick=()=>{pdfScale=Math.max(.5,+(pdfScale-.25).toFixed(2));render(url);};
    render(url);
  }
  async function render(url){
    const ov=document.getElementById('site-pdf-fix');if(!ov)return; const scroll=ov.querySelector('.site-pdf-fix-scroll');const count=ov.querySelector('[data-pdf-fix-count]');
    try{ await ensurePdfJs(); window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFWORKER;
      const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error('تعذر قراءة ملف PDF');const buf=await res.arrayBuffer();
      const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(buf)}).promise;scroll.innerHTML='';count.textContent=`${pdf.numPages} صفحة`;
      const width=Math.min(window.innerWidth-28,920);
      for(let n=1;n<=pdf.numPages;n++){if(!document.getElementById('site-pdf-fix'))return;const page=await pdf.getPage(n);const base=page.getViewport({scale:1});const scale=Math.max(.5,Math.min(3,(width/base.width)*pdfScale));const vp=page.getViewport({scale});const wrap=document.createElement('div');wrap.className='site-pdf-fix-page';const canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);wrap.appendChild(canvas);scroll.appendChild(wrap);await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport:vp}).promise;}
    }catch(err){scroll.innerHTML='<div class="site-pdf-fix-error">'+String(err?.message||'تعذر فتح ملف PDF')+'<br><br>يمكنك استخدام «فتح في برنامج آخر».</div>';count.textContent='تعذر فتح PDF';}
  }
  async function resolvePdfPath(path){
    if(/^https?:\/\//i.test(path))return path; const client=(typeof sb!=='undefined')?sb:window.sb;
    if(client?.storage){const r=await client.storage.from('materials').createSignedUrl(path,3600);if(r?.error)throw r.error;if(r?.data?.signedUrl)return r.data.signedUrl;}
    throw new Error('تعذر الوصول إلى ملف PDF');
  }
  document.addEventListener('click',async function(e){
    const el=e.target.closest?.('[data-act="open-material"]');if(!el)return;const path=el.dataset.file||'';const name=el.dataset.name||'PDF';
    if(!/\.pdf(?:$|\?)/i.test(path)&&!/\.pdf$/i.test(name))return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    try{openShell(name,await resolvePdfPath(path));}catch(err){alert(err?.message||'تعذر فتح ملف PDF');}
  },true);
  window.addEventListener('DOMContentLoaded',addBackButton);setTimeout(addBackButton,500);setTimeout(addBackButton,1500);
})();