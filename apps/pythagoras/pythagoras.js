// درس محوسب: نظرية فيثاغورس

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupVisualStage();
  setupStepSolver();
  setupRealProblems();
  setupChallengeGame();
});

/* =========================
   1) التبويبات Tabs
   ========================= */
function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.getAttribute("data-tab");

      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      const panel = document.getElementById(targetId);
      if (panel) panel.classList.add("active");
    });
  });
}

/* =========================
   2) مرحلة الاكتشاف + ربط المساحة
   ========================= */
function setupVisualStage() {
  const aSlider = document.getElementById("aSlider");
  const bSlider = document.getElementById("bSlider");

  if (!aSlider || !bSlider) return;

  const aValueSpan = document.getElementById("aValue");
  const bValueSpan = document.getElementById("bValue");
  const cValueSpan = document.getElementById("cValue");
  const sumSquaresSpan = document.getElementById("sumSquares");
  const cSquareSpan = document.getElementById("cSquare");
  const statusP = document.getElementById("pythagorasStatus");

  // جدول مصغّر
  const tA = document.getElementById("tA");
  const tB = document.getElementById("tB");
  const tC = document.getElementById("tC");
  const tASq = document.getElementById("tASq");
  const tBSq = document.getElementById("tBSq");
  const tSumSq = document.getElementById("tSumSq");
  const tCSq = document.getElementById("tCSq");

  // SVG المثلث
  const triShape = document.getElementById("triShape");
  const rightAngleMarker = document.getElementById("rightAngleMarker");
  const labelA = document.getElementById("labelA");
  const labelB = document.getElementById("labelB");
  const labelC = document.getElementById("labelC");

  // مربعات المساحة في تبويب المساحة
  const areaAValue = document.getElementById("areaAValue");
  const areaBValue = document.getElementById("areaBValue");
  const areaCValue = document.getElementById("areaCValue");
  const areaASq = document.getElementById("areaASq");
  const areaBSq = document.getElementById("areaBSq");
  const areaCSq = document.getElementById("areaCSq");
  const areaSumAB = document.getElementById("areaSumAB");
  const areaOnlyC = document.getElementById("areaOnlyC");

  const squareVisualA = document.querySelector("#squareA .square-visual");
  const squareVisualB = document.querySelector("#squareB .square-visual");
  const squareVisualC = document.querySelector("#squareC .square-visual");

  const gridToggle = document.getElementById("gridToggle");
  const areaAnswersToggle = document.getElementById("areaAnswersToggle");
  let showAreaAnswers = false; // إخفاء قيم المساحات افتراضيًا

  const CELL_SIZE = 8; // حجم المربع الصغير (لعد الوحدات بسهولة)

  function updateAll() {
    const a = parseFloat(aSlider.value);
    const b = parseFloat(bSlider.value);

    const c = Math.sqrt(a * a + b * b);
    const a2 = a * a;
    const b2 = b * b;
    const c2 = c * c;
    const sum = a2 + b2;

    // قيم a, b, c في مرحلة الاكتشاف
    aValueSpan.textContent = a.toString();
    bValueSpan.textContent = b.toString();
    cValueSpan.textContent = roundTo(c, 3).toString();

    sumSquaresSpan.textContent = roundTo(sum, 3).toString();
    cSquareSpan.textContent = roundTo(c2, 3).toString();

    // حالة تحقق نظرية فيثاغورس
    if (Math.abs(sum - c2) < 1e-6) {
      statusP.textContent =
        "✅ مجموع مربعي الضلعين القائمين يساوي مربّع الوتر (ينطبق عليه نظرية فيثاغورس)";
      statusP.classList.remove("status-not-ok");
      statusP.classList.add("status-ok");
    } else {
      statusP.textContent =
        "⚠ قد لا يكون هذا مثلثًا قائمًا مثاليًا بالأعداد الصحيحة، لكن العلاقة تقريبية.";
      statusP.classList.remove("status-ok");
      statusP.classList.add("status-not-ok");
    }

    // تحديث الجدول المصغّر
    tA.textContent = a.toString();
    tB.textContent = b.toString();
    tC.textContent = roundTo(c, 3).toString();
    tASq.textContent = roundTo(a2, 3).toString();
    tBSq.textContent = roundTo(b2, 3).toString();
    tSumSq.textContent = roundTo(sum, 3).toString();
    tCSq.textContent = roundTo(c2, 3).toString();

    // تحديث رسم المثلث
    updateTriangleDrawing(triShape, rightAngleMarker, labelA, labelB, labelC, a, b);

    // تحديث مربعات المساحة (مرحلة 2)
    if (
      areaAValue &&
      areaBValue &&
      areaCValue &&
      areaASq &&
      areaBSq &&
      areaCSq &&
      areaSumAB &&
      areaOnlyC
    ) {
      // أطوال الأضلاع تظهر دائمًا
      areaAValue.textContent = a.toString();
      areaBValue.textContent = b.toString();
      areaCValue.textContent = roundTo(c, 3).toString();

      // قيم المساحات: إمّا أرقام أو "؟" حسب زر المعلم
      if (showAreaAnswers) {
        areaASq.textContent = roundTo(a2, 3).toString();
        areaBSq.textContent = roundTo(b2, 3).toString();
        areaCSq.textContent = roundTo(c2, 3).toString();
        areaSumAB.textContent = roundTo(sum, 3).toString();
        areaOnlyC.textContent = roundTo(c2, 3).toString();
      } else {
        areaASq.textContent = "؟";
        areaBSq.textContent = "؟";
        areaCSq.textContent = "؟";
        areaSumAB.textContent = "؟";
        areaOnlyC.textContent = "؟";
      }

      // جعل الشبكة تعبّر عن طول الضلع (عدد الخلايا في كل اتجاه ≈ طول الضلع)
      const aCells = Math.max(1, Math.round(a));
      const bCells = Math.max(1, Math.round(b));
      const cCells = Math.max(1, Math.round(c)); // الوتر غالبًا غير صحيح، نقرّبه

      if (squareVisualA) {
        const sizeA = aCells * CELL_SIZE;
        squareVisualA.style.width = sizeA + "px";
        squareVisualA.style.height = sizeA + "px";
        squareVisualA.style.backgroundSize = `${CELL_SIZE}px ${CELL_SIZE}px`;
      }
      if (squareVisualB) {
        const sizeB = bCells * CELL_SIZE;
        squareVisualB.style.width = sizeB + "px";
        squareVisualB.style.height = sizeB + "px";
        squareVisualB.style.backgroundSize = `${CELL_SIZE}px ${CELL_SIZE}px`;
      }
      if (squareVisualC) {
        const sizeC = cCells * CELL_SIZE;
        squareVisualC.style.width = sizeC + "px";
        squareVisualC.style.height = sizeC + "px";
        squareVisualC.style.backgroundSize = `${CELL_SIZE}px ${CELL_SIZE}px`;
      }
    }
  }

  aSlider.addEventListener("input", updateAll);
  bSlider.addEventListener("input", updateAll);

  // شبكة الوحدات داخل المربعات
  if (gridToggle) {
    const applyGrid = () => {
      const visuals = document.querySelectorAll(".square-visual");
      visuals.forEach((v) => {
        if (gridToggle.checked) {
          v.classList.add("show-grid");
        } else {
          v.classList.remove("show-grid");
        }
      });
    };

    gridToggle.addEventListener("change", applyGrid);
    applyGrid(); // تطبيق الحالة الابتدائية
  }

  // زر إظهار/إخفاء قيم المساحات (للمعلم)
  if (areaAnswersToggle) {
    areaAnswersToggle.addEventListener("change", () => {
      showAreaAnswers = areaAnswersToggle.checked;
      updateAll();
    });
  }

  // أول تحديث
  updateAll();
}

