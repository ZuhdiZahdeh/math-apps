import { byId, escapeHtml, normalizeArabic, pad2, fetchJson, openImageModal, shorten } from "./utils.js";
import { loadTheorems, getTheoremLabel, renderTheoremChips, bindTheoremClicks } from "./theorems-store.js";

const DATASETS = {
  book: "./data/plane-book.json",
  final: "./data/plane-final.json",
};

const els = {
  list: byId("questionsList"),
  search: byId("searchInput"),
  title: byId("questionTitle"),
  meta: byId("metaLine"),
  gallery: byId("imageGallery"),
  solution: byId("solutionBox"),
  prev: byId("prevBtn"),
  next: byId("nextBtn"),
  tabBook: byId("tabBook"),
  tabFinal: byId("tabFinal"),
  datasetBadge: byId("datasetBadge"),
};

const cache = { book: null, final: null };
let currentDataset = "book";
let allQuestions = [];
let filtered = [];
let activeId = null;

function datasetLabel(key) {
  return key === "book" ? "أسئلة الكتاب" : "الأسئلة النهائية";
}

async function loadDataset(key) {
  if (cache[key]) return cache[key];
  const data = await fetchJson(DATASETS[key]);
  cache[key] = data.questions || [];
  return cache[key];
}

function setTabsUI(key) {
  const isBook = key === "book";
  els.tabBook.classList.toggle("is-active", isBook);
  els.tabBook.setAttribute("aria-selected", isBook ? "true" : "false");
  els.tabFinal.classList.toggle("is-active", !isBook);
  els.tabFinal.setAttribute("aria-selected", !isBook ? "true" : "false");
  els.datasetBadge.textContent = isBook ? "الكتاب" : "النهائي";
}

function getSearchBlob(q) {
  return normalizeArabic([
    q.id,
    q.title,
    q.summary,
    q.number,
    ...(q.theoremIds || []).map((id) => getTheoremLabel(id)),
  ].join(" "));
}

function parseHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, "").trim());
  if (!raw) return { dataset: null, id: null };
  const match = raw.match(/^(book|final):(.*)$/);
  if (match) return { dataset: match[1], id: match[2] };
  if (raw.startsWith("qf")) return { dataset: "final", id: raw };
  return { dataset: "book", id: raw };
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

function updateNavButtons() {
  const idx = findIndexById(filtered, activeId);
  els.prev.disabled = idx <= 0;
  els.next.disabled = idx < 0 || idx >= filtered.length - 1;
}

function renderGallery(q) {
  els.gallery.innerHTML = "";
  const images = Array.isArray(q.images) ? q.images : [];
  if (!images.length) {
    els.gallery.innerHTML = `<div class="gallery__empty">لا توجد صور مرفقة لهذا السؤال.</div>`;
    return;
  }

  images.forEach((src, i) => {
    const cap = `صورة ${i + 1} — ${q.title}`;
    const item = document.createElement("div");
    item.className = "gallery__item";
    item.tabIndex = 0;

    item.innerHTML = `
      <img loading="lazy" src="${escapeHtml(src)}" alt="${escapeHtml(cap)}" />
      <div class="gallery__cap">${escapeHtml(cap)}</div>
    `;

    const img = item.querySelector("img");
    img.onerror = () => {
      item.remove();
      if (!els.gallery.children.length) {
        els.gallery.innerHTML = `<div class="gallery__empty">تعذر العثور على الصور داخل المسار الحالي. تأكد من وجود مجلد <span dir="ltr">images/</span>.</div>`;
      }
    };

    const open = () => openImageModal(src, cap);
    item.addEventListener("click", open);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    els.gallery.appendChild(item);
  });
}

function renderMeta(q) {
  const idx = findIndexById(filtered, q.id);
  const parts = [
    `<span class="meta-chip">${datasetLabel(currentDataset)}</span>`,
    `<span>السؤال ${escapeHtml(String(q.number ?? ""))}</span>`,
  ];
  if (idx >= 0) parts.push(`<span>${idx + 1} من ${filtered.length}</span>`);
  if ((q.theoremIds || []).length) parts.push(`<span>مرتبط بـ ${(q.theoremIds || []).length} نظرية</span>`);
  els.meta.innerHTML = parts.join('<span class="meta-dot">•</span>');
}

