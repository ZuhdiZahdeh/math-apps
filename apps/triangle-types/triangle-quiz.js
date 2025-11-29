// ================== بيانات المثلثات ==================
// نقاط في نظام إحداثيات 0–100 مع نوع المثلث وبيانات العلامات

const TRIANGLES = [
  // ===== مثلثات قائمة الزاوية (Right) =====
  {
    id: 1,
    type: "right",
    // زاوية قائمة عند النقطة الأولى (p0)
    points: "10,85 10,20 80,85",
  },
  {
    id: 2,
    type: "right",
    // زاوية قائمة عند النقطة الأولى (p0)
    points: "20,90 20,30 80,90",
  },

  // ===== متساوي الساقين (غير متساوي الأضلاع) =====
  {
    id: 3,
    type: "isosceles",
    points: "50,15 20,85 80,85",
    // الأضلاع المتساوية: p0-p1 و p0-p2
    equalPairs: [
      [0, 1],
      [0, 2],
    ],
  },
  {
    id: 4,
    type: "isosceles",
    points: "50,20 25,80 75,80",
    equalPairs: [
      [0, 1],
      [0, 2],
    ],
  },

  // ===== مثلثات متساوية الأضلاع =====
  {
    id: 5,
    type: "equilateral",
    points: "50,10 15,85 85,85",
    // جميع الأضلاع متساوية
    equalPairs: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  },
  {
    id: 6,
    type: "equilateral",
    points: "50,15 18,80 82,80",
    equalPairs: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  },

  // ===== مثلثات منفرجة الزاوية (Obtuse) =====
  // مثلث 1: زاوية منفرجة واضحة عند النقطة المتوسطة
  {
    id: 7,
    type: "obtuse",
    points: "5,85 50,85 95,20",
  },
  // مثلث 2: زاوية منفرجة عند النقطة اليمنى
  {
    id: 8,
    type: "obtuse",
    points: "5,85 95,85 80,60",
  },
];

// ================== إعداد الأصوات ==================
// تأكد أن الملفات موجودة في:
// apps/triangle-types/audio/success/...  و  apps/triangle-types/audio/fail/...

const successSounds = [
  new Audio("audio/success/success_toolMatch_a.mp3"),
  new Audio("audio/success/success_toolMatch_b.mp3"),
  new Audio("audio/success/success_toolMatch_c.mp3"),
  new Audio("audio/success/success_toolMatch_d.mp3"),
  new Audio("audio/success/success_toolMatch_e.mp3"),
];

const failSounds = [
  new Audio("audio/fail/fail_toolMatch_a.mp3"),
  new Audio("audio/fail/fail_toolMatch_b.mp3"),
  new Audio("audio/fail/fail_toolMatch_c.mp3"),
];

function stopAllSounds() {
  [...successSounds, ...failSounds].forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

function playRandomSound(list) {
  if (!list || list.length === 0) return;
  stopAllSounds();
  const index = Math.floor(Math.random() * list.length);
  const audio = list[index];
  audio.currentTime = 0;
  audio.play().catch(() => {
    // في حال رفض المتصفح التشغيل التلقائي لا نفعل شيئًا
  });
}

// ================== متغيّرات اللعبة ==================

let currentTriangle = null;
let score = 0;
let questionsCount = 0;

const svg = document.getElementById("triangleCanvas");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const nextBtn = document.getElementById("nextBtn");
const optionButtons = Array.from(document.querySelectorAll(".option-btn"));

const SVG_NS = "http://www.w3.org/2000/svg";

// ================== دوال مساعدة للرسم ==================

function parsePoints(pointsStr) {
  return pointsStr
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    });
}

