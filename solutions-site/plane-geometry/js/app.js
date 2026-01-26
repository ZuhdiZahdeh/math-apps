/* حلول الهندسة المستوية — س1 إلى س37 */
const DATA_URL = "./data/solutions.json";

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

