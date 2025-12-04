// =============================
// لعبة ميزان المعادلة الخطية
// =============================

// كل معادلة على شكل: aL * X + bL = aR * X + bR
// text: النص المعروض للطالب
const equations = [
  {
    text: "-3X - 2 = -5X + 2",   // X = 2
    aL: -3,
    bL: -2,
    aR: -5,
    bR: 2
  },
  {
    text: "2X + 3 = X + 5",      // X = 2
    aL: 2,
    bL: 3,
    aR: 1,
    bR: 5
  },
  {
    text: "4X - 1 = 3X + 2",     // X = 3
    aL: 4,
    bL: -1,
    aR: 3,
    bR: 2
  },
  {
    text: "-2X + 7 = X + 1",     // X = 2
    aL: -2,
    bL: 7,
    aR: 1,
    bR: 1
  }
];

// =============================
// عناصر DOM
// =============================
const equationTextEl   = document.getElementById("equationText");
const equationWithXEl  = document.getElementById("equationWithX");
const xValueSpan       = document.getElementById("xValueNumber");
const leftValueSpan    = document.getElementById("leftValue");
const rightValueSpan   = document.getElementById("rightValue");
const balanceImg       = document.querySelector(".balance-img");
const statusMessageEl  = document.getElementById("statusMessage");

const btnPlus1         = document.getElementById("btnPlus1");
const btnMinus1        = document.getElementById("btnMinus1");
const btnPlusX         = document.getElementById("btnPlusX");
const btnMinusX        = document.getElementById("btnMinusX");
const btnNewEquation   = document.getElementById("btnNewEquation");

const successSound     = document.getElementById("successSound");
const errorSound       = document.getElementById("errorSound"); // اختياري (لم يُستخدم حتى الآن)

// =============================
// حالة اللعبة
// =============================
let currentEquation = null;
let solutionX       = null;  // قيمة X الصحيحة
let currentX        = 0;     // قيمة X التي يجربها الطالب
let isSolved        = false;

// =============================
// دوال مساعدة
// =============================

// حساب حل المعادلة انطلاقًا من المعاملات
function computeSolution(eq) {
  const denominator = eq.aL - eq.aR;
  // نفترض أن المعادلات المختارة لا تعطي مقامًا = 0
  if (denominator === 0) return null;

  // من aL * X + bL = aR * X + bR  نحصل على:
  // (aL - aR)X = bR - bL
  return (eq.bR - eq.bL) / denominator;
}

// عرض النص الأصلي للمعادلة أعلى الصفحة
function renderEquation() {
  equationTextEl.textContent = currentEquation.text;
}

// عرض قيمة X الحالية
function renderXValue() {
  xValueSpan.textContent = currentX;
}

// تنسيق التعبير من الصورة aX + b بعد التعويض بـ X
function formatExpression(a, b, x) {
  let partX = "";

  if (a === 0) {
    partX = "";
  } else if (a === 1) {
    partX = `(${x})`;
  } else if (a === -1) {
    partX = `-(${x})`;
  } else {
    partX = `${a}×(${x})`;
  }

  let partB = "";
  if (b > 0) {
    partB = (partX ? " + " : "") + b;
  } else if (b < 0) {
    partB = (partX ? " - " : "") + Math.abs(b);
  }

  if (!partX && !partB) return "0";
  return partX + partB;
}

// كتابة المعادلة بعد التعويض بـ X الحالي
function renderEquationWithX() {
  const eq = currentEquation;
  const x  = currentX;

  const leftVal  = eq.aL * x + eq.bL;
  const rightVal = eq.aR * x + eq.bR;

  const leftExpr  = formatExpression(eq.aL, eq.bL, x);
  const rightExpr = formatExpression(eq.aR, eq.bR, x);

  equationWithXEl.innerHTML =
    `عند X = <strong>${x}</strong>: ` +
    `<span>${leftExpr} = ${rightExpr}</span>` +
    ` &nbsp; ⟹ &nbsp; ` +
    `<span class="result">${leftVal.toFixed(2)} = ${rightVal.toFixed(2)}</span>`;
}

