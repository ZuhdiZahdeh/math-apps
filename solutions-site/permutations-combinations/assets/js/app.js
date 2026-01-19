const $ = (id) => document.getElementById(id);

let DB = [];
let filtered = [];
let activeId = null;

/* =========================
   Font scaling (solutions only)
   - controlled via CSS variable: --font-scale
   - persisted in localStorage
   ========================= */
const FONT_KEY = "pc_font_scale";
const FONT_MIN = 0.8;   // 80%
const FONT_MAX = 1.6;   // 160%
const FONT_STEP = 0.05; // 5%

function clamp(n, a, b){
  return Math.max(a, Math.min(b, n));
}

function getSavedScale(){
  const raw = localStorage.getItem(FONT_KEY);
  const s = raw ? Number(raw) : 1;
  return clamp(Number.isFinite(s) ? s : 1, FONT_MIN, FONT_MAX);
}

function setFontScale(scale){
  const s = clamp(scale, FONT_MIN, FONT_MAX);

  // Affects ONLY .item-body because CSS uses --font-scale there
  document.documentElement.style.setProperty("--font-scale", String(s));
  localStorage.setItem(FONT_KEY, String(s));

  const pct = Math.round(s * 100);

  const label = document.getElementById("fontLabel");
  const range = document.getElementById("fontRange");

  if(label) label.textContent = `${pct}%`;
  if(range) range.value = String(pct);
}

function bumpFont(delta){
  setFontScale(getSavedScale() + delta);
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
    const a = document.createElement("a");
    a.href = `#${item.id}`;
    a.dataset.id = item.id;
    a.innerHTML = `
      <strong>${escapeHtml(item.title)}</strong>
      <small>صفحة ${item.page} • سؤال ${item.q}</small>
    `;
    if(item.id === activeId) a.classList.add("active");
    toc.appendChild(a);
  });
}

function renderItem(item){
  activeId = item?.id || null;
  $("itemTitle").textContent = item ? item.title : "اختر سؤالًا من الفهرس";
  $("itemMeta").textContent = item ? `صفحة ${item.page} — سؤال ${item.q}` : "";

  const body = $("itemBody");
  if(!item){
    body.innerHTML = `<div class="box">اختر سؤالًا من القائمة اليسرى لعرض الحل.</div>`;
    renderTOC(filtered);
    return;
  }

  // parts -> methods
  const partsHtml = item.parts.map(p => {
    const methodsHtml = p.methods.map(m => `
      <div class="box">
        <h4>${escapeHtml(m.name)}</h4>
        ${m.steps.map(s => `<div>• ${escapeHtml(s)}</div>`).join("")}
        ${m.result ? `<div style="margin-top:10px"><strong>النتيجة:</strong> <code>${escapeHtml(m.result)}</code></div>` : ""}
      </div>
    `).join("");

    return `
      <h3>${escapeHtml(p.label)}</h3>
      ${p.note ? `<div class="box">${escapeHtml(p.note)}</div>` : ""}
      ${methodsHtml}
    `;
  }).join("");

  body.innerHTML = partsHtml + `<div class="page-break"></div>`;
  renderTOC(filtered);

  // Highlight active link
  [...document.querySelectorAll(".toc a")].forEach(x => {
    x.classList.toggle("active", x.dataset.id === activeId);
  });
}

function applyFilters(){
  const q = $("search").value.trim().toLowerCase();
  const from = parseInt($("pageFrom").value || "0", 10);
  const to = parseInt($("pageTo").value || "0", 10);

  filtered = DB.filter(item => {
    const matchText =
      item.title.toLowerCase().includes(q) ||
      String(item.page).includes(q) ||
      String(item.q).includes(q);
    const matchFrom = from ? item.page >= from : true;
    const matchTo = to ? item.page <= to : true;
    return matchText && matchFrom && matchTo;
  });

  renderTOC(filtered);

  // If current selection disappeared, show first
  const selected = filtered.find(x => x.id === activeId) || filtered[0] || null;
  if(selected) location.hash = `#${selected.id}`;
  else renderItem(null);
}

function initFontControls(){
  // Initialize from saved value
  setFontScale(getSavedScale());

  document.getElementById("fontPlus")?.addEventListener("click", () => bumpFont(FONT_STEP));
  document.getElementById("fontMinus")?.addEventListener("click", () => bumpFont(-FONT_STEP));
  document.getElementById("fontReset")?.addEventListener("click", () => setFontScale(1));

  document.getElementById("fontRange")?.addEventListener("input", (e) => {
    const pct = Number(e.target.value || 100);
    setFontScale(pct / 100);
  });

  // Keyboard shortcuts (desktop):
  // Ctrl +  => zoom in
  // Ctrl -  => zoom out
  // Ctrl 0  => reset
  window.addEventListener("keydown", (e) => {
    if(!e.ctrlKey) return;

    if(e.key === "=" || e.key === "+"){
      e.preventDefault();
      bumpFont(FONT_STEP);
    } else if(e.key === "-"){
      e.preventDefault();
      bumpFont(-FONT_STEP);
    } else if(e.key === "0"){
      e.preventDefault();
      setFontScale(1);
    }
  });
}

async function init(){
  const res = await fetch("assets/data/solutions.json");
  DB = await res.json();
  filtered = DB.slice();

  // Events
  $("btnApply").addEventListener("click", applyFilters);
  $("search").addEventListener("input", applyFilters);
  $("btnPrint").addEventListener("click", () => window.print());

  // Font controls (solutions-only)
  initFontControls();

  window.addEventListener("hashchange", () => {
    const id = location.hash.replace("#","").trim();
    const item = filtered.find(x => x.id === id) || DB.find(x => x.id === id);
    renderItem(item || null);
  });

  // First load
  renderTOC(filtered);
  const id = location.hash.replace("#","").trim();
  const item = DB.find(x => x.id === id) || DB[0];
  location.hash = `#${item.id}`;
}

init().catch(err => {
  console.error(err);
  $("itemBody").innerHTML = `<div class="box">حدث خطأ في تحميل البيانات. تأكد من وجود ملف solutions.json</div>`;
});
