let gameData = null;
let currentIndex = 0;
let score = 0;

const loadGame = async () => {
    try {
        const response = await fetch('questions.json');
        gameData = await response.json();
        initLevel();
    } catch (e) {
        // بيانات احتياطية لضمان التشغيل الفوري
        gameData = {"levels": [
            { "id": 1, "type": "trapezoid", "b1": 12, "b2": 8, "h": 5, "q": "شبه منحرف طول قاعدتيه 12 سم و 8 سم، وارتفاعه 5 سم. احسب مساحته.", "ans": 50 },
            { "id": 2, "type": "mirror", "b1": 25, "b2": 35, "h": 15, "q": "مرآة طول قاعدتيها 25 سم و 35 سم، وارتفاعها 15 سم. أوجد مساحتها.", "ans": 450 }
        ]};
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
    svg.setAttribute("width", "300"); svg.setAttribute("height", "200");
    svg.setAttribute("viewBox", "0 0 300 200");

    // رسم شبه منحرف بلون LightSalmon
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    // إحداثيات افتراضية تعبيرية
    const offset = 40;
    const topWidth = 100;
    const bottomWidth = 160;
    
    const p1 = `${150 - (topWidth/2)}, 50`;
    const p2 = `${150 + (topWidth/2)}, 50`;
    const p3 = `${150 + (bottomWidth/2)}, 150`;
    const p4 = `${150 - (bottomWidth/2)}, 150`;
    
    poly.setAttribute("points", `${p1} ${p2} ${p3} ${p4}`);
    poly.setAttribute("fill", "#ffa07a"); // LightSalmon
    poly.setAttribute("stroke", "#5b2a67");
    poly.setAttribute("stroke-width", "3");
    svg.appendChild(poly);

    // رسم الارتفاع كخط منقط
    const heightLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    heightLine.setAttribute("x1", 150 - (topWidth/2)); heightLine.setAttribute("y1", 50);
    heightLine.setAttribute("x2", 150 - (topWidth/2)); heightLine.setAttribute("y2", 150);
    heightLine.setAttribute("stroke", "#0f6f8a"); heightLine.setAttribute("stroke-width", "2");
    heightLine.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(heightLine);

    display.appendChild(svg);
}

document.getElementById('submit-btn').onclick = () => {
    const userVal = parseFloat(document.getElementById('answer-input').value);
    if (Math.abs(userVal - gameData.levels[currentIndex].ans) < 0.1) {
        score += 20;
        document.getElementById('score').innerText = score;
        document.getElementById('modal-text').innerText = "إجابة صحيحة! لقد أتقنت حساب مساحة شبه المنحرف.";
        document.getElementById('overlay').classList.remove('hidden');
    } else {
        const fb = document.getElementById('feedback');
        fb.innerText = "راجع القانون: نصف × (ق1 + ق2) × الارتفاع.";
        fb.style.color = "red";
    }
};

document.getElementById('next-level-btn').onclick = () => {
    currentIndex = (currentIndex + 1) % gameData.levels.length;
    initLevel();
};

window.onload = loadGame;
