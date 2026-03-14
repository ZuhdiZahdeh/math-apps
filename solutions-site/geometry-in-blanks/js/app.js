const $ = (id) => document.getElementById(id);

let DB = [];
let filtered = [];
let activeId = null;

/* =========================
   Theorems
   ========================= */
let THEOREMS = { items: [] };

const KNOWN_THEOREM_TITLES = {
  right_triangle_trigonometry: 'النِّسَب المثلثية في المثلث القائم',
  line_angle_with_plane_projection: 'زاوية مستقيم مع مستوى',
  pythagoras_theorem: 'نظرية فيثاغورس',
  pyramid_volume: 'حجم الهرم',
  cosine_rule: 'قانون جيب التمام',
  triangle_area_base_height: 'مساحة المثلث بالقاعدة والارتفاع',
  prism_volume: 'حجم المنشور',
  isosceles_triangle_median_properties: 'خواص المتوسط في المثلث المتساوي الساقين',
  triangle_area_ab_sinC: 'مساحة المثلث باستعمال ضلعين والزاوية المحصورة',
  distance_point_line: 'المسافة من نقطة إلى مستقيم',
  prism_lateral_area: 'الغلاف الجانبي للمنشور القائم',
  coordinate_geometry_distance: 'المسافة بين نقطتين في الإحداثيات',
  equilateral_triangle_area: 'مساحة المثلث المتساوي الأضلاع',
  dot_product_angle_between_vectors: 'الزاوية بين متجهين بالجداء النقطي',
  rectangular_prism_surface_area: 'مساحة سطح متوازي المستطيلات',
  right_triangle_midpoint_hypotenuse: 'منتصف الوتر في المثلث القائم',
  sine_rule: 'قانون الجيوب'
};

async function loadTheorems(){
  const tries = [
    './data/theorems.json',
    'data/theorems.json',
    '../geometry-in-blanks/data/theorems.json'
  ];

  for(const url of tries){
    try{
      const res = await fetch(url, { cache: 'no-store' });
      if(res.ok){
        const json = await res.json();
        if(Array.isArray(json)) return { items: json };
        if(Array.isArray(json?.items)) return json;
      }
    }catch(_){ /* ignore */ }
  }

  return { items: [] };
}

function getTheoremById(id){
  if(!THEOREMS?.items?.length) return null;
  return THEOREMS.items.find(x => x.id === id) || null;
}

function getTheoremLabel(id){
  return getTheoremById(id)?.title || KNOWN_THEOREM_TITLES[id] || id;
}

function collectTheoremIdsForItem(item){
  const ids = new Set((item?.theoremsUsed || []).filter(Boolean));

  for(const part of (item?.parts || [])){
    for(const method of (part?.methods || [])){
      for(const tid of (method?.theoremsUsed || method?.theorems || [])){
        if(tid) ids.add(tid);
      }
    }
  }

  return [...ids];
}

function parseQuestionId(raw){
  const m = String(raw || '').trim().match(/^p0*(\d+)-q0*(\d+)$/i);
  if(!m) return { page: null, q: null };
  return { page: Number(m[1]), q: Number(m[2]) };
}

function compareQuestionIds(a, b){
  const A = parseQuestionId(a);
  const B = parseQuestionId(b);
  if((A.page ?? 9999) !== (B.page ?? 9999)) return (A.page ?? 9999) - (B.page ?? 9999);
  return (A.q ?? 9999) - (B.q ?? 9999);
}

function ensureMissingTheoremRecords(){
  if(!THEOREMS || !Array.isArray(THEOREMS.items)) THEOREMS = { items: [] };

  const known = new Set(THEOREMS.items.map(item => item.id));
  const missing = new Set();

  for(const item of DB){
    for(const tid of collectTheoremIdsForItem(item)){
      if(!known.has(tid)) missing.add(tid);
    }
  }

  for(const tid of missing){
    THEOREMS.items.push({
      id: tid,
      title: KNOWN_THEOREM_TITLES[tid] || tid,
      short: 'لا توجد بطاقة موسّعة لهذه النظرية في ملف data/theorems.json بعد.',
      contentHtml: [
        `<div class="th-section"><p>المعرّف: <code>${escapeHtml(tid)}</code></p><p>يمكنك إضافة بطاقة تفصيلية لهذه النظرية داخل ملف <code>data/theorems.json</code>.</p></div>`
      ],
      usedIn: [],
      usedInCount: 0
    });
    known.add(tid);
  }
}

