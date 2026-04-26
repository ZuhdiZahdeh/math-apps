// ==========================================
// 1. نظام التبويبات (Tab Logic)
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('.mode-container').forEach(container => container.classList.remove('active-mode'));
    const activeContainer = document.getElementById(tabId + '-mode');
    if (activeContainer) activeContainer.classList.add('active-mode');
}

// ==========================================
// 2. المستوى 1: التعرف المتعدد وإزاحة الرموز
// ==========================================
const idCanvas = document.getElementById('identifyCanvas');
const idCtx = idCanvas.getContext('2d');
const descBox = document.getElementById('descriptionBox');

const id_cx = 225, id_cy = 225, id_r = 150;
let currentElement = null;
let cycleIndex = 0;

// توزيع 6 نقاط على المحيط لتوفير 3 أقطار وعدد كبير من الأوتار والأقواس
const angles = { 
    C: 0,             // 0 درجة (يمين)
    A: Math.PI / 4,   // 45 درجة
    D: Math.PI / 2,   // 90 درجة (أسفل)
    B: Math.PI,       // 180 درجة (يسار) -> ب ج قطر
    F: 5 * Math.PI / 4, // 225 درجة -> أ و قطر
    E: 3 * Math.PI / 2  // 270 درجة (أعلى) -> د هـ قطر
};

const points = {
    M: { x: id_cx, y: id_cy, label: "م", angle: null },
    C: { x: id_cx + id_r * Math.cos(angles.C), y: id_cy + id_r * Math.sin(angles.C), label: "ج", angle: angles.C },
    A: { x: id_cx + id_r * Math.cos(angles.A), y: id_cy + id_r * Math.sin(angles.A), label: "أ", angle: angles.A },
    D: { x: id_cx + id_r * Math.cos(angles.D), y: id_cy + id_r * Math.sin(angles.D), label: "د", angle: angles.D },
    B: { x: id_cx + id_r * Math.cos(angles.B), y: id_cy + id_r * Math.sin(angles.B), label: "ب", angle: angles.B },
    F: { x: id_cx + id_r * Math.cos(angles.F), y: id_cy + id_r * Math.sin(angles.F), label: "و", angle: angles.F },
    E: { x: id_cx + id_r * Math.cos(angles.E), y: id_cy + id_r * Math.sin(angles.E), label: "هـ", angle: angles.E }
};

// المصفوفات الشاملة لكافة الاحتمالات
const elementsData = {
    center: [
        { type: 'point', p: 'M', text: "المركز (م): النقطة الثابتة في منتصف الدائرة." }
    ],
    radius: [
        { type: 'line', p1: 'M', p2: 'A', text: "نصف القطر (م أ): يصل بين المركز وأي نقطة على المحيط." },
        { type: 'line', p1: 'M', p2: 'B', text: "نصف القطر (م ب): جميع أنصاف الأقطار متساوية الطول." },
        { type: 'line', p1: 'M', p2: 'C', text: "نصف القطر (م ج): قطعة من المركز للنقطة ج." },
        { type: 'line', p1: 'M', p2: 'D', text: "نصف القطر (م د): يمكنك رسم عدد لا نهائي منها." },
        { type: 'line', p1: 'M', p2: 'E', text: "نصف القطر (م هـ): تذكر أن طوله ثابت في الدائرة الواحدة." },
        { type: 'line', p1: 'M', p2: 'F', text: "نصف القطر (م و): يمثل المسافة الثابتة للدائرة." }
    ],
    diameter: [
        { type: 'line', p1: 'B', p2: 'C', text: "القطر (ب ج): أطول وتر في الدائرة، ويمر بالمركز." },
        { type: 'line', p1: 'D', p2: 'E', text: "القطر (د هـ): يتكون من نصفي قطر على استقامة واحدة." },
        { type: 'line', p1: 'A', p2: 'F', text: "القطر (أ و): يمر بالمركز ويقسم الدائرة لنصفين متطابقين." }
    ],
    chord: [
        { type: 'line', p1: 'A', p2: 'D', text: "الوتر (أ د): قطعة مستقيمة تصل بين نقطتين ولا تمر بالمركز." },
        { type: 'line', p1: 'A', p2: 'B', text: "الوتر (أ ب): وتر آخر." },
        { type: 'line', p1: 'D', p2: 'B', text: "الوتر (د ب): هل تلاحظ أن الأوتار تختلف في أطوالها؟" },
        { type: 'line', p1: 'C', p2: 'E', text: "الوتر (ج هـ): كلما اقترب الوتر من المركز زاد طوله." },
        { type: 'line', p1: 'E', p2: 'F', text: "الوتر (هـ و): وتر قصير نسبياً." },
        { type: 'line', p1: 'F', p2: 'B', text: "الوتر (و ب): قطعة مستقيمة أخرى على الدائرة." }
    ],
    arc: [
        { type: 'arc', s: angles.C, e: angles.A, text: "القوس (ج أ): جزء من محيط الدائرة." },
        { type: 'arc', s: angles.A, e: angles.D, text: "القوس (أ د): ينحصر بين النقطتين أ و د." },
        { type: 'arc', s: angles.D, e: angles.B, text: "القوس (د ب): قوس آخر على المحيط." },
        { type: 'arc', s: angles.B, e: angles.F, text: "القوس (ب و): تتعدد الأقواس بتعدد النقاط." },
        { type: 'arc', s: angles.F, e: angles.E, text: "القوس (و هـ): جزء من المنحنى المغلق." },
        { type: 'arc', s: 0, e: Math.PI/2, text: "القوس (ج د): يمكن أن يكون القوس كبيراً أو صغيراً." }
    ],
    circumference: [
        { type: 'circle', text: "المحيط: هو الخط المنحني المغلق الذي يمثل طول إطار الدائرة." }
    ]
};

