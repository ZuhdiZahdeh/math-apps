import {
  byId,
  escapeHtml,
  normalizeArabic,
  pad2,
  fetchJson,
  openImageModal,
  shorten,
  initResponsiveSidebar,
  getGrouping,
  buildAccordionTree,
  makeStableAccordionKey,
  bindPersistentDetails,
  restoreOpenDetailKeys,
  revealSelection,
} from "./utils.js";
import { loadTheorems, getTheoremLabel, renderTheoremChips, bindTheoremClicks } from "./theorems-store.js";

const DATASETS = {
  book: "./data/plane-book.json",
  final: "./data/plane-final.json",
};

const LIST_STATE_KEYS = {
  book: "geometry_plane_book_list",
  final: "geometry_plane_final_list",
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
let sidebarApi = null;

function datasetLabel(key) {
  return key === "book" ? "أسئلة الكتاب" : "الأسئلة النهائية";
}

function currentListStateKey() {
  return LIST_STATE_KEYS[currentDataset];
}

function syncListAccordions() {
  restoreOpenDetailKeys(els.list, currentListStateKey(), {
    selector: ".sidebar-acc[data-acc-key]",
    defaultOpenDepth: 1,
    forceOpenAll: document.body.classList.contains("sidebar-collapsed"),
  });
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
  const grouping = getGrouping(q, {
    accordionPrimary: datasetLabel(currentDataset),
    sortOrder: q.number || 999999,
  });

  return normalizeArabic([
    q.id,
    q.title,
    q.summary,
    q.number,
    grouping.accordionPrimary,
    grouping.accordionSecondary,
    grouping.accordionTertiary,
    ...(grouping.searchTokens || []),
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
  let activeBtn = null;

  for (const btn of els.list.querySelectorAll(".qbtn")) {
    const isActive = btn.dataset.id === id;
    btn.classList.toggle("active", isActive);
    if (isActive) activeBtn = btn;
  }

  if (activeBtn) {
    revealSelection(els.list, activeBtn, { selector: ".qbtn", behavior: "smooth" });
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
  const grouping = getGrouping(q, { accordionPrimary: datasetLabel(currentDataset) });
  const parts = [
    `<span class="meta-chip">${datasetLabel(currentDataset)}</span>`,
    `<span>السؤال ${escapeHtml(String(q.number ?? ""))}</span>`,
  ];

  if (grouping.accordionSecondary) {
    parts.push(`<span>${escapeHtml(grouping.accordionSecondary)}</span>`);
  }

  if (idx >= 0) parts.push(`<span>${idx + 1} من ${filtered.length}</span>`);
  if ((q.theoremIds || []).length) parts.push(`<span>مرتبط بـ ${(q.theoremIds || []).length} نظرية</span>`);
  els.meta.innerHTML = parts.join('<span class="meta-dot">•</span>');
}

function renderQuestionButton(q) {
  return `
    <button type="button" class="qbtn" data-id="${escapeHtml(q.id)}" title="${escapeHtml(q.title)}">
      <div class="qbtn__text">
        <div class="qbtn__title">${escapeHtml(q.title)}</div>
        <div class="qbtn__meta">${escapeHtml(shorten(q.summary || "", 90))}</div>
      </div>
      <div class="qbtn__num">Q${escapeHtml(pad2(q.number))}</div>
    </button>
  `;
}

function countNodeItems(node) {
  let total = (node.items || []).length;
  for (const child of node.children || []) {
    total += countNodeItems(child);
  }
  return total;
}

function renderAccordionNode(node, depth = 1, path = []) {
  const nodePath = [...path, node.label];
  const key = makeStableAccordionKey(nodePath);
  const openAttr = depth <= 1 ? " open" : "";
  const count = countNodeItems(node);
  const itemsHtml = (node.items || []).map(renderQuestionButton).join("");
  const childrenHtml = (node.children || []).map((child) => renderAccordionNode(child, depth + 1, nodePath)).join("");

  return `
    <details class="sidebar-acc sidebar-acc--lvl${depth}" data-acc-key="${escapeHtml(key)}" data-depth="${depth}"${openAttr}>
      <summary class="sidebar-acc__summary">
        <span class="sidebar-acc__label">${escapeHtml(node.label)}</span>
        <span class="sidebar-acc__count">${escapeHtml(String(count))}</span>
      </summary>
      <div class="sidebar-acc__body">
        ${childrenHtml}
        ${itemsHtml ? `<div class="sidebar-acc__items">${itemsHtml}</div>` : ""}
      </div>
    </details>
  `;
}

function renderList() {
  els.list.innerHTML = "";

  const tree = buildAccordionTree(filtered, {
    getPrimary: (q) => {
      const g = getGrouping(q, { accordionPrimary: datasetLabel(currentDataset) });
      return g.accordionSecondary || g.accordionPrimary || "الأسئلة";
    },
    getSecondary: () => "",
    getTertiary: () => "",
    getSortOrder: (q) => getGrouping(q, { sortOrder: q.number || 999999 }).sortOrder,
  });

  if (!tree.length) {
    setActive(activeId);
    return;
  }

  els.list.innerHTML = `
    <div class="sidebar-tip">يمكنك الضغط على <kbd>/</kbd> للانتقال مباشرة إلى البحث.</div>
    ${tree.map((node) => renderAccordionNode(node, 1)).join("")}
  `;

  for (const btn of els.list.querySelectorAll(".qbtn")) {
    btn.addEventListener("click", () => {
      const q = filtered.find((item) => item.id === btn.dataset.id);
      if (q) renderQuestion(q);
    });
  }

  syncListAccordions();
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
  els.search.addEventListener("input", () => applyFilter(activeId));
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
  bindPersistentDetails(els.list, () => currentListStateKey(), {
    selector: ".sidebar-acc[data-acc-key]",
    shouldSave: () => !document.body.classList.contains("sidebar-collapsed"),
  });

  sidebarApi = initResponsiveSidebar({
    pageKey: "plane",
    selectionSelector: ".qbtn",
    focusTargetId: "searchInput",
    onStateChange: syncListAccordions,
  });

  bindEvents();

  const hash = parseHash();
  const initialDataset = hash.dataset || "book";
  await switchDataset(initialDataset, hash.id);
}
init();
