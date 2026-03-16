const DATA_URLS = ["./data/solutions.json", "data/solutions.json", "./solutions.json"];
const THEOREMS_URLS = ["./data/theorems.json", "data/theorems.json", "./theorems.json"];

const els = {
  list: document.getElementById("questionsList"),
  badge: document.getElementById("listBadge"),
  search: document.getElementById("searchInput"),
  pageFrom: document.getElementById("pageFrom"),
  pageTo: document.getElementById("pageTo"),
  apply: document.getElementById("btnApply"),
  print: document.getElementById("btnPrint"),

  title: document.getElementById("questionTitle"),
  meta: document.getElementById("metaLine"),
  gallery: document.getElementById("imageGallery"),
  solution: document.getElementById("solutionBox"),
  prev: document.getElementById("prevBtn"),
  next: document.getElementById("nextBtn"),

  modal: document.getElementById("imgModal"),
  modalImg: document.getElementById("modalImg"),
  modalCap: document.getElementById("modalCaption"),
  modalClose: document.getElementById("modalClose"),
  modalBackdrop: document.getElementById("modalBackdrop"),

  fontPlus: document.getElementById("fontPlus"),
  fontMinus: document.getElementById("fontMinus"),
  fontReset: document.getElementById("fontReset"),
  fontLabel: document.getElementById("fontLabel"),
  fontRange: document.getElementById("fontRange"),
};

let DB = [];
let filtered = [];
let activeId = null;
let THEOREMS = { items: [] };

const KNOWN_THEOREM_TITLES = {
  right_triangle_trigonometry: "النِّسَب المثلثية في المثلث القائم",
  line_angle_with_plane_projection: "زاوية مستقيم مع مستوى",
  pythagoras_theorem: "نظرية فيثاغورس",
  pyramid_volume: "حجم الهرم",
  cosine_rule: "قانون جيب التمام",
  triangle_area_base_height: "مساحة المثلث بالقاعدة والارتفاع",
  prism_volume: "حجم المنشور",
  isosceles_triangle_median_properties: "خواص المتوسط في المثلث المتساوي الساقين",
  triangle_area_ab_sinC: "مساحة المثلث باستعمال ضلعين والزاوية المحصورة",
  distance_point_line: "المسافة من نقطة إلى مستقيم",
  prism_lateral_area: "الغلاف الجانبي للمنشور القائم",
  coordinate_geometry_distance: "المسافة بين نقطتين في الإحداثيات",
  equilateral_triangle_area: "مساحة المثلث المتساوي الأضلاع",
  dot_product_angle_between_vectors: "الزاوية بين متجهين بالجداء النقطي",
  rectangular_prism_surface_area: "مساحة سطح متوازي المستطيلات",
  right_triangle_midpoint_hypotenuse: "منتصف الوتر في المثلث القائم",
  sine_rule: "قانون الجيوب"
};

const FONT_KEY = "space_geometry_font_scale";
const FONT_MIN = 0.8;
const FONT_MAX = 1.6;
const FONT_STEP = 0.05;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeArabic(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function parseQuestionId(raw) {
  const m = String(raw || "").trim().match(/^p0*(\d+)-q0*(\d+)$/i);
  if (!m) return { page: null, q: null };
  return { page: Number(m[1]), q: Number(m[2]) };
}

function compareQuestionIds(a, b) {
  const A = parseQuestionId(a);
  const B = parseQuestionId(b);
  if ((A.page ?? 9999) !== (B.page ?? 9999)) return (A.page ?? 9999) - (B.page ?? 9999);
  return (A.q ?? 9999) - (B.q ?? 9999);
}

function normalizeToPaddedId(raw) {
  const id = String(raw || "").trim();
  const m = id.match(/^p0*(\d+)-q0*(\d+)$/i);
  if (!m) return id;
  const p = String(Number(m[1])).padStart(2, "0");
  const q = String(Number(m[2]));
  return `p${p}-q${q}`;
}

function getItemPage(item) {
  if (item?.page !== undefined && item?.page !== null && item?.page !== "") return Number(item.page);
  return parseQuestionId(item?.id).page;
}

function getItemQuestion(item) {
  if (item?.q !== undefined && item?.q !== null && item?.q !== "") {
    const n = Number(item.q);
    return Number.isFinite(n) ? String(n) : String(item.q);
  }
  const q = parseQuestionId(item?.id).q;
  return q != null ? String(q) : "";
}

function qToPad2(q) {
  const n = Number(String(q ?? "").trim());
  if (Number.isFinite(n)) return String(n).padStart(2, "0");
  return null;
}

function getFigureSrc(item) {
  if (item?.figure?.src) return item.figure.src;
  const qp = qToPad2(getItemQuestion(item));
  return qp ? `images/q${qp}.png` : null;
}

function getFigureAlt(item) {
  if (item?.figure?.alt) return item.figure.alt;
  const q = getItemQuestion(item);
  return q ? `شكل السؤال ${q}` : "شكل السؤال";
}

function findIndexById(arr, id) {
  return arr.findIndex((q) => q.id === id);
}

async function fetchFirstJson(urls) {
  let lastErr = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${url}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("تعذر تحميل البيانات");
}

async function loadSolutions() {
  const json = await fetchFirstJson(DATA_URLS);
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.questions)) return json.questions;
  throw new Error("صيغة ملف solutions.json غير مدعومة");
}

