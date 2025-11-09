document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // عناصر DOM
  var grid       = document.getElementById('grid');
  var stage      = document.getElementById('stage');

  var lenRange   = document.getElementById('lenRange');
  var widRange   = document.getElementById('widRange');

  var addRowBtn  = document.getElementById('addRow');
  var addColBtn  = document.getElementById('addCol');
  var resetBtn   = document.getElementById('resetBtn') || document.getElementById('reset');

  var btnArea    = document.getElementById('btnArea');
  var btnPeri    = document.getElementById('btnPerimeter');

  var zoomInBtn  = document.getElementById('zoomIn');
  var zoomOutBtn = document.getElementById('zoomOut');
  var zoomReset  = document.getElementById('zoomReset');

  var guides     = document.getElementById('guides');
  var tH         = document.getElementById('tH');
  var tV         = document.getElementById('tV');

  var metricsEl  = document.getElementById('metrics');

  // حالة
  var L = toInt(lenRange ? lenRange.value : 6, 6);   // الطول = عدد الصفوف
  var W = toInt(widRange ? widRange.value : 8, 8);   // العرض = عدد الأعمدة
  var zoom = 1;
  var mode = 'none';                                  // none | area | perimeter

  // أدوات
  function toInt(v, fallback){ var n = parseInt(v,10); return isFinite(n) ? n : fallback; }
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  /* ===== بناء الشبكة ===== */
  function buildGrid() {
    if (!grid) return;
    grid.innerHTML = '';

    grid.style.gridTemplateColumns = 'repeat(' + W + ', var(--cell))';
    grid.style.gridTemplateRows    = 'repeat(' + L + ', var(--cell))';

    var frag = document.createDocumentFragment();
    for (var r = 0; r < L; r++) {
      for (var c = 0; c < W; c++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('data-r', r);
        cell.setAttribute('data-c', c);
        frag.appendChild(cell);
      }
    }
    grid.appendChild(frag);

    updateGuideTexts();
    updateMetrics();
    requestAnimationFrame(function () {
      fitGuideLabels();
      applyMode();
    });
  }

  function updateGuideTexts(){
    if (tH) tH.textContent = 'العرض = W = ' + W;   // الأعمدة
    if (tV) tV.textContent = 'الطول = L = ' + L;   // الصفوف
  }

  /* ===== أدلة الطول/العرض ===== */
  function fitGuideLabels(){
    if (!guides) return;
    guides.style.setProperty('--gFont',   '6px');
    guides.style.setProperty('--gStroke', '0.4');
    if (tH) tH.setAttribute('y', '97.5');
    if (tV) tV.setAttribute('x', '97.5');
  }

  /* ===== لوحة القيم ===== */
  function updateMetrics(){
    if (!metricsEl) return;
    var P = 2 * (L + W);
    var A = L * W;
    metricsEl.innerHTML =
      '<div class="row">' +
        '<span class="tag">المحيط</span>' +
        '<div>P = 2(L + W) = 2(' + L + ' + ' + W + ') = <b>' + P + '</b> وحدة</div>' +
      '</div>' +
      '<div class="row">' +
        '<span class="tag">المساحة</span>' +
        '<div>A = L × W = ' + L + ' × ' + W + ' = <b>' + A + '</b> وحدة²</div>' +
      '</div>';
  }

  /* ===== تلوين المفاهيم ===== */
  function clearHighlights(){
    var cells = grid.querySelectorAll('.cell');
    for (var i=0;i<cells.length;i++){
      cells[i].classList.remove('areaHi','periHi');
    }
  }

  function highlightArea(){
    clearHighlights();
    var cells = grid.querySelectorAll('.cell');
    for (var i=0;i<cells.length;i++){
      cells[i].classList.add('areaHi');
    }
    mode = 'area';
  }

  function highlightPerimeter(){
    clearHighlights();
    var cells = grid.querySelectorAll('.cell');
    for (var i=0;i<cells.length;i++){
      var el = cells[i];
      var r = +el.getAttribute('data-r');
      var c = +el.getAttribute('data-c');
      if (r === 0 || r === L-1 || c === 0 || c === W-1) {
        el.classList.add('periHi');
      }
    }
    mode = 'perimeter';
  }

  function applyMode(){
    if (mode === 'area')       { highlightArea(); }
    else if (mode === 'perimeter') { highlightPerimeter(); }
  }

  /* ===== Zoom ===== */
  function applyZoom(){
    if (stage) stage.style.transform = 'scale(' + zoom + ')';
    if (zoomReset) zoomReset.textContent = Math.round(zoom*100) + '%';
    fitGuideLabels();
  }

  /* ===== الأحداث ===== */
  if (lenRange) lenRange.addEventListener('input', function(e){
    L = clamp(toInt(e.target.value, L), 1, 100); buildGrid();
  });
  if (widRange) widRange.addEventListener('input', function(e){
    W = clamp(toInt(e.target.value, W), 1, 100); buildGrid();
  });

  if (addRowBtn) addRowBtn.addEventListener('click', function(){
    L = clamp(L + 1, 1, 100);
    if (lenRange) lenRange.value = String(L);
    buildGrid();
  });
  if (addColBtn) addColBtn.addEventListener('click', function(){
    W = clamp(W + 1, 1, 100);
    if (widRange) widRange.value = String(W);
    buildGrid();
  });

  if (resetBtn) resetBtn.addEventListener('click', function(){
    L = 6; W = 8; zoom = 1; mode = 'none';
    if (lenRange) lenRange.value = String(L);
    if (widRange) widRange.value = String(W);
    applyZoom();
    buildGrid();
  });

  if (btnArea) btnArea.addEventListener('click', function(){
    mode = (mode === 'area') ? 'none' : 'area';
    if (mode === 'none') clearHighlights(); else highlightArea();
  });
  if (btnPeri) btnPeri.addEventListener('click', function(){
    mode = (mode === 'perimeter') ? 'none' : 'perimeter';
    if (mode === 'none') clearHighlights(); else highlightPerimeter();
  });

  if (zoomInBtn)  zoomInBtn.addEventListener('click',  function(){ zoom = clamp(zoom + 0.10, 0.6, 2.0); applyZoom(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', function(){ zoom = clamp(zoom - 0.10, 0.6, 2.0); applyZoom(); });
  if (zoomReset)  zoomReset.addEventListener('click',  function(){ zoom = 1; applyZoom(); });

  window.addEventListener('resize', fitGuideLabels);

  /* ===== تشغيل أول مرة ===== */
  buildGrid();
  applyZoom();
});
