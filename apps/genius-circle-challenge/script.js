let gameData = null;
let currentIndex = 0;
let score = 0;

const loadGame = async () => {
    try {
        const response = await fetch('questions.json');
        gameData = await response.json();
        initLevel();
    } catch (e) {
        // بيانات احتياطية مدمجة لضمان التشغيل المباشر
        gameData = {"levels": [
            { "id": 1, "type": "circumference", "r": 5, "pi": 3.14, "q": "احسب محيط دائرة طول نصف قطرها 5 سم (استخدم π ≈ 3.14).", "ans": 31.4 },
            { "id": 2, "type": "area", "r": 10, "pi": 3.14, "q": "احسب مساحة دائرة طول نصف قطرها 10 سم (استخدم π ≈ 3.14).", "ans": 314 }
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
    drawCircle(level);
}

function drawCircle(level) {
    const display = document.getElementById('shape-display');
    display.innerHTML = '';
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "250"); svg.setAttribute("height", "250");
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "125"); circle.setAttribute("cy", "125");
    circle.setAttribute("r", "80");
    
    // تمييز بصري بناءً على نوع السؤال
    if (level.type.includes("area")) {
        circle.setAttribute("fill", "#ffa07a"); // LightSalmon للمساحة
        circle.setAttribute("stroke", "#1f6d9b");
        circle.setAttribute("stroke-width", "2");
    } else {
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", "#ffa07a"); // LightSalmon للمحيط (الإطار)
        circle.setAttribute("stroke-width", "6");
    }
    
    svg.appendChild(circle);
    
    // رسم نصف القطر للتوضيح
    const radiusLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    radiusLine.setAttribute("x1", "125"); radiusLine.setAttribute("y1", "125");
    radiusLine.setAttribute("x2", "205"); radiusLine.setAttribute("y2", "125");
    radiusLine.setAttribute("stroke", "#1f6d9b"); radiusLine.setAttribute("stroke-width", "2");
    radiusLine.setAttribute("stroke-dasharray", "4");
    svg.appendChild(radiusLine);

    display.appendChild(svg);
}

document.getElementById('submit-btn').onclick = () => {
    const userVal = parseFloat(document.getElementById('answer-input').value);
    const correctVal = gameData.levels[currentIndex].ans;
    
    // السماح بنسبة خطأ بسيطة بسبب التقريب
    if (Math.abs(userVal - correctVal) < 0.1) {
        score += 20;
        document.getElementById('score').innerText = score;
        document.getElementById('modal-text').innerText = currentIndex % 2 === 0 ? "أحسنت! أتقنت حساب المحيط." : "رائع! أتقنت حساب المساحة.";
        document.getElementById('overlay').classList.remove('hidden');
    } else {
        const fb = document.getElementById('feedback');
        fb.innerText = "راجع القانون والعمليات الحسابية.";
        fb.style.color = "red";
    }
};

document.getElementById('next-level-btn').onclick = () => {
    currentIndex = (currentIndex + 1) % gameData.levels.length;
    initLevel();
};

window.onload = loadGame;
