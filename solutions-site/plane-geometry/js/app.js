/* حلول الهندسة المستوية — س1 إلى س41 */
const DATA_URL = "./data/solutions.json";
const THEOREMS_URL = "./data/theorems.json";

/* =========================================================
   Theorems UI — بطاقات نظريات/قوانين قابلة للنقر
   يعتمد على: data/theorems.json (مع رسمة SVG داخل الملف)
   ========================================================= */
(() => {
  const state = {
    ready: false,
    loading: null,
    url: THEOREMS_URL,
    byId: new Map(),
    modal: null,
    body: null,
    wired: false
  };

  // خريطة مساعدة لتحويل نصوص شائعة إلى معرفات (IDs) داخل theorems.json
  const TITLE_TO_ID = {
    "نظرية القطعة المتوسطة في المثلث + عكسها": "midsegment_triangle_bundle",
    "نظرية القطعة المتوسطة في المثلث والعكس": "midsegment_triangle_bundle",
    "نظرية القطعة المتوسطة في المثلث (والعكس)": "midsegment_triangle_bundle",

    "معيار متوازي الأضلاع: ضلعان متقابلان متوازيان ومتساويان": "parallelogram_test_opposite_parallel_equal",
    "معيار متوازي الأضلاع": "parallelogram_test_opposite_parallel_equal",

    "خواص متوازي الأضلاع: الأضلاع المتقابلة متساوية": "parallelogram_property_opposite_sides_equal",
    "خواص متوازي الأضلاع": "parallelogram_property_opposite_sides_equal"
  };

  function normalizeTitle(s) {
    return (s || "")
      .replace(/^[-•\s]+/, "")
      .replace(/\s+/g, " ")
      .replace(/[.،]\s*$/g, "")
      .trim();
  }

  function ensureModal() {
    if (state.modal) return;

    const modal = document.createElement("div");
    modal.id = "theoremModal";
    modal.className = "th-modal hidden";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="th-backdrop" data-th-close="1"></div>
      <div class="th-card" role="dialog" aria-modal="true" dir="rtl">
        <div class="th-card-head">
          <div class="th-card-title" id="thTitle"></div>
          <button class="th-close" type="button" aria-label="إغلاق" data-th-close="1">×</button>
        </div>
        <div class="th-card-body" id="thBody"></div>
      </div>
    `;
    document.body.appendChild(modal);

    state.modal = modal;
    state.body = modal.querySelector("#thBody");

    modal.addEventListener("click", (e) => {
      if (e.target && e.target.dataset && e.target.dataset.thClose === "1") close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.modal && !state.modal.classList.contains("hidden")) close();
    });
  }

  function wireGlobalClicks() {
    if (state.wired) return;
    state.wired = true;

    document.addEventListener("click", (e) => {
      const el = e.target && e.target.closest ? e.target.closest("[data-theorem]") : null;
      if (!el) return;
      const id = el.dataset.theorem;
      open(id);
    });
  }

  async function init(opts = {}) {
    if (state.ready) return true;
    if (state.loading) return state.loading;

    state.url = opts.url || state.url;

    state.loading = (async () => {
      try {
        const res = await fetch(state.url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load: ${state.url}`);
        const json = await res.json();

        (json.items || []).forEach((item) => {
          if (item && item.id) state.byId.set(item.id, item);
        });

        ensureModal();
        wireGlobalClicks();
        state.ready = true;
        return true;
      } catch (err) {
        console.warn("[TheoremsUI] init failed:", err);
        return false;
      }
    })();

    return state.loading;
  }

  function isReady() {
    return state.ready;
  }

  function open(id) {
    const item = state.byId.get(id);
    if (!item || !state.modal) return;

    state.modal.querySelector("#thTitle").textContent = item.title || "نظرية";
    const parts = [];

    if (Array.isArray(item.contentHtml)) parts.push(item.contentHtml.join(""));
    if (item.diagram && item.diagram.svg) {
      parts.push(`<div class="th-diagram">${item.diagram.svg}</div>`);
    }

    state.body.innerHTML = parts.join("");
    state.modal.classList.remove("hidden");
    state.modal.setAttribute("aria-hidden", "false");
  }

  function close() {
    if (!state.modal) return;
    state.modal.classList.add("hidden");
    state.modal.setAttribute("aria-hidden", "true");
    state.body.innerHTML = "";
  }

  // يحاول تحويل القائمة الموجودة داخل الحل (إن وُجدت) إلى روابط قابلة للنقر
  function enhanceManualList(question, rootEl) {
    if (!rootEl) return false;

    const headings = Array.from(rootEl.querySelectorAll(".sol-h, h3, h4, strong"));
    const h = headings.find((x) => /النظريات|القوانين/.test((x.textContent || "").trim()));
    if (!h) return false;

    // ابحث عن UL بعد العنوان
    let ul = h.nextElementSibling;
    while (ul && ul.tagName !== "UL") ul = ul.nextElementSibling;
    if (!ul) return false;

    const lis = Array.from(ul.querySelectorAll("li"));
    if (!lis.length) return false;

    const ids = Array.isArray(question?.theoremsUsed) ? question.theoremsUsed : [];

    lis.forEach((li, i) => {
      const raw = (li.textContent || "").trim();
      const key = normalizeTitle(raw);

      // أولوية: ids بحسب الترتيب، ثم خريطة العناوين
      const id = ids[i] || TITLE_TO_ID[key] || TITLE_TO_ID[raw] || null;
      if (!id) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theorem-link";
      btn.dataset.theorem = id;
      btn.textContent = raw;

      li.innerHTML = "";
      li.appendChild(btn);
    });

    return true;
  }

  // إذا لم توجد قائمة نظريات داخل الحل، نضيف قسمًا تلقائيًا من question.theoremsUsed
  function renderAutoSection(question, rootEl) {
    if (!rootEl) return;

    const used = Array.isArray(question?.theoremsUsed) ? question.theoremsUsed : [];

    // امسح أي قسم سابق تمت إضافته تلقائيًا
    rootEl.querySelectorAll(".theorems-used").forEach((x) => x.remove());

    const sec = document.createElement("div");
    sec.className = "theorems-used";
    sec.innerHTML = `
      <div class="sol-h">✅ النظريات/القوانين المستخدمة</div>
      <div class="theorem-chips"></div>
      <div class="theorem-empty"></div>
    `;

    const chips = sec.querySelector(".theorem-chips");
    const empty = sec.querySelector(".theorem-empty");

    if (!used.length) {
      sec.classList.add("theorems-used--empty");
      empty.textContent = "لم تُحدَّد نظريات/قوانين لهذا السؤال بعد.";
    } else {
      empty.remove();
      used.forEach((id) => {
        const item = state.byId.get(id);
        if (!item) return;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "theorem-chip";
        b.dataset.theorem = id;
        b.textContent = item.title;
        chips.appendChild(b);
      });
    }

    rootEl.appendChild(sec);
  })();



