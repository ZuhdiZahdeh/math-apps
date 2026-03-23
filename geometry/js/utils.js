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

export function getGrouping(item, fallback = {}) {
  const g = item?.grouping || {};
  return {
    accordionPrimary: g.accordionPrimary || fallback.accordionPrimary || "غير مصنف",
    accordionSecondary: g.accordionSecondary || fallback.accordionSecondary || "",
    accordionTertiary: g.accordionTertiary || fallback.accordionTertiary || "",
    sortOrder: Number.isFinite(Number(g.sortOrder))
      ? Number(g.sortOrder)
      : (Number.isFinite(Number(fallback.sortOrder)) ? Number(fallback.sortOrder) : 999999),
    searchTokens: Array.isArray(g.searchTokens)
      ? g.searchTokens
      : (Array.isArray(fallback.searchTokens) ? fallback.searchTokens : []),
  };
}

export function buildAccordionTree(items, options = {}) {
  const {
    getPrimary = () => "غير مصنف",
    getSecondary = () => "",
    getTertiary = () => "",
    getSortOrder = () => 999999,
  } = options;

  const tree = new Map();

  for (const item of items || []) {
    const primary = String(getPrimary(item) || "غير مصنف").trim();
    const secondary = String(getSecondary(item) || "").trim();
    const tertiary = String(getTertiary(item) || "").trim();
    const sortOrder = Number.isFinite(Number(getSortOrder(item))) ? Number(getSortOrder(item)) : 999999;

    if (!tree.has(primary)) {
      tree.set(primary, { label: primary, items: [], children: new Map(), sortOrder });
    }

    const primaryNode = tree.get(primary);
    primaryNode.sortOrder = Math.min(primaryNode.sortOrder, sortOrder);

    if (!secondary) {
      primaryNode.items.push(item);
      continue;
    }

    if (!primaryNode.children.has(secondary)) {
      primaryNode.children.set(secondary, { label: secondary, items: [], children: new Map(), sortOrder });
    }

    const secondaryNode = primaryNode.children.get(secondary);
    secondaryNode.sortOrder = Math.min(secondaryNode.sortOrder, sortOrder);

    if (!tertiary) {
      secondaryNode.items.push(item);
      continue;
    }

    if (!secondaryNode.children.has(tertiary)) {
      secondaryNode.children.set(tertiary, { label: tertiary, items: [], children: new Map(), sortOrder });
    }

    const tertiaryNode = secondaryNode.children.get(tertiary);
    tertiaryNode.sortOrder = Math.min(tertiaryNode.sortOrder, sortOrder);
    tertiaryNode.items.push(item);
  }

  const sortItems = (arr = []) => [...arr].sort((a, b) => {
    const aa = Number.isFinite(Number(getSortOrder(a))) ? Number(getSortOrder(a)) : 999999;
    const bb = Number.isFinite(Number(getSortOrder(b))) ? Number(getSortOrder(b)) : 999999;
    return aa - bb;
  });

  const normalizeNode = (node) => ({
    ...node,
    items: sortItems(node.items || []),
    children: node.children
      ? [...node.children.values()]
          .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "ar"))
          .map(normalizeNode)
      : [],
  });

  return [...tree.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "ar"))
    .map(normalizeNode);
}

function safeStorageGet(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore localStorage failures */
  }
}

