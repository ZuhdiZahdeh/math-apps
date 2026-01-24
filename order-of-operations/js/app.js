const QUESTIONS = [
  // سهل (3)
  {
    id: "e1",
    level: "easy",
    title: "المقصف",
    story: "اشترى طالب 3 ساندويشات ثمن الواحد 12 شيكل، و2 عصير ثمن الواحد 5 شيكل. كم دفع؟",
    exprChoices: [
      "3×12 + 2×5",
      "(3+12)×(2+5)",
      "3×(12+2)×5",
      "(3×12+2)×5"
    ],
    correctExpr: [0],
    answer: 46,
    hint: "ابدأ بالضرب لأنه يمثل «عدد × سعر». ثم اجمع النتيجتين.",
    steps: [
      "اكتب التعبير: 3×12 + 2×5",
      "احسب الضرب: 3×12=36 و 2×5=10",
      "اجمع: 36+10=46"
    ]
  },
  {
    id: "e2",
    level: "easy",
    title: "قرطاسية",
    story: "اشترت طالبة عبوتين، في كل عبوة 6 دفاتر، ثم أضافت 4 دفاتر هدية. كم دفترًا لديها؟",
    exprChoices: [
      "2×6 + 4",
      "2×(6+4)",
      "2+6+4",
      "(2+6)×4"
    ],
    correctExpr: [0],
    answer: 16,
    hint: "العبوتان = مجموعتان من 6، ثم نضيف الهدية.",
    steps: [
      "اكتب التعبير: 2×6 + 4",
      "احسب: 2×6=12",
      "ثم: 12+4=16"
    ]
  },
  {
    id: "e3",
    level: "easy",
    title: "المسبح",
    story: "دخول المسبح 8 شيكل، وكل ساعة 6 شيكل. إذا بقي 4 ساعات، كم سيدفع؟",
    exprChoices: [
      "8 + 6×4",
      "(8+6)×4",
      "8×6×4",
      "8 + (6+4)"
    ],
    correctExpr: [0],
    answer: 32,
    hint: "أجرة الساعات تُحسب أولًا (6×4) ثم نضيف رسوم الدخول.",
    steps: [
      "اكتب التعبير: 8 + 6×4",
      "احسب: 6×4=24",
      "ثم: 8+24=32"
    ]
  },

  // متوسط (6)
  {
    id: "m1",
    level: "medium",
    title: "سينما + خصم",
    story: "ثمن تذكرة الكبير 35 شيكل، والصغير 25 شيكل. اشترت عائلة 3 تذاكر كبار و2 صغار، ثم خصم 20 شيكل على المجموع. كم دفعت؟",
    exprChoices: [
      "3×35 + 2×25 − 20",
      "(3+35) + (2+25) − 20",
      "3×(35+2)×25 − 20",
      "(3×35 + 2×25) ÷ 20"
    ],
    correctExpr: [0],
    answer: 135,
    hint: "احسب ثمن الكبار والصغار بالضرب، اجمع، ثم اطرح الخصم في النهاية.",
    steps: [
      "اكتب التعبير: 3×35 + 2×25 − 20",
      "3×35=105 و 2×25=50",
      "105+50=155",
      "155−20=135"
    ]
  },
  {
    id: "m2",
    level: "medium",
    title: "رحلة صفية وتقاسم",
    story: "استئجار حافلة: 240 شيكل ثابتة + 18 شيكل لكل طالب. شارك 12 طالبًا، ثم قُسّمت التكلفة بالتساوي على 6 طلاب (هم من سيدفعون). كم يدفع كل واحد؟",
    exprChoices: [
      "(240 + 18×12) ÷ 6",
      "240 + 18×(12 ÷ 6)",
      "(240+18)×(12 ÷ 6)",
      "(240 ÷ 6) + (18×12)"
    ],
    correctExpr: [0],
    answer: 76,
    hint: "أولًا احسب التكلفة الكاملة، ثم اقسم على عدد من سيدفع.",
    steps: [
      "اكتب التعبير: (240 + 18×12) ÷ 6",
      "احسب 18×12=216",
      "240+216=456",
      "456÷6=76"
    ]
  },
  {
    id: "m3",
    level: "medium",
    title: "رحلة تخييم (باقي ثم توزيع)",
    story: "في الرحلة يوجد 6 صناديق، في كل صندوق 10 علب. تحطمت 4 علب. قُسِّم الباقي بالتساوي على 8 مجموعات. كم علبة لكل مجموعة؟",
    exprChoices: [
      "(6×10 − 4) ÷ 8",
      "6×(10 − 4) ÷ 8",
      "(6×10) − (4 ÷ 8)",
      "6×10 − (4 ÷ 8)"
    ],
    correctExpr: [0],
    answer: 7,
    hint: "احسب العدد الكلي أولًا، ثم اطرح التالف، ثم اقسم الباقي.",
    steps: [
      "اكتب التعبير: (6×10 − 4) ÷ 8",
      "6×10=60",
      "60−4=56",
      "56÷8=7"
    ]
  },
  {
    id: "m4",
    level: "medium",
    title: "باقة هاتف (زيادة دقائق)",
    story: "باقتك 50 شيكل وتشمل 100 دقيقة. كل دقيقة إضافية تكلف 0.5 شيكل. إذا استخدمت 160 دقيقة، كم تدفع؟",
    exprChoices: [
      "50 + (160−100)×0.5",
      "(50+160−100)×0.5",
      "50 + 160 − 100×0.5",
      "50 + (160 ÷ 100)×0.5"
    ],
    correctExpr: [0],
    answer: 80,
    hint: "المهم هنا الأقواس: احسب الدقائق الزائدة (160−100) ثم اضرب بالتكلفة.",
    steps: [
      "اكتب التعبير: 50 + (160−100)×0.5",
      "الدقائق الزائدة: 160−100=60",
      "ثمن الزيادة: 60×0.5=30",
      "المجموع: 50+30=80"
    ]
  },
  {
    id: "m5",
    level: "medium",
    title: "وصفة كعك (لكل كعكة)",
    story: "لكل كعكة تحتاج 2 كوب طحين و3 أكواب حليب. إذا ستصنع 4 كعكات، كم مجموع الأكواب كلها؟",
    exprChoices: [
      "4×(2+3)",
      "4×2+3",
      "4×2 + 4×3",
      "(4+2)×3"
    ],
    correctExpr: [0, 2],
    answer: 20,
    hint: "فكّر بها كحزمة: (طحين + حليب) لكل كعكة، ثم نكررها 4 مرات.",
    steps: [
      "طريقة 1: 4×(2+3)=4×5=20",
      "طريقة 2 (بالتوزيع): 4×2 + 4×3 = 8 + 12 = 20"
    ]
  },
  {
    id: "m6",
    level: "medium",
    title: "شرائط تزيين (يسار→يمين)",
    story: "لديك 48 متر شريط. قسمته إلى 6 أجزاء متساوية، ثم ضاعفت طول كل جزء. ما طول الجزء بعد المضاعفة؟",
    exprChoices: [
      "48 ÷ 6 × 2",
      "48 ÷ (6×2)",
      "(48 ÷ 6) + 2",
      "48 ÷ (6 ÷ 2)"
    ],
    correctExpr: [0],
    answer: 16,
    hint: "الضرب والقسمة نفس القوة: نفذ حسب ترتيب الظهور: 48÷6 ثم ×2.",
    steps: [
      "اكتب التعبير: 48 ÷ 6 × 2",
      "48÷6=8",
      "8×2=16"
    ]
  },

  // صعب (3)
  {
    id: "h1",
    level: "hard",
    title: "تبليط ساحة (أسس + خصم + إضافة)",
    story: "ساحة مربعة ضلعها 9 م. ثمن التبليط 7 شيكل لكل 1m². يوجد خصم 15% على ثمن البلاط فقط، ثم تُضاف أجرة نقل ثابتة 60 شيكل. ما التكلفة النهائية؟",
    exprChoices: [
      "(7×(9^2))×(1−0.15) + 60",
      "7×(9^2)×0.85 + 60",
      "7×9^2 + 60 − 0.15",
      "((7×9)^2)×(1−0.15) + 60"
    ],
    correctExpr: [0, 1],
    answer: 541.95,
    tol: 0.01,
    hint: "ابدأ بالأس: 9^2. ثم احسب ثمن البلاط، ثم طبق الخصم على ثمن البلاط فقط، ثم أضف النقل.",
    steps: [
      "احسب المساحة: 9^2=81",
      "ثمن البلاط قبل الخصم: 7×81=567",
      "بعد الخصم 15%: 567×0.85=481.95",
      "أضف النقل: 481.95 + 60 = 541.95"
    ]
  },
  {
    id: "h2",
    level: "hard",
    title: "كراتين وأكياس (أسس + أقواس + عمليات)",
    story: "لديك 3 كراتين. في كل كرتونة عدد القطع يساوي (2^3 + 6). تضررت 6 قطع. تريد تعبئة الباقي في أكياس، في كل كيس 4 قطع. كم كيسًا كاملًا يمكنك تعبئته؟",
    exprChoices: [
      "((3×(2^3+6)) − 6) ÷ 4",
      "(3×2^3) + (6−6) ÷ 4",
      "(3×(2^3+6) − 6) ÷ (4+1)",
      "3×(2^(3+6)) − 6 ÷ 4"
    ],
    correctExpr: [0],
    answer: 9,
    hint: "احسب داخل الأقواس أولًا (2^3+6) لأنها «لكل كرتونة»، ثم اضرب ×3، ثم اطرح التالف، ثم اقسم.",
    steps: [
      "2^3=8",
      "8+6=14 قطعة في كل كرتونة",
      "3×14=42",
      "42−6=36",
      "36÷4=9 أكياس كاملة"
    ]
  },
  {
    id: "h3",
    level: "hard",
    title: "تخزين فيديو (تضاعف + أسس + قسمة)",
    story: "حجم فيديو في البداية 5MB ويتضاعف حجمه كل ساعة (×2). بعد 3 ساعات أُضيف ملف ترجمة حجمه 12MB. ثم قُسم الحجم النهائي بالتساوي على شخصين. كم نصيب كل شخص؟",
    exprChoices: [
      "(5×(2^3) + 12) ÷ 2",
      "5×2^(3+12) ÷ 2",
      "5×2^3 + (12 ÷ 2)",
      "(5×2)^(3) + 12 ÷ 2"
    ],
    correctExpr: [0],
    answer: 26,
    hint: "التضاعف عبر الزمن يُكتب بأسس: 5×2^3. ثم أضف الترجمة، ثم اقسم على 2.",
    steps: [
      "2^3=8",
      "5×8=40",
      "40+12=52",
      "52÷2=26"
    ]
  }
];

