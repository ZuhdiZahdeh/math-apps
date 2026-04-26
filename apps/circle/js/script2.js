// ==========================================
// 1. نظام التبويبات 
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('.mode-container').forEach(container => container.classList.remove('active-mode'));
    const activeContainer = document.getElementById(tabId + '-mode');
    if (activeContainer) activeContainer.classList.add('active-mode');
}

// الألوان المعتمدة لكل عنصر
const systemColors = { center: '#e74c3c', radius: '#27ae60', diameter: '#2980b9', chord: '#f39c12', arc: '#9b59b6', circumference: '#34495e' };

// ==========================================
// 2. المستوى 1: التعرف المتعدد وإزاحة الرموز (مع إصلاح الألوان)
// ==========================================
const idCanvas = document.getElementById('identifyCanvas');
const idCtx = idCanvas.getContext('2d');
const descBox = document.getElementById('descriptionBox');

const id_cx = 225, id_cy = 225, id_r = 150;
let currentElement = null;
let cycleIndex = 0;

const angles = { C: 0, A: Math.PI / 4, D: Math.PI / 2, B: Math.PI, F: 5 * Math.PI / 4, E: 3 * Math.PI / 2 };
const points = {
    M: { x: id_cx, y: id_cy, label: "م", angle: null },
    C: { x: id_cx + id_r * Math.cos(angles.C), y: id_cy + id_r * Math.sin(angles.C), label: "ج", angle: angles.C },
    A: { x: id_cx + id_r * Math.cos(angles.A), y: id_cy + id_r * Math.sin(angles.A), label: "أ", angle: angles.A },
    D: { x: id_cx + id_r * Math.cos(angles.D), y: id_cy + id_r * Math.sin(angles.D), label: "د", angle: angles.D },
    B: { x: id_cx + id_r * Math.cos(angles.B), y: id_cy + id_r * Math.sin(angles.B), label: "ب", angle: angles.B },
    F: { x: id_cx + id_r * Math.cos(angles.F), y: id_cy + id_r * Math.sin(angles.F), label: "و", angle: angles.F },
    E: { x: id_cx + id_r * Math.cos(angles.E), y: id_cy + id_r * Math.sin(angles.E), label: "هـ", angle: angles.E }
};

