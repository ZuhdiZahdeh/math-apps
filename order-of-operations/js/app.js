// =========================================
// Order of Operations — app.js
// - بنك أسئلة كبير من JSON
// - اختيار عشوائي بعدد يحدده المستخدم من داخل الصفحة
// - أصوات نجاح/فشل
// =========================================

let BANK = null;
let QUESTIONS_ALL = [];
let LEVELS = [];
let MAX = { easy: 0, medium: 0, hard: 0 };

// اختيار الجلسة (الأسئلة المعروضة فعليًا)
let SESSION = { easy: [], medium: [], hard: [] };

// ---- تحميل بنك الأسئلة ----
const DATA_URL = new URL("../data/questions.json", import.meta.url);

// ---- أصوات النجاح/الفشل (من جذر الموقع) ----
const ROOT_URL = new URL("../../", import.meta.url); // من order-of-operations/js/ إلى جذر الموقع

const SUCCESS_SFX_FILES = [
  "apps/audio/success/applause.mp3",
  "apps/audio/success/clap.mp3",
  "apps/audio/success/success_toolMatch_a.mp3",
  "apps/audio/success/success_toolMatch_b.mp3",
  "apps/audio/success/success_toolMatch_d.mp3",
  "apps/audio/success/success_toolMatch_e.mp3"
];

const FAIL_SFX_FILES = [
  "apps/audio/fail/fail-trombone-01.mp3",
  "apps/audio/fail/fail-trombone-02.mp3",
  "apps/audio/fail/fail-trombone-03.mp3",
  "apps/audio/fail/fail_toolMatch_a.mp3",
  "apps/audio/fail/fail_toolMatch_b.mp3",
  "apps/audio/fail/fail_toolMatch_c.mp3"
];

const SUCCESS_SFX = SUCCESS_SFX_FILES.map(p => new URL(p, ROOT_URL).href);
const FAIL_SFX = FAIL_SFX_FILES.map(p => new URL(p, ROOT_URL).href);

const SFX = {
  enabled: true,
  volume: 0.85,
  channel: new Audio()
};
SFX.channel.preload = "auto";

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function playSfx(urls) {
  if (!SFX.enabled) return;
  if (!urls || !urls.length) return;

  const url = pickRandom(urls);
  try {
    SFX.channel.pause();
    SFX.channel.currentTime = 0;
    SFX.channel.src = url;
    SFX.channel.volume = SFX.volume;

    const p = SFX.channel.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch (_) {}
}

// ---- تخزين ----
const STORAGE = {
  progress: "oop_progress_v1",
  display: "oop_display_settings_v1",   // {shuffle, pick:{easy,medium,hard}}
  session: "oop_session_pick_v1"        // {meta:{shuffle,pick}, ids:{easy:[..],..}}
};

// ---- DOM helper ----
const $ = (id) => document.getElementById(id);

// ---- حالة التطبيق ----
const state = {
  level: "easy",
  idx: 0,
  solved: loadProgress()
};

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.progress) || "{}");
  } catch {
    return {};
  }
}
function saveProgress() {
  localStorage.setItem(STORAGE.progress, JSON.stringify(state.solved));
}

// ---- إعدادات العرض (عدد الأسئلة + عشوائي) ----
let DISPLAY = {
  shuffle: true,
  pick: { easy: 3, medium: 6, hard: 3 }
};

function loadDisplayDefaultsFromBank() {
  const def = BANK?.settings?.defaultPick || { easy: 3, medium: 6, hard: 3 };
  const sh = (typeof BANK?.settings?.shuffle === "boolean") ? BANK.settings.shuffle : true;
  return {
    shuffle: sh,
    pick: {
      easy: Number.isFinite(def.easy) ? def.easy : 3,
      medium: Number.isFinite(def.medium) ? def.medium : 6,
      hard: Number.isFinite(def.hard) ? def.hard : 3
    }
  };
}