const LEVELS = [
  { key: "easy", label: "سهل", count: 3 },
  { key: "medium", label: "متوسط", count: 6 },
  { key: "hard", label: "صعب", count: 3 }
];

const $ = (id) => document.getElementById(id);

const state = {
  level: "easy",
  idx: 0,
  solved: loadProgress() // { [qid]: true }
};

function loadProgress(){
  try{
    return JSON.parse(localStorage.getItem("oop_progress_v1") || "{}");
  }catch{
    return {};
  }
}
function saveProgress(){
  localStorage.setItem("oop_progress_v1", JSON.stringify(state.solved));
}

function fmtExpr(s){
  // عرض ^ كما هي مع مسافة لطيفة
  return s.replaceAll("−","-");
}

function parseNumber(input){
  if (input == null) return NaN;
  let s = String(input).trim()
    .replaceAll("،", ".")
    .replaceAll(",", ".")
    .replace(/\s+/g, "")
    .replaceAll("−","-");
  if (!s) return NaN;

  // كسر بسيط a/b
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (frac){
    const a = parseFloat(frac[1]);
    const b = parseFloat(frac[2]);
    if (!isFinite(a) || !isFinite(b) || b === 0) return NaN;
    return a / b;
  }
  const n = parseFloat(s);
  return isFinite(n) ? n : NaN;
}

