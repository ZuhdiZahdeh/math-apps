/* =========================
   Equilateral Triangle – Van Hiele (1–4)
   ✅ L1: cards from ./assets/cards/cards.json
   ✅ L2: drag C (works immediately), measurements centered, integers, SNAP, symmetry axes, AB slider + Auto
   ✅ Sounds: Success/Fail (from ../audio/success & ../audio/fail)
========================= */

const KEY = "eq_vanhiele_progress_v3";

const byId = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const state = {
  grade: 8,
  level: 1,
  done: { 1:false, 2:false, 3:false, 4:false },
  scores: { 1:0, 2:0, 3:0, 4:0 },

  l1: {
    loading: true,
    error: null,
    cards: [],
    order: [],
    idx: 0,
    selectedAns: null,
    results: {}, // { [id]: "ok"|"bad" }
  },

  l2: { ok:false },

  l4: {
    proofA: { order: [], reasons: {} },
    proofB: { order: [], reasons: {} },
  }
};

/* =========================
   ✅ Sounds (Success / Fail)
   Location:
   apps/equilateral-vanhiele/ (this file)
   apps/audio/success/*.mp3
   apps/audio/fail/*.mp3
   So relative path is: ../audio/...
========================= */
const SOUND = {
  enabled: true,
  volume: 0.85,
  primed: false,

  success: [
    "../audio/success/applause.mp3",
    "../audio/success/clap.mp3",
    "../audio/success/success_toolMatch_a.mp3",
    "../audio/success/success_toolMatch_b.mp3",
    "../audio/success/success_toolMatch_d.mp3",
    "../audio/success/success_toolMatch_e.mp3"
  ],

  fail: [
    "../audio/fail/fail-trombone-01.mp3",
    "../audio/fail/fail-trombone-02.mp3",
    "../audio/fail/fail-trombone-03.mp3",
    "../audio/fail/fail_toolMatch_a.mp3",
    "../audio/fail/fail_toolMatch_b.mp3",
    "../audio/fail/fail_toolMatch_c.mp3"
  ],

  _cache: new Map(),
};

function primeSoundsOnce() {
  if (SOUND.primed) return;
  SOUND.primed = true;

  // Preload (best effort)
  [...SOUND.success, ...SOUND.fail].forEach((url) => {
    try {
      const a = new Audio(url);
      a.preload = "auto";
      a.volume = SOUND.volume;
      SOUND._cache.set(url, a);
      a.load();
    } catch {}
  });
}

// Prime on first user gesture (avoids autoplay restrictions)
document.addEventListener("pointerdown", primeSoundsOnce, { once: true });
document.addEventListener("keydown", primeSoundsOnce, { once: true });

function playSound(url) {
  if (!SOUND.enabled) return;
  try {
    const base = SOUND._cache.get(url) || new Audio(url);
    base.volume = SOUND.volume;

    // clone so multiple plays won't cut each other
    const a = base.cloneNode(true);
    a.volume = SOUND.volume;

    a.play().catch(() => {});
  } catch {}
}

function playRandomSound(list) {
  if (!SOUND.enabled) return;
  if (!Array.isArray(list) || list.length === 0) return;
  const url = list[Math.floor(Math.random() * list.length)];
  playSound(url);
}

function playSuccess() { playRandomSound(SOUND.success); }
function playFail() { playRandomSound(SOUND.fail); }

/* =========================
   Save / Load
========================= */
function saveProgress() {
  const payload = {
    grade: state.grade,
    done: state.done,
    scores: state.scores,
    l1: { idx: state.l1.idx, results: state.l1.results },
    l4: state.l4
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (!p) return;

    if (p.grade) state.grade = +p.grade;
    if (p.done) state.done = { ...state.done, ...p.done };
    if (p.scores) state.scores = { ...state.scores, ...p.scores };
    if (p.l1?.results) state.l1.results = p.l1.results;
    if (typeof p.l1?.idx === "number") state.l1.idx = p.l1.idx;

    if (p.l4?.proofA) state.l4.proofA = p.l4.proofA;
    if (p.l4?.proofB) state.l4.proofB = p.l4.proofB;
  } catch {}
}

/* =========================
   Progress + level switching
========================= */
function setProgressUI() {
  const doneCount = [1,2,3,4].filter(k => state.done[k]).length;

  const progText = byId("progText");
  const barFill = byId("barFill");
  if (progText) progText.textContent = `${doneCount}/4`;
  if (barFill) barFill.style.width = `${(doneCount/4)*100}%`;

  const to3 = byId("to3");
  const to4 = byId("to4");
  if (to3) to3.disabled = !state.done[2];
  if (to4) to4.disabled = !state.done[3];

  saveProgress();
}