function loadDisplaySettings() {
  const defaults = loadDisplayDefaultsFromBank();
  try {
    const raw = localStorage.getItem(STORAGE.display);
    if (!raw) return defaults;
    const s = JSON.parse(raw);
    return {
      shuffle: (typeof s.shuffle === "boolean") ? s.shuffle : defaults.shuffle,
      pick: {
        easy: toInt(s.pick?.easy, defaults.pick.easy),
        medium: toInt(s.pick?.medium, defaults.pick.medium),
        hard: toInt(s.pick?.hard, defaults.pick.hard)
      }
    };
  } catch {
    return defaults;
  }
}

function saveDisplaySettings() {
  localStorage.setItem(STORAGE.display, JSON.stringify(DISPLAY));
}

function clampDisplayToMax() {
  DISPLAY.pick.easy = clamp(toInt(DISPLAY.pick.easy, 0), 0, MAX.easy);
  DISPLAY.pick.medium = clamp(toInt(DISPLAY.pick.medium, 0), 0, MAX.medium);
  DISPLAY.pick.hard = clamp(toInt(DISPLAY.pick.hard, 0), 0, MAX.hard);
}

// ---- أدوات ----
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function toInt(v, fallback = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function parseNumber(input) {
  if (input == null) return NaN;
  let s = String(input).trim()
    .replaceAll("،", ".")
    .replaceAll(",", ".")
    .replace(/\s+/g, "")
    .replaceAll("−", "-");
  if (!s) return NaN;

  // كسر بسيط a/b
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (frac) {
    const a = parseFloat(frac[1]);
    const b = parseFloat(frac[2]);
    if (!isFinite(a) || !isFinite(b) || b === 0) return NaN;
    return a / b;
  }
  const n = parseFloat(s);
  return isFinite(n) ? n : NaN;
}
function fmtExpr(s) {
  return String(s).replaceAll("−", "-");
}
function getLevelLabel(key) {
  return (LEVELS.find(l => l.key === key) || {}).label || key;
}

// ---- بناء مستويات إذا لم تكن موجودة في JSON ----
function buildLevelsIfMissing() {
  const labels = { easy: "سهل", medium: "متوسط", hard: "صعب" };
  const keys = ["easy", "medium", "hard"];
  return keys
    .filter(k => QUESTIONS_ALL.some(q => q.level === k))
    .map(k => ({ key: k, label: labels[k] || k }));
}

// ---- اختيار الجلسة (الأسئلة المعروضة) ----
function loadSavedSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE.session);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSessionSelection(idsByLevel) {
  const payload = {
    meta: { shuffle: DISPLAY.shuffle, pick: { ...DISPLAY.pick } },
    ids: idsByLevel
  };
  try {
    sessionStorage.setItem(STORAGE.session, JSON.stringify(payload));
  } catch {}
}

function metaMatchesSaved(savedMeta) {
  if (!savedMeta) return false;
  const p = savedMeta.pick || {};
  return (
    !!savedMeta &&
    savedMeta.shuffle === DISPLAY.shuffle &&
    toInt(p.easy, -1) === DISPLAY.pick.easy &&
    toInt(p.medium, -1) === DISPLAY.pick.medium &&
    toInt(p.hard, -1) === DISPLAY.pick.hard
  );
}

function buildSession(forceNew = false) {
  // حاول استعادة جلسة بنفس الإعدادات (حتى لا تتغير بالـ Refresh)
  if (!forceNew) {
    const saved = loadSavedSession();
    if (saved && metaMatchesSaved(saved.meta) && saved.ids) {
      const rebuilt = { easy: [], medium: [], hard: [] };
      const byId = new Map(QUESTIONS_ALL.map(q => [q.id, q]));

      ["easy", "medium", "hard"].forEach(k => {
        const ids = Array.isArray(saved.ids[k]) ? saved.ids[k] : [];
        rebuilt[k] = ids.map(id => byId.get(id)).filter(Boolean);
      });

      // تحقق بسيط: إن كان هناك أسئلة فعلًا
      const any = Object.values(rebuilt).some(arr => arr.length > 0);
      if (any) {
        SESSION = rebuilt;
        return;
      }
    }
  }

  // بناء جلسة جديدة من بنك الأسئلة
  const idsToSave = { easy: [], medium: [], hard: [] };
  const byLevel = {
    easy: QUESTIONS_ALL.filter(q => q.level === "easy"),
    medium: QUESTIONS_ALL.filter(q => q.level === "medium"),
    hard: QUESTIONS_ALL.filter(q => q.level === "hard")
  };

  SESSION = { easy: [], medium: [], hard: [] };

  ["easy", "medium", "hard"].forEach(k => {
    const pool = [...(byLevel[k] || [])];
    if (DISPLAY.shuffle) shuffleArray(pool);
    const take = DISPLAY.pick[k];
    const chosen = pool.slice(0, take);

    SESSION[k] = chosen;
    idsToSave[k] = chosen.map(q => q.id);
  });

  saveSessionSelection(idsToSave);
}

