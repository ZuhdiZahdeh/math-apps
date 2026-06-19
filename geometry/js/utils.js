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
