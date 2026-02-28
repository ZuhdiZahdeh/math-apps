const $ = (id) => document.getElementById(id);

let DB = [];
let filtered = [];
let activeId = null;

/* =========================
   Theorems (clickable chips)
   ========================= */
let THEOREMS = null;

async function loadTheorems(){
  // الأفضل: يوجد نسخة داخل geometry-in-blanks/data/theorems.json
  // fallback: محاولة الوصول لملف مساق المستوي إن كان المسار يعمل في نفس الاستضافة
   const tries = [
    "./data/theorems.json",
    "../geometry-in-blanks/data/theorems.json"
  ];
  for(const url of tries){
    try{
      const res = await fetch(url, { cache: "no-store" });
      if(res.ok) return await res.json();
    }catch(_){}
  }
  return null;
}

function getTheoremById(id){
  if(!THEOREMS?.items) return null;
  return THEOREMS.items.find(x => x.id === id) || null;
}

function ensureTheoremModal(){
  if(document.getElementById("thModal")) return;

  const modal = document.createElement("div");
  modal.id = "thModal";
  modal.className = "th-modal hidden";
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

  modal.addEventListener("click", (e) => {
    if(e.target?.dataset?.close) modal.classList.add("hidden");
  });

  window.addEventListener("keydown", (e) => {
    if(e.key === "Escape") modal.classList.add("hidden");
  });
}

/* --- Helpers for theorem diagrams (SVG / image) --- */
function renderTheoremDiagram(th){
  const d = th?.diagram;
  if(!d) return "";

  // إذا الـ contentHtml بالفعل يحتوي th-diagram فلا نكرر
  const contentJoined = (th.contentHtml || []).join("");
  const alreadyHasDiagramBlock = contentJoined.includes("th-diagram");
  if(alreadyHasDiagramBlock) return "";

  // SVG
  if(d.svg){
    return `<div class="th-diagram">${d.svg}</div>`;
  }

  // Image
  if(d.image){
    const alt = d.alt || th.title || "شكل توضيحي";
    return `
      <div class="th-diagram">
        <img src="${escapeHtml(d.image)}" alt="${escapeHtml(alt)}" />
      </div>
    `;
  }

  return "";
}

function openTheorem(id){
  const th = getTheoremById(id);

  const t = document.getElementById("thTitle");
  const b = document.getElementById("thBody");
  const modal = document.getElementById("thModal");
  if(!t || !b || !modal) return;

  if(!th){
    t.textContent = id;
    b.innerHTML = `<div class="th-section"><p>لم يتم العثور على النظرية بالمعرّف: <code>${escapeHtml(id)}</code></p></div>`;
    modal.classList.remove("hidden");
    return;
  }

  t.textContent = th.title || id;

  const shortHtml = th.short
    ? `<div class="th-short">${escapeHtml(th.short)}</div>`
    : "";

  const contentHtml = (th.contentHtml || []).join("");
  const diagramHtml = renderTheoremDiagram(th);

  // ✅ ربط عكسي: أين استُخدمت هذه النظرية؟
  // (يتطلب أن يكون theorems.json يحتوي usedIn / usedInCount)
  const usedIn = Array.isArray(th.usedIn) ? th.usedIn : [];
  const usedInHtml = usedIn.length ? `
    <div class="th-section">
      <div class="th-title">تُستخدم في</div>
      <ul class="th-used-in">
        ${usedIn.map(qid => {
          const q = (DB || []).find(x => x.id === qid);
          const label = q
            ? `ص${q.page} • س${q.q} — ${q.title}`
            : qid;
          // data-close لإغلاق النافذة عند الانتقال
          return `<li><a href="#${escapeHtml(qid)}" data-close="1">${escapeHtml(label)}</a></li>`;
        }).join("")}
      </ul>
    </div>
  ` : "";

  b.innerHTML = `
    <div class="th-wrap">
      ${shortHtml}
      ${contentHtml}
      ${diagramHtml}
      ${usedInHtml}
    </div>
  `;

  modal.classList.remove("hidden");
}

/* =========================
   Font scaling (solutions only)
   ========================= */
const FONT_KEY = "gb_font_scale";
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

/* ========================= */

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

/* ✅ نجعل الرابط دائمًا بصيغة p01-q1 (page padded) */
function normalizeToPaddedId(raw){
  const id = String(raw || "").trim();
  const m = id.match(/^p0*(\d+)-q0*(\d+)$/i);
  if(!m) return id;
  const p = String(Number(m[1])).padStart(2, "0"); // p01..p99
  const q = String(Number(m[2]));                 // q1..q99
  return `p${p}-q${q}`;
}

/* =========================
   Figure helpers (cropped images)
   Path note:
   images/q01.png ... images/q29.png
   ========================= */
