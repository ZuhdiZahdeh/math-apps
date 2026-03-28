import {
  byId,
  escapeHtml,
  normalizeArabic,
  pad2,
  fetchJson,
  openImageModal,
  initResponsiveSidebar,
  getGrouping,
  buildAccordionTree,
  makeStableAccordionKey,
  bindPersistentDetails,
  restoreOpenDetailKeys,
  revealSelection,
} from "./utils.js";
import { loadTheorems, getTheoremLabel, renderTheoremChips, bindTheoremClicks } from "./theorems-store.js";

const DATA_URL = "./data/space-solutions.json";
const LIST_STATE_KEY = "geometry_space_list";

const els = {
  list: byId("questionsList"),
  badge: byId("listBadge"),
  search: byId("searchInput"),
  title: byId("questionTitle"),
  meta: byId("metaLine"),
  gallery: byId("imageGallery"),
  solution: byId("solutionBox"),
  prev: byId("prevBtn"),
  next: byId("nextBtn"),
};

let db = [];
let filtered = [];
let activeId = null;

function syncListAccordions() {
  restoreOpenDetailKeys(els.list, LIST_STATE_KEY, {
    selector: ".sidebar-acc[data-acc-key]",
    defaultOpenDepth: 1,
    forceOpenAll: document.body.classList.contains("sidebar-collapsed"),
  });
}

function parseHashId() {
  return decodeURIComponent(location.hash.replace(/^#/, "").trim());
}

function getSearchBlob(item) {
  const grouping = getGrouping(item, { accordionPrimary: "هندسة الفراغ", sortOrder: item.page || item.number || 999999 });
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
    grouping.accordionPrimary,
    grouping.accordionSecondary,
    grouping.accordionTertiary,
    ...(grouping.searchTokens || []),
    ...(item.theoremIds || []).map((id) => getTheoremLabel(id)),
    methodBlob,
  ].join(" "));
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
  const grouping = getGrouping(item, { accordionPrimary: "هندسة الفراغ" });
  const parts = [
    `<span class="meta-chip">هندسة الفراغ</span>`,
    `<span>صفحة ${escapeHtml(String(item.page ?? ""))}</span>`,
    `<span>سؤال ${escapeHtml(String(item.q ?? item.number ?? ""))}</span>`,
  ];
  if (grouping.accordionSecondary) parts.push(`<span>${escapeHtml(grouping.accordionSecondary)}</span>`);
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

function renderQuestionButton(item) {
  return `
    <button type="button" class="qbtn" data-id="${escapeHtml(item.id)}" title="${escapeHtml(item.title)}">
      <div class="qbtn__text">
        <div class="qbtn__title">${escapeHtml(item.title)}</div>
        <div class="qbtn__meta">ص ${escapeHtml(String(item.page ?? ""))} • س ${escapeHtml(String(item.q ?? ""))}</div>
      </div>
      <div class="qbtn__num">Q${escapeHtml(pad2(item.q || item.number))}</div>
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
    getPrimary: (item) => {
      const g = getGrouping(item, { accordionPrimary: "هندسة الفراغ" });
      return g.accordionSecondary || `الصفحة ${item.page ?? "—"}` || g.accordionPrimary;
    },
    getSecondary: () => "",
    getTertiary: () => "",
    getSortOrder: (item) => getGrouping(item, {
      sortOrder: ((Number(item.page) || 0) * 100) + (Number(item.q || item.number) || 0),
    }).sortOrder,
  });

  if (!tree.length) {
    updateBadge();
    setActive(activeId);
    return;
  }

  els.list.innerHTML = `
    <div class="sidebar-tip">يمكنك الضغط على <kbd>/</kbd> للبحث السريع داخل أسئلة الفراغ.</div>
    ${tree.map((node) => renderAccordionNode(node, 1)).join("")}
  `;

  for (const btn of els.list.querySelectorAll(".qbtn")) {
    btn.addEventListener("click", () => {
      const item = filtered.find((x) => x.id === btn.dataset.id);
      if (item) renderQuestion(item);
    });
  }

  syncListAccordions();
  setActive(activeId);
  updateBadge();
}

function renderEmptyState() {
  activeId = null;
  els.title.textContent = "لا توجد نتائج مطابقة";
  els.meta.textContent = "";
  els.gallery.innerHTML = "";
  els.solution.innerHTML = `<div class="empty-state">جرّب تعديل نص البحث.</div>`;
  updateBadge();
  updateNavButtons();
}

function applyFilters(preferredId = activeId) {
  const query = normalizeArabic(els.search.value);

  filtered = db.filter((item) => {
    return !query || getSearchBlob(item).includes(query);
  });

  renderList();

  if (!filtered.length) {
    renderEmptyState();
    return;
  }

  const current = filtered.find((x) => x.id === preferredId) || filtered[0];
  renderQuestion(current);
}

function bindEvents() {
  els.search.addEventListener("input", () => applyFilters(activeId));

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
  bindPersistentDetails(els.list, LIST_STATE_KEY, {
    selector: ".sidebar-acc[data-acc-key]",
    shouldSave: () => !document.body.classList.contains("sidebar-collapsed"),
  });

  initResponsiveSidebar({
    pageKey: "space",
    selectionSelector: ".qbtn",
    focusTargetId: "searchInput",
    onStateChange: syncListAccordions,
  });

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
