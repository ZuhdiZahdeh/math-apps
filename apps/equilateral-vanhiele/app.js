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
    cards: [],
    idx: 0,
    selected: null,
    // score is 1 card only for now
  },

  // Level 2
  l2: {
    ok: false
  },

  // Level 3 + 4 placeholders
  l3: {},
  l4: {}
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
    if (p.grade) state.grade = p.grade;
    if (p.done) state.done = {...state.done, ...p.done};
    if (p.scores) state.scores = {...state.scores, ...p.scores};
  } catch(e) {}
}

/* =========================
   Helpers
========================= */
function setGrade(g) {
  state.grade = g;
  byId("gradeLabel").textContent = `الصف: ${g}`;
  saveProgress();
  setProgressUI();
}

function setLevel(level) {
  state.level = level;

  document.querySelectorAll(".tab").forEach(t=>{
    t.classList.toggle("is-active", +t.dataset.level === level);
  });
  document.querySelectorAll(".level").forEach(sec=>{
    sec.classList.toggle("is-active", +sec.dataset.level === level);
  });

  // ✅ مهم: عند فتح المستوى 2 أعد قياس الـCanvas بعد أن يصبح ظاهرًا
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

function setProgressUI() {
  // show small progress or status messages if exist
  // Level 1
  const l1Score = state.scores[1];
  if (l1Score !== null) byId("l1Score").textContent = `النتيجة: ${l1Score}/1`;

  // Level 2
  const l2Score = state.scores[2];
  if (l2Score !== null) byId("l2Score").textContent = `النتيجة: ${l2Score}/3`;

  // Buttons enable / labels
  byId("tab1").classList.toggle("done", !!state.done[1]);
  byId("tab2").classList.toggle("done", !!state.done[2]);
  byId("tab3").classList.toggle("done", !!state.done[3]);
  byId("tab4").classList.toggle("done", !!state.done[4]);

  // show next buttons if present
  const to2 = byId("to2");
  if (to2) to2.disabled = !state.done[1];

  const to3 = byId("to3");
  if (to3) to3.disabled = !state.done[2];

  const to4 = byId("to4");
  if (to4) to4.disabled = !state.done[3];

  saveProgress();
}

/* =========================
   Level 1 – Load cards.json
========================= */
async function loadCards() {
  try {
    const res = await fetch("./cards.json", {cache:"no-store"});
    state.l1.cards = await res.json();
  } catch(e) {
    state.l1.cards = [];
  }
}

function renderCard() {
  const wrap = byId("cardWrap");
  wrap.innerHTML = "";

  const card = state.l1.cards[state.l1.idx];
  if (!card) {
    wrap.innerHTML = `<div class="muted">لا توجد بطاقات.</div>`;
    return;
  }

  // image svg (or png) shown
  const img = document.createElement("img");
  img.src = card.image;
  img.alt = card.title || "card";
  img.className = "card-img";
  wrap.appendChild(img);

  // prompt
  byId("l1Prompt").textContent = card.prompt || "انظر للشكل فقط واختر نوعه.";
  byId("l1Title").textContent = card.title || `بطاقة ${state.l1.idx+1}`;

  // reset selection
  state.l1.selected = null;
  document.querySelectorAll('input[name="l1type"]').forEach(r=> r.checked = false);
  byId("l1Msg").textContent = "";
}

function checkL1() {
  const card = state.l1.cards[state.l1.idx];
  if (!card) return;

  const picked = state.l1.selected;
  if (!picked) {
    byId("l1Msg").textContent = "❗ اختر إجابة أولاً.";
    return;
  }

  const ok = (picked === card.answer);
  const score = ok ? 1 : 0;

  state.scores[1] = score;
  state.done[1] = ok;

  byId("l1Msg").textContent = ok
    ? "✅ صحيح! (بصريًا) لاحظ أننا لم نستخدم قياسًا."
    : "❗ حاول ثانية. ركّز على شكل المثلث بصريًا فقط.";

  byId("l1Done").textContent = ok
    ? "ممتاز. يمكنك الانتقال للمستوى 2 (وصفي)."
    : "";

  setProgressUI();
}

/* =========================
   Level 1 – UI (single card)
========================= */
function attachL1UI() {
  byId("l1Prev").addEventListener("click", ()=>{
    state.l1.idx = Math.max(0, state.l1.idx-1);
    renderCard();
  });
  byId("l1Next").addEventListener("click", ()=>{
    state.l1.idx = Math.min(state.l1.cards.length-1, state.l1.idx+1);
    renderCard();
  });

  document.querySelectorAll('input[name="l1type"]').forEach(r=>{
    r.addEventListener("change", ()=>{
      state.l1.selected = r.value;
    });
  });

  byId("l1Check").addEventListener("click", checkL1);
}

/* =========================
   Level 2 – Descriptive canvas (fixed + improved)
   ✅ Drag works immediately when entering Level 2
   ✅ Bigger canvas area
   ✅ Measurements centered and readable
   ✅ Auto-centering (after drag / resize)
   ✅ Show 3 symmetry axes when near-equilateral
========================= */

const tri = {
  canvas: null,
  ctx: null,
  w: 520,
  h: 340,

  // نقاط المثلث (تُعاد تهيئتها عند resize)
  A: {x:120, y:260},
  B: {x:400, y:260},
  C: {x:290, y:120},

  drag: false,
  show: false,

  _initC: false,
  resize: null,
};

// قياس زاوية عند النقطة P (الزاوية ∠APB)
function angleAt(A, P, B) {
  const v1 = {x: A.x - P.x, y: A.y - P.y};
  const v2 = {x: B.x - P.x, y: B.y - P.y};
  const dot = v1.x*v2.x + v1.y*v2.y;
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  const cos = clamp(dot/(m1*m2), -1, 1);
  return Math.acos(cos) * 180/Math.PI;
}

// يعيد قياسات التساوي + مؤشرات “القرب” من المتساوي الأضلاع
function isEquilateral(A,B,C) {
  const ab = Math.hypot(A.x-B.x, A.y-B.y);
  const bc = Math.hypot(B.x-C.x, B.y-C.y);
  const ca = Math.hypot(C.x-A.x, C.y-A.y);

  const avg = (ab+bc+ca)/3;
  const maxSide = Math.max(ab,bc,ca);
  const minSide = Math.min(ab,bc,ca);

  const aA = angleAt(B,A,C);
  const aB = angleAt(A,B,C);
  const aC = angleAt(A,C,B);

  // مقدار تشتّت الأطوال (0 يعني تساوي تام)
  const sideSpread = (maxSide - minSide) / avg;

  // مقدار تشتّت الزوايا عن 60°
  const angSpread = Math.max(Math.abs(aA-60), Math.abs(aB-60), Math.abs(aC-60));

  // tolerance (قريب جدًا)
  const okSides = sideSpread < 0.03;
  const okAngs  = angSpread < 2.5;

  // قرب “مريح” لإظهار محاور التماثل (أوسع قليلًا)
  const nearSides = sideSpread < 0.08;
  const nearAngs  = angSpread < 12;

  // معامل قرب 0..1 (لجعل خطوط التماثل تظهر تدريجيًا)
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

// مركز المثلث تلقائيًا (بعد السحب/الريسايز) بدون إزعاج السحب أثناء الحركة
function centerTriangle(margin = 40) {
  if (!tri.A || !tri.B || !tri.C) return;

  const {A,B,C} = tri;

  const centroid = {
    x: (A.x + B.x + C.x) / 3,
    y: (A.y + B.y + C.y) / 3
  };

  // مكان مريح بصريًا (قريب من الوسط مع مساحة للنص)
  const target = {
    x: tri.w / 2,
    y: tri.h * 0.58
  };

  let dx = target.x - centroid.x;
  let dy = target.y - centroid.y;

  // طبّق الإزاحة
  A.x += dx; A.y += dy;
  B.x += dx; B.y += dy;
  C.x += dx; C.y += dy;

  // تأكد من بقاء المثلث داخل حدود آمنة
  const minX = Math.min(A.x,B.x,C.x);
  const maxX = Math.max(A.x,B.x,C.x);
  const minY = Math.min(A.y,B.y,C.y);
  const maxY = Math.max(A.y,B.y,C.y);

  let fixX = 0, fixY = 0;

  if (minX < margin) fixX = margin - minX;
  if (maxX > tri.w - margin) fixX = (tri.w - margin) - maxX;

  if (minY < margin) fixY = margin - minY;
  if (maxY > tri.h - margin) fixY = (tri.h - margin) - maxY;

  A.x += fixX; A.y += fixY;
  B.x += fixX; B.y += fixY;
  C.x += fixX; C.y += fixY;

  // clamp نهائي
  A.x = clamp(A.x, margin, tri.w-margin); A.y = clamp(A.y, margin, tri.h-margin);
  B.x = clamp(B.x, margin, tri.w-margin); B.y = clamp(B.y, margin, tri.h-margin);
  C.x = clamp(C.x, margin, tri.w-margin); C.y = clamp(C.y, margin, tri.h-margin);
}

// رسم محاور التماثل الثلاثة (عند الاقتراب من المتساوي الأضلاع)
function drawSymmetryAxes(c, A, B, C, alpha) {
  const mid = (P,Q)=>({x:(P.x+Q.x)/2, y:(P.y+Q.y)/2});

  const mBC = mid(B,C);
  const mCA = mid(C,A);
  const mAB = mid(A,B);

  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = "#93c5fd";   // أزرق فاتح
  c.lineWidth = 2;
  c.setLineDash([8, 7]);

  c.beginPath(); c.moveTo(A.x,A.y); c.lineTo(mBC.x,mBC.y); c.stroke();
  c.beginPath(); c.moveTo(B.x,B.y); c.lineTo(mCA.x,mCA.y); c.stroke();
  c.beginPath(); c.moveTo(C.x,C.y); c.lineTo(mAB.x,mAB.y); c.stroke();

  c.setLineDash([]);
  c.restore();
}

function drawTriangle() {
  const c = tri.ctx;
  const {A,B,C} = tri;

  c.clearRect(0,0,tri.w,tri.h);

  // ضلع المثلث
  c.lineWidth = 3;
  c.strokeStyle = "#cbd5e1";
  c.beginPath();
  c.moveTo(A.x,A.y); c.lineTo(B.x,B.y); c.lineTo(C.x,C.y); c.closePath();
  c.stroke();

  // محاور التماثل عند الاقتراب
  if (tri.show) {
    const r = isEquilateral(A,B,C);
    if (r.near) {
      // alpha خفيف ويتزايد كلما اقتربنا من المتساوي الأضلاع
      const alpha = 0.08 + (0.30 * r.closeness);
      drawSymmetryAxes(c, A, B, C, alpha);
    }
  }

  // نقاط A,B,C
  const drawPt = (P, name)=>{
    c.fillStyle = "#f59e0b";
    c.beginPath(); c.arc(P.x,P.y,8,0,Math.PI*2); c.fill();   // أكبر قليلًا
    c.fillStyle = "#e2e8f0";
    c.font = "bold 16px system-ui";
    c.fillText(name, P.x+10, P.y-10);
  };
  drawPt(A,"A"); drawPt(B,"B"); drawPt(C,"C");

  // قياسات (مربع في منتصف الشاشة)
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

    // خلفية شبه شفافة
    c.fillStyle = "rgba(15, 23, 42, 0.78)";
    roundRect(c, x, y, w, h, 14);
    c.fill();

    // إطار خفيف
    c.strokeStyle = "rgba(203, 213, 225, 0.25)";
    c.lineWidth = 1;
    c.stroke();

    // النص
    c.fillStyle = "#e2e8f0";
    c.fillText(line1, tri.w/2, y + h*0.38);
    c.fillText(line2, tri.w/2, y + h*0.72);

    c.restore();
  }
}

function attachL2() {
  tri.canvas = byId("triCanvas");
  tri.ctx = tri.canvas.getContext("2d");

  // ✅ تكبير واضح + دعم السحب على اللمس
  tri.canvas.style.height = "460px";
  tri.canvas.style.touchAction = "none";

  // محاولة جعل عمود الرسم أكبر (إن وجد نفس الهيكل)
  const l2 = document.querySelector('.level[data-level="2"]');
  const twocol = l2 ? l2.querySelector(".twocol") : null;
  if (twocol) twocol.style.gridTemplateColumns = "1.7fr .3fr";

  const resize = ()=>{
    const box = tri.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // إذا كان مخفيًا لحظة القياس (0) نعطي قيمًا مؤقتة
    const cssW = Math.floor(box.width)  || 520;
    const cssH = Math.floor(box.height) || 460;

    tri.w = Math.max(360, cssW);
    tri.h = Math.max(340, cssH);

    tri.canvas.width = Math.floor(tri.w * dpr);
    tri.canvas.height = Math.floor(tri.h * dpr);
    tri.ctx.setTransform(dpr,0,0,dpr,0,0);

    const baseY = Math.floor(tri.h * 0.78);

    // قاعدة المثلث AB
    tri.A = {x: Math.floor(tri.w*0.22), y: baseY};
    tri.B = {x: Math.floor(tri.w*0.78), y: baseY};

    // نقطة C
    if (!tri._initC) {
      tri.C = {x: Math.floor(tri.w*0.55), y: Math.floor(tri.h*0.28)};
      tri._initC = true;
    } else {
      tri.C.x = clamp(tri.C.x, 40, tri.w-40);
      tri.C.y = clamp(tri.C.y, 40, tri.h-40);
    }

    // ✅ توسيط بعد الريسايز (بدون سحب)
    centerTriangle(40);
    drawTriangle();
  };

  // ✅ نخزنها لنستدعيها عند دخول المستوى 2
  tri.resize = resize;

  window.addEventListener("resize", resize);
  resize();

  // ✅ تسهيل التقاط النقطة C
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
    // ✅ توسيط بعد انتهاء السحب (حتى يبقى الشكل مريحًا)
    centerTriangle(40);
    drawTriangle();
  });

  tri.canvas.addEventListener("pointercancel",()=>{
    tri.drag = false;
  });
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

  // في الصف التاسع: يجب إجابات كاملة + تحقق فعلي من القياسات
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
   (keep your existing content)
