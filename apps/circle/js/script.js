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

    if (tabId === 'compass' && typeof drawCompass === 'function') {
        drawCompass();
    }
}

const systemColors = { center: '#e74c3c', radius: '#27ae60', diameter: '#2980b9', chord: '#f39c12', arc: '#9b59b6', circumference: '#34495e' };

// ==========================================
// 2. المستوى 1: التعرف على العناصر
// ==========================================
const idCanvas = document.getElementById('identifyCanvas');
const idCtx = idCanvas ? idCanvas.getContext('2d') : null;
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
        { type: 'line', p1: 'M', p2: 'B', text: "نصف القطر (م ب): جميع أنصاف الأقطار متساوية الطول." }
    ],
    diameter: [ { type: 'line', p1: 'B', p2: 'C', text: "القطر (ب ج): أطول وتر في الدائرة، ويمر بالمركز." } ],
    chord: [ { type: 'line', p1: 'D', p2: 'E', text: "الوتر (د هـ): قطعة مستقيمة تصل بين نقطتين ولا تمر بالمركز." } ],
    arc: [ { type: 'arc', s: angles.C, e: angles.A, text: "القوس (ج أ): جزء من محيط الدائرة." } ],
    circumference: [ { type: 'circle', text: "المحيط: هو الخط المنحني المغلق الذي يمثل طول إطار الدائرة." } ]
};

function highlight(name) {
    if (currentElement === name) cycleIndex++; else { currentElement = name; cycleIndex = 0; }
    cycleIndex %= elementsData[name].length;
    if (descBox) descBox.textContent = elementsData[name][cycleIndex].text;
    if (idCtx) drawIdentify();
}

