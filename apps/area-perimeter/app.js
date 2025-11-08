/* apps/area-perimeter/app.js — بناء الشبكة + ضبط أدلة الطول/العرض + ربط عناصر التحكم */

document.addEventListener('DOMContentLoaded', () => {
  // عناصر DOM
  const grid       = document.getElementById('grid');
  const stage      = document.getElementById('stage');

  const lenRange   = document.getElementById('lenRange');   // <input id="lenRange">
  const widRange   = document.getElementById('widRange');   // <input id="widRange">
  const resetBtn   = document.getElementById('resetBtn') || document.getElementById('reset');

  const zoomInBtn  = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomReset  = document.getElementById('zoomReset');

  const guides     = document.getElementById('guides');
  const tH         = document.getElementById('tH');
  const tV         = document.getElementById('tV');

  // حالة
  let L = toInt(lenRange?.value, 6);
  let W = toInt(widRange?.value, 8);
  let zoom = 1;

  /* -------------- دوال مساعدة -------------- */
  function toInt(v, fallback){ const n = parseInt(v, 10); return Number.isFinite(n) ? n : fallback; }
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  function buildGrid(){
    grid.inner={{
      toString(){ return ''; } // guard
    }};
    grid.innerHTML = ''; // نظف

    grid.style.gridTemplateColumns = `repeat(${W}, var(--cell))`;
    grid.style.gridTemplateRows    = `repeat(${L}, var(--cell))`;

    for(let r=0; r<L; r++){
      for(let c=0; c<W; c++){
        const el = document.createElement('div');
        el.className = 'cell a';
        grid.appendChild(el);
      }
    }

    updateGuideTexts();
    requestAnimationFrame(fitGuideLabels); // لضمان وجود أبعاد صحيحة قبل القياس
  }

  function updateGuideTexts(){
    if (tH) tH.textContent = `الطول = W = ${W}`;
    if (tV) tV.textContent = `العرض = L = ${L}`;
  }

  // تصغير ديناميكي للنص والسماكة حسب حجم الشبكة ومعامل zoom
  function fitGuideLabels(){
    const r = grid.getBoundingClientRect();
    if (!r.width || !r.height) return;

    const base   = Math.min(r.width, r.height) / Math.max(zoom, 0.001);

    // أصغر بوضوح: 1.6%–2.4% من أصغر بُعد (بعد قسمة تأثير الزوم)
    const fs     = clamp(base * 0.02, 8, 14);       // px
    const stroke = clamp(base * 0.0012, 0.4, 0.9);  // px

    if (guides){
      guides.style.setProperty('--gFont',   `${fs}px`);
      guides.style.setProperty('--gStroke', `${stroke}`);
    }

    // نبعد النص قليلاً عن الحافة داخل viewBox 0..100
    const padPct = Math.min(6, (fs / base) * 100 * 0.7);
    if (tH) tH.setAttribute('y', (98 - padPct).toFixed(1));
    if (tV) tV.setAttribute('x', (98 - padPct).toFixed(1));
  }

  function applyZoom(){
    if (stage) stage.style.transform = `scale(${zoom})`;
    if (zoomReset) zoomReset.textContent = `${Math.round(zoom*100)}%`;
    fitGuideLabels();
  }

  /* -------------- ربط الأحداث -------------- */
  if (lenRange) {
    lenRange.addEventListener('input', e=>{
      L = clamp(toInt(e.target.value, L), 1, 100);
      buildGrid();
    });
  }
  if (widRange) {
    widRange.addEventListener('input', e=>{
      W = clamp(toInt(e.target.value, W), 1, 100);
      buildGrid();
    });
  }

  if (resetBtn){
    resetBtn.addEventListener('click', ()=>{
      L = 6; W = 8; zoom = 1;
      if (lenRange) lenRange.value = String(L);
      if (widRange) widRange.value = String(W);
      applyZoom();
      buildGrid();
    });
  }

  if (zoomInBtn)  zoomInBtn.addEventListener('click', ()=>{ zoom = clamp(zoom + 0.1, 0.6, 2.0); applyZoom(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', ()=>{ zoom = clamp(zoom - 0.1, 0.6, 2.0); applyZoom(); });
  if (zoomReset)  zoomReset.addEventListener('click', ()=>{ zoom = 1; applyZoom(); });

  window.addEventListener('resize', fitGuideLabels);

  /* -------------- تشغيل أولي -------------- */
  buildGrid();
  applyZoom();
});
