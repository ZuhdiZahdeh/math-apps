/* حيلة غاوس – تزاوج الأعداد (سُلّم المكعبات) مع مبدّل وضع + حفظ في LocalStorage */
(() => {
  "use strict";

  // تخزين وضع الإكمال
  const MODE_STORE = {
    key: 'mathapps.gauss.mode',
    get(){ try { return localStorage.getItem(this.key); } catch { return null; } },
    set(v){ try { localStorage.setItem(this.key, v); } catch {} }
  };

  const $  = (id)=>document.getElementById(id);
  const txt = (id, v)=>{ const el=$(id); if(el) el.textContent=v; };

  // عناصر التحكم
  const nInput=$('n'), grid=$('grid'), arena=$('arena');
  const playBtn=$('play'), stepBtn=$('step'), resetBtn=$('reset'), speedSel=$('speed');
  const postExplain=$('postExplain'), dismissBtn=$('dismiss');

  // مبدّل الوضع
  const modeToggle=$('modeToggle'), modeLabel=$('modeLabel');
  let mode = 'top'; // 'top' | 'right'

  // الإرشادات الرسومية
  const guides=$('guides'), hLine=$('hLine'), vLine=$('vLine'), hText=$('hText'), vText=$('vText');

  // تكبير/تصغير
  const DEFAULT_FS=18; let zoomPx=DEFAULT_FS;
  const zi=$('zoomIn'), zo=$('zoomOut'), zr=$('zoomReset'), zv=$('zoomVal');
  const updZoom=()=>{ if(zv) zv.textContent=Math.round((zoomPx/DEFAULT_FS)*100)+'%'; };
  const setFs=(px)=>{ px=Math.max(14,Math.min(26,px)); document.documentElement.style.fontSize=px+'px'; zoomPx=px; updZoom(); if(arena.classList.contains('complete')) updateGuides(); };

  let currentN=parseInt(nInput?.value||'20',10);
  let stepIndex=0, explainTimer=null;

  function readBlockGap(){
    const cs=getComputedStyle(document.documentElement);
    return { block: parseFloat(cs.getPropertyValue('--block'))||28,
             gap:   parseFloat(cs.getPropertyValue('--gap'))  || 6 };
  }

  function setMode(m){
    mode = (m==='right') ? 'right' : 'top';
    arena.classList.remove('mode-top','mode-right');
    arena.classList.add(mode==='top' ? 'mode-top' : 'mode-right');
    if(modeLabel) modeLabel.textContent = (mode==='top') ? 'من الأعلى' : 'على اليمين';
    modeToggle?.setAttribute('aria-pressed', mode==='right' ? 'true' : 'false');
    modeToggle?.setAttribute('title', `التبديل بين أوضاع الإكمال (الحالي: ${(mode==='top')?'من الأعلى':'على اليمين'})`);

    MODE_STORE.set(mode);      // حفظ الاختيار

    build(currentN);           // إعادة البناء ليتوافق مع الوضع
  }

  function build(n){
    grid.innerHTML=''; arena.classList.remove('complete'); postExplain?.classList.remove('hidden');
    if(explainTimer){ clearTimeout(explainTimer); explainTimer=null; }
    stepIndex=0;

    const {block,gap}=readBlockGap();
    for(let r=1;r<=n;r++){
      const row=document.createElement('div'); row.className='row';

      const label=document.createElement('div'); label.className='label'; label.textContent=r; row.appendChild(label);

      // السلم الأصلي A
      const groupA=document.createElement('div'); groupA.className='group a';
      for(let i=0;i<r;i++){ const b=document.createElement('div'); b.className='block a'; groupA.appendChild(b); }
      row.appendChild(groupA);

      const spacer=document.createElement('div'); spacer.className='spacer';
      const arrow=document.createElement('div'); arrow.className='pairArrow';
      arrow.textContent = (mode==='top') ? '⬇' : '↗';
      spacer.appendChild(arrow); row.appendChild(spacer);

      // المكمل B
      const groupB=document.createElement('div'); groupB.className='group b'; groupB.dataset.size=(n+1-r);
      const lift = Math.max(0, (r-1)*(block+gap)); // مقدار الرفع الرأسي/القطري
      groupB.style.setProperty('--lift', lift+'px');
      for(let i=0;i<(n+1-r);i++){ const b=document.createElement('div'); b.className='block b'; groupB.appendChild(b); }
      row.appendChild(groupB);

      grid.appendChild(row);
    }

    // نصوص
    txt('nVal',n); txt('nLabel',n);
    txt('dimsLabel',`${n} × ${n+1}`);
    txt('rectCells', n*(n+1));
    txt('sum', (n*(n+1))/2);
    txt('dimA', n); txt('dimB', n+1);
    txt('areaVal', n*(n+1)); txt('sumVal', (n*(n+1))/2);

    // تقدير عرض الحلبة
    const approx=(block+gap)*(n+1)+140;
    grid.style.minWidth=Math.max(approx,420)+'px';
  }

  function revealRowB(i){
    const rows=[...grid.querySelectorAll('.row')];
    if(i>=rows.length) return false;
    const b=rows[i].querySelector('.group.b'); if(!b) return false;
    const duration=parseInt(speedSel.value,10);
    b.getBoundingClientRect(); // force reflow
    b.style.transitionDuration=duration+'ms';
    b.classList.add('in');
    const arrow=rows[i].querySelector('.pairArrow'); if(arrow) arrow.classList.add('show');
    return true;
  }

  async function play(){
    playBtn.disabled=stepBtn.disabled=nInput.disabled=speedSel.disabled=true;
    const rows=[...grid.querySelectorAll('.row')]; const duration=parseInt(speedSel.value,10);
    for(let i=stepIndex;i<rows.length;i++){
      revealRowB(i); stepIndex=i+1;
      await new Promise(res=>setTimeout(res, duration*0.9));
    }
    markComplete();
    playBtn.disabled=stepBtn.disabled=nInput.disabled=speedSel.disabled=false;
  }

  function markComplete(){
    arena.classList.add('complete');
    txt('dimA',currentN); txt('dimB',currentN+1);
    txt('areaVal', currentN*(currentN+1));
    txt('sumVal',  (currentN*(currentN+1))/2);
    updateGuides();

    if(postExplain){
      postExplain.classList.remove('hidden');
      if(explainTimer) clearTimeout(explainTimer);
      explainTimer=setTimeout(()=>{ if(!postExplain.classList.contains('hidden')) postExplain.classList.add('hidden'); }, 10000);
    }
  }

  function reset(){ build(currentN); }

  function updateGuides(){
    if(!guides || !arena.classList.contains('complete')) return;
    const firstA=grid.querySelector('.row .group.a .block');
    const firstRow=grid.querySelector('.row');
    const lastRow=grid.querySelector('.row:last-child');
    const lastRowAny=lastRow ? (lastRow.querySelector('.group.a .block') || lastRow.querySelector('.block')) : null;
    const lastBFirstRow=firstRow ? firstRow.querySelector('.group.b .block:last-child') : null;
    if(!firstA || !lastRowAny || !lastBFirstRow) return;

    const aRect=arena.getBoundingClientRect(), pad=18;
    const offL=aRect.left+pad, offT=aRect.top+pad;

    const rA=firstA.getBoundingClientRect();
    const rBend=lastBFirstRow.getBoundingClientRect();
    const rLast=lastRowAny.getBoundingClientRect();

    const x1=rA.left-offL, x2=rBend.right-offL;
    const yMid=(rA.top-offT)+rA.height/2;
    const y1v=rA.top-offT, y2v=rLast.bottom-offT;
    const xV=x1-10;

    const w=aRect.width-2*pad, h=aRect.height-2*pad;
    guides.setAttribute('viewBox',`0 0 ${w} ${h}`);

    hLine.setAttribute('x1',x1); hLine.setAttribute('y1',yMid);
    hLine.setAttribute('x2',x2); hLine.setAttribute('y2',yMid);
    vLine.setAttribute('x1',xV); vLine.setAttribute('y1',y1v);
    vLine.setAttribute('x2',xV); vLine.setAttribute('y2',y2v);

    hText.setAttribute('x',(x1+x2)/2-16);
    hText.setAttribute('y',yMid-8);
    hText.textContent=(currentN+1)+' (n+1)';

    vText.setAttribute('x',xV-10);
    vText.setAttribute('y',(y1v+y2v)/2+12);
    vText.textContent=currentN+' (n)';
  }

  // الأحداث
  nInput.addEventListener('input',e=>{ currentN=parseInt(e.target.value,10); build(currentN); });
  playBtn.addEventListener('click', play);
  stepBtn.addEventListener('click', ()=>{ const ok=revealRowB(stepIndex); if(ok){ stepIndex++; if(stepIndex===currentN) markComplete(); }});
  resetBtn.addEventListener('click', reset);

  if(modeToggle){
    modeToggle.addEventListener('click', ()=> setMode(mode==='top' ? 'right' : 'top'));
  }

  if(dismissBtn){
    dismissBtn.addEventListener('click', (e)=>{ e.preventDefault(); if(explainTimer){ clearTimeout(explainTimer); explainTimer=null; } postExplain?.classList.add('hidden'); });
  }
  if(postExplain){
    postExplain.addEventListener('click', (e)=>{ if(e.target===postExplain) postExplain.classList.add('hidden'); });
    postExplain.querySelector('.card')?.addEventListener('click', (e)=> e.stopPropagation());
  }

  window.addEventListener('resize', ()=>{ if(arena.classList.contains('complete')) updateGuides(); });

  if(zi) zi.addEventListener('click', ()=>setFs(zoomPx+1));
  if(zo) zo.addEventListener('click', ()=>setFs(zoomPx-1));
  if(zr) zr.addEventListener('click', ()=>setFs(DEFAULT_FS));
  updZoom();

  // تشغيل أولي مع استرجاع الوضع من LocalStorage
  const savedMode = MODE_STORE.get();
  setMode(savedMode === 'right' ? 'right' : 'top'); // يستدعي build(currentN) داخليًا
})();