async function loadTheorems() {
  try {
    const json = await fetchFirstJson(THEOREMS_URLS);
    if (Array.isArray(json)) return { items: json };
    if (Array.isArray(json?.items)) return json;
  } catch (_) {
    /* تجاهل الخطأ واستخدم بطاقة فارغة */
  }
  return { items: [] };
}

function getSavedScale() {
  const raw = localStorage.getItem(FONT_KEY);
  const s = raw ? Number(raw) : 1;
  return clamp(Number.isFinite(s) ? s : 1, FONT_MIN, FONT_MAX);
}

function setFontScale(scale) {
  const s = clamp(scale, FONT_MIN, FONT_MAX);
  document.documentElement.style.setProperty("--font-scale", String(s));
  localStorage.setItem(FONT_KEY, String(s));
  const pct = Math.round(s * 100);
  if (els.fontLabel) els.fontLabel.textContent = `${pct}%`;
  if (els.fontRange) els.fontRange.value = String(pct);
}

function bumpFont(delta) {
  setFontScale(getSavedScale() + delta);
}

function initFontControls() {
  setFontScale(getSavedScale());

  els.fontPlus?.addEventListener("click", () => bumpFont(FONT_STEP));
  els.fontMinus?.addEventListener("click", () => bumpFont(-FONT_STEP));
  els.fontReset?.addEventListener("click", () => setFontScale(1));
  els.fontRange?.addEventListener("input", (e) => setFontScale(Number(e.target.value || 100) / 100));

  window.addEventListener("keydown", (e) => {
    if (!e.ctrlKey) return;
    if (e.key === "=" || e.key === "+") {
      e.preventDefault();
      bumpFont(FONT_STEP);
    } else if (e.key === "-") {
      e.preventDefault();
      bumpFont(-FONT_STEP);
    } else if (e.key === "0") {
      e.preventDefault();
      setFontScale(1);
    }
  });
}

function getTheoremById(id) {
  return THEOREMS?.items?.find((x) => x.id === id) || null;
}

function getTheoremLabel(id) {
  return getTheoremById(id)?.title || KNOWN_THEOREM_TITLES[id] || id;
}

function collectTheoremIdsForItem(item) {
  const ids = new Set((item?.theoremsUsed || []).filter(Boolean));
  for (const part of (item?.parts || [])) {
    for (const method of (part?.methods || [])) {
      for (const tid of (method?.theoremsUsed || method?.theorems || [])) {
        if (tid) ids.add(tid);
      }
    }
  }
  return [...ids];
}

function ensureMissingTheoremRecords() {
  if (!THEOREMS || !Array.isArray(THEOREMS.items)) THEOREMS = { items: [] };
  const known = new Set(THEOREMS.items.map((item) => item.id));

  for (const item of DB) {
    for (const tid of collectTheoremIdsForItem(item)) {
      if (known.has(tid)) continue;
      THEOREMS.items.push({
        id: tid,
        title: KNOWN_THEOREM_TITLES[tid] || tid,
        short: "لا توجد بطاقة موسّعة لهذه النظرية في ملف النظريات الحالي بعد.",
        contentHtml: [
          `<div class="th-section"><p>المعرّف: <code>${escapeHtml(tid)}</code></p><p>يمكنك إضافة بطاقة أكثر تفصيلاً لهذه النظرية داخل ملف <code>data/theorems.json</code>.</p></div>`
        ],
        usedIn: [],
        usedInCount: 0
      });
      known.add(tid);
    }
  }
}

