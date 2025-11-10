// assets/lesson.js
(() => {
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  // فتح/إغلاق كل البطاقات
  const expandAllBtn = $('#expandAll');
  if (expandAllBtn) expandAllBtn.addEventListener('click', () => { $$('details.card').forEach(d => d.open = true); });
  const collapseAllBtn = $('#collapseAll');
  if (collapseAllBtn) collapseAllBtn.addEventListener('click', () => { $$('details.card').forEach(d => d.open = false); });

  // أعلى الصفحة
  const toTop = $('#toTop');
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // حجم الخط (A+ / 100% / A-)
  let fs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs')) || 16;
  const setFS = v => document.documentElement.style.setProperty('--fs', Math.max(12, Math.min(22, v)) + 'px');
  const fsPlus = $('#fsPlus'), fsMinus = $('#fsMinus'), fsReset = $('#fsReset');
  if (fsPlus)  fsPlus.addEventListener('click', () => setFS(++fs));
  if (fsMinus) fsMinus.addEventListener('click', () => setFS(--fs));
  if (fsReset) fsReset.addEventListener('click', () => { fs = 16; setFS(fs); });

  // أسئلة المعلّم: إظهار/إخفاء
  function bindToggleAnswers(scope=document){
    $$('.toggle-answer', scope).forEach(btn => {
      btn.addEventListener('click', () => {
        const ans = btn.nextElementSibling;
        if (!ans) return;
        ans.classList.toggle('show');
        btn.textContent = ans.classList.contains('show') ? 'إخفاء الإجابة' : 'إظهار الإجابة';
      });
    });
  }
  bindToggleAnswers();
  const revealAll = $('#revealAll'), hideAll = $('#hideAll');
  if (revealAll) revealAll.addEventListener('click', () => { $$('.answer').forEach(a => a.classList.add('show')); $$('.toggle-answer').forEach(b => b.textContent = 'إخفاء الإجابة'); });
  if (hideAll)   hideAll.addEventListener('click',   () => { $$('.answer').forEach(a => a.classList.remove('show')); $$('.toggle-answer').forEach(b => b.textContent = 'إظهار الإجابة'); });

  // لعبة المطابقة الثلاثية (قوائم منسدلة)
  const triplets = [
    {dims:'1×5', P:'12م', A:'5م²'},
    {dims:'2×3', P:'10م', A:'6م²'},
    {dims:'3×3', P:'12م', A:'9م²'},
    {dims:'1×3', P:'8م',  A:'3م²'},
    {dims:'2×4', P:'12م', A:'8م²'},
    {dims:'2×5', P:'14م', A:'10م²'},
  ];
  const triRoot = $('#triMatch');
  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  function renderTri(){
    if (!triRoot) return;
    triRoot.innerHTML = '';
    const Popts = shuffle([...new Set(triplets.map(t => t.P))]);
    const Aopts = shuffle([...new Set(triplets.map(t => t.A))]);
    shuffle(triplets).slice(0,4).forEach(t => {
      const card = document.createElement('div');
      card.className = 'tri-card';
      card.innerHTML = `
        <h4>الأبعاد: <strong>${t.dims}</strong></h4>
        <label>اختر المحيط المناسب:</label>
        <select data-role="P"><option value="">— اختر —</option>${Popts.map(p=>`<option>${p}</option>`).join('')}</select>
        <label>اختر المساحة المناسبة:</label>
        <select data-role="A"><option value="">— اختر —</option>${Aopts.map(a=>`<option>${a}</option>`).join('')}</select>
        <input type="hidden" data-ansP value="${t.P}">
        <input type="hidden" data-ansA value="${t.A}">
      `;
      triRoot.appendChild(card);
    });
  }
  renderTri();
  const checkTri = $('#checkTri'), shuffleTri = $('#shuffleTri'), triScore = $('#triScore');
  if (checkTri) checkTri.addEventListener('click', () => {
    let correct=0,total=0;
    $$('.tri-card', triRoot).forEach(card => {
      total += 2;
      card.style.outline = 'none';
      const P = card.querySelector('[data-role="P"]').value;
      const A = card.querySelector('[data-role="A"]').value;
      const pAns = card.querySelector('[data-ansP]').value;
      const aAns = card.querySelector('[data-ansA]').value;
      const okP = P===pAns, okA = A===aAns;
      if (okP && okA){ card.style.outline='2px solid var(--ok)'; correct+=2; }
      else if (okP || okA){ card.style.outline='2px dashed var(--warn)'; correct+=1; }
      else { card.style.outline='2px solid var(--err)'; }
    });
    if (triScore) triScore.textContent = `النتيجة: ${correct}/${total}`;
  });
  if (shuffleTri) shuffleTri.addEventListener('click', () => { renderTri(); if (triScore) triScore.textContent=''; });

  // امتحان محوسب
  function norm(v){ return (v||'').toString().trim().replace(/\s+/g,'').replace('،',','); }
  const gradeQuiz = $('#gradeQuiz'), resetQuiz = $('#resetQuiz');
  if (gradeQuiz) gradeQuiz.addEventListener('click', () => {
    const qs = $$('#quizForm .q'); let score=0,total=qs.length;
    qs.forEach(q => {
      q.classList.remove('correct','incorrect');
      const fb = q.querySelector('.feedback'); if (fb) fb.textContent='';
      const type = q.dataset.type;
      if (type==='mc'){
        const correct = q.dataset.correct;
        const val = (q.querySelector('input[type="radio"]:checked')||{}).value || '';
        if (val===correct){ score++; q.classList.add('correct'); if (fb) { fb.textContent='صحيح'; fb.style.color='var(--ok)'; } }
        else { q.classList.add('incorrect'); if (fb) { fb.textContent='تحقّق من التعريف/الوحدة.'; fb.style.color='var(--err)'; } }
      }
      if (type==='input'){
        const ans = norm(q.dataset.correct);
        const val = norm(q.querySelector('input').value);
        if (ans.includes(',')){
          const [a1,a2] = ans.split(','), [v1,v2] = val.split(',');
          if (v1===a1 && v2===a2){ score++; q.classList.add('correct'); if (fb){ fb.textContent='صحيح'; fb.style.color='var(--ok)'; } }
          else { q.classList.add('incorrect'); if (fb){ fb.textContent='المحيط أولًا ثم المساحة بالوحدة الصحيحة.'; fb.style.color='var(--err)'; } }
        } else {
          if (val===ans){ score++; q.classList.add('correct'); if (fb){ fb.textContent='صحيح'; fb.style.color='var(--ok)'; } }
          else { q.classList.add('incorrect'); if (fb){ fb.textContent='انتبه للوحدة والقيمة.'; fb.style.color='var(--err)'; } }
        }
      }
      if (type==='match'){
        const map = JSON.parse(q.dataset.match); let local=0, need=Object.keys(map).length;
        $$('.bucket', q).forEach(b => {
          const label = b.dataset.label; const tiles = $$('.tile', b).map(t => t.textContent.trim());
          tiles.forEach(t => { if (map[t]===label) local++; });
        });
        if (local===need){ score++; q.classList.add('correct'); if (fb){ fb.textContent = 'كل الأزواج صحيحة.'; fb.style.color='var(--ok)'; } }
        else { q.classList.add('incorrect'); if (fb){ fb.textContent = `${local}/${need} مطابقات صحيحة — راجع الصيغ.`; fb.style.color='var(--warn)'; } }
      }
    });
    const quizScore = $('#quizScore'); if (quizScore) quizScore.textContent = `الدرجة: ${score}/${total}`;
  });
  if (resetQuiz) resetQuiz.addEventListener('click', () => {
    const form = $('#quizForm'); if (!form) return;
    form.reset();
    $$('.q', form).forEach(q => { q.classList.remove('correct','incorrect'); const fb=q.querySelector('.feedback'); if (fb) fb.textContent=''; });
    const quizScore = $('#quizScore'); if (quizScore) quizScore.textContent = '';
  });

  // سحب وإفلات للمطابقة الثنائية
  let dragEl = null;
  $$('.tile').forEach(t => t.addEventListener('dragstart', e => { dragEl = t; e.dataTransfer.setData('text/plain', t.textContent); }));
  $$('.bucket').forEach(b => {
    b.addEventListener('dragover', e => e.preventDefault());
    b.addEventListener('drop', e => { e.preventDefault(); if (dragEl) { b.appendChild(dragEl); dragEl = null; } });
  });

  // التطبيق المصغّر (W×L)
  const ap = $('#apScope');
  if (ap){
    let W=8, L=6, zoom=1;
    const grid = $('#grid', ap);
    const metrics = $('#metrics', ap);
    const tH = $('#tH', ap), tV = $('#tV', ap);
    const stage = $('#stage', ap);

    function buildGrid(){
      grid.innerHTML = '';
      grid.style.gridTemplateColumns = `repeat(${W}, var(--cell))`;
      grid.style.gridTemplateRows    = `repeat(${L}, var(--cell))`;
      for (let r=0;r<L;r++){
        for (let c=0;c<W;c++){
          const d = document.createElement('div');
          d.className = 'cell';
          d.dataset.r = r; d.dataset.c = c;
          grid.appendChild(d);
        }
      }
      updateGuides(); updateMetrics();
    }
    function updateGuides(){
      if (tH) tH.textContent = `العرض = W = ${W}`;
      if (tV) tV.textContent = `الطول = L = ${L}`;
    }
    function updateMetrics(){
      const P = 2*(L+W), A=L*W;
      metrics.innerHTML = `
        <div class="row"><span class="tag">المحيط</span>
        <div>P = 2(L + W) = 2(${L} + ${W}) = <b>${P}</b> وحدة</div></div>
        <div class="row"><span class="tag">المساحة</span>
        <div>A = L × W = ${L} × ${W} = <b>${A}</b> وحدة²</div></div>`;
    }
    function colorArea(){ $$('.cell',grid).forEach(c => { c.classList.add('on-area'); c.classList.remove('on-per'); }); }
    function colorPerimeter(){
      $$('.cell',grid).forEach(c => {
        const r=+c.dataset.r, col=+c.dataset.c;
        const edge = (r===0 || r===L-1 || col===0 || col===W-1);
        c.classList.toggle('on-per', edge);
        if (edge) c.classList.remove('on-area');
      });
    }
    function clearColors(){ $$('.cell',grid).forEach(c => c.classList.remove('on-area','on-per')); }

    $('#widRange', ap).addEventListener('input', e => { W = +e.target.value; buildGrid(); });
    $('#lenRange', ap).addEventListener('input', e => { L = +e.target.value; buildGrid(); });
    $('#addRow', ap).addEventListener('click', () => { L = Math.min(20, L+1); $('#lenRange', ap).value = L; buildGrid(); });
    $('#addCol', ap).addEventListener('click', () => { W = Math.min(20, W+1); $('#widRange', ap).value = W; buildGrid(); });
    $('#resetBtn', ap).addEventListener('click', () => { W=8; L=6; $('#widRange', ap).value=W; $('#lenRange', ap).value=L; zoom=1; stage.style.transform=`scale(${zoom})`; buildGrid(); });
    $('#btnArea', ap).addEventListener('click', () => { clearColors(); colorArea(); });
    $('#btnPerimeter', ap).addEventListener('click', () => { clearColors(); colorPerimeter(); });
    $('#zoomIn', ap).addEventListener('click', () => { zoom = Math.min(2, zoom+0.1); stage.style.transform=`scale(${zoom})`; });
    $('#zoomOut', ap).addEventListener('click', () => { zoom = Math.max(0.5, zoom-0.1); stage.style.transform=`scale(${zoom})`; });
    $('#zoomReset', ap).addEventListener('click', () => { zoom = 1; stage.style.transform=`scale(${zoom})`; });

    buildGrid();
  }
})();
