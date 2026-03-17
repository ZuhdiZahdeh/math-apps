/* theorems-ui.js
   بطاقات نظريات/قوانين قابلة للنقر (Modal/Card)
   يعتمد على: data/theorems.json
*/

(() => {
  const state = {
    ready: false,
    loading: null,
    url: "data/theorems.json",
    byId: new Map(),
    titleIndex: new Map(),
    modal: null,
    modalBody: null,
    wired: false,
  };

  // تطابق نصوص شائعة إلى IDs داخل theorems.json
  // ملاحظة: الأفضل دائمًا تزويد question.theoremsUsed (IDs) لضمان الربط.
  const TITLE_TO_ID = {
    "نظرية القطعة المتوسطة في المثلث + عكسها": "midsegment_triangle_bundle",
    "نظرية القطعة المتوسطة في المثلث + عكسها.": "midsegment_triangle_bundle",
    "نظرية القطعة المتوسطة في المثلث والعكس": "midsegment_triangle_bundle",
    "نظرية القطعة المتوسطة في المثلث (والعكس)": "midsegment_triangle_bundle",
    "نظرية القطعة المتوسطة في المثلث (والعكس).": "midsegment_triangle_bundle",

    "معيار متوازي الأضلاع": "parallelogram_test_opposite_parallel_equal",
    "معيار متوازي الأضلاع: ضلعان متقابلان متوازيان ومتساويان": "parallelogram_test_opposite_parallel_equal",
    "معيار متوازي الأضلاع: ضلعان متقابلان متوازيان ومتساويان.": "parallelogram_test_opposite_parallel_equal",

    "خواص متوازي الأضلاع": "parallelogram_property_opposite_sides_equal",
    "خواص متوازي الأضلاع: الأضلاع المتقابلة متساوية": "parallelogram_property_opposite_sides_equal",
    "خواص متوازي الأضلاع: الأضلاع المتقابلة متساوية.": "parallelogram_property_opposite_sides_equal",
  };

  function normalizeTitle(s) {
    return (s || "")
      .toString()
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
    state.modalBody = modal.querySelector("#thBody");

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

    // Event delegation لأي زر/عنصر يحمل data-theorem
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest("[data-theorem]") : null;
      if (!btn) return;
      open(btn.dataset.theorem);
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
        state.byId.clear();
        state.titleIndex.clear();

        (json.items || []).forEach((item) => {
          if (!item || !item.id) return;
          state.byId.set(item.id, item);
          if (item.title) state.titleIndex.set(normalizeTitle(item.title), item.id);
        });

        ensureModal();
        wireGlobalClicks();

        state.ready = true;
        return true;
      } catch (e) {
        console.warn("[TheoremsUI] init failed:", e);
        state.ready = false;
        return false;
      } finally {
        state.loading = null;
      }
    })();

    return state.loading;
  }

  function open(id) {
    if (!id) return;
    const item = state.byId.get(id);
    if (!item) return;

    ensureModal();
    if (!state.modal || !state.modalBody) return;

    state.modal.querySelector("#thTitle").textContent = item.title || "نظرية";

    const bodyParts = [];
    // نص النظرية + التعبير الرياضي
    if (Array.isArray(item.contentHtml)) bodyParts.push(item.contentHtml.join(""));

    // رسمة SVG/صورة
    if (item.diagram && item.diagram.svg) {
      bodyParts.push(`<div class="th-diagram">${item.diagram.svg}</div>`);
    } else if (item.diagram && item.diagram.image) {
      const alt = item.diagram.alt || item.title || "diagram";
      bodyParts.push(`<div class="th-diagram"><img src="${item.diagram.image}" alt="${alt}" /></div>`);
    }

    state.modalBody.innerHTML = bodyParts.join("");
    state.modal.classList.remove("hidden");
    state.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("th-no-scroll");
  }

  function close() {
    if (!state.modal) return;
    state.modal.classList.add("hidden");
    state.modal.setAttribute("aria-hidden", "true");
    if (state.modalBody) state.modalBody.innerHTML = "";
    document.body.classList.remove("th-no-scroll");
  }

  // يبحث عن قسم "✅ النظريات/القوانين المستخدمة" داخل الحل ويحوّل البنود إلى روابط
  function enhanceManualList(question, rootEl) {
    if (!rootEl) return false;

    const headings = Array.from(rootEl.querySelectorAll(".sol-h, h3, h4, strong"));
    const h = headings.find((x) => /النظريات|القوانين/.test((x.textContent || "").trim()));
    if (!h) return false;

    let ul = h.nextElementSibling;
    while (ul && ul.tagName !== "UL") ul = ul.nextElementSibling;
    if (!ul) return false;

    const lis = Array.from(ul.querySelectorAll("li"));
    if (!lis.length) return false;

    const ids = Array.isArray(question?.theoremsUsed) ? question.theoremsUsed : [];

    let enhancedCount = 0;
    lis.forEach((li, i) => {
      // إذا كان البند أصبح زرًا سابقًا، لا نعيده
      if (li.querySelector && li.querySelector("[data-theorem]")) return;

      const raw = (li.textContent || "").trim();
      const key = normalizeTitle(raw);

      // أولوية: ids بحسب الترتيب، ثم خريطة العناوين، ثم مطابقة مباشرة بعنوان النظرية
      const id =
        ids[i] ||
        TITLE_TO_ID[key] ||
        TITLE_TO_ID[raw] ||
        state.titleIndex.get(key) ||
        null;

      if (!id) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theorem-link";
      btn.dataset.theorem = id;
      btn.textContent = raw;

      li.innerHTML = "";
      li.appendChild(btn);
      enhancedCount += 1;
    });

    return enhancedCount > 0;
  }

  // إذا لم يوجد قسم نظريات داخل الحل، نضيفه تلقائيًا من theoremsUsed
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

      if (!chips.children.length) {
        sec.classList.add("theorems-used--empty");
        sec.querySelector(".theorem-empty").textContent = "لم يتم العثور على تعريفات النظريات (تحقق من theorems.json).";
      }
    }

    rootEl.appendChild(sec);
  }

  function apply(question, rootEl) {
    if (!rootEl) return;
    if (!state.ready) return;

    // امسح القسم التلقائي السابق (حتى لا يتكرر عند التنقل)
    rootEl.querySelectorAll(".theorems-used").forEach((x) => x.remove());

    // لو يوجد قائمة نظريات داخل الحل: حول البنود إلى أزرار
    const ok = enhanceManualList(question, rootEl);

    // وإلا: أضف القسم تلقائيًا من theoremsUsed
    if (!ok) renderAutoSection(question, rootEl);
  }

  // واجهة عامة
  window.TheoremsUI = {
    init,
    open,
    close,
    apply,
    isReady: () => state.ready,
  };
})();
