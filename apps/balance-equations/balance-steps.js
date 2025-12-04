// =============================
// لعبة ميزان المعادلة الخطية – نسخة خطوات الحل (مفهوم المعادلة)
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

// ===== عناصر DOM =====
const originalEquationTextEl = document.getElementById("originalEquationText");
const currentEquationTextEl  = document.getElementById("currentEquationText");
const pendingHintEl          = document.getElementById("pendingHint");

const leftValueSpan   = document.getElementById("leftValue");
const rightValueSpan  = document.getElementById("rightValue");
const balanceImg      = document.querySelector(".balance-img");
const statusMessageEl = document.getElementById("statusMessage");

const stepsBody           = document.getElementById("stepsBody");
const verificationSection = document.getElementById("verificationSection");
const verificationContent = document.getElementById("verificationContent");

const successSound    = document.getElementById("successSound");
const newEquationBtn  = document.getElementById("btnNewEquation");
const controlButtons  = document.querySelectorAll(".control-btn");

// ===== حالة اللعبة =====
let currentEquation = null;  // المسألة الأصلية الحالية

// المعاملات الحالية على الميزان
let aL, bL, aR, bR;

// المعاملات في آخر حالة متوازنة (خطوة صحيحة معتمدة)
let baseAL, baseBL, baseAR, baseBR;

let steps = [];        // جدول خطوات الحل
let isSolved = false;  // هل وصلنا لصيغة X = عدد؟
let solutionX = null;  // قيمة X التي استخرجناها من المعادلة

// =============================
// دوال تنسيق المعادلات
// =============================

// تنسيق طرف واحد aX + b كنص
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

// وصف التغيير من حالة متوازنة سابقة إلى الحالة الحالية
function describeDelta(deltaA, deltaB) {
  const parts = [];

  if (deltaA > 0) {
    parts.push(
      deltaA === 1
        ? "إضافة X إلى طرفي المعادلة"
        : `إضافة ${deltaA}X إلى طرفي المعادلة`
    );
  } else if (deltaA < 0) {
    const k = Math.abs(deltaA);
    parts.push(
      k === 1
        ? "طرح X من طرفي المعادلة"
        : `طرح ${k}X من طرفي المعادلة`
    );
  }

  if (deltaB > 0) {
    parts.push(
      deltaB === 1
        ? "إضافة 1 إلى طرفي المعادلة"
        : `إضافة ${deltaB} إلى طرفي المعادلة`
    );
  } else if (deltaB < 0) {
    const k = Math.abs(deltaB);
    parts.push(
      k === 1
        ? "طرح 1 من طرفي المعادلة"
        : `طرح ${k} من طرفي المعادلة`
    );
  }

  if (parts.length === 0) return "لا يوجد تغيير في المعادلة.";
  if (parts.length === 1) return parts[0];
  return parts.join(" و ");
}

// =============================
// تحديث الميزان والمعادلة المعروضة
// =============================

function updateScaleAndEquation() {
  // عرض المسألة الأصلية والمعادلة الحالية
  originalEquationTextEl.textContent = currentEquation.text;
  currentEquationTextEl.textContent  = formatEquation(aL, bL, aR, bR);

  // عرض شكل الطرفين في السطرين أسفل الميزان
  leftValueSpan.textContent  = formatSide(aL, bL);
  rightValueSpan.textContent = formatSide(aR, bR);

  // حساب الفروق بين المعاملات الحالية وآخر حالة متوازنة (base)
  const deltaAL = aL - baseAL;
  const deltaBL = bL - baseBL;
  const deltaAR = aR - baseAR;
  const deltaBR = bR - baseBR;

  // الفروق بين ما حدث لليسار وما حدث لليمين
  const dA = deltaAL - deltaAR;
  const dB = deltaBL - deltaBR;

  const balancedOps = (dA === 0 && dB === 0);

  // تحديث حالة الميزان (CSS)
  balanceImg.classList.remove("balanced", "swing-left", "swing-right");

  if (balancedOps) {
    balanceImg.classList.add("balanced");
    // لو يوجد تغيير فعلي (deltaA أو deltaB ≠ 0) نسجّل خطوة حل جبري
    if (deltaAL !== 0 || deltaBL !== 0) {
      addStepFromBase(deltaAL, deltaBL);
    }
    pendingHintEl.textContent =
      "الميزان متوازن: العمليات التي أجريتها على الطرفين متساوية (المعادلة ما زالت مكافئة للأصل).";

    // فحص هل وصلنا لصيغة X = عدد
    checkSolvedEquation();
  } else {
    // مائل: العمليات غير متساوية على الطرفين
    // نحدد اتجاه الميل تقريبياً بناءً على مقدار الزيادة/النقصان الكلي
    const score = dA * 2 + dB; // نفترض X تقريباً أكبر من 1

    if (score > 0) {
      balanceImg.classList.add("swing-left");
    } else if (score < 0) {
      balanceImg.classList.add("swing-right");
    } else {
      // حالة نادرة: لو score = 0 لكن ما زالت غير متوازنة، نميل مثلاً لليسار
      balanceImg.classList.add("swing-left");
    }

    pendingHintEl.textContent =
      "الميزان غير متوازن: تحتاج لتطبيق نفس العملية (أو عمليات مكافئة) على الطرف الآخر حتى تعود المعادلة متساوية.";
  }
}

