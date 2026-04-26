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

// ==========================================
// 2. منطق المستوى 1: التعرف المتعدد والإزاحة
// ==========================================
const idCanvas = document.getElementById('identifyCanvas');
const idCtx = idCanvas.getContext('2d');
const descBox = document.getElementById('descriptionBox');

const id_cx = 225, id_cy = 225, id_r = 150;
let currentElement = null;
let cycleIndex = 0; // متغير لتتبع عدد النقرات

// حساب النقاط مسبقاً بناءً على زوايا محددة
const angles = { A: 0.5, B: Math.PI, C: 0, D: 3.8, E: 5.2 };
const points = {
    M: { x: id_cx, y: id_cy, label: "م", angle: null },
    A: { x: id_cx + id_r * Math.cos(angles.A), y: id_cy + id_r * Math.sin(angles.A), label: "أ", angle: angles.A },
    B: { x: id_cx + id_r * Math.cos(angles.B), y: id_cy + id_r * Math.sin(angles.B), label: "ب", angle: angles.B },
    C: { x: id_cx + id_r * Math.cos(angles.C), y: id_cy + id_r * Math.sin(angles.C), label: "ج", angle: angles.C },
    D: { x: id_cx + id_r * Math.cos(angles.D), y: id_cy + id_r * Math.sin(angles.D), label: "د", angle: angles.D },
    E: { x: id_cx + id_r * Math.cos(angles.E), y: id_cy + id_r * Math.sin(angles.E), label: "هـ", angle: angles.E }
};

const colors = { center: '#e74c3c', radius: '#27ae60', diameter: '#2980b9', chord: '#f39c12', arc: '#9b59b6', circumference: '#34495e' };

// قاعدة بيانات للقطع التي سيتم التنقل بينها عند النقر المتكرر
const elementsData = {
    center: [ { type: 'point', p: 'M', text: "المركز (م): هي النقطة الثابتة في منتصف الدائرة." } ],
    radius: [
        { type: 'line', p1: 'M', p2: 'A', text: "نصف القطر (م أ): لاحظ أنه يصل بين المركز والمحيط." },
        { type: 'line', p1: 'M', p2: 'B', text: "نصف القطر (م ب): جميع أنصاف الأقطار متساوية الطول." },
        { type: 'line', p1: 'M', p2: 'C', text: "نصف القطر (م ج): يمكنك رسم عدد لا نهائي من أنصاف الأقطار." },
        { type: 'line', p1: 'M', p2: 'D', text: "نصف القطر (م د): قطعة مستقيمة من المركز إلى النقطة د." }
    ],
    diameter: [
        { type: 'line', p1: 'B', p2: 'C', text: "القطر (ب ج): أطول وتر في الدائرة، ويمر بالمركز." }
    ],
    chord: [
        { type: 'line', p1: 'D', p2: 'E', text: "الوتر (د هـ): قطعة مستقيمة تصل بين أي نقطتين على الدائرة." },
        { type: 'line', p1: 'A', p2: 'D', text: "الوتر (أ د): لاحظ أنه لا يمر بالمركز." },
        { type: 'line', p1: 'B', p2: 'C', text: "الوتر (ب ج): هل تعلم أن القطر هو حالة خاصة من الوتر؟" }
    ],
    arc: [
        { type: 'arc', s: angles.D, e: angles.E, text: "القوس (د هـ): هو جزء من محيط الدائرة." },
        { type: 'arc', s: angles.C, e: angles.A, text: "القوس (ج أ): ينحصر بين النقطتين ج و أ." },
        { type: 'arc', s: angles.B, e: angles.D, text: "القوس (ب د): جزء آخر من إطار الدائرة." }
    ],
    circumference: [ { type: 'circle', text: "المحيط: هو الخط المنحني المغلق الذي يمثل طول إطار الدائرة." } ]
};

function highlight(elementName) {
    // زيادة العداد إذا تم النقر على نفس الزر، أو تصفيره إذا تم اختيار زر جديد
    if (currentElement === elementName) {
        cycleIndex++;
    } else {
        currentElement = elementName;
        cycleIndex = 0;
    }
    
    // التأكد من العودة للبداية عند انتهاء الأمثلة المتاحة
    cycleIndex = cycleIndex % elementsData[elementName].length;
    
    const currentItem = elementsData[elementName][cycleIndex];
    descBox.textContent = currentItem.text;
    
    // تلوين الأزرار
    document.querySelectorAll('.list-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.backgroundColor = 'white';
        btn.style.color = '#2c3e50';
        // البحث عن الزر المطابق للتحديد
        if(btn.getAttribute('onclick').includes(elementName)) {
            btn.classList.add('active');
            btn.style.backgroundColor = colors[elementName];
            btn.style.color = 'white';
        }
    });
    drawIdentify();
}