function setLevel(level) {
  state.level = level;

  document.querySelectorAll(".tab").forEach(t=>{
    t.classList.toggle("is-active", +t.dataset.level === level);
  });
  document.querySelectorAll(".level").forEach(sec=>{
    sec.classList.toggle("is-active", +sec.dataset.level === level);
  });

  // ✅ عند فتح المستوى 2: أعد قياس الـCanvas بعد ظهوره
  if (level === 2) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (tri && typeof tri.resize === "function") tri.resize();
        else window.dispatchEvent(new Event("resize"));
      });
    });
  }
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

function normalizeKind(kind){
  const k = String(kind || "").toLowerCase().trim();
  if (k === "eq" || k === "equilateral") return "eq";
  if (k === "iso" || k === "isosceles") return "iso";
  return "other";
}

function normalizeSrc(src){
  if (!src) return "";
  const s = String(src).trim();

  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return s;
  if (s.startsWith("./") || s.startsWith("../")) return s;

  const prefix = "apps/equilateral-vanhiele/assets/cards/";
  if (s.startsWith(prefix)) return "./assets/cards/" + s.slice(prefix.length);

  if (s.startsWith("assets/cards/")) return "./" + s;

  // treat as filename inside ./assets/cards/
  return "./assets/cards/" + s;
}

/* =========================
   Level 1: load cards.json (YOUR PATH)
========================= */
const MANIFEST_URLS = [
  "./assets/cards/cards.json",
  "/math-apps/apps/equilateral-vanhiele/assets/cards/cards.json"
];