// تحديث الميزان وحساب قيم الطرفين مع كل تغيير في X
function updateScaleAndCheck() {
  const eq = currentEquation;

  const leftVal  = eq.aL * currentX + eq.bL;
  const rightVal = eq.aR * currentX + eq.bR;

  // عرض القيم الرقمية للطرفين
  leftValueSpan.textContent  = leftVal.toFixed(2);
  rightValueSpan.textContent = rightVal.toFixed(2);

  // عرض المعادلة بعد التعويض
  renderEquationWithX();

  const diff = leftVal - rightVal;

  // إعادة تعيين حالة الميزان أولًا
  balanceImg.classList.remove("balanced", "swing-left", "swing-right");

  const EPS = 1e-6;

  if (Math.abs(diff) < EPS) {
    // متوازن
    balanceImg.classList.add("balanced");
    handleSolved();
  } else if (diff > 0) {
    // الطرف الأيسر أثقل
    balanceImg.classList.add("swing-left");
    handleNotSolved();
  } else {
    // الطرف الأيمن أثقل
    balanceImg.classList.add("swing-right");
    handleNotSolved();
  }
}

// عند الوصول للحل الصحيح
function handleSolved() {
  if (isSolved) return; // لا نكرر الرسالة أو الصوت

  isSolved = true;
  statusMessageEl.classList.add("success");

  // تقريب الحل لرقمين بعد الفاصلة (احتياطًا)
  const niceSolution = Number(solutionX.toFixed(2));
  statusMessageEl.textContent =
    `أحسنت! حصلت على التوازن الصحيح: X = ${niceSolution}`;

  if (successSound) {
    successSound.currentTime = 0;
    successSound.play().catch(() => {});
  }
}

// عندما يكون الميزان غير متوازن بعد أن كان متوازنًا
function handleNotSolved() {
  if (!isSolved) return;

  isSolved = false;
  statusMessageEl.classList.remove("success");
  statusMessageEl.textContent =
    "غيّر قيمة X حتى تصبح قيمتا الطرفين متساويتين ويتوقف الميزان عن الحركة.";
}

// اختيار معادلة جديدة عشوائيًا وتهيئة اللعبة
function pickNewEquation() {
  const randomIndex = Math.floor(Math.random() * equations.length);
  currentEquation = equations[randomIndex];
  solutionX = computeSolution(currentEquation);

  currentX = 0;
  isSolved = false;

  statusMessageEl.classList.remove("success");
  statusMessageEl.textContent =
    "غيّر قيمة X حتى تصبح قيمتا الطرفين متساويتين ويتوقف الميزان عن الحركة.";

  // إعادة تعيين صورة الميزان
  balanceImg.classList.remove("swing-left", "swing-right");
  balanceImg.classList.add("balanced");

  renderEquation();
  renderXValue();
  updateScaleAndCheck(); // سيقوم أيضًا بكتابة المعادلة بعد التعويض بـ X = 0
}

// =============================
// ربط الأزرار بالأحداث
// =============================

// +1 : زيادة X بمقدار 1
btnPlus1.addEventListener("click", () => {
  currentX += 1;
  renderXValue();
  updateScaleAndCheck();
});

// -1 : إنقاص X بمقدار 1
btnMinus1.addEventListener("click", () => {
  currentX -= 1;
  renderXValue();
  updateScaleAndCheck();
});

// +X : زيادة X بخطوة أكبر (هنا 5 درجات)
btnPlusX.addEventListener("click", () => {
  currentX += 5;
  renderXValue();
  updateScaleAndCheck();
});

// -X : إنقاص X بخطوة أكبر (هنا 5 درجات)
btnMinusX.addEventListener("click", () => {
  currentX -= 5;
  renderXValue();
  updateScaleAndCheck();
});

// زر "مسألة جديدة"
btnNewEquation.addEventListener("click", () => {
  pickNewEquation();
});

// =============================
// تشغيل اللعبة لأول مرة
// =============================
pickNewEquation();
