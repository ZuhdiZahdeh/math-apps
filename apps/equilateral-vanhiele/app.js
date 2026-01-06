/* =========================
   Equilateral Triangle – Van Hiele (1–4)
   Grades: 8, 9
   Level 1 reads cards.json + displays SVG images
========================= */

const KEY = "eq_vanhiele_progress_v1";

const byId = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const state = {
  grade: 8,
  level: 1,
  done: { 1:false, 2:false, 3:false, 4:false },
  scores: { 1:null, 2:null, 3:null, 4:null },

  // Level 1 (manifest-driven)
  l1: {
    idx: 0,
    order: [],          // shuffled cards array
    selectedAns: null,  // "eq" | "iso" | "other"
    results: {},        // { [cardId]: "ok"|"bad" }
    cards: [],          // raw manifest cards
    loading: true,
    error: null,
  },

  // Level 2 state (kept)
  l2: { show:false, ok:false },
};

/* =========================
   Save / Load progress
========================= */
function saveProgress() {
  const payload = {
    grade: state.grade,
    done: state.done,
    scores: state.scores
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (!p) return;
    state.grade = p.grade ?? state.grade;
    state.done  = p.done  ?? state.done;
    state.scores= p.scores?? state.scores;
  } catch {}
}

function setProgressUI() {
  const doneCount = Object.values(state.done).filter(Boolean).length;
  byId("progText").textContent = `${doneCount}/4`;
  byId("barFill").style.width = `${(doneCount/4)*100}%`;
}

function setLevel(level) {
  state.level = level;
  document.querySelectorAll(".tab").forEach(t=>{
    t.classList.toggle("is-active", +t.dataset.level === level);
  });
  document.querySelectorAll(".level").forEach(sec=>{
    sec.classList.toggle("is-active", +sec.dataset.level === level);
  });
}

/* =========================
   Helpers
========================= */
function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// Manifest src normalization:
// - If src is "apps/equilateral-vanhiele/assets/cards/eq_01.svg" -> convert to "./assets/cards/eq_01.svg"
// - If already relative -> keep
function normalizeSrc(src) {
  if (!src) return "";
  const prefix = "apps/equilateral-vanhiele/";
  if (src.startsWith(prefix)) return "./" + src.slice(prefix.length);
  if (src.startsWith("/")) return src;         // absolute on same domain
  if (src.startsWith("./") || src.startsWith("../")) return src;
  return "./" + src;
}

// Convert manifest kind -> game answer kind
function toGameKind(kind) {
  if (kind === "eq") return "eq";
  if (kind === "iso") return "iso";
  return "other"; // right / obtuse / any other
}

/* =========================
   Level 1 – Load cards.json
========================= */
const MANIFEST_URLS = [
  "./assets/cards/cards.json" // recommended
  
];