function updateTriangleDrawing(
  triShape,
  rightAngleMarker,
  labelA,
  labelB,
  labelC,
  a,
  b
) {
  if (!triShape || !rightAngleMarker) return;

  const maxLeg = Math.max(a, b);
  const scale = maxLeg > 0 ? 120 / maxLeg : 1;

  const offsetX = 30;
  const offsetY = 150;

  const x1 = offsetX;
  const y1 = offsetY;
  const x2 = offsetX + a * scale;
  const y2 = offsetY;
  const x3 = offsetX;
  const y3 = offsetY - b * scale;

  const points = `${x1},${y1} ${x2},${y2} ${x3},${y3}`;
  triShape.setAttribute("points", points);

  // علامة الزاوية القائمة عند النقطة (x1, y1)
  const markerSize = 10;
  const p1 = `${x1 + markerSize},${y1}`;
  const p2 = `${x1 + markerSize},${y1 - markerSize}`;
  const p3 = `${x1},${y1 - markerSize}`;
  rightAngleMarker.setAttribute("points", `${p1} ${p2} ${p3}`);

  // تحريك التسميات تقريبياً
  if (labelA) {
    labelA.setAttribute("x", (x1 + x2) / 2);
    labelA.setAttribute("y", y1 + 12);
  }
  if (labelB) {
    labelB.setAttribute("x", x1 - 15);
    labelB.setAttribute("y", (y1 + y3) / 2);
  }
  if (labelC) {
    labelC.setAttribute("x", (x2 + x3) / 2);
    labelC.setAttribute("y", (y2 + y3) / 2);
  }
}

