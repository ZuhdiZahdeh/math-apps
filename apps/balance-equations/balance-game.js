// ===== بيانات المعادلات =====
// كل معادلة على شكل: aL * X + bL = aR * X + bR
// text: النص المعروض، coefficients: المعاملات
const equations = [
  {
    text: "-3X - 2 = -5X + 2",
    aL: -3,
    bL: -2,
    aR: -5,
    bR: 2
    // الحل هنا X = 2
  },
  {
    text: "2X + 3 = X + 5",   // X = 2
    aL: 2,
    bL: 3,
    aR: 1,
    bR: 5
  },
  {
    text: "4X - 1 = 3X + 2",  // X = 3
    aL: 4,
    bL: -1,
    aR: 3,
    bR: 2
  },
  {
    text: "-2X + 7 = X + 1",  // X = 2
    aL: -2,
    bL: 7,
    aR: 1,
    bR: 1
  }
];

// عناصر DOM
const equationTextEl  = document.getElementById("equationText");
const xValueSpan      = document.getElementById("xValueNumber");
const leftValueSpan   = document.getElementById("leftValue");
const rightValueSpan  = document.getElementById("rightValue");
const balanceImg      = document.querySelector(".balance-img");
const statusMessageEl = document.getElementById("statusMessage");

const btnPlus1     = document.getElementById("btnPlus1");
const btnMinus1    = document.getElementById("btnMinus1");
const btnPlusX     = document.getElementById("btnPlusX");
const btnMinusX    = document.getElementById("btnMinusX");
const btnNewEquation = document.getElementById("btnNewEquation");

const successSound = document.getElementById("successSound");
const errorSound   = document.getElementById("errorSound");

// حالة اللعبة
let currentEquation = null;
let solutionX = null;   // الحل الحقيقي
let currentX  = 0;      // قيمة X التي يجربها الطالب
let isSolved  = false;

// ===== دوال مساعدة =====

// حساب الحل من المعاملات
function computeSolution(eq) {
  const denominator = eq.aL - eq.aR;
  // نفترض أنه ليس صفرًا في هذه المجموعة من المسائل
  if (denominator === 0) return null;
  // (aL * X + bL = aR * X + bR)  =>  (aL - aR) X = bR - bL
  return (eq.bR - eq.bL) / denominator;
}

// تحديث عرض المعادلة
function renderEquation() {
  equationTextEl.textContent = currentEquation.text;
}

// تحديث عرض قيمة X
function renderXValue() {
  xValueSpan.textContent = currentX;
}

// تحديث الميزان وحساب قيم الطرفين
function updateScaleAndCheck() {
  const eq = currentEquation;

  const leftVal  = eq.aL * currentX + eq.bL;
  const rightVal = eq.aR * currentX + eq.bR;

  // عرض القيم للتغذية الراجعة
  leftValueSpan.textContent  = leftVal.toFixed(2);
  rightValueSpan.textContent = rightVal.toFixed(2);

  const diff = leftVal - rightVal;

  // إزالة كل الحالات أولاً
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
  if (isSolved) return; // منع التكرار

  isSolved = true;
  statusMessageEl.classList.add("success");
  statusMessageEl.textContent = `أحسنت! حصلت على التوازن الصحيح: X = ${solutionX}`;

  if (successSound) {
    successSound.currentTime = 0;
    successSound.play().catch(() => {});
  }
}

// عند عدم التوازن
function handleNotSolved() {
  if (!isSolved) return;

  // إذا كان الطالب قد غيّر X بعد الحل، نرجع للوضع العادي
  isSolved = false;
  statusMessageEl.classList.remove("success");
  statusMessageEl.textContent =
    "غيّر قيمة X حتى تصبح قيمتا الطرفين متساويتين ويتوقف الميزان عن الحركة.";
}

// اختيار معادلة جديدة عشوائيًا
function pickNewEquation() {
  const randomIndex = Math.floor(Math.random() * equations.length);
  currentEquation = equations[randomIndex];
  solutionX = computeSolution(currentEquation);

  // نعيد ضبط الحالة
  currentX = 0;
  isSolved = false;

  statusMessageEl.classList.remove("success");
  statusMessageEl.textContent =
    "غيّر قيمة X حتى تصبح قيمتا الطرفين متساويتين ويتوقف الميزان عن الحركة.";

  // إعادة تعيين الميزان
  balanceImg.classList.remove("swing-left", "swing-right");
  balanceImg.classList.add("balanced");

  renderEquation();
  renderXValue();
  updateScaleAndCheck();
}

// ===== ربط الأزرار =====

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

// زر مسألة جديدة
btnNewEquation.addEventListener("click", () => {
  pickNewEquation();
});

// ===== تشغيل اللعبة أول مرة =====
pickNewEquation();

