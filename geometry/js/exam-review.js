import { byId, escapeHtml, normalizeArabic, fetchJson, openImageModal, shorten } from "./utils.js";
import { loadTheorems, getTheoremLabel, renderTheoremChips, bindTheoremClicks } from "./theorems-store.js";

const DATA_URL = "./data/exam-review.json";

const els = {
  list: byId("examQuestionsList"),
  search: byId("examSearchInput"),
  year: byId("yearFilter"),
  season: byId("seasonFilter"),
  topic: byId("topicFilter"),
  title: byId("examQuestionTitle"),
  meta: byId("examMetaLine"),
  gallery: byId("examImageGallery"),
  body: byId("examSolutionBox"),
  prev: byId("prevExamBtn"),
  next: byId("nextExamBtn"),
  clear: byId("clearExamFilters"),
  stats: byId("examStats"),
  datasetBadge: byId("examDatasetBadge"),
};

let dataset = null;
let allQuestions = [];
let filtered = [];
let activeId = null;

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "ar"));
}

function option(value, label) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function hydrateFilters() {
  const years = uniqueSorted(allQuestions.map((q) => q.year)).sort((a, b) => b - a);
  const seasons = uniqueSorted(allQuestions.map((q) => q.season));
  const topics = uniqueSorted(allQuestions.map((q) => q.topic));

  els.year.innerHTML = option("", "كل السنوات") + years.map((y) => option(y, y)).join("");
  els.season.innerHTML = option("", "كل المواسم") + seasons.map((s) => option(s, s)).join("");
  els.topic.innerHTML = option("", "كل المحاور") + topics.map((t) => option(t, t)).join("");
}

function getSearchBlob(q) {
  return normalizeArabic([
    q.id,
    q.title,
    q.summary,
    q.year,
    q.season,
    q.session,
    q.topic,
    q.sourceFile,
    ...(q.tags || []),
    ...(q.given || []),
    ...(q.required || []),
    ...(q.solutionPlan || []),
    ...(q.finalAnswers || []),
    ...(q.theoremIds || []).map((id) => getTheoremLabel(id)),
  ].join(" "));
}

function parseHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, "").trim());
  if (!raw) return null;
  return raw.replace(/^exam:/, "");
}

function findIndexById(arr, id) {
  return arr.findIndex((item) => item.id === id);
}

function setActive(id) {
  activeId = id;
  for (const btn of els.list.querySelectorAll(".qbtn")) {
    btn.classList.toggle("active", btn.dataset.id === id);
  }
}

function updateStats() {
  const seasons = uniqueSorted(filtered.map((q) => q.season));
  const years = uniqueSorted(filtered.map((q) => q.year));
  els.stats.innerHTML = `
    <div class="stat-chip stat-chip--primary"><strong>${escapeHtml(filtered.length)}</strong><span>سؤال معروض</span></div>
    <div class="stat-chip"><strong>${escapeHtml(allQuestions.length)}</strong><span>إجمالي الأسئلة</span></div>
    <div class="stat-chip stat-chip--soft"><strong>${escapeHtml(years.length)}</strong><span>سنوات</span></div>
    <div class="stat-chip"><strong>${escapeHtml(seasons.length)}</strong><span>مواسم</span></div>
  `;
  els.datasetBadge.textContent = `${filtered.length} / ${allQuestions.length}`;
}

function updateNavButtons() {
  const idx = findIndexById(filtered, activeId);
  els.prev.disabled = idx <= 0;
  els.next.disabled = idx < 0 || idx >= filtered.length - 1;
}

function renderList() {
  els.list.innerHTML = "";
  filtered.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qbtn";
    btn.dataset.id = q.id;
    btn.innerHTML = `
      <div class="qbtn__text">
        <div class="qbtn__title">${escapeHtml(q.title)}</div>
        <div class="qbtn__meta">${escapeHtml(shorten(q.summary, 105))}</div>
      </div>
      <div class="qbtn__num">${escapeHtml(q.season === "شتاء" ? "ش" : "ص")}${escapeHtml(String(q.year).slice(-2))}</div>
    `;
    btn.addEventListener("click", () => renderQuestion(q));
    els.list.appendChild(btn);
  });
  setActive(activeId);
}

function renderMeta(q) {
  const idx = findIndexById(filtered, q.id);
  const parts = [
    `<span class="meta-chip">${escapeHtml(q.season)} ${escapeHtml(q.year)}</span>`,
    `<span>${escapeHtml(q.session || "")}</span>`,
    `<span>السؤال ${escapeHtml(q.questionNumber || q.number || "")}</span>`,
    `<span>${escapeHtml(q.level || "")}</span>`,
  ];
  if (idx >= 0) parts.push(`<span>${idx + 1} من ${filtered.length}</span>`);
  if ((q.theoremIds || []).length) parts.push(`<span>${q.theoremIds.length} نظريات مرتبطة</span>`);
  if (q.imageCount) parts.push(`<span>${q.imageCount} صفحات مصورة</span>`);
  els.meta.innerHTML = parts.filter(Boolean).join('<span class="meta-dot">•</span>');
}