/* =========================
   3) حل المسائل خطوة بخطوة
   ========================= */
function setupStepSolver() {
  const modeRadios = document.querySelectorAll('input[name="solveMode"]');
  const solveA = document.getElementById("solveA");
  const solveB = document.getElementById("solveB");
  const solveC = document.getElementById("solveC");
  const solveBGroup = document.getElementById("solveBGroup");
  const solveCGroup = document.getElementById("solveCGroup");

  const startBtn = document.getElementById("startSteps");
  const resetBtn = document.getElementById("resetSteps");
  const errorP = document.getElementById("stepsError");

  const stepsList = document.getElementById("stepsList");
  const prevStepBtn = document.getElementById("prevStep");
  const nextStepBtn = document.getElementById("nextStep");
  const finalResultP = document.getElementById("finalResult");

  if (
    !solveA ||
    !solveB ||
    !solveC ||
    !startBtn ||
    !resetBtn ||
    !stepsList ||
    !prevStepBtn ||
    !nextStepBtn ||
    !errorP ||
    !finalResultP
  ) {
    return;
  }

  let currentMode = "hyp";
  let steps = [];
  let currentIndex = -1;

  // تبديل النمط (إيجاد الوتر / إيجاد ضلع قائم)
  modeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      currentMode = radio.value;
      updateSolveInputsForMode(currentMode, solveA, solveB, solveC, solveBGroup, solveCGroup);
      clearSteps();
    });
  });

  updateSolveInputsForMode(currentMode, solveA, solveB, solveC, solveBGroup, solveCGroup);

  startBtn.addEventListener("click", () => {
    clearSteps();
    errorP.textContent = "";
    finalResultP.textContent = "";

    const mode = currentMode;

    if (mode === "hyp") {
      const a = parseFloat(solveA.value);
      const b = parseFloat(solveB.value);
      if (!isPositiveNumber(a) || !isPositiveNumber(b)) {
        errorP.textContent = "الرجاء إدخال قيم موجبة لـ a و b.";
        return;
      }
      steps = buildStepsForHypotenuse(a, b);
    } else {
      const a = parseFloat(solveA.value);
      const c = parseFloat(solveC.value);
      if (!isPositiveNumber(a) || !isPositiveNumber(c)) {
        errorP.textContent = "الرجاء إدخال قيم موجبة للوتر c وللضلع القائم a.";
        return;
      }
      if (c <= a) {
        errorP.textContent = "يجب أن يكون الوتر c أكبر من الضلع القائم a.";
        return;
      }
      steps = buildStepsForLeg(a, c);
    }

    if (steps.length === 0) {
      errorP.textContent = "لا توجد خطوات للحل.";
      return;
    }

    // عرض أول خطوة
    stepsList.innerHTML = "";
    steps.forEach((step, index) => {
      const li = document.createElement("li");
      li.textContent = step.text;
      if (index > 0) {
        li.style.display = "none";
      }
      stepsList.appendChild(li);
    });
    currentIndex = 0;

    prevStepBtn.disabled = true;
    nextStepBtn.disabled = steps.length <= 1;

    if (steps[steps.length - 1].result != null) {
      finalResultP.textContent = "";
    }

    // حفظ الحل النهائي في الحقل المجهول
    const last = steps[steps.length - 1];
    if (last && last.result != null) {
      if (currentMode === "hyp") {
        solveC.value = roundTo(last.result, 3);
      } else {
        solveB.value = roundTo(last.result, 3);
      }
    }
  });

  resetBtn.addEventListener("click", () => {
    solveA.value = "";
    solveB.value = "";
    solveC.value = "";
    errorP.textContent = "";
    finalResultP.textContent = "";
    clearSteps();
  });

  nextStepBtn.addEventListener("click", () => {
    if (steps.length === 0) return;
    if (currentIndex < steps.length - 1) {
      setStepVisible(currentIndex, false, stepsList);
      currentIndex += 1;
      setStepVisible(currentIndex, true, stepsList);
    }
    prevStepBtn.disabled = currentIndex === 0;
    nextStepBtn.disabled = currentIndex === steps.length - 1;

    const last = steps[steps.length - 1];
    if (currentIndex === steps.length - 1 && last && last.result != null) {
      finalResultP.textContent = "النتيجة النهائية: " + last.label + " ≈ " + roundTo(last.result, 3);
    }
  });

  prevStepBtn.addEventListener("click", () => {
    if (steps.length === 0) return;
    if (currentIndex > 0) {
      setStepVisible(currentIndex, false, stepsList);
      currentIndex -= 1;
      setStepVisible(currentIndex, true, stepsList);
    }
    prevStepBtn.disabled = currentIndex === 0;
    nextStepBtn.disabled = currentIndex === steps.length - 1;

    if (currentIndex < steps.length - 1) {
      finalResultP.textContent = "";
    }
  });

  function clearSteps() {
    steps = [];
    currentIndex = -1;
    stepsList.innerHTML = "";
    prevStepBtn.disabled = true;
    nextStepBtn.disabled = true;
  }
}