function highlight(name) {
    if (currentElement === name) cycleIndex++; else { currentElement = name; cycleIndex = 0; }
    cycleIndex %= elementsData[name].length;
    descBox.textContent = elementsData[name][cycleIndex].text;
    drawIdentify();
}

function drawIdentify() {
    idCtx.clearRect(0, 0, 450, 450);
    idCtx.beginPath(); idCtx.arc(id_cx, id_cy, id_r, 0, Math.PI * 2);
    idCtx.strokeStyle = currentElement === 'circumference' ? '#34495e' : '#ecf0f1';
    idCtx.lineWidth = currentElement === 'circumference' ? 6 : 2; idCtx.stroke();

    if (currentElement) {
        idCtx.lineWidth = 6; idCtx.strokeStyle = '#2980b9';
        const item = elementsData[currentElement][cycleIndex];
        if (item.type === 'point') {
            idCtx.fillStyle = '#e74c3c'; idCtx.beginPath(); idCtx.arc(points[item.p].x, points[item.p].y, 8, 0, 7); idCtx.fill();
        } else if (item.type === 'line') {
            idCtx.beginPath(); idCtx.moveTo(points[item.p1].x, points[item.p1].y); idCtx.lineTo(points[item.p2].x, points[item.p2].y); idCtx.stroke();
        } else if (item.type === 'arc') {
            idCtx.lineWidth = 8; idCtx.strokeStyle = '#9b59b6'; idCtx.beginPath(); idCtx.arc(id_cx, id_cy, id_r, item.s, item.e); idCtx.stroke();
        }
    }

    // رسم النقاط والحروف بإزاحة لتبقى خارج الدائرة
    idCtx.font = "bold 26px Arial"; idCtx.fillStyle = "#2c3e50";
    Object.values(points).forEach(p => {
        idCtx.beginPath(); idCtx.arc(p.x, p.y, 4, 0, 7); idCtx.fill();
        const offset = 30;
        let tx = p.label === 'م' ? p.x - 15 : p.x + Math.cos(p.angle) * offset;
        let ty = p.label === 'م' ? p.y - 15 : p.y + Math.sin(p.angle) * offset;
        
        idCtx.textAlign = p.label === 'م' ? "right" : (Math.cos(p.angle) >= 0 ? "left" : "right");
        idCtx.textBaseline = p.label === 'م' ? "bottom" : "middle";
        idCtx.fillText(p.label, tx, ty);
    });
}
drawIdentify();

