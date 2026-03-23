export const byId = (id) => document.getElementById(id);

export function uniq(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

export function pad2(n) {
  return String(n ?? "").padStart(2, "0");
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
}

export function normalizeArabic(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/\s+/g, " ");
}

export async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return await res.json();
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

let imageModalState = null;

export function ensureImageModal() {
  if (imageModalState) return imageModalState;
  const wrap = document.createElement("div");
  wrap.className = "modal hidden";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = `
    <div class="modal__backdrop" data-close="1"></div>
    <div class="modal__panel" role="dialog" aria-modal="true">
      <button class="modal__close" type="button" aria-label="إغلاق" data-close="1">✕</button>
      <img class="modal__img" alt="" />
      <div class="modal__caption"></div>
    </div>
  `;
  document.body.appendChild(wrap);

  const img = wrap.querySelector(".modal__img");
  const cap = wrap.querySelector(".modal__caption");

  const close = () => {
    wrap.classList.add("hidden");
    wrap.setAttribute("aria-hidden", "true");
    img.src = "";
  };

  wrap.addEventListener("click", (e) => {
    if (e.target?.dataset?.close) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !wrap.classList.contains("hidden")) close();
  });

  imageModalState = { wrap, img, cap, close };
  return imageModalState;
}

export function openImageModal(src, caption = "") {
  const modal = ensureImageModal();
  modal.img.src = src;
  modal.img.alt = caption || "";
  modal.cap.textContent = caption || "";
  modal.wrap.classList.remove("hidden");
  modal.wrap.setAttribute("aria-hidden", "false");
}

export function shorten(text, max = 200) {
  const raw = String(text ?? "").trim();
  return raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;
}


export function initResponsiveSidebar({
  pageKey = "shared",
  mobileMaxWidth = 980,
  sidebarId = "pageSidebar",
  toggleId = "sidebarToggle",
  closeId = "sidebarClose",
  selectionSelector = ".qbtn",
  focusTargetId = null,
} = {}) {
  const sidebar = byId(sidebarId);
  const toggle = byId(toggleId);
  if (!sidebar || !toggle) {
    return {
      isMobile: () => false,
      open: () => {},
      close: () => {},
      sync: () => {},
    };
  }

  const closeBtn = byId(closeId);
  const focusTarget = focusTargetId ? byId(focusTargetId) : sidebar.querySelector("input, select, button, [tabindex]");
  const storageKey = `geometry_${pageKey}_sidebar_collapsed`;
  const mql = window.matchMedia(`(max-width: ${mobileMaxWidth}px)`);

  const backdrop = document.createElement("button");
  backdrop.type = "button";
  backdrop.className = "sidebar-backdrop";
  backdrop.setAttribute("aria-hidden", "true");
  backdrop.tabIndex = -1;
  document.body.appendChild(backdrop);

  const listSection = sidebar.querySelector(".sidebar-section--list");
  let collapsed = localStorage.getItem(storageKey) === "1";

  function isMobile() {
    return mql.matches;
  }

  function ensureListOpenForRail() {
    if (listSection) listSection.open = true;
  }

  function updateToggleUI() {
    const opened = document.body.classList.contains("sidebar-open");
    const label = isMobile()
      ? (opened ? "إغلاق القائمة" : "فتح القائمة")
      : (collapsed ? "إظهار الفهرس" : "طي الفهرس");

    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
    toggle.setAttribute("aria-expanded", String(isMobile() ? opened : !collapsed));

    const text = toggle.querySelector(".sidebar-toggle__text");
    if (text) text.textContent = isMobile() ? "القائمة" : (collapsed ? "إظهار الفهرس" : "طي الفهرس");
  }

  function openSidebar() {
    if (!isMobile()) return;
    document.body.classList.add("sidebar-open");
    sidebar.setAttribute("aria-hidden", "false");
    if (focusTarget) {
      window.setTimeout(() => {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch {
          focusTarget.focus();
        }
      }, 40);
    }
    updateToggleUI();
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    if (isMobile()) sidebar.setAttribute("aria-hidden", "true");
    updateToggleUI();
  }

  function sync() {
    if (isMobile()) {
      document.body.classList.remove("sidebar-collapsed");
      sidebar.setAttribute("aria-hidden", document.body.classList.contains("sidebar-open") ? "false" : "true");
    } else {
      document.body.classList.remove("sidebar-open");
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      sidebar.setAttribute("aria-hidden", "false");
      if (collapsed) ensureListOpenForRail();
    }
    updateToggleUI();
  }

  function toggleSidebar() {
    if (isMobile()) {
      if (document.body.classList.contains("sidebar-open")) closeSidebar();
      else openSidebar();
      return;
    }

    collapsed = !collapsed;
    localStorage.setItem(storageKey, collapsed ? "1" : "0");
    if (collapsed) ensureListOpenForRail();
    sync();
  }

  toggle.addEventListener("click", toggleSidebar);
  backdrop.addEventListener("click", closeSidebar);
  closeBtn?.addEventListener("click", closeSidebar);

  sidebar.addEventListener("click", (e) => {
    if (isMobile() && e.target.closest(selectionSelector)) {
      closeSidebar();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("sidebar-open")) {
      closeSidebar();
    }
  });

  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", sync);
  } else if (typeof mql.addListener === "function") {
    mql.addListener(sync);
  }

  sync();

  return {
    isMobile,
    open: openSidebar,
    close: closeSidebar,
    sync,
  };
}
