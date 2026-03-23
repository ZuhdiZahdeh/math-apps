import { fetchJson, escapeHtml, shorten, uniq, openImageModal } from "./utils.js";

const DATA_URLS = [
  "./data/theorems-master.json",
  "./data/theorems-master.grouped.json",
];

const state = {
  data: null,
  byId: new Map(),
  aliasToId: new Map(),
  loading: null,
  modal: null,
  loadedFrom: null,
};

function indexData(data) {
  state.data = data;
  state.byId = new Map();
  state.aliasToId = new Map();

  for (const [legacy, canonical] of Object.entries(data?.aliases || {})) {
    state.aliasToId.set(legacy, canonical);
  }

  for (const theorem of data?.theorems || []) {
    state.byId.set(theorem.id, theorem);
    state.aliasToId.set(theorem.id, theorem.id);
    for (const legacy of theorem.legacyIds || []) {
      if (legacy) state.aliasToId.set(legacy, theorem.id);
    }
  }

  return data;
}

async function fetchFirstAvailable(urls) {
  let lastError = null;

  for (const url of urls) {
    try {
      const data = await fetchJson(url);
      state.loadedFrom = url;
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to load theorem data.");
}

export async function loadTheorems() {
  if (state.data) return state.data;
  if (!state.loading) {
    state.loading = fetchFirstAvailable(DATA_URLS).then(indexData);
  }
  return state.loading;
}

export function getAllTheorems() {
  return state.data?.theorems || [];
}

export function canonicalizeTheoremId(id) {
  return state.aliasToId.get(id) || id;
}

export function getTheorem(id) {
  const canonical = canonicalizeTheoremId(id);
  return state.byId.get(canonical) || null;
}

export function getTheoremLabel(id) {
  return getTheorem(id)?.title || canonicalizeTheoremId(id);
}

export function buildReferenceHref(id, contextDomain = "plane") {
  const canonical = canonicalizeTheoremId(id);
  return `./theorems.html#${encodeURIComponent(contextDomain)}:${encodeURIComponent(canonical)}`;
}

function renderDiagram(theorem, { compact = false } = {}) {
  if (theorem?.diagram?.svg) {
    return `<div class="diagram-wrap">${theorem.diagram.svg}</div>`;
  }

  const src = theorem?.diagram?.image || theorem?.images?.[0]?.src || "";
  const alt = theorem?.diagram?.alt || theorem?.images?.[0]?.alt || theorem?.title || "";
  if (src) {
    return `<div class="diagram-wrap"><img class="zoomable-image" data-zoom-src="${escapeHtml(src)}" data-zoom-caption="${escapeHtml(alt)}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" /></div>`;
  }

  return compact
    ? `<div class="diagram-empty">لا يوجد شكل توضيحي مرفق لهذه النظرية داخل البيانات الحالية.</div>`
    : "";
}

function renderQuestionCards(theorem, limit = 6) {
  const questions = (theorem?.questionLinks || []).slice(0, limit);
  if (!questions.length) {
    return `<div class="empty-state">لا توجد أسئلة مرتبطة مباشرة بهذه النظرية داخل البيانات الحالية.</div>`;
  }

  return `
    <div class="related-grid">
      ${questions.map((q) => `
        <a class="related-card" href="${escapeHtml(q.href)}">
          <div class="related-card__title">${escapeHtml(q.title || q.questionId)}</div>
          <div class="related-card__meta">
            <span class="mini-badge">${escapeHtml(q.sourceLabel || q.level || "")}</span>
          </div>
          <div class="related-card__text">${escapeHtml(shorten(q.statement || "", 180))}</div>
          <div class="related-card__actions">
            <span class="btn btn--soft btn--sm">فتح السؤال</span>
          </div>
        </a>
      `).join("")}
    </div>
  `;
}

function buildGeneratedContent(theorem) {
  const blocks = [];
  if (theorem?.statement) {
    blocks.push(`
      <div class="th-section">
        <div class="th-title">نص النظرية</div>
        <p>${escapeHtml(theorem.statement)}</p>
      </div>
    `);
  }
  if (theorem?.explanation && theorem.explanation !== theorem.statement) {
    blocks.push(`
      <div class="th-section">
        <div class="th-title">شرح مختصر</div>
        <p>${escapeHtml(theorem.explanation)}</p>
      </div>
    `);
  }
  if (theorem?.proof) {
    blocks.push(`
      <div class="th-section">
        <div class="th-title">ملاحظة / برهان</div>
        <p>${escapeHtml(theorem.proof)}</p>
      </div>
    `);
  }
  if (!blocks.length) {
    blocks.push(`<div class="empty-state">لا يوجد شرح موسّع لهذه النظرية بعد.</div>`);
  }
  return blocks.join("");
}

export function renderTheoremBodyHtml(theorem) {
  if (!theorem) return `<div class="empty-state">تعذّر العثور على النظرية المطلوبة.</div>`;
  return theorem.contentHtml || buildGeneratedContent(theorem);
}

function ensureTheoremModal() {
  if (state.modal) return state.modal;

  const wrap = document.createElement("div");
  wrap.className = "th-modal hidden";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = `
    <div class="th-backdrop" data-close="1"></div>
    <div class="th-card" role="dialog" aria-modal="true">
      <div class="th-card-head">
        <div class="th-card-title" id="thModalTitle"></div>
        <button class="th-close" type="button" aria-label="إغلاق" data-close="1">×</button>
      </div>
      <div class="th-card-body" id="thModalBody"></div>
    </div>
  `;
  document.body.appendChild(wrap);

  const titleEl = wrap.querySelector("#thModalTitle");
  const bodyEl = wrap.querySelector("#thModalBody");

  const close = () => {
    wrap.classList.add("hidden");
    wrap.setAttribute("aria-hidden", "true");
    document.body.classList.remove("th-no-scroll");
  };

  wrap.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) close();
    const zoomable = e.target.closest(".zoomable-image");
    if (zoomable) {
      openImageModal(zoomable.dataset.zoomSrc || zoomable.src, zoomable.dataset.zoomCaption || zoomable.alt || "");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !wrap.classList.contains("hidden")) close();
  });

  state.modal = { wrap, titleEl, bodyEl, close };
  return state.modal;
}