function updateSolveInputsForMode(mode, solveA, solveB, solveC, solveBGroup, solveCGroup) {
  if (!solveA || !solveB || !solveC) return;
  if (mode === "hyp") {
    // إيجاد الوتر: نستخدم a و b، ونترك c للحل
    solveA.placeholder = "مثال: 3";
    solveB.placeholder = "مثال: 4";
    solveC.placeholder = "سيتم إيجاد الوتر c";

    solveB.disabled = false;
    solveC.disabled = true;

    if (solveBGroup) solveBGroup.style.opacity = "1";
    if (solveCGroup) solveCGroup.style.opacity = "0.6";
  } else {
    // إيجاد ضلع قائم: نستخدم a (ضلع قائم معروف) و c (الوتر)
    solveA.placeholder = "الضلع القائم المعروف a";
    solveB.placeholder = "سيتم إيجاد الضلع b";
    solveC.placeholder = "الوتر c";

    solveB.disabled = true;
    solveC.disabled = false;

    if (solveBGroup) solveBGroup.style.opacity = "0.6";
    if (solveCGroup) solveCGroup.style.opacity = "1";
  }
}

function buildStepsForHypotenuse(a, b) {
  const a2 = a * a;
  const b2 = b * b;
  const sum = a2 + b2;
  const c = Math.sqrt(sum);

  return [
    {
      text: `١) المعطيات: مثلث قائم الزاوية، a = ${a} ، b = ${b} ، والمطلوب إيجاد طول الوتر c.`,
    },
    {
      text: `٢) نكتب قانون فيثاغورس: a² + b² = c².`,
    },
    {
      text: `٣) نعوض: ${a}² + ${b}² = c².`,
    },
    {
      text: `٤) نحسب مربعي الضلعين: ${a}² = ${roundTo(a2, 3)} ، و ${b}² = ${roundTo(b2, 3)}.`,
    },
    {
      text: `٥) نجمع: a² + b² = ${roundTo(a2, 3)} + ${roundTo(b2, 3)} = ${roundTo(sum, 3)} = c².`,
    },
    {
      text: `٦) نأخذ الجذر التربيعي للطرفين: c = √${roundTo(sum, 3)} ≈ ${roundTo(c, 3)}.`,
      result: c,
      label: "طول الوتر c",
    },
  ];
}

function buildStepsForLeg(a, c) {
  const c2 = c * c;
  const a2 = a * a;
  const diff = c2 - a2;
  const b = Math.sqrt(diff);

  return [
    {
      text: `١) المعطيات: مثلث قائم الزاوية، الضلع القائم المعروف a = ${a} ، والوتر c = ${c} ، والمطلوب إيجاد الضلع القائم الآخر b.`,
    },
    {
      text: `٢) نكتب قانون فيثاغورس: a² + b² = c².`,
    },
    {
      text: `٣) نعوض: ${a}² + b² = ${c}².`,
    },
    {
      text: `٤) نحسب مربعي الأضلاع المعروفة: ${a}² = ${roundTo(a2, 3)} ، و ${c}² = ${roundTo(c2, 3)}.`,
    },
    {
      text: `٥) ننقل a² إلى الطرف الآخر: b² = c² - a² = ${roundTo(c2, 3)} - ${roundTo(a2, 3)} = ${roundTo(diff, 3)}.`,
    },
    {
      text: `٦) نأخذ الجذر التربيعي للطرفين: b = √${roundTo(diff, 3)} ≈ ${roundTo(b, 3)}.`,
      result: b,
      label: "طول الضلع القائم b",
    },
  ];
}