const els = {
  list: document.getElementById("questionsList"),
  search: document.getElementById("searchInput"),
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
};

let allQuestions = [];
let filtered = [];
let activeId = null;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function normalizeArabic(s) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

function escapeHtml(str) {
  return (str ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSolutionHtml(q) {
  if (!q) return "";
  if (Array.isArray(q.solutionHtml)) return q.solutionHtml.join("\n");
  if (typeof q.solutionHtml === "string") return q.solutionHtml;
  return "";
}


function applyTheoremsUI(q) {
  if (!window.TheoremsUI) return;

  // نحمي من تطبيق متأخر على سؤال قديم
  const id = q?.id;

  window.TheoremsUI.init({ url: THEOREMS_URL }).then((ok) => {
    if (!ok) return;
    if (activeId !== id) return;
    window.TheoremsUI.apply(q, els.solution);
  });
}


function setActive(id) {
  activeId = id;
  for (const btn of els.list.querySelectorAll(".qbtn")) {
    btn.classList.toggle("active", btn.dataset.id === id);
  }
}

function findIndexById(arr, id) {
  return arr.findIndex((q) => q.id === id);
}

function updateNavButtons() {
  const idx = findIndexById(filtered, activeId);
  els.prev.disabled = idx <= 0;
  els.next.disabled = idx < 0 || idx >= filtered.length - 1;
}

function openModal(src, caption) {
  els.modalImg.src = src;
  els.modalImg.alt = caption || "";
  els.modalCap.textContent = caption || "";
  els.modal.classList.remove("hidden");
  els.modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  els.modal.classList.add("hidden");
  els.modal.setAttribute("aria-hidden", "true");
  els.modalImg.src = "";
}

function renderGallery(q) {
  els.gallery.innerHTML = "";

  const imgs = Array.isArray(q.images) ? q.images : [];
  if (!imgs.length) {
    els.gallery.innerHTML = `<div class="meta">لا توجد صور لهذا السؤال.</div>`;
    return;
  }

  imgs.forEach((src, i) => {
    const cap = `صورة ${i + 1} — ${q.title} (${q.id})`;
    const item = document.createElement("div");
    item.className = "gallery__item";
    item.tabIndex = 0;

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = src;
    img.alt = cap;

    // إذا كانت صورة غير موجودة، نخفيها بدل ما نتركها مكسورة
    img.onerror = () => {
      item.remove();
      if (!els.gallery.children.length) {
        els.gallery.innerHTML = `<div class="meta">لم يتم العثور على صور (تأكد من أسماء الملفات داخل images/).</div>`;
      }
    };

    const footer = document.createElement("div");
    footer.className = "gallery__cap";
    footer.textContent = cap;

    item.appendChild(img);
    item.appendChild(footer);

    const open = () => openModal(src, cap);
    item.addEventListener("click", open);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") open();
    });

    els.gallery.appendChild(item);
  });
}

