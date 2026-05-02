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

    // إعادة رسم لوحة الفرجار عند فتح المستوى؛ لأن Canvas قد يكون مخفياً وقت التحميل.
    if (tabId === 'compass' && typeof drawCompass === 'function') {
        drawCompass();
    }
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
    exCtx.strokeStyle = isDiam ? systemColors.diameter : systemColors.chord; exCtx.lineWidth = isDiam ? 6 : 4; exCtx.stroke();

    exCtx.font = "bold 26px Arial";
    exCtx.beginPath(); exCtx.arc(p1.x, p1.y, 10, 0, Math.PI * 2); exCtx.fillStyle = '#e74c3c'; exCtx.fill();
    exCtx.fillStyle = '#2c3e50'; exCtx.textAlign = Math.cos(angle1) >= 0 ? "left" : "right"; exCtx.textBaseline = "middle";
    exCtx.fillText("أ", p1.x + Math.cos(angle1)*28, p1.y + Math.sin(angle1)*28);
    
    exCtx.beginPath(); exCtx.arc(p2.x, p2.y, 10, 0, Math.PI * 2); exCtx.fillStyle = '#e74c3c'; exCtx.fill();
    exCtx.fillStyle = '#2c3e50'; exCtx.textAlign = Math.cos(angle2) >= 0 ? "left" : "right"; exCtx.textBaseline = "middle";
    exCtx.fillText("ب", p2.x + Math.cos(angle2)*28, p2.y + Math.sin(angle2)*28);
    
    const radiusMm = Math.round(r * 2 / 3);
    const scaleMmPerPixel = radiusMm / r;
    document.getElementById('radiusVal').textContent = radiusMm; 
    document.getElementById('diamVal').textContent = radiusMm * 2;
    document.getElementById('chordVal').textContent = Math.round(dist * scaleMmPerPixel);
    document.getElementById('chordType').textContent = isDiam ? "قطر" : "وتر";
    const exploreFeedback = document.getElementById('feedbackMsg');
    if (exploreFeedback) {
        exploreFeedback.textContent = isDiam 
            ? "أحسنت! عندما يمر الوتر بالمركز يصبح قطراً." 
            : "حرك النقطتين الحمراوين (أ، ب). إذا مرت القطعة بالمركز أصبحت قطراً.";
        exploreFeedback.className = isDiam ? 'is-diameter' : '';
    }
    
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
    const x = (clientX - rect.left) * (exCanvas.width / rect.width);
    const y = (clientY - rect.top) * (exCanvas.height / rect.height);

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
// 4. المستوى 3: الفرجار الرقمي
// ==========================================
const compassCanvas = document.getElementById('compassCanvas');
const compassCtx = compassCanvas ? compassCanvas.getContext('2d') : null;
const compassRadiusSlider = document.getElementById('compassRadiusSlider');
const compassRadiusVal = document.getElementById('compassRadiusVal');
const compassTargetVal = document.getElementById('compassTargetVal');
const compassFeedback = document.getElementById('compassFeedback');
const compassProgressText = document.getElementById('compassProgressText');
const compassProgressBar = document.getElementById('compassProgressBar');

const compassScale = 35; // كل 35 بكسل = 1 سم على المسطرة الرقمية
const compassBinsCount = 144;
const compassMissionRadii = [4, 3, 5, 6, 3.5, 4.5, 5.5];
let compassMissionIndex = 0;
let compassTargetRadius = compassMissionRadii[compassMissionIndex];
let compassAutoAnimation = null;
let compassPointerId = null;

const compassState = {
    targetCenter: { x: 300, y: 260 },
    center: { x: 300, y: 260 },
    centerPlaced: false,
    openingCm: 2,
    fixed: false,
    drawing: false,
    currentAngle: -Math.PI / 4,
    drawnBins: new Array(compassBinsCount).fill(false),
    completed: false,
    lastPointerAngle: null
};

function isCompassOpeningCorrect() {
    return Math.abs(compassState.openingCm - compassTargetRadius) <= 0.05;
}

function compassOpeningPixels() {
    return compassState.openingCm * compassScale;
}

function setCompassFeedback(message, type = 'info') {
    if (!compassFeedback) return;
    compassFeedback.textContent = message;
    compassFeedback.className = `compass-feedback ${type}`;
}

