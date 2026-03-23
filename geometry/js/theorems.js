import { byId, escapeHtml, normalizeArabic, shorten, openImageModal, initResponsiveSidebar } from "./utils.js";
import { loadTheorems, getAllTheorems, getTheorem, renderTheoremBodyHtml } from "./theorems-store.js";

const els = {
  list: byId("theoremsList"),
  search: byId("searchInput"),
  fieldFilter: byId("fieldFilter"),
  categoryFilter: byId("categoryFilter"),
  clearBtn: byId("clearFiltersBtn"),
  stats: byId("statsRow"),
  title: byId("theoremTitle"),
  meta: byId("metaLine"),
  summary: byId("summaryBox"),
  diagram: byId("diagramBox"),
  body: byId("theoremBody"),
  questions: byId("linkedQuestionsBox"),
  related: byId("relatedBox"),
  prev: byId("prevBtn"),
  next: byId("nextBtn"),
  tabPlane: byId("tabPlane"),
  tabSpace: byId("tabSpace"),
  badge: byId("domainBadge"),
};

let currentDomain = "plane";
let allTheorems = [];
let filtered = [];
let activeId = null;

function visibleInDomain(theorem, domain) {
  const list = theorem.visibleDomains || [theorem.domain];
  return list.includes(domain);
}

function parseHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, "").trim());
  if (!raw) return { domain: null, id: null };
  const match = raw.match(/^(plane|space):(.*)$/);
  if (match) return { domain: match[1], id: match[2] };
  return { domain: null, id: raw };
}

function setTabsUI(domain) {
  const isPlane = domain === "plane";
  els.tabPlane.classList.toggle("is-active", isPlane);
  els.tabPlane.setAttribute("aria-selected", isPlane ? "true" : "false");
  els.tabSpace.classList.toggle("is-active", !isPlane);
  els.tabSpace.setAttribute("aria-selected", !isPlane ? "true" : "false");
  els.badge.textContent = isPlane ? "المستوية" : "الفراغ";
}

function theoremSearchBlob(theorem) {
  return normalizeArabic([
    theorem.id,
    theorem.title,
    theorem.statement,
    theorem.short,
    theorem.explanation,
    theorem.field,
    theorem.category,
    ...(theorem.tags || []),
  ].join(" "));
}