// ==========================================
// 3. المستوى 2: التفاعل الحي (Explore)
// ==========================================
const exCanvas = document.getElementById('exploreCanvas');
const exCtx = exCanvas.getContext('2d');
const radiusSlider = document.getElementById('radiusSlider');
let angle1 = 0.5, angle2 = 2.5, activePoint = null, hasPlayedSuccess = false;

function drawExplore() {
    exCtx.clearRect(0, 0, 500, 450);
    const r = parseInt(radiusSlider.value);
    const cx = 250, cy = 225;
    
    // رسم الدائرة
    exCtx.beginPath(); exCtx.arc(cx, cy, r, 0, Math.PI * 2); exCtx.strokeStyle = '#dfe6e9'; exCtx.stroke();
    
    // إسترجاع المركز "م"
    exCtx.beginPath(); exCtx.arc(cx, cy, 5, 0, Math.PI * 2); exCtx.fillStyle = '#2c3e50'; exCtx.fill();
    exCtx.font = "bold 26px Arial"; exCtx.textAlign = "right"; exCtx.textBaseline = "bottom";
    exCtx.fillText("م", cx - 10, cy - 10);

    const p1 = { x: cx + r * Math.cos(angle1), y: cy + r * Math.sin(angle1) };
    const p2 = { x: cx + r * Math.cos(angle2), y: cy + r * Math.sin(angle2) };
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const isDiam = dist >= (r * 2) - 2;

    // رسم الوتر
    exCtx.beginPath(); exCtx.moveTo(p1.x, p1.y); exCtx.lineTo(p2.x, p2.y);
    exCtx.strokeStyle = isDiam ? '#27ae60' : '#2980b9'; exCtx.lineWidth = isDiam ? 6 : 3; exCtx.stroke();

    // إسترجاع الرموز "أ" و "ب" مع النقاط الحمراء والإزاحة
    exCtx.font = "bold 26px Arial";
    
    // النقطة أ
    exCtx.beginPath(); exCtx.arc(p1.x, p1.y, 10, 0, Math.PI * 2); exCtx.fillStyle = '#e74c3c'; exCtx.fill();
    exCtx.fillStyle = '#2c3e50'; 
    exCtx.textAlign = Math.cos(angle1) >= 0 ? "left" : "right"; exCtx.textBaseline = "middle";
    exCtx.fillText("أ", p1.x + Math.cos(angle1)*28, p1.y + Math.sin(angle1)*28);
    
    // النقطة ب
    exCtx.beginPath(); exCtx.arc(p2.x, p2.y, 10, 0, Math.PI * 2); exCtx.fillStyle = '#e74c3c'; exCtx.fill();
    exCtx.fillStyle = '#2c3e50'; 
    exCtx.textAlign = Math.cos(angle2) >= 0 ? "left" : "right"; exCtx.textBaseline = "middle";
    exCtx.fillText("ب", p2.x + Math.cos(angle2)*28, p2.y + Math.sin(angle2)*28);
    
    document.getElementById('radiusVal').textContent = Math.round((r * 2 / 3)); 
    document.getElementById('diamVal').textContent = Math.round((r * 2 / 3) * 2);
    document.getElementById('chordVal').textContent = Math.round(dist * (50/150));
    document.getElementById('chordType').textContent = isDiam ? "قطر" : "وتر";
    
    const successSound = document.getElementById('successSound');
    if(isDiam && !hasPlayedSuccess) {
        if(successSound) successSound.play().catch(()=>{});
        hasPlayedSuccess = true;
    } else if(!isDiam) hasPlayedSuccess = false;
}

radiusSlider.oninput = drawExplore;

function handlePointerExplore(e) {
    const rect = exCanvas.getBoundingClientRect();
    const cx = 250, cy = 225, r = parseInt(radiusSlider.value);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left, y = clientY - rect.top;

    if (e.type === 'mousedown' || e.type === 'touchstart') {
        const d1 = Math.hypot(x - (cx + r * Math.cos(angle1)), y - (cy + r * Math.sin(angle1)));
        const d2 = Math.hypot(x - (cx + r * Math.cos(angle2)), y - (cy + r * Math.sin(angle2)));
        if (d1 < 30) activePoint = 1; else if (d2 < 30) activePoint = 2;
    } else if (activePoint && (e.type === 'mousemove' || e.type === 'touchmove')) {
        if(e.cancelable) e.preventDefault();
        const ang = Math.atan2(y - cy, x - cx);
        if (activePoint === 1) angle1 = ang; else angle2 = ang;
        drawExplore();
    }
}