function renderList() {
  els.list.innerHTML = "";
  filtered.forEach((q) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qbtn";
    btn.dataset.id = q.id;
    btn.innerHTML = `
      <div class="qbtn__text">
        <div class="qbtn__title">${escapeHtml(q.title)}</div>
        <div class="qbtn__meta">${escapeHtml(shorten(q.summary || "", 90))}</div>
      </div>
      <div class="qbtn__num">Q${escapeHtml(pad2(q.number))}</div>
    `;
    btn.addEventListener("click", () => renderQuestion(q));
    els.list.appendChild(btn);
  });
  setActive(activeId);
}

function renderQuestion(q) {
  if (!q) return;
  els.title.textContent = q.title;
  renderMeta(q);
  renderGallery(q);

  const html = Array.isArray(q.solutionHtml) ? q.solutionHtml.join("") : String(q.solutionHtml || "");
  const content = html
    ? html
    : `<pre class="solution solution-pre">${escapeHtml((q.solution || []).join("\n"))}</pre>`;

  els.solution.innerHTML = `
    <div class="sol-wrap">
      ${content}
      ${renderTheoremChips(q.theoremIds, { title: "النظريات المرتبطة" })}
    </div>
  `;

  setActive(q.id);
  updateNavButtons();
  history.replaceState(null, "", `#${currentDataset}:${q.id}`);
  document.title = `${q.title} | الهندسة المستوية`;
}

function renderEmptyState() {
  activeId = null;
  els.title.textContent = "لا توجد نتائج مطابقة";
  els.meta.textContent = "";
  els.gallery.innerHTML = "";
  els.solution.innerHTML = `<div class="empty-state">جرّب كلمة بحث أخرى أو بدّل بين تبويبي الكتاب والنهائي.</div>`;
  updateNavButtons();
}

function applyFilter(preferredId = null) {
  const query = normalizeArabic(els.search.value);
  filtered = !query
    ? [...allQuestions]
    : allQuestions.filter((q) => getSearchBlob(q).includes(query));

  renderList();

  if (!filtered.length) {
    renderEmptyState();
    return;
  }

  const target = filtered.find((q) => q.id === preferredId || q.id === activeId) || filtered[0];
  renderQuestion(target);
}

async function switchDataset(key, preferredId = null) {
  currentDataset = key;
  setTabsUI(key);
  allQuestions = await loadDataset(key);
  filtered = [...allQuestions];
  applyFilter(preferredId);
}

function bindEvents() {
  els.search.addEventListener("input", () => applyFilter());
  els.tabBook.addEventListener("click", () => switchDataset("book"));
  els.tabFinal.addEventListener("click", () => switchDataset("final"));
  els.prev.addEventListener("click", () => {
    const idx = findIndexById(filtered, activeId);
    if (idx > 0) renderQuestion(filtered[idx - 1]);
  });
  els.next.addEventListener("click", () => {
    const idx = findIndexById(filtered, activeId);
    if (idx >= 0 && idx < filtered.length - 1) renderQuestion(filtered[idx + 1]);
  });

  window.addEventListener("hashchange", async () => {
    const hash = parseHash();
    const desiredDataset = hash.dataset || currentDataset;
    if (desiredDataset !== currentDataset) {
      await switchDataset(desiredDataset, hash.id);
      return;
    }
    if (hash.id) {
      const target = allQuestions.find((q) => q.id === hash.id);
      if (target) renderQuestion(target);
    }
  });
}

async function init() {
  await loadTheorems();
  bindTheoremClicks(document, { contextDomain: "plane" });
  bindEvents();

  const hash = parseHash();
  const initialDataset = hash.dataset || "book";
  await switchDataset(initialDataset, hash.id);
}
init();
