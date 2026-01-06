/* =========================
   Level 1 – Single Card Quiz (New)
========================= */

state.l1 = {
  idx: 0,
  order: [],
  selectedAns: null,
  results: {}, // { [cardId]: "ok" | "bad" }
};

function expectedAns(card){
  // eq: 1-5
  if (card.kind === "eq") return "eq";
  // iso: فقط البطاقات 6 و7 حسب قائمتك الحالية
  if (card.id === 6 || card.id === 7) return "iso";
  // باقي المثلثات وغير المثلثات
  return "other";
}

function colorForCard(card){
  // ألوان جذابة مختلفة حسب النوع (بدون تعقيد)
  const a = expectedAns(card);
  if (a === "eq") return {fill:"#22c55e", stroke:"#16a34a"};   // أخضر
  if (a === "iso") return {fill:"#3b82f6", stroke:"#1d4ed8"};  // أزرق
  return {fill:"#f59e0b", stroke:"#d97706"};                   // برتقالي
}

function makeBigSvg(card){
  // نأخذ SVG الحالي ونحوّله إلى "ملون" بملء + سماكة أكبر
  // card.svg هو نص SVG جاهز. سنحقنه ونعدل بواسطة wrapper style.
  const {fill, stroke} = colorForCard(card);
  return `
    <div class="bigWrap" style="color:${stroke}">
      ${card.svg}
      <style>
        /* نلوّن عناصر svg داخل البطاقة */
        .bigWrap svg polygon, .bigWrap svg path, .bigWrap svg circle, .bigWrap svg line {
          stroke: ${stroke} !important;
          stroke-width: 8 !important;
        }
        .bigWrap svg polygon { fill: ${fill}22 !important; }
        .bigWrap svg path { fill: none !important; }
        .bigWrap svg circle { fill: ${fill}10 !important; }
      </style>
    </div>
  `;
}

function renderL1One(){
  const total = state.l1.order.length;
  const card = state.l1.order[state.l1.idx];

  byId("l1Now").textContent = String(state.l1.idx + 1);
  byId("l1Total").textContent = String(total);

  byId("l1BigShape").innerHTML = makeBigSvg(card);

  // تحديث أزرار الإجابة
  document.querySelectorAll(".ansbtn").forEach(btn=>{
    btn.classList.toggle("is-selected", btn.dataset.ans === state.l1.selectedAns);
  });

  // زر تحقق يعمل فقط إذا اختار إجابة
  byId("l1CheckOne").disabled = !state.l1.selectedAns;

  // تحديث شريط الأرقام
  renderL1Nums();

  // تحديث نتيجة سريعة
  const doneCount = Object.keys(state.l1.results).length;
  const okCount = Object.values(state.l1.results).filter(v=>v==="ok").length;
  byId("l1ScoreOne").textContent = `صحيح: ${okCount} / ${doneCount}`;

  // رسالة حالة
  byId("l1Status").textContent = "اختر إجابة ثم اضغط “تحقّق”.";
}

function renderL1Nums(){
  const box = byId("l1Nums");
  const total = state.l1.order.length;
  box.innerHTML = "";

  for (let i=0;i<total;i++){
    const card = state.l1.order[i];
    const b = document.createElement("button");
    b.className = "numBtn";
    b.textContent = String(card.id);

    if (i === state.l1.idx) b.classList.add("is-current");

    const res = state.l1.results[card.id];
    if (res === "ok") b.classList.add("is-ok");
    if (res === "bad") b.classList.add("is-bad");

    b.addEventListener("click", ()=>{
      state.l1.idx = i;
      state.l1.selectedAns = null;
      renderL1One();
    });

    box.appendChild(b);
  }
}

function checkL1One(){
  const card = state.l1.order[state.l1.idx];
  const exp = expectedAns(card);
  const got = state.l1.selectedAns;

  const ok = (exp === got);
  state.l1.results[card.id] = ok ? "ok" : "bad";

  // تحديث تلوين رقم البطاقة فورًا
  renderL1Nums();

  // رسالة مختصرة
  byId("l1Status").textContent = ok ? "✅ إجابة صحيحة" : `❌ إجابة غير صحيحة — الصحيح: ${
    exp === "eq" ? "متساوي الأضلاع" : exp === "iso" ? "متساوي الساقين" : "غير ذلك"
  }`;

  // الانتقال تلقائيًا للبطاقة التالية بعد 700ms
  setTimeout(()=>{
    l1Next();
  }, 700);

  // شرط اجتياز المستوى 1 (مثال): 18 صحيح من 24
  const okCount = Object.values(state.l1.results).filter(v=>v==="ok").length;
  state.scores[1] = okCount; // نخزّن عدد الصحيح
  state.done[1] = (okCount >= 18);

  byId("l1Msg").textContent = state.done[1]
    ? "✅ اجتزت المستوى البصري. يمكنك الانتقال للمستوى 2."
    : "تابع… الهدف هو تحسين التمييز البصري بدون قياس.";

  setProgressUI();
  saveProgress();
}

function l1Prev(){
  state.l1.idx = (state.l1.idx - 1 + state.l1.order.length) % state.l1.order.length;
  state.l1.selectedAns = null;
  renderL1One();
}
function l1Next(){
  state.l1.idx = (state.l1.idx + 1) % state.l1.order.length;
  state.l1.selectedAns = null;
  renderL1One();
}
function l1Restart(){
  state.l1.idx = 0;
  state.l1.selectedAns = null;
  state.l1.results = {};
  state.scores[1] = null;
  state.done[1] = false;

  // ترتيب جديد عشوائي
  state.l1.order = shuffle(L1_CARDS);

  byId("l1Msg").textContent = "";
  renderL1One();

  setProgressUI();
  saveProgress();
}
