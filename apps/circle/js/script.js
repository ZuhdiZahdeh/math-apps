// ==========================================
// 1. نظام التبويبات (Tab Switching Logic)
// ==========================================
function switchTab(tabId) {
    // تحديث الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // تحديث الحاويات
    document.querySelectorAll('.mode-container').forEach(container => container.classList.remove('active-mode'));
    document.getElementById(tabId + '-mode').classList.add('active-mode');
}

// ==========================================
// 2. منطق المستوى 1: التعرف على العناصر
// ==========================================
const idCanvas = document.getElementById('identifyCanvas');
const idCtx = idCanvas.getContext('2d');
const descBox = document.getElementById('descriptionBox');

const id_cx = 225, id_cy = 225, id_r = 160;
let currentElement = null;

const points = {
    M: { x: id_cx, y: id_cy, label: "م" },
    A: { x: id_cx + id_r * Math.cos(0.5), y: id_cy + id_r * Math.sin(0.5), label: "أ" },
    B: { x: id_cx + id_r * Math.cos(Math.PI), y: id_cy + id_r * Math.sin(Math.PI), label: "ب" },
    C: { x: id_cx + id_r * Math.cos(0), y: id_cy + id_r * Math.sin(0), label: "ج" },
    D: { x: id_cx + id_r * Math.cos(3.8), y: id_cy + id_r * Math.sin(3.8), label: "د" },
    E: { x: id_cx + id_r * Math.cos(5.2), y: id_cy + id_r * Math.sin(5.2), label: "هـ" }
};

const descriptions = {
    center: "المركز (م): هي النقطة الثابتة في منتصف الدائرة.",
    radius: "نصف القطر (م أ): قطعة مستقيمة تصل بين المركز وأي نقطة على الدائرة.",
    diameter: "القطر (ب ج): أطول وتر في الدائرة، يمر بالمركز ويساوي ضعفي نصف القطر.",
    chord: "الوتر (د هـ): قطعة مستقيمة تصل بين أي نقطتين على الدائرة.",
    arc: "القوس: هو جزء من محيط الدائرة المحصور بين نقطتين (مثل د، هـ).",
    circumference: "المحيط: هو الخط المنحني المغلق الذي يمثل طول إطار الدائرة."
};

const colors = { center: '#e74c3c', radius: '#27ae60', diameter: '#2980b9', chord: '#f39c12', arc: '#9b59b6', circumference: '#34495e' };

function highlight(element) {
    currentElement = element;
    descBox.textContent = descriptions[element];
    
    document.querySelectorAll('.list-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.backgroundColor = 'white';
        btn.style.color = '#2c3e50';
        if(btn.textContent.includes(descriptions[element].split(' ')[0])) {
            btn.classList.add('active');
            btn.style.backgroundColor = colors[element];
            btn.style.color = 'white';
        }
    });
    drawIdentify();
}

function drawIdentify() {
    idCtx.clearRect(0, 0, idCanvas.width, idCanvas.height);
    
    idCtx.beginPath(); idCtx.arc(id_cx, id_cy, id_r, 0, Math.PI * 2);
    idCtx.strokeStyle = currentElement === 'circumference' ? colors.circumference : '#ecf0f1';
    idCtx.lineWidth = currentElement === 'circumference' ? 6 : 2; idCtx.stroke();

    idCtx.lineWidth = 5;
    if (currentElement === 'center') {
        idCtx.fillStyle = colors.center; idCtx.beginPath(); idCtx.arc(id_cx, id_cy, 8, 0, 7); idCtx.fill();
    } else if (currentElement === 'radius') {
        idCtx.strokeStyle = colors.radius; idCtx.beginPath(); idCtx.moveTo(id_cx, id_cy); idCtx.lineTo(points.A.x, points.A.y); idCtx.stroke();
    } else if (currentElement === 'diameter') {
        idCtx.strokeStyle = colors.diameter; idCtx.beginPath(); idCtx.moveTo(points.B.x, points.B.y); idCtx.lineTo(points.C.x, points.C.y); idCtx.stroke();
    } else if (currentElement === 'chord') {
        idCtx.strokeStyle = colors.chord; idCtx.beginPath(); idCtx.moveTo(points.D.x, points.D.y); idCtx.lineTo(points.E.x, points.E.y); idCtx.stroke();
    } else if (currentElement === 'arc') {
        idCtx.strokeStyle = colors.arc; idCtx.lineWidth = 8; idCtx.beginPath(); idCtx.arc(id_cx, id_cy, id_r, 3.8, 5.2); idCtx.stroke();
    }

    idCtx.font = "bold 22px Arial"; idCtx.fillStyle = "#2c3e50";
    Object.values(points).forEach(p => {
        idCtx.beginPath(); idCtx.arc(p.x, p.y, 4, 0, 7); idCtx.fill();
        idCtx.fillText(p.label, p.x + 10, p.y + 10);
    });
}
drawIdentify(); // التشغيل الأولي


// ==========================================
// 3. منطق المستوى 2: تفاعل الوتر والقطر
// ==========================================
const exCanvas = document.getElementById('exploreCanvas');
const exCtx = exCanvas.getContext('2d');
const radiusSlider = document.getElementById('radiusSlider');
const chordDisp = document.getElementById('chordVal');
const chordTypeDisp = document.getElementById('chordType');
const feedbackMsg = document.getElementById('feedbackMsg');
const successSound = document.getElementById('successSound');

