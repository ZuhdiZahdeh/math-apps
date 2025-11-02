/* gauss-pairing.js — نسخة نهائية
   - بناء سُلَّم من 1..n
   - تزاوج أفقي فقط: مجموعة B تنزلق يمينًا لتكمل المستطيل
   - منظور إيزومتري اختياري + عمق محفوظ
   - قصة (نص قصير/كامل) + TTS (استمع/إيقاف)
   - تكبير/تصغير
*/

(() => {
  // ====== عناصر DOM
  const arena      = document.getElementById('arena');
  const grid       = document.getElementById('grid');
  const stage      = document.getElementById('stage');

  const playBtn    = document.getElementById('play');
  const stepBtn    = document.getElementById('step');
  const resetBtn   = document.getElementById('reset');

  const nRange     = document.getElementById('nRange');
  const nLabel     = document.getElementById('nLabel');
  const nSpanTop   = document.getElementById('nSpanTop');
  const nSpan2     = document.getElementById('nSpan2');
  const dimsTop    = document.getElementById('dimsTop');

  const rectCells  = document.getElementById('rectCells');
  const rectCells2 = document.getElementById('rectCells2');
  const sumVal     = document.getElementById('sumVal');

  const guides     = document.getElementById('guides');
  const guideW     = document.getElementById('guideW');
  const guideH     = document.getElementById('guideH');
  const postExplain= document.getElementById('postExplain');
  const hideExplain = document.getElementById('hideExplain');

  // منظور + عمق
  const isoToggle  = document.getElementById('isoToggle');
  const depthCtrl  = document.getElementById('depthCtrl');
  const depthRange = document.getElementById('depthRange');
  const depthValue = document.getElementById('depthValue');

  // تكبير
  const zoomIn     = document.getElementById('zoomIn');
  const zoomOut    = document.getElementById('zoomOut');
  const zoomReset  = document.getElementById('zoomReset');

  // قصة + TTS
  const storyBtn   = document.getElementById('storyBtn');
  const storyModal = document.getElementById('storyModal');
  const closeStory = document.getElementById('closeStory');
  const tabShort   = document.getElementById('tabShort');
  const tabFull    = document.getElementById('tabFull');
  const storyText  = document.getElementById('storyText');
  const ttsPlay    = document.getElementById('ttsPlay');
  const ttsStop    = document.getElementById('ttsStop');

  // ====== حالة عامة
  let n = parseInt(nRange.value, 10);         // عدد الدرجات
  let currentRow = 0;                          // آخر صف تمّ تشغيله
  let animDelay = 140;                         // تأخير بسيط بين الصفوف
  let zoom = 1;                                // مقياس العرض

  // حفظ/استرجاع بعض الإعدادات
  const savedN = parseInt(localStorage.getItem('gp_n') || nRange.value, 10);
  if (!isNaN(savedN)) { nRange.value = savedN; n = savedN; }

  // ====== بناء الشبكة
  function build() {
    grid.innerHTML = '';
    arena.classList.remove('complete');
    postExplain.classList.add('hidden');

    // تحديث نصوص الرأس
    nLabel.textContent = n;
    nSpanTop.textContent = n;
    nSpan2.textContent = n;
    dimsTop.textContent = `${n+1} × ${n}`;

    // نص الارشاد
    updateFormulas();

    // نبني n صفوف
    for (let r = 1; r <= n; r++) {
      const row = document.createElement('div');
      row.className = 'row';

      // مجموعة A (السلم الأصلي): r مكعبات
      const groupA = document.createElement('div');
      groupA.className = 'group a';
      for (let i = 0; i < r; i++) {
        const b = document.createElement('div');
        b.className = 'block a';
        groupA.appendChild(b);
      }

      // سهم/فاصل
      const spacer = document.createElement('div');
      spacer.className = 'spacer';
      const arrow = document.createElement('span');
      arrow.className = 'pairArrow';
      arrow.textContent = '↠';
      spacer.appendChild(arrow);

      // مجموعة B (المُكمل): (n+1 - r) مكعبات
      const groupB = document.createElement('div');
      groupB.className = 'group b';
      for (let i = 0; i < (n + 1 - r); i++) {
        const b = document.createElement('div');
        b.className = 'block b';
        groupB.appendChild(b);
      }

      // ترتيب العناصر: A | spacer | B (B ستبدأ منزاحة لليسار)
      row.appendChild(groupA);
      row.appendChild(spacer);
      row.appendChild(groupB);
      grid.appendChild(row);

      // حساب مقدار الانزياح المطلوب لـ B (عرض A + عرض الفاصل)
      const block = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--block'));
      const gap   = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap'));
      const spacerW = spacer.getBoundingClientRect().width || 24;
      const slide = (groupA.children.length * (block + gap)) + spacerW;
      groupB.style.setProperty('--slide', slide + 'px');

      // نخزن سهماً للعرض لاحقاً
      row._arrow = arrow;
      row._groupB = groupB;
    }

    currentRow = 0;
    updateFormulas();
  }

  // حسابات المعادلات
  function updateFormulas() {
    const rect = n * (n + 1);
    rectCells.textContent  = rect;
    rectCells2.textContent = rect;
    sumVal.textContent     = (rect / 2).toString();

    guideW.textContent = `الطول = ${n}`;
    guideH.textContent = `العرض = ${n+1}`;
  }

  // تشغيل كل الصفوف
  function playAll() {
    reset(false);
    let r = 0;
    const rows = Array.from(grid.children);

    const timer = setInterval(() => {
      if (r >= rows.length) {
        clearInterval(timer);
        onComplete();
        return;
      }
      revealRow(rows[r]);
      r++;
    }, animDelay);
  }

  // خطوة واحدة
  function stepOnce() {
    const rows = Array.from(grid.children);
    if (currentRow < rows.length) {
      revealRow(rows[currentRow]);
      currentRow++;
      if (currentRow === rows.length) onComplete();
    }
  }

  // إظهار صف: إزاحة B -> 0 وإظهار السهم
  function revealRow(row) {
    if (!row || row._groupB.classList.contains('in')) return;
    row._groupB.classList.add('in');
    requestAnimationFrame(() => { row._arrow.classList.add('show'); });
  }

  // عند اكتمال جميع الصفوف
  function onComplete() {
    arena.classList.add('complete');
    guides.style.opacity = 1;
    postExplain.classList.remove('hidden');

    // إخفاء تلقائي بعد 10 ثوانٍ (يمكن إعادة فتحها يدويًا)
    setTimeout(() => {
      if (!postExplain.classList.contains('hidden')) {
        postExplain.classList.add('hidden');
      }
    }, 10000);
  }

  // إعادة ضبط
  function reset(rebuild = true) {
    arena.classList.remove('complete');
    guides.style.opacity = 0;
    postExplain.classList.add('hidden');
    Array.from(grid.children).forEach(row => {
      row._groupB?.classList.remove('in');
      row._arrow?.classList.remove('show');
    });
    currentRow = 0;
    if (rebuild) build();
  }

  // تغيّر n
  nRange.addEventListener('input', () => {
    n = parseInt(nRange.value, 10);
    nLabel.textContent = n;
    nSpanTop.textContent = n;
    localStorage.setItem('gp_n', String(n));
    build();
  });

  // أزرار التشغيل
  playBtn.addEventListener('click', playAll);
  stepBtn.addEventListener('click', () => { stepOnce(); });
  resetBtn.addEventListener('click', () => reset(true));
  hideExplain.addEventListener('click', () => postExplain.classList.add('hidden'));

  // ====== تكبير/تصغير
  function applyZoom() {
    stage.style.transform = `scale(${zoom})`;
    zoomReset.textContent = `${Math.round(zoom * 100)}%`;
  }
  zoomIn.addEventListener('click', () => { zoom = Math.min(1.6, +(zoom + 0.1).toFixed(2)); applyZoom(); });
  zoomOut.addEventListener('click', () => { zoom = Math.max(0.6, +(zoom - 0.1).toFixed(2)); applyZoom(); });
  zoomReset.addEventListener('click', () => { zoom = 1; applyZoom(); });

  // ====== منظور: مسطّح/إيزومتري + عمق (محفوظ)
  const savedIso    = localStorage.getItem('gp_iso') === '1';
  const savedDepth  = parseInt(localStorage.getItem('gp_iso_depth') || depthRange.value, 10);

  function applyIsoUI(isIso){
    isoToggle.setAttribute('aria-pressed', isIso ? 'true' : 'false');
    isoToggle.textContent = isIso ? 'منظور: إيزومتري' : 'منظور: مسطّح';
    depthCtrl.style.display = isIso ? 'inline-flex' : 'none';
  }
  function setIso(isIso){
    arena.classList.toggle('iso', isIso);
    applyIsoUI(isIso);
    localStorage.setItem('gp_iso', isIso ? '1' : '0');
  }
  function setDepth(px){
    const v = Math.max(4, Math.min(20, parseInt(px, 10) || 10));
    arena.style.setProperty('--depth', v + 'px');
    depthValue.textContent = v + 'px';
    depthRange.value = v;
    localStorage.setItem('gp_iso_depth', String(v));
  }
  isoToggle.addEventListener('click', () => {
    const newState = !arena.classList.contains('iso');
    setIso(newState);
    if (newState) setDepth(depthRange.value);
  });
  depthRange.addEventListener('input', () => setDepth(depthRange.value));

  setIso(savedIso);
  setDepth(savedDepth);

  // ====== القصة + TTS
  const storyShort = `
  <p><b>من هو غاوس؟</b> طفل ذكي صار لاحقًا عالِم رياضيات كبير.</p>
  <p><b>ماذا حصل؟</b> طلب المعلّم من التلاميذ جمع الأعداد من <span dir="ltr">1 إلى 100</span>.</p>
  <p>فكّر غاوس: لو جمعنا الأول مع الأخير نحصل دائمًا على <span dir="ltr">101</span>: <span dir="ltr">1+100</span>، ثم <span dir="ltr">2+99</span>…</p>
  <p>لدينا <b>50 زوجًا</b> إذن: <span dir="ltr">50 × 101 = 5050</span>. للتعميم لأي <span dir="ltr">n</span> يكون: <span dir="ltr">S = n(n+1)/2</span>.</p>
  `;

  const storyFull = `
  <p>في <b>براونشفايغ</b> بألمانيا، أواخر القرن الثامن عشر، جلس الأطفال إلى مقاعدهم الخشبية. كتب المعلّم <b>بوخنر</b> على اللوح مهمة تبدو مملّة: 
     <span dir="ltr">S = 1 + 2 + 3 + … + 99 + 100</span> — أراد منهم أن ينشغلوا طويلاً.</p>
  <p>انحنى معظم التلاميذ على أوراقهم؛ أمّا <b>غاوس</b> فتأمّل. رأى في سطر الأعداد نمطًا: لو جمع الأول مع الأخير نحصل دائمًا على <span dir="ltr">101</span>؛ ثم الثاني مع ما قبل الأخير… الأزواج كلّها <span dir="ltr">101</span>!</p>
  <p>تحرّك غاوس بخطوات واثقة إلى مكتب المعلّم، ووضع لوحه الحجري: <b>5050</b>. قال: «انتهيت!». أجاب الصبي بهدوء الواثق: 
     «لدينا <span dir="ltr">50</span> زوجًا، وكل زوج <span dir="ltr">101</span>، إذن <span dir="ltr">50×101</span>». وكأنه يكشف سرًّا — وبصورة عامّة: 
     <span dir="ltr">مجموع n هو n(n+1)/2</span>.</p>
  <p>أدرك المعلّم أن أمامه عقلًا صغيرًا يُفكِّر بطريقة مختلفة، فصار يقدّم له مسائل أعمق تناسب مستواه، مراعيًا <b>الفروق الفردية</b> بين التلاميذ.</p>
  `;

  function setStory(mode = 'full'){
    storyText.innerHTML = (mode === 'short') ? storyShort : storyFull;
    tabShort.classList.toggle('active', mode === 'short');
    tabFull.classList.toggle('active',  mode === 'full');
    tabShort.setAttribute('aria-selected', mode === 'short' ? 'true' : 'false');
    tabFull.setAttribute ('aria-selected', mode === 'full'  ? 'true' : 'false');
    localStorage.setItem('gp_story_mode', mode);
    stopTTS();
  }

  function openStory(){
    storyModal.classList.add('show');
    storyModal.setAttribute('aria-hidden','false');
  }
  function closeStoryModal(){
    storyModal.classList.remove('show');
    storyModal.setAttribute('aria-hidden','true');
    stopTTS();
  }

  storyBtn.addEventListener('click', openStory);
  closeStory.addEventListener('click', closeStoryModal);
  tabShort.addEventListener('click', () => setStory('short'));
  tabFull .addEventListener('click', () => setStory('full'));

  // استرجاع وضع القصة
  const savedMode = localStorage.getItem('gp_story_mode') || 'full';
  setStory(savedMode);

  // ====== TTS (Web Speech API)
  const voiceRadios = Array.from(document.querySelectorAll('input[name="voice"]'));
  function getVoicePrefs(){
    const v = (voiceRadios.find(r => r.checked) || {value:'kid'}).value;
    return (v === 'kid') ? { rate: 1.05, pitch: 1.25 } : { rate: 1.0, pitch: 1.0 };
  }

  function speak(text){
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g,' '));
    const {rate,pitch} = getVoicePrefs();
    u.lang = 'ar';
    u.rate = rate; u.pitch = pitch;
    stopTTS();
    window.speechSynthesis.speak(u);
  }
  function stopTTS(){
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  ttsPlay.addEventListener('click', () => speak(storyText.innerText));
  ttsStop.addEventListener('click', stopTTS);

  // ====== تهيئة أولية
  applyZoom();
  build();
  setIso(savedIso);
  setDepth(savedDepth);

})();