function enrichTheoremsUsage() {
  if (!THEOREMS?.items?.length) return;
  const usedMap = new Map(THEOREMS.items.map((th) => [th.id, new Set(Array.isArray(th.usedIn) ? th.usedIn : [])]));

  for (const item of DB) {
    for (const tid of collectTheoremIdsForItem(item)) {
      if (!usedMap.has(tid)) usedMap.set(tid, new Set());
      usedMap.get(tid).add(item.id);
    }
  }

  for (const th of THEOREMS.items) {
    const arr = [...(usedMap.get(th.id) || new Set())].sort(compareQuestionIds);
    th.usedIn = arr;
    th.usedInCount = arr.length;
  }
}

function ensureTheoremModal() {
  if (document.getElementById("thModal")) return;

  const modal = document.createElement("div");
  modal.id = "thModal";
  modal.className = "th-modal hidden";
  modal.setAttribute("aria-hidden", "true");
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
    if (e.target?.dataset?.close) closeTheoremModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) closeTheoremModal();
  });
}

function closeTheoremModal() {
  const modal = document.getElementById("thModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("th-no-scroll");
}

function renderTheoremDiagram(th) {
  const d = th?.diagram;
  if (!d) return "";
  const contentJoined = Array.isArray(th.contentHtml) ? th.contentHtml.join("") : String(th.contentHtml || "");
  if (contentJoined.includes("th-diagram")) return "";

  if (d.svg) return `<div class="th-diagram">${d.svg}</div>`;
  if (d.image) {
    const alt = d.alt || th.title || "شكل توضيحي";
    return `<div class="th-diagram"><img src="${escapeHtml(d.image)}" alt="${escapeHtml(alt)}" loading="lazy"></div>`;
  }
  return "";
}

function openTheorem(id) {
  const th = getTheoremById(id);
  const modal = document.getElementById("thModal");
  const t = document.getElementById("thTitle");
  const b = document.getElementById("thBody");
  if (!modal || !t || !b) return;

  if (!th) {
    t.textContent = getTheoremLabel(id);
    b.innerHTML = `<div class="th-section"><p>لم يتم العثور على بطاقة لهذه النظرية: <code>${escapeHtml(id)}</code></p></div>`;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("th-no-scroll");
    return;
  }

  t.textContent = th.title || getTheoremLabel(id);

  const shortHtml = th.short ? `<div class="th-short">${escapeHtml(th.short)}</div>` : "";
  const contentHtml = Array.isArray(th.contentHtml) ? th.contentHtml.join("") : String(th.contentHtml || "");
  const diagramHtml = renderTheoremDiagram(th);

  const usedIn = Array.isArray(th.usedIn) ? th.usedIn : [];
  const usedInHtml = usedIn.length ? `
    <div class="th-section">
      <div class="th-title">أسئلة من هذه الصفحة استعملت النظرية</div>
      <ul class="th-used-in">
        ${usedIn.map((qid) => {
          const q = DB.find((x) => x.id === qid);
          const page = getItemPage(q);
          const num = getItemQuestion(q);
          const label = q ? `ص${page} • س${num} — ${q.title}` : qid;
          return `<li><a href="#${escapeHtml(qid)}" data-close="1">${escapeHtml(label)}</a></li>`;
        }).join("")}
      </ul>
    </div>
  ` : "";

  b.innerHTML = `<div class="th-wrap">${shortHtml}${contentHtml}${diagramHtml}${usedInHtml}</div>`;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("th-no-scroll");
}

function openImageModal(src, caption) {
  if (!els.modal || !els.modalImg) return;
  els.modalImg.src = src;
  els.modalImg.alt = caption || "";
  if (els.modalCap) els.modalCap.textContent = caption || "";
  els.modal.classList.remove("hidden");
  els.modal.setAttribute("aria-hidden", "false");
}

function closeImageModal() {
  if (!els.modal || !els.modalImg) return;
  els.modal.classList.add("hidden");
  els.modal.setAttribute("aria-hidden", "true");
  els.modalImg.src = "";
  els.modalImg.alt = "";
}

function renderTheoremChips(ids) {
  const thIds = [...new Set((ids || []).filter(Boolean))];
  if (!thIds.length) return "";
  return `
    <div class="theorems-used">
      <div class="box__title">النظريات/القوانين المستخدمة</div>
      <div class="theorem-chips">
        ${thIds.map((tid) => `<button class="theorem-chip" type="button" data-th="${escapeHtml(tid)}">${escapeHtml(getTheoremLabel(tid))}</button>`).join("")}
      </div>
    </div>
  `;
}

function renderInfoCards(item) {
  const cards = [];

  if (item?.questionText) {
    cards.push(`
      <div class="info-box">
        <div class="box__title">نص السؤال</div>
        <p>${escapeHtml(item.questionText)}</p>
      </div>
    `);
  }

  if (Array.isArray(item?.givens) && item.givens.length) {
    cards.push(`
      <div class="info-box">
        <div class="box__title">المعطيات</div>
        <ul class="sol-ul">${item.givens.map((g) => `<li>${escapeHtml(g)}</li>`).join("")}</ul>
      </div>
    `);
  }

  return cards.length ? `<div class="sol-kv">${cards.join("")}</div>` : "";
}

function renderMethods(methods) {
  const methodCards = (methods || []).map((method) => {
    const theoremIds = (method?.theoremsUsed || method?.theorems || []).filter(Boolean);
    const intro = method?.intro ? `<p>${escapeHtml(method.intro)}</p>` : "";
    const steps = Array.isArray(method?.steps) && method.steps.length
      ? `<ul class="method-steps">${method.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ul>`
      : "";
    const result = method?.result ? `<div class="result-line">${escapeHtml(method.result)}</div>` : "";

    return `
      <div class="method-box">
        <div class="method-title">${escapeHtml(method?.name || "طريقة الحل")}</div>
        ${intro}
        ${steps}
        ${result}
        ${renderTheoremChips(theoremIds)}
      </div>
    `;
  });

  if (!methodCards.length) {
    return `<div class="box">لا توجد طريقة حل مفصلة لهذا الجزء بعد.</div>`;
  }

  return methodCards.length > 1 ? `<div class="methods-grid">${methodCards.join("")}</div>` : methodCards.join("");
}

function renderParts(parts) {
  return (parts || []).map((part) => `
    <section class="sol-part">
      <div class="sol-h">${escapeHtml(part?.label || "جزء من السؤال")}</div>
      ${part?.note ? `<div class="box">${escapeHtml(part.note)}</div>` : ""}
      ${renderMethods(part?.methods || [])}
    </section>
  `).join("");
}

function renderStandaloneSolution(item) {
  const blocks = [];

  if (item?.solutionHtml) {
    const html = Array.isArray(item.solutionHtml) ? item.solutionHtml.join("") : String(item.solutionHtml);
    blocks.push(`<div class="solution-rich sol-wrap">${html}</div>`);
  } else if (Array.isArray(item?.solution) && item.solution.length) {
    blocks.push(`
      <div class="box">
        <div class="box__title">الحل</div>
        ${item.solution.map((line) => line ? `<div>${escapeHtml(line)}</div>` : `<div style="height:10px"></div>`).join("")}
      </div>
    `);
  } else {
    blocks.push(`<div class="box">لا يوجد حل مفصل لهذا السؤال بعد.</div>`);
  }

  const theoremIds = collectTheoremIdsForItem(item);
  if (theoremIds.length) blocks.push(renderTheoremChips(theoremIds));

  return blocks.join("");
}

function getSearchBlob(item) {
  const theoremBlob = collectTheoremIdsForItem(item).map(getTheoremLabel).join(" ");
  const partBlob = (item?.parts || []).flatMap((part) => [
    part?.label || "",
    part?.note || "",
    ...(part?.methods || []).flatMap((method) => [
      method?.name || "",
      method?.result || "",
      ...(method?.steps || []),
      ...((method?.theoremsUsed || method?.theorems || []).map(getTheoremLabel))
    ])
  ]).join(" ");

  return normalizeArabic([
    item?.id || "",
    item?.title || "",
    item?.questionText || "",
    ...(item?.givens || []),
    theoremBlob,
    partBlob,
    getItemPage(item),
    getItemQuestion(item)
  ].join(" "));
}

function renderGallery(item) {
  if (!els.gallery) return;
  els.gallery.innerHTML = "";

  const images = [];
  if (Array.isArray(item?.images) && item.images.length) {
    item.images.forEach((src, idx) => {
      if (src) images.push({ src, alt: `صورة ${idx + 1} — ${item.title}` });
    });
  } else {
    const src = getFigureSrc(item);
    if (src) images.push({ src, alt: getFigureAlt(item) });
  }

  if (!images.length) {
    els.gallery.innerHTML = `<div class="gallery__empty">لا توجد صور مرفقة لهذا السؤال.</div>`;
    return;
  }

  images.forEach(({ src, alt }, idx) => {
    const cap = images.length > 1 ? `صورة ${idx + 1} — ${alt}` : alt;
    const itemEl = document.createElement("div");
    itemEl.className = "gallery__item";
    itemEl.tabIndex = 0;

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = src;
    img.alt = alt;
    img.onerror = () => {
      itemEl.remove();
      if (!els.gallery.children.length) {
        els.gallery.innerHTML = `<div class="gallery__empty">تعذر عرض الصور ضمن المسار الحالي. تأكد من وجود مجلد <span dir="ltr">images/</span> بنفس البنية.</div>`;
      }
    };

    const footer = document.createElement("div");
    footer.className = "gallery__cap";
    footer.textContent = cap;

    const open = () => openImageModal(src, cap);
    itemEl.addEventListener("click", open);
    itemEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    itemEl.appendChild(img);
    itemEl.appendChild(footer);
    els.gallery.appendChild(itemEl);
  });
}

function setActive(id) {
  activeId = id;
  for (const btn of els.list.querySelectorAll(".qbtn")) {
    btn.classList.toggle("active", btn.dataset.id === id);
  }
}

function updateBadge() {
  if (!els.badge) return;
  els.badge.textContent = `${filtered.length} سؤال`;
}

function updateNavButtons() {
  const idx = findIndexById(filtered, activeId);
  if (els.prev) els.prev.disabled = idx <= 0;
  if (els.next) els.next.disabled = idx < 0 || idx >= filtered.length - 1;
}

function renderMeta(item) {
  if (!els.meta) return;
  const theoremCount = collectTheoremIdsForItem(item).length;
  const idx = findIndexById(filtered, item.id);
  const parts = [
    `<span class="meta-chip">هندسة الفراغ</span>`,
    `<span>صفحة ${escapeHtml(getItemPage(item))}</span>`,
    `<span>سؤال ${escapeHtml(getItemQuestion(item))}</span>`
  ];

  if (idx >= 0) parts.push(`<span>${idx + 1} من ${filtered.length}</span>`);
  if (theoremCount) parts.push(`<span>مرتبط بـ ${theoremCount} نظرية</span>`);

  els.meta.innerHTML = parts.join('<span class="meta-dot">•</span>');
}

function renderList() {
  if (!els.list) return;
  els.list.innerHTML = "";

  filtered.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qbtn";
    btn.dataset.id = item.id;

    const text = document.createElement("div");
    text.className = "qbtn__text";

    const title = document.createElement("div");
    title.className = "qbtn__title";
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "qbtn__meta";
    meta.textContent = `ص ${getItemPage(item)} • س ${getItemQuestion(item)}`;

    const num = document.createElement("div");
    num.className = "qbtn__num";
    num.textContent = `Q${pad2(getItemQuestion(item))}`;

    text.appendChild(title);
    text.appendChild(meta);
    btn.appendChild(text);
    btn.appendChild(num);
    btn.addEventListener("click", () => renderQuestion(item));
    els.list.appendChild(btn);
  });

  setActive(activeId);
  updateBadge();
}

