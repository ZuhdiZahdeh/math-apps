/* حيلة غاوس – تزاوج الأعداد (سُلّم المكعبات) */
(() => {
  "use strict";

  // ===== أدوات مساعدة آمنة =====
  const $ = (id)=>document.getElementById(id);
  const safeText = (id, v)=>{ const el = $(id); if (el) el.textContent = v; };

  // مراجع عامة
  const nInput = $('n');
  const nVal   = $('nVal');
  const nLabel = $('nLabel');
  const grid   = $('grid');
  const arena  = $('arena');
  const playBtn= $('play');
  const stepBtn= $('step');
  const resetBtn=$('reset');
  const speedSel=$('speed');

  const postExplain = $('postExplain');
  const dismissBtn  = $('dismiss');

  // طبقة الأسهم الإيضاحية
  const guides = $('guides');
  const hLine = $('hLine');
  const vLine = $('vLine');
  const hText = $('hText');
  const vText = $('vText');

  let currentN = parseInt(nInput.value, 10);
  let stepIndex = 0;      // أي صف تم إدخاله من مجموعة B
  let explainTimer = null;

  // ===== تحكم التكبير/التصغير =====
  const DEFAULT_FS = 18; // px
  let zoomPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || DEFAULT_FS;
  const zoomInBtn = $('zoomIn');
  const zoomOutBtn = $('zoomOut');
  const zoomResetBtn = $('zoomReset');
  const zoomValEl = $('zoomVal');
  const updateZoomLabel = ()=> { if(zoomValEl){ zoomValEl.textContent = Math.round((zoomPx/DEFAULT_FS)*100) + '%'; } };
  const setFs = (px)=>{
    px = Math.max(14, Math.min(26, px));
    document.documentElement.style.fontSize = px+'px';
    zoomPx = px;
    updateZoomLabel();
    if (arena.classList.contains('complete')) { updateGuides(); }
  };

  // بناء المشهد بالكامل
  function build(n){
    grid.innerHTML = '';
    arena.classList.remove('complete');
    if(postExplain) postExplain.classList.remove('hidden');
    if(explainTimer) { clearTimeout(explainTimer); explainTimer = null; }
    stepIndex = 0;

    for(let r=1; r<=n; r++){
      const row = document.createElement('div'); row.className='row';
      const label = document.createElement('div'); label.className='label'; label.textContent = r; row.appendChild(label);

      const groupA = document.createElement('div'); groupA.className='group a';
      for(let i=0;i<r;i++){ const b=document.createElement('div'); b.className='block a'; groupA.appendChild(b); }
      row.appendChild(groupA);

      const spacer = document.createElement('div'); spacer.className='spacer';
      const arrowMid = document.createElement('div'); arrowMid.className='pairArrow'; arrowMid.textContent='↔';
      spacer.appendChild(arrowMid); row.appendChild(spacer);

      const groupB = document.createElement('div'); groupB.className='group b'; groupB.dataset.size = (n+1-r);
      for(let i=0;i<(n+1-r);i++){ const b=document.createElement('div'); b.className='block b'; groupB.appendChild(b); }
      row.appendChild(groupB);

      grid.appendChild(row);
    }

    // تحديث العناوين والقيم — بشكل آمن
    safeText('nVal', n);
    safeText('nLabel', n);
    safeText('dimsLabel', `${n} × ${n+1}`);
    safeText('rectCells', n*(n+1));
    safeText('sum', (n*(n+1))/2);
    safeText('dimA', n);
    safeText('dimB', n+1);
    safeText('areaVal', n*(n+1));
    safeText('sumVal', (n*(n+1))/2);

    // ضبط عرض الحلبة تقريبًا بحيث تتسع للمستطيل n × (n+1)
    const block = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--block'));
    const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap'));
    const approxWidth = (block + gap) * (n+1) + 140; // + مساحة الأرقام يمين الصف
    grid.style.minWidth = Math.max(approxWidth, 420) + 'px';
  }

  // إظهار مجموعة B في صف واحد (خطوة)
  function revealRowB(index){
    const rows = Array.from(grid.querySelectorAll('.row'));
    if(index >= rows.length) return false;
    const b = rows[index].querySelector('.group.b');
    if(!b) return false;
    const duration = parseInt(speedSel.value,10);
    b.getBoundingClientRect();           // force reflow
    b.style.transitionDuration = duration+'ms';
    b.classList.add('in');
    const arrow = rows[index].querySelector('.pairArrow');
    if(arrow){ arrow.classList.add('show'); }
    return true;
  }

  // تشغيل متتابع
  async function play(){
    playBtn.disabled = true; stepBtn.disabled = true; nInput.disabled = true; speedSel.disabled = true;
    const rows = Array.from(grid.querySelectorAll('.row'));
    const duration = parseInt(speedSel.value,10);
    for(let i=stepIndex;i<rows.length;i++){
      revealRowB(i);
      stepIndex = i+1;
      await new Promise(res=>setTimeout(res, duration*0.9));
    }
    markComplete();
    playBtn.disabled = false; stepBtn.disabled = false; nInput.disabled = false; speedSel.disabled = false;
  }

  function markComplete(){
    arena.classList.add('complete');
    // تحديث القيم في نافذة الشرح/الصيغة
    safeText('dimA', currentN);
    safeText('dimB', currentN+1);
    safeText('areaVal', currentN*(currentN+1));
    safeText('sumVal', (currentN*(currentN+1))/2);

    updateGuides();

    if(postExplain){
      postExplain.classList.remove('hidden');
      if(explainTimer) { clearTimeout(explainTimer); }
      explainTimer = setTimeout(()=>{
        if(!postExplain.classList.contains('hidden')) postExplain.classList.add('hidden');
      }, 10000);
    }
  }

  function reset(){ build(currentN); }

  // دالة تحديث مواضع الأسهم الإيضاحية (الأبعاد n و n+1)
  function updateGuides(){
    if(!guides) return;
    if(!arena.classList.contains('complete')) return;
    const firstA = grid.querySelector('.row .group.a .block');
    const firstRow = grid.querySelector('.row');
    const lastRow = grid.querySelector('.row:last-child');
    const lastRowAny = lastRow ? (lastRow.querySelector('.group.a .block') || lastRow.querySelector('.block')) : null;
    const lastBFirstRow = firstRow ? firstRow.querySelector('.group.b .block:last-child') : null;
    if(!firstA || !lastRowAny || !lastBFirstRow) return;

    const aRect = arena.getBoundingClientRect();
    const pad = 18; // نفس قيمة inset في .guides
    const offsetLeft = aRect.left + pad;
    const offsetTop = aRect.top + pad;

    const rA = firstA.getBoundingClientRect();
    const rBend = lastBFirstRow.getBoundingClientRect();
    const rLast = lastRowAny.getBoundingClientRect();

    const x1 = rA.left - offsetLeft;
    const x2 = rBend.right - offsetLeft;
    const yMid = (rA.top - offsetTop) + rA.height/2;
    const y1v = rA.top - offsetTop;
    const y2v = rLast.bottom - offsetTop;
    const xV = x1 - 10; // سهم رأسي على يسار السلم بقليل

    const w = aRect.width - 2*pad;
    const h = aRect.height - 2*pad;
    guides.setAttribute('viewBox', `0 0 ${w} ${h}`);

    hLine.setAttribute('x1', x1); hLine.setAttribute('y1', yMid);
    hLine.setAttribute('x2', x2); hLine.setAttribute('y2', yMid);
    vLine.setAttribute('x1', xV); vLine.setAttribute('y1', y1v);
    vLine.setAttribute('x2', xV); vLine.setAttribute('y2', y2v);

    hText.setAttribute('x', (x1+x2)/2 - 16);
    hText.setAttribute('y', yMid - 8);
    hText.textContent = (currentN + 1) + ' (n+1)';

    vText.setAttribute('x', xV - 10);
    vText.setAttribute('y', (y1v + y2v)/2 + 12);
    vText.textContent = currentN + ' (n)';
  }

  // أحداث الواجهة
  nInput.addEventListener('input', e=>{ currentN = parseInt(e.target.value,10); build(currentN); });
  playBtn.addEventListener('click', play);
  stepBtn.addEventListener('click', ()=>{
    const ok = revealRowB(stepIndex);
    if(ok){ stepIndex++; if(stepIndex===currentN){ markComplete(); } }
  });
  resetBtn.addEventListener('click', reset);

  if(dismissBtn){
    dismissBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      if(explainTimer){ clearTimeout(explainTimer); explainTimer=null; }
      postExplain?.classList.add('hidden');
    });
  }
  if(postExplain){
    // إخفاء عند النقر خارج البطاقة
    postExplain.addEventListener('click', (e)=>{ if(e.target === postExplain){ postExplain.classList.add('hidden'); } });
    const card = postExplain.querySelector('.card');
    if(card){ card.addEventListener('click', (e)=> e.stopPropagation()); }
  }

  window.addEventListener('resize', ()=>{ if(arena.classList.contains('complete')) updateGuides(); });

  if(zoomInBtn)  zoomInBtn.addEventListener('click', ()=> setFs(zoomPx + 1));
  if(zoomOutBtn) zoomOutBtn.addEventListener('click', ()=> setFs(zoomPx - 1));
  if(zoomResetBtn) zoomResetBtn.addEventListener('click', ()=> setFs(DEFAULT_FS));
  updateZoomLabel();

  // تهيئة أولية
  build(currentN);
})();