let ex_cx = exCanvas.width / 2;
let ex_cy = exCanvas.height / 2;
let visualRadius = parseInt(radiusSlider.value);
let angle1 = 0; 
let angle2 = Math.PI; 
let activePoint = null;
let hasPlayedSound = false;

const scale = 50 / 150; 
function toMM(px) { return Math.round(px * scale); }

function drawExplore() {
    exCtx.clearRect(0, 0, exCanvas.width, exCanvas.height);

    exCtx.beginPath(); exCtx.arc(ex_cx, ex_cy, visualRadius, 0, Math.PI * 2);
    exCtx.strokeStyle = '#dfe6e9'; exCtx.lineWidth = 2; exCtx.stroke();

    exCtx.beginPath(); exCtx.arc(ex_cx, ex_cy, 5, 0, Math.PI * 2);
    exCtx.fillStyle = '#2c3e50'; exCtx.fill();
    exCtx.font = "bold 28px Arial"; exCtx.fillText("م", ex_cx - 12, ex_cy - 15);

    const p1 = { x: ex_cx + visualRadius * Math.cos(angle1), y: ex_cy + visualRadius * Math.sin(angle1) };
    const p2 = { x: ex_cx + visualRadius * Math.cos(angle2), y: ex_cy + visualRadius * Math.sin(angle2) };

    const chordPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const chordMM = toMM(chordPx);
    const diamMM = toMM(visualRadius * 2);

    const isDiameter = chordMM >= diamMM - 1;

    exCtx.beginPath(); exCtx.moveTo(p1.x, p1.y); exCtx.lineTo(p2.x, p2.y);
    exCtx.strokeStyle = isDiameter ? '#27ae60' : '#2980b9';
    exCtx.lineWidth = isDiameter ? 6 : 3; exCtx.stroke();

    exCtx.font = "bold 22px Arial";
    exCtx.beginPath(); exCtx.arc(p1.x, p1.y, 10, 0, Math.PI * 2); exCtx.fillStyle = '#e74c3c'; exCtx.fill();
    exCtx.fillStyle = '#2c3e50'; exCtx.fillText("أ", p1.x + 15, p1.y + 15);
    
    exCtx.beginPath(); exCtx.arc(p2.x, p2.y, 10, 0, Math.PI * 2); exCtx.fillStyle = '#e74c3c'; exCtx.fill();
    exCtx.fillStyle = '#2c3e50'; exCtx.fillText("ب", p2.x + 15, p2.y + 15);

    document.getElementById('radiusVal').textContent = Math.round(diamMM / 2);
    document.getElementById('diamVal').textContent = diamMM;
    chordDisp.textContent = chordMM;
    
    if (isDiameter) {
        chordTypeDisp.textContent = "قطر";
        chordTypeDisp.style.color = "#27ae60";
        chordDisp.classList.add('is-diameter');
        feedbackMsg.textContent = "أحسنت! الوتر أب يمر بالمركز، فهو قطر";
        feedbackMsg.style.color = "#27ae60";
        
        if (!hasPlayedSound) {
            successSound.currentTime = 0;
            successSound.play().catch(e => console.log("التشغيل يتطلب تفاعل")); 
            hasPlayedSound = true;
        }
    } else {
        chordTypeDisp.textContent = "وتر";
        chordTypeDisp.style.color = "#2980b9";
        chordDisp.classList.remove('is-diameter');
        feedbackMsg.textContent = "حرك النقطتين ليمر الوتر بالمركز ويصبح قطراً";
        feedbackMsg.style.color = "#2c3e50";
        hasPlayedSound = false; 
    }
}

function handlePointer(e) {
    const rect = exCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (e.type === 'mousedown' || e.type === 'touchstart') {
        const p1x = ex_cx + visualRadius * Math.cos(angle1);
        const p1y = ex_cy + visualRadius * Math.sin(angle1);
        const p2x = ex_cx + visualRadius * Math.cos(angle2);
        const p2y = ex_cy + visualRadius * Math.sin(angle2);
        if (Math.hypot(x - p1x, y - p1y) < 30) activePoint = 1;
        else if (Math.hypot(x - p2x, y - p2y) < 30) activePoint = 2;
    } else if (activePoint && (e.type === 'mousemove' || e.type === 'touchmove')) {
        if(e.cancelable) e.preventDefault();
        const newAngle = Math.atan2(y - ex_cy, x - ex_cx);
        if (activePoint === 1) angle1 = newAngle;
        else angle2 = newAngle;
        drawExplore();
    }
}

function stopPointer() { activePoint = null; }

radiusSlider.addEventListener('input', (e) => { visualRadius = parseInt(e.target.value); drawExplore(); });
exCanvas.addEventListener('mousedown', handlePointer);
window.addEventListener('mousemove', handlePointer, {passive: false});
window.addEventListener('mouseup', stopPointer);
exCanvas.addEventListener('touchstart', handlePointer, {passive: false});
exCanvas.addEventListener('touchmove', handlePointer, {passive: false});
window.addEventListener('touchend', stopPointer);

drawExplore(); // التشغيل الأولي
