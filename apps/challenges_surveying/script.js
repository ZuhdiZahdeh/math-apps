let gameData = null;
let currentLevelIndex = 0;
let score = 0;

// محاكاة تحميل ملف JSON
const loadGame = async () => {
    // في بيئة حقيقية نستخدم fetch('options.json')
    gameData = {
        "levels": [
            { "id": 1, "type": "rectangle", "params": { "w": 200, "h": 100, "valW": 20, "valH": 10 }, "question": "مستطيل طوله 20 سم وعرضه 10 سم. أوجد مساحته.", "answer": 200 },
            { "id": 2, "type": "triangle-in-rect", "params": { "w": 200, "h": 100, "valW": 20, "valH": 10 }, "question": "مثلث يشترك مع المستطيل السابق في القاعدة والارتفاع. كم مساحته؟", "answer": 100 },
            { "id": 3, "type": "square", "params": { "s": 150, "valS": 6 }, "question": "مربع طول ضلعه 6 سم. أوجد مساحته.", "answer": 36 },
            { "id": 4, "type": "triangle", "params": { "b": 180, "h": 100, "valB": 12, "valH": 8 }, "question": "مثلث قاعدته 12 سم وارتفاعه 8 سم. احسب مساحته باستخدام القانون.", "answer": 48 }
        ]
    };
    initLevel();
};

const initLevel = () => {
    const level = gameData.levels[currentLevelIndex];
    document.getElementById('level-num').innerText = level.id;
    document.getElementById('question-text').innerText = level.question;
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').innerText = '';
    drawShape(level);
};

const drawShape = (level) => {
    const display = document.getElementById('shape-display');
    display.innerHTML = '';
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "300");
    svg.setAttribute("height", "200");
    
    if (level.type === 'rectangle' || level.type === 'triangle-in-rect') {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "50"); rect.setAttribute("y", "50");
        rect.setAttribute("width", level.params.w); rect.setAttribute("height", level.params.h);
        rect.setAttribute("fill", "none"); rect.setAttribute("stroke", "#1f4e79");
        rect.setAttribute("stroke-width", "3");
        svg.appendChild(rect);
        
        if (level.type === 'triangle-in-rect') {
            const tri = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            tri.setAttribute("points", `50,150 ${50+level.params.w},150 ${50+level.params.w/2},50`);
            tri.setAttribute("fill", "rgba(91,155,213,0.4)");
            svg.appendChild(tri);
        }
    } else if (level.type === 'square') {
        const sq = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        sq.setAttribute("x", "75"); sq.setAttribute("y", "25");
        sq.setAttribute("width", level.params.s); sq.setAttribute("height", level.params.s);
        sq.setAttribute("fill", "#eef6ff"); sq.setAttribute("stroke", "#1f4e79");
        sq.setAttribute("stroke-width", "3");
        svg.appendChild(sq);
    }
    
    display.appendChild(svg);
};

document.getElementById('submit-btn').addEventListener('click', () => {
    const userAns = parseFloat(document.getElementById('answer-input').value);
    const correctAns = gameData.levels[currentLevelIndex].answer;
    const feedback = document.getElementById('feedback');

    if (userAns === correctAns) {
        score += 10;
        document.getElementById('score').innerText = score;
        showModal();
    } else {
        feedback.innerText = "حاول مرة أخرى! تذكر العلاقة الرياضية.";
        feedback.style.color = "red";
    }
});

const showModal = () => {
    const overlay = document.getElementById('overlay');
    const title = document.getElementById('modal-title');
    const text = document.getElementById('modal-text');
    
    overlay.classList.remove('hidden');
    if (currentLevelIndex < gameData.levels.length - 1) {
        title.innerText = "إجابة عبقرية! 🎉";
        text.innerText = "لقد أتقنت هذا المفهوم، هل أنت مستعد للتحدي القادم؟";
    } else {
        title.innerText = "بطل الهندسة! 🏆";
        text.innerText = `أنهيت كافة المستويات بنجاح. مجموع نقاطك: ${score}`;
        document.getElementById('next-level-btn').innerText = "إعادة اللعبة";
    }
};

document.getElementById('next-level-btn').addEventListener('click', () => {
    document.getElementById('overlay').classList.add('hidden');
    if (currentLevelIndex < gameData.levels.length - 1) {
        currentLevelIndex++;
        initLevel();
    } else {
        currentLevelIndex = 0;
        score = 0;
        document.getElementById('score').innerText = score;
        initLevel();
    }
});

loadGame();