function parseStoredArray(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function makeStableAccordionKey(parts) {
  return (parts || [])
    .filter(Boolean)
    .map((part) => normalizeArabic(part).replace(/\s+/g, "-"))
    .join("::");
}

export function saveOpenDetailKeys(root, storageKey, selector = 'details[data-acc-key]') {
  if (!root || !storageKey) return [];
  const keys = [...root.querySelectorAll(selector)]
    .filter((node) => node.open && node.dataset.accKey)
    .map((node) => node.dataset.accKey);
  safeStorageSet(storageKey, JSON.stringify(keys));
  return keys;
}

export function restoreOpenDetailKeys(
  root,
  storageKey,
  {
    selector = 'details[data-acc-key]',
    defaultOpenDepth = 1,
    forceOpenAll = false,
  } = {}
) {
  if (!root) return;

  const nodes = [...root.querySelectorAll(selector)];
  if (!nodes.length) return;

  if (forceOpenAll) {
    nodes.forEach((node) => {
      node.open = true;
    });
    return;
  }

  const savedKeys = new Set(parseStoredArray(safeStorageGet(storageKey, "[]")));
  const hasSaved = savedKeys.size > 0;

  nodes.forEach((node) => {
    if (hasSaved) {
      node.open = savedKeys.has(node.dataset.accKey);
      return;
    }

    if (node.hasAttribute("open")) return;

    const depth = Number(node.dataset.depth || defaultOpenDepth);
    node.open = depth <= defaultOpenDepth;
  });
}

export function bindPersistentDetails(
  root,
  getStorageKey,
  {
    selector = 'details[data-acc-key]',
    shouldSave = () => true,
  } = {}
) {
  if (!root || root.dataset.detailsPersistenceBound === "1") return;

  root.addEventListener("toggle", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement) || !target.matches(selector)) return;
    if (!shouldSave()) return;
    const storageKey = typeof getStorageKey === "function" ? getStorageKey() : getStorageKey;
    if (!storageKey) return;
    saveOpenDetailKeys(root, storageKey, selector);
  }, true);

  root.dataset.detailsPersistenceBound = "1";
}

export function openAncestorDetails(element, stopAt = null) {
  let node = element?.parentElement || null;
  while (node && node !== stopAt) {
    if (node.tagName === "DETAILS") {
      node.open = true;
    }
    node = node.parentElement;
  }
}

export function markAccordionPath(root, element) {
  if (!root) return;
  root.querySelectorAll(".has-active").forEach((node) => node.classList.remove("has-active"));
  let node = element?.parentElement || null;
  while (node && node !== root) {
    if (node.tagName === "DETAILS") {
      node.classList.add("has-active");
    }
    node = node.parentElement;
  }
}

export function findByDataId(root, selector, id) {
  return [...root.querySelectorAll(selector)].find((node) => node.dataset.id === id) || null;
}

