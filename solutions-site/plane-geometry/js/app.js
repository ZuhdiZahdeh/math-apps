/* حلول الهندسة المستوية — واجهة محسّنة */
const DATASETS = { book: "./data/solutions.json", final: "./data/final-solutions.json" };
const THEOREMS_URL = "./data/theorems.json";

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
  return (str ?? "").toString().replace(/\.\s+/g, ".\n");
}

function applyDotLineBreaks(rootEl) {
  if (!rootEl) return;
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null, false);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.nodeValue;
    if (!text || !text.includes(".")) continue;
    const replaced = dotToNewline(text);
    if (replaced !== text) node.nodeValue = replaced;
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

function getDatasetLabel(name = currentDataset) {
  return name === "book" ? "أسئلة الكتاب" : "الأسئلة النهائية";
}

function renderGallery(q) {
  els.gallery.innerHTML = "";
  const imgs = Array.isArray(q.images) ? q.images : [];

  if (!imgs.length) {
    els.gallery.innerHTML = `<div class="gallery__empty">لا توجد صور لهذا السؤال.</div>`;
    return;
  }

  imgs.forEach((src, i) => {
    const cap = `صورة ${i + 1} — ${q.title}`;
    const item = document.createElement("div");
    item.className = "gallery__item";
    item.tabIndex = 0;

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = src;
    img.alt = cap;

    img.onerror = () => {
      item.remove();
      if (!els.gallery.children.length) {
        els.gallery.innerHTML = `<div class="gallery__empty">لم يتم العثور على الصور داخل المسار الحالي. تأكد من مجلد <span dir="ltr">images/</span>.</div>`;
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

function renderMeta(q) {
  const datasetLabel = getDatasetLabel();
  const theoremCount = Array.isArray(q?.theoremsUsed)
    ? q.theoremsUsed.filter(Boolean).length
    : 0;
  const currentIndex = findIndexById(filtered, q.id);

  const parts = [
    `<span class="meta-chip">${datasetLabel}</span>`,
    `<span>السؤال ${escapeHtml(String(q.number))}</span>`,
  ];

  if (currentIndex >= 0) {
    parts.push(`<span>${currentIndex + 1} من ${filtered.length}</span>`);
  }

  if (theoremCount) {
    parts.push(`<span>مرتبط بـ ${theoremCount} نظرية</span>`);
  }

  els.meta.innerHTML = parts.join('<span class="meta-dot">•</span>');
}

function renderSolution(q) {
  els.title.textContent = q.title;
  renderMeta(q);

  const html = getSolutionHtml(q).trim();
  if (html) {
    els.solution.innerHTML = html;
  } else {
    const lines = Array.isArray(q.solution)
      ? q.solution
      : (typeof q.solution === "string" ? [q.solution] : []);
    els.solution.innerHTML = `<pre class="solution solution-pre">${escapeHtml(lines.join("\n"))}</pre>`;
  }

  applyDotLineBreaks(els.solution);
  renderGallery(q);
  setActive(q.id);
  updateNavButtons();
  location.hash = q.id;
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

function renderEmptySearchState() {
  activeId = null;
  els.title.textContent = "لا توجد نتائج مطابقة";
  els.meta.textContent = "";
  els.solution.innerHTML = `<div class="empty-state">جرّب كلمة بحث أخرى أو امسح البحث لعرض كل الأسئلة.</div>`;
  els.gallery.innerHTML = "";
  updateNavButtons();
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

  if (!filtered.length) {
    renderEmptySearchState();
    return;
  }

  if (!filtered.some((x) => x.id === activeId)) {
    renderSolution(filtered[0]);
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
    els.datasetBadge.textContent = isBook ? "الكتاب" : "النهائي";
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

  if (filtered.length) {
    renderSolution(filtered[0]);
  } else {
    renderEmptySearchState();
  }
}

async function init() {
  if (window.TheoremsUI) window.TheoremsUI.init({ url: THEOREMS_URL });

  const hashId = getHashId();
  const initialDataset = inferDatasetFromHash(hashId);

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

els.modalClose.addEventListener("click", closeModal);
els.modalBackdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modal.classList.contains("hidden")) closeModal();
});

window.addEventListener("hashchange", async () => {
  const hashId = getHashId();
  if (!hashId) return;

  const wantedDataset = inferDatasetFromHash(hashId);
  if (wantedDataset !== currentDataset) {
    await switchDataset(wantedDataset, { openHash: true });
    return;
  }

  const q = allQuestions.find((item) => item.id === hashId);
  if (q) renderSolution(q);
});

init().catch((err) => {
  els.title.textContent = "حدث خطأ أثناء تحميل البيانات";
  els.meta.textContent = "";
  els.solution.innerHTML = `<pre class="solution solution-pre">${escapeHtml(String(err))}</pre>`;
});