exCanvas.onmousedown = exCanvas.ontouchstart = handlePointerExplore;
window.onmousemove = window.ontouchmove = handlePointerExplore;
window.onmouseup = window.ontouchend = () => activePoint = null;
drawExplore();

// ==========================================
// 4. المستوى 3: الاختبار والنتائج (Quiz)
// ==========================================
const qzCanvas = document.getElementById('quizCanvas');
const qzCtx = qzCanvas.getContext('2d');
let correctScore = 0, wrongScore = 0;

function drawQuiz(highlight = null) {
    qzCtx.clearRect(0, 0, 450, 450);
    const qz_cx = 225, qz_cy = 225, qz_r = 150;
    const qzPoints = {
        M: {x:225, y:225, label:"م", a:null}, A: {x:225 + 150*Math.cos(0.5), y:225 + 150*Math.sin(0.5), label:"أ", a:0.5},
        B: {x:225-150, y:225, label:"ب", a:Math.PI}, C: {x:225+150, y:225, label:"ج", a:0}, 
        D: {x:225 + 150*Math.cos(3.8), y:225 + 150*Math.sin(3.8), label:"د", a:3.8}, 
        E: {x:225 + 150*Math.cos(5.2), y:225 + 150*Math.sin(5.2), label:"هـ", a:5.2}
    };

    qzCtx.beginPath(); qzCtx.arc(qz_cx, qz_cy, qz_r, 0, Math.PI * 2); qzCtx.strokeStyle = '#ecf0f1'; qzCtx.stroke();
    
    const drawQLine = (p1, p2, type) => {
        qzCtx.beginPath(); qzCtx.moveTo(qzPoints[p1].x, qzPoints[p1].y); qzCtx.lineTo(qzPoints[p2].x, qzPoints[p2].y);
        qzCtx.strokeStyle = highlight === type ? '#27ae60' : '#bdc3c7'; qzCtx.lineWidth = 4; qzCtx.stroke();
    };
    drawQLine('M', 'A', 'radius'); drawQLine('B', 'C', 'diameter'); drawQLine('D', 'E', 'chord');

    qzCtx.font = "bold 26px Arial"; qzCtx.fillStyle = "#2c3e50";
    Object.values(qzPoints).forEach(p => {
        qzCtx.beginPath(); qzCtx.arc(p.x, p.y, 4, 0, 7); qzCtx.fill();
        let tx = p.label === 'م' ? p.x - 15 : p.x + Math.cos(p.a) * 30;
        let ty = p.label === 'م' ? p.y - 15 : p.y + Math.sin(p.a) * 30;
        
        qzCtx.textAlign = p.label === 'م' ? "right" : (Math.cos(p.a) >= 0 ? "left" : "right");
        qzCtx.textBaseline = p.label === 'م' ? "bottom" : "middle";
        qzCtx.fillText(p.label, tx, ty);
    });
}

function checkAnswer(idx, part, correct, btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('button').forEach(b => b.disabled = true);
    
    const successSound = document.getElementById('successSound');
    const failSound = document.getElementById('failSound');

    if (correct) {
        correctScore++; btn.classList.add('correct');
        if(successSound) { successSound.currentTime = 0; successSound.play().catch(()=>{}); }
    } else {
        wrongScore++; btn.classList.add('wrong');
        parent.querySelector('[data-correct="true"]').classList.add('correct');
        if(failSound) { failSound.currentTime = 0; failSound.play().catch(()=>{}); }
    }
    drawQuiz(part);
    document.getElementById('next' + idx).style.display = 'block';
}

function nextQuestion(n) {
    document.getElementById('q'+n).classList.remove('active-q');
    document.getElementById('q'+(n+1)).classList.add('active-q');
    drawQuiz();
}

function finishQuiz() {
    document.getElementById('q4').classList.remove('active-q');
    document.getElementById('quiz-completion').classList.add('active-q');
    document.getElementById('correctScore').textContent = correctScore;
    document.getElementById('wrongScore').textContent = wrongScore;
}
drawQuiz();