function setStepVisible(index, visible, listElement) {
  const items = listElement.querySelectorAll("li");
  if (index < 0 || index >= items.length) return;
  items[index].style.display = visible ? "list-item" : "none";
}

/* =========================
   4) المسائل الحياتية
   ========================= */
function setupRealProblems() {
  const buttons = document.querySelectorAll(".real-problem-btn");
  const sceneWrapper = document.getElementById("realSceneWrapper");
  const titleEl = document.getElementById("realTitle");
  const descEl = document.getElementById("realDescription");
  const answerInput = document.getElementById("realAnswerInput");
  const checkBtn = document.getElementById("realCheckBtn");
  const showSolutionBtn = document.getElementById("realShowSolution");
  const feedbackEl = document.getElementById("realFeedback");

  if (
    !buttons.length ||
    !sceneWrapper ||
    !titleEl ||
    !descEl ||
    !answerInput ||
    !checkBtn ||
    !feedbackEl ||
    !showSolutionBtn
  ) {
    return;
  }

  const problems = {
    ladder: {
      id: "ladder",
      sceneId: "scene-ladder",
      title: "مسألة 1: السلم والجدار",
      description:
        "يستند سلم طوله 10 أمتار إلى جدار عمودي، وكانت قاعدة السلم تبعد عن الجدار 6 أمتار. احسب ارتفاع أعلى السلم عن الأرض.",
      expected: 8,
      tolerance: 0.1,
      solution:
        "نعتبر a = 6 ، c = 10. نطبّق فيثاغورس: a² + b² = c² → 6² + h² = 10² → 36 + h² = 100 → h² = 64 → h = 8 أمتار.",
    },
    yard: {
      id: "yard",
      sceneId: "scene-yard",
      title: "مسألة 2: ساحة المدرسة",
      description:
        "ساحة المدرسة مستطيلة، طولها 30 مترًا وعرضها 40 مترًا. ما طول المسافة المستقيمة بين زاويتين متقابلتين (قطر الساحة)؟",
      expected: 50,
      tolerance: 0.1,
      solution:
        "نعتبر a = 30 ، b = 40. نطبّق فيثاغورس: d² = 30² + 40² = 900 + 1600 = 2500 → d = √2500 = 50 مترًا.",
    },
    tv: {
      id: "tv",
      sceneId: "scene-tv",
      title: "مسألة 3: شاشة التلفاز",
      description:
        "شاشة تلفاز مستطيلة، طولها 48 سم وعرضها 36 سم. ما طول القطر بين زاويتين متقابلتين في الشاشة؟",
      expected: 60,
      tolerance: 0.1,
      solution:
        "نعتبر a = 48 ، b = 36. نطبّق فيثاغورس: c² = 48² + 36² = 2304 + 1296 = 3600 → c = √3600 = 60 سم.",
    },
    rope: {
      id: "rope",
      sceneId: "scene-rope",
      title: "مسألة 4: عمود الإنارة والحبل",
      description:
        "عمود إنارة ارتفاعه 7 أمتار، رُبط حبل من أعلى العمود إلى نقطة على الأرض تبعد 5 أمتار عن قاعدة العمود. احسب طول الحبل تقريبًا.",
      expected: Math.sqrt(74),
      tolerance: 0.2,
      solution:
        "نعتبر a = 7 ، b = 5. نطبّق فيثاغورس: L² = 7² + 5² = 49 + 25 = 74 → L = √74 ≈ 8.6 أمتار.",
    },
  };

  let currentProblem = null;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-problem");
      if (!id || !problems[id]) return;

      // تفعيل الزر الحالي
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      currentProblem = problems[id];

      // عرض الرسم المناسب
      const scenes = sceneWrapper.querySelectorAll(".real-scene");
      scenes.forEach((s) => s.classList.remove("active"));
      const scene = document.getElementById(currentProblem.sceneId);
      if (scene) scene.classList.add("active");

      // النص
      titleEl.textContent = currentProblem.title;
      descEl.textContent = currentProblem.description;

      answerInput.value = "";
      feedbackEl.textContent = "";
    });
  });

  checkBtn.addEventListener("click", () => {
    if (!currentProblem) {
      feedbackEl.textContent = "الرجاء اختيار مسألة أولًا.";
      feedbackEl.style.color = "#b91c1c";
      return;
    }
    const value = parseFloat(answerInput.value);
    if (!isPositiveNumber(value)) {
      feedbackEl.textContent = "الرجاء إدخال قيمة عددية صحيحة للإجابة.";
      feedbackEl.style.color = "#b91c1c";
      return;
    }

    const diff = Math.abs(value - currentProblem.expected);
    if (diff <= currentProblem.tolerance) {
      feedbackEl.textContent = "أحسنت! إجابتك قريبة جدًا من الإجابة الصحيحة.";
      feedbackEl.style.color = "#15803d";
    } else {
      feedbackEl.textContent =
        "الإجابة غير دقيقة. حاول مرة أخرى، أو اضغط على (عرض الحل باختصار).";
      feedbackEl.style.color = "#b91c1c";
    }
  });

  showSolutionBtn.addEventListener("click", () => {
    if (!currentProblem) {
      feedbackEl.textContent = "الرجاء اختيار مسألة أولًا.";
      feedbackEl.style.color = "#b91c1c";
      return;
    }
    feedbackEl.textContent = currentProblem.solution;
    feedbackEl.style.color = "#1f2937";
  });
}

