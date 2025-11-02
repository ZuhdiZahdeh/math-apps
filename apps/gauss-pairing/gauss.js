/* ============================================
   Gauss Pairing — Logic
   ملفات: gauss.js
   آخر تعديل: إيزومتري + localStorage + fitGuideLabels ديناميكي
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  /* عناصر الواجهة (متوافقة مع index.html السابق) */
  const arena       = document.getElementById('arena');        // .arena
  const stage       = document.getElementById('stage');        // .stage (لأجل الـZoom)
  const grid        = document.getElementById('grid');         // .grid
  const guides      = document.getElementById('guides');       // <svg> للعرض/الطول
  const postExplain = document.getElementById('postExplain');  // صندوق الشرح بعد الاكتمال

  // تحكّم التشغيل
  const playBtn   = document.getElementById('play');
  const stepBtn   = document.getElementById('step');
  const resetBtn  = document.getElementById('reset');

  // n والسرعة
  const nRange  = document.getElementById('nRange');
  const speedEl = document.getElementById('speed');

  // زوم
  const zoomOut   = document.getElementById('zoomOut');
  const zoomIn    = document.getElementById('zoomIn');
  const zoomReset = document.getElementById('zoomReset');

  // إيزومتري
  const isoToggle  = document.getElementById('toggleIso');   // زر تبديل المسطّح/الإيزومتري
  const depthRange = document.getElementById('depthRange');  // منزلق عمق
  const depthValue = document.getElementById('depthValue');  // عرض قيمة العمق

  // القيم
  let n = parseInt(nRange?.value || '20', 10);
  let speed = (speedEl?.value || 'medium');
  let zoom = 1;

  // حالة التحريك
  let isPlaying = false;
  let currentRow = 0;
  let timer = null;

  // حفظ/استرجاع وضع الإيزومتري والعمق
  const savedIso    = localStorage.getItem('gp_iso');
  const savedDepth  = localStorage.getItem('gp_iso_depth');

  if (savedIso === '1') {
    arena.classList.add('iso');
    if (isoToggle) isoToggle.classList.add('active');
  }
  if (savedDepth) {
    arena.style.setProperty('--depth', `${savedDepth}px`);
    if (depthRange) depthRange.value = savedDepth;
    if (depthValue) depthValue.textContent = `${savedDepth}px`;
  } else {
    const def = 12;
    arena.style.setProperty('--depth', `${def}px`);
    if (depthRange) depthRange.value = def;
    if (depthValue) depthValue.textContent = `${def}px`;
  }

  /* =========================
     بناء الشبكة (السُلّم الأصلي)
     ========================= */
  function build(){
    stop();
    grid.innerHTML = '';
    arena.classList.remove('complete');
    postExplain?.classList.add('hidden');
    guides.style.opacity = 0;

    // نبني n صفوف: الصف i يحوي i مربعات من المجموعة A (الزرقاء)
    for(let i=1; i<=n; i++){
      const row = document.createElement('div');
      row.className = 'row';
      // نحاول الاصطفاف يمين الشبكة لتبدو مثل سلّم قطري
      row.style.justifyContent = 'end';

      for(let j=0; j<i; j++){
        const cell = document.createElement('div');
        cell.className = 'cell a';
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }

    // نرسم خطوط/نصوص دليل الطول والعرض حسب n
    drawGuides();

    currentRow = 0;
    fitGuideLabels(); // ⟵ ضبط أحجام «الطول/العرض» ديناميكيًا
  }

  /* دليل الطول/العرض (SVG مبسّط) */
  function drawGuides(){
    const w = grid.clientWidth - 40;
    const h = grid.clientHeight - 40;

    // أبعاد المستطيل النهائي: n × (n+1)
    // نكتفي برسم خط أفقي في الأسفل (الطول = n+1) وخط رأسي في اليمين (العرض = n)
    const svg = `
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- خط الطول (أفقي في الأسفل) -->
        <line x1="5" y1="94" x2="95" y2="94"></line>
        <text x="50" y="98" text-anchor="middle" class="tMuted">الطول = n+1</text>

        <!-- خط العرض (رأسي في اليمين) -->
        <line x1="95" y1="10" x2="95" y2="94"></line>
        <text x="98" y="54" transform="rotate(-90 98,54)">العرض = n</text>
      </svg>
    `;
    guides.innerHTML = svg;
  }

  /* تشغيل الأنيميشن: نكمل المستطيل بإضافة مكعّبات مجموعة B فوق/يمين المثلث
     (عرض بصري أفقي خطوة بخطوة) */
  function play(){
    if(isPlaying) return;
    isPlaying = true;

    // سرعة المؤقّت
    const delay = speedToMs(speed);

    timer = setInterval(() => {
      if(currentRow >= n){
        // اكتمل
        stop();
        onComplete();
        return;
      }
      addComplementRow(currentRow + 1);
      currentRow++;
    }, delay);
  }

  function step(){
    if(currentRow >= n){
      onComplete();
      return;
    }
    addComplementRow(currentRow + 1);
    currentRow++;
  }

  function stop(){
    isPlaying = false;
    if(timer) clearInterval(timer);
    timer = null;
  }

  function reset(){
    stop();
    build();
  }

  /* نحاكي «الإكمال» بإضافة n-i+1 مكعّبات من B في الصف المُقابل للصف i
     بحيث يتكون مستطيل أبعاده n × (n+1) بصريًا */
  function addComplementRow(i){
    // الصف i من أسفل يقابله إكمال بطول (n+1 - i)
    const needed = (n + 1) - i;
    if(needed <= 0) return;

    const row = grid.children[i-1];
    if(!row) return;

    // نضيف مكعّبات B في بداية الصف ليبدو كأنه يُستكمَل أفقيًا
    for(let k=0;k<needed;k++){
      const cell = document.createElement('div');
      cell.className = 'cell b';
      row.insertBefore(cell, row.firstChild);
    }
  }

  function onComplete(){
    arena.classList.add('complete');
    guides.style.opacity = 1;
    postExplain?.classList.remove('hidden');
    fitGuideLabels(); // قد تتغيّر أبعاد الشبكة بعد الاكتمال
  }

  /* سرعة */
  function speedToMs(v){
    switch(v){
      case 'slow':   return 450;
      case 'fast':   return 120;
      default:       return 250; // medium
    }
  }

  /* =========== Zoom =========== */
  function applyZoom(){
    stage.style.transform = `scale(${zoom})`;
    if(zoomReset) zoomReset.textContent = `${Math.round(zoom*100)}%`;
    fitGuideLabels();
  }

  /* =========== Iso / Depth =========== */
  function setIso(isIso){
    arena.classList.toggle('iso', isIso);
    if(isoToggle){
      isoToggle.classList.toggle('active', isIso);
      isoToggle.setAttribute('aria-pressed', isIso ? 'true' : 'false');
    }
    localStorage.setItem('gp_iso', isIso ? '1' : '0');
    // بعد تبديل الطبقات قد تتغيّر المسافات
    requestAnimationFrame(fitGuideLabels);
  }

  function setDepth(px){
    const v = Math.max(4, Math.min(24, parseInt(px,10) || 12));
    arena.style.setProperty('--depth', `${v}px`);
    if(depthValue) depthValue.textContent = `${v}px`;
    if(depthRange) depthRange.value = String(v);
    localStorage.setItem('gp_iso_depth', String(v));
    requestAnimationFrame(fitGuideLabels);
  }

  /* =========== ضبط ديناميكي لدليل الطول/العرض =========== */
  function fitGuideLabels(){
    const r = grid.getBoundingClientRect();
    if(!r.width || !r.height) return;

    const minDim = Math.min(r.width, r.height);
    // حجم خط النص بين 12 و 28 بكسل وفقًا لحجم الشبكة
    const fs = Math.max(12, Math.min(28, minDim * 0.05));
    const stroke = Math.max(1.2, Math.min(3, fs / 10));

    guides.style.setProperty('--guideFont',  fs + 'px');
    guides.style.setProperty('--guideStroke', stroke);
  }

  /* =======================
     الأحداث (Event Listeners)
     ======================= */
  playBtn?.addEventListener('click', play);
  stepBtn?.addEventListener('click', step);
  resetBtn?.addEventListener('click', reset);

  nRange?.addEventListener('input', e=>{
    n = parseInt(e.target.value, 10) || 1;
    build();
  });
  speedEl?.addEventListener('change', e=>{
    speed = e.target.value;
    if(isPlaying){
      stop();
      play();
    }
  });

  zoomIn?.addEventListener('click', ()=>{
    zoom = Math.min(2.0, +(zoom + 0.1).toFixed(2));
    applyZoom();
  });
  zoomOut?.addEventListener('click', ()=>{
    zoom = Math.max(0.6, +(zoom - 0.1).toFixed(2));
    applyZoom();
  });
  zoomReset?.addEventListener('click', ()=>{
    zoom = 1;
    applyZoom();
  });

  isoToggle?.addEventListener('click', ()=>{
    setIso(!arena.classList.contains('iso'));
  });
  depthRange?.addEventListener('input', e=> setDepth(e.target.value));

  window.addEventListener('resize', fitGuideLabels);

  /* أوّل بناء */
  build();
  applyZoom();
});