function populateSelect(selectEl, values, placeholder, current = "") {
  selectEl.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>`;
  values.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    opt.selected = value === current;
    selectEl.appendChild(opt);
  });
}

function refreshFilters() {
  const domainItems = allTheorems.filter((item) => visibleInDomain(item, currentDomain));
  const fields = [...new Set(domainItems.map((item) => item.field).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
  const categories = [...new Set(domainItems.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
  populateSelect(els.fieldFilter, fields, "كل المجالات", els.fieldFilter.value);
  populateSelect(els.categoryFilter, categories, "كل الأصناف", els.categoryFilter.value);
}

function renderStats() {
  const domainItems = allTheorems.filter((item) => visibleInDomain(item, currentDomain));
  const used = domainItems.filter((item) => item.usedInCount).length;
  const fieldsCount = new Set(domainItems.map((item) => item.field).filter(Boolean)).size;
  const categoriesCount = new Set(domainItems.map((item) => item.category).filter(Boolean)).size;
  els.stats.innerHTML = `
    <span class="stat-chip stat-chip--primary">${domainItems.length} نظرية</span>
    <span class="stat-chip">${fieldsCount} مجال</span>
    <span class="stat-chip">${categoriesCount} صنف</span>
    <span class="stat-chip stat-chip--soft">${used} نظرية مستخدمة في الحلول</span>
  `;
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

function renderList() {
  els.list.innerHTML = "";
  if (!filtered.length) {
    els.list.innerHTML = `<div class="empty-list">لا توجد نظريات مطابقة للفلاتر الحالية.</div>`;
    return;
  }

  filtered.forEach((theorem) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qbtn thbtn";
    btn.dataset.id = theorem.id;
    btn.title = theorem.title;
    btn.innerHTML = `
      <div class="thbtn__content">
        <div class="qbtn__title">${escapeHtml(theorem.title)}</div>
        <div class="thbtn__meta">
          <span class="mini-badge">${escapeHtml(theorem.field)}</span>
          <span class="mini-badge mini-badge--soft">${escapeHtml(theorem.category)}</span>
          ${theorem.usedInCount ? `<span class="mini-note">${escapeHtml(String(theorem.usedInCount))} استخدام</span>` : ""}
        </div>
        ${theorem.legacyIds?.length ? `<div class="mini-note mini-note--block">معرّفات قديمة: ${escapeHtml(theorem.legacyIds.slice(0, 3).join("، "))}${theorem.legacyIds.length > 3 ? "…" : ""}</div>` : ""}
      </div>
      <div class="qbtn__num">${escapeHtml(theorem.number ? String(theorem.number) : theorem.id.replace(/^th/, ""))}</div>
    `;
    btn.addEventListener("click", () => renderTheorem(theorem));
    els.list.appendChild(btn);
  });

  setActive(activeId);
}

function renderMeta(theorem) {
  const idx = findIndexById(filtered, theorem.id);
  const chips = [
    `<span class="meta-chip">${currentDomain === "plane" ? "الهندسة المستوية" : "هندسة الفراغ"}</span>`,
    `<span>${escapeHtml(theorem.field)}</span>`,
    `<span>${escapeHtml(theorem.category)}</span>`,
  ];
  if (idx >= 0) chips.push(`<span>${idx + 1} من ${filtered.length}</span>`);
  if (theorem.questionCount) chips.push(`<span>${theorem.questionCount} سؤال مرتبط</span>`);
  els.meta.innerHTML = chips.join('<span class="meta-dot">•</span>');
}

function renderSummary(theorem) {
  const tagHtml = (theorem.tags || []).slice(0, 10).map((tag) => `
    <span class="info-chip">${escapeHtml(tag)}</span>
  `).join("");

  const legacy = theorem.legacyIds?.length
    ? `<div class="summary-id">المعرّفات القديمة: <code>${escapeHtml(theorem.legacyIds.join("، "))}</code></div>`
    : "";

  els.summary.innerHTML = `
    <div class="summary-lead">${escapeHtml(theorem.short || theorem.statement || theorem.title)}</div>
    <div class="info-chip-row">
      <span class="info-chip">${escapeHtml(theorem.field)}</span>
      <span class="info-chip info-chip--accent">${escapeHtml(theorem.category)}</span>
      <span class="info-chip">${escapeHtml(theorem.domain)}</span>
      ${theorem.questionCount ? `<span class="info-chip">${escapeHtml(String(theorem.questionCount))} سؤال مرتبط</span>` : ""}
    </div>
    ${tagHtml ? `<div class="tag-cloud">${tagHtml}</div>` : ""}
    ${legacy}
  `;
}

function renderDiagram(theorem) {
  if (theorem?.diagram?.svg) {
    els.diagram.innerHTML = `<div class="diagram-wrap">${theorem.diagram.svg}</div>`;
    return;
  }

  const src = theorem?.diagram?.image || theorem?.images?.[0]?.src || "";
  const alt = theorem?.diagram?.alt || theorem?.images?.[0]?.alt || theorem?.title || "";
  if (!src) {
    els.diagram.innerHTML = `<div class="diagram-empty">لا يوجد شكل توضيحي مرفق لهذه النظرية داخل البيانات الحالية.</div>`;
    return;
  }

  els.diagram.innerHTML = `
    <div class="diagram-wrap">
      <img class="zoomable-image" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" data-zoom-src="${escapeHtml(src)}" data-zoom-caption="${escapeHtml(alt)}" />
    </div>
  `;
  const img = els.diagram.querySelector("img");
  img.addEventListener("error", () => {
    els.diagram.innerHTML = `<div class="diagram-empty">تعذر عرض الشكل التوضيحي ضمن المسار الحالي.</div>`;
  });
  img.addEventListener("click", () => openImageModal(src, alt));
}

function renderQuestions(theorem) {
  const questions = theorem.questionLinks || [];
  if (!questions.length) {
    els.questions.innerHTML = `<div class="solution-empty">لا توجد أسئلة مرتبطة مباشرة بهذه النظرية داخل البيانات الحالية.</div>`;
    return;
  }
  els.questions.innerHTML = `
    <div class="related-grid">
      ${questions.map((q) => `
        <a class="related-card" href="${escapeHtml(q.href)}">
          <div class="related-card__title">${escapeHtml(q.title || q.questionId)}</div>
          <div class="related-card__meta">
            <span class="mini-badge">${escapeHtml(q.sourceLabel || q.level || "")}</span>
          </div>
          <div class="related-card__text">${escapeHtml(shorten(q.statement || "", 190))}</div>
          <div class="related-card__actions">
            <span class="btn btn--soft btn--sm">فتح السؤال</span>
          </div>
        </a>
      `).join("")}
    </div>
  `;
}

function relatedScore(base, candidate) {
  let score = 0;
  if (base.id === candidate.id) return -1;
  if (base.relatedIds?.includes(candidate.id) || candidate.relatedIds?.includes(base.id)) score += 6;
  if (base.field === candidate.field) score += 4;
  if (base.category === candidate.category) score += 5;
  const baseTags = new Set(base.tags || []);
  for (const tag of candidate.tags || []) {
    if (baseTags.has(tag)) score += 1;
  }
  if ((candidate.visibleDomains || []).includes(currentDomain)) score += 1;
  return score;
}

function renderRelated(theorem) {
  const candidates = allTheorems
    .filter((item) => visibleInDomain(item, currentDomain) && item.id !== theorem.id)
    .map((item) => ({ item, score: relatedScore(theorem, item) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.item.number || 9999) - (b.item.number || 9999))
    .slice(0, 6)
    .map((entry) => entry.item);

  if (!candidates.length) {
    els.related.innerHTML = `<div class="solution-empty">لا توجد نظريات ذات صلة واضحة وفق المجال والصنف والوسوم الحالية.</div>`;
    return;
  }

  els.related.innerHTML = `
    <div class="related-grid">
      ${candidates.map((item) => `
        <button class="related-card" type="button" data-related-id="${escapeHtml(item.id)}">
          <div class="related-card__title">${escapeHtml(item.title)}</div>
          <div class="related-card__meta">
            <span class="mini-badge">${escapeHtml(item.field)}</span>
            <span class="mini-badge mini-badge--soft">${escapeHtml(item.category)}</span>
          </div>
          <div class="related-card__text">${escapeHtml(shorten(item.short || item.statement || "", 160))}</div>
        </button>
      `).join("")}
    </div>
  `;

  for (const btn of els.related.querySelectorAll("[data-related-id]")) {
    btn.addEventListener("click", () => {
      const target = getTheorem(btn.dataset.relatedId);
      if (target) renderTheorem(target);
    });
  }
}

function renderTheorem(theorem) {
  if (!theorem) return;
  els.title.textContent = theorem.title;
  renderMeta(theorem);
  renderSummary(theorem);
  renderDiagram(theorem);
  els.body.innerHTML = renderTheoremBodyHtml(theorem);
  renderQuestions(theorem);
  renderRelated(theorem);

  setActive(theorem.id);
  updateNavButtons();
  history.replaceState(null, "", `#${currentDomain}:${theorem.id}`);
  document.title = `${theorem.title} | مرجع النظريات`;
}

