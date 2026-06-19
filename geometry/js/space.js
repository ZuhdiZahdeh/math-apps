import { byId, escapeHtml, normalizeArabic, pad2, fetchJson, openImageModal, clamp } from "./utils.js";
import { loadTheorems, getTheoremLabel, renderTheoremChips, bindTheoremClicks } from "./theorems-store.js";

const DATA_URL = "./data/space-solutions.json";
const FONT_KEY = "geometry_space_font_scale";
const FONT_MIN = 0.8;
const FONT_MAX = 1.6;
const FONT_STEP = 0.05;

const els = {
  list: byId("questionsList"),
  badge: byId("listBadge"),
  search: byId("searchInput"),
  pageFrom: byId("pageFrom"),
  pageTo: byId("pageTo"),
  apply: byId("btnApply"),
  print: byId("btnPrint"),
  title: byId("questionTitle"),
  meta: byId("metaLine"),
  gallery: byId("imageGallery"),
  solution: byId("solutionBox"),
  prev: byId("prevBtn"),
  next: byId("nextBtn"),
  fontPlus: byId("fontPlus"),
  fontMinus: byId("fontMinus"),
  fontReset: byId("fontReset"),
  fontLabel: byId("fontLabel"),
  fontRange: byId("fontRange"),
};

let db = [];
let filtered = [];
let activeId = null;

function parseHashId() {
  return decodeURIComponent(location.hash.replace(/^#/, "").trim());
}

function getSavedScale() {
  const raw = localStorage.getItem(FONT_KEY);
  const value = raw ? Number(raw) : 1;
  return clamp(Number.isFinite(value) ? value : 1, FONT_MIN, FONT_MAX);
}

function setFontScale(scale) {
  const value = clamp(scale, FONT_MIN, FONT_MAX);
  document.documentElement.style.setProperty("--font-scale", String(value));
  localStorage.setItem(FONT_KEY, String(value));
  const percent = Math.round(value * 100);
  els.fontLabel.textContent = `${percent}%`;
  els.fontRange.value = String(percent);
}

function bumpFont(delta) {
  setFontScale(getSavedScale() + delta);
}

function bindFontControls() {
  setFontScale(getSavedScale());
  els.fontPlus.addEventListener("click", () => bumpFont(FONT_STEP));
  els.fontMinus.addEventListener("click", () => bumpFont(-FONT_STEP));
  els.fontReset.addEventListener("click", () => setFontScale(1));
  els.fontRange.addEventListener("input", (e) => setFontScale(Number(e.target.value || 100) / 100));
}

function getSearchBlob(item) {
  const methodBlob = (item.parts || []).flatMap((part) => [
    part.label || "",
    ...(part.methods || []).flatMap((method) => [
      method.name || "",
      method.result || "",
      ...(method.steps || []),
      ...(method.theoremIds || []).map((id) => getTheoremLabel(id)),
    ]),
  ]).join(" ");

  return normalizeArabic([
    item.id,
    item.title,
    item.questionText,
    item.page,
    item.q,
    ...(item.theoremIds || []).map((id) => getTheoremLabel(id)),
    methodBlob,
  ].join(" "));
}

function setActive(id) {
  activeId = id;
  for (const btn of els.list.querySelectorAll(".qbtn")) {
    btn.classList.toggle("active", btn.dataset.id === id);
  }
}

function findIndexById(arr, id) {
  return arr.findIndex((item) => item.id === id);
}

function updateBadge() {
  els.badge.textContent = `${filtered.length} سؤال`;
}

function updateNavButtons() {
  const idx = findIndexById(filtered, activeId);
  els.prev.disabled = idx <= 0;
  els.next.disabled = idx < 0 || idx >= filtered.length - 1;
}

function renderMeta(item) {
  const idx = findIndexById(filtered, item.id);
  const parts = [
    `<span class="meta-chip">هندسة الفراغ</span>`,
    `<span>صفحة ${escapeHtml(String(item.page ?? ""))}</span>`,
    `<span>سؤال ${escapeHtml(String(item.q ?? item.number ?? ""))}</span>`,
  ];
  if (idx >= 0) parts.push(`<span>${idx + 1} من ${filtered.length}</span>`);
  if ((item.theoremIds || []).length) parts.push(`<span>مرتبط بـ ${(item.theoremIds || []).length} نظرية</span>`);
  els.meta.innerHTML = parts.join('<span class="meta-dot">•</span>');
}

function renderGallery(item) {
  els.gallery.innerHTML = "";
  const images = [];
  if (item.figure?.src) {
    images.push({ src: item.figure.src, alt: item.figure.alt || `شكل السؤال ${item.q}` });
  }
  if (!images.length) {
    els.gallery.innerHTML = `<div class="gallery__empty">لا توجد صور مرفقة لهذا السؤال.</div>`;
    return;
  }

  images.forEach(({ src, alt }, i) => {
    const cap = `صورة ${i + 1} — ${alt}`;
    const card = document.createElement("div");
    card.className = "gallery__item";
    card.tabIndex = 0;
    card.innerHTML = `
      <img loading="lazy" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />
      <div class="gallery__cap">${escapeHtml(cap)}</div>
    `;
    const img = card.querySelector("img");
    img.onerror = () => {
      card.remove();
      if (!els.gallery.children.length) {
        els.gallery.innerHTML = `<div class="gallery__empty">تعذر عرض الصورة ضمن المسار الحالي. تأكد من وجود مجلد <span dir="ltr">images/</span>.</div>`;
      }
    };
    const open = () => openImageModal(src, cap);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
    els.gallery.appendChild(card);
  });
}

function renderMethods(methods) {
  if (!methods.length) {
    return `<div class="method-box">لا توجد طريقة مفصلة لهذا الجزء بعد.</div>`;
  }
  const cards = methods.map((method) => `
    <div class="method-box">
      <div class="method-title">${escapeHtml(method.name || "طريقة الحل")}</div>
      <ol class="sol-ol">
        ${(method.steps || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
      ${method.result ? `<div class="mathline">${escapeHtml(method.result)}</div>` : ""}
      ${renderTheoremChips(method.theoremIds, { title: "النظريات المستخدمة" })}
    </div>
  `);
  return cards.length > 1 ? `<div class="methods-grid">${cards.join("")}</div>` : cards.join("");
}

function renderParts(item) {
  return (item.parts || []).map((part) => `
    <section class="sol-part">
      <div class="sol-h">${escapeHtml(part.label || "جزء من السؤال")}</div>
      ${part.note ? `<div class="sol-note">${escapeHtml(part.note)}</div>` : ""}
      ${renderMethods(part.methods || [])}
    </section>
  `).join("");
}

function renderQuestion(item) {
  if (!item) return;
  els.title.textContent = item.title;
  renderMeta(item);
  renderGallery(item);

  const intro = item.questionText
    ? `<div class="sol-note">${escapeHtml(item.questionText)}</div>`
    : "";
  els.solution.innerHTML = `
    <div class="sol-wrap">
      ${intro}
      ${renderParts(item)}
    </div>
  `;

  setActive(item.id);
  updateNavButtons();
  history.replaceState(null, "", `#${item.id}`);
  document.title = `${item.title} | هندسة الفراغ`;
}

function renderList() {
  els.list.innerHTML = "";
  filtered.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qbtn";
    btn.dataset.id = item.id;
    btn.innerHTML = `
      <div class="qbtn__text">
        <div class="qbtn__title">${escapeHtml(item.title)}</div>
        <div class="qbtn__meta">ص ${escapeHtml(String(item.page ?? ""))} • س ${escapeHtml(String(item.q ?? ""))}</div>
      </div>
      <div class="qbtn__num">Q${escapeHtml(pad2(item.q || item.number))}</div>
    `;
    btn.addEventListener("click", () => renderQuestion(item));
    els.list.appendChild(btn);
  });
  setActive(activeId);
  updateBadge();
}