function ensureValidActiveLevel() {
  const has = (k) => (SESSION[k] || []).length > 0;
  if (!has(state.level)) {
    const first = ["easy", "medium", "hard"].find(has);
    state.level = first || "easy";
    state.idx = 0;
  }
}

function updateLevelButtons() {
  document.querySelectorAll(".lvl").forEach(btn => {
    const key = btn.dataset.level;
    const count = (SESSION[key] || []).length;
    btn.textContent = `${getLevelLabel(key)} (${count})`;
    btn.disabled = (count === 0);

    // لو الزر أصبح معطّلًا وهو نشط، ننزع النشاط عنه
    if (btn.disabled) {
      btn.classList.remove("active");
      btn.setAttribute("aria-selected", "false");
    }
  });

  // إعادة تفعيل الزر النشط بعد تحديث النص/التعطيل
  document.querySelectorAll(".lvl").forEach(btn => {
    if (btn.dataset.level === state.level && !btn.disabled) {
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
    }
  });
}

function currentList() {
  return SESSION[state.level] || [];
}

function solvedCount() {
  const list = currentList();
  return list.filter(q => state.solved[q.id]).length;
}

// ---- واجهة الإعدادات (عدد الأسئلة) ----
function setMaxText(id, val) {
  const el = $(id);
  if (el) el.textContent = `المتاح: ${val}`;
}

function setupSettingsUI() {
  const easyInput = $("pickEasy");
  const medInput = $("pickMedium");
  const hardInput = $("pickHard");
  const shuffleToggle = $("shuffleToggle");

  // اكتب الحدود والقيَم
  if (easyInput) {
    easyInput.min = "0";
    easyInput.max = String(MAX.easy);
    easyInput.value = String(DISPLAY.pick.easy);
  }
  if (medInput) {
    medInput.min = "0";
    medInput.max = String(MAX.medium);
    medInput.value = String(DISPLAY.pick.medium);
  }
  if (hardInput) {
    hardInput.min = "0";
    hardInput.max = String(MAX.hard);
    hardInput.value = String(DISPLAY.pick.hard);
  }
  if (shuffleToggle) shuffleToggle.checked = !!DISPLAY.shuffle;

  setMaxText("maxEasy", MAX.easy);
  setMaxText("maxMedium", MAX.medium);
  setMaxText("maxHard", MAX.hard);

  const applyBtn = $("applySettingsBtn");
  const reshuffleBtn = $("reshuffleBtn");

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      DISPLAY.shuffle = !!($("shuffleToggle")?.checked);

      DISPLAY.pick.easy = toInt($("pickEasy")?.value, 0);
      DISPLAY.pick.medium = toInt($("pickMedium")?.value, 0);
      DISPLAY.pick.hard = toInt($("pickHard")?.value, 0);

      clampDisplayToMax();
      saveDisplaySettings();

      // جلسة جديدة بالإعدادات الجديدة
      buildSession(true);
      state.idx = 0;
      ensureValidActiveLevel();
      updateLevelButtons();
      render();
    });
  }

  if (reshuffleBtn) {
    reshuffleBtn.addEventListener("click", () => {
      // نفس الأعداد، لكن اختيار عشوائي جديد
      buildSession(true);
      state.idx = 0;
      ensureValidActiveLevel();
      updateLevelButtons();
      render();
    });
  }
}