========================= */

// إذا كان عندك وظائف للمستوى 3 و 4 موجودة سابقًا، اتركها كما هي في هذا الملف.
// (الملف الأصلي لديك فيه قسم Level 3 + Level 4. لا نغيره هنا.)

/* =========================
   Boot
========================= */
async function init() {
  loadProgress();

  // grade buttons
  byId("g8").addEventListener("click", ()=> setGrade(8));
  byId("g9").addEventListener("click", ()=> setGrade(9));
  byId("gradeLabel").textContent = `الصف: ${state.grade}`;

  // tabs
  byId("tab1").addEventListener("click", ()=> setLevel(1));
  byId("tab2").addEventListener("click", ()=> setLevel(2));
  byId("tab3").addEventListener("click", ()=> setLevel(3));
  byId("tab4").addEventListener("click", ()=> setLevel(4));

  // Level 1
  await loadCards();
  attachL1UI();
  renderCard();

  // from level1 to level2
  const to2 = byId("to2");
  if (to2) to2.addEventListener("click", ()=> setLevel(2));

  // Level 2
  attachL2();
  byId("showMeasures").addEventListener("click", ()=>{
    tri.show = !tri.show;
    drawTriangle();
  });
  byId("l2Check").addEventListener("click", checkL2);
  byId("l2Reset").addEventListener("click", ()=>{
    tri.C.x = Math.floor(tri.w*0.55);
    tri.C.y = Math.floor(tri.h * 0.28);
    byId("l2Msg").textContent = "";
    state.l2.ok = false;
    centerTriangle(40);
    drawTriangle();
  });
  byId("l2Save").addEventListener("click", saveL2Answers);

  // NOTE:
  // If you have Level 3/4 init hooks, keep them here (your existing code).

  setProgressUI();
}

init();