function getCompassProgress() {
    const marked = compassState.drawnBins.filter(Boolean).length;
    return marked / compassBinsCount;
}

function updateCompassProgress() {
    const percent = Math.round(getCompassProgress() * 100);
    if (compassProgressText) compassProgressText.textContent = `${Math.min(percent, 100)}%`;
    if (compassProgressBar) compassProgressBar.style.width = `${Math.min(percent, 100)}%`;
}

function setCompassStep(id, status) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (status) el.classList.add(status);
}

function updateCompassSteps() {
    const openingDone = compassState.centerPlaced && isCompassOpeningCorrect();
    setCompassStep('compassStepCenter', compassState.centerPlaced ? 'done' : 'active');
    setCompassStep('compassStepOpening', openingDone ? 'done' : (compassState.centerPlaced ? 'active' : ''));
    setCompassStep('compassStepFix', compassState.fixed ? 'done' : (openingDone ? 'active' : ''));
    setCompassStep('compassStepDraw', compassState.completed ? 'done' : (compassState.fixed ? 'active' : ''));
    setCompassStep('compassStepCheck', compassState.completed ? 'done' : '');
}

function drawCompassGrid(ctx) {
    const w = compassCanvas.width;
    const h = compassCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = '#eef3f6';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += compassScale) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += compassScale) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = '#dfe6e9';
    ctx.lineWidth = 2;
    for (let x = compassScale; x <= w; x += compassScale * 2) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = compassScale; y <= h; y += compassScale * 2) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();
}

function drawDigitalRuler(ctx) {
    const startX = 55, y = compassCanvas.height - 45;
    ctx.save();
    ctx.strokeStyle = '#2c3e50';
    ctx.fillStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(startX + 8 * compassScale, y); ctx.stroke();
    for (let i = 0; i <= 8; i++) {
        const x = startX + i * compassScale;
        ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10); ctx.stroke();
        ctx.fillText(String(i), x, y + 15);
    }
    ctx.textAlign = 'left';
    ctx.fillText('سم', startX + 8 * compassScale + 12, y + 15);
    ctx.restore();
}

function drawCompassMissionHeader(ctx) {
    ctx.save();
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`المهمة: ارسم دائرة مركزها م ونصف قطرها ${compassTargetRadius} سم`, compassCanvas.width - 20, 30);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#747d8c';
    ctx.fillText('ابدأ بتثبيت السن في المركز، ثم اضبط الفتحة، ثم أدر القلم دورة كاملة.', compassCanvas.width - 20, 55);
    ctx.restore();
}

function drawCompassTargetCenter(ctx) {
    const c = compassState.targetCenter;
    ctx.save();
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(c.x, c.y, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('م', c.x - 14, c.y - 12);
    ctx.restore();
}

function drawCompassGuides(ctx) {
    if (!compassState.centerPlaced) return;
    const c = compassState.center;
    const rPx = compassOpeningPixels();
    ctx.save();
    ctx.setLineDash([8, 10]);
    ctx.strokeStyle = isCompassOpeningCorrect() ? '#d6eaf8' : '#fdebd0';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(c.x, c.y, rPx, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // نصف القطر المرئي أثناء ضبط الفتحة
    const px = c.x + rPx * Math.cos(compassState.currentAngle);
    const py = c.y + rPx * Math.sin(compassState.currentAngle);
    ctx.strokeStyle = isCompassOpeningCorrect() ? systemColors.radius : '#f39c12';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(px, py); ctx.stroke();
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`نق = ${compassState.openingCm} سم`, (c.x + px) / 2, (c.y + py) / 2 - 12);
    ctx.restore();
}

function drawCompassArcs(ctx) {
    if (!compassState.centerPlaced) return;
    const c = compassState.center;
    const rPx = compassOpeningPixels();
    const step = Math.PI * 2 / compassBinsCount;
    ctx.save();
    ctx.strokeStyle = systemColors.diameter;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < compassState.drawnBins.length; i++) {
        if (!compassState.drawnBins[i]) continue;
        const a1 = i * step;
        const a2 = a1 + step * 0.95;
        ctx.beginPath(); ctx.arc(c.x, c.y, rPx, a1, a2); ctx.stroke();
    }
    ctx.restore();
}