// ---- تنقل ----
function setLevel(levelKey) {
  if ((SESSION[levelKey] || []).length === 0) return;

  state.level = levelKey;
  state.idx = 0;

  document.querySelectorAll(".lvl").forEach(b => {
    const on = b.dataset.level === levelKey;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });

  render();
}

function go(delta) {
  const list = currentList();
  state.idx = clamp(state.idx + delta, 0, Math.max(0, list.length - 1));
  render();
}

// ---- عرض ----
function showFeedback(html, ok) {
  const box = $("feedback");
  box.style.display = "block";
  box.classList.toggle("ok", !!ok);
  box.classList.toggle("bad", !ok);
  box.innerHTML = html;
}

function selectedExprIndex() {
  const el = document.querySelector('input[name="expr"]:checked');
  return el ? parseInt(el.value, 10) : null;
}

function renderLoading(msg) {
  const card = $("qCard");
  if (!card) return;
  card.innerHTML = `<div class="feedback" style="display:block">${msg}</div>`;
}

function render() {
  const list = currentList();
  const card = $("qCard");

  if (!list.length) {
    renderLoading("لا توجد أسئلة في هذا المستوى. ارفع العدد من الإعدادات أو فعّل مستويات أخرى.");
    return;
  }

  const q = list[state.idx];
  const isSolved = !!state.solved[q.id];

  $("prevBtn").disabled = (state.idx === 0);
  $("nextBtn").disabled = (state.idx === list.length - 1);

  const done = solvedCount();
  const total = list.length;
  $("progressText").textContent =
    `مستوى ${getLevelLabel(state.level)}: ${state.idx + 1}/${total} — محلول: ${done}/${total}`;
  $("barFill").style.width = `${Math.round((done / total) * 100)}%`;

  card.innerHTML = `
    <div class="qhead">
      <h3>${q.title}</h3>
      <div class="qmeta">
        <span class="pill">المستوى: ${getLevelLabel(q.level)}</span>
        <span class="pill">السؤال: ${state.idx + 1} / ${total}</span>
        <span class="pill" id="solvedPill">${isSolved ? "✅ تم الحل" : "⏳ لم يُحل بعد"}</span>
      </div>
    </div>

    <p class="story">${q.story}</p>

    <div class="block">
      <h4>1) اختر التعبير الصحيح</h4>
      <div class="choices">
        ${q.exprChoices.map((c, i) => `
          <label class="choice">
            <input type="radio" name="expr" value="${i}">
            <span class="expr">${fmtExpr(c)}</span>
          </label>
        `).join("")}
      </div>
    </div>

    <div class="block">
      <h4>2) اكتب الناتج النهائي</h4>
      <div class="answerRow">
        <input id="ansInput" type="text" inputmode="decimal" placeholder="مثال: 46 أو 541.95 أو 456/6">
        <button id="checkBtn" class="small">تحقّق</button>
        <button id="hintBtn" class="small alt">تلميح</button>
        <button id="stepsBtn" class="small alt">حل خطوة بخطوة</button>
        <button id="resetBtn" class="small alt">إعادة</button>
      </div>

      <div id="feedback" class="feedback" style="display:none"></div>
      <div id="steps" class="steps" style="display:none"></div>
    </div>
  `;

  $("checkBtn").addEventListener("click", () => check(q));
  $("hintBtn").addEventListener("click", () => showHint(q));
  $("stepsBtn").addEventListener("click", () => toggleSteps(q));
  $("resetBtn").addEventListener("click", () => reset());
}

