// =============================
// لعبة ميزان المعادلة الخطية – نسخة خطوات الحل
// =============================

// كل مسألة على شكل: aL * X + bL = aR * X + bR
const equations = [
  {
    text: "2X + 3 = X + 5", // الحل X = 2
    aL: 2,
    bL: 3,
    aR: 1,
    bR: 5
  },
  {
    text: "-3X - 2 = -5X + 2", // الحل X = 2
    aL: -3,
    bL: -2,
    aR: -5,
    bR: 2
  },
  {
    text: "4X - 1 = 3X + 2", // الحل X = 3
    aL: 4,
    bL: -1,
    aR: 3,
    bR: 2
  },
  {
    text: "-2X + 7 = X + 1", // الحل X = 2
    aL: -2,
    bL: 7,
    aR: 1,
    bR: 1
  }
];

// عناصر DOM
const originalEquationTextEl = document.getElementById("originalEquationText");
const currentEquationTextEl  = document.getElementById("currentEquationText");
const pendingHintEl          = document.getElementById("pendingHint");

const leftValueSpan   = document.getElementById("leftValue");
const rightValueSpan  = document.getElementById("rightValue");
const balanceImg      = document.querySelector(".balance-img");
const statusMessageEl = document.getElementById("statusMessage");

const stepsBody       = document.getElementById("stepsBody");
const verificationSection = document.getElementById("verificationSection");
const verificationContent = document.getElementById("verificationContent");

const successSound    = document.getElementById("successSound");
const newEquationBtn  = document.getElementById("btnNewEquation");

// أزرار العمليات (لكلا الطرفين)
const controlButtons  = document.querySelectorAll(".control-btn");

// =============================
// حالة اللعبة
// =============================
let currentEquation = null;   // المسألة الحالية (الأصلية)
let aL, bL, aR, bR;           // معاملات المعادلة الحالية على الميزان
let solutionX = 0;            // الحل الحقيقي لـ X
let steps = [];               // جدول خطوات الحل
let pendingOp = null;         // عملية مطبقة على طرف واحد فقط
let isSolved = false;

// =============================
// دوال مساعدة للمعادلات
// =============================

// حساب الحل X من المعاملات
function computeSolution(eq) {
  const denom = eq.aL - eq.aR;
  if (denom === 0) return 0; // نفترض عدم استخدام هذه الحالة
  return (eq.bR - eq.bL) / denom;
}