function enrichTheoremsUsage(){
  if(!THEOREMS?.items?.length) return;

  const usedMap = new Map(THEOREMS.items.map(th => [th.id, new Set(Array.isArray(th.usedIn) ? th.usedIn : [])]));

  for(const item of DB){
    const ids = collectTheoremIdsForItem(item);
    for(const tid of ids){
      if(!usedMap.has(tid)) usedMap.set(tid, new Set());
      usedMap.get(tid).add(item.id);
    }
  }

  for(const th of THEOREMS.items){
    const arr = [...(usedMap.get(th.id) || new Set())].sort(compareQuestionIds);
    th.usedIn = arr;
    th.usedInCount = arr.length;
  }
}

function ensureTheoremModal(){
  if(document.getElementById('thModal')) return;

  const modal = document.createElement('div');
  modal.id = 'thModal';
  modal.className = 'th-modal hidden';
  modal.innerHTML = `
    <div class="th-backdrop" data-close="1"></div>
    <div class="th-card" role="dialog" aria-modal="true" aria-label="نظرية">
      <div class="th-card-head">
        <div id="thTitle" class="th-card-title"></div>
        <button class="th-close" type="button" data-close="1">×</button>
      </div>
      <div id="thBody" class="th-card-body"></div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if(e.target?.dataset?.close) modal.classList.add('hidden');
  });

  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') modal.classList.add('hidden');
  });
}

function renderTheoremDiagram(th){
  const d = th?.diagram;
  if(!d) return '';

  const contentJoined = Array.isArray(th.contentHtml) ? th.contentHtml.join('') : String(th.contentHtml || '');
  if(contentJoined.includes('th-diagram')) return '';

  if(d.svg){
    return `<div class="th-diagram">${d.svg}</div>`;
  }

  if(d.image){
    const alt = d.alt || th.title || 'شكل توضيحي';
    return `
      <div class="th-diagram">
        <img src="${escapeHtml(d.image)}" alt="${escapeHtml(alt)}" loading="lazy" />
      </div>
    `;
  }

  return '';
}

function openTheorem(id){
  const th = getTheoremById(id);
  const modal = document.getElementById('thModal');
  const t = document.getElementById('thTitle');
  const b = document.getElementById('thBody');
  if(!modal || !t || !b) return;

  if(!th){
    t.textContent = getTheoremLabel(id);
    b.innerHTML = `<div class="th-section"><p>لم يتم العثور على بطاقة لهذه النظرية: <code>${escapeHtml(id)}</code></p></div>`;
    modal.classList.remove('hidden');
    return;
  }

  t.textContent = th.title || getTheoremLabel(id);

  const shortHtml = th.short
    ? `<div class="th-short">${escapeHtml(th.short)}</div>`
    : '';

  const contentHtml = Array.isArray(th.contentHtml)
    ? th.contentHtml.join('')
    : String(th.contentHtml || '');

  const diagramHtml = renderTheoremDiagram(th);

  const usedIn = Array.isArray(th.usedIn) ? th.usedIn : [];
  const usedInHtml = usedIn.length ? `
    <div class="th-section">
      <div class="th-title">أسئلة من هذه الصفحة استعملت النظرية</div>
      <ul class="th-used-in">
        ${usedIn.map(qid => {
          const q = (DB || []).find(x => x.id === qid);
          const page = getItemPage(q);
          const num = getItemQuestion(q);
          const label = q
            ? `ص${page} • س${num} — ${q.title}`
            : qid;
          return `<li><a href="#${escapeHtml(qid)}" data-close="1">${escapeHtml(label)}</a></li>`;
        }).join('')}
      </ul>
    </div>
  ` : '';

  b.innerHTML = `
    <div class="th-wrap">
      ${shortHtml}
      ${contentHtml}
      ${diagramHtml}
      ${usedInHtml}
    </div>
  `;

  modal.classList.remove('hidden');
}

/* =========================
   Font scaling (solutions only)
   ========================= */
const FONT_KEY = 'gb_font_scale';
const FONT_MIN = 0.8;
const FONT_MAX = 1.6;
const FONT_STEP = 0.05;

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function getSavedScale(){
  const raw = localStorage.getItem(FONT_KEY);
  const s = raw ? Number(raw) : 1;
  return clamp(Number.isFinite(s) ? s : 1, FONT_MIN, FONT_MAX);
}
function setFontScale(scale){
  const s = clamp(scale, FONT_MIN, FONT_MAX);
  document.documentElement.style.setProperty('--font-scale', String(s));
  localStorage.setItem(FONT_KEY, String(s));

  const pct = Math.round(s * 100);
  $('fontLabel') && ($('fontLabel').textContent = `${pct}%`);
  $('fontRange') && ($('fontRange').value = String(pct));
}
function bumpFont(delta){ setFontScale(getSavedScale() + delta); }

function initFontControls(){
  setFontScale(getSavedScale());

  $('fontPlus')?.addEventListener('click', () => bumpFont(FONT_STEP));
  $('fontMinus')?.addEventListener('click', () => bumpFont(-FONT_STEP));
  $('fontReset')?.addEventListener('click', () => setFontScale(1));

  $('fontRange')?.addEventListener('input', (e) => {
    const pct = Number(e.target.value || 100);
    setFontScale(pct / 100);
  });

  window.addEventListener('keydown', (e) => {
    if(!e.ctrlKey) return;
    if(e.key === '=' || e.key === '+'){ e.preventDefault(); bumpFont(FONT_STEP); }
    else if(e.key === '-'){ e.preventDefault(); bumpFont(-FONT_STEP); }
    else if(e.key === '0'){ e.preventDefault(); setFontScale(1); }
  });
}

/* ========================= */

function escapeHtml(str){
  return String(str)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeToPaddedId(raw){
  const id = String(raw || '').trim();
  const m = id.match(/^p0*(\d+)-q0*(\d+)$/i);
  if(!m) return id;
  const p = String(Number(m[1])).padStart(2, '0');
  const q = String(Number(m[2]));
  return `p${p}-q${q}`;
}

function getItemPage(item){
  if(item?.page !== undefined && item?.page !== null && item?.page !== '') return Number(item.page);
  return parseQuestionId(item?.id).page;
}

function getItemQuestion(item){
  if(item?.q !== undefined && item?.q !== null && item?.q !== ''){
    const n = Number(item.q);
    return Number.isFinite(n) ? String(n) : String(item.q);
  }
  const q = parseQuestionId(item?.id).q;
  return q != null ? String(q) : '';
}

function qToPad2(q){
  const n = Number(String(q ?? '').trim());
  if(Number.isFinite(n)) return String(n).padStart(2, '0');
  return null;
}

/* =========================
   Figure helpers
   ========================= */
function getFigureSrc(item){
  if(item?.figure?.src) return item.figure.src;

  const qp = qToPad2(getItemQuestion(item));
  if(!qp) return null;
  return `images/q${qp}.png`;
}

function getFigureAlt(item){
  if(item?.figure?.alt) return item.figure.alt;
  const qn = getItemQuestion(item);
  return `شكل السؤال ${qn || ''}`.trim();
}

/* =========================
   Modal (Zoom) for Figures
   ========================= */
function ensureFigureModal(){
  if(document.getElementById('figModal')) return;

  const modal = document.createElement('div');
  modal.id = 'figModal';
  modal.className = 'fig-modal';
  modal.innerHTML = `
    <div class="fig-modal-backdrop" data-close="1"></div>
    <div class="fig-modal-card" role="dialog" aria-modal="true" aria-label="تكبير شكل السؤال">
      <button class="fig-modal-close btn btn-secondary btn-small" type="button" data-close="1">إغلاق</button>
      <img id="figModalImg" alt="">
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if(e.target?.dataset?.close) modal.classList.remove('open');
  });

  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') modal.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('.fig-open, .figure-img');
    if(!opener) return;

    const src = opener.dataset.src;
    if(!src) return;

    const alt = opener.dataset.alt || 'شكل السؤال';
    const img = document.getElementById('figModalImg');
    img.src = src;
    img.alt = alt;

    modal.classList.add('open');
  });
}

