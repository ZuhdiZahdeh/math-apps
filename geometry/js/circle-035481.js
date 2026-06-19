import { byId, escapeHtml, normalizeArabic, shorten } from "./utils.js";
import { loadTheorems, getAllTheorems, buildReferenceHref } from "./theorems-store.js";

const COURSE_CODE = "035481-circle";

const els = {
  root: byId("circleTheoremsRoot"),
  search: byId("circleSearch"),
  family: byId("circleFamilyFilter"),
  stats: byId("circleStats"),
  chips: byId("familyChips"),
};

let courseItems = [];
let activeFamily = "";

function getFamilyList(items) {
  const map = new Map();
  for (const item of items) {
    const family = item.course?.family || item.category || "غير مصنف";
    const order = item.course?.familyOrder || 999;
    if (!map.has(family)) map.set(family, { family, order, count: 0, summary: item.course?.familySummary || "" });
    map.get(family).count += 1;
  }
  return [...map.values()].sort((a, b) => a.order - b.order || a.family.localeCompare(b.family, "ar"));
}

function titleWithoutCourseNumber(title) {
  return String(title || "").replace(/^نظرية\s+\d+\s*:\s*/, "");
}

function theoremBlob(theorem) {
  return normalizeArabic([
    theorem.title,
    theorem.statement,
    theorem.short,
    theorem.explanation,
    theorem.given,
    theorem.required,
    theorem.symbolic,
    theorem.course?.family,
    theorem.course?.label,
    theorem.course?.code,
    ...(theorem.tags || []),
  ].join(" "));
}

function populateFamilyFilter() {
  const families = getFamilyList(courseItems);
  els.family.innerHTML = `<option value="">كل العائلات</option>`;
  for (const family of families) {
    const option = document.createElement("option");
    option.value = family.family;
    option.textContent = `${family.family} (${family.count})`;
    els.family.appendChild(option);
  }
}

function renderFamilyChips() {
  const families = getFamilyList(courseItems);
  els.chips.innerHTML = `
    <button class="info-chip circle-family-chip ${!activeFamily ? "is-active" : ""}" type="button" data-family="">كل النظريات</button>
    ${families.map((family) => `
      <button class="info-chip circle-family-chip ${activeFamily === family.family ? "is-active" : ""}" type="button" data-family="${escapeHtml(family.family)}">
        ${escapeHtml(family.family)} · ${escapeHtml(String(family.count))}
      </button>
    `).join("")}
  `;
  for (const chip of els.chips.querySelectorAll("[data-family]")) {
    chip.addEventListener("click", () => {
      activeFamily = chip.dataset.family || "";
      els.family.value = activeFamily;
      render();
    });
  }
}

function groupByFamily(items) {
  const groups = new Map();
  for (const item of items) {
    const family = item.course?.family || "غير مصنف";
    if (!groups.has(family)) groups.set(family, []);
    groups.get(family).push(item);
  }
  return [...groups.entries()].sort((a, b) => {
    const ao = a[1][0]?.course?.familyOrder || 999;
    const bo = b[1][0]?.course?.familyOrder || 999;
    return ao - bo || a[0].localeCompare(b[0], "ar");
  });
}

function renderTheoremCard(theorem) {
  const order = theorem.course?.order || "";
  const family = theorem.course?.family || theorem.category || "";
  return `
    <article class="circle-theorem-card" id="${escapeHtml(theorem.id)}">
      <div class="circle-card-head">
        <span class="mini-badge">نظرية ${escapeHtml(String(order).padStart(2, "0"))}</span>
        <span class="mini-badge mini-badge--soft">${escapeHtml(family)}</span>
      </div>
      <h3 class="circle-card-title">${escapeHtml(titleWithoutCourseNumber(theorem.title))}</h3>
      <p class="circle-card-statement">${escapeHtml(theorem.statement || "")}</p>
      <div class="circle-detail-grid">
        <div class="circle-detail">
          <div class="circle-detail__label">المعطى</div>
          <p>${escapeHtml(theorem.given || theorem.short || "")}</p>
        </div>
        <div class="circle-detail">
          <div class="circle-detail__label">النتيجة المطلوبة</div>
          <p>${escapeHtml(theorem.required || "")}</p>
        </div>
        <div class="circle-detail circle-detail--wide">
          <div class="circle-detail__label">متى أستخدمها؟</div>
          <p>${escapeHtml(theorem.explanation || shorten(theorem.statement || "", 180))}</p>
        </div>
      </div>
      ${theorem.symbolic ? `<div class="mathline">${escapeHtml(theorem.symbolic)}</div>` : ""}
      <div class="circle-card-actions">
        <a class="btn btn--success btn--sm" href="${escapeHtml(buildReferenceHref(theorem.id, "plane"))}">فتح البطاقة الكاملة في مرجع النظريات</a>
      </div>
    </article>
  `;
}

function renderStats(filtered) {
  const families = getFamilyList(courseItems).length;
  els.stats.innerHTML = `
    <span class="stat-chip stat-chip--primary">${escapeHtml(String(courseItems.length))} نظرية مضافة</span>
    <span class="stat-chip">${escapeHtml(String(families))} عائلات</span>
    <span class="stat-chip stat-chip--soft">${escapeHtml(String(filtered.length))} نتيجة معروضة</span>
  `;
}

function render() {
  const query = normalizeArabic(els.search.value || "");
  activeFamily = els.family.value || activeFamily || "";

  const filtered = courseItems.filter((item) => {
    if (activeFamily && item.course?.family !== activeFamily) return false;
    if (query && !theoremBlob(item).includes(query)) return false;
    return true;
  });

  renderFamilyChips();
  renderStats(filtered);

  if (!filtered.length) {
    els.root.innerHTML = `<div class="empty-state">لا توجد نظرية مطابقة للبحث أو الفلتر الحالي.</div>`;
    return;
  }

  const groups = groupByFamily(filtered);
  els.root.innerHTML = groups.map(([family, items]) => {
    const summary = items[0]?.course?.familySummary || "";
    return `
      <section class="circle-family-section">
        <div class="circle-family-head">
          <div>
            <h2>${escapeHtml(family)}</h2>
            ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
          </div>
          <span class="badge">${escapeHtml(String(items.length))} نظرية</span>
        </div>
        <div class="circle-card-grid">
          ${items.map(renderTheoremCard).join("")}
        </div>
      </section>
    `;
  }).join("");
}

async function init() {
  await loadTheorems();
  courseItems = getAllTheorems()
    .filter((item) => item.course?.code === COURSE_CODE)
    .sort((a, b) => (a.course?.order || 999) - (b.course?.order || 999));

  populateFamilyFilter();
  els.search.addEventListener("input", () => render());
  els.family.addEventListener("change", () => {
    activeFamily = els.family.value || "";
    render();
  });
  render();
}

init();