export function revealSelection(
  root,
  target,
  {
    selector = ".qbtn",
    behavior = "smooth",
  } = {}
) {
  if (!root) return null;
  const element = typeof target === "string" ? findByDataId(root, selector, target) : target;
  if (!element) return null;

  openAncestorDetails(element, root);
  markAccordionPath(root, element);

  window.requestAnimationFrame(() => {
    try {
      element.scrollIntoView({ block: "nearest", inline: "nearest", behavior });
    } catch {
      element.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  });

  return element;
}

function isEditableTarget(target) {
  return Boolean(
    target &&
    (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable ||
      target.tagName === "SELECT"
    )
  );
}

export function initResponsiveSidebar({
  pageKey = "shared",
  mobileMaxWidth = 980,
  sidebarId = "pageSidebar",
  toggleId = "sidebarToggle",
  closeId = "sidebarClose",
  selectionSelector = ".qbtn",
  focusTargetId = "searchInput",
  onStateChange = null,
  persistSections = true,
} = {}) {
  const sidebar = byId(sidebarId);
  const toggle = byId(toggleId);
  if (!sidebar || !toggle) {
    return {
      isMobile: () => false,
      open: () => {},
      close: () => {},
      sync: () => {},
      toggle: () => {},
      isCollapsed: () => false,
    };
  }

  const closeBtn = byId(closeId);
  const focusTarget = focusTargetId ? byId(focusTargetId) : sidebar.querySelector("input, select, button, [tabindex]");
  const storageKey = `geometry_${pageKey}_sidebar_collapsed`;
  const sectionStorageKey = `geometry_${pageKey}_sidebar_sections`;
  const mql = window.matchMedia(`(max-width: ${mobileMaxWidth}px)`);

  let collapsed = safeStorageGet(storageKey, "0") === "1";

  let backdrop = document.querySelector(".sidebar-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "sidebar-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    backdrop.tabIndex = -1;
    document.body.appendChild(backdrop);
  }

  const listSection = sidebar.querySelector(".sidebar-section--list");

  function isMobile() {
    return mql.matches;
  }

  function ensureListSectionOpen() {
    if (listSection) listSection.open = true;
  }

  function restoreSectionState() {
    if (!persistSections) return;
    const nodes = [...sidebar.querySelectorAll(".sidebar-section[data-section-key]")];
    const saved = new Set(parseStoredArray(safeStorageGet(sectionStorageKey, "[]")));
    if (!saved.size) return;
    nodes.forEach((node) => {
      const key = node.dataset.sectionKey;
      node.open = saved.has(key);
    });
    ensureListSectionOpen();
  }

  function saveSectionState() {
    if (!persistSections) return;
    const keys = [...sidebar.querySelectorAll(".sidebar-section[data-section-key]")]
      .filter((node) => node.open && node.dataset.sectionKey)
      .map((node) => node.dataset.sectionKey);
    safeStorageSet(sectionStorageKey, JSON.stringify(keys));
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
    if (text) {
      text.textContent = isMobile() ? "القائمة" : (collapsed ? "إظهار الفهرس" : "طي الفهرس");
    }
  }

  function emitStateChange() {
    if (typeof onStateChange === "function") {
      onStateChange({
        mobile: isMobile(),
        collapsed,
        open: document.body.classList.contains("sidebar-open"),
      });
    }
  }

  function openSidebar() {
    if (!isMobile()) return;
    document.body.classList.add("sidebar-open");
    sidebar.setAttribute("aria-hidden", "false");
    updateToggleUI();
    if (focusTarget) {
      window.setTimeout(() => {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch {
          focusTarget.focus();
        }
      }, 40);
    }
    emitStateChange();
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
    if (isMobile()) sidebar.setAttribute("aria-hidden", "true");
    updateToggleUI();
    emitStateChange();
  }

  function sync() {
    restoreSectionState();

    if (isMobile()) {
      document.body.classList.remove("sidebar-collapsed");
      sidebar.setAttribute("aria-hidden", document.body.classList.contains("sidebar-open") ? "false" : "true");
    } else {
      document.body.classList.remove("sidebar-open");
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      sidebar.setAttribute("aria-hidden", "false");
      if (collapsed) ensureListSectionOpen();
    }

    updateToggleUI();
    emitStateChange();
  }

  function toggleSidebar() {
    if (isMobile()) {
      if (document.body.classList.contains("sidebar-open")) closeSidebar();
      else openSidebar();
      return;
    }

    collapsed = !collapsed;
    safeStorageSet(storageKey, collapsed ? "1" : "0");
    sync();
  }

  toggle.addEventListener("click", toggleSidebar);
  backdrop.addEventListener("click", closeSidebar);
  closeBtn?.addEventListener("click", closeSidebar);

  sidebar.addEventListener("click", (e) => {
    if (isMobile() && e.target.closest(selectionSelector)) {
      window.setTimeout(closeSidebar, 40);
    }
  });

  sidebar.addEventListener("toggle", (e) => {
    const target = e.target;
    if (target instanceof HTMLElement && target.matches(".sidebar-section[data-section-key]")) {
      ensureListSectionOpen();
      saveSectionState();
    }
  }, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("sidebar-open")) {
      closeSidebar();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      toggleSidebar();
      return;
    }

    if (e.key === "/" && !isEditableTarget(document.activeElement)) {
      e.preventDefault();
      if (isMobile()) openSidebar();
      if (focusTarget) {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch {
          focusTarget.focus();
        }
        if ("select" in focusTarget) {
          focusTarget.select?.();
        }
      }
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
    toggle: toggleSidebar,
    isCollapsed: () => collapsed,
  };
}