/* ========================= */
function renderTheoremChips(ids){
  const thIds = [...new Set((ids || []).filter(Boolean))];
  if(!thIds.length) return '';

  return `
    <div class="theorems-used">
      <div><strong>النظريات/القوانين المستخدمة</strong></div>
      <div class="theorem-chips">
        ${thIds.map(tid => {
          const label = getTheoremLabel(tid);
          return `<button class="theorem-chip" type="button" data-th="${escapeHtml(tid)}">${escapeHtml(label)}</button>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderTOC(list){
  const toc = $('toc');
  if(!toc) return;
  toc.innerHTML = '';

  list.forEach(item => {
    const page = getItemPage(item);
    const q = getItemQuestion(item);

    const a = document.createElement('a');
    a.href = `#${item.id}`;
    a.dataset.id = item.id;
    a.innerHTML = `
      <strong>${escapeHtml(item.title)}</strong>
      <small>صفحة ${escapeHtml(page)} • سؤال ${escapeHtml(q)}</small>
    `;

    if(item.id === activeId) a.classList.add('active');
    toc.appendChild(a);
  });
}

function renderParts(parts){
  return (parts || []).map(part => {
    const methodsHtml = (part.methods || []).map(method => {
      const thIds = (method.theoremsUsed || method.theorems || []).filter(Boolean);
      const chips = renderTheoremChips(thIds);

      return `
        <div class="box">
          <h4>${escapeHtml(method.name || 'طريقة الحل')}</h4>
          ${(method.steps || []).map(step => `<div>• ${escapeHtml(step)}</div>`).join('')}
          ${method.result ? `<div style="margin-top:10px"><strong>النتيجة:</strong> <code>${escapeHtml(method.result)}</code></div>` : ''}
          ${chips}
        </div>
      `;
    }).join('');

    return `
      <h3>${escapeHtml(part.label || 'جزء من السؤال')}</h3>
      ${part.note ? `<div class="box">${escapeHtml(part.note)}</div>` : ''}
      ${methodsHtml}
    `;
  }).join('');
}

function renderStandaloneSolution(item){
  const chunks = [];

  if(item.solutionHtml){
    chunks.push(`<div class="solution-rich">${item.solutionHtml}</div>`);
  } else if(Array.isArray(item.solution) && item.solution.length){
    chunks.push(`
      <div class="box">
        <h3 style="margin-top:0">الحل</h3>
        ${item.solution.map(line => line
          ? `<div>${escapeHtml(line)}</div>`
          : `<div style="height:10px"></div>`
        ).join('')}
      </div>
    `);
  } else {
    chunks.push(`<div class="box">لا يوجد حل مفصل لهذا السؤال بعد.</div>`);
  }

  chunks.push(renderTheoremChips(item.theoremsUsed || []));

  return chunks.join('');
}

function renderItem(item){
  activeId = item?.id || null;

  $('itemTitle').textContent = item ? item.title : 'اختر سؤالًا من الفهرس';

  if(item){
    const page = getItemPage(item);
    const q = getItemQuestion(item);
    $('itemMeta').textContent = `صفحة ${page} — سؤال ${q}`;
  } else {
    $('itemMeta').textContent = '';
  }

  const body = $('itemBody');
  if(!body) return;

  if(!item){
    body.innerHTML = `<div class="box">اختر سؤالًا من القائمة اليسرى لعرض الحل.</div>`;
    renderTOC(filtered);
    return;
  }

  const figSrc = getFigureSrc(item);
  const figAlt = getFigureAlt(item);
  const figHtml = figSrc ? `
    <div class="box figure-box">
      <div class="figure-head">
        <strong>شكل السؤال</strong>
        <button class="btn btn-secondary btn-small fig-open" type="button"
          data-src="${escapeHtml(figSrc)}"
          data-alt="${escapeHtml(figAlt)}">تكبير</button>
      </div>
      <img class="figure-img"
        src="${escapeHtml(figSrc)}"
        alt="${escapeHtml(figAlt)}"
        loading="lazy"
        data-src="${escapeHtml(figSrc)}"
        data-alt="${escapeHtml(figAlt)}"
        onerror="this.closest('.figure-box')?.remove();">
    </div>
  ` : '';

  const givensHtml = (Array.isArray(item.givens) && item.givens.length)
    ? `
      <div class="box">
        <h3 style="margin-top:0">المعطيات</h3>
        ${(item.givens || []).map(g => `<div>• ${escapeHtml(g)}</div>`).join('')}
      </div>
    `
    : '';

  const questionTextHtml = item.questionText
    ? `<div class="box"><h3 style="margin-top:0">نص السؤال</h3><div>${escapeHtml(item.questionText)}</div></div>`
    : '';

  const solutionHtml = (item.parts && item.parts.length)
    ? renderParts(item.parts)
    : renderStandaloneSolution(item);

  body.innerHTML = figHtml + questionTextHtml + givensHtml + solutionHtml + `<div class="page-break"></div>`;

  renderTOC(filtered);
  [...document.querySelectorAll('.toc a')].forEach(x => {
    x.classList.toggle('active', x.dataset.id === activeId);
  });

  try {
    const page = getItemPage(item);
    const q = getItemQuestion(item);
    document.title = `حلول الفراغ | ص${page}-س${q}`;
  } catch {}
}

function applyFilters(){
  const q = $('search')?.value?.trim().toLowerCase() || '';
  const from = parseInt($('pageFrom')?.value || '0', 10);
  const to = parseInt($('pageTo')?.value || '0', 10);

  filtered = DB.filter(item => {
    const page = getItemPage(item);
    const num = getItemQuestion(item);
    const theoremBlob = collectTheoremIdsForItem(item).map(id => getTheoremLabel(id)).join(' ');
    const blob = `${item.title || ''} ${item.questionText || ''} ${(item.givens || []).join(' ')} ${page} ${num} ${theoremBlob}`.toLowerCase();

    const matchText = !q || blob.includes(q);
    const matchFrom = from ? page >= from : true;
    const matchTo = to ? page <= to : true;
    return matchText && matchFrom && matchTo;
  });

  renderTOC(filtered);

  const selected = filtered.find(x => x.id === activeId) || filtered[0] || null;
  if(selected) location.hash = `#${selected.id}`;
  else renderItem(null);
}

async function loadJsonSmart(){
  const tries = ['data/solutions.json', 'assets/data/solutions.json'];
  for(const url of tries){
    try{
      const res = await fetch(url, { cache: 'no-store' });
      if(res.ok) return await res.json();
    }catch(_){ /* ignore */ }
  }
  throw new Error('solutions.json not found in data/ or assets/data/');
}

async function init(){
  DB = await loadJsonSmart();
  filtered = DB.slice();

  $('btnApply')?.addEventListener('click', applyFilters);
  $('search')?.addEventListener('input', applyFilters);
  $('btnPrint')?.addEventListener('click', () => window.print());

  initFontControls();
  ensureFigureModal();

  THEOREMS = await loadTheorems();
  ensureMissingTheoremRecords();
  enrichTheoremsUsage();
  ensureTheoremModal();

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.theorem-chip');
    if(!btn) return;
    const id = btn.dataset.th;
    if(id) openTheorem(id);
  });

  renderTOC(filtered);

  window.addEventListener('hashchange', () => {
    const raw = location.hash.replace('#', '').trim();
    const padded = normalizeToPaddedId(raw);

    if(raw && padded && raw !== padded){
      location.hash = `#${padded}`;
      return;
    }

    const id = padded || raw;
    const item = filtered.find(x => x.id === id) || DB.find(x => x.id === id) || null;
    renderItem(item);
  });

  const raw = location.hash.replace('#', '').trim();
  const padded = normalizeToPaddedId(raw);
  const first = (padded && DB.find(x => x.id === padded)) || DB.find(x => x.id === raw) || DB[0];

  const wantHash = `#${first.id}`;
  if(location.hash !== wantHash){
    location.hash = wantHash;
  } else {
    renderItem(first);
  }
}

init().catch(err => {
  console.error(err);
  const body = $('itemBody');
  if(body){
    body.innerHTML = `<div class="box">حدث خطأ في تحميل البيانات. تأكد من وجود ملف <code>solutions.json</code> داخل مجلد <code>data</code>.</div>`;
  }
});
