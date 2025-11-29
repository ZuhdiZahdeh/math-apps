// ================== بيانات المثلثات ==================
// نقاط في نظام إحداثيات 0–100 مع نوع المثلث

const TRIANGLES = [
  // Right triangles (قائمة الزاوية)
  {
    id: 1,
    type: "right",
    points: "10,85 10,20 80,85", // زاوية قائمة عند (10,85)
  },
  {
    id: 2,
    type: "right",
    points: "20,90 80,90 20,30", // زاوية قائمة عند (20,90)
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

  // Equilateral – متساوي الأضلاع (مقارب بصريًا لمتساوي الأضلاع)
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

  // Obtuse – منفرج الزاوية (أكبر زاوية > 90°)
  // مثلث منفرج عريض
  {
    id: 7,
    type: "obtuse",
    points: "10,90 90,90 50,60",
  },
  // مثلث منفرج رفيع كما في المثال الذي أرسلته
  {
    id: 8,
    type: "obtuse",
    points: "5,85 60,85 95,40",
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
  // تشغيل الصوت بعد ضغطة المستخدم (مسموح في أغلب المتصفحات)
  audio.currentTime = 0;
  audio.play().catch(() => {
    // في حال منعت المتصفح التشغيل التلقائي لا نفعل شيئًا
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

// اختيار مثلث عشوائي
function pickRandomTriangle() {
  let candidate;
  do {
    candidate =
      TRIANGLES[Math.floor(Math.random() * TRIANGLES.length)];
  } while (currentTriangle && candidate.id === currentTriangle.id);
  currentTriangle = candidate;
}

// رسم المثلث الحالي داخل الـ SVG
function renderTriangle() {
  if (!currentTriangle) return;
  svg.innerHTML = "";
  const polygon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  polygon.setAttribute("points", currentTriangle.points);
  polygon.setAttribute("class", "triangle-shape");
  svg.appendChild(polygon);
}

// تحديث نتيجة اللاعب
function updateScore() {
  scoreEl.textContent = `النتيجة: ${score} من ${questionsCount}`;
}

// إعادة تفعيل الأزرار وتصفير التغذية الراجعة
function resetOptions() {
  optionButtons.forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("correct", "wrong");
  });
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
}

// إظهار سؤال جديد
function showNewQuestion() {
  pickRandomTriangle();
  renderTriangle();
  resetOptions();
}

// عند ضغط أحد أزرار الاختيارات
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

// تحويل الكود النصّي لنوع المثلث إلى عربي جميل
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
