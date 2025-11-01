/* حيلة غاوس – تزاوج الأعداد (سُلّم المكعبات) */
(() => {
  "use strict";

  const $ = (id)=>document.getElementById(id);
  const safeText = (id, v)=>{ const el = $(id); if (el) el.textContent = v; };

  // عناصر التحكم
  const nInput = $('n'), nVal=$('nVal'), nLabel=$('nLabel');
  const grid = $('grid'), arena = $('arena');
  const playBtn=$('play'), stepBtn=$('step'), resetBtn=$('reset'), speedSel=$('speed');
  const postExplain=$('postExplain'), dismissBtn=$('dismiss');

  // إرشادات المستطيل
  const guides=$('guides'), hLine=$('hLine'), vLine=$('vLine'), hText=$('hText'), vText=$('vText');

  let currentN = parseInt(nInput.value, 10);
  let stepIndex = 0;
  let explainTimer = null;

  // تكبير/تصغير النص
  const DEFAULT_FS = 18;
  let zoomPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || DEFAULT_FS;
  const zi=$('zoomIn'), zo=$('zoomOut'), zr=$('zoomReset'), zv=$('zoomVal');
  const updateZoomLabel = ()=>{ if(zv) zv.textContent = Math.round((zoomPx/DEFAULT_FS)*100)+'%'; };
  const setFs = (px)=>{
    px = Math.max(14, Math.min(26, px));
    document.documentElement.style.fontSize = px+'px';
    zoomPx = px; updateZoomLabel();
    if (arena.classList.contains('complete')) { updateGuides(); }
  };

  // قراءة قيم الكتلة/الفجوة من :root
  function readBlockGap(){
    const cs = getComputedStyle(document.documentElement);
    const block = parseFloat(cs.getPropertyValue('--block')) || 28;
    const gap   = parseFloat(cs.getPropertyValue('--gap'))   || 6;
    return {block, gap};
  }

  function build(n){
    grid.innerHTML = '';
    arena.classList.remove('complete');
    postExplain?.classList.remove('hidden');
    if(explainTimer) { clearTimeout(explainTimer); explainTimer=null; }
    stepIndex = 0;

    const {block, gap} = readBlockGap();

    for(let r=1; r<=n; r++){
      const row = document.createElement('div'); row.className='row';

      const label = document.createElement('div'); label.className='label'; label.textContent = r; row.appendChild(label);

      // السُلّم الأصلي A (يسارًا من 1..r)
      const groupA = document.createElement('div'); groupA.className='group a';
      for(let i=0;i<r;i++){ const b=document.createElement('div'); b.className='block a'; groupA.appendChild(b); }
      row.appendChild(groupA);

      // سهم صغير بين A و B
      const spacer = document.createElement('div'); spacer.className='spacer';
      const arrowMid = document.createElement('div'); arrowMid.className='pairArrow'; arrowMid.textContent='↔';
      spacer.appendChild(arrowMid); row.appendChild(spacer);

      // المكمل B (سينتقل للأعلى فوق السلم)
      const groupB = document.createElement('div'); groupB.className='group b'; groupB.dataset.size = (n+1-r);
      // مقدار الرفع الرأسي لهذا الصف بالبكسل: (r-1) * (block + gap)
      const lift = (r-1) * (block + gap);
      groupB.style.setProperty('--lift', lift + 'px');

      for(let i=0;i<(n+1-r);i++){ const b=document.createElement('div'); b.className='block b'; groupB.appendChild(b); }
      row.appendChild(groupB);

      grid.appendChild(row);
    }

    // تحديث نصوص
    safeText('nVal', n); safeText('nLabel', n);
    safeText('dimsLabel', `${n} × ${n+1}`);
    safeText('rectCells', n*(n+1));
    safeText('sum', (n*(n+1))/2);
    safeText('dimA', n); safeText('dimB', n+1);
    safeText('areaVal', n*(n+1));
    safeText('sumVal', (n*(n+1))/2);

    // تقدير عرض الحلبة
    const approxWidth = (block + gap) * (n+1) + 140;
    grid.style.minWidth = Math.max(approxWidth, 420) + 'px';
  }

  function revealRowB(index){
    const rows = Array.from(grid.querySelectorAll('.row'));
    if(index >= rows.length) return false;
    const b = rows[index].querySelector('.group.b');
    if(!b) return false;
    const duration = parseInt(speedSel.value,10);
    b.getBoundingClientRect();
    b.style.transitionDuration = duration+'ms';
    b.classList.add('in');
    const arrow = rows[index].querySelector('.pairArrow');
    if(arrow){ arrow.classList.add('show'); }
    return true;
  }

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
    safeText('dimA', currentN);
    safeText('dimB', currentN+1);
    safeText('areaVal', currentN*(currentN+1));
    safeText('sumVal', (currentN*(currentN+1))/2);
    updateGuides();

    if(postExplain){
      postExplain.classList.remove('hidden');
      if(explainTimer) clearTimeout(explainTimer);
      explainTimer = setTimeout(()=>{ if(!postExplain.classList.contains('hidden')) postExplain.classList.add('hidden'); }, 10000);
    }
  }

  function reset(){ build(currentN); }

  function updateGuides(){
    if(!guides || !arena.classList.contains('complete')) return;
    const firstA = grid.querySelector('.row .group.a .block');
    const firstRow = grid.querySelector('.row');
    const lastRow = grid.querySelector('.row:last-child');
    const lastRowAny = lastRow ? (lastRow.querySelector('.group.a .block') || lastRow.querySelector('.block')) : null;
    const lastBFirstRow = firstRow ? firstRow.querySelector('.group.b .block:last-child') : null;
    if(!firstA || !lastRowAny || !lastBFirstRow) return;

    const aRect = arena.getBoundingClientRect();
    const pad = 18;
    const offsetLeft = aRect.left + pad;
    const offsetTop  = aRect.top  + pad;

    const rA    = firstA.getBoundingClientRect();
    const rBend = lastBFirstRow.getBoundingClientRect();
    const rLast = lastRowAny.getBoundingClientRect();

    const x1   = rA.left - offsetLeft;
    const x2   = rBend.right - offsetLeft;
    const yMid = (rA.top - offsetTop) + rA.height/2;
    const y1v  = rA.top - offsetTop;
    const y2v  = rLast.bottom - offsetTop;
    const xV   = x1 - 10;

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

  // أحداث
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
    postExplain.addEventListener('click', (e)=>{ if(e.target === postExplain){ postExplain.classList.add('hidden'); } });
    postExplain.querySelector('.card')?.addEventListener('click', (e)=> e.stopPropagation());
  }

  window.addEventListener('resize', ()=>{ if(arena.classList.contains('complete')) updateGuides(); });

  if(zi)  zi.addEventListener('click', ()=> setFs(zoomPx + 1));
  if(zo)  zo.addEventListener('click', ()=> setFs(zoomPx - 1));
  if(zr)  zr.addEventListener('click', ()=> setFs(DEFAULT_FS));
  updateZoomLabel();

  // تشغيل أولي
  build(currentN);
})();