function renderEmptyState() {
  activeId = null;
  els.title.textContent = "لا توجد نتائج مطابقة";
  els.meta.textContent = "";
  els.gallery.innerHTML = "";
  els.solution.innerHTML = `<div class="empty-state">جرّب تعديل نص البحث أو نطاق الصفحات.</div>`;
  updateBadge();
  updateNavButtons();
}

function applyFilters() {
  const query = normalizeArabic(els.search.value);
  const from = Number.parseInt(els.pageFrom.value || "", 10);
  const to = Number.parseInt(els.pageTo.value || "", 10);

  filtered = db.filter((item) => {
    const matchesText = !query || getSearchBlob(item).includes(query);
    const page = Number(item.page || 0);
    const matchesFrom = Number.isFinite(from) ? page >= from : true;
    const matchesTo = Number.isFinite(to) ? page <= to : true;
    return matchesText && matchesFrom && matchesTo;
  });

  renderList();

  if (!filtered.length) {
    renderEmptyState();
    return;
  }

  const current = filtered.find((x) => x.id === activeId) || filtered[0];
  renderQuestion(current);
}

function bindEvents() {
  els.search.addEventListener("input", applyFilters);
  els.apply.addEventListener("click", applyFilters);
  els.print.addEventListener("click", () => window.print());
  els.prev.addEventListener("click", () => {
    const idx = findIndexById(filtered, activeId);
    if (idx > 0) renderQuestion(filtered[idx - 1]);
  });
  els.next.addEventListener("click", () => {
    const idx = findIndexById(filtered, activeId);
    if (idx >= 0 && idx < filtered.length - 1) renderQuestion(filtered[idx + 1]);
  });

  window.addEventListener("hashchange", () => {
    const id = parseHashId();
    if (!id) return;
    const target = db.find((item) => item.id === id);
    if (target) renderQuestion(target);
  });
}

async function init() {
  await loadTheorems();
  bindTheoremClicks(document, { contextDomain: "space" });
  bindFontControls();
  bindEvents();

  const data = await fetchJson(DATA_URL);
  db = data.questions || [];
  filtered = [...db];
  renderList();

  const hashId = parseHashId();
  const initial = db.find((item) => item.id === hashId) || db[0] || null;
  if (initial) renderQuestion(initial);
  else renderEmptyState();
}

init();