async function loadCardsManifest() {
  let lastErr = null;

  for (const url of MANIFEST_URLS) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} while fetching ${url}`);
        continue;
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        lastErr = new Error(`cards.json is not a non-empty array (${url})`);
        continue;
      }

      const cleaned = data
        .filter(x => x && x.id != null && x.kind != null && x.src != null)
        .map(x => ({
          id: String(x.id),
          kind: normalizeKind(x.kind),
          src: normalizeSrc(x.src),
        }));

      if (cleaned.length === 0) {
        lastErr = new Error(`No valid {id,kind,src} in ${url}`);
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
   Level 1 UI
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

    const r = state.l1.results[card.id];
    if (r === "ok") b.classList.add("is-ok");
    if (r === "bad") b.classList.add("is-bad");

    b.addEventListener("click", () => {
      state.l1.idx = i;
      state.l1.selectedAns = null;
      document.querySelectorAll(".ansbtn").forEach(x => x.classList.remove("is-selected"));
      const chk = byId("l1CheckOne");
      if (chk) chk.disabled = true;
      renderL1One();
      saveProgress();
    });

    box.appendChild(b);
  });
}

function renderL1One() {
  const big = byId("l1BigShape");
  const status = byId("l1Status");
  const now = byId("l1Now");
  const total = byId("l1Total");
  const scoreOne = byId("l1ScoreOne");

  if (!big || !status || !now || !total) return;

  if (state.l1.loading) {
    status.textContent = "جارٍ تحميل البطاقات…";
    big.innerHTML = `<div class="muted">Loading…</div>`;
    return;
  }
  if (state.l1.error) {
    status.textContent = "تعذّر تحميل البطاقات";
    big.innerHTML = `<div class="muted">⚠ ${state.l1.error}</div>`;
    return;
  }

  const card = state.l1.order[state.l1.idx];
  if (!card) {
    status.textContent = "لا توجد بطاقات";
    big.innerHTML = "";
    return;
  }

  now.textContent = String(state.l1.idx + 1);
  total.textContent = String(state.l1.order.length);

  big.innerHTML = `
    <img src="${card.src}" alt="بطاقة مثلث"
      style="width:min(520px,85%); height:auto; display:block;"
      draggable="false" />
  `;

  const okCount = Object.values(state.l1.results).filter(v => v === "ok").length;
  const attempted = Object.keys(state.l1.results).length;
  if (scoreOne) scoreOne.textContent = `صحيح: ${okCount} / ${attempted}`;

  status.textContent = "اختر إجابة ثم اضغط “تحقّق”.";
  renderL1Nums();
}

function l1Prev() {
  state.l1.idx = (state.l1.idx - 1 + state.l1.order.length) % state.l1.order.length;
  state.l1.selectedAns = null;
  document.querySelectorAll(".ansbtn").forEach(x => x.classList.remove("is-selected"));
  const chk = byId("l1CheckOne");
  if (chk) chk.disabled = true;
  renderL1One();
  saveProgress();
}
function l1Next() {
  state.l1.idx = (state.l1.idx + 1) % state.l1.order.length;
  state.l1.selectedAns = null;
  document.querySelectorAll(".ansbtn").forEach(x => x.classList.remove("is-selected"));
  const chk = byId("l1CheckOne");
  if (chk) chk.disabled = true;
  renderL1One();
  saveProgress();
}
function l1Restart() {
  state.l1.idx = 0;
  state.l1.selectedAns = null;
  state.l1.results = {};
  state.done[1] = false;
  state.scores[1] = 0;

  state.l1.order = shuffle(state.l1.cards);

  document.querySelectorAll(".ansbtn").forEach(x => x.classList.remove("is-selected"));
  const msg = byId("l1Msg");
  if (msg) msg.textContent = "";
  const chk = byId("l1CheckOne");
  if (chk) chk.disabled = true;

  renderL1One();
  setProgressUI();
  saveProgress();
}

function checkL1One() {
  const card = state.l1.order[state.l1.idx];
  if (!card) return;

  const expected = card.kind;
  const got = state.l1.selectedAns;

  const ok = (expected === got);

  // ✅ Sound
  if (ok) playSuccess(); else playFail();

  state.l1.results[card.id] = ok ? "ok" : "bad";

  const status = byId("l1Status");
  if (status) {
    status.textContent = ok
      ? "✅ إجابة صحيحة (بصريًا)"
      : `❌ غير صحيح — الصحيح: ${
          expected === "eq" ? "متساوي الأضلاع" :
          expected === "iso" ? "متساوي الساقين" : "غير ذلك"
        }`;
  }

  const okCount = Object.values(state.l1.results).filter(v => v === "ok").length;
  state.scores[1] = okCount;

  // اجتياز بصري (24 بطاقة): الثامن أخف، التاسع أشد
  state.done[1] = (state.grade === 9) ? (okCount >= 18) : (okCount >= 16);

  const msg = byId("l1Msg");
  if (msg) {
    msg.textContent = state.done[1]
      ? "✅ اجتزت المستوى 1. يمكنك الانتقال للمستوى 2."
      : "تابع… الهدف هو التمييز البصري بدون قياس.";
  }

  renderL1One();
  setProgressUI();
  saveProgress();

  setTimeout(() => l1Next(), 650);
}

/* =========================
   Level 2 – FINAL
   ✅ Integer display (Math.round)
   ✅ Snap to equilateral when near
   ✅ AB slider + Auto
========================= */

const L2 = {
  AB_USER: null,          // null => Auto
  AB_AUTO_TARGET: 460,    // هدف مريح عند Auto (يُقص حسب الممكن)
  SNAP_ENABLED: true
};

const abUI = { range:null, val:null, auto:null };

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
  _initC: false,
  resize: null,
};

function dist(p,q){ return Math.hypot(p.x-q.x, p.y-q.y); }

function angleAt(P, Q, R){
  const v1 = {x:P.x-Q.x, y:P.y-Q.y};
  const v2 = {x:R.x-Q.x, y:R.y-Q.y};
  const dot = v1.x*v2.x + v1.y*v2.y;
  const n1 = Math.hypot(v1.x,v1.y);
  const n2 = Math.hypot(v2.x,v2.y);
  const c = clamp(dot/(n1*n2), -1, 1);
  return Math.acos(c) * 180/Math.PI;
}

function eqMetrics(A,B,C){
  const ab = dist(A,B), bc = dist(B,C), ca = dist(C,A);
  const avg = (ab+bc+ca)/3;
  const maxSide = Math.max(ab,bc,ca);
  const minSide = Math.min(ab,bc,ca);

  const aA = angleAt(B,A,C);
  const aB = angleAt(A,B,C);
  const aC = angleAt(A,C,B);

  const sideSpread = (maxSide - minSide) / avg;
  const angSpread  = Math.max(Math.abs(aA-60), Math.abs(aB-60), Math.abs(aC-60));

  const okSides = sideSpread < 0.03;
  const okAngs  = angSpread < 2.5;

  const nearSides = sideSpread < 0.08;
  const nearAngs  = angSpread < 12;

  const closeness = clamp(1 - Math.max(sideSpread/0.08, angSpread/12), 0, 1);

  return {
    ok: okSides && okAngs,
    ab, bc, ca, aA, aB, aC,
    near: nearSides && nearAngs,
    closeness
  };
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
}

function drawSymmetryAxes(ctx, A,B,C, alpha){
  const mid = (P,Q)=>({x:(P.x+Q.x)/2, y:(P.y+Q.y)/2});
  const mBC = mid(B,C), mCA = mid(C,A), mAB = mid(A,B);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#93c5fd";
  ctx.lineWidth = 2;
  ctx.setLineDash([8,7]);

  ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(mBC.x,mBC.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(B.x,B.y); ctx.lineTo(mCA.x,mCA.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(C.x,C.y); ctx.lineTo(mAB.x,mAB.y); ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();
}

function drawTriangle(){
  const c = tri.ctx;
  const {A,B,C} = tri;

  c.clearRect(0,0,tri.w,tri.h);

  // edges
  c.lineWidth = 3;
  c.strokeStyle = "#cbd5e1";
  c.beginPath();
  c.moveTo(A.x,A.y); c.lineTo(B.x,B.y); c.lineTo(C.x,C.y); c.closePath();
  c.stroke();

  // symmetry axes when near + measures shown
  if (tri.show) {
    const r = eqMetrics(A,B,C);
    if (r.near) {
      const alpha = 0.08 + 0.30 * r.closeness;
      drawSymmetryAxes(c, A,B,C, alpha);
    }
  }

  // points
  const drawPt = (P, name)=>{
    c.fillStyle = "#f59e0b";
    c.beginPath(); c.arc(P.x,P.y,8,0,Math.PI*2); c.fill();
    c.fillStyle = "#e2e8f0";
    c.font = "bold 16px system-ui";
    c.fillText(name, P.x+10, P.y-10);
  };
  drawPt(A,"A"); drawPt(B,"B"); drawPt(C,"C");

  // centered overlay measurements (✅ integers)
  if (tri.show) {
    const r = eqMetrics(A,B,C);

    const line1 = `AB ≈ ${Math.round(r.ab)}    BC ≈ ${Math.round(r.bc)}    CA ≈ ${Math.round(r.ca)}`;
    const line2 = `∠A ≈ ${Math.round(r.aA)}°    ∠B ≈ ${Math.round(r.aB)}°    ∠C ≈ ${Math.round(r.aC)}°`;

    c.save();
    c.font = "700 18px system-ui";
    c.textAlign = "center";
    c.textBaseline = "middle";

    const padX = 18;
    const w = Math.min(tri.w - 24, Math.max(c.measureText(line1).width, c.measureText(line2).width) + padX*2);
    const h = 86;

    const x = (tri.w - w)/2;
    const y = (tri.h - h)/2;

    c.fillStyle = "rgba(15, 23, 42, 0.78)";
    roundRect(c, x, y, w, h, 14);
    c.fill();

    c.strokeStyle = "rgba(203, 213, 225, 0.25)";
    c.lineWidth = 1;
    c.stroke();

    c.fillStyle = "#e2e8f0";
    c.fillText(line1, tri.w/2, y + h*0.38);
    c.fillText(line2, tri.w/2, y + h*0.72);
    c.restore();
  }
}

function updateABControls(feasibleMax){
  if (!abUI.range || !abUI.val) return;

  const maxInt = Math.max(200, Math.floor(feasibleMax));
  // حدّ أقصى ديناميكي حسب حجم اللوحة (مهم حتى لا تختار قيمة مستحيلة)
  abUI.range.max = String(maxInt);

  // إذا Auto
  if (L2.AB_USER === null) {
    abUI.val.textContent = "Auto";
    return;
  }

  // clamp value إذا تجاوز
  let v = +abUI.range.value;
  if (v > maxInt) {
    v = maxInt;
    abUI.range.value = String(v);
  }
  L2.AB_USER = v;
  abUI.val.textContent = String(v);
}

function attachL2(){
  tri.canvas = byId("triCanvas");
  tri.ctx = tri.canvas.getContext("2d");
  tri.canvas.style.touchAction = "none";

  const resize = ()=>{
    const box = tri.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const cssW = Math.floor(box.width)  || 520;
    const cssH = Math.floor(box.height) || 460;

    tri.w = Math.max(360, cssW);
    tri.h = Math.max(340, cssH);

    tri.canvas.width  = Math.floor(tri.w * dpr);
    tri.canvas.height = Math.floor(tri.h * dpr);
    tri.ctx.setTransform(dpr,0,0,dpr,0,0);

    // قيود هندسية لضمان إمكانيّة المتساوي الأضلاع
    const TOP = 24;
    const BOTTOM = 34;
    const SIDE = 70;

    const baseY = tri.h - BOTTOM;
    const hAvail = baseY - TOP;

    // AB <= 2*hAvail/sqrt(3)
    const maxABfromHeight = (2 * hAvail) / Math.sqrt(3);
    const maxABfromWidth  = tri.w - 2 * SIDE;
    const feasibleMax = Math.min(maxABfromWidth, maxABfromHeight);

    // تحديث slider max ديناميكيًا
    updateABControls(feasibleMax);

    // اختيار AB (Auto أو يدوي)
    let AB;
    if (L2.AB_USER === null) {
      AB = Math.min(feasibleMax, L2.AB_AUTO_TARGET);
    } else {
      AB = clamp(L2.AB_USER, 200, feasibleMax);
      // إذا أصبح AB أقل/أكبر بسبب قيود الشاشة
      if (abUI.range) abUI.range.value = String(Math.floor(AB));
      if (abUI.val) abUI.val.textContent = String(Math.floor(AB));
    }

    // ضع القاعدة بالوسط
    const ax = Math.round((tri.w - AB) / 2);
    const bx = Math.round((tri.w + AB) / 2);

    tri.A = { x: ax, y: baseY };
    tri.B = { x: bx, y: baseY };

    const midX = Math.round((ax + bx) / 2);
    const eqHeight = (Math.sqrt(3) / 2) * AB;

    // init C قريب من المتساوي الأضلاع
    if (!tri._initC) {
      tri.C = { x: midX, y: Math.round(baseY - eqHeight) };
      tri._initC = true;
    } else {
      tri.C.x = clamp(tri.C.x, 40, tri.w - 40);
      tri.C.y = clamp(tri.C.y, TOP, baseY - 20);
    }

    drawTriangle();
  };

  tri.resize = resize;
  window.addEventListener("resize", resize);
  resize();

  const hitC = (x,y)=> Math.hypot(x-tri.C.x, y-tri.C.y) < 26;

  tri.canvas.addEventListener("pointerdown",(e)=>{
    const rect = tri.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (hitC(x,y)) {
      tri.drag = true;
      tri.canvas.setPointerCapture(e.pointerId);
    }
  });

  tri.canvas.addEventListener("pointermove",(e)=>{
    if (!tri.drag) return;
    const rect = tri.canvas.getBoundingClientRect();

    const TOP = 24;
    const baseY = tri.A.y;

    tri.C.x = clamp(e.clientX - rect.left, 40, tri.w - 40);
    tri.C.y = clamp(e.clientY - rect.top, TOP, baseY - 20);

    // ✅ Snap ذكي لتسهيل الوصول (حتى بدون دقة الأعشار)
    if (L2.SNAP_ENABLED) {
      const r = eqMetrics(tri.A, tri.B, tri.C);
      if (r.near) {
        const A = tri.A, B = tri.B;
        const AB = dist(A,B);
        const midX = (A.x + B.x) / 2;
        const eqH = (Math.sqrt(3)/2) * AB;

        const targetX = midX;
        const targetY = A.y - eqH;

        // مزج تدريجي (لا يقفز)
        const t = 0.25 + 0.55 * r.closeness; // 0.25..0.8
        tri.C.x = tri.C.x*(1-t) + targetX*t;
        tri.C.y = tri.C.y*(1-t) + targetY*t;
      }
    }

    drawTriangle();
  });

  tri.canvas.addEventListener("pointerup",()=>{
    tri.drag = false;
  });

  tri.canvas.addEventListener("pointercancel",()=>{
    tri.drag = false;
  });
}

function checkL2(){
  const r = eqMetrics(tri.A, tri.B, tri.C);
  const msg = byId("l2Msg");
  if (!msg) return;

  if (r.ok) {
    state.l2.ok = true;
    msg.textContent = "✅ ممتاز! هذا قريب جدًا من مثلث متساوي الأضلاع.";
    playSuccess(); // ✅ Sound
  } else {
    state.l2.ok = false;
    msg.textContent = "❗ ليس بعد. قرّب الأضلاع أكثر وقرّب الزوايا إلى 60° (Snap سيساعدك عند الاقتراب).";
    playFail(); // ✅ Sound
  }
}

function saveL2Answers(){
  const a1 = byId("l2q1")?.value || "";
  const a2 = byId("l2q2")?.value || "";
  const a3 = byId("l2q3")?.value || "";

  let score = 0;
  if (a1==="a") score++;
  if (a2==="a") score++;
  if (a3==="a") score++;

  const pass = (state.grade === 9) ? (score===3 && state.l2.ok) : (score>=2);

  // ✅ Sound (on pass/fail)
  if (pass) playSuccess(); else playFail();

  state.scores[2] = score;
  state.done[2] = pass;

  const s = byId("l2Score");
  const d = byId("l2Done");
  if (s) s.textContent = `النتيجة: ${score}/3 — ${pass ? "✅ اجتزت" : "❗ راجع"}`;
  if (d) d.textContent = pass ? "ممتاز. انتقل للمستوى 3." : "";

  setProgressUI();
}

/* =========================
   Level 3 – check (كما هو في index)
========================= */
function checkL3(){
  const v1 = byId("l3_1")?.value || "";
  const v2 = byId("l3_2")?.value || "";
  const v3 = byId("l3_3")?.value || "";
  const v4 = byId("l3_4")?.value || "";
  const txt= (byId("l3_txt")?.value || "").trim();

  let score = 0;
  if (v1 === "a") score++;
  if (v2 === "a") score++;
  if (v3 === "a") score++;
  if (v4 === "a") score++;

  const hasText = txt.split(/\s+/).filter(Boolean).length >= (state.grade===9 ? 10 : 6);
  if (hasText) score++;

  const pass = (state.grade === 9) ? (score >= 4) : (score >= 3);

  // ✅ Sound
  if (pass) playSuccess(); else playFail();

  state.scores[3] = score;
  state.done[3] = pass;

  const out = byId("l3Score");
  const msg = byId("l3Msg");
  if (out) out.textContent = `النتيجة: ${score}/5`;
  if (msg) msg.textContent = pass
    ? "✅ ممتاز. انتقل للمستوى 4."
    : "❗ راجع إجاباتك وحاول كتابة تعليل أوضح.";

  setProgressUI();
}

/* =========================
   Level 4 – proof ordering (كما في النسخة السابقة)
========================= */
const REASONS = [
  { v:"given", t:"معطى" },
  { v:"sum180", t:"مجموع زوايا المثلث = 180°" },
  { v:"isoscelesAngles", t:"في متساوي الساقين: زاويتان متساويتان" },
  { v:"sss", t:"تطابق SSS" },
  { v:"midpoint", t:"تعريف منتصف القطعة" },
  { v:"bisector", t:"تعريف منصف الزاوية" },
  { v:"perp", t:"تعريف العمود" },
  { v:"conclude", t:"استنتاج" },
];

const PROOF_A_STEPS = [
  { id:"a1", text:"ليكن ABC مثلثًا متساوي الأضلاع: AB = BC = CA.", reason:"given", order:1 },
  { id:"a2", text:"من AB = AC نستنتج ∠B = ∠C (متساوي الساقين).", reason:"isoscelesAngles", order:2 },
  { id:"a3", text:"ومن AB = BC نستنتج ∠A = ∠C (متساوي الساقين).", reason:"isoscelesAngles", order:3 },
  { id:"a4", text:"إذن ∠A = ∠B = ∠C.", reason:"conclude", order:4 },
  { id:"a5", text:"ومجموع الزوايا 180° ⇒ كل زاوية = 60°.", reason:"sum180", order:5 },
];

const PROOF_B_STEPS = [
  { id:"b1", text:"ليكن ABC متساوي الأضلاع، و M منتصف BC.", reason:"midpoint", order:1 },
  { id:"b2", text:"إذن BM = CM و AB = AC و AM مشترك.", reason:"given", order:2 },
  { id:"b3", text:"إذن المثلثان ABM و ACM متطابقان (SSS).", reason:"sss", order:3 },
  { id:"b4", text:"فينتج ∠BAM = ∠MAC ⇒ AM منصف ∠A.", reason:"bisector", order:4 },
  { id:"b5", text:"وكذلك ∠AMB = ∠CMA ومعهما على استقامة واحدة ⇒ AM ⟂ BC.", reason:"perp", order:5 },
  { id:"b6", text:"إذن AM متوسط ومنصف وارتفاع في آنٍ واحد.", reason:"conclude", order:6 },
];

function initProofState(){
  if (!Array.isArray(state.l4.proofA.order) || state.l4.proofA.order.length === 0) {
    state.l4.proofA.order = shuffle(PROOF_A_STEPS.map(s => s.id));
    state.l4.proofA.reasons = {};
  }
  if (!Array.isArray(state.l4.proofB.order) || state.l4.proofB.order.length === 0) {
    state.l4.proofB.order = shuffle(PROOF_B_STEPS.map(s => s.id));
    state.l4.proofB.reasons = {};
  }
}

function stepById(list, id){ return list.find(s => s.id === id); }

function renderProof(containerId, proofKey, stepsDef){
  const box = byId(containerId);
  if (!box) return;

  const st = state.l4[proofKey];
  box.innerHTML = "";

  st.order.forEach((stepId, idx) => {
    const step = stepById(stepsDef, stepId);
    if (!step) return;

    const el = document.createElement("div");
    el.className = "step";

    const top = document.createElement("div");
    top.className = "stepTop";

    const txt = document.createElement("div");
    txt.className = "stepTxt";
    txt.textContent = `${idx+1}) ${step.text}`;

    const btns = document.createElement("div");
    btns.className = "stepBtns";

    const up = document.createElement("button");
    up.className = "smallbtn";
    up.textContent = "↑";
    up.disabled = idx === 0;
    up.addEventListener("click", ()=>{
      const arr = st.order;
      [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
      renderProof(containerId, proofKey, stepsDef);
      saveProgress();
    });

    const down = document.createElement("button");
    down.className = "smallbtn";
    down.textContent = "↓";
    down.disabled = idx === st.order.length - 1;
    down.addEventListener("click", ()=>{
      const arr = st.order;
      [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
      renderProof(containerId, proofKey, stepsDef);
      saveProgress();
    });

    btns.appendChild(up);
    btns.appendChild(down);
    top.appendChild(txt);
    top.appendChild(btns);

    const reasonRow = document.createElement("div");
    reasonRow.className = "reasonRow";

    const sel = document.createElement("select");
    sel.className = "ctl";
    sel.style.minWidth = "260px";

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "اختر السبب…";
    sel.appendChild(opt0);

    REASONS.forEach(r=>{
      const o = document.createElement("option");
      o.value = r.v;
      o.textContent = r.t;
      sel.appendChild(o);
    });

    sel.value = st.reasons[stepId] || "";
    sel.addEventListener("change", ()=>{
      st.reasons[stepId] = sel.value;
      saveProgress();
    });

    reasonRow.appendChild(sel);

    el.appendChild(top);
    el.appendChild(reasonRow);

    box.appendChild(el);
  });
}

function checkProof(proofKey, stepsDef, scoreElId){
  const st = state.l4[proofKey];

  let orderOk = true;
  for (let i=0;i<st.order.length;i++){
    const step = stepById(stepsDef, st.order[i]);
    if (!step || step.order !== (i+1)) { orderOk = false; break; }
  }

  let reasonsOkCount = 0;
  stepsDef.forEach(s=>{
    if ((st.reasons[s.id] || "") === s.reason) reasonsOkCount++;
  });

  const total = stepsDef.length;

  const pass =
    (state.grade === 9)
      ? (orderOk && reasonsOkCount === total)
      : (reasonsOkCount >= Math.ceil(total*0.7));

  const el = byId(scoreElId);
  if (el) el.textContent = (orderOk ? "ترتيب: ✅" : "ترتيب: ❗") + ` | أسباب: ${reasonsOkCount}/${total}`;

  return { pass, reasonsOkCount, total };
}

function finishL4(){
  const a = checkProof("proofA", PROOF_A_STEPS, "scoreA");
  const b = checkProof("proofB", PROOF_B_STEPS, "scoreB");

  const pass = (state.grade === 9) ? (a.pass && b.pass) : (a.reasonsOkCount + b.reasonsOkCount >= 7);

  // ✅ Sound
  if (pass) playSuccess(); else playFail();

  state.done[4] = pass;
  state.scores[4] = a.reasonsOkCount + b.reasonsOkCount;

  const msg = byId("finalMsg");
  if (msg) msg.textContent = pass
    ? "✅ تم إنهاء النشاط وحفظ النتيجة."
    : "❗ لم يكتمل بعد — راجع الترتيب/الأسباب.";

  setProgressUI();
  saveProgress();
}

function drawProofCanvas(){
  const canvas = byId("proofCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const box = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  const w = Math.max(360, Math.floor(box.width) || 520);
  const h = Math.max(280, Math.floor(box.height) || 340);

  canvas.width = Math.floor(w * dpr);
  canvas.height= Math.floor(h * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);

  ctx.clearRect(0,0,w,h);

  const A = { x: w*0.25, y: h*0.78 };
  const B = { x: w*0.75, y: h*0.78 };
  const AB = dist(A,B);
  const height = (Math.sqrt(3)/2)*AB;
  const C = { x:(A.x+B.x)/2, y: A.y - height };
  const M = { x:(B.x+C.x)/2, y:(B.y+C.y)/2 };

  ctx.lineWidth = 3;
  ctx.strokeStyle = "#cbd5e1";
  ctx.beginPath();
  ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.lineTo(C.x,C.y); ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = "#93c5fd";
  ctx.setLineDash([8,7]);
  ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(M.x, M.y); ctx.stroke();
  ctx.setLineDash([]);

  const pt = (P, label)=>{
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath(); ctx.arc(P.x,P.y,7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 16px system-ui";
    ctx.fillText(label, P.x+10, P.y-10);
  };
  pt(A,"A"); pt(B,"B"); pt(C,"C"); pt(M,"M");
}

/* =========================
   Boot
========================= */
async function init(){
  loadProgress();

  // Tabs
  document.querySelectorAll(".tab").forEach(t=>{
    t.addEventListener("click", ()=> setLevel(+t.dataset.level));
  });

  // Grade
  const gradeSel = byId("gradeSel");
  if (gradeSel) {
    gradeSel.value = String(state.grade);
    gradeSel.addEventListener("change", ()=>{
      state.grade = +gradeSel.value;
      saveProgress();
    });
  }

  // Reset
  const resetBtn = byId("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", ()=>{
      localStorage.removeItem(KEY);
      location.reload();
    });
  }

  // ------- Level 1 -------
  try {
    state.l1.loading = true;
    renderL1One();

    const cards = await loadCardsManifest();
    state.l1.cards = cards;
    state.l1.order = shuffle(cards);
    state.l1.idx = clamp(state.l1.idx, 0, state.l1.order.length-1);
    state.l1.loading = false;
    state.l1.error = null;

    document.querySelectorAll(".ansbtn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        state.l1.selectedAns = btn.dataset.ans;
        document.querySelectorAll(".ansbtn").forEach(b=>b.classList.remove("is-selected"));
        btn.classList.add("is-selected");

        const chk = byId("l1CheckOne");
        if (chk) chk.disabled = false;
      });
    });

    byId("l1CheckOne")?.addEventListener("click", checkL1One);
    byId("l1Prev")?.addEventListener("click", l1Prev);
    byId("l1Next")?.addEventListener("click", l1Next);
    byId("l1Restart")?.addEventListener("click", l1Restart);

    renderL1One();
  } catch (e) {
    state.l1.loading = false;
    state.l1.error = e?.message || String(e);
    renderL1One();
  }

  byId("to2")?.addEventListener("click", ()=> setLevel(2));

  // ------- Level 2 -------
  attachL2();

  // Slider hooks
  abUI.range = byId("abRange");
  abUI.val   = byId("abVal");
  abUI.auto  = byId("abAuto");

  if (abUI.range && abUI.val && abUI.auto) {
    // start with slider value (manual)
    L2.AB_USER = +abUI.range.value;
    abUI.val.textContent = String(abUI.range.value);
    tri._initC = false;
    tri.resize();

    abUI.range.addEventListener("input", ()=>{
      L2.AB_USER = +abUI.range.value;
      abUI.val.textContent = String(abUI.range.value);
      tri._initC = false;
      tri.resize();
    });

    abUI.auto.addEventListener("click", ()=>{
      L2.AB_USER = null;           // Auto
      abUI.val.textContent = "Auto";
      tri._initC = false;
      tri.resize();
    });
  }

  byId("showMeasures")?.addEventListener("click", ()=>{
    tri.show = !tri.show;
    drawTriangle();
  });

  byId("l2Check")?.addEventListener("click", checkL2);

  byId("l2Reset")?.addEventListener("click", ()=>{
    tri._initC = false;
    tri.resize();
    const msg = byId("l2Msg");
    if (msg) msg.textContent = "";
    state.l2.ok = false;
    drawTriangle();
  });

  byId("l2Save")?.addEventListener("click", saveL2Answers);
  byId("to3")?.addEventListener("click", ()=> setLevel(3));

  // ------- Level 3 -------
  byId("l3Check")?.addEventListener("click", checkL3);
  byId("to4")?.addEventListener("click", ()=> setLevel(4));

  // ------- Level 4 -------
  initProofState();
  renderProof("proofA", "proofA", PROOF_A_STEPS);
  renderProof("proofB", "proofB", PROOF_B_STEPS);

  byId("checkA")?.addEventListener("click", ()=> checkProof("proofA", PROOF_A_STEPS, "scoreA"));
  byId("checkB")?.addEventListener("click", ()=> checkProof("proofB", PROOF_B_STEPS, "scoreB"));
  byId("finish")?.addEventListener("click", finishL4);

  // canvas helper
  requestAnimationFrame(()=> drawProofCanvas());

  setProgressUI();
}

init();
