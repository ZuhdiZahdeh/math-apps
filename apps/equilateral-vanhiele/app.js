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

  // Level 1
  l1: {
    loading: false,
    error: null,
    cards: [],
    order: [],
    idx: 0,
    selectedAns: null,
    results: {}, // {cardId: "ok" | "bad"}
  },

  // Level 2
  l2: { ok: false }
};

/* =========================
   Save / Load progress
========================= */
function saveProgress() {
  const payload = {
    grade: state.grade,
    done: state.done,
    scores: state.scores,
    l1: {
      results: state.l1.results,
      idx: state.l1.idx
    }
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
    if (p.done) state.done = {...state.done, ...p.done};
    if (p.scores) state.scores = {...state.scores, ...p.scores};
    if (p.l1?.results) state.l1.results = p.l1.results;
    if (typeof p.l1?.idx === "number") state.l1.idx = p.l1.idx;
  } catch(e) {}
}

/* =========================
   Level navigation
========================= */
function setLevel(level) {
  state.level = level;

  document.querySelectorAll(".tab").forEach(t=>{
    t.classList.toggle("is-active", +t.dataset.level === level);
  });
  document.querySelectorAll(".level").forEach(sec=>{
    sec.classList.toggle("is-active", +sec.dataset.level === level);
  });

  // ✅ إصلاح: عند فتح المستوى 2 نعيد قياس الـCanvas بعد أن يصبح ظاهرًا
  if (level === 2) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          if (tri && typeof tri.resize === "function") tri.resize();
          else window.dispatchEvent(new Event("resize"));
        } catch (e) {
          window.dispatchEvent(new Event("resize"));
        }
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