export async function openTheoremModal(id, { contextDomain = "plane" } = {}) {
  await loadTheorems();
  const theorem = getTheorem(id);
  if (!theorem) return;

  const modal = ensureTheoremModal();
  modal.titleEl.textContent = theorem.title;

  const chips = uniq([theorem.field, theorem.category]).map((label, idx) => {
    const cls = idx === 0 ? "info-chip" : "info-chip info-chip--accent";
    return `<span class="${cls}">${escapeHtml(label)}</span>`;
  }).join("");

  const tags = (theorem.tags || []).slice(0, 6).map((tag) => `
    <span class="info-chip">${escapeHtml(tag)}</span>
  `).join("");

  modal.bodyEl.innerHTML = `
    <div class="summary-lead">${escapeHtml(theorem.short || theorem.statement || theorem.title)}</div>
    <div class="info-chip-row">${chips}</div>
    ${tags ? `<div class="info-chip-row">${tags}</div>` : ""}
    <div class="theorem-actions">
      <a class="btn btn--success" href="${escapeHtml(buildReferenceHref(theorem.id, contextDomain))}">فتح في المرجع</a>
      ${theorem.questionCount ? `<span class="btn btn--soft">${escapeHtml(String(theorem.questionCount))} سؤال مرتبط</span>` : ""}
    </div>
    ${renderDiagram(theorem, { compact: true })}
    <div class="summary-block">${renderTheoremBodyHtml(theorem)}</div>
    <div class="summary-block">
      <div class="summary-subtitle">أسئلة مرتبطة</div>
      ${renderQuestionCards(theorem, 4)}
    </div>
    <div class="th-compact-note">هذه البطاقة تُقرأ من ملف <code>${escapeHtml(state.loadedFrom || DATA_URLS[0])}</code>.</div>
  `;

  modal.wrap.classList.remove("hidden");
  modal.wrap.setAttribute("aria-hidden", "false");
  document.body.classList.add("th-no-scroll");
}

export function renderTheoremChips(ids, { title = "النظريات المرتبطة" } = {}) {
  const canonicalIds = uniq((ids || []).map((id) => canonicalizeTheoremId(id)));
  if (!canonicalIds.length) {
    return `
      <div class="theorems-used theorems-used--empty">
        <div class="summary-subtitle">${escapeHtml(title)}</div>
        <div class="theorem-empty">لا توجد نظريات مرتبطة مسجلة لهذا العنصر.</div>
      </div>
    `;
  }

  return `
    <div class="theorems-used">
      <div class="summary-subtitle">${escapeHtml(title)}</div>
      <div class="theorem-chips">
        ${canonicalIds.map((id) => `
          <button class="theorem-chip" type="button" data-th="${escapeHtml(id)}">${escapeHtml(getTheoremLabel(id))}</button>
        `).join("")}
      </div>
    </div>
  `;
}

export function bindTheoremClicks(root = document, { contextDomain = "plane" } = {}) {
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-th]");
    if (btn) {
      e.preventDefault();
      openTheoremModal(btn.dataset.th, { contextDomain });
    }
  });
}