function currentList(){
  return QUESTIONS.filter(q => q.level === state.level);
}

function solvedCount(){
  const list = currentList();
  return list.filter(q => state.solved[q.id]).length;
}

function setLevel(levelKey){
  state.level = levelKey;
  state.idx = 0;
  document.querySelectorAll(".lvl").forEach(b=>{
    const on = b.dataset.level === levelKey;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  render();
}

function go(delta){
  const list = currentList();
  state.idx = Math.max(0, Math.min(list.length - 1, state.idx + delta));
  render();
}

function render(){
  const list = currentList();
  const q = list[state.idx];

  // أزرار تنقل
  $("prevBtn").disabled = (state.idx === 0);
  $("nextBtn").disabled = (state.idx === list.length - 1);

  // شريط تقدم
  const done = solvedCount();
  const total = list.length;
  $("progressText").textContent = `مستوى ${LEVELS.find(l=>l.key===state.level).label}: ${state.idx+1}/${total} — محلول: ${done}/${total}`;
  $("barFill").style.width = `${Math.round((done/total)*100)}%`;

  // بطاقة السؤال
  const isSolved = !!state.solved[q.id];
  $("qCard").innerHTML = `
    <div class="qhead">
      <h3>${q.title}</h3>
      <div class="qmeta">
        <span class="pill">المستوى: ${LEVELS.find(l=>l.key===q.level).label}</span>
        <span class="pill">السؤال: ${state.idx+1} / ${total}</span>
        <span class="pill">${isSolved ? "✅ تم الحل" : "⏳ لم يُحل بعد"}</span>
      </div>
    </div>

    <p class="story">${q.story}</p>

    <div class="block">
      <h4>1) اختر التعبير الصحيح</h4>
      <div class="choices">
        ${q.exprChoices.map((c,i)=>`
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

  // أحداث
  $("checkBtn").addEventListener("click", ()=>check(q));
  $("hintBtn").addEventListener("click", ()=>showHint(q));
  $("stepsBtn").addEventListener("click", ()=>toggleSteps(q));
  $("resetBtn").addEventListener("click", ()=>reset(q));
}

function selectedExprIndex(){
  const el = document.querySelector('input[name="expr"]:checked');
  return el ? parseInt(el.value,10) : null;
}

function showFeedback(html, ok){
  const box = $("feedback");
  box.style.display = "block";
  box.classList.toggle("ok", !!ok);
  box.classList.toggle("bad", !ok);
  box.innerHTML = html;
}

function check(q){
  const sel = selectedExprIndex();
  const ans = parseNumber($("ansInput").value);
  const tol = q.tol ?? 1e-9;

  const exprOk = (sel != null) && (q.correctExpr.includes(sel));
  const ansOk = isFinite(ans) && (Math.abs(ans - q.answer) <= tol);

  if (sel == null){
    showFeedback("اختر تعبيرًا أولًا من القائمة.", false);
    return;
  }
  if (!isFinite(ans)){
    showFeedback("اكتب الناتج كرقم (يمكن استخدام كسر مثل 456/6).", false);
    return;
  }

  if (exprOk && ansOk){
    state.solved[q.id] = true;
    saveProgress();
    showFeedback(`✅ ممتاز! التعبير صحيح والناتج صحيح: <b>${q.answer}</b>`, true);
    // تحديث شريط التقدم
    $("barFill").style.width = `${Math.round((solvedCount()/currentList().length)*100)}%`;
    $("progressText").textContent = `مستوى ${LEVELS.find(l=>l.key===state.level).label}: ${state.idx+1}/${currentList().length} — محلول: ${solvedCount()}/${currentList().length}`;
  } else {
    const parts = [];
    parts.push(exprOk ? "✅ التعبير صحيح." : "❌ التعبير غير صحيح (راجع الأقواس/الترتيب).");
    parts.push(ansOk ? "✅ الناتج صحيح." : `❌ الناتج غير صحيح. الصحيح هو <b>${q.answer}</b>.`);
    parts.push(`<span class="muted">نصيحة: ${q.hint}</span>`);
    showFeedback(parts.join("<br>"), false);
  }
}

function showHint(q){
  showFeedback(`💡 ${q.hint}`, true);
}

function toggleSteps(q){
  const box = $("steps");
  if (box.style.display === "none"){
    box.style.display = "block";
    box.innerHTML = `
      <b>الخطوات:</b>
      <ul>${q.steps.map(s=>`<li>${s}</li>`).join("")}</ul>
    `;
  } else {
    box.style.display = "none";
    box.innerHTML = "";
  }
}

function reset(q){
  // تفريغ الاختيارات والإدخال
  document.querySelectorAll('input[name="expr"]').forEach(r=>r.checked=false);
  $("ansInput").value = "";
  $("feedback").style.display = "none";
  $("steps").style.display = "none";
  $("steps").innerHTML = "";
}

function init(){
  document.querySelectorAll(".lvl").forEach(btn=>{
    btn.addEventListener("click", ()=>setLevel(btn.dataset.level));
  });
  $("prevBtn").addEventListener("click", ()=>go(-1));
  $("nextBtn").addEventListener("click", ()=>go(1));
  render();
}
init();