function renderSolution(q) {
  els.title.textContent = q.title;
  els.meta.textContent = `المعرّف: ${q.id} — رقم السؤال: ${q.number}`;

  // الحل: HTML (عمودين/طرق متعددة) إن وُجد، وإلا عرض نصي عادي
  const html = getSolutionHtml(q).trim();
  if (html) {
    els.solution.innerHTML = html;
  } else {
    const lines = Array.isArray(q.solution) ? q.solution : [];
    els.solution.innerHTML = `<pre class="solution solution-pre">${escapeHtml(lines.join("\n"))}</pre>`;
  }

  renderGallery(q);

  setActive(q.id);
  updateNavButtons();
  location.hash = q.id;

  // تفعيل بطاقات النظريات/القوانين (إن وُجدت)
  applyTheoremsUI(q);
}

function renderList() {
  els.list.innerHTML = "";
  filtered.forEach((q) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qbtn";
    btn.dataset.id = q.id;

    const num = document.createElement("div");
    num.className = "qbtn__num";
    num.textContent = `Q${pad2(q.number)}`;

    const title = document.createElement("div");
    title.className = "qbtn__title";
    title.textContent = q.title;

    btn.appendChild(title);
    btn.appendChild(num);

    btn.addEventListener("click", () => renderSolution(q));
    els.list.appendChild(btn);
  });
}

function applyFilter() {
  const q = normalizeArabic(els.search.value);
  if (!q) {
    filtered = [...allQuestions];
  } else {
    filtered = allQuestions.filter((item) => {
      const hay = normalizeArabic(`${item.id} ${item.title} ${item.number}`);
      return hay.includes(q);
    });
  }

  renderList();

  // إذا السؤال الحالي اختفى بسبب الفلترة، افتح أول نتيجة
  if (!filtered.some((x) => x.id === activeId)) {
    if (filtered.length) renderSolution(filtered[0]);
    else {
      activeId = null;
      els.title.textContent = "لا توجد نتائج";
      els.meta.textContent = "";
      els.solution.innerHTML = `<div class="solution-empty">جرّب كلمة بحث أخرى.</div>`;
      els.gallery.innerHTML = "";
      updateNavButtons();
    }
  } else {
    setActive(activeId);
    updateNavButtons();
  }
}

async function init() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  const data = await res.json();
  allQuestions = Array.isArray(data.questions) ? data.questions : [];
  filtered = [...allQuestions];

  // preloadTheoremsUI
  if (window.TheoremsUI) window.TheoremsUI.init({ url: THEOREMS_URL });

  renderList();

  const hashId = (location.hash || "").replace("#", "").trim();
  if (hashId) {
    const q = allQuestions.find((x) => x.id === hashId);
    if (q) {
      renderSolution(q);
      return;
    }
  }

  // افتراضيًا افتح السؤال الأول
  if (filtered.length) renderSolution(filtered[0]);
}

els.search.addEventListener("input", applyFilter);

els.prev.addEventListener("click", () => {
  const idx = findIndexById(filtered, activeId);
  if (idx > 0) renderSolution(filtered[idx - 1]);
});
els.next.addEventListener("click", () => {
  const idx = findIndexById(filtered, activeId);
  if (idx >= 0 && idx < filtered.length - 1) renderSolution(filtered[idx + 1]);
});

// Modal events
els.modalClose.addEventListener("click", closeModal);
els.modalBackdrop.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modal.classList.contains("hidden")) closeModal();
});

init().catch((err) => {
  els.title.textContent = "خطأ في تحميل البيانات";
  els.solution.innerHTML = `<pre class="solution solution-pre">${escapeHtml(String(err))}</pre>`;
});