// رسم علامة مربع عند الزاوية القائمة
function drawRightAngleMarker(points) {
  // نبحث عن الرأس الأكثر تقاربًا مع 90° (dot ≈ 0)
  let bestIndex = 0;
  let bestAbsDot = Infinity;

  for (let i = 0; i < 3; i++) {
    const p = points[i];
    const p1 = points[(i + 1) % 3];
    const p2 = points[(i + 2) % 3];

    const v1 = { x: p1.x - p.x, y: p1.y - p.y };
    const v2 = { x: p2.x - p.x, y: p2.y - p.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const absDot = Math.abs(dot);

    if (absDot < bestAbsDot) {
      bestAbsDot = absDot;
      bestIndex = i;
    }
  }

  const v = points[bestIndex];
  const p1 = points[(bestIndex + 1) % 3];
  const p2 = points[(bestIndex + 2) % 3];

  function normalize(vec) {
    const len = Math.hypot(vec.x, vec.y) || 1;
    return { x: vec.x / len, y: vec.y / len };
  }

  const leg1 = normalize({ x: p1.x - v.x, y: p1.y - v.y });
  const leg2 = normalize({ x: p2.x - v.x, y: p2.y - v.y });

  const s = 6; // حجم المربع الصغير
  const A = { x: v.x + leg1.x * s, y: v.y + leg1.y * s };
  const B = {
    x: A.x + leg2.x * s,
    y: A.y + leg2.y * s,
  };
  const C = { x: v.x + leg2.x * s, y: v.y + leg2.y * s };

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute(
    "d",
    `M ${v.x} ${v.y} L ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`
  );
  path.setAttribute("class", "right-marker");
  svg.appendChild(path);
}

// رسم شرطات على الأضلاع المتساوية
function drawEqualTicks(points, equalPairs) {
  if (!equalPairs) return;

  equalPairs.forEach(([i, j]) => {
    const p1 = points[i];
    const p2 = points[j];
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    // متجه عمودي على الضلع
    const nx = -dy / len;
    const ny = dx / len;
    const t = 4; // طول الشرطة

    const x1 = mx - nx * t;
    const y1 = my - ny * t;
    const x2 = mx + nx * t;
    const y2 = my + ny * t;

    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", "equal-marker");
    svg.appendChild(line);
  });
}

// ================== دوال اللعبة ==================

function pickRandomTriangle() {
  let candidate;
  do {
    candidate =
      TRIANGLES[Math.floor(Math.random() * TRIANGLES.length)];
  } while (currentTriangle && candidate.id === currentTriangle.id);
  currentTriangle = candidate;
}

function renderTriangle() {
  if (!currentTriangle) return;
  svg.innerHTML = ""; // تنظيف

  const polygon = document.createElementNS(SVG_NS, "polygon");
  polygon.setAttribute("points", currentTriangle.points);
  polygon.setAttribute("class", "triangle-shape");
  svg.appendChild(polygon);

  const pts = parsePoints(currentTriangle.points);

  // علامة الزاوية القائمة
  if (currentTriangle.type === "right") {
    drawRightAngleMarker(pts);
  }

  // شرطات الأضلاع المتساوية
  if (
    currentTriangle.type === "isosceles" ||
    currentTriangle.type === "equilateral"
  ) {
    drawEqualTicks(pts, currentTriangle.equalPairs);
  }
}

function updateScore() {
  scoreEl.textContent = `النتيجة: ${score} من ${questionsCount}`;
}

function resetOptions() {
  optionButtons.forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("correct", "wrong");
  });
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
}

function showNewQuestion() {
  pickRandomTriangle();
  renderTriangle();
  resetOptions();
}

function handleOptionClick(event) {
  const chosenType = event.currentTarget.dataset.type;
  if (!currentTriangle) return;

  optionButtons.forEach((btn) => (btn.disabled = true));
  questionsCount++;

  const isCorrect = chosenType === currentTriangle.type;

  if (isCorrect) {
    score++;
    event.currentTarget.classList.add("correct");
    feedbackEl.textContent = "إجابة صحيحة ✅ أحسنت!";
    feedbackEl.classList.add("correct");
    playRandomSound(successSounds);
  } else {
    event.currentTarget.classList.add("wrong");
    feedbackEl.textContent =
      "إجابة غير صحيحة ❌ النوع الصحيح هو: " +
      readableType(currentTriangle.type);
    feedbackEl.classList.add("wrong");
    playRandomSound(failSounds);
  }

  updateScore();
}

function readableType(type) {
  switch (type) {
    case "right":
      return "مثلث قائم الزاوية";
    case "isosceles":
      return "مثلث متساوي الساقين";
    case "equilateral":
      return "مثلث متساوي الأضلاع";
    case "obtuse":
      return "مثلث منفرج الزاوية";
    default:
      return type;
  }
}

// ================== ربط الأحداث وبدء اللعبة ==================

optionButtons.forEach((btn) =>
  btn.addEventListener("click", handleOptionClick)
);

nextBtn.addEventListener("click", () => {
  showNewQuestion();
});

showNewQuestion();
updateScore();
