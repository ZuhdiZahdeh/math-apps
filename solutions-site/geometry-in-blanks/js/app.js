const $ = (id) => document.getElementById(id);

let DB = [];
let filtered = [];
let activeAnchor = null;

/* =========================
   Font scaling (solutions only)
   ========================= */
const FONT_KEY = "fib_font_scale";
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
  document.documentElement.style.setProperty("--font-scale", String(s));
  localStorage.setItem(FONT_KEY, String(s));

  const pct = Math.round(s * 100);
  $("fontLabel") && ($("fontLabel").textContent = `${pct}%`);
  $("fontRange") && ($("fontRange").value = String(pct));
}
function bumpFont(delta){ setFontScale(getSavedScale() + delta); }

function initFontControls(){
  setFontScale(getSavedScale());

  $("fontPlus")?.addEventListener("click", () => bumpFont(FONT_STEP));
  $("fontMinus")?.addEventListener("click", () => bumpFont(-FONT_STEP));
  $("fontReset")?.addEventListener("click", () => setFontScale(1));

  $("fontRange")?.addEventListener("input", (e) => {
    const pct = Number(e.target.value || 100);
    setFontScale(pct / 100);
  });

  window.addEventListener("keydown", (e) => {
    if(!e.ctrlKey) return;
    if(e.key === "=" || e.key === "+"){ e.preventDefault(); bumpFont(FONT_STEP); }
    else if(e.key === "-"){ e.preventDefault(); bumpFont(-FONT_STEP); }
    else if(e.key === "0"){ e.preventDefault(); setFontScale(1); }
  });
}

/* =========================
   Anchors: p{page}-q{q}  (بدون padding)
   + دعم الروابط القديمة p08-q14
   ========================= */
const ANCHOR_MAP = new Map();   // anchor -> item (first wins)
const ITEM_CANON = new Map();   // item.id -> canonical anchor

