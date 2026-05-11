let gameData = null;
let currentIndex = 0;
let score = 0;

// تحميل البيانات من ملف questions.json
const loadGame = async () => {
    try {
        const response = await fetch('questions.json');
        gameData = await response.json();
        initLevel();
    } catch (e) {
        console.warn("جاري استخدام البيانات المدمجة لعدم توفر الوصول لملف questions.json محلياً.");
        gameData = {
            "levels": [
                { "id": 1, "type": "rectangle", "w": 200, "h": 100, "q": "مستطيل طوله 20 سم وعرضه 10 سم. احسب مساحته.", "ans": 200 },
                { "id": 2, "type": "triangle-in-rect", "w": 200, "h": 100, "q": "مثلث يشترك مع المستطيل السابق (الذي مساحته 200 سم²) في القاعدة والارتفاع. ما مساحته؟", "ans": 100 },
                { "id": 3, "type": "square", "s": 140, "q": "مربع طول ضلعه 7 سم. ما هي مساحته؟", "ans": 49 },
                { "id": 4, "type": "triangle", "b": 180, "h": 100, "q": "مثلث طول قاعدته 12 سم وارتفاعه 6 سم. احسب مساحته.", "ans": 36 },
                { "id": 5, "type": "triangle-in-rect", "w": 200, "h": 100, "q": "مثلث يشترك مع مستطيل (طوله 20 سم وعرضه 10 سم) في القاعدة والارتفاع. احسب مساحته.", "ans": 100 }
            ]
        };
        initLevel();
    }
};

function initLevel() {
    const level = gameData.levels[currentIndex];
    document.getElementById('level-num').innerText = level.id;
    document.getElementById('question-text').innerText = level.q;
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').innerText = '';
    document.getElementById('overlay').classList.add('hidden');
    drawShape(level);
}

function drawShape(level) {
    const display = document.getElementById('shape-display');
    display.innerHTML = '';
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "250"); svg.setAttribute("height", "150");

    // اللون المطلوب للمستطيل
    const rectColor = "#ffa07a"; // LightSalmon
    // اللون المطلوب للمثلث
    const triColor = "rgba(91,155,213,0.7)"; // أزرق سماوي

    if (level.type === 'rectangle' || level.type === 'triangle-in-rect') {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "25"); rect.setAttribute("y", "25");
        rect.setAttribute("width", level.w); rect.setAttribute("height", level.h);
        rect.setAttribute("fill", rectColor); 
        rect.setAttribute("stroke", "#1f4e79"); rect.setAttribute("stroke-width", "2");
        svg.appendChild(rect);

        if (level.type === 'triangle-in-rect') {
            const tri = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            tri.setAttribute("points", `25,125 ${25 + level.w},125 ${25 + level.w / 2},25`);
            tri.setAttribute("fill", triColor);
            svg.appendChild(tri);
        }
    } else if (level.type === 'square') {
        const sq = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        sq.setAttribute("x", "55"); sq.setAttribute("y", "5");
        sq.setAttribute("width", level.s); sq.setAttribute("height", level.s);
        sq.setAttribute("fill", rectColor);
        sq.setAttribute("stroke", "#1f4e79"); sq.setAttribute("stroke-width", "2");
        svg.appendChild(sq);
    } else if (level.type === 'triangle') {
        const tri = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        tri.setAttribute("points", `35,125 ${35 + level.b},125 ${35 + level.b / 2},25`);
        tri.setAttribute("fill", triColor);
        tri.setAttribute("stroke", "#1f4e79"); tri.setAttribute("stroke-width", "2");
        svg.appendChild(tri);
    }
    display.appendChild(svg);
}

document.getElementById('submit-btn').addEventListener('click', () => {
    const userVal = parseFloat(document.getElementById('answer-input').value);
    if (userVal === gameData.levels[currentIndex].ans) {
        score += 10;
        document.getElementById('score').innerText = score;
        document.getElementById('overlay').classList.remove('hidden');
    } else {
        const fb = document.getElementById('feedback');
        fb.innerText = "حاول مرة أخرى!"; fb.style.color = "red";
    }
});

document.getElementById('next-level-btn').addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % gameData.levels.length;
    initLevel();
});

loadGame();