function check(q) {
  const sel = selectedExprIndex();
  const ans = parseNumber($("ansInput").value);
  const tol = q.tol ?? 1e-9;

  const exprOk = (sel != null) && (q.correctExpr || []).includes(sel);
  const ansOk = isFinite(ans) && (Math.abs(ans - q.answer) <= tol);

  // لا صوت فشل على أخطاء إدخال/نسيان اختيار
  if (sel == null) {
    showFeedback("اختر تعبيرًا أولًا من القائمة.", false);
    return;
  }
  if (!isFinite(ans)) {
    showFeedback("اكتب الناتج كرقم (يمكن استخدام كسر مثل 456/6).", false);
    return;
  }

  if (exprOk && ansOk) {
    state.solved[q.id] = true;
    saveProgress();

    showFeedback(`✅ ممتاز! التعبير صحيح والناتج صحيح: <b>${q.answer}</b>`, true);
    playSfx(SUCCESS_SFX);

    const pill = document.getElementById("solvedPill");
    if (pill) pill.textContent = "✅ تم الحل";

    $("barFill").style.width = `${Math.round((solvedCount() / currentList().length) * 100)}%`;
    $("progressText").textContent =
      `مستوى ${getLevelLabel(state.level)}: ${state.idx + 1}/${currentList().length} — محلول: ${solvedCount()}/${currentList().length}`;
  } else {
    const parts = [];
    parts.push(exprOk ? "✅ التعبير صحيح." : "❌ التعبير غير صحيح (راجع الأقواس/الترتيب).");
    parts.push(ansOk ? "✅ الناتج صحيح." : `❌ الناتج غير صحيح. الصحيح هو <b>${q.answer}</b>.`);
    parts.push(`<span class="muted">نصيحة: ${q.hint}</span>`);
    showFeedback(parts.join("<br>"), false);
    playSfx(FAIL_SFX);
  }
}

function showHint(q) {
  showFeedback(`💡 ${q.hint}`, true);
}

function toggleSteps(q) {
  const box = $("steps");
  if (box.style.display === "none") {
    box.style.display = "block";
    box.innerHTML = `
      <b>الخطوات:</b>
      <ul>${(q.steps || []).map(s => `<li>${s}</li>`).join("")}</ul>
    `;
  } else {
    box.style.display = "none";
    box.innerHTML = "";
  }
}

function reset() {
  document.querySelectorAll('input[name="expr"]').forEach(r => r.checked = false);
  $("ansInput").value = "";
  $("feedback").style.display = "none";
  $("steps").style.display = "none";
  $("steps").innerHTML = "";
}

// ---- تحميل البيانات ثم تشغيل ----
async function loadBank() {
  renderLoading("جاري تحميل بنك الأسئلة...");

  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load JSON: ${res.status}`);

  BANK = await res.json();
  QUESTIONS_ALL = Array.isArray(BANK.questions) ? BANK.questions : [];

  LEVELS = Array.isArray(BANK.levels) && BANK.levels.length ? BANK.levels : buildLevelsIfMissing();

  // حساب أقصى عدد متاح لكل مستوى
  MAX = {
    easy: QUESTIONS_ALL.filter(q => q.level === "easy").length,
    medium: QUESTIONS_ALL.filter(q => q.level === "medium").length,
    hard: QUESTIONS_ALL.filter(q => q.level === "hard").length
  };

  DISPLAY = loadDisplaySettings();
  clampDisplayToMax();
  saveDisplaySettings(); // لتحديث أي قيم تم قصّها

  // بناء جلسة الأسئلة (وفق الإعدادات)
  buildSession(false);
  ensureValidActiveLevel();
}

async function init() {
  try {
    await loadBank();

    // إعدادات الواجهة
    setupSettingsUI();

    // تحديث أزرار المستويات حسب الجلسة
    updateLevelButtons();

    // أحداث التنقل
    document.querySelectorAll(".lvl").forEach(btn => {
      btn.addEventListener("click", () => setLevel(btn.dataset.level));
    });
    $("prevBtn").addEventListener("click", () => go(-1));
    $("nextBtn").addEventListener("click", () => go(1));

    render();
  } catch (err) {
    console.error(err);
    renderLoading("تعذّر تحميل بنك الأسئلة. تأكد من وجود data/questions.json وأن الصفحة تعمل عبر GitHub Pages.");
  }
}

init();
