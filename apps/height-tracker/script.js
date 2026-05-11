let currentLevel = 0;
let score = 0;
let gameData = null;

// تحميل البيانات (محاكاة تحميل JSON)
const levels = [
    {
        id: 1,
        type: "parallel",
        question: "المستقيم أ يوازي المستقيم ب. أي قطعة تمثل الارتفاع بينهما؟",
        options: ["القطعة المائلة (حمراء)", "البعد العمودي (خضراء)", "امتداد الخط"],
        correct: 1,
        hint: "تذكر: الارتفاع هو أقصر مسافة عمودية."
    },
    {
        id: 2,
        type: "triangle",
        question: "أين هو الارتفاع الصحيح لهذا المثلث؟",
        options: ["الخط النازل بزاوية قائمة", "الضلع المائل الأيمن", "الضلع المائل الأيسر"],
        correct: 0,
        hint: "الارتفاع دائماً يصنع زاوية قائمة مع القاعدة."
    }
];

function initGame() {
    loadLevel(currentLevel);
}

function loadLevel(index) {
    const level = levels[index];
    document.getElementById('question').innerText = level.question;
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    level.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(i, level.correct, level.hint);
        optionsContainer.appendChild(btn);
    });

    drawShape(level.type);
}

function drawShape(type) {
    const canvas = document.getElementById('canvas');
    let svgContent = `<svg viewBox="0 0 600 400">
        <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e0e0e0" stroke-width="1"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />`;

    if (type === "parallel") {
        svgContent += `
            <line x1="100" y1="100" x2="500" y2="100" stroke="#1f4e79" stroke-width="4" />
            <line x1="100" y1="260" x2="500" y2="260" stroke="#1f4e79" stroke-width="4" />
            <line x1="300" y1="100" x2="400" y2="260" stroke="red" stroke-width="3" stroke-dasharray="5,5" />
            <line x1="220" y1="100" x2="220" y2="260" stroke="green" stroke-width="4" />
            <rect x="220" y="240" width="20" height="20" fill="none" stroke="green" stroke-width="2" />
        `;
    } else if (type === "triangle") {
        svgContent += `
            <polygon points="100,300 500,300 350,100" fill="#eef6ff" stroke="#1f4e79" stroke-width="3" />
            <line x1="350" y1="100" x2="350" y2="300" stroke="green" stroke-width="4" stroke-dasharray="4" />
            <rect x="350" y="280" width="20" height="20" fill="none" stroke="green" stroke-width="2" />
        `;
    }

    svgContent += `</svg>`;
    canvas.innerHTML = svgContent;
}

function checkAnswer(selected, correct, hint) {
    const feedback = document.getElementById('feedback');
    if (selected === correct) {
        score += 20;
        document.getElementById('score').innerText = score;
        feedback.innerText = "أحسنت! إجابة صحيحة.";
        feedback.className = "feedback-area success";
        setTimeout(() => {
            currentLevel++;
            if(currentLevel < levels.length) loadLevel(currentLevel);
            else feedback.innerText = "مبروك! لقد أنهيت تحدي الارتفاعات.";
        }, 2000);
    } else {
        feedback.innerText = "خطأ. " + hint;
        feedback.className = "feedback-area error";
    }
}

initGame();
