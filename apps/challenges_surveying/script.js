let gameData = null;
let currentLevelIndex = 0;
let score = 0;

// تحميل البيانات مع معالجة خطأ التحميل المحلي (CORS)
const loadGame = async () => {
    try {
        const response = await fetch('options.json');
        const data = await response.json();
        gameData = data;
        initLevel();
    } catch (e) {
        console.error("خطأ في تحميل ملف JSON، تأكد من تشغيله عبر سيرفر محلي.");
        // بيانات احتياطية لضمان عمل اللعبة فوراً
        gameData = {"levels": [
            { "id": 1, "type": "rectangle", "params": { "w": 200, "h": 100, "valW": 20, "valH": 10 }, "question": "مستطيل طوله 20 سم وعرضه 10 سم. أوجد مساحته.", "answer": 200 },
            { "id": 2, "type": "triangle-in-rect", "params": { "w": 200, "h": 100, "valW": 20, "valH": 10 }, "question": "مثلث يشترك مع المستطيل السابق في القاعدة والارتفاع. ما مساحته؟", "answer": 100 },
            { "id": 3, "type": "square", "params": { "s": 120, "valS": 6 }, "question": "مربع طول ضلعه 6 سم. أوجد مساحته.", "answer": 36 },
            { "id": 4, "type": "triangle", "params": { "b": 180, "h": 100, "valB": 12, "valH": 8 }, "question": "مثلث طول قاعدته 12 سم وارتفاعه 8 سم. احسب مساحته.", "answer": 48 }
        ]};
        initLevel();
    }
};

const drawShape = (level) => {
    const display = document.getElementById('shape-display');
    display.innerHTML = '';
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "300"); svg.setAttribute("height", "200");
    
    if (level.type === 'rectangle' || level.type === 'triangle-in-rect') {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "50"); rect.setAttribute("y", "50");
        rect.setAttribute("width", level.params.w); rect.setAttribute("height", level.params.h);
        rect.setAttribute("fill", "none"); rect.setAttribute("stroke", "#1f4e79"); rect.setAttribute("stroke-width", "3");
        svg.appendChild(rect);
        if (level.type === 'triangle-in-rect') {
            const tri = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            tri.setAttribute("points", `50,150 ${50+level.params.w},150 ${50+level.params.w/2},50`);
            tri.setAttribute("fill", "rgba(91,155,213,0.4)"); svg.appendChild(tri);
        }
    } else if (level.type === 'square') {
        const sq = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        sq.setAttribute("x", "90"); sq.setAttribute("y", "40");
        sq.setAttribute("width", level.params.s); sq.setAttribute("height", level.params.s);
        sq.setAttribute("fill", "#eef6ff"); sq.setAttribute("stroke", "#1f4e79"); sq.setAttribute("stroke-width", "3");
        svg.appendChild(sq);
    } else if (level.type === 'triangle') {
        const tri = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        tri.setAttribute("points", `60,150 ${60+level.params.b},150 ${60+level.params.b/2},50`);
        tri.setAttribute("fill", "rgba(112,173,71,0.5)"); tri.setAttribute("stroke", "#1f4e79"); tri.setAttribute("stroke-width", "3");
        svg.appendChild(tri);
    }
    display.appendChild(svg);
};

// بقية الدوال (initLevel, showModal, إلخ) تبقى كما هي من الملف السابق
