/* ===========================================================
   apps/gauss-pairing/area-perimeter/app.js
   بناء سُلّم (A) + إكمال أفقي (B) + أدلة طول/عرض ديناميكية
   Zoom + حفظ n مستقبلاً إن رغبتَ (يمكن الإضافة بسهولة)
   =========================================================== */

(() => {
  // عناصر DOM
  const grid       = document.getElementById('grid');
  const stage      = document.getElementById('stage');

  const nRange     = document.getElementById('nRange'); // إن لم يوجد تجاهله
  const zoomInBtn  = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const zoomReset  = document.getElementById('zoomReset');

  const guides     = document.getElementById('guides');
  const tH         = document.getElementById('tH');
  const tV         = document.getElementById('tV');

  const resetBtn   = document.getElementById('reset');
  const zoomGroup  = document.querySelector('.zoomGroup');

  // حالة
  let L = 6;                  // عدد صفوف A (الدرجات)
  let W = 8;                  // عدد أعمدة A قبل الإكمال
  let zoom = 1;

  // دوال مساعدة
  function getCSSNumber(name){
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
  }

  // بناء شبكة A (السلم) + تهيئة B كإزاحة أفقية
  function buildGrid(){
    grid.innerHTML = '';
    const cell = getCSSNumber('--cell') || 28;
    const gap  = getCSSNumber('--gap')  || 6;

    grid.style.gridTemplateColumns = `repeat(${W}, var(--cell))`;
    grid.style.gridTemplateRows    = `repeat(${L}, var(--cell))`;

    // نبني السلم A (مستطيل L×W)
    for(let r=0; r<L; r++){
      for(let c=0; c<W; c++){
        const el = document.createElement('div');
        el.className = 'cell a';
        grid.appendChild(el);
      }
    }

    // سلوك الإكمال B يحصل عند الطلب (في هذا النموذج عرضنا القياسات فقط)
    updateMeasures();

    // أدلة الطول/العرض
    updateGuidesText();
    fitGuideLabels(); // ← مهم لضبط حجم الخط والسطرين
  }

  // تحديث نصوص الأدلة
  function updateGuidesText(){
    if (tH) tH.textContent = `الطول = W = ${W}`;
    if (tV) tV.textContent = `العرض = L = ${L}`;
  }

  // تحديث القياسات (يمكنك ربطه ببطاقاتك)
  function updateMeasures(){
    const pEl = document.querySelector('.info [data-p]');
    const aEl = document.querySelector('.info [data-a]');
    const da  = document.querySelector('.info [data-da]');
    const dp  = document.querySelector('.info [data-dp]');
    const A = L * W;
    const P = 2 * (L + W);
    if (aEl) aEl.textContent = A;
    if (pEl) pEl.textContent = P;
    if (da)  da.textContent  = '0';
    if (dp)  dp.textContent  = '0';
  }

  // ضبط النص وسُمك الخط طبقًا لحجم الشبكة على الشاشة
  // ملاحظة: نأخذ في الاعتبار عامل التكبير (zoom) حتى لا يحدث تضخيم مزدوج
  function fitGuideLabels(){
    const r = grid.getBoundingClientRect();
    if (!r.width || !r.height) return;

    const base = Math.min(r.width, r.height) / Math.max(zoom, 0.001);

    // أصغر من قبل كي لا يطغى على المكعبات
    const fs = clamp(base * 0.035, 10, 18);     // 3.5% من البعد الأصغر
    const stroke = clamp(base * 0.0025, 0.8, 1.4);

    guides.style.setProperty('--gFont',   `${fs}px`);
    guides.style.setProperty('--gStroke', `${stroke}`);

    // إزاحة طفيفة للنصَّين عن الحواف (بوحدات viewBox)
    const pad = Math.min(6, (fs / base) * 100 * 0.6); // نسبة تقريبية
    const tHY = (98 - pad).toFixed(1);
    const tVX = (98 - pad).toFixed(1);

    if (tH) tH.setAttribute('y', tHY);
    if (tV) tV.setAttribute('x', tVX);
  }

  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  // Zoom
  function applyZoom(){
    stage.style.transform = `scale(${zoom})`;
    if(zoomReset) { zoomReset.textContent = `${Math.round(zoom * 100)}%`; }
    fitGuideLabels(); // ← حتى تتكيف النصوص والسُمك مع التكبير/التصغير
  }

  // أحداث الواجهـة
  if (nRange) {
    nRange.addEventListener('input', e=>{
      // لو استعملت شريط n عام، يمكن أن تُسند n إلى L/W كما تشاء
      // هنا سنجعل L = n و W ثابتة مثالًا
      L = parseInt(e.target.value, 10) || 6;
      buildGrid();
    });
  }

  document.getElementById('zoomIn') .addEventListener('click', ()=>{ zoom = clamp(zoom + 0.1, 0.6, 2.0); applyZoom(); });
  document.getElementById('zoomOut').addEventListener('click', ()=>{ zoom = clamp(zoom - 0.1, 0.6, 2.0); applyZoom(); });
  document.getElementById('zoomReset').addEventListener('click', ()=>{ zoom = 1; applyZoom(); });

  // في هذا النموذج الأساسي لا نضيف B تلقائيًا، لكنه متاح للتوسعة لاحقًا
  if (document.getElementById('reset')) {
    resetBtn.addEventListener('click', ()=>{
      L = 6; W = 8; zoom = 1; applyZoom(); buildGrid();
    });
  }

  // إعادة الضبط عند تغيير المقاس
  window.addEventListener('resize', fitGuideLabels);

  // أول تشغيل
  buildGrid();
  applyZoom();
})();