async function loadCardsManifest() {
  let lastErr = null;

  for (const url of MANIFEST_URLS) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} on ${url}`);
        continue;
      }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        lastErr = new Error(`Invalid JSON array in ${url}`);
        continue;
      }

      // Validate minimal fields
      const cleaned = data
        .filter(x => x && x.id && x.kind && x.src)
        .map(x => ({
          id: String(x.id),
          kindRaw: String(x.kind),
          kindGame: toGameKind(String(x.kind)),
          src: normalizeSrc(String(x.src))
        }));

      if (cleaned.length === 0) {
        lastErr = new Error(`No valid items (id/kind/src) found in ${url}`);
        continue;
      }

      return cleaned;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("Failed to load cards.json");
}

/* =========================
   Level 1 – UI (single card)
========================= */

function renderL1Nums() {
  const box = byId("l1Nums");
  if (!box) return;
  box.innerHTML = "";

  state.l1.order.forEach((card, i) => {
    const b = document.createElement("button");
    b.className = "numBtn";
    b.textContent = card.id;

    if (i === state.l1.idx) b.classList.add("is-current");

    const res = state.l1.results[card.id];
    if (res === "ok") b.classList.add("is-ok");
    if (res === "bad") b.classList.add("is-bad");

    b.addEventListener("click", () => {
      state.l1.idx = i;
      state.l1.selectedAns = null;
      // remove selection UI
      document.querySelectorAll(".ansbtn").forEach(x => x.classList.remove("is-selected"));
      byId("l1CheckOne").disabled = true;
      renderL1One();
    });

    box.appendChild(b);
  });
}

function renderL1One() {
  const big = byId("l1BigShape");
  const status = byId("l1Status");
  const now = byId("l1Now");
  const total = byId("l1Total");

  if (!big || !status || !now || !total) return;

  if (state.l1.loading) {
    status.textContent = "جارِ تحميل البطاقات…";
    big.innerHTML = `<div class="muted">Loading…</div>`;
    return;
  }
  if (state.l1.error) {
    status.textContent = "تعذّر تحميل cards.json";
    big.innerHTML = `<div class="muted">⚠ ${state.l1.error}</div>`;
    return;
  }

  const card = state.l1.order[state.l1.idx];
  now.textContent = String(state.l1.idx + 1);
  total.textContent = String(state.l1.order.length);

  // display SVG via <img>
  big.innerHTML = `
    <img
      src="${card.src}"
      alt="بطاقة مثلث"
      style="width:min(520px, 85%); height:auto; display:block;"
      draggable="false"
    />
  `;

  // score line
  const doneCount = Object.keys(state.l1.results).length;
  const okCount = Object.values(state.l1.results).filter(v => v === "ok").length;
  const scoreEl = byId("l1ScoreOne");
  if (scoreEl) scoreEl.textContent = `صحيح: ${okCount} / ${doneCount}`;

  status.textContent = "اختر إجابة ثم اضغط “تحقّق”.";
  renderL1Nums();
}

function l1Prev() {
  state.l1.idx = (state.l1.idx - 1 + state.l1.order.length) % state.l1.order.length;
  state.l1.selectedAns = null;
  document.querySelectorAll(".ansbtn").forEach(x => x.classList.remove("is-selected"));
  byId("l1CheckOne").disabled = true;
  renderL1One();
}

function l1Next() {
  state.l1.idx = (state.l1.idx + 1) % state.l1.order.length;
  state.l1.selectedAns = null;
  document.querySelectorAll(".ansbtn").forEach(x => x.classList.remove("is-selected"));
  byId("l1CheckOne").disabled = true;
  renderL1One();
}

function l1Restart() {
  state.l1.idx = 0;
  state.l1.selectedAns = null;
  state.l1.results = {};
  state.scores[1] = null;
  state.done[1] = false;

  state.l1.order = shuffle(state.l1.cards);

  document.querySelectorAll(".ansbtn").forEach(x => x.classList.remove("is-selected"));
  byId("l1Msg").textContent = "";
  byId("l1CheckOne").disabled = true;

  renderL1One();
  setProgressUI();
  saveProgress();
}

function checkL1One() {
  const card = state.l1.order[state.l1.idx];
  const expected = card.kindGame; // "eq" | "iso" | "other"
  const got = state.l1.selectedAns;

  const ok = (expected === got);
  state.l1.results[card.id] = ok ? "ok" : "bad";

  const status = byId("l1Status");
  status.textContent = ok
    ? "✅ إجابة صحيحة"
    : `❌ إجابة غير صحيحة — الصحيح: ${
        expected === "eq" ? "متساوي الأضلاع" :
        expected === "iso" ? "متساوي الساقين" : "غير ذلك"
      }`;

  // update pass condition
  const okCount = Object.values(state.l1.results).filter(v => v === "ok").length;
  state.scores[1] = okCount;
  state.done[1] = (state.grade === 9) ? (okCount >= 18) : (okCount >= 16);

  byId("l1Msg").textContent = state.done[1]
    ? "✅ اجتزت المستوى البصري. يمكنك الانتقال للمستوى 2."
    : "تابع… الهدف هو تحسين التمييز البصري بدون قياس.";

  renderL1Nums();
  setProgressUI();
  saveProgress();

  // auto next
  setTimeout(() => {
    l1Next();
  }, 700);
}

/* =========================
   Level 2 – Descriptive canvas (unchanged)
========================= */

const tri = {
  canvas: null,
  ctx: null,
  w: 520,
  h: 340,
  A: {x:120, y:260},
  B: {x:400, y:260},
  C: {x:290, y:120},
  drag: false,
  show: false,
};

function dist(p,q){ return Math.hypot(p.x-q.x, p.y-q.y); }

function angleAt(P, Q, R){ // angle at Q in triangle P-Q-R
  const v1 = {x:P.x-Q.x, y:P.y-Q.y};
  const v2 = {x:R.x-Q.x, y:R.y-Q.y};
  const dot = v1.x*v2.x + v1.y*v2.y;
  const n1 = Math.hypot(v1.x,v1.y);
  const n2 = Math.hypot(v2.x,v2.y);
  const c = clamp(dot/(n1*n2), -1, 1);
  return Math.acos(c) * 180/Math.PI;
}

function isEquilateral(A,B,C){
  const ab = dist(A,B), bc = dist(B,C), ca = dist(C,A);
  const avg = (ab+bc+ca)/3;
  const maxDiff = Math.max(Math.abs(ab-bc), Math.abs(bc-ca), Math.abs(ca-ab));
  const aA = angleAt(B,A,C), aB = angleAt(A,B,C), aC = angleAt(A,C,B);

  // tolerance
  const okSides = (maxDiff/avg) < 0.03;
  const okAngs = Math.max(Math.abs(aA-60), Math.abs(aB-60), Math.abs(aC-60)) < 2.5;

  return { ok: okSides && okAngs, ab, bc, ca, aA, aB, aC, okSides, okAngs };
}

function drawTriangle() {
  const c = tri.ctx;
  const {A,B,C} = tri;

  c.clearRect(0,0,tri.w,tri.h);

  c.lineWidth = 3;
  c.strokeStyle = "#cbd5e1";
  c.beginPath();
  c.moveTo(A.x,A.y); c.lineTo(B.x,B.y); c.lineTo(C.x,C.y); c.closePath();
  c.stroke();

  const drawPt = (P, name)=>{
    c.fillStyle = "#f59e0b";
    c.beginPath(); c.arc(P.x,P.y,6,0,Math.PI*2); c.fill();
    c.fillStyle = "#e2e8f0";
    c.font = "bold 16px system-ui";
    c.fillText(name, P.x+10, P.y-10);
  };
  drawPt(A,"A"); drawPt(B,"B"); drawPt(C,"C");

  if (tri.show) {
    const r = isEquilateral(A,B,C);
    c.fillStyle = "#94a3b8";
    c.font = "14px system-ui";
    c.fillText(`AB≈${r.ab.toFixed(1)}  BC≈${r.bc.toFixed(1)}  CA≈${r.ca.toFixed(1)}`, 16, 24);
    c.fillText(`∠A≈${r.aA.toFixed(1)}°  ∠B≈${r.aB.toFixed(1)}°  ∠C≈${r.aC.toFixed(1)}°`, 16, 44);
  }
}

function attachL2() {
  tri.canvas = byId("triCanvas");
  tri.ctx = tri.canvas.getContext("2d");

  const resize = ()=>{
    const box = tri.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    tri.w = Math.max(360, Math.floor(box.width));
    tri.h = 340;

    tri.canvas.width = Math.floor(tri.w * dpr);
    tri.canvas.height = Math.floor(tri.h * dpr);
    tri.ctx.setTransform(dpr,0,0,dpr,0,0);

    tri.A = {x: Math.floor(tri.w*0.23), y: 260};
    tri.B = {x: Math.floor(tri.w*0.77), y: 260};
    if (!tri._initC) {
      tri.C = {x: Math.floor(tri.w*0.55), y: 120};
      tri._initC = true;
    } else {
      tri.C.x = clamp(tri.C.x, 40, tri.w-40);
      tri.C.y = clamp(tri.C.y, 40, tri.h-40);
    }
    drawTriangle();
  };
  window.addEventListener("resize", resize);
  resize();

  const hitC = (x,y)=> Math.hypot(x-tri.C.x, y-tri.C.y) < 16;

  tri.canvas.addEventListener("pointerdown",(e)=>{
    const rect = tri.canvas.getBoundingClientRect();
    const x = e.clientX-rect.left;
    const y = e.clientY-rect.top;
    if (hitC(x,y)) {
      tri.drag = true;
      tri.canvas.setPointerCapture(e.pointerId);
    }
  });
  tri.canvas.addEventListener("pointermove",(e)=>{
    if (!tri.drag) return;
    const rect = tri.canvas.getBoundingClientRect();
    tri.C.x = clamp(e.clientX-rect.left, 40, tri.w-40);
    tri.C.y = clamp(e.clientY-rect.top, 40, tri.h-40);
    drawTriangle();
  });
  tri.canvas.addEventListener("pointerup",()=>{ tri.drag = false; });
}

function checkL2() {
  const r = isEquilateral(tri.A,tri.B,tri.C);
  const msg = byId("l2Msg");
  if (r.ok) {
    state.l2.ok = true;
    msg.textContent = "✅ ممتاز! هذا قريب جدًا من مثلث متساوي الأضلاع.";
  } else {
    state.l2.ok = false;
    msg.textContent = `❗ ليس بعد. ${r.okSides ? "الأضلاع جيدة" : "قرّب الأضلاع للتساوي"}، و${r.okAngs ? "الزوايا جيدة" : "قرّب الزوايا إلى 60°"}.`;
  }
}

function saveL2Answers() {
  const a1 = byId("l2q1").value;
  const a2 = byId("l2q2").value;
  const a3 = byId("l2q3").value;

  let score = 0;
  if (a1==="a") score++;
  if (a2==="a") score++;
  if (a3==="a") score++;

  const pass = (state.grade === 9) ? (score===3 && state.l2.ok) : (score>=2);

  state.scores[2] = score;
  state.done[2] = pass;

  byId("l2Score").textContent = `النتيجة: ${score}/3 — ${pass ? "✅ اجتزت" : "❗ راجع الإجابات"}`;
  byId("l2Done").textContent = pass ? "ممتاز. انتقل للاستدلال غير الرسمي." : "";

  setProgressUI();
  saveProgress();
}

/* =========================
   Level 3 + Level 4
   (if you already have them in your app.js, keep them below as-is)
   If not, you can paste your existing Level 3/4 code here.
========================= */

/* =========================
   Boot
========================= */
async function init() {
  loadProgress();

  // Tabs
  document.querySelectorAll(".tab").forEach(t=>{
    t.addEventListener("click", ()=> setLevel(+t.dataset.level));
  });

  // Grade
  byId("gradeSel").value = String(state.grade);
  byId("gradeSel").addEventListener("change", ()=>{
    state.grade = +byId("gradeSel").value;
    saveProgress();
  });

  // Reset
  byId("resetBtn").addEventListener("click", ()=>{
    localStorage.removeItem(KEY);
    location.reload();
  });

  // -------- Level 1: load cards.json --------
  try {
    state.l1.loading = true;
    renderL1One();

    const cards = await loadCardsManifest();
    state.l1.cards = cards;
    state.l1.order = shuffle(cards);
    state.l1.idx = 0;
    state.l1.selectedAns = null;
    state.l1.results = {};
    state.l1.loading = false;
    state.l1.error = null;

    // Answer selection buttons
    document.querySelectorAll(".ansbtn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        state.l1.selectedAns = btn.dataset.ans;
        document.querySelectorAll(".ansbtn").forEach(b=>b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        byId("l1CheckOne").disabled = false;
      });
    });

    byId("l1CheckOne").addEventListener("click", checkL1One);
    byId("l1Prev").addEventListener("click", l1Prev);
    byId("l1Next").addEventListener("click", l1Next);
    byId("l1Restart").addEventListener("click", l1Restart);

    renderL1One();
  } catch (e) {
    state.l1.loading = false;
    state.l1.error = e?.message || String(e);
    renderL1One();
  }

  // Level 2
  const to2 = byId("to2");
  if (to2) to2.addEventListener("click", ()=> setLevel(2));

  attachL2();
  byId("showMeasures").addEventListener("click", ()=>{
    tri.show = !tri.show;
    drawTriangle();
  });
  byId("l2Check").addEventListener("click", checkL2);
  byId("l2Reset").addEventListener("click", ()=>{
    tri.C.x = Math.floor(tri.w*0.55);
    tri.C.y = 120;
    byId("l2Msg").textContent = "";
    state.l2.ok = false;
    drawTriangle();
  });
  byId("l2Save").addEventListener("click", saveL2Answers);

  // NOTE:
  // If you have Level 3/4 init hooks, keep them here (your existing code).

  setProgressUI();
}

init();