function renderGallery(q) {
  const images = Array.isArray(q.images) ? q.images : [];
  if (!images.length) {
    els.gallery.innerHTML = `<div class="gallery__empty">لا توجد صور مرفقة لهذا السؤال.</div>`;
    return;
  }

  els.gallery.innerHTML = images.map((src, idx) => {
    const caption = `${q.title} - صفحة ${idx + 1}`;
    return `
      <button class="gallery__item exam-page-thumb" type="button" data-src="${escapeHtml(src)}" data-caption="${escapeHtml(caption)}">
        <img loading="lazy" src="${escapeHtml(src)}" alt="${escapeHtml(caption)}" />
        <div class="gallery__cap">صفحة ${idx + 1} من ${images.length}</div>
      </button>
    `;
  }).join("");

  els.gallery.querySelectorAll(".exam-page-thumb").forEach((item) => {
    item.addEventListener("click", () => openImageModal(item.dataset.src, item.dataset.caption));
  });
}

function renderPills(items) {
  return (items || []).map((item) => `<span class="info-chip">${escapeHtml(item)}</span>`).join("");
}

function renderListBlock(title, items, cls = "sol-ul") {
  if (!items?.length) return "";
  const tag = cls === "sol-ol" ? "ol" : "ul";
  return `
    <div class="exam-block">
      <div class="sol-h">${escapeHtml(title)}</div>
      <${tag} class="${cls}">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </${tag}>
    </div>
  `;
}

function renderQuestion(q) {
  if (!q) return;

  els.title.textContent = q.title;
  renderMeta(q);
  renderGallery(q);

  const pdfLink = q.pdfUrl
    ? `<a class="btn btn--soft" href="${escapeHtml(q.pdfUrl)}" target="_blank" rel="noopener">فتح ملف PDF الأصلي</a>`
    : "";

  els.body.innerHTML = `
    <div class="sol-wrap exam-review-body">
      <div class="summary-lead">${escapeHtml(q.summary)}</div>
      <div class="info-chip-row">${renderPills([q.topic, q.sourceFile, ...(q.tags || []).slice(0, 4)])}</div>
      <div class="source-actions">
        ${pdfLink}
        <span class="btn btn--soft btn--as-label">${escapeHtml(q.imageCount || 0)} صفحات مصورة</span>
      </div>
      <div class="sol-kv exam-kv">
        <div>${renderListBlock("المعطيات", q.given)}</div>
        <div>${renderListBlock("المطلوب", q.required)}</div>
      </div>
      ${renderListBlock("خطة الحل / الإرشادات العلمية", q.solutionPlan, "sol-ol")}
      ${renderListBlock("النتائج النهائية", q.finalAnswers)}
      ${renderTheoremChips(q.theoremIds, { title: "النظريات المرتبطة بالسؤال" })}
    </div>
  `;

  setActive(q.id);
  updateNavButtons();
  history.replaceState(null, "", `#exam:${q.id}`);
  document.title = `${q.title} | مراجعة هندسية`;
}

function renderEmptyState() {
  activeId = null;
  els.title.textContent = "لا توجد أسئلة مطابقة";
  els.meta.textContent = "";
  els.gallery.innerHTML = "";
  els.body.innerHTML = `<div class="empty-state">غيّر كلمة البحث أو أعد ضبط المرشحات.</div>`;
  updateNavButtons();
}

function applyFilter(preferredId = null) {
  const query = normalizeArabic(els.search.value);
  const year = String(els.year.value || "");
  const season = String(els.season.value || "");
  const topic = String(els.topic.value || "");

  filtered = allQuestions.filter((q) => {
    if (year && String(q.year) !== year) return false;
    if (season && q.season !== season) return false;
    if (topic && q.topic !== topic) return false;
    if (query && !getSearchBlob(q).includes(query)) return false;
    return true;
  });

  updateStats();
  renderList();

  if (!filtered.length) {
    renderEmptyState();
    return;
  }

  const target = filtered.find((q) => q.id === preferredId || q.id === activeId) || filtered[0];
  renderQuestion(target);
}

function clearFilters() {
  els.search.value = "";
  els.year.value = "";
  els.season.value = "";
  els.topic.value = "";
  applyFilter();
}

function bindEvents() {
  [els.search, els.year, els.season, els.topic].forEach((el) => {
    el.addEventListener(el.tagName === "INPUT" ? "input" : "change", () => applyFilter());
  });
  els.clear.addEventListener("click", clearFilters);
  els.prev.addEventListener("click", () => {
    const idx = findIndexById(filtered, activeId);
    if (idx > 0) renderQuestion(filtered[idx - 1]);
  });
  els.next.addEventListener("click", () => {
    const idx = findIndexById(filtered, activeId);
    if (idx >= 0 && idx < filtered.length - 1) renderQuestion(filtered[idx + 1]);
  });
  window.addEventListener("hashchange", () => {
    const id = parseHash();
    if (!id) return;
    const target = allQuestions.find((q) => q.id === id);
    if (target) {
      els.year.value = "";
      els.season.value = "";
      els.topic.value = "";
      els.search.value = "";
      applyFilter(id);
    }
  });
}

async function init() {
  await loadTheorems();
  bindTheoremClicks(document, { contextDomain: "plane" });
  dataset = await fetchJson(DATA_URL);
  allQuestions = dataset.questions || [];
  filtered = [...allQuestions];
  hydrateFilters();
  bindEvents();
  updateStats();
  applyFilter(parseHash());
}

init().catch((err) => {
  console.error(err);
  els.body.innerHTML = `<div class="empty-state">تعذر تحميل بيانات أسئلة السنوات.</div>`;
});
