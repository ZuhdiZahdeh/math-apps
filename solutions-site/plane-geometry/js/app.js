/* حلول الهندسة المستوية — س1 إلى س41 */
const DATASETS = { book: "./data/solutions.json", final: "./data/final-solutions.json" };
const THEOREMS_URL = "./data/theorems.json";


/* =========================
   Theorems UI (Clickable Cards)
   - يولّد شريحة/أزرار للنظريات أسفل الحل اعتمادًا على q.theoremsUsed
   - عند الضغط يظهر كرت/بطاقة فيها تفاصيل النظرية + الرسوم/الصور
   ========================= */
(function () {
  if (window.TheoremsUI) return; // لا نعيد تعريفها إذا كانت موجودة من ملف آخر

  const state = {
    url: null,
    loaded: false,
    loading: null,
    map: new Map(), // id -> theorem
    modal: null,
    titleEl: null,
    bodyEl: null,
  };

  function escapeHtmlLocal(str) {
    return (str ?? "")
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getTheoremHtml(th) {
    if (!th) return "";
    if (Array.isArray(th.contentHtml)) return th.contentHtml.join("");
    if (typeof th.contentHtml === "string") return th.contentHtml;

    // fallback بسيط (إن لم يوجد contentHtml)
    let html = "<div class='th-section'>";
    if (th.title) html += `<div class='th-title'>${escapeHtmlLocal(th.title)}</div>`;
    if (th.short) html += `<p>${escapeHtmlLocal(th.short)}</p>`;

    if (th.diagram) {
      html += "<div class='th-title'>شكل/رسم</div><div class='th-diagram'>";
      if (th.diagram.svg) html += th.diagram.svg;
      if (th.diagram.img) html += `<img src='${escapeHtmlLocal(th.diagram.img)}' alt='' />`;
      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  function ensureModal() {
    if (state.modal) return;

    const modal = document.createElement("div");
    modal.className = "th-modal hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    modal.innerHTML = `
      <div class="th-backdrop" data-th-close="1"></div>
      <div class="th-card" role="document">
        <div class="th-card-head">
          <div class="th-card-title"></div>
          <button type="button" class="th-close" aria-label="إغلاق" data-th-close="1">×</button>
        </div>
        <div class="th-card-body"></div>
      </div>
    `;

    document.body.appendChild(modal);

    state.modal = modal;
    state.titleEl = modal.querySelector(".th-card-title");
    state.bodyEl = modal.querySelector(".th-card-body");

    // إغلاق
    modal.querySelectorAll("[data-th-close='1']").forEach((el) => el.addEventListener("click", closeModal));

    // Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.modal && !state.modal.classList.contains("hidden")) closeModal();
    });
  }

  function openModal(theoremId) {
    ensureModal();

    const th = state.map.get(theoremId);

    state.titleEl.textContent = th?.title || theoremId;
    state.bodyEl.innerHTML = th
      ? getTheoremHtml(th)
      : `<div class="th-section"><p>لم يتم العثور على بيانات لهذه النظرية: <code>${escapeHtmlLocal(theoremId)}</code></p></div>`;

    state.modal.classList.remove("hidden");
    document.body.classList.add("th-no-scroll");
  }

  function closeModal() {
    if (!state.modal) return;
    state.modal.classList.add("hidden");
    document.body.classList.remove("th-no-scroll");
    if (state.bodyEl) state.bodyEl.innerHTML = "";
  }

  async function loadTheorems(url) {
    if (!url) return false;

    // نفس الملف وتم تحميله سابقًا
    if (state.loaded && state.url === url) return true;

    // تحميل جارٍ
    if (state.loading) return state.loading;

    state.url = url;
    state.loading = fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data?.items)
          ? data.items
          : (Array.isArray(data?.theorems) ? data.theorems : []);

        state.map = new Map();
        items.forEach((it) => {
          if (it && it.id) state.map.set(it.id, it);
        });

        state.loaded = true;
        return true;
      })
      .catch((err) => {
        console.warn("TheoremsUI: failed to load theorems.json", err);
        state.loaded = false;
        return false;
      })
      .finally(() => {
        state.loading = null;
      });

    return state.loading;
  }

  function removeManualTheoremsSection(container) {
    // إذا كان الحل يحتوي قسمًا يدويًا بعنوان: ✅ النظريات/القوانين المستخدمة
    // قد يأتي أحيانًا كـ .sol-h أو .th-title حسب تنسيق الحل
    const headers = Array.from(container.querySelectorAll(".sol-h, .th-title"));

    headers
      .filter((el) => ((el.textContent || "").includes("النظريات/القوانين المستخدمة")))
      .forEach((h) => {
        const next = h.nextElementSibling;
        if (next && next.tagName === "UL") next.remove();
        h.remove();
      });
  }

  function apply(q, container) {
    if (!container) return;

    // أزل أي قسم مولّد سابقًا (عند الانتقال بين الأسئلة)
    container.querySelectorAll(".theorems-used[data-auto='1']").forEach((el) => el.remove());

    // أزل القسم اليدوي (إن وُجد) حتى لا يظهر مرتين
    removeManualTheoremsSection(container);

    const idsRaw = Array.isArray(q?.theoremsUsed) ? q.theoremsUsed : [];
    const ids = Array.from(new Set(idsRaw.filter(Boolean)));

    const wrap = document.createElement("div");
    wrap.className = "theorems-used";
    wrap.dataset.auto = "1";

    const title = document.createElement("div");
    title.className = "th-title";
    title.textContent = "✅ النظريات/القوانين المستخدمة";

    const chips = document.createElement("div");
    chips.className = "theorem-chips";

    wrap.appendChild(title);
    wrap.appendChild(chips);

    if (!ids.length) {
      wrap.classList.add("theorems-used--empty");
      const empty = document.createElement("div");
      empty.className = "theorem-empty";
      empty.textContent = "لا توجد نظريات موثقة لهذا الحل.";
      wrap.appendChild(empty);
      container.appendChild(wrap);
      return;
    }

    ids.forEach((id) => {
      const th = state.map.get(id);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theorem-chip";
      btn.textContent = th?.title || id;
      btn.addEventListener("click", () => openModal(id));

      chips.appendChild(btn);
    });

    container.appendChild(wrap);
  }

  window.TheoremsUI = {
    init: ({ url } = {}) => loadTheorems(url),
    apply,
    open: openModal,
    close: closeModal,
  };
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

  tabBook: document.getElementById("tabBook"),
  tabFinal: document.getElementById("tabFinal"),
  datasetBadge: document.getElementById("datasetBadge"),
};

let allQuestions = [];
let filtered = [];
let activeId = null;

let currentDataset = "book";
let dataCache = { book: null, final: null };

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

function dotToNewline(str) {
  // نحول ". " (نقطة + مسافة/مسافات) إلى ".\n" لقراءة أوضح خصوصًا عند خلط العربية مع الإنجليزية
  return (str ?? "").toString().replace(/\.\s+/g, ".\n");
}

function applyDotLineBreaks(rootEl) {
  if (!rootEl) return;

  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null, false);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const t = node.nodeValue;

    // تجاهل العقد التي لا تحتوي نقطة أصلًا (تحسين بسيط للأداء)
    if (!t || !t.includes(".")) continue;

    const replaced = dotToNewline(t);
    if (replaced !== t) node.nodeValue = replaced;
  }
}

function getSolutionHtml(q) {
  if (!q) return "";
  if (Array.isArray(q.solutionHtml)) return q.solutionHtml.join("");
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
    const lines = Array.isArray(q.solution)
      ? q.solution
      : (typeof q.solution === "string" ? [q.solution] : []);
    els.solution.innerHTML = `<pre class="solution solution-pre">${escapeHtml(lines.join("\n"))}</pre>`;
  }

  // تحسين القراءة: نزول سطر بعد كل نقطة داخل الحل
  applyDotLineBreaks(els.solution);

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
  activeId = null;
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

function getHashId() {
  return (location.hash || "").replace("#", "").trim();
}

function inferDatasetFromHash(hashId) {
  if (!hashId) return "book";
  if (hashId.startsWith("qf-")) return "final";
  return "book";
}

function setTabsUI(name) {
  currentDataset = name;

  const isBook = name === "book";
  if (els.tabBook) {
    els.tabBook.classList.toggle("is-active", isBook);
    els.tabBook.setAttribute("aria-selected", isBook ? "true" : "false");
  }
  if (els.tabFinal) {
    els.tabFinal.classList.toggle("is-active", !isBook);
    els.tabFinal.setAttribute("aria-selected", !isBook ? "true" : "false");
  }
  if (els.datasetBadge) {
    els.datasetBadge.textContent = isBook ? "الكتاب" : "Final";
  }
}

async function loadDataset(name) {
  if (dataCache[name]) return dataCache[name];

  const url = DATASETS[name] || DATASETS.book;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  const questions = Array.isArray(data.questions) ? data.questions : [];

  dataCache[name] = questions;
  return questions;
}

async function switchDataset(name, { openHash = true } = {}) {
  setTabsUI(name);

  // تفريغ البحث عند تبديل المصدر لتفادي اختفاء القائمة
  if (els.search) els.search.value = "";

  allQuestions = await loadDataset(name);
  filtered = [...allQuestions];

  renderList();

  const hashId = openHash ? getHashId() : "";
  if (hashId) {
    const q = allQuestions.find((x) => x.id === hashId);
    if (q) {
      renderSolution(q);
      return;
    }
  }

  // افتراضيًا افتح أول سؤال في هذا المصدر
  if (filtered.length) renderSolution(filtered[0]);
}

async function init() {
  // preloadTheoremsUI (مشترك بين التبويبين)
  if (window.TheoremsUI) window.TheoremsUI.init({ url: THEOREMS_URL });

  const hashId = getHashId();
  const initialDataset = inferDatasetFromHash(hashId);

  // listeners للتبويبات
  if (els.tabBook) els.tabBook.addEventListener("click", () => switchDataset("book", { openHash: false }));
  if (els.tabFinal) els.tabFinal.addEventListener("click", () => switchDataset("final", { openHash: false }));

  await switchDataset(initialDataset, { openHash: true });
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