function drawCompassTool(ctx) {
    if (!compassState.centerPlaced) return;
    const c = compassState.center;
    const rPx = compassOpeningPixels();
    const angle = compassState.currentAngle;
    const pencil = { x: c.x + rPx * Math.cos(angle), y: c.y + rPx * Math.sin(angle) };
    const mid = { x: (c.x + pencil.x) / 2, y: (c.y + pencil.y) / 2 };
    const perp = { x: -Math.sin(angle), y: Math.cos(angle) };
    const hingeDistance = Math.max(60, Math.min(110, rPx * 0.55));
    const hinge = { x: mid.x + perp.x * hingeDistance, y: mid.y + perp.y * hingeDistance };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(c.x, c.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(pencil.x, pencil.y); ctx.stroke();

    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(pencil.x, pencil.y); ctx.stroke();

    ctx.fillStyle = '#34495e';
    ctx.beginPath(); ctx.arc(hinge.x, hinge.y, 9, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = systemColors.center;
    ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('سن ثابت', c.x - 12, c.y - 12);

    ctx.fillStyle = '#2980b9';
    ctx.beginPath(); ctx.arc(pencil.x, pencil.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = Math.cos(angle) >= 0 ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('قلم', pencil.x + Math.cos(angle) * 18, pencil.y + Math.sin(angle) * 18);
    ctx.restore();
}

function drawCompassCheck(ctx) {
    if (!compassState.completed) return;
    const c = compassState.center;
    const rPx = compassOpeningPixels();
    ctx.save();
    ctx.fillStyle = 'rgba(39, 174, 96, 0.12)';
    ctx.beginPath(); ctx.arc(c.x, c.y, rPx, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = systemColors.radius;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + rPx, c.y); ctx.stroke();
    ctx.fillStyle = systemColors.radius;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`التحقق: كل نقطة على الدائرة تبعد ${compassTargetRadius} سم عن م`, c.x, c.y + rPx + 28);
    ctx.restore();
}

function drawCompass() {
    if (!compassCtx) return;
    drawCompassGrid(compassCtx);
    drawCompassMissionHeader(compassCtx);
    drawCompassTargetCenter(compassCtx);
    drawDigitalRuler(compassCtx);
    drawCompassGuides(compassCtx);
    drawCompassArcs(compassCtx);
    drawCompassTool(compassCtx);
    drawCompassCheck(compassCtx);
    updateCompassProgress();
    updateCompassSteps();
}

function getCompassCanvasPoint(e) {
    const rect = compassCanvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (compassCanvas.width / rect.width),
        y: (e.clientY - rect.top) * (compassCanvas.height / rect.height)
    };
}

function normalizeAngle(angle) {
    let a = angle % (Math.PI * 2);
    if (a < 0) a += Math.PI * 2;
    return a;
}

function markCompassAngle(angle) {
    const normalized = normalizeAngle(angle);
    const step = Math.PI * 2 / compassBinsCount;
    const idx = Math.floor(normalized / step);
    for (let offset = -3; offset <= 3; offset++) {
        compassState.drawnBins[(idx + offset + compassBinsCount) % compassBinsCount] = true;
    }

    const progress = getCompassProgress();
    if (progress >= 0.93 && !compassState.completed) {
        compassState.completed = true;
        compassState.fixed = true;
        const successSound = document.getElementById('successSound');
        if (successSound) { successSound.currentTime = 0; successSound.play().catch(() => {}); }
        setCompassFeedback(`اكتملت الدائرة! الفتحة بقيت ثابتة، ونصف القطر = ${compassTargetRadius} سم.`, 'success');
    }
}

function handleCompassPointerDown(e) {
    if (!compassCanvas || compassState.completed) return;
    const pos = getCompassCanvasPoint(e);
    const target = compassState.targetCenter;

    if (!compassState.centerPlaced) {
        const d = Math.hypot(pos.x - target.x, pos.y - target.y);
        if (d <= 45) {
            compassState.centerPlaced = true;
            compassState.center = { ...target };
            setCompassFeedback('تم تحديد المركز م. الآن اضبط فتحة الفرجار لتساوي نصف القطر المطلوب.', 'success');
        } else {
            setCompassFeedback('حاول أن تضغط على النقطة المعلّمة م؛ سن الفرجار يجب أن يبدأ من المركز.', 'warning');
        }
        drawCompass();
        return;
    }

    if (!compassState.fixed) {
        setCompassFeedback(isCompassOpeningCorrect()
            ? 'الفتحة صحيحة. اضغط زر «ثبت سن الفرجار» قبل تدوير القلم.'
            : `اضبط الفتحة أولاً: المطلوب ${compassTargetRadius} سم، والفتحة الحالية ${compassState.openingCm} سم.`, 'warning');
        return;
    }

    const rPx = compassOpeningPixels();
    const d = Math.hypot(pos.x - compassState.center.x, pos.y - compassState.center.y);
    if (Math.abs(d - rPx) <= 70) {
        compassPointerId = e.pointerId;
        compassCanvas.setPointerCapture(compassPointerId);
        compassState.drawing = true;
        const angle = Math.atan2(pos.y - compassState.center.y, pos.x - compassState.center.x);
        compassState.currentAngle = angle;
        compassState.lastPointerAngle = angle;
        markCompassAngle(angle);
        setCompassFeedback('استمر في تدوير القلم حول المركز حتى تكتمل الدورة.', 'info');
        drawCompass();
    } else {
        setCompassFeedback('اقترب من طرف القلم على محيط الفتحة، ثم اسحب حول المركز.', 'warning');
    }
}

function handleCompassPointerMove(e) {
    if (!compassState.drawing || compassState.completed) return;
    if (e.cancelable) e.preventDefault();
    const pos = getCompassCanvasPoint(e);
    const rPx = compassOpeningPixels();
    const d = Math.hypot(pos.x - compassState.center.x, pos.y - compassState.center.y);

    if (Math.abs(d - rPx) > 95) {
        setCompassFeedback('حافظ على الفتحة ثابتة: حرّك القلم قريباً من مسار الدائرة.', 'warning');
        return;
    }

    const angle = Math.atan2(pos.y - compassState.center.y, pos.x - compassState.center.x);
    compassState.currentAngle = angle;
    compassState.lastPointerAngle = angle;
    markCompassAngle(angle);
    drawCompass();
}

function handleCompassPointerUp() {
    compassState.drawing = false;
    if (compassPointerId !== null && compassCanvas) {
        try { compassCanvas.releasePointerCapture(compassPointerId); } catch (err) {}
        compassPointerId = null;
    }
    updateCompassSteps();
}

function updateCompassOpeningFromSlider() {
    if (!compassRadiusSlider) return;
    compassState.openingCm = parseFloat(compassRadiusSlider.value);
    if (compassRadiusVal) compassRadiusVal.textContent = compassState.openingCm.toString();

    if (compassState.fixed || compassState.completed || getCompassProgress() > 0) {
        compassState.fixed = false;
        compassState.completed = false;
        compassState.drawnBins = new Array(compassBinsCount).fill(false);
        setCompassFeedback('تغيّرت فتحة الفرجار؛ أعد تثبيت السن ثم ابدأ الرسم من جديد.', 'warning');
    } else if (!compassState.centerPlaced) {
        setCompassFeedback('حدّد المركز م أولاً، ثم اضبط فتحة الفرجار.', 'info');
    } else if (isCompassOpeningCorrect()) {
        setCompassFeedback('الفتحة صحيحة. تذكّر: فتحة الفرجار تمثل نصف القطر فقط.', 'success');
    } else {
        setCompassFeedback(`الفتحة الحالية ${compassState.openingCm} سم. عدّلها حتى تصبح ${compassTargetRadius} سم.`, 'warning');
    }
    drawCompass();
}

function fixCompassNeedle() {
    if (!compassState.centerPlaced) {
        setCompassFeedback('الخطوة الأولى: اضغط على المركز م لتثبيت السن.', 'warning');
        drawCompass();
        return;
    }
    if (!isCompassOpeningCorrect()) {
        setCompassFeedback(`لا تثبّت بعد: فتحة الفرجار يجب أن تساوي ${compassTargetRadius} سم.`, 'warning');
        drawCompass();
        return;
    }
    compassState.fixed = true;
    compassState.completed = false;
    compassState.drawnBins = new Array(compassBinsCount).fill(false);
    setCompassFeedback('السن ثابت في المركز م. اسحب طرف القلم حول المركز دورة كاملة.', 'success');
    drawCompass();
}

function resetCompass() {
    if (compassAutoAnimation) cancelAnimationFrame(compassAutoAnimation);
    compassAutoAnimation = null;
    compassState.centerPlaced = false;
    compassState.center = { ...compassState.targetCenter };
    compassState.openingCm = 2;
    compassState.fixed = false;
    compassState.drawing = false;
    compassState.currentAngle = -Math.PI / 4;
    compassState.drawnBins = new Array(compassBinsCount).fill(false);
    compassState.completed = false;
    compassState.lastPointerAngle = null;
    if (compassRadiusSlider) compassRadiusSlider.value = compassState.openingCm;
    if (compassRadiusVal) compassRadiusVal.textContent = compassState.openingCm.toString();
    setCompassFeedback('اضغط على النقطة المعلّمة م لتثبيت سن الفرجار.', 'info');
    drawCompass();
}

function newCompassMission() {
    compassMissionIndex = (compassMissionIndex + 1) % compassMissionRadii.length;
    compassTargetRadius = compassMissionRadii[compassMissionIndex];
    if (compassTargetVal) compassTargetVal.textContent = compassTargetRadius.toString();
    resetCompass();
}

function animateCompassDraw() {
    if (!compassState.centerPlaced || !isCompassOpeningCorrect()) {
        setCompassFeedback('أكمل أولاً: حدّد المركز واضبط الفتحة الصحيحة.', 'warning');
        drawCompass();
        return;
    }
    if (!compassState.fixed) {
        compassState.fixed = true;
    }
    compassState.completed = false;
    compassState.drawnBins = new Array(compassBinsCount).fill(false);
    let steps = 0;
    const totalSteps = 100;
    function tick() {
        const angle = -Math.PI / 4 + (steps / totalSteps) * Math.PI * 2;
        compassState.currentAngle = angle;
        markCompassAngle(angle);
        drawCompass();
        steps++;
        if (steps <= totalSteps && !compassState.completed) {
            compassAutoAnimation = requestAnimationFrame(tick);
        } else {
            compassAutoAnimation = null;
            if (!compassState.completed) {
                compassState.completed = true;
                setCompassFeedback(`اكتملت الدائرة بالنموذج التلقائي. جرّب الآن بنفسك.`, 'success');
                drawCompass();
            }
        }
    }
    setCompassFeedback('يعرض المختبر الآن طريقة تدوير الفرجار دورة كاملة.', 'info');
    compassAutoAnimation = requestAnimationFrame(tick);
}

if (compassCanvas) {
    compassCanvas.addEventListener('pointerdown', handleCompassPointerDown);
    compassCanvas.addEventListener('pointermove', handleCompassPointerMove);
    compassCanvas.addEventListener('pointerup', handleCompassPointerUp);
    compassCanvas.addEventListener('pointerleave', handleCompassPointerUp);
}
if (compassRadiusSlider) {
    compassRadiusSlider.addEventListener('input', updateCompassOpeningFromSlider);
}
if (compassTargetVal) compassTargetVal.textContent = compassTargetRadius.toString();
if (compassRadiusVal) compassRadiusVal.textContent = compassState.openingCm.toString();
drawCompass();

// ==========================================
// 5. المستوى 4: الاختبار والمحرك الديناميكي للبيانات (JSON-like Data)
// ==========================================
const qzCanvas = document.getElementById('quizCanvas');
const qzCtx = qzCanvas.getContext('2d');
let correctScore = 0, wrongScore = 0, currentQuestionIndex = 0;

// قاعدة بيانات الأسئلة (10 أسئلة موزعة على شكلين)
const quizData = [
    // أسئلة الشكل الأول (المركز م)
    { shape: 1, text: "في الشكل المجاور، ماذا تسمى القطعة المستقيمة (م أ)؟", options: ["وتراً", "نصف قطر", "قطراً"], correct: 1, hl: {type:'line', p1:'M', p2:'A', c:systemColors.radius} },
    { shape: 1, text: "القطعة (د هـ) تصل بين نقطتين ولا تمر بالمركز، تسمى:", options: ["قوساً", "وتراً", "قطراً"], correct: 1, hl: {type:'line', p1:'D', p2:'E', c:systemColors.chord} },
    { shape: 1, text: "أي من القطع التالية يمثل أطول وتر في الدائرة؟", options: ["(م أ)", "(د هـ)", "(ب ج)"], correct: 2, hl: {type:'line', p1:'B', p2:'C', c:systemColors.diameter} },
    { shape: 1, text: "الجزء المنحني المحصور بين النقطتين (د) و (هـ) على الدائرة يسمى:", options: ["قوساً", "محيطاً", "وتراً"], correct: 0, hl: {type:'arc', s:3.8, e:5.2, c:systemColors.arc} },
    { shape: 1, text: "تطبيق: إذا كان طول (م أ) = 5 سم، فكم يكون طول القطر (ب ج)؟", options: ["5 سم", "10 سم", "2.5 سم"], correct: 1, hl: {type:'line', p1:'B', p2:'C', c:systemColors.diameter} },
    
    // أسئلة الشكل الثاني (المركز ن) متقدم قليلاً
    { shape: 2, text: "انتقلنا لشكل جديد مركزه (ن). أي القطع التالية تمثل نصف قطر؟", options: ["(س ص)", "(ن و)", "(ع ل)"], correct: 1, hl: {type:'line', p1:'N', p2:'W', c:systemColors.radius} },
    { shape: 2, text: "القطعة (س ص) تمر بالمركز (ن)، إذن هي:", options: ["وتر فقط", "قوس", "قطر"], correct: 2, hl: {type:'line', p1:'S', p2:'Y', c:systemColors.diameter} },
    { shape: 2, text: "القطعة المتقاطعة (ع ل) لا تمر بالمركز، ماذا نسميها؟", options: ["قطر", "وتر", "نصف قطر"], correct: 1, hl: {type:'line', p1:'X', p2:'L', c:systemColors.chord} },
    { shape: 2, text: "كم عدد أنصاف الأقطار المرسومة بوضوح في هذا الشكل؟", options: ["1", "2", "3"], correct: 2, hl: {type:'multi_radius'} }, // ن س، ن ص، ن و
    { shape: 2, text: "تحدي: إذا كان طول القطر (س ص) = 14 سم، فما طول نصف القطر (ن و)؟", options: ["7 سم", "14 سم", "28 سم"], correct: 0, hl: {type:'line', p1:'N', p2:'W', c:systemColors.radius} }
];

// تغذية راجعة تفسيرية لكل اختيار في الاختبار
// كل مصفوفة فرعية مرتبة بنفس ترتيب اختيارات السؤال.
const quizFeedback = [
    [
        "ليست وتراً؛ لأن الوتر يصل بين نقطتين على الدائرة، أما القطعة (م أ) فتبدأ من المركز.",
        "صحيح؛ القطعة (م أ) نصف قطر لأنها تصل المركز (م) بنقطة على الدائرة.",
        "ليست قطراً؛ لأن القطر يصل بين نقطتين على الدائرة ويمر بالمركز، أما (م أ) فهي من المركز إلى نقطة واحدة على الدائرة."
    ],
    [
        "ليست قوساً؛ لأن القوس جزء منحني من المحيط، أما (د هـ) فهي قطعة مستقيمة.",
        "صحيح؛ القطعة (د هـ) وتر لأنها تصل بين نقطتين على الدائرة ولا يشترط أن تمر بالمركز.",
        "ليست قطراً؛ لأن القطر يجب أن يمر بالمركز، والقطعة (د هـ) لا تمر بالمركز."
    ],
    [
        "القطعة (م أ) نصف قطر؛ لأنها تبدأ من المركز وتنتهي عند نقطة على الدائرة، لذلك ليست أطول وتر.",
        "القطعة (د هـ) وتر، لكنها ليست أطول وتر لأنها لا تمر بالمركز.",
        "صحيح؛ القطعة (ب ج) قطر، والقطر هو أطول وتر لأنه يمر بالمركز."
    ],
    [
        "صحيح؛ الجزء المنحني بين النقطتين (د) و(هـ) يسمى قوساً.",
        "ليس محيطاً كاملاً؛ لأنه جزء فقط من المحيط وليس الدائرة كلها.",
        "ليس وتراً؛ لأن الوتر قطعة مستقيمة، أما الجزء المعروض فهو منحني."
    ],
    [
        "هذه قيمة نصف القطر، وليست القطر. القطر يساوي ضعفي نصف القطر.",
        "صحيح؛ القطر = ٢ × نصف القطر = ٢ × ٥ = ١٠ سم.",
        "هذه قيمة أصغر من نصف القطر. المطلوب حساب القطر، أي مضاعفة نصف القطر."
    ],
    [
        "القطعة (س ص) قطر؛ لأنها تصل بين نقطتين على الدائرة وتمر بالمركز (ن).",
        "صحيح؛ القطعة (ن و) نصف قطر لأنها تبدأ من المركز (ن) وتنتهي عند نقطة على الدائرة.",
        "القطعة (ع ل) وتر؛ لأنها تصل بين نقطتين على الدائرة ولا تبدأ من المركز."
    ],
    [
        "هي وتر، لكنها ليست وتراً فقط؛ لأنها تمر بالمركز، لذلك تسمى قطراً.",
        "ليست قوساً؛ لأن القوس جزء منحني من المحيط، أما (س ص) فهي قطعة مستقيمة.",
        "صحيح؛ القطعة (س ص) قطر لأنها تصل بين نقطتين على الدائرة وتمر بالمركز (ن)."
    ],
    [
        "ليست قطراً؛ لأن القطر يجب أن يمر بالمركز، والقطعة (ع ل) لا تمر بالمركز.",
        "صحيح؛ القطعة (ع ل) وتر لأنها تصل بين نقطتين على الدائرة.",
        "ليست نصف قطر؛ لأن نصف القطر يبدأ من المركز وينتهي عند نقطة على الدائرة."
    ],
    [
        "يوجد أكثر من نصف قطر؛ لاحظ أن القطر (س ص) يحتوي على نصفين: (ن س) و(ن ص)، ومعهما (ن و).",
        "إجابة قريبة، لكن يوجد نصف قطر ثالث هو (ن و)، إضافة إلى (ن س) و(ن ص).",
        "صحيح؛ أنصاف الأقطار المرسومة هي: (ن س)، (ن ص)، و(ن و)."
    ],
    [
        "صحيح؛ نصف القطر = القطر ÷ ٢ = ١٤ ÷ ٢ = ٧ سم.",
        "هذه قيمة القطر، وليست نصف القطر. نصف القطر يساوي القطر ÷ ٢.",
        "هذه قيمة ضعف القطر، بينما المطلوب هو نصف القطر: القطر ÷ ٢."
    ]
];

quizData.forEach((question, index) => {
    question.feedback = quizFeedback[index];
});

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
    
    const successSound = document.getElementById('successSound');
    const failSound = document.getElementById('failSound');

    if (isCorrect) {
        correctScore++; btn.classList.add('correct');
        if(successSound) { successSound.currentTime=0; successSound.play().catch(()=>{}); }
    } else {
        wrongScore++; btn.classList.add('wrong');
        parent.children[qData.correct].classList.add('correct'); // إظهار الصح
        if(failSound) { failSound.currentTime=0; failSound.play().catch(()=>{}); }
    }


    // عرض التغذية الراجعة التفسيرية المناسبة لاختيار الطالب
    const feedbackBox = document.getElementById('feedback' + qIndex);
    const explanation = qData.feedback && qData.feedback[selectedOptionIndex]
        ? qData.feedback[selectedOptionIndex]
        : (isCorrect ? 'إجابة صحيحة.' : 'راجع العنصر المضاء في الرسم وحاول تفسير السبب.');

    feedbackBox.innerHTML = `
        <span class="feedback-title">${isCorrect ? 'أحسنت! إجابة صحيحة ✅' : 'إجابة غير صحيحة، والتفسير هو:'}</span>
        <span>${explanation}</span>
        <span class="mini-rule">انظر إلى العنصر المضاء في الرسم لتثبيت الفكرة.</span>
    `;
    feedbackBox.className = `answer-feedback show ${isCorrect ? 'correct-feedback' : 'wrong-feedback'}`;
    
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