// تنسيق طرف المعادلة (aX + b) كنص
function formatSide(a, b) {
  let partX = "";
  if (a === 0) {
    partX = "";
  } else if (a === 1) {
    partX = "X";
  } else if (a === -1) {
    partX = "-X";
  } else {
    partX = `${a}X`;
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

// تنسيق المعادلة كاملة "… = …"
function formatEquation(aL, bL, aR, bR) {
  const leftSide  = formatSide(aL, bL);
  const rightSide = formatSide(aR, bR);
  return `${leftSide} = ${rightSide}`;
}

// تنسيق تعبير بعد التعويض بـ X (لخطوة التحقق)
function formatExpressionWithValue(a, b, x) {
  let partX = "";
  if (a === 0) {
    partX = "";
  } else if (a === 1) {
    partX = `${x}`;
  } else if (a === -1) {
    partX = `-${x}`;
  } else {
    partX = `${a}×${x}`;
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

// =============================
// التحكم في الميزان والقيم
// =============================

// تحديث الميزان والقيم العددية والنص الحالي للمعادلة
function updateScaleAndEquation() {
  const leftVal  = aL * solutionX + bL;
  const rightVal = aR * solutionX + bR;

  leftValueSpan.textContent  = leftVal.toFixed(2);
  rightValueSpan.textContent = rightVal.toFixed(2);

  currentEquationTextEl.textContent = formatEquation(aL, bL, aR, bR);

  // تحريك الميزان
  const diff = leftVal - rightVal;
  const EPS = 1e-6;

  balanceImg.classList.remove("balanced", "swing-left", "swing-right");

  if (Math.abs(diff) < EPS) {
    balanceImg.classList.add("balanced");
  } else if (diff > 0) {
    balanceImg.classList.add("swing-left");
  } else {
    balanceImg.classList.add("swing-right");
  }

  // فحص ما إذا وصلنا لصيغة X = عدد مع توازن حقيقي
  if (checkSolvedEquation()) {
    handleSolved();
  }
}

// فحص حالة الحل النهائي: عزل X في طرف واحد وتوازن حقيقي
function checkSolvedEquation() {
  const EPS = 1e-6;
  const leftVal  = aL * solutionX + bL;
  const rightVal = aR * solutionX + bR;
  const balanced = Math.abs(leftVal - rightVal) < EPS;

  const isolatedOnLeft  = (aL === 1 && aR === 0);
  const isolatedOnRight = (aR === 1 && aL === 0);

  return balanced && (isolatedOnLeft || isolatedOnRight);
}

// عند الوصول للحل الصحيح
function handleSolved() {
  if (isSolved) return;
  isSolved = true;

  statusMessageEl.classList.add("success");
  statusMessageEl.textContent =
    `أحسنت! عزلت المتغير X وحصلت على X = ${solutionX.toFixed(2)}.`;

  pendingHintEl.textContent = "يمكنك الآن ملاحظة خطوة التحقق في الأسفل.";

  if (successSound) {
    successSound.currentTime = 0;
    successSound.play().catch(() => {});
  }

  showVerificationStep();
}

// عرض خطوة التحقق بالتعويض
function showVerificationStep() {
  const eq = currentEquation;
  const x  = solutionX;

  const leftExpr  = formatExpressionWithValue(eq.aL, eq.bL, x);
  const rightExpr = formatExpressionWithValue(eq.aR, eq.bR, x);

  const leftVal  = eq.aL * x + eq.bL;
  const rightVal = eq.aR * x + eq.bR;

  verificationContent.innerHTML = `
    <p>عَوِّض قيمة المتغير <strong>X = ${x}</strong> في المسألة الأصلية:</p>
    <p class="verify-eq">${leftExpr} = ${rightExpr}</p>
    <p class="verify-res">${leftVal} = ${rightVal} <span class="verify-ok">/ أحسنت</span></p>
  `;
  verificationSection.classList.add("visible");
}

// =============================
// جدول خطوات الحل
// =============================

function renderStepsTable() {
  stepsBody.innerHTML = "";

  steps.forEach((step) => {
    const tr = document.createElement("tr");

    const tdEq = document.createElement("td");
    tdEq.textContent = step.equation;

    const tdReason = document.createElement("td");
    tdReason.textContent = step.reason;

    tr.appendChild(tdEq);
    tr.appendChild(tdReason);
    stepsBody.appendChild(tr);
  });
}

// إضافة خطوة جديدة بعد تطبيق نفس العملية على الطرفين
function addStepForSymmetricOp(opType) {
  const equationText = formatEquation(aL, bL, aR, bR);
  const reasonText   = getOperationDescription(opType);

  steps.push({
    equation: equationText,
    reason: reasonText
  });

  renderStepsTable();
}

// وصف العملية التي طُبِّقت على الطرفين
function getOperationDescription(opType) {
  switch (opType) {
    case "PLUS1":  return "إضافة 1 إلى طرفي المعادلة";
    case "MINUS1": return "طرح 1 من طرفي المعادلة";
    case "PLUSX":  return "إضافة X إلى طرفي المعادلة";
    case "MINUSX": return "طرح X من طرفي المعادلة";
    default:       return "";
  }
}

// =============================
// العمليات على الطرفين
// =============================

// تطبيق العملية على أحد الطرفين فقط (L أو R)
function applyOperationToSide(side, opType) {
  switch (opType) {
    case "PLUS1":
      if (side === "L") bL += 1;
      else              bR += 1;
      break;
    case "MINUS1":
      if (side === "L") bL -= 1;
      else              bR -= 1;
      break;
    case "PLUSX":
      if (side === "L") aL += 1;
      else              aR += 1;
      break;
    case "MINUSX":
      if (side === "L") aL -= 1;
      else              aR -= 1;
      break;
  }
}

// عند الضغط على زر من أزرار الطرفين
function handleControlClick(side, opType) {
  if (isSolved) {
    // بعد الحل يمكن للطالب الضغط لكن لن نُحدّث الخطوات
    applyOperationToSide(side, opType);
    updateScaleAndEquation();
    return;
  }

  // تطبيق العملية على الطرف الذي اختاره الطالب
  applyOperationToSide(side, opType);
  updateScaleAndEquation();

  // إدارة حالة العملية المعلقة
  if (
    pendingOp &&
    pendingOp.opType === opType &&
    pendingOp.side !== side
  ) {
    // الآن طُبِّقت نفس العملية على الطرف الآخر -> خطوة حل جبري
    addStepForSymmetricOp(opType);
    pendingOp = null;

    pendingHintEl.textContent =
      "أحسنت! عندما تطبق نفس العملية على الطرفين تحافظ على توازن المعادلة.";

  } else {
    // بدء عملية جديدة معلّقة أو استبدال القديمة
    pendingOp = { opType, side };
    const otherSideLabel = side === "L" ? "الأيمن" : "الأيسر";
    pendingHintEl.textContent =
      `الآن جرّب تطبيق نفس العملية على الطرف ${otherSideLabel} لتحافظ على توازن المعادلة.`;
  }
}

// =============================
// تهيئة مسألة جديدة
// =============================

function loadNewEquation() {
  // اختيار معادلة عشوائية
  const randomIndex = Math.floor(Math.random() * equations.length);
  currentEquation = equations[randomIndex];

  aL = currentEquation.aL;
  bL = currentEquation.bL;
  aR = currentEquation.aR;
  bR = currentEquation.bR;

  solutionX = computeSolution(currentEquation);

  isSolved  = false;
  pendingOp = null;

  // مسألة أصلية
  originalEquationTextEl.textContent = currentEquation.text;
  currentEquationTextEl.textContent  = formatEquation(aL, bL, aR, bR);

  statusMessageEl.classList.remove("success");
  statusMessageEl.textContent =
    "حاول عزل المتغير X في أحد الطرفين ثم اجعل الميزان متوازنًا في النهاية.";

  pendingHintEl.textContent =
    "طبّق عملية على أحد الطرفين، ثم طبّق نفس العملية على الطرف الآخر لتحافظ على توازن المعادلة.";

  // إعادة تعيين خطوات الحل
  steps = [
    {
      equation: formatEquation(aL, bL, aR, bR),
      reason: "المسألة الأصلية"
    }
  ];
  renderStepsTable();

  // إخفاء التحقق
  verificationSection.classList.remove("visible");
  verificationContent.innerHTML = "";

  // إعادة تعيين حالة الميزان
  updateScaleAndEquation();
}

// =============================
// ربط الأحداث
// =============================

// أزرار الطرفين
controlButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const side  = btn.dataset.side; // "L" أو "R"
    const opType = btn.dataset.op;  // PLUS1 / MINUS1 / PLUSX / MINUSX
    handleControlClick(side, opType);
  });
});

// زر مسألة جديدة
newEquationBtn.addEventListener("click", loadNewEquation);

// تشغيل اللعبة أول مرة
loadNewEquation();