function renderEmptyState() {
  activeId = null;
  if (els.title) els.title.textContent = "لا توجد نتائج مطابقة";
  if (els.meta) els.meta.textContent = "";
  if (els.gallery) els.gallery.innerHTML = `<div class="gallery__empty">جرّب تعديل البحث أو نطاق الصفحات لعرض صور السؤال.</div>`;
  if (els.solution) els.solution.innerHTML = `<div class="empty-state">لم يتم العثور على أسئلة تطابق البحث الحالي أو نطاق الصفحات المحدد.</div>`;
  updateBadge();
  updateNavButtons();
  setActive(null);
}

function renderQuestion(item, { updateHash = true } = {}) {
  if (!item) {
    renderEmptyState();
    return;
  }

  if (els.title) els.title.textContent = item.title;
  renderMeta(item);
  renderGallery(item);

  const infoHtml = renderInfoCards(item);
  const solutionHtml = Array.isArray(item?.parts) && item.parts.length
    ? renderParts(item.parts)
    : renderStandaloneSolution(item);

  els.solution.innerHTML = `<div class="sol-wrap">${infoHtml}${solutionHtml}</div>`;

  setActive(item.id);
  updateNavButtons();

  if (updateHash && location.hash !== `#${item.id}`) {
    history.replaceState(null, "", `#${item.id}`);
  }

  document.title = `هندسة الفراغ | ص${getItemPage(item)} س${getItemQuestion(item)}`;
}

