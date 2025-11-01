/* حيلة غاوس – حركة أفقية فقط + قصة مبسطة/كاملة + صوت طفل/معلّم (MP3 أو TTS) */
(() => {
  "use strict";

  const $  = (id)=>document.getElementById(id);
  const txt = (id, v)=>{ const el=$(id); if(el) el.textContent=v; };

  // عناصر التحكم الرئيسة
  const nInput=$('n'), grid=$('grid'), arena=$('arena');
  const playBtn=$('play'), stepBtn=$('step'), resetBtn=$('reset'), speedSel=$('speed');
  const postExplain=$('postExplain'), dismissBtn=$('dismiss');

  // دلائل الأبعاد
  const guides=$('guides'), hLine=$('hLine'), vLine=$('vLine'), hText=$('hText'), vText=$('vText');

  // تكبير/تصغير
  const DEFAULT_FS=18; let zoomPx=DEFAULT_FS;
  const zi=$('zoomIn'), zo=$('zoomOut'), zr=$('zoomReset'), zv=$('zoomVal');
  const updZoom=()=>{ if(zv) zv.textContent=Math.round((zoomPx/DEFAULT_FS)*100)+'%'; };
  const setFs=(px)=>{ px=Math.max(14,Math.min(26,px)); document.documentElement.style.fontSize=px+'px'; zoomPx=px; updZoom(); if(arena.classList.contains('complete')) updateGuides(); };

  let currentN=parseInt(nInput?.value||'20',10);
  let stepIndex=0, explainTimer=null;

  /* =====================  القصة  ===================== */

  // نص قصير (للصف الخامس)
  const STORY_SHORT_HTML = `
    <p><b>من هو غاوس؟</b> طفل ذكي صار لاحقًا عالِم رياضيات كبير.</p>
    <p><b>ماذا حصل؟</b> طلب المعلّم من التلاميذ جمع الأعداد من <b>1</b> إلى <b>100</b>.</p>
    <p>فكّر غاوس: لو جمعنا العدد الأول مع الأخير نحصل دائمًا على <b>101</b>:
       <span dir="ltr">1+100</span>، ثم <span dir="ltr">2+99</span>…</p>
    <p>لدينا <b>50</b> زوجًا، إذن المجموع <b>50 × 101 = 5050</b>.</p>
    <p>وبالتعميم لأي <span dir="ltr">n</span> يكون:
      <span class="eq" dir="ltr">S = n(n+1)/2</span>.
    </p>
  `;

  // نص كامل — روائي مع تركيز على “التفكير المختلف” والتفريد
const STORY_FULL_HTML = `
  <p>في <b>براونشفايغ</b> بألمانيا، أواخر القرن الثامن عشر، جلس الأطفال إلى مقاعدهم الخشبية.
     كتب المعلّم <b>بوخنر</b> على اللوح مهمةً تبدو مملة:
     <span class="eq" dir="ltr">S = 1 + 2 + 3 + … + 99 + 100</span>.
     أراد منهم أن ينشغلوا طويلًا.</p>

  <p>انحنى معظم التلاميذ على ألواحهم: 1+2=3… 3+3=6… أمّا <b>غاوس</b> فتوقّف.
     لم يُمسك بالقلم فورًا، بل <b>تأمّل</b>. رأى في سطر الأعداد <b>نمطًا</b>:
     لو جمع الأول مع الأخير نحصل على <b>101</b>، ثم الثاني مع ما قبل الأخير… <b>الأزواج كلّها 101</b>!</p>

  <p>تحرّك غاوس بخطواتٍ واثقة إلى مكتب المعلّم، ووضع لوحه الحجري: <b>5050</b>.
     رفع بوخنر حاجبيه: «انتهيت؟» أجاب الصبي بهدوء الواثق:
     «نعم؛ لدينا <b>50 زوجًا</b>، وكل زوج <b>101</b>؛ إذن <b>50×101</b>».
     ثم أضاف — وكأنه يكشف سرًّا — «وبصورةٍ عامة، مجموع 1 إلى n يساوي:
     <span class="eq" dir="ltr">S = n(n+1)/2</span>».</p>

  <p>أدرك المعلّم أن أمامه <b>عقلاً صغيرًا يفكّر بطريقة مختلفة</b>.
     لم يعد التحدّي أن يجعله يكرّر ما يفعله الآخرون، بل أن <b>يوجّه ذكاءه</b>.
     ومنذ ذلك اليوم صار يعطيه <b>مسائل غير تقليدية</b>:
     تنظيم الأعداد إلى أشكال، عدّها كمستطيلات ومثلثات، تخمين القاعدة ثم برهنتها…
     وفي الوقت نفسه كان يهيّئ لبقية الصف <b>طُرقًا متدرجة</b>،
     ويطلب من غاوس أن <b>يشرح فكرته لزملائه</b> بلطف.</p>

  <p>تحوّل الصف إلى ورشة أفكار: <b>من يرى النمط؟ من يجرّب طريقة أخرى؟</b>
     تعلّم التلاميذ أن الحل ليس سطرًا طويلًا من الجمع، بل <b>نظرةٌ ذكية</b> تغيّر كل شيء.
     هكذا نشأت «حيلة غاوس» التي نراها في هذا التطبيق عندما نكمّل السُّلَّم ليصبح
     <b>مستطيلاً</b> بعدده <span dir="ltr">2S = n(n+1)</span>، ثم نأخذ <b>نصفه</b>:
     <span class="eq" dir="ltr">S = n(n+1)/2</span>.</p>

  <p>القصة ليست عن عبقري واحد فقط؛ إنها أيضًا عن <b>معلّم</b> أدرك
     <b>الفروق الفردية</b>، فصار يوزّع التحديات <b>بحسب حاجة كل طالب</b>،
     ويُنمي <b>جرأة التفكير</b> لا مجرد تقليد الخطوات.</p>
`;

  // عناصر القصة
  const storyBtn    = $('storyBtn');
  const storyModal  = $('storyModal');
  const storyBody   = $('storyBody');
  const storyPlay   = $('storyPlay');
  const storyStop   = $('storyStop');
  const storyClose  = $('storyClose');
  const tabShort    = $('tabShort');
  const tabFull     = $('tabFull');

  // ملفات MP3 الاختيارية (لو موجودة)
  const audioChild   = $('storyAudioChild');   // مسار: ../../assets/audio/ar/gauss-story-child.mp3
  const audioTeacher = $('storyAudioTeacher'); // مسار: ../../assets/audio/ar/gauss-story-teacher.mp3

  // اختيار النبرة
  const vChild   = $('vChild');
  const vTeacher = $('vTeacher');

  // حالة القصة
  let storyTab = 'short'; // 'short' | 'full'
  const setStoryTab = (t)=>{
    storyTab = (t==='full') ? 'full' : 'short';
    tabShort.classList.toggle('active', storyTab==='short');
    tabFull.classList.toggle('active',  storyTab==='full');
    tabShort.setAttribute('aria-selected', storyTab==='short' ? 'true':'false');
    tabFull .setAttribute('aria-selected', storyTab==='full'  ? 'true':'false');
    storyBody.innerHTML = (storyTab==='short') ? STORY_SHORT_HTML : STORY_FULL_HTML;
  };

  function openStory(){
    storyBody.innerHTML = (storyTab==='short') ? STORY_SHORT_HTML : STORY_FULL_HTML;
    storyModal.classList.add('show');
    storyModal.focus();
  }
  function closeStory(){
    stopStoryAudio();
    storyModal.classList.remove('show');
  }

  // انتقاء مصدر الصوت: MP3 (لو وُجد) أو TTS
  function chooseAudioSource(){
    const voice = vTeacher?.checked ? 'teacher' : 'child';
    // لو ملف MP3 موجود للنبرة المختارة، نرجّحه
    if (voice==='child'   && audioChild   && audioChild.getAttribute('src'))   return { type:'mp3', el:audioChild };
    if (voice==='teacher' && audioTeacher && audioTeacher.getAttribute('src')) return { type:'mp3', el:audioTeacher };
    // وإلا نستخدم TTS مع طبقة صوت مناسبة
    const pitch = (voice==='child') ? 1.25 : 0.95;
    return { type:'tts', pitch };
  }

  function speakStoryTTS(pitch=1.0){
    if (!('speechSynthesis' in window)) {
      alert('المتصفح لا يدعم تحويل النص إلى كلام. يمكنك إضافة ملف MP3 بدلًا من ذلك.');
      return;
    }
    const text = storyBody.textContent.replace(/\s+/g,' ').trim();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = 'ar-SA';
    utter.rate  = 1.0;
    utter.pitch = pitch;

    // محاولة اختيار صوت عربي إن وُجد
    const voices = window.speechSynthesis.getVoices();
    const ar = voices.find(v => /ar/i.test(v.lang) || /Arabic|العربية/i.test(v.name));
    if (ar) utter.voice = ar;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function playStory(){
    const src = chooseAudioSource();
    if (src.type==='mp3'){
      src.el.currentTime = 0;
      src.el.play();
    } else {
      speakStoryTTS(src.pitch);
    }
  }
  function stopStoryAudio(){
    if (audioChild){   audioChild.pause();   audioChild.currentTime=0; }
    if (audioTeacher){ audioTeacher.pause(); audioTeacher.currentTime=0; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  /* =====================  البناء والأنيميشن  ===================== */

  function readBlockGap(){
    const cs=getComputedStyle(document.documentElement);
    return { block: parseFloat(cs.getPropertyValue('--block'))||28,
             gap:   parseFloat(cs.getPropertyValue('--gap'))  || 6 };
  }

  function build(n){
    grid.innerHTML=''; arena.classList.remove('complete'); postExplain?.classList.remove('hidden');
    if(explainTimer){ clearTimeout(explainTimer); explainTimer=null; }
    stepIndex=0;

    const {block,gap}=readBlockGap();
    const slideBase = (n+2) * (block+gap);  // انزياح أفقي ابتدائي

    for(let r=1;r<=n;r++){
      const row=document.createElement('div'); row.className='row';

      const label=document.createElement('div'); label.className='label'; label.textContent=r; row.appendChild(label);

      // السلم الأصلي A
      const groupA=document.createElement('div'); groupA.className='group a';
      for(let i=0;i<r;i++){ const b=document.createElement('div'); b.className='block a'; groupA.appendChild(b); }
      row.appendChild(groupA);

      // سهم أفقي
      const spacer=document.createElement('div'); spacer.className='spacer';
      const arrow=document.createElement('div'); arrow.className='pairArrow'; arrow.textContent='→';
      spacer.appendChild(arrow); row.appendChild(spacer);

      // المكمل B
      const groupB=document.createElement('div'); groupB.className='group b'; groupB.dataset.size=(n+1-r);
      groupB.style.setProperty('--slide', slideBase + 'px');
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

    const approx=(block+gap)*(n+1)+140;
    grid.style.minWidth=Math.max(approx,420)+'px';
  }

  function revealRowB(i){
    const rows=[...grid.querySelectorAll('.row')];
    if(i>=rows.length) return false;
    const b=rows[i].querySelector('.group.b'); if(!b) return false;
    const duration=parseInt(speedSel.value,10);
    b.getBoundingClientRect(); // reflow
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

  /* =====================  الأحداث  ===================== */

  // تفاعل القصة
  storyBtn?.addEventListener('click', openStory);
  storyClose?.addEventListener('click', closeStory);
  storyModal?.addEventListener('click', (e)=>{ if(e.target===storyModal) closeStory(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && storyModal?.classList.contains('show')) closeStory(); });

  tabShort?.addEventListener('click', ()=> setStoryTab('short'));
  tabFull ?.addEventListener('click', ()=> setStoryTab('full'));
  storyPlay?.addEventListener('click', playStory);
  storyStop?.addEventListener('click', stopStoryAudio);

  // تفاعل اللوحة
  nInput.addEventListener('input',e=>{ currentN=parseInt(e.target.value,10); build(currentN); });
  playBtn.addEventListener('click', play);
  stepBtn.addEventListener('click', ()=>{ const ok=revealRowB(stepIndex); if(ok){ stepIndex++; if(stepIndex===currentN) markComplete(); }});
  resetBtn.addEventListener('click', reset);

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

  // تشغيل أولي
  setStoryTab('short');  // يبدأ بالنسخة المبسّطة
  build(currentN);

  // لبعض المتصفحات يجب استدعاء getVoices بعد onvoiceschanged لتحميل أصوات TTS
  if ('speechSynthesis' in window){
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
  }
})();
