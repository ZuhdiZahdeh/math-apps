/* theorems-ui.js */
(() => {
  const state = {
    ready: false,
    url: "data/theorems.json",
    byId: new Map(),
    modal: null,
    modalBody: null
  };

  // تطابق نصوص (للأسئلة التي عندها قائمة نظريات داخل الحل)
  const TITLE_TO_ID = {
    "نظرية القطعة المتوسطة في المثلث + عكسها": "midsegment_triangle_bundle",
    "نظرية القطعة المتوسطة في المثلث + عكسها.": "midsegment_triangle_bundle",
    "معيار متوازي الأضلاع: ضلعان متقابلان متوازيان ومتساويان": "parallelogram_test_opposite_parallel_equal",
    "معيار متوازي الأضلاع: ضلعان متقابلان متوازيان ومتساويان.": "parallelogram_test_opposite_parallel_equal",
    "خواص متوازي الأضلاع: الأضلاع المتقابلة متساوية": "parallelogram_property_opposite_sides_equal",
    "خواص متوازي الأضلاع: الأضلاع المتقابلة متساوية.": "parallelogram_property_opposite_sides_equal",
  };

  function normalizeTitle(s) {
    return (s || "")
      .replace(/^[-•\s]+/, "")
      .replace(/\s+/g, " ")
      .replace(/[.،]\s*$/g, "")
      .trim();
  }

  async function init(opts = {}) {
    if (state.ready) return true;
    state.url = opts.url || state.url;

    try {
      const res = await fetch(state.url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load theorems.json");
      const json = await res.json();

      (json.items || []).forEach(item => state.byId.set(item.id, item));
      ensureModal();
      wireGlobalClicks();

      state.ready = true;
      return true;
    } catch (e) {
      console.warn("[TheoremsUI] init failed:", e);
      return false;
    }
  }

  function ensureModal() {
    if (state.modal) return;

    const modal = document.createElement("div");
    modal.id = "theoremModal";
    modal.className = "th-modal hidden";
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
    state.modalBody = modal.querySelector("#thBody");

    modal.addEventListener("click", (e) => {
      if (e.target && e.target.dataset && e.target.dataset.thClose === "1") close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  function wireGlobalClicks() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest && e.target.closest("[data-theorem]");
      if (!btn) return;
      const id = btn.dataset.theorem;
      open(id);
    });
  }

  function open(id) {
    const item = state.byId.get(id);
    if (!item) return;

    state.modal.querySelector("#thTitle").textContent = item.title || "نظرية";
    const bodyParts = [];

    // محتوى نصي
    if (Array.isArray(item.contentHtml)) bodyParts.push(item.contentHtml.join(""));

    // رسمة: SVG أو صورة
    if (item.diagram && item.diagram.svg) {
      bodyParts.push(`<div class="th-diagram">${item.diagram.svg}</div>`);
    } else if (item.diagram && item.diagram.image) {
      const alt = item.diagram.alt || item.title || "diagram";
      bodyParts.push(`<div class="th-diagram"><img src="${item.diagram.image}" alt="${alt}" /></div>`);
    }

    state.modalBody.innerHTML = bodyParts.join("");
    state.modal.classList.remove("hidden");
  }

  function close() {
    if (!state.modal) return;
    state.modal.classList.add("hidden");
  }

  // يبحث عن قسم "✅ النظريات/القوانين المستخدمة" داخل الحل ويحوّل البنود إلى روابط
  function enhanceManualList(question, rootEl) {
    const headings = Array.from(rootEl.querySelectorAll(".sol-h"));
    const h = headings.find(x => (x.textContent || "").includes("النظريات/القوانين"));
    if (!h) return false;

    let ul = h.nextElementSibling;
    while (ul && ul.tagName !== "UL") ul = ul.nextElementSibling;
    if (!ul) return false;

    const lis = Array.from(ul.querySelectorAll("li"));
    const ids = Array.isArray(question?.theoremsUsed) ? question.theoremsUsed : [];

    lis.forEach((li, i) => {
      const raw = li.textContent || "";
      const t = normalizeTitle(raw);

      let id = ids[i] || TITLE_TO_ID[t] || TITLE_TO_ID[raw.trim()];
      if (!id) return; // لا يوجد تعريف لها في theorems.json

      // حوّل النص إلى زر قابل للنقر
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theorem-link";
      btn.dataset.theorem = id;
      btn.textContent = raw.trim();

      li.innerHTML = "";
      li.appendChild(btn);
    });

    return true;
  }

  // إذا لم يوجد قسم نظريات داخل الحل، نضيفه تلقائيًا من theoremsUsed
  function renderAutoSection(question, rootEl) {
    const used = Array.isArray(question?.theoremsUsed) ? question.theoremsUsed : [];
    if (!used.length) return;

    // امسح أي قسم سابق تمت إضافته
    rootEl.querySelectorAll(".theorems-used").forEach(x => x.remove());

    const sec = document.createElement("div");
    sec.className = "theorems-used";
    sec.innerHTML = `<div class="sol-h">✅ النظريات/القوانين المستخدمة</div><div class="theorem-chips"></div>`;

    const chips = sec.querySelector(".theorem-chips");
    used.forEach(id => {
      const item = state.byId.get(id);
      if (!item) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "theorem-chip";
      b.dataset.theorem = id;
      b.textContent = item.title;
      chips.appendChild(b);
    });

    rootEl.appendChild(sec);
  }

  // تُستدعى بعد عرض الحل
  function apply(question, rootEl) {
    if (!state.ready || !rootEl) return;

    // 1) حاول تفعيل القائمة الموجودة داخل الحل (إن وُجدت)
    const hasManual = enhanceManualList(question, rootEl);

    // 2) إن لم توجد، أضف قسمًا تلقائيًا من theoremsUsed
    if (!hasManual) renderAutoSection(question, rootEl);
  }

  window.TheoremsUI = { init, apply, open, close };
})();