function drawIdentify() {
    idCtx.clearRect(0, 0, idCanvas.width, idCanvas.height);
    
    // رسم الإطار الخارجي
    idCtx.beginPath(); idCtx.arc(id_cx, id_cy, id_r, 0, Math.PI * 2);
    idCtx.strokeStyle = currentElement === 'circumference' ? colors.circumference : '#ecf0f1';
    idCtx.lineWidth = currentElement === 'circumference' ? 6 : 2; idCtx.stroke();

    // رسم العنصر النشط بناءً على دورة النقر
    if (currentElement) {
        idCtx.lineWidth = 6;
        const item = elementsData[currentElement][cycleIndex];
        
        if (item.type === 'point') {
            idCtx.fillStyle = colors[currentElement]; 
            idCtx.beginPath(); idCtx.arc(points[item.p].x, points[item.p].y, 8, 0, 7); idCtx.fill();
        } else if (item.type === 'line') {
            idCtx.strokeStyle = colors[currentElement]; 
            idCtx.beginPath(); 
            idCtx.moveTo(points[item.p1].x, points[item.p1].y); 
            idCtx.lineTo(points[item.p2].x, points[item.p2].y); 
            idCtx.stroke();
        } else if (item.type === 'arc') {
            idCtx.strokeStyle = colors[currentElement]; 
            idCtx.lineWidth = 8; 
            idCtx.beginPath(); idCtx.arc(id_cx, id_cy, id_r, item.s, item.e); idCtx.stroke();
        }
    }

    // رسم النقاط والرموز بحجم كبير وبإزاحة للخارج
    idCtx.font = "bold 26px Arial"; 
    
    Object.values(points).forEach(p => {
        // رسم نقطة صغيرة 
        idCtx.beginPath(); idCtx.arc(p.x, p.y, 5, 0, 7); 
        idCtx.fillStyle = "#34495e"; idCtx.fill();
        
        // حساب الإزاحة (Offset) لضمان عدم تقاطع الحرف مع الرسم
        let textX = p.x;
        let textY = p.y;
        const textOffset = 28; // مسافة الإزاحة بالبكسل للخارج
        
        if (p.label === 'م') {
            textX += 15; textY -= 15; // إزاحة المركز للأعلى قليلاً
            idCtx.textAlign = "right";
            idCtx.textBaseline = "bottom";
        } else {
            textX += Math.cos(p.angle) * textOffset;
            textY += Math.sin(p.angle) * textOffset;
            // محاذاة النص بناءً على مكانه لتجنب التداخل
            idCtx.textAlign = Math.cos(p.angle) > 0 ? "left" : "right";
            idCtx.textBaseline = "middle";
        }
        
        idCtx.fillStyle = "#2c3e50";
        idCtx.fillText(p.label, textX, textY);
    });
}
drawIdentify(); 


// ==========================================
// 3. منطق المستوى 2: تحدي القطر والوتر (تم تطبيق الإزاحة هنا أيضاً)
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
let angle1 = 0.5; 
let angle2 = 2.5; 
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
    exCtx.font = "bold 26px Arial"; 
    exCtx.textAlign = "right"; exCtx.textBaseline = "bottom";
    exCtx.fillText("م", ex_cx - 10, ex_cy - 10);

    const p1 = { x: ex_cx + visualRadius * Math.cos(angle1), y: ex_cy + visualRadius * Math.sin(angle1) };
    const p2 = { x: ex_cx + visualRadius * Math.cos(angle2), y: ex_cy + visualRadius * Math.sin(angle2) };

    const chordPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const chordMM = toMM(chordPx);
    const diamMM = toMM(visualRadius * 2);

    const isDiameter = chordMM >= diamMM - 1;

    // رسم الوتر
    exCtx.beginPath(); exCtx.moveTo(p1.x, p1.y); exCtx.lineTo(p2.x, p2.y);
    exCtx.strokeStyle = isDiameter ? '#27ae60' : '#2980b9';
    exCtx.lineWidth = isDiameter ? 6 : 3; exCtx.stroke();

    // رسم وتسمية النقطة أ بإزاحة
    exCtx.beginPath(); exCtx.arc(p1.x, p1.y, 10, 0, Math.PI * 2); exCtx.fillStyle = '#e74c3c'; exCtx.fill();
    exCtx.fillStyle = '#2c3e50'; 
    exCtx.textAlign = Math.cos(angle1) > 0 ? "left" : "right"; exCtx.textBaseline = "middle";
    exCtx.fillText("أ", p1.x + Math.cos(angle1)*28, p1.y + Math.sin(angle1)*28);
    
    // رسم وتسمية النقطة ب بإزاحة
    exCtx.beginPath(); exCtx.arc(p2.x, p2.y, 10, 0, Math.PI * 2); exCtx.fillStyle = '#e74c3c'; exCtx.fill();
    exCtx.fillStyle = '#2c3e50'; 
    exCtx.textAlign = Math.cos(angle2) > 0 ? "left" : "right"; exCtx.textBaseline = "middle";
    exCtx.fillText("ب", p2.x + Math.cos(angle2)*28, p2.y + Math.sin(angle2)*28);

    document.getElementById('radiusVal').textContent = Math.round(diamMM / 2);
    document.getElementById('diamVal').textContent = diamMM;
    chordDisp.textContent = chordMM;
    
    if (isDiameter) {
        chordTypeDisp.textContent = "قطر";
        chordTypeDisp.style.color = "#27ae60";
        chordDisp.classList.add('is-diameter');
        feedbackMsg.textContent = "أحسنت! الوتر أب يمر بالمركز، فهو قطر";
        feedbackMsg.style.color = "#27ae60";
        
        if (!hasPlayedSound && successSound) {
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

function handlePointerExplore(e) {
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

radiusSlider.addEventListener('input', (e) => { visualRadius = parseInt(e.target.value); drawExplore(); });
exCanvas.addEventListener('mousedown', handlePointerExplore);
window.addEventListener('mousemove', handlePointerExplore, {passive: false});
window.addEventListener('mouseup', () => activePoint = null);
exCanvas.addEventListener('touchstart', handlePointerExplore, {passive: false});
exCanvas.addEventListener('touchmove', handlePointerExplore, {passive: false});
window.addEventListener('touchend', () => activePoint = null);

drawExplore();
