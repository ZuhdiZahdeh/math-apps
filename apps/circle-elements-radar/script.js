let gameData = null;
let currentIndex = 0;
let score = 0;

const loadGame = async () => {
    try {
        const response = await fetch('questions.json');
        gameData = await response.json();
        initLevel();
    } catch (e) {
        // بيانات احتياطية
        gameData = {"levels": [
            { "id": 1, "type": "identify", "element": "radius", "q": "ماذا نسمي القطعة الواصلة بين المركز ونقطة على الدائرة؟", "opts": ["القطر", "نصف القطر", "الوتر"], "ans": 1 },
            { "id": 2, "type": "calc_diameter", "radius": 6, "q": "نصف القطر 6 سم، كم القطر؟", "mode": "input", "ans": 12 }
        ]};
        initLevel();
    }
};

function initLevel() {
    const level = gameData.levels[currentIndex];
    document.getElementById('level-num').innerText = level.id;
    document.getElementById('question-text').innerText = level.q;
    document.getElementById('feedback').innerText = '';
    document.getElementById('overlay').classList.add('hidden');
    
    const optionsGrid = document.getElementById('options-grid');
    const inputGroup = document.getElementById('calc-input-group');
    
    if (level.mode === 'input') {
        optionsGrid.classList.add('hidden');
        inputGroup.classList.remove('hidden');
        document.getElementById('answer-input').value = '';
    } else {
        optionsGrid.classList.remove('hidden');
        inputGroup.classList.add('hidden');
        optionsGrid.innerHTML = '';
        level.opts.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => checkAnswer(i);
            optionsGrid.appendChild(btn);
        });
    }
    drawCircle(level);
}

function drawCircle(level) {
    const display = document.getElementById('shape-display');
    display.innerHTML = '';
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "250"); svg.setAttribute("height", "250");
    
    // الدائرة الأساسية
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "125"); circle.setAttribute("cy", "125");
    circle.setAttribute("r", "80"); circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "#ffa07a"); circle.setAttribute("stroke-width", "4");
    svg.appendChild(circle);

    // المركز
    const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    center.setAttribute("cx", "125"); center.setAttribute("cy", "125");
    center.setAttribute("r", "4"); center.setAttribute("fill", "#1769aa");
    svg.appendChild(center);

    // رسم العناصر بناءً على النوع
    if (level.element === 'radius' || level.type === 'calc_diameter') {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", "125"); line.setAttribute("y1", "125");
        line.setAttribute("x2", "205"); line.setAttribute("y2", "125");
        line.setAttribute("stroke", "#0b8f8f"); line.setAttribute("stroke-width", "3");
        svg.appendChild(line);
    } else if (level.element === 'chord') {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", "70"); line.setAttribute("y1", "70");
        line.setAttribute("x2", "70"); line.setAttribute("y2", "180");
        line.setAttribute("stroke", "#0b8f8f"); line.setAttribute("stroke-width", "3");
        svg.appendChild(line);
    }

    display.appendChild(svg);
}

function checkAnswer(selected) {
    if (selected === gameData.levels[currentIndex].ans) {
        success();
    } else {
        document.getElementById('feedback').innerText = "حاول مرة أخرى، تذكر تعريف هذا العنصر.";
        document.getElementById('feedback').style.color = "red";
    }
}

document.getElementById('submit-btn').onclick = () => {
    const val = parseFloat(document.getElementById('answer-input').value);
    if (val === gameData.levels[currentIndex].ans) {
        success();
    } else {
        document.getElementById('feedback').innerText = "خطأ في الحساب، تذكر أن القطر = 2 × نصف القطر.";
        document.getElementById('feedback').style.color = "red";
    }
};

function success() {
    score += 20;
    document.getElementById('score').innerText = score;
    document.getElementById('modal-text').innerText = "إجابة دقيقة! لقد ميزت هذا العنصر بنجاح.";
    document.getElementById('overlay').classList.remove('hidden');
}

document.getElementById('next-level-btn').onclick = () => {
    currentIndex = (currentIndex + 1) % gameData.levels.length;
    initLevel();
};

window.onload = loadGame;
