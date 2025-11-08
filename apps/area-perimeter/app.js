/* ===================================================================
   apps/area-perimeter/app.js  •  v1.0.9 (final)
   - بناء شبكة L×W من المربعات (class="cell a")
   - ربط منزلقَي الطول (#lenRange) والعرض (#widRange) وزر (#resetBtn)
   - تكبير/تصغير عبر #zoomIn / #zoomOut / #zoomReset
   - أدلة الطول/العرض (SVG #guides) تُضبط دائماً بخط صغير ثابت:
       --gFont: 6px,  --gStroke: 0.4
     + تحريك النصّين قليلاً بعيدًا عن الحواف
   ------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // عناصر DOM الأساسية
  const grid       = document.getElementById('grid');
  const stage      = document.getElementById('stage');

  const lenRange   = document.getElementById('lenRange');   // <input id="lenRange" ...>
  const widRange   = document.getElementById('widRange');   // <input id="widRange" ...>
  const resetBtn   = document.getElementById('resetBtn') || document.getElementById('reset');

  const zoomInBtn  = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomReset  = document.getElementById('zoomReset');

  const guides     = document.getElementById('guides');
  const tH         = document.getElementById('tH');
  const tV         = document.getElementById('tV');

  // حالة أولية
  let L    = toInt(lenRange?.value, 6);   // الطول (عدد الصفوف)
  let W    = toInt(widRange?.value, 8);   // العرض (عدد الأعمدة)
  let zoom = 1;

  /* -------------------- دوال مساعدة -------------------- */
  function toInt(v, fallback) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  }
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  /* -------------------- بناء الشبكة -------------------- */
  function buildGrid() {
    if (!grid) return;

    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${W}, var(--cell))`;
    grid.style.gridTemplateRows    = `repeat(${L}, var(--cell))`;

    for (let r = 0; r < L; r++) {
      for (let c = 0; c < W; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell a';
        grid.appendChild(cell);
      }
    }

    updateGuideTexts();
    // نؤخر ضبط الأدلة لِما بعد رسم العناصر لضمان قياس صحيح
    requestAnimationFrame(fitGuideLabels);
  }

  function updateGuideTexts() {
    if (tH) tH.textContent = `الطول = W = ${W}`;
    if (tV) tV.textContent = `العرض = L = ${L}`;
  }

  /* -------------------- ضبط أدلة الطول/العرض -------------------- */
  // نسخة ثابتة — تُبقي النص وسُمك الخط صغيرين دائماً (6px/0.4px)
  function fitGuideLabels() {
    if (!guides) return;

    // نثبّت القيم الصغيرة ونحرك النص قليلاً بعيداً عن الحواف
    guides.style.setProperty('--gFont', '5px');
    guides.style.setProperty('--gStroke', '0.4');

    if (tH) tH.setAttribute('y', '97.5');  // أسفل قليلاً داخل الـ viewBox
    if (tV) tV.setAttribute('x', '97.5');  // يمين قليلاً داخل الـ viewBox
  }

  /* -------------------- التكبير/التصغير -------------------- */
  function applyZoom() {
    if (stage) stage.style.transform = `scale(${zoom})`;
    if (zoomReset) zoomReset.textContent = `${Math.round(zoom * 100)}%`;
    fitGuideLabels(); // تأكد أن الأدلة متناسقة مع أي تكبير/تصغير
  }

  /* -------------------- ربط الأحداث -------------------- */

  // منزلق الطول L
  if (lenRange) {
    lenRange.addEventListener('input', (e) => {
      L = clamp(toInt(e.target.value, L), 1, 100);
      buildGrid();
    });
  }

  // منزلق العرض W
  if (widRange) {
    widRange.addEventListener('input', (e) => {
      W = clamp(toInt(e.target.value, W), 1, 100);
      buildGrid();
    });
  }

  // زر إعادة الضبط
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      L = 6; W = 8; zoom = 1;
      if (lenRange) lenRange.value = String(L);
      if (widRange) widRange.value = String(W);
      applyZoom();
      buildGrid();
    });
  }

  // أزرار التكبير/التصغير
  if (zoomInBtn)  zoomInBtn.addEventListener('click',  () => { zoom = clamp(zoom + 0.10, 0.6, 2.0); applyZoom(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => { zoom = clamp(zoom - 0.10, 0.6, 2.0); applyZoom(); });
  if (zoomReset)  zoomReset.addEventListener('click',  () => { zoom = 1; applyZoom(); });

  // عند تغيير حجم النافذة نعيد ضبط الأدلة
  window.addEventListener('resize', fitGuideLabels);

  /* -------------------- تشغيل أول مرة -------------------- */
  buildGrid();
  applyZoom();
});
