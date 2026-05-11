// البيانات مدمجة لضمان التشغيل المباشر وتجنب أخطاء CORS
const gameData = {
    "levels": [
        { "id": 1, "type": "rectangle", "w": 200, "h": 100, "valW": 20, "valH": 10, "q": "مستطيل طوله 20 سم وعرضه 10 سم. احسب مساحته.", "ans": 200 },
        { "id": 2, "type": "triangle-in-rect", "w": 200, "h": 100, "valW": 20, "valH": 10, "q": "مثلث يشترك مع المستطيل السابق في القاعدة والارتفاع. كم تكون مساحته؟", "ans": 100 },
        { "id": 3, "type": "square", "s": 140, "valS": 7, "q": "مربع طول ضلعه 7 سم. ما هي مساحته؟", "ans": 49 },
        { "id": 4, "type": "triangle", "b": 180, "h": 100, "valB": 12, "valH": 6, "q": "مثلث طول قاعدته 12 سم وارتفاعه 6 سم. احسب مساحته.", "ans": 36 }
    ]
};

let currentIndex = 0;
let score = 0;

function initLevel() {
    const level = gameData.levels[currentIndex];
    
    // إعادة تعيين واجهة المستخدم لكل مستوى
    document.getElementById('level-num').innerText = level.id;
    document.getElementById('question-text').innerText = level.q;
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').innerText = '';
    
    // إخفاء النافذة المنبثقة
    const overlay = document.getElementById('overlay');
    overlay.classList.add('hidden');
    
    drawShape(level);
}

function drawShape(level) {
    const display = document.getElementById('shape-display');
    display.innerHTML = '';
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "250");
    svg.setAttribute("height", "150");
    svg.setAttribute("viewBox", "0 0 250 150");

    if (level.type === 'rectangle' || level.type === 'triangle-in-rect') {
        // رسم المستطيل
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "25"); rect.setAttribute("y", "25");
        rect.setAttribute("width", level.w); rect.setAttribute("height", level.h);
        rect.setAttribute("fill", "none"); rect.setAttribute("stroke", "#1f4e79");
        rect.setAttribute("stroke-width", "3");
        svg.appendChild(rect);

        if (level.type === 'triangle-in-rect') {
            // رسم المثلث المشترك
            const tri = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            tri.setAttribute("points", `25,125 ${25 + level.w},125 ${25 + level.w / 2},25`);
            tri.setAttribute("fill", "rgba(91,155,213,0.5)");
            svg.appendChild(tri);
        }
    } else if (level.type === 'square') {
        // رسم المربع
        const sq = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        sq.setAttribute("x", "55"); sq.setAttribute("y", "5");
        sq.setAttribute("width", level.s); rect.setAttribute("height", level.s); // تصحيح لضمان ظهور المربع
        sq.setAttribute("fill", "#eef6ff"); sq.setAttribute("stroke", "#1f4e79");
        sq.setAttribute("stroke-width", "3");
        svg.appendChild(sq);
    } else if (level.type === 'triangle') {
        // رسم مثلث منفصل
        const tri = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        tri.setAttribute("points", `35,125 ${35 + level.b},125 ${35 + level.b / 2},25`);
        tri.setAttribute("fill", "rgba(112,173,71,0.5)");
        tri.setAttribute("stroke", "#1f4e79");
        tri.setAttribute("stroke-width", "3");
        svg.appendChild(tri);
    }

    display.appendChild(svg);
}

document.getElementById('submit-btn').addEventListener('click', () => {
    const userValue = parseFloat(document.getElementById('answer-input').value);
    const correctValue = gameData.levels[currentIndex].ans;
    const feedback = document.getElementById('feedback');

    if (userValue === correctValue) {
        score += 10;
        document.getElementById('score').innerText = score;
        showSuccessModal();
    } else {
        feedback.innerText = "الإجابة غير صحيحة. حاول مرة أخرى!";
        feedback.style.color = "#b00020";
    }
});

function showSuccessModal() {
    const overlay = document.getElementById('overlay');
    const modalText = document.getElementById('modal-text');
    
    if (currentIndex < gameData.levels.length - 1) {
        modalText.innerText = "إجابة صحيحة! لقد أتقنت هذه المهارة الهندسية.";
    } else {
        modalText.innerText = `أحسنت يا بطل! لقد أكملت جميع مستويات التحدي بنجاح بمجموع نقاط: ${score}`;
        document.getElementById('next-level-btn').innerText = "العب من جديد";
    }
    
    overlay.classList.remove('hidden');
}

document.getElementById('next-level-btn').addEventListener('click', () => {
    if (currentIndex < gameData.levels.length - 1) {
        currentIndex++;
        initLevel();
    } else {
        currentIndex = 0;
        score = 0;
        document.getElementById('score').innerText = score;
        document.getElementById('next-level-btn').innerText = "المستوى التالي";
        initLevel();
    }
});

// تشغيل اللعبة عند التحميل
window.onload = initLevel;
