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

  /* ===== Level 1 (NEW) ===== */
  l1: {
    idx: 0,
    order: [],
    selectedAns: null,
    results: {} // { cardId: "ok" | "bad" }
  },

  /* ===== Level 2 ===== */
  l2: { show:false, ok:false },
};

/* =========================
   Progress persistence
========================= */

function saveProgress() {
  localStorage.setItem(KEY, JSON.stringify({
    grade: state.grade,
    done: state.done,
    scores: state.scores
  }));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
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
  document.querySelectorAll(".tab").forEach(t =>
    t.classList.toggle("is-active", +t.dataset.level === level)
  );
  document.querySelectorAll(".level").forEach(sec =>
    sec.classList.toggle("is-active", +sec.dataset.level === level)
  );
}

/* =========================
   Utilities
========================= */

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

/* =========================
   SVG helpers (Level 1 shapes)
========================= */

function svgPoly(points) {
  return `<svg viewBox="0 0 100 70" aria-hidden="true">
    <polygon points="${points}" fill="none" stroke="currentColor"
      stroke-width="8" stroke-linejoin="round"/>
  </svg>`;
}
function svgPath(d) {
  return `<svg viewBox="0 0 100 70" aria-hidden="true">
    <path d="${d}" fill="none" stroke="currentColor"
      stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}
function svgCircle() {
  return `<svg viewBox="0 0 100 70" aria-hidden="true">
    <circle cx="50" cy="35" r="24"
      fill="none" stroke="currentColor" stroke-width="8"/>
  </svg>`;
}

/* =========================
   Level 1 – Cards data
========================= */

const L1_CARDS = [
  {id:1,  kind:"eq",  svg: svgPoly("50,8 12,62 88,62")},
  {id:2,  kind:"eq",  svg: svgPoly("12,8 88,8 50,62")},
  {id:3,  kind:"eq",  svg: svgPoly("60,8 16,54 86,62")},
  {id:4,  kind:"eq",  svg: svgPoly("50,14 22,58 78,58")},
  {id:5,  kind:"eq",  svg: `<svg viewBox="0 0 100 70">
      <circle cx="50" cy="35" r="26" fill="none"
        stroke="currentColor" stroke-width="5" opacity=".5"/>
      <polygon points="50,10 18,58 82,58"
        fill="none" stroke="currentColor" stroke-width="8"/>
    </svg>`},

  {id:6,  kind:"iso", svg: svgPoly("50,10 8,60 92,60")},
  {id:7,  kind:"iso", svg: svgPoly("50,8 30,62 70,62")},

  {id:8,  kind:"other", svg: svgPoly("20,55 20,15 80,55")},
  {id:9,  kind:"other", svg: svgPoly("20,58 80,60 55,10")},
  {id:10, kind:"other", svg: svgPoly("50,10 16,60 90,56")},
  {id:11, kind:"other", svg: svgPoly("15,55 92,60 35,10")},
  {id:12, kind:"other", svg: svgPath("M20 58 Q50 8 80 58 Q50 50 20 58")},
  {id:13, kind:"other", svg: svgPoly("25,15 75,15 75,65 25,65")},
  {id:14, kind:"other", svg: svgPoly("18,20 82,20 82,60 18,60")},
  {id:15, kind:"other", svg: svgPoly("25,60 70,60 85,18 40,18")},
  {id:16, kind:"other", svg: svgPoly("50,10 80,35 50,60 20,35")},
  {id:17, kind:"other", svg: svgPoly("25,60 75,60 65,18 35,18")},
  {id:18, kind:"other", svg: svgPoly("50,10 80,28 70,60 30,60 20,28")},
  {id:19, kind:"other", svg: svgPoly("50,10 75,22 75,48 50,60 25,48 25,22")},
  {id:20, kind:"other", svg: svgCircle()},
  {id:21, kind:"other", svg: svgPath("M25 60 L25 35 L50 15 L75 35 L75 60 Z")},
  {id:22, kind:"other", svg: svgPath("M20 35 L60 10 L60 25 L85 25 L85 45 L60 45 L60 60 Z")},
  {id:23, kind:"other", svg: svgPath("M50 8 L58 28 L80 28 L62 41 L69 62 L50 49 L31 62 L38 41 L20 28 L42 28 Z")},
  {id:24, kind:"other", svg: svgPath("M20 60 L50 15 L80 60 M50 15 L50 60")}
];

/* =========================
   Level 1 – Logic (NEW)
========================= */

function renderL1() {
  const card = state.l1.order[state.l1.idx];

  byId("l1Now").textContent   = state.l1.idx + 1;
  byId("l1Total").textContent = state.l1.order.length;
  byId("l1BigShape").innerHTML = card.svg;

  byId("l1CheckOne").disabled = !state.l1.selectedAns;
  byId("l1Status").textContent = "اختر إجابة ثم اضغط «تحقّق».";

  renderL1Nums();
}

function renderL1Nums(){
  const box = byId("l1Nums");
  box.innerHTML = "";

  state.l1.order.forEach((card, i)=>{
    const b = document.createElement("button");
    b.className = "numBtn";
    b.textContent = card.id;

    if (i === state.l1.idx) b.classList.add("is-current");
    if (state.l1.results[card.id] === "ok")  b.classList.add("is-ok");
    if (state.l1.results[card.id] === "bad") b.classList.add("is-bad");

    b.onclick = ()=>{
      state.l1.idx = i;
      state.l1.selectedAns = null;
      renderL1();
    };
    box.appendChild(b);
  });
}

function checkL1(){
  const card = state.l1.order[state.l1.idx];
  const correct = card.kind === state.l1.selectedAns;

  state.l1.results[card.id] = correct ? "ok" : "bad";
  byId("l1Status").textContent =
    correct ? "✅ إجابة صحيحة" : "❌ إجابة غير صحيحة";

  const okCount = Object.values(state.l1.results).filter(v=>v==="ok").length;
  state.scores[1] = okCount;
  state.done[1] = (state.grade===9 ? okCount>=18 : okCount>=16);

  setTimeout(()=> nextL1(), 700);
  setProgressUI();
  saveProgress();
}

function nextL1(){
  state.l1.idx = (state.l1.idx + 1) % state.l1.order.length;
  state.l1.selectedAns = null;
  renderL1();
}
function prevL1(){
  state.l1.idx = (state.l1.idx - 1 + state.l1.order.length) % state.l1.order.length;
  state.l1.selectedAns = null;
  renderL1();
}
function restartL1(){
  state.l1.order = shuffle(L1_CARDS);
  state.l1.idx = 0;
  state.l1.selectedAns = null;
  state.l1.results = {};
  state.done[1] = false;
  state.scores[1] = null;
  renderL1();
  setProgressUI();
  saveProgress();
}

/* =========================
   Boot
========================= */

function init(){
  loadProgress();

  /* Tabs */
  document.querySelectorAll(".tab").forEach(t=>{
    t.onclick = ()=> setLevel(+t.dataset.level);
  });

  /* Grade */
  byId("gradeSel").value = state.grade;
  byId("gradeSel").onchange = e=>{
    state.grade = +e.target.value;
    saveProgress();
  };

  byId("resetBtn").onclick = ()=>{
    localStorage.removeItem(KEY);
    location.reload();
  };

  /* ===== Level 1 init ===== */
  state.l1.order = shuffle(L1_CARDS);
  renderL1();

  document.querySelectorAll(".ansbtn").forEach(btn=>{
    btn.onclick = ()=>{
      state.l1.selectedAns = btn.dataset.ans;
      document.querySelectorAll(".ansbtn").forEach(b=>b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      byId("l1CheckOne").disabled = false;
    };
  });

  byId("l1CheckOne").onclick = checkL1;
  byId("l1Next").onclick = nextL1;
  byId("l1Prev").onclick = prevL1;
  byId("l1Restart").onclick = restartL1;

  byId("to2").onclick = ()=> setLevel(2);

  setProgressUI();
}

init();