function sanitizeSrc(src){
  try {
    const u = new URL(src, location.href);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch(e) {
    // allow relative paths
    if (typeof src === "string" && src.trim()) return src.trim();
    return null;
  }
}

/**
 * Robust loader:
 * supports cards.json formats like:
 * 1) [{id, kind, src}]
 * 2) {items:[...]} / {cards:[...]}
 */
async function loadCardsManifest(){
  const candidates = ["./cards.json", "../cards.json", "../../cards.json"];

  let lastErr = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${url}`);

      const raw = await res.json();
      const list =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.items) ? raw.items :
        Array.isArray(raw?.cards) ? raw.cards :
        [];

      const cleaned = list
        .map(x=>{
          const id = x?.id ?? x?.num ?? x?.n;
          const kind = x?.kind ?? x?.type ?? "triangle";
          const src = x?.src ?? x?.image ?? x?.path;
          return { id, kind, src };
        })
        .filter(x => x.id != null && sanitizeSrc(String(x.src)));

      if (cleaned.length === 0) {
        lastErr = new Error(`No valid items (id/kind/src) found in ${url}`);
        continue;
      }

      // normalize src
      return cleaned.map(x => ({
        ...x,
        src: sanitizeSrc(String(x.src))
      }));
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("Failed to load cards.json");
}

/* =========================
   Progress UI
========================= */
function setProgressUI(){
  const doneCount = [1,2,3,4].filter(k => state.done[k]).length;
  const progText = byId("progText");
  const barFill = byId("barFill");

  if (progText) progText.textContent = `${doneCount}/4`;
  if (barFill) barFill.style.width = `${(doneCount/4)*100}%`;

  // enable/disable next buttons
  const to2 = byId("to2");
  const to3 = byId("to3");
  const to4 = byId("to4");

  if (to2) to2.disabled = false; // level 1 always accessible; gating is handled by teacher
  if (to3) to3.disabled = !state.done[2];
  if (to4) to4.disabled = !state.done[3];

  saveProgress();
}

/* =========================
   Level 1 (updated UI): one card
   IDs used in HTML:
   l1BigShape, l1Now, l1Total, l1Nums
   Buttons: l1Prev, l1Next, l1Restart, l1CheckOne
   Answer buttons: .ansbtn[data-ans="eq|iso|other"]
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

    b.addEventListener("click", ()=>{
      state.l1.idx = i;
      state.l1.selectedAns = null;
      document.querySelectorAll(".ansbtn").forEach(x=>x.classList.remove("is-selected"));
      const chk = byId("l1CheckOne");
      if (chk) chk.disabled = true;
      renderL1One();
    });

    box.appendChild(b);
  });
}

function renderL1One() {
  const big = byId("l1BigShape");
  const now = byId("l1Now");
  const total = byId("l1Total");
  const msg = byId("l1Msg");
  const status = byId("l1Status");
  const scoreOne = byId("l1ScoreOne");

  if (!big) return;

  if (state.l1.loading) {
    big.innerHTML = `<div class="muted">جارٍ التحميل…</div>`;
    return;
  }
  if (state.l1.error) {
    big.innerHTML = `<div class="muted">⚠ ${state.l1.error}</div>`;
    return;
  }

  const card = state.l1.order[state.l1.idx];
  if (!card) {
    big.innerHTML = `<div class="muted">لا توجد بطاقات.</div>`;
    return;
  }

  if (now) now.textContent = String(state.l1.idx + 1);
  if (total) total.textContent = String(state.l1.order.length);

  // display SVG via <img>
  big.innerHTML = `
    <img
      src="${card.src}"
      alt="بطاقة مثلث"
      style="width:min(520px, 85%); height:auto; display:block;"
    />
  `;

  // update msg/status
  const res = state.l1.results[card.id];
  if (msg) msg.textContent = "";
  if (status) {
    status.textContent =
      res === "ok" ? "✅ تم حل هذه البطاقة" :
      res === "bad" ? "❗ تمت المحاولة (غير صحيح)" :
      "";
  }

  // score (count ok)
  const okCount = Object.values(state.l1.results).filter(x=>x==="ok").length;
  if (scoreOne) scoreOne.textContent = `صحيح: ${okCount}/${state.l1.order.length}`;

  renderL1Nums();
}

function l1Prev(){
  state.l1.idx = Math.max(0, state.l1.idx - 1);
  state.l1.selectedAns = null;
  document.querySelectorAll(".ansbtn").forEach(b=>b.classList.remove("is-selected"));
  const chk = byId("l1CheckOne");
  if (chk) chk.disabled = true;
  renderL1One();
}

function l1Next(){
  state.l1.idx = Math.min(state.l1.order.length - 1, state.l1.idx + 1);
  state.l1.selectedAns = null;
  document.querySelectorAll(".ansbtn").forEach(b=>b.classList.remove("is-selected"));
  const chk = byId("l1CheckOne");
  if (chk) chk.disabled = true;
  renderL1One();
}

function l1Restart(){
  state.l1.results = {};
  state.l1.idx = 0;
  state.l1.selectedAns = null;
  document.querySelectorAll(".ansbtn").forEach(b=>b.classList.remove("is-selected"));
  const chk = byId("l1CheckOne");
  if (chk) chk.disabled = true;
  renderL1One();
  setProgressUI();
}

function checkL1One(){
  const card = state.l1.order[state.l1.idx];
  if (!card) return;

  const picked = state.l1.selectedAns;
  if (!picked) return;

  const ok = picked === card.kind;
  state.l1.results[card.id] = ok ? "ok" : "bad";

  // simple completion rule: solve at least 1 correct to unlock Level 2 logic
  const okCount = Object.values(state.l1.results).filter(x=>x==="ok").length;
  state.done[1] = okCount >= 1;
  state.scores[1] = okCount;

  const msg = byId("l1Msg");
  if (msg) msg.textContent = ok ? "✅ صحيح (بصريًا)!" : "❗ ليست الإجابة الصحيحة. جرّب بطاقة أخرى.";

  // auto move to next after correct (optional gentle)
  if (ok) {
    setTimeout(() => {
      l1Next();
    }, 700);
  }

  renderL1One();
  setProgressUI();
}

/* =========================
   Level 2 – Descriptive canvas (fixed + improved)
   ✅ Drag works immediately when entering Level 2 (no Inspect needed)
   ✅ Bigger canvas (height controlled by CSS, JS reads actual size)
   ✅ Measurements centered & readable
   ✅ Auto-centering keeps triangle within a comfortable area
   ✅ Show 3 symmetry axes (light dashed) when near-equilateral
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

  _initC: false,
  resize: null,
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
  const maxSide = Math.max(ab,bc,ca);
  const minSide = Math.min(ab,bc,ca);

  const aA = angleAt(B,A,C), aB = angleAt(A,B,C), aC = angleAt(A,C,B);

  // spreads
  const sideSpread = (maxSide - minSide) / avg; // 0 = perfect
  const angSpread  = Math.max(Math.abs(aA-60), Math.abs(aB-60), Math.abs(aC-60));

  // strict tolerance (for check)
  const okSides = sideSpread < 0.03;
  const okAngs  = angSpread < 2.5;

  // softer "near" (for symmetry axes visualization)
  const nearSides = sideSpread < 0.08;
  const nearAngs  = angSpread < 12;

  const closeness = clamp(
    1 - Math.max(sideSpread/0.08, angSpread/12),
    0, 1
  );

  return {
    ok: okSides && okAngs,
    ab, bc, ca,
    aA, aB, aC,
    okSides, okAngs,
    near: nearSides && nearAngs,
    closeness,
    sideSpread,
    angSpread
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

/**
 * Auto-centering (soft):
 * - if triangle goes too close to edges, shift it back inside.
 * - on resize / reset we can force a nicer centered position.
 */
function centerTriangle({margin=40, force=false} = {}) {
  const {A,B,C} = tri;

  const minX = Math.min(A.x,B.x,C.x);
  const maxX = Math.max(A.x,B.x,C.x);
  const minY = Math.min(A.y,B.y,C.y);
  const maxY = Math.max(A.y,B.y,C.y);

  const inside =
    (minX >= margin) &&
    (maxX <= tri.w - margin) &&
    (minY >= margin) &&
    (maxY <= tri.h - margin);

  if (!force && inside) return;

  // target centroid position (comfortable view)
  const centroid = { x:(A.x+B.x+C.x)/3, y:(A.y+B.y+C.y)/3 };
  const target = { x: tri.w/2, y: tri.h*0.58 };

  let dx = target.x - centroid.x;
  let dy = target.y - centroid.y;

  // if not forced, only shift minimally to bring inside
  if (!force) {
    dx = 0; dy = 0;
    if (minX < margin) dx = margin - minX;
    if (maxX > tri.w - margin) dx = (tri.w - margin) - maxX;
    if (minY < margin) dy = margin - minY;
    if (maxY > tri.h - margin) dy = (tri.h - margin) - maxY;
  }

  A.x += dx; A.y += dy;
  B.x += dx; B.y += dy;
  C.x += dx; C.y += dy;

  // clamp final
  A.x = clamp(A.x, margin, tri.w-margin); A.y = clamp(A.y, margin, tri.h-margin);
  B.x = clamp(B.x, margin, tri.w-margin); B.y = clamp(B.y, margin, tri.h-margin);
  C.x = clamp(C.x, margin, tri.w-margin); C.y = clamp(C.y, margin, tri.h-margin);
}

function drawSymmetryAxes(ctx, A,B,C, alpha) {
  const mid = (P,Q)=>({x:(P.x+Q.x)/2, y:(P.y+Q.y)/2});
  const mBC = mid(B,C);
  const mCA = mid(C,A);
  const mAB = mid(A,B);

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

function drawTriangle() {
  const c = tri.ctx;
  const {A,B,C} = tri;

  c.clearRect(0,0,tri.w,tri.h);

  // Triangle edges
  c.lineWidth = 3;
  c.strokeStyle = "#cbd5e1";
  c.beginPath();
  c.moveTo(A.x,A.y);
  c.lineTo(B.x,B.y);
  c.lineTo(C.x,C.y);
  c.closePath();
  c.stroke();

  // Symmetry axes (near-equilateral)
  if (tri.show) {
    const r = isEquilateral(A,B,C);
    if (r.near) {
      const alpha = 0.08 + (0.30 * r.closeness);
      drawSymmetryAxes(c, A,B,C, alpha);
    }
  }

  // Points
  const drawPt = (P, name)=>{
    c.fillStyle = "#f59e0b";
    c.beginPath();
    c.arc(P.x,P.y,8,0,Math.PI*2);
    c.fill();
    c.fillStyle = "#e2e8f0";
    c.font = "bold 16px system-ui";
    c.fillText(name, P.x+10, P.y-10);
  };
  drawPt(A,"A"); drawPt(B,"B"); drawPt(C,"C");

  // Measurements (center overlay)
  if (tri.show) {
    const r = isEquilateral(A,B,C);

    const line1 = `AB ≈ ${r.ab.toFixed(1)}    BC ≈ ${r.bc.toFixed(1)}    CA ≈ ${r.ca.toFixed(1)}`;
    const line2 = `∠A ≈ ${r.aA.toFixed(1)}°    ∠B ≈ ${r.aB.toFixed(1)}°    ∠C ≈ ${r.aC.toFixed(1)}°`;

    c.save();
    c.font = "700 18px system-ui";
    c.textAlign = "center";
    c.textBaseline = "middle";

    const padX = 18;
    const w = Math.min(tri.w - 24, Math.max(c.measureText(line1).width, c.measureText(line2).width) + padX*2);
    const h = 86;

    const x = (tri.w - w) / 2;
    const y = (tri.h - h) / 2;

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

function attachL2() {
  tri.canvas = byId("triCanvas");
  tri.ctx = tri.canvas.getContext("2d");

  // Improve touch dragging
  tri.canvas.style.touchAction = "none";

  const resize = ()=>{
    const box = tri.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // If hidden at measure time, width/height may be 0
    const cssW = Math.floor(box.width)  || 520;
    const cssH = Math.floor(box.height) || 460;

    tri.w = Math.max(360, cssW);
    tri.h = Math.max(340, cssH);

    tri.canvas.width  = Math.floor(tri.w * dpr);
    tri.canvas.height = Math.floor(tri.h * dpr);
    tri.ctx.setTransform(dpr,0,0,dpr,0,0);

    const baseY = Math.floor(tri.h * 0.78);

    // Place A,B
    tri.A = {x: Math.floor(tri.w*0.22), y: baseY};
    tri.B = {x: Math.floor(tri.w*0.78), y: baseY};

    // Init / clamp C
    if (!tri._initC) {
      tri.C = {x: Math.floor(tri.w*0.55), y: Math.floor(tri.h*0.28)};
      tri._initC = true;
    } else {
      tri.C.x = clamp(tri.C.x, 40, tri.w-40);
      tri.C.y = clamp(tri.C.y, 40, tri.h-40);
    }

    // Force a nice centered view after resize
    centerTriangle({margin:40, force:true});
    drawTriangle();
  };

  tri.resize = resize;

  window.addEventListener("resize", resize);
  resize();

  // Easier hit area for point C
  const hitC = (x,y)=> Math.hypot(x-tri.C.x, y-tri.C.y) < 26;

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

  tri.canvas.addEventListener("pointerup",()=>{
    tri.drag = false;
    // Soft centering only if it went too close to edges
    centerTriangle({margin:40, force:false});
    drawTriangle();
  });

  tri.canvas.addEventListener("pointercancel",()=>{
    tri.drag = false;
  });
}

function checkL2() {
  const r = isEquilateral(tri.A,tri.B,tri.C);
  const msg = byId("l2Msg");
  if (!msg) return;

  if (r.ok) {
    state.l2.ok = true;
    msg.textContent = "✅ ممتاز! هذا قريب جدًا من مثلث متساوي الأضلاع.";
  } else {
    state.l2.ok = false;
    msg.textContent = `❗ ليس بعد. ${r.okSides ? "الأضلاع جيدة" : "قرّب الأضلاع للتساوي"}، و${r.okAngs ? "الزوايا جيدة" : "قرّب الزوايا إلى 60°"}.`;
  }
}

function saveL2Answers() {
  const a1 = byId("l2q1")?.value || "";
  const a2 = byId("l2q2")?.value || "";
  const a3 = byId("l2q3")?.value || "";

  let score = 0;
  if (a1==="a") score++;
  if (a2==="a") score++;
  if (a3==="a") score++;

  // In grade 9: require full score + actual near-eq check
  const pass = (state.grade === 9) ? (score===3 && state.l2.ok) : (score>=2);

  state.scores[2] = score;
  state.done[2] = pass;

  const l2Score = byId("l2Score");
  const l2Done  = byId("l2Done");

  if (l2Score) l2Score.textContent = `النتيجة: ${score}/3 — ${pass ? "✅ اجتزت" : "❗ راجع الإجابات"}`;
  if (l2Done) l2Done.textContent = pass ? "ممتاز. انتقل للاستدلال غير الرسمي." : "";

  setProgressUI();
  saveProgress();
}

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

  // -------- Level 1: load cards.json --------
  try {
    state.l1.loading = true;
    renderL1One();

    const cards = await loadCardsManifest();
    state.l1.cards = cards;
    state.l1.order = shuffle(cards);
    state.l1.idx = Math.min(state.l1.idx, state.l1.order.length-1);
    state.l1.selectedAns = null;

    // Answer selection buttons
    document.querySelectorAll(".ansbtn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const ans = btn.dataset.ans;
        state.l1.selectedAns = ans;
        document.querySelectorAll(".ansbtn").forEach(b=>b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        const chk = byId("l1CheckOne");
        if (chk) chk.disabled = false;
      });
    });

    const l1CheckOne = byId("l1CheckOne");
    if (l1CheckOne) l1CheckOne.addEventListener("click", checkL1One);

    const l1PrevBtn = byId("l1Prev");
    if (l1PrevBtn) l1PrevBtn.addEventListener("click", l1Prev);

    const l1NextBtn = byId("l1Next");
    if (l1NextBtn) l1NextBtn.addEventListener("click", l1Next);

    const l1RestartBtn = byId("l1Restart");
    if (l1RestartBtn) l1RestartBtn.addEventListener("click", l1Restart);

    state.l1.loading = false;
    renderL1One();
  } catch (e) {
    state.l1.loading = false;
    state.l1.error = e?.message || String(e);
    renderL1One();
  }

  // Go to Level 2
  const to2 = byId("to2");
  if (to2) to2.addEventListener("click", ()=> setLevel(2));

  // -------- Level 2 --------
  attachL2();

  const showMeasures = byId("showMeasures");
  if (showMeasures) {
    showMeasures.addEventListener("click", ()=>{
      tri.show = !tri.show;
      drawTriangle();
    });
  }

  const l2Check = byId("l2Check");
  if (l2Check) l2Check.addEventListener("click", checkL2);

  const l2Reset = byId("l2Reset");
  if (l2Reset) {
    l2Reset.addEventListener("click", ()=>{
      tri.C.x = Math.floor(tri.w*0.55);
      tri.C.y = Math.floor(tri.h * 0.28);
      const l2Msg = byId("l2Msg");
      if (l2Msg) l2Msg.textContent = "";
      state.l2.ok = false;
      centerTriangle({margin:40, force:true});
      drawTriangle();
    });
  }

  const l2Save = byId("l2Save");
  if (l2Save) l2Save.addEventListener("click", saveL2Answers);

  setProgressUI();
}

init();
