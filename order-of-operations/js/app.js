let QUESTIONS = [];
let LEVELS = [];

const DATA_URL = new URL("../data/questions.json", import.meta.url);

const $ = (id) => document.getElementById(id);

const state = {
  level: "easy",
  idx: 0,
  solved: loadProgress()
};

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem("oop_progress_v1") || "{}");
  } catch {
    return {};
  }
}
function saveProgress() {
  localStorage.setItem("oop_progress_v1", JSON.stringify(state.solved));
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

function buildLevelsIfMissing() {
  const labels = { easy: "سهل", medium: "متوسط", hard: "صعب" };
  const keys = ["easy", "medium", "hard"];
  return keys
    .map(k => ({
      key: k,
      label: labels[k] || k,
      count: QUESTIONS.filter(q => q.level === k).length
    }))
    .filter(l => l.count > 0);
}

function getLevelLabel(key) {
  return (LEVELS.find(l => l.key === key) || {}).label || key;
}

function currentList() {
  return QUESTIONS.filter(q => q.level === state.level);
}

function solvedCount() {
  const list = currentList();
  return list.filter(q => state.solved[q.id]).length;
}

function fmtExpr(s) {
  return String(s).replaceAll("−", "-");
}

function setLevel(levelKey) {
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
  state.idx = Math.max(0, Math.min(list.length - 1, state.idx + delta));
  render();
}

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
    renderLoading("لا توجد أسئلة في هذا المستوى.");
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

    const pill = document.getElementById("solvedPill");
    if (pill) pill.textContent = "✅ تم الحل";

    // تحديث التقدّم
    $("barFill").style.width = `${Math.round((solvedCount() / currentList().length) * 100)}%`;
    $("progressText").textContent =
      `مستوى ${getLevelLabel(state.level)}: ${state.idx + 1}/${currentList().length} — محلول: ${solvedCount()}/${currentList().length}`;
  } else {
    const parts = [];
    parts.push(exprOk ? "✅ التعبير صحيح." : "❌ التعبير غير صحيح (راجع الأقواس/الترتيب).");
    parts.push(ansOk ? "✅ الناتج صحيح." : `❌ الناتج غير صحيح. الصحيح هو <b>${q.answer}</b>.`);
    parts.push(`<span class="muted">نصيحة: ${q.hint}</span>`);
    showFeedback(parts.join("<br>"), false);
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

async function loadData() {
  renderLoading("جاري تحميل الأسئلة...");

  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load JSON: ${res.status}`);

  const data = await res.json();
  QUESTIONS = data.questions || [];
  LEVELS = data.levels || buildLevelsIfMissing();

  // لو مستوى البداية لا يحتوي أسئلة، اختر أول مستوى متاح
  if (!currentList().length) {
    const first = LEVELS.find(l => QUESTIONS.some(q => q.level === l.key));
    state.level = first ? first.key : "easy";
  }
}

async function init() {
  try {
    await loadData();

    document.querySelectorAll(".lvl").forEach(btn => {
      btn.addEventListener("click", () => setLevel(btn.dataset.level));
    });
    $("prevBtn").addEventListener("click", () => go(-1));
    $("nextBtn").addEventListener("click", () => go(1));

    render();
  } catch (err) {
    console.error(err);
    renderLoading("تعذّر تحميل الأسئلة. تأكد من وجود الملف: data/questions.json وتشغيل الصفحة عبر سيرفر/Pages.");
  }
}

init();
