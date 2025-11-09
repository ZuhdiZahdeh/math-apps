document.addEventListener('DOMContentLoaded', () => {
  \"use strict\";

  // عناصر DOM
  const grid       = document.getElementById('grid');
  const stage      = document.getElementById('stage');

  const lenRange   = document.getElementById('lenRange');
  const widRange   = document.getElementById('widRange');

  const addRowBtn  = document.getElementById('addRow');
  const addColBtn  = document.getElementById('addCol');
  const resetBtn   = document.getElementById('resetBtn') || document.getElementById('reset');

  const btnArea    = document.getElementById('btnArea');
  const btnPeri    = document.getElementById('btnPerimeter');

  const zoomInBtn  = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomReset  = document.getElementById('zoomReset');

  const guides     = document.getElementById('guides');
  const tH         = document.getElementById('tH');
  const tV         = document.getElementById('tV');

  const metricsEl  = document.getElementById('metrics');

  // حالة
  let L = toInt(lenRange?.value, 6);   // الطول = عدد الصفوف
  let W = toInt(widRange?.value, 8);   // العرض = عدد الأعمدة
  let zoom = 1;
  let mode = \"none\";                // none | area | perimeter

  // أدوات
  function toInt(v, fallback){ const n = parseInt(v,10); return Number.isFinite(n) ? n : fallback; }
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  /* =================== بناء الشبكة =================== */
  function buildGrid() {
    if (!grid) return;
    grid.innerHTML = "";

    grid.style.gridTemplateColumns = `repeat(${W}, var(--cell))`;
    grid.style.gridTemplateRows    = `repeat(${L}, var(--cell))`;

    const frag = document.createDocumentFragment();
    for (let r = 0; r < L; r++) {
      for (let c = 0; c < W; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell a';
        cell.dataset.r = r;
        cell.dataset.c = c;
        frag.appendChild(cell);
      }
    }
    grid.appendChild(frag);

    updateGuideTexts();
    updateMetrics();
    requestAnimationFrame(() => {
      fitGuideLabels();
      applyMode();
    });
  }

  function updateGuideTexts(){
    if (tH) tH.textContent = `العرض = W = ${W}`;    // الأعمدة
    if (tV) tV.textContent = `الطول = L = ${L}`;    // الصفوف
  }

  /* =================== أدلة الطول/العرض =================== */
  function fitGuideLabels(){
    if (!guides) return;
    guides.style.setProperty('--gFont',   `6px`);
    guides.style.setProperty('--gStroke', `0.4`);
    if (tH) tH.setAttribute('y', '97.5');
    if (tV) tV.setAttribute('x', '97.5');
  }

  /* =================== لوحة القيَم =================== */
  function updateMetrics(){
    if (!metricsEl) return;
    const P = 2 * (L + W);
    const A = L * W;
    metricsEl.innerHTML = `
      <div class='row'>
        <span class='tag'>المحيط</span>
        <div>P = 2(L + W) = 2(${L} + ${W}) = <b>${P}</b> وحدة</div>
      </div>
      <div class='row'>
        <span class='tag'>المساحة</span>
        <div>A = L × W = ${L} × ${W} = <b>${A}</b> وحدة²</div>
      </div>`;
  }

  /* =================== تلوين المفاهيم =================== */
  function clearHighlights(){
    const cells = grid.querySelectorAll('.cell');
    cells.forEach(el => el.classList.remove('areaHi','periHi'));
  }

  function highlightArea(){
    clearHighlights();
    const cells = grid.querySelectorAll('.cell');
    cells.forEach(el => el.classList.add('areaHi'));
    mode = \"area\";
  }

  function highlightPerimeter(){
    clearHighlights();
    const cells = grid.querySelectorAll('.cell');
    cells.forEach(el => {
      const r = +el.dataset.r, c = +el.dataset.c;
      if (r === 0 || r === L-1 || c === 0 || c === W-1) {
        el.classList.add('periHi');
      }
    });
    mode = \"perimeter\";
  }

  function applyMode(){
    if (mode === \"area\") highlightArea();
    else if (mode === \"perimeter\") highlightPerimeter();
  }

  /* =================== Zoom =================== */
  function applyZoom(){
    if (stage) stage.style.transform = `scale(${zoom})`;
    if (zoomReset) zoomReset.textContent = `${Math.round(zoom*100)}%`;
    fitGuideLabels();
  }

  /* =================== ربط الأحداث =================== */
  if (lenRange) lenRange.addEventListener('input', e => { L = clamp(toInt(e.target.value, L), 1, 100); buildGrid(); });
  if (widRange) widRange.addEventListener('input', e => { W = clamp(toInt(e.target.value, W), 1, 100); buildGrid(); });

  if (addRowBtn) addRowBtn.addEventListener('click', () => {
    L = clamp(L + 1, 1, 100);
    if (lenRange) lenRange.value = String(L);
    buildGrid();
  });
  if (addColBtn) addColBtn.addEventListener('click', () => {
    W = clamp(W + 1, 1, 100);
    if (widRange) widRange.value = String(W);
    buildGrid();
  });

  if (resetBtn) resetBtn.addEventListener('click', () => {
    L = 6; W = 8; zoom = 1; mode = \"none\";
    if (lenRange) lenRange.value = String(L);
    if (widRange) widRange.value = String(W);
    applyZoom();
    buildGrid();
  });

  if (btnArea) btnArea.addEventListener('click', () => {
    mode = (mode === \"area\") ? \"none\" : \"area\";
    if (mode === \"none\") clearHighlights(); else highlightArea();
  });
  if (btnPeri) btnPeri.addEventListener('click', () => {
    mode = (mode === \"perimeter\") ? \"none\" : \"perimeter\";
    if (mode === \"none\") clearHighlights(); else highlightPerimeter();
  });

  if (zoomInBtn)  zoomInBtn.addEventListener('click',  () => { zoom = clamp(zoom + 0.10, 0.6, 2.0); applyZoom(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => { zoom = clamp(zoom - 0.10, 0.6, 2.0); applyZoom(); });
  if (zoomReset)  zoomReset.addEventListener('click',  () => { zoom = 1; applyZoom(); });

  window.addEventListener('resize', fitGuideLabels);

  /* =================== تشغيل أول مرة =================== */
  buildGrid();
  applyZoom();
});