const elementsData = {
    center: [ { type: 'point', p: 'M', text: "المركز (م): النقطة الثابتة في منتصف الدائرة." } ],
    radius: [
        { type: 'line', p1: 'M', p2: 'A', text: "نصف القطر (م أ): يصل بين المركز والمحيط." },
        { type: 'line', p1: 'M', p2: 'B', text: "نصف القطر (م ب): جميع أنصاف الأقطار متساوية الطول." },
        { type: 'line', p1: 'M', p2: 'C', text: "نصف القطر (م ج): قطعة من المركز للنقطة ج." },
        { type: 'line', p1: 'M', p2: 'D', text: "نصف القطر (م د)." },
        { type: 'line', p1: 'M', p2: 'E', text: "نصف القطر (م هـ)." },
        { type: 'line', p1: 'M', p2: 'F', text: "نصف القطر (م و)." }
    ],
    diameter: [
        { type: 'line', p1: 'B', p2: 'C', text: "القطر (ب ج): أطول وتر في الدائرة، ويمر بالمركز." },
        { type: 'line', p1: 'D', p2: 'E', text: "القطر (د هـ): يتكون من نصفي قطر على استقامة واحدة." },
        { type: 'line', p1: 'A', p2: 'F', text: "القطر (أ و): يقسم الدائرة لنصفين متطابقين." }
    ],
    chord: [
        { type: 'line', p1: 'A', p2: 'D', text: "الوتر (أ د): قطعة مستقيمة تصل بين نقطتين ولا تمر بالمركز." },
        { type: 'line', p1: 'A', p2: 'B', text: "الوتر (أ ب): وتر آخر." },
        { type: 'line', p1: 'D', p2: 'B', text: "الوتر (د ب)." },
        { type: 'line', p1: 'C', p2: 'E', text: "الوتر (ج هـ)." },
        { type: 'line', p1: 'E', p2: 'F', text: "الوتر (هـ و)." },
        { type: 'line', p1: 'F', p2: 'B', text: "الوتر (و ب)." }
    ],
    arc: [
        { type: 'arc', s: angles.C, e: angles.A, text: "القوس (ج أ): جزء من محيط الدائرة." },
        { type: 'arc', s: angles.A, e: angles.D, text: "القوس (أ د)." },
        { type: 'arc', s: angles.D, e: angles.B, text: "القوس (د ب)." },
        { type: 'arc', s: angles.B, e: angles.F, text: "القوس (ب و)." },
        { type: 'arc', s: angles.F, e: angles.E, text: "القوس (و هـ)." }
    ],
    circumference: [ { type: 'circle', text: "المحيط: هو الخط المنحني المغلق الذي يمثل طول إطار الدائرة." } ]
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
    idCtx.strokeStyle = currentElement === 'circumference' ? systemColors.circumference : '#ecf0f1';
    idCtx.lineWidth = currentElement === 'circumference' ? 6 : 2; idCtx.stroke();

    if (currentElement) {
        idCtx.lineWidth = 6; 
        idCtx.strokeStyle = systemColors[currentElement]; // استخدام اللون المخصص للعنصر
        
        const item = elementsData[currentElement][cycleIndex];
        if (item.type === 'point') {
            idCtx.fillStyle = systemColors[currentElement]; 
            idCtx.beginPath(); idCtx.arc(points[item.p].x, points[item.p].y, 8, 0, 7); idCtx.fill();
        } else if (item.type === 'line') {
            idCtx.beginPath(); idCtx.moveTo(points[item.p1].x, points[item.p1].y); idCtx.lineTo(points[item.p2].x, points[item.p2].y); idCtx.stroke();
        } else if (item.type === 'arc') {
            idCtx.lineWidth = 8; idCtx.beginPath(); idCtx.arc(id_cx, id_cy, id_r, item.s, item.e); idCtx.stroke();
        }
    }

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
// 3. المستوى 2: التفاعل الحي (تحديث أبعاد الرسم للنسبة 2/3)
// ==========================================
const exCanvas = document.getElementById('exploreCanvas');
const exCtx = exCanvas.getContext('2d');
const radiusSlider = document.getElementById('radiusSlider');
let angle1 = 0.5, angle2 = 2.5, activePoint = null, hasPlayedSuccess = false;

function drawExplore() {
    exCtx.clearRect(0, 0, exCanvas.width, exCanvas.height);
    const r = parseInt(radiusSlider.value);
    const cx = exCanvas.width / 2, cy = exCanvas.height / 2;
    
    exCtx.beginPath(); exCtx.arc(cx, cy, r, 0, Math.PI * 2); exCtx.strokeStyle = '#dfe6e9'; exCtx.stroke();
    
    exCtx.beginPath(); exCtx.arc(cx, cy, 5, 0, Math.PI * 2); exCtx.fillStyle = '#2c3e50'; exCtx.fill();
    exCtx.font = "bold 26px Arial"; exCtx.textAlign = "right"; exCtx.textBaseline = "bottom"; exCtx.fillText("م", cx - 10, cy - 10);

    const p1 = { x: cx + r * Math.cos(angle1), y: cy + r * Math.sin(angle1) };
    const p2 = { x: cx + r * Math.cos(angle2), y: cy + r * Math.sin(angle2) };
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const isDiam = dist >= (r * 2) - 2;

    exCtx.beginPath(); exCtx.moveTo(p1.x, p1.y); exCtx.lineTo(p2.x, p2.y);
    exCtx.strokeStyle = isDiam ? systemColors.radius : systemColors.diameter; exCtx.lineWidth = isDiam ? 6 : 3; exCtx.stroke();

    exCtx.font = "bold 26px Arial";
    exCtx.beginPath(); exCtx.arc(p1.x, p1.y, 10, 0, Math.PI * 2); exCtx.fillStyle = '#e74c3c'; exCtx.fill();
    exCtx.fillStyle = '#2c3e50'; exCtx.textAlign = Math.cos(angle1) >= 0 ? "left" : "right"; exCtx.textBaseline = "middle";
    exCtx.fillText("أ", p1.x + Math.cos(angle1)*28, p1.y + Math.sin(angle1)*28);
    
    exCtx.beginPath(); exCtx.arc(p2.x, p2.y, 10, 0, Math.PI * 2); exCtx.fillStyle = '#e74c3c'; exCtx.fill();
    exCtx.fillStyle = '#2c3e50'; exCtx.textAlign = Math.cos(angle2) >= 0 ? "left" : "right"; exCtx.textBaseline = "middle";
    exCtx.fillText("ب", p2.x + Math.cos(angle2)*28, p2.y + Math.sin(angle2)*28);
    
    document.getElementById('radiusVal').textContent = Math.round((r * 2 / 3)); 
    document.getElementById('diamVal').textContent = Math.round((r * 2 / 3) * 2);
    document.getElementById('chordVal').textContent = Math.round(dist * (50/150));
    document.getElementById('chordType').textContent = isDiam ? "قطر" : "وتر";
    
    const successSound = document.getElementById('successSound');
    if(isDiam && !hasPlayedSuccess) {
        if(successSound) { successSound.currentTime=0; successSound.play().catch(()=>{}); }
        hasPlayedSuccess = true;
    } else if(!isDiam) hasPlayedSuccess = false;
}

radiusSlider.oninput = drawExplore;

function handlePointerExplore(e) {
    const rect = exCanvas.getBoundingClientRect();
    const cx = exCanvas.width / 2, cy = exCanvas.height / 2, r = parseInt(radiusSlider.value);
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
// 4. المستوى 3: الاختبار والمحرك الديناميكي للبيانات (JSON-like Data)
// ==========================================
const qzCanvas = document.getElementById('quizCanvas');
const qzCtx = qzCanvas.getContext('2d');
let correctScore = 0, wrongScore = 0, currentQuestionIndex = 0;

// قاعدة بيانات الأسئلة (10 أسئلة موزعة على شكلين) + تغذية راجعة تفسيرية
const quizData = [
    // أسئلة الشكل الأول (المركز م)
    {
        shape: 1,
        text: "في الشكل المجاور، ماذا تسمى القطعة المستقيمة (م أ)؟",
        options: ["وتراً", "نصف قطر", "قطراً"],
        correct: 1,
        hl: {type:'line', p1:'M', p2:'A', c:systemColors.radius},
        feedback: "القطعة (م أ) نصف قطر؛ لأنها تبدأ من المركز م وتنتهي عند نقطة على الدائرة."
    },
    {
        shape: 1,
        text: "القطعة (د هـ) تصل بين نقطتين ولا تمر بالمركز، تسمى:",
        options: ["قوساً", "وتراً", "قطراً"],
        correct: 1,
        hl: {type:'line', p1:'D', p2:'E', c:systemColors.chord},
        feedback: "القطعة (د هـ) وتر؛ لأن الوتر قطعة مستقيمة تصل بين نقطتين على الدائرة، ولا يشترط أن تمر بالمركز."
    },
    {
        shape: 1,
        text: "أي من القطع التالية يمثل أطول وتر في الدائرة؟",
        options: ["(م أ)", "(د هـ)", "(ب ج)"],
        correct: 2,
        hl: {type:'line', p1:'B', p2:'C', c:systemColors.diameter},
        feedback: "القطر هو أطول وتر في الدائرة؛ لأنه يصل بين نقطتين على الدائرة ويمر بالمركز. لذلك القطعة (ب ج) هي الاختيار الصحيح."
    },
    {
        shape: 1,
        text: "الجزء المنحني المحصور بين النقطتين (د) و (هـ) على الدائرة يسمى:",
        options: ["قوساً", "محيطاً", "وتراً"],
        correct: 0,
        hl: {type:'arc', s:3.8, e:5.2, c:systemColors.arc},
        feedback: "القوس هو جزء من محيط الدائرة بين نقطتين على الدائرة. لذلك الجزء المنحني بين د و هـ يسمى قوساً."
    },
    {
        shape: 1,
        text: "تطبيق: إذا كان طول (م أ) = 5 سم، فكم يكون طول القطر (ب ج)؟",
        options: ["5 سم", "10 سم", "2.5 سم"],
        correct: 1,
        hl: {type:'line', p1:'B', p2:'C', c:systemColors.diameter},
        feedback: "طول القطر يساوي ضعفي طول نصف القطر. بما أن م أ = 5 سم، إذن القطر = 2 × 5 = 10 سم."
    },
    
    // أسئلة الشكل الثاني (المركز ن) متقدم قليلاً
    {
        shape: 2,
        text: "انتقلنا لشكل جديد مركزه (ن). أي القطع التالية تمثل نصف قطر؟",
        options: ["(س ص)", "(ن و)", "(ع ل)"],
        correct: 1,
        hl: {type:'line', p1:'N', p2:'W', c:systemColors.radius},
        feedback: "القطعة (ن و) نصف قطر؛ لأن أحد طرفيها هو المركز ن والطرف الآخر نقطة على الدائرة."
    },
    {
        shape: 2,
        text: "القطعة (س ص) تمر بالمركز (ن)، إذن هي:",
        options: ["وتر فقط", "قوس", "قطر"],
        correct: 2,
        hl: {type:'line', p1:'S', p2:'Y', c:systemColors.diameter},
        feedback: "القطعة (س ص) قطر؛ لأنها تصل بين نقطتين على الدائرة وتمر بالمركز ن. والقطر يعد وتراً خاصاً."
    },
    {
        shape: 2,
        text: "القطعة المتقاطعة (ع ل) لا تمر بالمركز، ماذا نسميها؟",
        options: ["قطر", "وتر", "نصف قطر"],
        correct: 1,
        hl: {type:'line', p1:'X', p2:'L', c:systemColors.chord},
        feedback: "القطعة (ع ل) وتر؛ لأنها تصل بين نقطتين على الدائرة. وليست قطراً لأنها لا تمر بالمركز."
    },
    {
        shape: 2,
        text: "كم عدد أنصاف الأقطار المرسومة بوضوح في هذا الشكل؟",
        options: ["1", "2", "3"],
        correct: 2,
        hl: {type:'multi_radius'}, // ن س، ن ص، ن و
        feedback: "الأنصاف المرسومة بوضوح هي: ن س، ن ص، ن و. كلها تبدأ من المركز ن وتنتهي عند نقاط على الدائرة، وعددها 3."
    },
    {
        shape: 2,
        text: "تحدي: إذا كان طول القطر (س ص) = 14 سم، فما طول نصف القطر (ن و)؟",
        options: ["7 سم", "14 سم", "28 سم"],
        correct: 0,
        hl: {type:'line', p1:'N', p2:'W', c:systemColors.radius},
        feedback: "نصف القطر يساوي نصف طول القطر. بما أن القطر = 14 سم، إذن نصف القطر = 14 ÷ 2 = 7 سم."
    }
];

// تهيئة وبناء واجهة الأسئلة ديناميكياً
function initQuizDOM() {
    const container = document.getElementById('quiz-questions-container');
    container.innerHTML = '';
    quizData.forEach((q, idx) => {
        let html = `
        <div class="question-card" id="q${idx}" style="display: ${idx === 0 ? 'block' : 'none'};">
            <h3>السؤال ${idx + 1} من ${quizData.length} ${q.shape===2 ? '(شكل متقدم)' : ''}</h3>
            <p>${q.text}</p>
            <div class="options">
                ${q.options.map((opt, i) => `<button class="option-btn" onclick="checkAnswer(${idx}, ${i}, this)">${opt}</button>`).join('')}
            </div>
            <div class="answer-feedback" id="feedback${idx}" aria-live="polite"></div>
            <button class="next-btn" id="next${idx}" onclick="nextQuestion(${idx})" style="display:none;">${idx === quizData.length - 1 ? 'عرض النتيجة النهائية' : 'السؤال التالي &raquo;'}</button>
        </div>`;
        container.innerHTML += html;
    });
    
    // شاشة النهاية
    container.innerHTML += `
        <div class="question-card" id="quiz-completion" style="display:none; text-align: center;">
            <h2 style="color: #27ae60;">🎉 اكتمل الاختبار!</h2>
            <div class="score-board" style="background: #f1f2f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
                <p style="font-size: 1.2rem;">✅ الإجابات الصحيحة: <strong id="correctScore" style="color: #27ae60;">0</strong></p>
                <p style="font-size: 1.2rem;">❌ الإجابات الخاطئة: <strong id="wrongScore" style="color: #e74c3c;">0</strong></p>
            </div>
            <button class="next-btn" style="display:inline-block;" onclick="location.reload()">إعادة التجربة</button>
        </div>`;
}

// رسم الدائرة الخاصة بالاختبار (تدعم شكلين مختلفين)
function drawQuizShape(shapeId, highlightData = null) {
    qzCtx.clearRect(0, 0, 450, 450);
    const cx = 225, cy = 225, r = 150;
    
    qzCtx.beginPath(); qzCtx.arc(cx, cy, r, 0, Math.PI * 2); 
    qzCtx.strokeStyle = '#ecf0f1'; qzCtx.lineWidth = 2; qzCtx.stroke();
    
    let pts = {};
    if (shapeId === 1) {
        pts = {
            M: {x:cx, y:cy, l:"م", a:null}, A: {x:cx+r*Math.cos(0.5), y:cy+r*Math.sin(0.5), l:"أ", a:0.5},
            B: {x:cx-r, y:cy, l:"ب", a:Math.PI}, C: {x:cx+r, y:cy, l:"ج", a:0}, 
            D: {x:cx+r*Math.cos(3.8), y:cy+r*Math.sin(3.8), l:"د", a:3.8}, E: {x:cx+r*Math.cos(5.2), y:cy+r*Math.sin(5.2), l:"هـ", a:5.2}
        };
        drawQLine(pts.M, pts.A); drawQLine(pts.B, pts.C); drawQLine(pts.D, pts.E);
    } else {
        // الشكل الثاني (ن، س، ص، و، ع، ل)
        pts = {
            N: {x:cx, y:cy, l:"ن", a:null}, 
            S: {x:cx+r*Math.cos(Math.PI/4), y:cy+r*Math.sin(Math.PI/4), l:"س", a:Math.PI/4}, 
            Y: {x:cx+r*Math.cos(5*Math.PI/4), y:cy+r*Math.sin(5*Math.PI/4), l:"ص", a:5*Math.PI/4}, // س ص قطر
            W: {x:cx+r*Math.cos(7*Math.PI/4), y:cy+r*Math.sin(7*Math.PI/4), l:"و", a:7*Math.PI/4}, // ن و نصف قطر
            X: {x:cx+r*Math.cos(Math.PI), y:cy+r*Math.sin(Math.PI), l:"ع", a:Math.PI}, 
            L: {x:cx+r*Math.cos(3*Math.PI/2), y:cy+r*Math.sin(3*Math.PI/2), l:"ل", a:3*Math.PI/2} // ع ل وتر متقاطع
        };
        drawQLine(pts.S, pts.Y); drawQLine(pts.N, pts.W); drawQLine(pts.X, pts.L);
    }

    function drawQLine(p1, p2, c = '#bdc3c7', lw = 3) {
        qzCtx.beginPath(); qzCtx.moveTo(p1.x, p1.y); qzCtx.lineTo(p2.x, p2.y);
        qzCtx.strokeStyle = c; qzCtx.lineWidth = lw; qzCtx.stroke();
    }

    // تطبيق التلوين (Highlight) للإجابات الصحيحة والخاطئة
    if (highlightData) {
        if (highlightData.type === 'line') {
            drawQLine(pts[highlightData.p1], pts[highlightData.p2], highlightData.c, 6);
        } else if (highlightData.type === 'arc') {
            qzCtx.beginPath(); qzCtx.arc(cx, cy, r, highlightData.s, highlightData.e);
            qzCtx.strokeStyle = highlightData.c; qzCtx.lineWidth = 8; qzCtx.stroke();
        } else if (highlightData.type === 'multi_radius') {
            drawQLine(pts.N, pts.S, systemColors.radius, 6);
            drawQLine(pts.N, pts.Y, systemColors.radius, 6);
            drawQLine(pts.N, pts.W, systemColors.radius, 6);
        }
    }

    // رسم النقاط والرموز مع الإزاحة
    qzCtx.font = "bold 26px Arial"; qzCtx.fillStyle = "#2c3e50";
    Object.values(pts).forEach(p => {
        qzCtx.beginPath(); qzCtx.arc(p.x, p.y, 5, 0, 7); qzCtx.fill();
        let isCenter = p.a === null;
        let tx = isCenter ? p.x - 15 : p.x + Math.cos(p.a) * 30;
        let ty = isCenter ? p.y - 15 : p.y + Math.sin(p.a) * 30;
        qzCtx.textAlign = isCenter ? "right" : (Math.cos(p.a) >= 0 ? "left" : "right");
        qzCtx.textBaseline = isCenter ? "bottom" : "middle";
        qzCtx.fillText(p.l, tx, ty);
    });
}

function checkAnswer(qIndex, selectedOptionIndex, btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('button').forEach(b => b.disabled = true);
    
    const qData = quizData[qIndex];
    const isCorrect = selectedOptionIndex === qData.correct;
    const correctAnswerText = qData.options[qData.correct];
    
    const successSound = document.getElementById('successSound');
    const failSound = document.getElementById('failSound');
    const feedbackBox = document.getElementById('feedback' + qIndex);

    feedbackBox.classList.remove('correct-feedback', 'wrong-feedback');

    if (isCorrect) {
        correctScore++;
        btn.classList.add('correct');
        feedbackBox.classList.add('correct-feedback');
        feedbackBox.innerHTML = `<strong>إجابة صحيحة:</strong> ${qData.feedback}`;
        if(successSound) { successSound.currentTime=0; successSound.play().catch(()=>{}); }
    } else {
        wrongScore++;
        btn.classList.add('wrong');
        parent.children[qData.correct].classList.add('correct'); // إظهار الصح
        feedbackBox.classList.add('wrong-feedback');
        feedbackBox.innerHTML = `<strong>تحتاج مراجعة:</strong> الإجابة الصحيحة هي <strong>${correctAnswerText}</strong>. ${qData.feedback}`;
        if(failSound) { failSound.currentTime=0; failSound.play().catch(()=>{}); }
    }
    
    feedbackBox.style.display = 'block';
    drawQuizShape(qData.shape, qData.hl); // إضاءة القطعة المعنية
    document.getElementById('next' + qIndex).style.display = 'block';
}

function nextQuestion(currentIndex) {
    document.getElementById('q'+currentIndex).style.display = 'none';
    
    if (currentIndex + 1 < quizData.length) {
        document.getElementById('q'+(currentIndex+1)).style.display = 'block';
        drawQuizShape(quizData[currentIndex+1].shape); // رسم الشكل للسؤال الجديد
    } else {
        document.getElementById('quiz-completion').style.display = 'block';
        document.getElementById('correctScore').textContent = correctScore;
        document.getElementById('wrongScore').textContent = wrongScore;
    }
}

// تهيئة الاختبار
initQuizDOM();
drawQuizShape(quizData[0].shape);
