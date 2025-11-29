// بيانات المثلثات: نقاط في نظام إحداثيات 0–100 مع نوع المثلث
// حرصت أن تكون كلّها "واضحة" من حيث النوع (بدون التباس)
const TRIANGLES = [
  // Right triangles (قائمة الزاوية)
  {
    id: 1,
    type: "right",
    points: "10,85 10,20 80,85", // زاوية قائمة عند النقطة (10,85)
  },
  {
    id: 2,
    type: "right",
    points: "20,90 80,90 20,30",
  },

  // Isosceles (non-equilateral) – متساوي الساقين غير متساوي الأضلاع
  {
    id: 3,
    type: "isosceles",
    points: "50,15 20,85 80,85",
  },
  {
    id: 4,
    type: "isosceles",
    points: "50,20 25,80 75,80",
  },

  // Equilateral – متساوي الأضلاع
  {
    id: 5,
    type: "equilateral",
    points: "50,10 15,85 85,85",
  },
  {
    id: 6,
    type: "equilateral",
    points: "50,15 18,80 82,80",
  },

  // Obtuse – منفرج الزاوية
  {
    id: 7,
    type: "obtuse",
    points: "15,85 85,85 70,25",
  },
  {
    id: 8,
    type: "obtuse",
    points: "20,80 80,80 65,30",
  },
];

let currentTriangle = null;
let score = 0;
let questionsCount = 0;

const svg = document.getElementById("triangleCanvas");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const nextBtn = document.getElementById("nextBtn");
const optionButtons = Array.from(document.querySelectorAll(".option-btn"));

function pickRandomTriangle() {
  // لا نختار نفس المثلث مرتين متتاليتين إن أمكن
  let candidate;
  do {
    candidate = TRIANGLES[Math.floor(Math.random() * TRIANGLES.length)];
  } while (currentTriangle && candidate.id === currentTriangle.id);
  currentTriangle = candidate;
}

function renderTriangle() {
  if (!currentTriangle) return;
  svg.innerHTML = ""; // تنظيف
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", currentTriangle.points);
  polygon.setAttribute("class", "triangle-shape");
  svg.appendChild(polygon);
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

  // منع الضغط المكرر
  optionButtons.forEach((btn) => (btn.disabled = true));

  questionsCount++;

  const isCorrect = chosenType === currentTriangle.type;

  if (isCorrect) {
    score++;
    event.currentTarget.classList.add("correct");
    feedbackEl.textContent = "إجابة صحيحة ✅ أحسنت!";
    feedbackEl.classList.add("correct");
  } else {
    event.currentTarget.classList.add("wrong");
    feedbackEl.textContent =
      "إجابة غير صحيحة ❌ النوع الصحيح هو: " +
      readableType(currentTriangle.type);
    feedbackEl.classList.add("wrong");
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

// ربط الأحداث
optionButtons.forEach((btn) =>
  btn.addEventListener("click", handleOptionClick)
);

nextBtn.addEventListener("click", () => {
  showNewQuestion();
});

// تهيئة أول مثلث عند تحميل الصفحة
showNewQuestion();
updateScore();