function drawIdentify() {
    if (!idCtx) return;
    idCtx.clearRect(0, 0, 450, 450);
    idCtx.beginPath(); idCtx.arc(id_cx, id_cy, id_r, 0, Math.PI * 2);
    idCtx.strokeStyle = currentElement === 'circumference' ? systemColors.circumference : '#ecf0f1';
    idCtx.lineWidth = currentElement === 'circumference' ? 6 : 2; idCtx.stroke();

    if (currentElement) {
        idCtx.lineWidth = 6; 
        idCtx.strokeStyle = systemColors[currentElement]; 
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

// ==========================================
// 3. المستوى 2: التفاعل الحي (Explore)
// ==========================================
const exCanvas = document.getElementById('exploreCanvas');
const exCtx = exCanvas ? exCanvas.getContext('2d') : null;
const radiusSlider = document.getElementById('radiusSlider');
let angle1 = 0.5, angle2 = 2.5, activePoint = null, hasPlayedSuccess = false;

function drawExplore() {
    if (!exCtx) return;
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
    
    if(isDiam && !hasPlayedSuccess) {
        const successSound = document.getElementById('successSound');
        if(successSound) { successSound.currentTime=0; successSound.play().catch(()=>{}); }
        hasPlayedSuccess = true;
    } else if(!isDiam) hasPlayedSuccess = false;
}
if(radiusSlider) radiusSlider.oninput = drawExplore;

// ==========================================
// 4. المستوى 4: الاختبار (Quiz) والربط
// ==========================================
const qzCanvas = document.getElementById('quizCanvas');
const qzCtx = qzCanvas ? qzCanvas.getContext('2d') : null;
let correctScore = 0, wrongScore = 0;

const quizData = [
    { shape: 1, text: "ماذا تسمى القطعة المستقيمة (م أ)؟", options: ["وتراً", "نصف قطر", "قطراً"], correct: 1, hl: {type:'line', p1:'M', p2:'A', c:systemColors.radius} },
    { shape: 1, text: "القطعة (د هـ) لا تمر بالمركز، تسمى:", options: ["قوساً", "وتراً", "قطراً"], correct: 1, hl: {type:'line', p1:'D', p2:'E', c:systemColors.chord} },
    { shape: 1, text: "أي من القطع التالية يمثل أطول وتر في الدائرة؟", options: ["(م أ)", "(د هـ)", "(ب ج)"], correct: 2, hl: {type:'line', p1:'B', p2:'C', c:systemColors.diameter} }
];

function initQuizDOM() {
    const container = document.getElementById('quiz-questions-container');
    if (!container) return;
    container.innerHTML = '';
    quizData.forEach((q, idx) => {
        let html = `
        <div class="question-card" id="q${idx}" style="display: ${idx === 0 ? 'block' : 'none'};">
            <h3>السؤال ${idx + 1} من ${quizData.length}</h3>
            <p>${q.text}</p>
            <div class="options">
                ${q.options.map((opt, i) => `<button class="option-btn" onclick="checkAnswer(${idx}, ${i}, this)">${opt}</button>`).join('')}
            </div>
            <button class="next-btn" id="next${idx}" onclick="nextQuestion(${idx})" style="display:none;">${idx === quizData.length - 1 ? 'عرض النتيجة النهائية' : 'السؤال التالي &raquo;'}</button>
        </div>`;
        container.innerHTML += html;
    });
    container.innerHTML += `
        <div class="question-card" id="quiz-completion" style="display:none; text-align: center;">
            <h2 style="color: #27ae60;">🎉 اكتمل الاختبار!</h2>
            <div class="score-board" style="background: #f1f2f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
                <p>✅ صحيح: <strong id="correctScore">0</strong> | ❌ خطأ: <strong id="wrongScore">0</strong></p>
            </div>
            <button class="next-btn" style="display:inline-block;" onclick="location.reload()">إعادة التجربة</button>
        </div>`;
}

function drawQuizShape(shapeId, highlightData = null) {
    if (!qzCtx) return;
    qzCtx.clearRect(0, 0, 450, 450);
    const cx = 225, cy = 225, r = 150;
    qzCtx.beginPath(); qzCtx.arc(cx, cy, r, 0, Math.PI * 2); qzCtx.strokeStyle = '#ecf0f1'; qzCtx.stroke();
    const pts = {
        M: {x:cx, y:cy, l:"م", a:null}, A: {x:cx+r*Math.cos(0.5), y:cy+r*Math.sin(0.5), l:"أ", a:0.5},
        B: {x:cx-r, y:cy, l:"ب", a:Math.PI}, C: {x:cx+r, y:cy, l:"ج", a:0}, 
        D: {x:cx+r*Math.cos(3.8), y:cy+r*Math.sin(3.8), l:"د", a:3.8}, E: {x:cx+r*Math.cos(5.2), y:cy+r*Math.sin(5.2), l:"هـ", a:5.2}
    };
    const drawL = (p1, p2, c = '#bdc3c7', lw = 3) => {
        qzCtx.beginPath(); qzCtx.moveTo(p1.x, p1.y); qzCtx.lineTo(p2.x, p2.y);
        qzCtx.strokeStyle = c; qzCtx.lineWidth = lw; qzCtx.stroke();
    };
    drawL(pts.M, pts.A); drawL(pts.B, pts.C); drawL(pts.D, pts.E);
    if (highlightData) drawL(pts[highlightData.p1], pts[highlightData.p2], highlightData.c, 6);

    qzCtx.font = "bold 26px Arial"; qzCtx.fillStyle = "#2c3e50";
    Object.values(pts).forEach(p => {
        qzCtx.beginPath(); qzCtx.arc(p.x, p.y, 5, 0, 7); qzCtx.fill();
        let tx = p.a === null ? p.x - 15 : p.x + Math.cos(p.a) * 30;
        let ty = p.a === null ? p.y - 15 : p.y + Math.sin(p.a) * 30;
        qzCtx.fillText(p.l, tx, ty);
    });
}

function checkAnswer(qIndex, selectedIndex, btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('button').forEach(b => b.disabled = true);
    const isCorrect = selectedIndex === quizData[qIndex].correct;
    if (isCorrect) { correctScore++; btn.classList.add('correct'); document.getElementById('successSound').play().catch(()=>{}); }
    else { wrongScore++; btn.classList.add('wrong'); parent.children[quizData[qIndex].correct].classList.add('correct'); document.getElementById('failSound').play().catch(()=>{}); }
    drawQuizShape(quizData[qIndex].shape, quizData[qIndex].hl);
    document.getElementById('next' + qIndex).style.display = 'block';
}

function nextQuestion(n) {
    document.getElementById('q'+n).style.display = 'none';
    if (n + 1 < quizData.length) { document.getElementById('q'+(n+1)).style.display = 'block'; drawQuizShape(quizData[n+1].shape); }
    else { finishQuiz(); }
}

// ==========================================
// 5. الربط مع Google Forms (لوحة المعلم)
// ==========================================
async function sendDataToGoogleSheet(studentName, correct, wrong) {
    const formURL = "https://docs.google.com/forms/d/e/1FAIpQLScFMAWBnGGfrTevoUarrCvg5VC5onuRS91kKKAzBVsGt7JO5A/formResponse";
    const formData = new URLSearchParams();
    formData.append("entry.1275102630", studentName);  
    formData.append("entry.357058504", correct);      
    formData.append("entry.745084820", wrong);        

    try {
        await fetch(formURL, { method: "POST", mode: "no-cors", body: formData, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        console.log("تم الإرسال بنجاح.");
    } catch (e) { console.error("خطأ:", e); }
}

function finishQuiz() {
    document.getElementById('q' + (quizData.length - 1)).style.display = 'none';
    document.getElementById('quiz-completion').style.display = 'block';
    document.getElementById('correctScore').textContent = correctScore;
    document.getElementById('wrongScore').textContent = wrongScore;

    setTimeout(() => {
        let name = prompt("أدخل اسمك الثلاثي لتسجيل النتيجة في لوحة الصدارة:");
        if (name && name.trim() !== "") {
            sendDataToGoogleSheet(name, correctScore, wrongScore);
            alert("تم إرسال نتيجتك بنجاح.");
        }
    }, 500);
}

initQuizDOM();
drawQuizShape(quizData[0].shape);