// إضافة خطوة جديدة في جدول الحل من base → (aL, bL, aR, bR)
function addStepFromBase(deltaA, deltaB) {
  const equationText = formatEquation(aL, bL, aR, bR);
  const reasonText   = describeDelta(deltaA, deltaB);

  steps.push({
    equation: equationText,
    reason: reasonText
  });

  renderStepsTable();

  // تحديث حالة base إلى المعادلة الحالية (هذه أصبحت آخر معادلة متوازنة معتمدة)
  baseAL = aL;
  baseBL = bL;
  baseAR = aR;
  baseBR = bR;
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

// =============================
// فحص حالة الحل النهائي X = عدد
// =============================

function checkSolvedEquation() {
  if (isSolved) return;

  const isolatedOnLeft  = (aL === 1 && aR === 0); // X + cL = cR
  const isolatedOnRight = (aR === 1 && aL === 0); // cL = X + cR

  if (!isolatedOnLeft && !isolatedOnRight) {
    return;
  }

  let xVal;

  if (isolatedOnLeft) {
    // X + bL = bR  ⇒  X = bR - bL
    xVal = bR - bL;
  } else {
    // bL = X + bR  ⇒  X = bL - bR
    xVal = bL - bR;
  }

  solutionX = xVal;
  handleSolved();
}

function handleSolved() {
  if (isSolved) return;
  isSolved = true;

  statusMessageEl.classList.add("success");
  statusMessageEl.textContent =
    `أحسنت! وصلت إلى معادلة من شكل X = عدد، وقيمة المتغير هنا هي X = ${solutionX}.`;

  pendingHintEl.textContent =
    "لاحظ الآن كيف نتحقق من صحة الحل بالتعويض في المسألة الأصلية.";

  if (successSound) {
    successSound.currentTime = 0;
    successSound.play().catch(() => {});
  }

  showVerificationStep();
}

// خطوة التحقق بالتعويض في المسألة الأصلية
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
// العمليات على الطرفين
// =============================

// تعديل المعاملات aL, bL, aR, bR حسب الطرف والعملية
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
  // حتى بعد الحل، نسمح للطالب بالتلاعب لرؤية تأثير العمليات
  applyOperationToSide(side, opType);
  updateScaleAndEquation();
}

// =============================
// تهيئة مسألة جديدة
// =============================

function loadNewEquation() {
  // اختيار مسألة عشوائية
  const idx = Math.floor(Math.random() * equations.length);
  currentEquation = equations[idx];

  // تعيين المعاملات الأصلية والحالية
  aL = currentEquation.aL;
  bL = currentEquation.bL;
  aR = currentEquation.aR;
  bR = currentEquation.bR;

  // في البداية، الحالة المتوازنة الأساسية = المسألة الأصلية
  baseAL = aL;
  baseBL = bL;
  baseAR = aR;
  baseBR = bR;

  // إعادة ضبط الحالة العامة
  isSolved  = false;
  solutionX = null;

  statusMessageEl.classList.remove("success");
  statusMessageEl.textContent =
    "حاول بعزل المتغير X في طرف واحد باستخدام عمليات متساوية على الطرفين، حتى تحصل في النهاية على معادلة من شكل X = عدد.";

  pendingHintEl.textContent =
    "ابدأ بتجربة طرح أو إضافة X أو 1 على طرف واحد، ولاحظ ميل الميزان، ثم طبّق عملية مكافئة على الطرف الآخر لإعادته متوازنًا.";

  // تهيئة جدول الخطوات مع المسألة الأصلية
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

  // تحديث العرض والميزان
  updateScaleAndEquation();
}

// =============================
// ربط الأحداث
// =============================

controlButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const side   = btn.dataset.side; // "L" أو "R"
    const opType = btn.dataset.op;   // PLUS1 / MINUS1 / PLUSX / MINUSX
    handleControlClick(side, opType);
  });
});

newEquationBtn.addEventListener("click", loadNewEquation);

// تشغيل اللعبة أول مرة
loadNewEquation();
