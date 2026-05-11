let gameData = null;
let currentIndex = 0;
let score = 0;

const loadGame = async () => {
    try {
        const response = await fetch('questions.json');
        gameData = await response.json();
        initLevel();
    } catch (e) {
        // بيانات احتياطية في حال تعذر تحميل الملف محلياً
        gameData = {"levels": [
            { "id": 1, "type": "parallelogram", "w": 180, "h": 100, "offset": 40, "q": "متوازي أضلاع طول قاعدته 9 وحدات وارتفاعه 5 وحدات. احسب مساحته.", "ans": 45 },
            { "id": 2, "type": "distraction", "w": 200, "h": 100, "offset": 50, "q": "انتبه! طول القاعدة 8 سم، الارتفاع 6 سم، والضلع المائل 10 سم. ما هي مساحته؟", "ans": 48 }
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
    
    // رسم متوازي الأضلاع باللون المطلوب
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const p1 = `${50 + level.offset},50`;
    const p2 = `${50 + level.offset + level.w},50`;
    const p3 = `${50 + level.w},150`;
    const p4 = `50,150`;
    
    poly.setAttribute("points", `${p1} ${p2} ${p3} ${p4}`);
    poly.setAttribute("fill", "#ffa07a"); // LightSalmon
    poly.setAttribute("stroke", "#5b2a67");
    poly.setAttribute("stroke-width", "3");
    svg.appendChild(poly);

    // رسم الارتفاع العمودي للتوضيح
    const heightLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    heightLine.setAttribute("x1", 50 + level.offset); heightLine.setAttribute("y1", 50);
    heightLine.setAttribute("x2", 50 + level.offset); heightLine.setAttribute("y2", 150);
    heightLine.setAttribute("stroke", "#0f6f8a"); heightLine.setAttribute("stroke-width", "2");
    heightLine.setAttribute("stroke-dasharray", "5,5");
    svg.appendChild(heightLine);

    display.appendChild(svg);
}

document.getElementById('submit-btn').onclick = () => {
    const userVal = parseFloat(document.getElementById('answer-input').value);
    if (userVal === gameData.levels[currentIndex].ans) {
        score += 20;
        document.getElementById('score').innerText = score;
        document.getElementById('modal-text').innerText = "إجابة دقيقة! لقد طبقت القانون بنجاح.";
        document.getElementById('overlay').classList.remove('hidden');
    } else {
        const fb = document.getElementById('feedback');
        fb.innerText = "راجع العلاقة: المساحة = القاعدة × الارتفاع العمودي.";
        fb.style.color = "red";
    }
};

document.getElementById('next-level-btn').onclick = () => {
    currentIndex = (currentIndex + 1) % gameData.levels.length;
    initLevel();
};

window.onload = loadGame;