function normalizeQ(q){
  const s = String(q ?? "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? String(n) : s; // "01" -> "1"
}
function makeCanonicalAnchor(item){
  const p = Number(item.page);
  const q = normalizeQ(item.q);
  if(Number.isFinite(p) && q) return `p${p}-q${q}`;
  // fallback
  return item.id || "";
}
function makePaddedAnchor(item){
  const p = String(Number(item.page)).padStart(2, "0");
  const q = normalizeQ(item.q);
  return `p${p}-q${q}`;
}

function buildAnchorMaps(){
  ANCHOR_MAP.clear();
  ITEM_CANON.clear();

  const seen = new Set();
  for(const item of DB){
    const canon = makeCanonicalAnchor(item);
    const padded = makePaddedAnchor(item);
    ITEM_CANON.set(item.id, canon);

    // اربط أكثر من شكل لنفس السؤال
    for(const key of [item.id, canon, padded]){
      if(!key) continue;
      if(!ANCHOR_MAP.has(key)) ANCHOR_MAP.set(key, item);
      else {
        // حماية من التكرار: نُبقي أول عنصر
        // الأفضل تنظيف solutions.json لتجنب التكرار.
        if(!seen.has(key)){
          console.warn("Duplicate anchor/id detected:", key);
          seen.add(key);
        }
      }
    }
  }
}

function resolveItemFromHash(hash){
  const raw = (hash || "").replace("#","").trim();
  if(!raw) return { item: null, anchor: null };

  const item = ANCHOR_MAP.get(raw) || null;
  // إن كان hash قديم (مثل p08-q14) نُحوّله للقانوني
  const anchor = item ? (ITEM_CANON.get(item.id) || raw) : raw;
  return { item, anchor };
}

/* ========================= */

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function renderTOC(list){
  const toc = $("toc");
  toc.innerHTML = "";

  list.forEach(item => {
    const anchor = makeCanonicalAnchor(item); // <-- نفس نمط #p391-q1
    const a = document.createElement("a");
    a.href = `#${anchor}`;
    a.dataset.anchor = anchor;

    a.innerHTML = `
      <strong>${escapeHtml(item.title)}</strong>
      <small>ص ${escapeHtml(item.page)} • س ${escapeHtml(item.q)}</small>
    `;

    if(anchor === activeAnchor) a.classList.add("active");
    toc.appendChild(a);
  });
}

function renderItem(item, anchor){
  activeAnchor = anchor || null;

  if(!item){
    $("itemTitle").textContent = "اختر سؤالًا من الفهرس";
    $("itemMeta").textContent = "";
    $("itemBody").innerHTML = `<div class="box">اختر سؤالًا من القائمة اليسرى لعرض الحل.</div>`;
    renderTOC(filtered);
    return;
  }

  $("itemTitle").textContent = item.title;
  $("itemMeta").textContent = `صفحة ${item.page} — سؤال ${item.q}`;

  // (اختياري) مثل صفحة التباديل/التوافيق: أظهر نص السؤال أعلى الحل
  const questionBox = item.questionText
    ? `<div class="box"><strong>نص السؤال:</strong><div style="margin-top:8px">${escapeHtml(item.questionText)}</div></div>`
    : "";

  const partsHtml = (item.parts || []).map(p => {
    const methodsHtml = (p.methods || []).map(m => `
      <div class="box">
        <h4>${escapeHtml(m.name)}</h4>
        ${(m.steps || []).map(s => `<div>• ${escapeHtml(s)}</div>`).join("")}
        ${m.result ? `<div style="margin-top:10px"><strong>النتيجة:</strong> <code>${escapeHtml(m.result)}</code></div>` : ""}
      </div>
    `).join("");

    return `
      <h3>${escapeHtml(p.label)}</h3>
      ${p.note ? `<div class="box">${escapeHtml(p.note)}</div>` : ""}
      ${methodsHtml}
    `;
  }).join("");

  $("itemBody").innerHTML = questionBox + partsHtml + `<div class="page-break"></div>`;

  // تحديث الـ active في الفهرس
  [...document.querySelectorAll(".toc a")].forEach(x => {
    x.classList.toggle("active", x.dataset.anchor === activeAnchor);
  });

  // عنوان التبويب (اختياري، لكنه مفيد في المشاركة)
  document.title = `حلول أسئلة الفراغ | ص${item.page}-س${item.q}`;
}

function applyFilters({ keepSelection = true } = {}){
  const q = $("search").value.trim().toLowerCase();
  const from = parseInt($("pageFrom").value || "0", 10);
  const to = parseInt($("pageTo").value || "0", 10);

  filtered = DB.filter(item => {
    const blob = `${item.title} ${item.questionText || ""} ${item.page} ${item.q}`.toLowerCase();
    const matchText = !q || blob.includes(q);
    const matchFrom = from ? item.page >= from : true;
    const matchTo = to ? item.page <= to : true;
    return matchText && matchFrom && matchTo;
  });

  renderTOC(filtered);

  if(!keepSelection){
    // فقط عند الضغط على "تطبيق" مثلًا: لو لا يوجد اختيار، اعرض أول عنصر
    const first = filtered[0] || null;
    if(first){
      const a = makeCanonicalAnchor(first);
      location.hash = `#${a}`;
    } else {
      renderItem(null, null);
    }
    return;
  }

  // إن كان السؤال الحالي ما زال ضمن الفلترة، لا تغيّر الـ hash أثناء الكتابة
  const still = filtered.some(x => makeCanonicalAnchor(x) === activeAnchor);
  if(!still){
    const first = filtered[0] || null;
    if(first){
      const a = makeCanonicalAnchor(first);
      renderItem(first, a); // عرض بدون تغيير الرابط أثناء البحث
      // ويمكن تفعيل التالي إذا أردته يغيّر الرابط تلقائياً:
      // location.hash = `#${a}`;
    } else {
      renderItem(null, null);
    }
  }
}

async function init(){
  const res = await fetch("assets/data/solutions.json");
  DB = await res.json();

  buildAnchorMaps();
  filtered = DB.slice();

  $("btnApply")?.addEventListener("click", () => applyFilters({ keepSelection: false }));
  $("search")?.addEventListener("input", () => applyFilters({ keepSelection: true }));
  $("btnPrint")?.addEventListener("click", () => window.print());

  initFontControls();

  window.addEventListener("hashchange", () => {
    const { item, anchor } = resolveItemFromHash(location.hash);
    renderItem(item || null, anchor || null);
    renderTOC(filtered);
  });

  renderTOC(filtered);

  const { item, anchor } = resolveItemFromHash(location.hash);
  if(item){
    // لو الرابط كان p08-q14 سنحوّله للقانوني p8-q14
    if(location.hash !== `#${anchor}`) location.hash = `#${anchor}`;
    else renderItem(item, anchor);
  } else if(DB.length){
    const first = DB[0];
    const a = makeCanonicalAnchor(first);
    location.hash = `#${a}`;
  } else {
    renderItem(null, null);
  }
}

init().catch(err => {
  console.error(err);
  $("itemBody").innerHTML = `<div class="box">حدث خطأ في تحميل البيانات. تأكد من وجود ملف solutions.json</div>`;
});
