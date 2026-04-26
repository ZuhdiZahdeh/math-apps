const canvas = document.getElementById('circleCanvas');
const ctx = canvas.getContext('2d');
const radiusSlider = document.getElementById('radiusSlider');
const radiusDisp = document.getElementById('radiusVal');
const diamDisp = document.getElementById('diamVal');
const chordDisp = document.getElementById('chordVal');
const feedbackMsg = document.getElementById('feedbackMsg');
const successSound = document.getElementById('successSound'); // جلب عنصر الصوت

// الحالة الابتدائية
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let visualRadius = parseInt(radiusSlider.value);
let angle1 = 0; // زاوية النقطة الأولى
let angle2 = Math.PI; // زاوية النقطة الثانية
let activePoint = null;
let hasPlayedSound = false; // لمنع تكرار الصوت بشكل مزعج

// التحويل من بكسل إلى ملم (لأغراض تعليمية: 150 بكسل = 50 ملم)
const scale = 50 / 150; 

function toMM(pixels) {
    return Math.round(pixels * scale);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. رسم الدائرة
    ctx.beginPath();
    ctx.arc(centerX, centerY, visualRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#dfe6e9';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. رسم المركز
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    ctx.fillText("م", centerX - 15, centerY - 10);

    // حساب إحداثيات النقاط
    const p1 = {
        x: centerX + visualRadius * Math.cos(angle1),
        y: centerY + visualRadius * Math.sin(angle1)
    };
    const p2 = {
        x: centerX + visualRadius * Math.cos(angle2),
        y: centerY + visualRadius * Math.sin(angle2)
    };

    // حساب الأطوال
    const chordPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const chordMM = toMM(chordPx);
    const diamMM = toMM(visualRadius * 2);
    const radMM = Math.round(diamMM / 2);

    // السماحية للقطر (ملم واحد لتسهيل التطابق للطلاب)
    const isDiameter = chordMM >= diamMM - 1;

    // 3. رسم الوتر
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = isDiameter ? '#27ae60' : '#2980b9';
    ctx.lineWidth = isDiameter ? 5 : 3;
    ctx.stroke();

    // 4. رسم نقاط التحكم
    [p1, p2].forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
    });

    // تحديث لوحة البيانات
    radiusDisp.textContent = radMM;
    diamDisp.textContent = diamMM;
    chordDisp.textContent = chordMM;
    
    // إدارة الرسائل والصوت
    if (isDiameter) {
        chordDisp.classList.add('is-diameter');
        feedbackMsg.textContent = "رائع! الوتر يمر بالمركز، فهو قطر (أطول وتر)";
        feedbackMsg.style.color = "#27ae60";
        
        // تشغيل الصوت لمرة واحدة عند التطابق
        if (!hasPlayedSound) {
            // استخدام catch لمعالجة رفض المتصفح للتشغيل التلقائي قبل تفاعل المستخدم
            successSound.currentTime = 0; // إعادة الصوت للبداية
            successSound.play().catch(e => console.log("بانتظار تفاعل المستخدم للتشغيل")); 
            hasPlayedSound = true;
        }
    } else {
        chordDisp.classList.remove('is-diameter');
        feedbackMsg.textContent = "حرك النقاط لتقترب من المركز وتلاحظ زيادة طول الوتر";
        feedbackMsg.style.color = "#2c3e50";
        
        // إعادة تهيئة حالة الصوت عند الابتعاد عن المركز
        hasPlayedSound = false; 
    }
}

// التعامل مع السحب (اللمس أو الماوس)
function handlePointer(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (e.type === 'mousedown' || e.type === 'touchstart') {
        const p1x = centerX + visualRadius * Math.cos(angle1);
        const p1y = centerY + visualRadius * Math.sin(angle1);
        const p2x = centerX + visualRadius * Math.cos(angle2);
        const p2y = centerY + visualRadius * Math.sin(angle2);

        if (Math.hypot(x - p1x, y - p1y) < 30) activePoint = 1;
        else if (Math.hypot(x - p2x, y - p2y) < 30) activePoint = 2;
    } else if (activePoint && (e.type === 'mousemove' || e.type === 'touchmove')) {
        // منع السحب من تمرير الشاشة على الهواتف
        if(e.cancelable) e.preventDefault(); 
        
        const newAngle = Math.atan2(y - centerY, x - centerX);
        if (activePoint === 1) angle1 = newAngle;
        else angle2 = newAngle;
        draw();
    }
}

function stopPointer() { activePoint = null; }

// الأحداث والمستمعات
radiusSlider.addEventListener('input', (e) => {
    visualRadius = parseInt(e.target.value);
    draw();
});

canvas.addEventListener('mousedown', handlePointer);
window.addEventListener('mousemove', handlePointer, {passive: false});
window.addEventListener('mouseup', stopPointer);

canvas.addEventListener('touchstart', handlePointer, {passive: false});
canvas.addEventListener('touchmove', handlePointer, {passive: false});
window.addEventListener('touchend', stopPointer);

// التشغيل الأول لرسم الحالة الابتدائية
draw();