/* =========================
   5) لعبة التحدِّي
   ========================= */
function setupChallengeGame() {
  const chQuestion = document.getElementById("chQuestion");
  const chAnswer = document.getElementById("chAnswer");
  const chSubmit = document.getElementById("chSubmit");
  const chNext = document.getElementById("chNext");
  const chFeedback = document.getElementById("chFeedback");
  const chTotalSpan = document.getElementById("chTotal");
  const chCorrectSpan = document.getElementById("chCorrect");

  if (
    !chQuestion ||
    !chAnswer ||
    !chSubmit ||
    !chNext ||
    !chFeedback ||
    !chTotalSpan ||
    !chCorrectSpan
  ) {
    return;
  }

  const triples = [
    { a: 3, b: 4, c: 5 },
    { a: 6, b: 8, c: 10 },
    { a: 5, b: 12, c: 13 },
    { a: 8, b: 15, c: 17 },
    { a: 7, b: 24, c: 25 },
  ];

  let total = 0;
  let correct = 0;
  let currentQ = null; // { text, answer, tolerance }

  function newQuestion() {
    chFeedback.textContent = "";
    chAnswer.value = "";

    const triple = triples[Math.floor(Math.random() * triples.length)];
    const mode = Math.random() < 0.5 ? "hyp" : "leg";
    let text = "";
    let answer = 0;

    if (mode === "hyp") {
      text = `في مثلث قائم الزاوية، طول الضلعين القائمين: a = ${triple.a} ، b = ${triple.b}. احسب طول الوتر c.`;
      answer = triple.c;
    } else {
      // نختار أن يكون الضلع المعلوم هو a
      text = `في مثلث قائم الزاوية، طول الضلع القائم a = ${triple.a} ، وطول الوتر c = ${triple.c}. احسب طول الضلع القائم الآخر b.`;
      answer = triple.b;
    }

    chQuestion.textContent = text;
    currentQ = {
      answer,
      tolerance: 0.1,
    };
  }

  chNext.addEventListener("click", () => {
    newQuestion();
  });

  chSubmit.addEventListener("click", () => {
    if (!currentQ) {
      chFeedback.textContent = "الرجاء الضغط على (سؤال جديد) أولًا.";
      chFeedback.style.color = "#b91c1c";
      return;
    }
    const value = parseFloat(chAnswer.value);
    if (!isPositiveNumber(value)) {
      chFeedback.textContent = "الرجاء إدخال قيمة عددية للإجابة.";
      chFeedback.style.color = "#b91c1c";
      return;
    }

    total += 1;
    const diff = Math.abs(value - currentQ.answer);
    if (diff <= currentQ.tolerance) {
      correct += 1;
      chFeedback.textContent = "ممتاز! إجابة صحيحة 👏";
      chFeedback.style.color = "#15803d";
    } else {
      chFeedback.textContent =
        "محاولة جيدة، لكن الإجابة غير صحيحة. الإجابة الصحيحة هي تقريبًا: " +
        currentQ.answer;
      chFeedback.style.color = "#b91c1c";
    }

    chTotalSpan.textContent = total.toString();
    chCorrectSpan.textContent = correct.toString();
  });
}

/* =========================
   دوال مساعدة عامة
   ========================= */

function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals || 0);
  return Math.round(num * factor) / factor;
}

function isPositiveNumber(x) {
  return typeof x === "number" && !isNaN(x) && x > 0;
}