function qToPad2(q){
  const n = Number(String(q ?? "").trim());
  if(Number.isFinite(n)) return String(n).padStart(2, "0");
  return null;
}

function getFigureSrc(item){
  // 1) لو موجود داخل JSON (اختياري)
  if(item?.figure?.src) return item.figure.src;

  // 2) بناء تلقائي حسب رقم السؤال: images/q01.png
  const qp = qToPad2(item?.q);
  if(!qp) return null;
  return `images/q${qp}.png`;
}

function getFigureAlt(item){
  if(item?.figure?.alt) return item.figure.alt;
  const qn = (Number(item?.q) ? Number(item.q) : item?.q);
  return `شكل السؤال ${qn ?? ""}`.trim();
}

/* =========================
   Modal (Zoom) for Figures
   ========================= */
function ensureFigureModal(){
  if(document.getElementById("figModal")) return;

  const modal = document.createElement("div");
  modal.id = "figModal";
  modal.className = "fig-modal";
  modal.innerHTML = `
    <div class="fig-modal-backdrop" data-close="1"></div>
    <div class="fig-modal-card" role="dialog" aria-modal="true" aria-label="تكبير شكل السؤال">
      <button class="fig-modal-close btn btn-secondary btn-small" type="button" data-close="1">إغلاق</button>
      <img id="figModalImg" alt="">
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if(e.target?.dataset?.close) modal.classList.remove("open");
  });

  window.addEventListener("keydown", (e) => {
    if(e.key === "Escape") modal.classList.remove("open");
  });

  // Delegate open clicks (button or image)
  document.addEventListener("click", (e) => {
    const opener = e.target.closest(".fig-open, .figure-img");
    if(!opener) return;

    const src = opener.dataset.src;
    if(!src) return;

    const alt = opener.dataset.alt || "شكل السؤال";
    const img = document.getElementById("figModalImg");
    img.src = src;
    img.alt = alt;

    modal.classList.add("open");
  });
}

/* ========================= */

function renderTOC(list){
  const toc = $("toc");
  toc.innerHTML = "";

  list.forEach(item => {
    const a = document.createElement("a");
    a.href = `#${item.id}`; // ✅ يعتمد على id كما هو في JSON
    a.dataset.id = item.id;

    a.innerHTML = `
      <strong>${escapeHtml(item.title)}</strong>
      <small>صفحة ${escapeHtml(item.page)} • سؤال ${escapeHtml(item.q)}</small>
    `;

    if(item.id === activeId) a.classList.add("active");
    toc.appendChild(a);
  });
}

function renderItem(item){
  activeId = item?.id || null;

  $("itemTitle").textContent = item ? item.title : "اختر سؤالًا من الفهرس";
  $("itemMeta").textContent  = item ? `صفحة ${item.page} — سؤال ${item.q}` : "";

  const body = $("itemBody");
  if(!item){
    body.innerHTML = `<div class="box">اختر سؤالًا من القائمة اليسرى لعرض الحل.</div>`;
    renderTOC(filtered);
    return;
  }

  // ===== Figure HTML =====
  const figSrc = getFigureSrc(item);
  const figAlt = getFigureAlt(item);

  const figHtml = figSrc ? `
    <div class="box figure-box">
      <div class="figure-head">
        <strong>شكل السؤال</strong>
        <button class="btn btn-secondary btn-small fig-open" type="button"
          data-src="${figSrc}"
          data-alt="${escapeHtml(figAlt)}">تكبير</button>
      </div>
      <img class="figure-img"
        src="${figSrc}"
        alt="${escapeHtml(figAlt)}"
        loading="lazy"
        data-src="${figSrc}"
        data-alt="${escapeHtml(figAlt)}"
        onerror="this.closest('.figure-box')?.remove();">
    </div>
  ` : "";

  // ===== Optional: Givens / Question text =====
  const givensHtml = (item.givens && Array.isArray(item.givens) && item.givens.length)
    ? `
      <div class="box">
        <h3 style="margin-top:0">المعطيات</h3>
        ${(item.givens || []).map(g => `<div>• ${escapeHtml(g)}</div>`).join("")}
      </div>
    ` : "";

  const questionTextHtml = item.questionText
    ? `<div class="box"><h3 style="margin-top:0">نص السؤال</h3><div>${escapeHtml(item.questionText)}</div></div>`
    : "";

  // ===== Parts / Methods =====
  const partsHtml = (item.parts || []).map(p => {
    const methodsHtml = (p.methods || []).map(m => {
      // ✅ دعم أكثر من اسم للحقل (توافق مع نسخ مختلفة من ملف solutions.json)
      // - theoremsUsed: الاسم الذي كانت تستخدمه نسخة قديمة من الواجهة
      // - theorems: الاسم الموجود في ملف البيانات الحالي
      const thIds = (m.theoremsUsed || m.theorems || []).filter(Boolean);
      const chips = thIds.length ? `
        <div class="theorems-used">
          <div><strong>النظريات/القوانين المستخدمة</strong></div>
          <div class="theorem-chips">
            ${thIds.map(tid => {
              const t = getTheoremById(tid);
              const label = t?.title || tid;
              return `<button class="theorem-chip" type="button" data-th="${escapeHtml(tid)}">${escapeHtml(label)}</button>`;
            }).join("")}
          </div>
        </div>
      ` : "";

      return `
        <div class="box">
          <h4>${escapeHtml(m.name)}</h4>
          ${(m.steps || []).map(s => `<div>• ${escapeHtml(s)}</div>`).join("")}
          ${m.result ? `<div style="margin-top:10px"><strong>النتيجة:</strong> <code>${escapeHtml(m.result)}</code></div>` : ""}
          ${chips}
        </div>
      `;
    }).join("");

    return `
      <h3>${escapeHtml(p.label)}</h3>
      ${p.note ? `<div class="box">${escapeHtml(p.note)}</div>` : ""}
      ${methodsHtml}
    `;
  }).join("");

  body.innerHTML = figHtml + questionTextHtml + givensHtml + partsHtml + `<div class="page-break"></div>`;

  // Update TOC active state
  renderTOC(filtered);
  [...document.querySelectorAll(".toc a")].forEach(x => {
    x.classList.toggle("active", x.dataset.id === activeId);
  });

  // Optional: update tab title
  try {
    document.title = `حلول الفراغ | ص${item.page}-س${item.q}`;
  } catch {}
}