function applyFilters({ keepActive = true } = {}) {
  const query = normalizeArabic(els.search?.value || "");
  const from = Number.parseInt(els.pageFrom?.value || "", 10);
  const to = Number.parseInt(els.pageTo?.value || "", 10);

  filtered = DB.filter((item) => {
    const page = getItemPage(item);
    const matchesText = !query || getSearchBlob(item).includes(query);
    const matchesFrom = Number.isFinite(from) ? page >= from : true;
    const matchesTo = Number.isFinite(to) ? page <= to : true;
    return matchesText && matchesFrom && matchesTo;
  });

  renderList();

  if (!filtered.length) {
    renderEmptyState();
    return;
  }

  const current = keepActive ? (filtered.find((x) => x.id === activeId) || DB.find((x) => x.id === activeId && filtered.some((f) => f.id === x.id))) : null;
  renderQuestion(current || filtered[0], { updateHash: true });
}

function bindGlobalEvents() {
  els.search?.addEventListener("input", () => applyFilters({ keepActive: true }));
  els.apply?.addEventListener("click", () => applyFilters({ keepActive: true }));
  els.print?.addEventListener("click", () => window.print());

  els.prev?.addEventListener("click", () => {
    const idx = findIndexById(filtered, activeId);
    if (idx > 0) renderQuestion(filtered[idx - 1]);
  });

  els.next?.addEventListener("click", () => {
    const idx = findIndexById(filtered, activeId);
    if (idx >= 0 && idx < filtered.length - 1) renderQuestion(filtered[idx + 1]);
  });

  els.modalClose?.addEventListener("click", closeImageModal);
  els.modalBackdrop?.addEventListener("click", closeImageModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.modal && !els.modal.classList.contains("hidden")) closeImageModal();
  });

  document.addEventListener("click", (e) => {
    const theoremBtn = e.target.closest(".theorem-chip, .theorem-link");
    if (theoremBtn?.dataset?.th) {
      openTheorem(theoremBtn.dataset.th);
      return;
    }
  });

  window.addEventListener("hashchange", () => {
    const raw = location.hash.replace(/^#/, "").trim();
    const id = normalizeToPaddedId(raw);
    if (!id) return;
    const item = DB.find((x) => x.id === id);
    if (item) renderQuestion(item, { updateHash: false });
  });
}

async function init() {
  DB = await loadSolutions();
  filtered = [...DB];
  THEOREMS = await loadTheorems();
  ensureMissingTheoremRecords();
  enrichTheoremsUsage();
  ensureTheoremModal();
  initFontControls();
  bindGlobalEvents();
  renderList();

  const hashId = normalizeToPaddedId(location.hash.replace(/^#/, "").trim());
  const initial = DB.find((x) => x.id === hashId) || DB[0] || null;
  if (initial) renderQuestion(initial, { updateHash: !hashId });
  else renderEmptyState();
}

init().catch((err) => {
  console.error(err);
  if (els.title) els.title.textContent = "حدث خطأ أثناء تحميل البيانات";
  if (els.meta) els.meta.textContent = "";
  if (els.gallery) els.gallery.innerHTML = `<div class="gallery__empty">تعذر تحميل الصور أو البيانات المرافقة.</div>`;
  if (els.solution) els.solution.innerHTML = `<pre class="box">${escapeHtml(String(err))}</pre>`;
});
