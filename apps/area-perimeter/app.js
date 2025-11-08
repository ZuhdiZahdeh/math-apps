/* apps/area-perimeter/app.js — بناء الشبكة + ضبط الأدلة + ربط الأزرار */

document.addEventListener('DOMContentLoaded', () => {
  // عناصر الواجهة حسب IDs في index.html
  const grid       = document.getElementById('grid');
  const stage      = document.getElementById('stage');

  const lenRange   = document.getElementById('lenRange');
  const widRange   = document.getElementById('widRange');
  const resetBtn   = document.getElementById('resetBtn');

  const zoomInBtn  = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomReset  = document.getElementById('zoomReset');

  const guides     = document.getElementById('guides');
  const tH         = document.getElementById('tH');
  const tV         = document.getElementById('tV');

  // حالة
  let L = clampInt(parseIntSafe(lenRange?.value), 1, 100) ?? 6;
  let W = clampInt(parseIntSafe(widRange?.value), 1, 100) ?? 8;
  let zoom = 1;

  // دوال مساعدة
  function parseIntSafe(v){ const n = parseInt(v,10); return Number.isFinite(n)? n : null; }
  function clampInt(v,min,max){ return Math.min(Math.max(v,min),max); }
  function cssNum(name){ return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0; }

  function buildGrid(){
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${W}, var(--cell))`;
    grid.style.gridTemplateRows    = `repeat(${L}, var(--cell))`;

    for(let r=0;r<L;r++){
      for(let c=0;c<W;c++){
        const el = document.createElement('div');
        el.className = 'cell a';
        grid.appendChild(el);
      }
    }
    updateGuideTexts();
    fitGuideLabels();
  }

  function updateGuideTexts(){
    if (tH) tH.textContent = `الطول = W = ${W}`;
    if (tV) tV.textContent = `العرض = L = ${L}`;
  }

  // يضبط حجم خط الـSVG وسُمك الخط حسب حجم الشبكة ومعامل التكبير
  function fitGuideLabels(){
    const r = grid.getBoundingClientRect();
    if (!r || !r.width || !r.height) return;

    const base = Math.min(r.width, r.height) / Math.max(zoom, 0.001);

    // خط أصغر بكثير: 2%–3.2% من البعد الأصغر
    const fs     = Math.max(9,  Math.min(16, base * 0.028));
    const stroke = Math.max(0.6, Math.min(1.1, base * 0.0016));

    guides?.style.setProperty('--gFont',   `${fs}px`);
    guides?.style.setProperty('--gStroke', `${stroke}`);

    // نبعد النص قليلاً عن الحواف (بوحدات viewBox 0..100)
    const padPct = Math.min(6, (fs / base) * 100 * 0.7);
    if (tH) tH.setAttribute('y', (98 - padPct).toString());
    if (tV) tV.setAttribute('x', (98 - padPct).toString());
  }

  function applyZoom(){
    if (stage) stage.style.transform = `scale(${zoom})`;
    if (zoomReset) zoomReset.textContent = `${Math.round(zoom*100)}%`;
    fitGuideLabels();
  }

  // --------- روابط الأحداث ---------
  if (lenRange) {
    lenRange.addEventListener('input', e => {
      L = clampInt(parseIntSafe(e.target.value), 1, 100);
      buildGrid();
    });
  }
  if (widRange) {
    widRange.addEventListener('input', e => {
      W = clampInt(parseIntSafe(e.target.value), 1, 100);
      buildGrid();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      L = 6; W = 8; zoom = 1;
      if (lenRange) lenRange.value = String(L);
      if (widRange) widRange.value = String(W);
      applyZoom();
      buildGrid();
    });
  }

  if (zoomInBtn)  zoomInBtn.addEventListener('click', () => { zoom = Math.min(2.0, +(zoom + 0.1).toFixed(2)); applyZoom(); });
  if (zoomOutBtn) zoomOut.addEventListener('click',   () => { zoom = Math.max(0.6, +(zoom - 0.1).toFixed(2)); applyZoom(); });
  if (zoomReset)  zoomReset.addEventListener('click', () => { zoom = 1; applyZoom(); });

  window.addEventListener('resize', fitGuideLabels);

  // --------- تشغيل أولي ---------
  buildGrid();
  applyZoom();
});
