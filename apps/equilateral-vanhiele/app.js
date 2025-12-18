/* =========================
   Equilateral Triangle – Van Hiele (1–4)
   Grades: 8, 9
========================= */

const KEY = "eq_vanhiele_progress_v1";

const byId = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const state = {
  grade: 8,
  level: 1,
  done: { 1:false, 2:false, 3:false, 4:false },
  scores: { 1:null, 2:null, 3:null, 4:null },
  l1: { selected: new Set(), checked:false },
  l2: { show:false, ok:false },
};

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
    state.grade = p.grade || 8;
    state.done = p.done || state.done;
    state.scores = p.scores || state.scores;
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
   Level 1 – Visual cards
========================= */

// 24 cards (5 equilateral, 7 triangles-not-eq, 12 non-triangles)
function svgPoly(points) {
  return `<svg class="cardsvg" viewBox="0 0 100 70" role="img" aria-hidden="true">
    <polygon points="${points}" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
  </svg>`;
}
function svgPath(d) {
  return `<svg class="cardsvg" viewBox="0 0 100 70" role="img" aria-hidden="true">
    <path d="${d}" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}
function svgCircle() {
  return `<svg class="cardsvg" viewBox="0 0 100 70" role="img" aria-hidden="true">
    <circle cx="50" cy="35" r="24" fill="none" stroke="currentColor" stroke-width="5"/>
  </svg>`;
}
function svgStar() {
  return `<svg class="cardsvg" viewBox="0 0 100 70" role="img" aria-hidden="true">
    <path d="M50 8 L58 28 L80 28 L62 41 L69 62 L50 49 L31 62 L38 41 L20 28 L42 28 Z"
      fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
  </svg>`;
}

const L1_CARDS = [
  // Equilateral (✅)
  {id:1,  kind:"eq",  label:"مثلث متساوي الأضلاع (واضح)",      svg: svgPoly("50,8 12,62 88,62")},
  {id:2,  kind:"eq",  label:"مثلث متساوي الأضلاع (مقلوب)",      svg: svgPoly("12,8 88,8 50,62")},
  {id:3,  kind:"eq",  label:"مثلث متساوي الأضلاع (مائل)",       svg: svgPoly("60,8 16,54 86,62")},
  {id:4,  kind:"eq",  label:"مثلث متساوي الأضلاع (صغير)",       svg: svgPoly("50,14 22,58 78,58")},
  {id:5,  kind:"eq",  label:"متساوي الأضلاع داخل دائرة",        svg: `<svg class="cardsvg" viewBox="0 0 100 70" aria-hidden="true">
      <circle cx="50" cy="35" r="26" fill="none" stroke="currentColor" opacity=".6" stroke-width="4"/>
      <polygon points="50,10 18,58 82,58" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
    </svg>`},

  // Triangles but not equilateral (❌)
  {id:6,  kind:"tri", label:"متساوي الساقين (قاعدة عريضة)",     svg: svgPoly("50,10 8,60 92,60")},
  {id:7,  kind:"tri", label:"متساوي الساقين (نحيف)",            svg: svgPoly("50,8 30,62 70,62")},
  {id:8,  kind:"tri", label:"قائم الزاوية",                      svg: `<svg class="cardsvg" viewBox="0 0 100 70" aria-hidden="true">
      <polygon points="20,55 20,15 80,55" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
      <path d="M20 55 L32 55 L32 43" fill="none" stroke="currentColor" stroke-width="5"/>
    </svg>`},
  {id:9,  kind:"tri", label:"مختلف الأضلاع",                     svg: svgPoly("20,58 80,60 55,10")},
  {id:10, kind:"tri", label:"قريب جدًا من المتساوي (مخادع)",     svg: svgPoly("50,10 16,60 90,56")},
  {id:11, kind:"tri", label:"منفرج الزاوية",                     svg: svgPoly("15,55 92,60 35,10")},
  {id:12, kind:"tri", label:"أضلاع متموّجة (ليس مثلثًا دقيقًا)", svg: svgPath("M20 58 Q50 8 80 58 Q50 50 20 58")},

  // Non-triangles (❌)
  {id:13, kind:"non", label:"مربع",                               svg: svgPoly("25,15 75,15 75,65 25,65")},
  {id:14, kind:"non", label:"مستطيل",                             svg: svgPoly("18,20 82,20 82,60 18,60")},
  {id:15, kind:"non", label:"متوازي أضلاع",                       svg: svgPoly("25,60 70,60 85,18 40,18")},
  {id:16, kind:"non", label:"معين (ألماسي)",                      svg: svgPoly("50,10 80,35 50,60 20,35")},
  {id:17, kind:"non", label:"شبه منحرف",                          svg: svgPoly("25,60 75,60 65,18 35,18")},
  {id:18, kind:"non", label:"خماسي",                               svg: svgPoly("50,10 80,28 70,60 30,60 20,28")},
  {id:19, kind:"non", label:"سداسي",                               svg: svgPoly("50,10 75,22 75,48 50,60 25,48 25,22")},
  {id:20, kind:"non", label:"دائرة",                               svg: svgCircle()},
  {id:21, kind:"non", label:"شكل بيت (قطعة واحدة)",               svg: svgPath("M25 60 L25 35 L50 15 L75 35 L75 60 Z")},
  {id:22, kind:"non", label:"سهم (ليس مثلثًا)",                    svg: svgPath("M20 35 L60 10 L60 25 L85 25 L85 45 L60 45 L60 60 Z")},
  {id:23, kind:"non", label:"نجمة",                                svg: svgStar()},
  {id:24, kind:"non", label:"مثلثان متجاوران (ليس مثلثًا واحدًا)", svg: `<svg class="cardsvg" viewBox="0 0 100 70" aria-hidden="true">
      <polygon points="20,60 50,15 80,60" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
      <line x1="50" y1="15" x2="50" y2="60" stroke="currentColor" stroke-width="5"/>
    </svg>`},
];

let l1Order = [...L1_CARDS];

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function renderL1() {
  const grid = byId("l1Grid");
  grid.innerHTML = "";

  l1Order.forEach(card=>{
    const tile = document.createElement("div");
    tile.className = "cardtile";
    tile.dataset.id = card.id;

    const isSel = state.l1.selected.has(card.id);
    if (isSel) tile.classList.add("sel");

    tile.innerHTML = `
      <div class="cardnum">${card.id}</div>
      <div class="icon" style="color:#cbd5e1">${card.svg}</div>
      <div class="cardlabel">${card.label}</div>
    `;

    tile.addEventListener("click", ()=>{
      if (state.l1.checked) return;
      if (state.l1.selected.has(card.id)) state.l1.selected.delete(card.id);
      else state.l1.selected.add(card.id);
      renderL1();
    });

    grid.appendChild(tile);
  });
}

function checkL1() {
  state.l1.checked = true;

  const eqIds = new Set(L1_CARDS.filter(c=>c.kind==="eq").map(c=>c.id));
  let score = 0;

  document.querySelectorAll("#l1Grid .cardtile").forEach(tile=>{
    const id = +tile.dataset.id;
    const picked = state.l1.selected.has(id);
    const isEq = eqIds.has(id);

    const correct = (picked && isEq) || (!picked && !isEq);
    if (correct) score++;

    tile.classList.remove("sel");
    tile.classList.add(correct ? "ok" : "bad");
  });

  state.scores[1] = score;
  state.done[1] = (score >= 20); // شرط نجاح بصري: 20/24
  byId("l1Score").textContent = `النتيجة: ${score}/24 — ${state.done[1] ? "✅ اجتزت" : "❗ حاول تحسين الاختيار"}`;
  byId("l1Msg").textContent = state.done[1]
    ? "ممتاز! الآن انتقل للوصفي (قياس/ملاحظة)."
    : "في هذا المستوى لا نقيس. راجع: المثلث المتساوي الأضلاع له 3 أضلاع متساوية بشكل واضح.";

  setProgressUI();
  saveProgress();
}

/* =========================
   Level 2 – Descriptive canvas
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

  // سماحية: 3% أطوال + 2.5° زوايا
  const okSides = (maxDiff/avg) < 0.03;
  const okAngs = Math.max(Math.abs(aA-60), Math.abs(aB-60), Math.abs(aC-60)) < 2.5;

  return { ok: okSides && okAngs, ab, bc, ca, aA, aB, aC, okSides, okAngs };
}

function drawTriangle() {
  const c = tri.ctx;
  const {A,B,C} = tri;

  c.clearRect(0,0,tri.w,tri.h);

  // triangle
  c.lineWidth = 3;
  c.strokeStyle = "#cbd5e1";
  c.beginPath();
  c.moveTo(A.x,A.y); c.lineTo(B.x,B.y); c.lineTo(C.x,C.y); c.closePath();
  c.stroke();

  // points
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

    // أعد تموضع النقاط نسبيًا (تقريب)
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
  tri.canvas.addEventListener("pointerup",()=>{
    tri.drag = false;
  });
}

function checkL2() {
  const r = isEquilateral(tri.A,tri.B,tri.C);
  const msg = byId("l2Msg");

  if (r.ok) {
    state.l2.ok = true;
    msg.textContent = "✅ ممتاز! هذا قريب جدًا من مثلث متساوي الأضلاع: الأضلاع متقاربة جدًا والزوايا ≈ 60°.";
  } else {
    state.l2.ok = false;
    msg.textContent = `❗ ليس بعد. ${r.okSides ? "الأضلاع جيدة" : "حاول جعل الأضلاع أقرب للتساوي"}، و${r.okAngs ? "الزوايا جيدة" : "حاول الاقتراب من 60° لكل زاوية"}.`;
  }
}

/* =========================
   Level 3 – Informal reasoning
========================= */

function checkL3() {
  const ans = {
    l3_1: "a",
    l3_2: "a",
    l3_3: "a",
    l3_4: "a",
  };

  let score = 0;
  const total = 4;

  Object.keys(ans).forEach(id=>{
    const v = byId(id).value;
    if (v === ans[id]) score++;
  });

  // تقييم نص التعليل: يكفي وجود حد أدنى من الكلمات (غير صارم)
  const txt = (byId("l3_txt").value || "").trim();
  const okTxt = txt.split(/\s+/).filter(Boolean).length >= 8; // 8 كلمات تقريبًا
  const bonus = okTxt ? 1 : 0;

  const final = score + bonus; // /5
  state.scores[3] = final;
  state.done[3] = (final >= (state.grade === 9 ? 4 : 3));

  byId("l3Score").textContent = `النتيجة: ${final}/5 ${state.done[3] ? "✅ اجتزت" : "❗ راجع الإجابات/التعليل"}`;
  byId("l3Msg").textContent = state.done[3]
    ? "ممتاز. جاهز للبرهان الرسمي."
    : "حاول الربط: تساوي ضلعين ⇒ تساوي زاويتين (متساوي الساقين) + مجموع زوايا المثلث 180°.";

  setProgressUI();
  saveProgress();
}

/* =========================
   Level 4 – Formal proof builder
========================= */

function stepUI(step, idx, total) {
  const opts = step.reasons.map(r=>`<option value="${r.v}">${r.t}</option>`).join("");
  return `
    <div class="step" data-id="${step.id}">
      <div class="stepTop">
        <div class="stepTxt">${idx+1}. ${step.text}</div>
        <div class="stepBtns">
          <button class="smallbtn up" ${idx===0?"disabled":""}>↑</button>
          <button class="smallbtn down" ${idx===total-1?"disabled":""}>↓</button>
        </div>
      </div>
      <div class="reasonRow">
        <span class="muted">السبب:</span>
        <select class="ctl reason">
          <option value="">اختر السبب…</option>
          ${opts}
        </select>
      </div>
    </div>
  `;
}

function attachReorder(containerId, model, onChanged) {
  const box = byId(containerId);
  const render = ()=>{
    box.innerHTML = model.map((s,i)=>stepUI(s,i,model.length)).join("");
    box.querySelectorAll(".step").forEach((el, idx)=>{
      el.querySelector(".up").addEventListener("click", ()=>{
        if (idx===0) return;
        [model[idx-1], model[idx]] = [model[idx], model[idx-1]];
        render(); onChanged();
      });
      el.querySelector(".down").addEventListener("click", ()=>{
        if (idx===model.length-1) return;
        [model[idx+1], model[idx]] = [model[idx], model[idx+1]];
        render(); onChanged();
      });
    });
  };
  render();
  return { render };
}

const PROOF_A_CORRECT = ["given","iso1","iso2","allEqual","sum180","divide3"];
const PROOF_B_CORRECT = ["mid","eqSides","midDef","common","sss","bisect","eqAnglesAtM","lineBC","perp"];

function buildProofModels() {
  const hard = (state.grade === 9);

  const proofA = shuffle([
    {
      id:"given",
      text:"المعطى: AB = BC = CA (مثلث متساوي الأضلاع).",
      reasons:[
        {v:"def", t:"تعريف المثلث المتساوي الأضلاع"},
        {v:"iso", t:"خاصية متساوي الساقين"},
        {v:"sum", t:"مجموع زوايا المثلث 180°"},
      ]
    },
    {
      id:"iso1",
      text:"من AB = AC نستنتج ∠B = ∠C.",
      reasons:[
        {v:"iso", t:"في متساوي الساقين: الزاويتان عند القاعدة متساويتان"},
        {v:"sum", t:"مجموع زوايا المثلث 180°"},
        {v:"def", t:"تعريف المتساوي الأضلاع"},
      ]
    },
    {
      id:"iso2",
      text:"ومن BC = CA نستنتج ∠A = ∠B.",
      reasons:[
        {v:"iso", t:"في متساوي الساقين: الزاويتان عند القاعدة متساويتان"},
        {v:"def", t:"تعريف المتساوي الأضلاع"},
        {v:"sum", t:"مجموع زوايا المثلث 180°"},
      ]
    },
    {
      id:"allEqual",
      text:"إذن ∠A = ∠B = ∠C.",
      reasons:[
        {v:"trans", t:"بالاستنتاج من تساوي زاويتين مع الثالثة (تعدّي/ترابط)"},
        {v:"iso", t:"خاصية متساوي الساقين"},
        {v:"sum", t:"مجموع الزوايا"},
      ]
    },
    {
      id:"sum180",
      text:"مجموع زوايا المثلث: ∠A + ∠B + ∠C = 180°.",
      reasons:[
        {v:"sum", t:"قانون مجموع زوايا المثلث"},
        {v:"def", t:"تعريف المتساوي الأضلاع"},
        {v:"iso", t:"خاصية متساوي الساقين"},
      ]
    },
    {
      id:"divide3",
      text:"وبما أن الزوايا متساوية: 3∠A = 180° ⇒ ∠A = 60° (وكذلك ∠B و ∠C).",
      reasons:[
        {v:"alg", t:"تعويض ثم قسمة على 3"},
        {v:"sum", t:"مجموع زوايا المثلث"},
        {v:"def", t:"تعريف المتساوي الأضلاع"},
      ]
    },
  ]);

  // Proof B
  const proofB = shuffle([
    {
      id:"mid",
      text:"لتكن M منتصف BC ⇒ BM = MC.",
      reasons:[
        {v:"middef", t:"تعريف منتصف قطعة مستقيمة"},
        {v:"sss", t:"قاعدة التطابق SSS"},
        {v:"eq", t:"تعريف متساوي الأضلاع"},
      ]
    },
    {
      id:"eqSides",
      text:"بما أن ABC متساوي الأضلاع ⇒ AB = AC.",
      reasons:[
        {v:"eq", t:"تعريف متساوي الأضلاع"},
        {v:"middef", t:"تعريف المنتصف"},
        {v:"iso", t:"خاصية متساوي الساقين"},
      ]
    },
    {
      id:"midDef",
      text:"المعطى BM = MC (لأن M منتصف BC).",
      reasons:[
        {v:"middef", t:"تعريف منتصف قطعة مستقيمة"},
        {v:"eq", t:"تعريف متساوي الأضلاع"},
        {v:"sum", t:"مجموع زوايا المثلث"},
      ]
    },
    {
      id:"common",
      text:"AM ضلع مشترك في المثلثين ABM و ACM.",
      reasons:[
        {v:"common", t:"ضلع مشترك"},
        {v:"sss", t:"SSS"},
        {v:"iso", t:"متساوي الساقين"},
      ]
    },
    {
      id:"sss",
      text:"إذن المثلثان ABM و ACM متطابقان (SSS).",
      reasons:[
        {v:"sss", t:"قاعدة التطابق ضلع-ضلع-ضلع (SSS)"},
        {v:"asa", t:"زاوية-ضلع-زاوية (ASA)"},
        {v:"sum", t:"مجموع الزوايا"},
      ]
    },
    {
      id:"bisect",
      text:"ومن التطابق: ∠BAM = ∠MAC ⇒ AM منصف لزاوية A.",
      reasons:[
        {v:"cpctc", t:"من التطابق: الأجزاء المتناظرة متساوية"},
        {v:"middef", t:"تعريف المنتصف"},
        {v:"eq", t:"تعريف متساوي الأضلاع"},
      ]
    },
    {
      id:"eqAnglesAtM",
      text:"ومن التطابق أيضًا: ∠BMA = ∠AMC.",
      reasons:[
        {v:"cpctc", t:"من التطابق: الأجزاء المتناظرة متساوية"},
        {v:"sum", t:"مجموع زوايا المثلث"},
        {v:"iso", t:"خاصية متساوي الساقين"},
      ]
    },
    {
      id:"lineBC",
      text:"النقاط B و M و C على استقامة واحدة، فتكون ∠BMA و ∠AMC متكاملتين.",
      reasons:[
        {v:"line", t:"على استقامة واحدة ⇒ زاويتان متكاملتان"},
        {v:"cpctc", t:"CPCTC"},
        {v:"sss", t:"SSS"},
      ]
    },
    {
      id:"perp",
      text:"إذا كانت زاويتان متكاملتان ومتساويتان ⇒ كل واحدة 90° ⇒ AM ⟂ BC (ارتفاع).",
      reasons:[
        {v:"perp", t:"زاويتان متكاملتان ومتساويتان ⇒ قائمتان"},
        {v:"sum", t:"مجموع الزوايا"},
        {v:"eq", t:"تعريف متساوي الأضلاع"},
      ]
    },
  ]);

  // في الصف الثامن نسهّل: نُظهر تلميحًا في نص النتيجة
  if (!hard) {
    byId("finalMsg").textContent = "تلميح للثامن: ركّز على (متساوي الساقين) ثم (مجموع الزوايا 180°) ثم (التطابق SSS).";
  } else {
    byId("finalMsg").textContent = "";
  }

  return { proofA, proofB };
}

let proofA = null;
let proofB = null;
let proofUIA = null;
let proofUIB = null;

function currentOrderIds(containerId){
  return [...byId(containerId).querySelectorAll(".step")].map(el=>el.dataset.id);
}
function currentReasons(containerId){
  return [...byId(containerId).querySelectorAll(".step")].map(el=>el.querySelector(".reason").value);
}

function gradeStrictnessScore(order, correctOrder, reasons, requiredReasonsSet) {
  // ترتيب
  const okOrder = order.join("|") === correctOrder.join("|");
  // أسباب: نطلب أن تكون الأسباب المختارة “صالحة” لكل خطوة (بشكل مبسط)
  // سنقبل مجموعة قيم محددة لكل خطوة حسب المطلوب.
  let okReasons = 0;
  for (let i=0;i<correctOrder.length;i++){
    const stepId = correctOrder[i];
    const need = requiredReasonsSet[stepId] || [];
    if (need.includes(reasons[i])) okReasons++;
  }
  return { okOrder, okReasons };
}

// الأسباب المطلوبة لكل خطوة (قيم dropdown)
const NEED_A = {
  given: ["def"],
  iso1: ["iso"],
  iso2: ["iso"],
  allEqual: ["trans"],
  sum180: ["sum"],
  divide3: ["alg"],
};
const NEED_B = {
  mid: ["middef"],
  eqSides: ["eq"],
  midDef: ["middef"],
  common: ["common"],
  sss: ["sss"],
  bisect: ["cpctc"],
  eqAnglesAtM: ["cpctc"],
  lineBC: ["line"],
  perp: ["perp"],
};

function checkProofA() {
  const order = currentOrderIds("proofA");
  const reasons = currentReasons("proofA");

  const strict = (state.grade === 9);
  const { okOrder, okReasons } = gradeStrictnessScore(order, PROOF_A_CORRECT, reasons, NEED_A);

  // علامة مبسطة:
  // التاسع: ترتيب (6) + أسباب صحيحة (6) => /12
  // الثامن: ترتيب (6) + أسباب صحيحة (3 كحد أدنى) => /9 تقريبًا
  let score = 0;
  if (okOrder) score += 6;
  score += okReasons;

  const pass = strict ? (okOrder && okReasons >= 5) : (score >= 7);

  byId("scoreA").textContent = `برهان (أ): ${score}/${strict ? 12 : 9} — ${pass ? "✅ صحيح" : "❗ راجع الترتيب/الأسباب"}`;

  // حفظ جزء من مستوى 4
  state.scores[4] = Math.max(state.scores[4] || 0, score);
  setProgressUI(); saveProgress();
  return pass;
}

function checkProofB() {
  const order = currentOrderIds("proofB");
  const reasons = currentReasons("proofB");

  const strict = (state.grade === 9);
  const { okOrder, okReasons } = gradeStrictnessScore(order, PROOF_B_CORRECT, reasons, NEED_B);

  let score = 0;
  if (okOrder) score += 9;
  score += okReasons;

  const pass = strict ? (okOrder && okReasons >= 8) : (score >= 11);

  byId("scoreB").textContent = `برهان (ب): ${score}/${strict ? 18 : 16} — ${pass ? "✅ صحيح" : "❗ راجع التطابق/العمودية"}`;

  state.scores[4] = Math.max(state.scores[4] || 0, score);
  setProgressUI(); saveProgress();
  return pass;
}

/* =========================
   Proof canvas drawing (support)
========================= */

const pc = { canvas:null, ctx:null, w:520, h:340 };

function drawProofCanvas() {
  const c = pc.ctx;
  c.clearRect(0,0,pc.w,pc.h);

  // مثلث متساوي الأضلاع تقريبي
  const A = {x: pc.w*0.50, y: 60};
  const B = {x: pc.w*0.25, y: 270};
  const C = {x: pc.w*0.75, y: 270};
  const M = {x: (B.x+C.x)/2, y: (B.y+C.y)/2};

  c.strokeStyle = "#cbd5e1";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(A.x,A.y); c.lineTo(B.x,B.y); c.lineTo(C.x,C.y); c.closePath();
  c.stroke();

  // AM
  c.strokeStyle = "#f59e0b";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(A.x,A.y); c.lineTo(M.x,M.y);
  c.stroke();

  // نقاط
  const pt=(P,name)=>{
    c.fillStyle="#e2e8f0";
    c.beginPath(); c.arc(P.x,P.y,5,0,Math.PI*2); c.fill();
    c.font="bold 16px system-ui";
    c.fillText(name, P.x+8, P.y-8);
  };
  pt(A,"A"); pt(B,"B"); pt(C,"C"); pt(M,"M");

  // إشارة عمودية صغيرة عند M
  c.strokeStyle="#94a3b8";
  c.lineWidth=2;
  c.beginPath();
  c.moveTo(M.x-12, M.y); c.lineTo(M.x-12, M.y-12); c.lineTo(M.x, M.y-12);
  c.stroke();

  // نص
  c.fillStyle="#94a3b8";
  c.font="14px system-ui";
  c.fillText("الفكرة: BM = MC + AB = AC + AM مشترك ⇒ تطابق SSS", 16, 24);
}

function attachProofCanvas() {
  pc.canvas = byId("proofCanvas");
  pc.ctx = pc.canvas.getContext("2d");

  const resize = ()=>{
    const rect = pc.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    pc.w = Math.max(360, Math.floor(rect.width));
    pc.h = 340;
    pc.canvas.width = Math.floor(pc.w*dpr);
    pc.canvas.height = Math.floor(pc.h*dpr);
    pc.ctx.setTransform(dpr,0,0,dpr,0,0);
    drawProofCanvas();
  };
  window.addEventListener("resize", resize);
  resize();
}

/* =========================
   Navigation / gating
========================= */

function gateMsg(btnId, ok, msgId, msgOk, msgNo){
  const btn = byId(btnId);
  btn.addEventListener("click", ()=>{
    const m = byId(msgId);
    if (ok()) {
      m.textContent = msgOk;
    } else {
      m.textContent = msgNo;
    }
  });
}

function initTabs() {
  document.querySelectorAll(".tab").forEach(t=>{
    t.addEventListener("click", ()=>{
      setLevel(+t.dataset.level);
    });
  });
}

function initGrade() {
  byId("gradeSel").value = String(state.grade);
  byId("gradeSel").addEventListener("change", ()=>{
    state.grade = +byId("gradeSel").value;
    // إعادة بناء مستوى 4 بحسب الصرامة
    const models = buildProofModels();
    proofA = models.proofA;
    proofB = models.proofB;
    proofUIA = attachReorder("proofA", proofA, ()=>{});
    proofUIB = attachReorder("proofB", proofB, ()=>{});
    setProgressUI();
    saveProgress();
  });
}

function initReset() {
  byId("resetBtn").addEventListener("click", ()=>{
    localStorage.removeItem(KEY);
    location.reload();
  });
}

/* =========================
   Level 2 save answers
========================= */

function saveL2Answers() {
  const a1 = byId("l2q1").value;
  const a2 = byId("l2q2").value;
  const a3 = byId("l2q3").value;

  let score = 0;
  if (a1==="a") score++;
  if (a2==="a") score++;
  if (a3==="a") score++;

  // شرط اجتياز: (ثامن) 2/3 + محاولة ضبط المثلث مرة واحدة، (تاسع) 3/3 + مثلث صحيح
  const pass = (state.grade === 9) ? (score===3 && state.l2.ok) : (score>=2);

  state.scores[2] = score;
  state.done[2] = pass;

  byId("l2Score").textContent = `النتيجة: ${score}/3 — ${pass ? "✅ اجتزت" : "❗ راجع الاختيارات/حاول جعل C أدق"}`;
  byId("l2Done").textContent = pass ? "ممتاز. انتقل للاستدلال غير الرسمي." : "";

  setProgressUI();
  saveProgress();
}

/* =========================
   Boot
========================= */

function init() {
  loadProgress();

  initTabs();
  initGrade();
  initReset();

  // L1
  l1Order = shuffle(L1_CARDS);
  renderL1();
  byId("l1Shuffle").addEventListener("click", ()=>{
    state.l1.selected.clear();
    state.l1.checked = false;
    byId("l1Score").textContent = "";
    byId("l1Msg").textContent = "";
    l1Order = shuffle(L1_CARDS);
    renderL1();
  });
  byId("l1Check").addEventListener("click", checkL1);

  byId("to2").addEventListener("click", ()=> setLevel(2));

  // L2
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
  byId("to3").addEventListener("click", ()=> setLevel(3));

  // L3
  byId("l3Check").addEventListener("click", checkL3);
  byId("to4").addEventListener("click", ()=> setLevel(4));

  // L4
  attachProofCanvas();
  const models = buildProofModels();
  proofA = models.proofA;
  proofB = models.proofB;
  proofUIA = attachReorder("proofA", proofA, ()=>{});
  proofUIB = attachReorder("proofB", proofB, ()=>{});

  byId("checkA").addEventListener("click", checkProofA);
  byId("checkB").addEventListener("click", checkProofB);

  byId("finish").addEventListener("click", ()=>{
    const okA = checkProofA();
    const okB = checkProofB();
    state.done[4] = (state.grade === 9) ? (okA && okB) : (okA || okB);

    byId("finalMsg").textContent = state.done[4]
      ? "✅ تم اجتياز المستوى 4 وحفظ التقدم."
      : "❗ لم يكتمل المستوى 4 بعد. جرّب إعادة ترتيب الخطوات واختيار أسباب أدق.";

    setProgressUI();
    saveProgress();
  });

  // استعادة نتائج محفوظة (إن وجدت)
  setProgressUI();
}
init();