function applyFilters(preferredId = null) {
  const query = normalizeArabic(els.search.value);
  const field = els.fieldFilter.value;
  const category = els.categoryFilter.value;

  filtered = allTheorems.filter((item) => {
    if (!visibleInDomain(item, currentDomain)) return false;
    if (field && item.field !== field) return false;
    if (category && item.category !== category) return false;
    if (query && !theoremSearchBlob(item).includes(query)) return false;
    return true;
  });

  renderStats();
  renderList();

  if (!filtered.length) {
    activeId = null;
    els.title.textContent = "لا توجد نتائج مطابقة";
    els.meta.textContent = "";
    els.summary.innerHTML = `<div class="empty-state">جرّب إزالة بعض الفلاتر أو البحث بكلمة مختلفة.</div>`;
    els.diagram.innerHTML = `<div class="diagram-empty">لا يوجد محتوى لعرضه الآن.</div>`;
    els.body.innerHTML = `<div class="solution-empty">لا توجد نظرية مطابقة للبحث الحالي.</div>`;
    els.questions.innerHTML = `<div class="solution-empty">لا توجد أسئلة مرتبطة في هذا السياق.</div>`;
    els.related.innerHTML = `<div class="solution-empty">لا توجد نظريات مرتبطة لعرضها.</div>`;
    updateNavButtons();
    return;
  }

  const target = filtered.find((item) => item.id === preferredId || item.id === activeId) || filtered[0];
  renderTheorem(target);
}

function switchDomain(domain, preferredId = null, resetFilters = false) {
  currentDomain = domain;
  setTabsUI(domain);
  if (resetFilters) {
    els.search.value = "";
    els.fieldFilter.value = "";
    els.categoryFilter.value = "";
  }
  refreshFilters();
  applyFilters(preferredId);
}

function bindEvents() {
  els.search.addEventListener("input", () => applyFilters());
  els.fieldFilter.addEventListener("change", () => applyFilters());
  els.categoryFilter.addEventListener("change", () => applyFilters());
  els.clearBtn.addEventListener("click", () => {
    els.search.value = "";
    els.fieldFilter.value = "";
    els.categoryFilter.value = "";
    refreshFilters();
    applyFilters();
  });

  els.tabPlane.addEventListener("click", () => switchDomain("plane"));
  els.tabSpace.addEventListener("click", () => switchDomain("space"));

  els.prev.addEventListener("click", () => {
    const idx = findIndexById(filtered, activeId);
    if (idx > 0) renderTheorem(filtered[idx - 1]);
  });
  els.next.addEventListener("click", () => {
    const idx = findIndexById(filtered, activeId);
    if (idx >= 0 && idx < filtered.length - 1) renderTheorem(filtered[idx + 1]);
  });

  window.addEventListener("hashchange", () => {
    const hash = parseHash();
    if (hash.domain && hash.domain !== currentDomain) {
      switchDomain(hash.domain, hash.id);
      return;
    }
    if (hash.id) {
      const theorem = getTheorem(hash.id);
      if (theorem) renderTheorem(theorem);
    }
  });
}

async function init() {
  await loadTheorems();
  allTheorems = getAllTheorems();
  bindEvents();
  initResponsiveSidebar({ pageKey: "theorems", focusTargetId: "searchInput" });

  const hash = parseHash();
  const startDomain = hash.domain || "plane";
  switchDomain(startDomain, hash.id, false);
}

init();