function applyFilters(){
  const q = $("search")?.value?.trim().toLowerCase() || "";
  const from = parseInt($("pageFrom")?.value || "0", 10);
  const to   = parseInt($("pageTo")?.value   || "0", 10);

  filtered = DB.filter(item => {
    const blob = `${item.title || ""} ${item.questionText || ""} ${(item.givens || []).join(" ")} ${item.page} ${item.q}`.toLowerCase();
    const matchText = !q || blob.includes(q);
    const matchFrom = from ? item.page >= from : true;
    const matchTo   = to   ? item.page <= to   : true;
    return matchText && matchFrom && matchTo;
  });

  renderTOC(filtered);

  const selected = filtered.find(x => x.id === activeId) || filtered[0] || null;
  if(selected) location.hash = `#${selected.id}`;
  else renderItem(null);
}

async function loadJsonSmart(){
  // جرّب data/ ثم fallback إلى assets/data/ (احتياط)
  const tries = ["data/solutions.json", "assets/data/solutions.json"];
  for(const url of tries){
    const res = await fetch(url, { cache: "no-store" });
    if(res.ok) return await res.json();
  }
  throw new Error("solutions.json not found in data/ or assets/data/");
}

async function init(){
  DB = await loadJsonSmart();
  filtered = DB.slice();

  $("btnApply")?.addEventListener("click", applyFilters);
  $("search")?.addEventListener("input", applyFilters);
  $("btnPrint")?.addEventListener("click", () => window.print());

  initFontControls();
  ensureFigureModal();

  // Theorems
  THEOREMS = await loadTheorems();
  ensureTheoremModal();

  // Delegate theorem chip clicks
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".theorem-chip");
    if(!btn) return;
    const id = btn.dataset.th;
    if(id) openTheorem(id);
  });

  renderTOC(filtered);

  window.addEventListener("hashchange", () => {
    const raw = location.hash.replace("#","").trim();
    const padded = normalizeToPaddedId(raw);

    // إذا المستخدم فتح رابط #p1-q1 نحوله مباشرة إلى #p01-q1
    if(raw && padded && raw !== padded){
      location.hash = `#${padded}`;
      return;
    }

    const id = padded || raw;
    const item = filtered.find(x => x.id === id) || DB.find(x => x.id === id) || null;
    renderItem(item);
  });

  // أول تحميل
  const raw = location.hash.replace("#","").trim();
  const padded = normalizeToPaddedId(raw);
  const first = (padded && DB.find(x => x.id === padded)) || DB.find(x => x.id === raw) || DB[0];

  // لو نفس الهاش موجود، اعرض مباشرة
  const wantHash = `#${first.id}`;
  if(location.hash !== wantHash){
    location.hash = wantHash;
  } else {
    renderItem(first);
  }
}

init().catch(err => {
  console.error(err);
  $("itemBody").innerHTML = `<div class="box">حدث خطأ في تحميل البيانات. تأكد من وجود ملف solutions.json</div>`;
});
