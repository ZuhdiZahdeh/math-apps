// ==========================================
// إعدادات الربط مع Apps Script Web App
// ==========================================
const LAB_CONFIG = {
    labId: 'circle-geometry-grade6',
    labVersion: '1.2.0-distributed-questions',

    // ضع هنا رابط Apps Script Web App بعد النشر، ويجب أن ينتهي غالباً بـ /exec
    webAppUrl: 'https://script.google.com/macros/s/AKfycbxTMtpl4A1lnRMt8fYT-0SoB3_2ai4wyaY9H3rc1f5dA6Gon0tNZ0rr_9MfU6Gtw-DM/exec',

    // يجب أن يطابق قيمة Script Property باسم LAB_SECRET في Apps Script
    token: 'circle-lab-2026',

    // true مناسب عند تشغيل المختبر كملف HTML مستقل أو من استضافة مختلفة عن Apps Script.
    // في هذا الوضع يرسل المتصفح الطلب دون قراءة رد الخادم بسبب قيود CORS.
    useNoCors: true,

    passScore: 7
};

const labState = {
    sessionId: createSessionId(),
    studentCode: '',
    className: '',
    startedAt: new Date(),
    submitted: false,

    quiz: {
        answers: []
    },

    compass: {
        attempts: 0,
        centerMisses: 0,
        openingErrors: 0,
        pathWarnings: 0,
        autoDemoUsed: false,
        lastPathWarningAt: 0
    },

    events: [],

    // نتائج لعبة الذاكرة المرفقة مع نتيجة الطالب النهائية
    memory: {
        levels: [],
        completedLevels: 0,
        totalAttempts: 0,
        totalWrongMatches: 0,
        totalTimeSpentSeconds: 0,
        feedbackSummary: []
    }
};

// الألوان المعتمدة لكل عنصر
const systemColors = {
    center: '#e74c3c',
    radius: '#27ae60',
    diameter: '#2980b9',
    chord: '#f39c12',
    arc: '#9b59b6',
    circumference: '#34495e'
};

function createSessionId() {
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    const timePart = Date.now().toString(36).toUpperCase();
    return `CL-${timePart}-${randomPart}`;
}

function nowIso() {
    return new Date().toISOString();
}

function elapsedSeconds() {
    return Math.round((new Date() - labState.startedAt) / 1000);
}

function sanitizeClientText(value, maxLength) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength || 100);
}

function addLabEvent(eventType, levelId, value, extra = {}) {
    labState.events.push({
        eventType: sanitizeClientText(eventType, 80),
        levelId: sanitizeClientText(levelId, 40),
        value: sanitizeClientText(value, 180),
        extra,
        elapsedAtSecond: elapsedSeconds()
    });
}

function recordMemoryGameResult(result) {
    if (!result) return;

    const safeResult = {
        levelId: sanitizeClientText(result.levelId || '', 60),
        levelTitle: sanitizeClientText(result.levelTitle || '', 120),
        attempts: Number(result.attempts || 0),
        wrongMatches: Number(result.wrongMatches || 0),
        matchedPairs: Number(result.matchedPairs || 0),
        totalPairs: Number(result.totalPairs || 0),
        timeSpentSeconds: Number(result.timeSpentSeconds || 0),
        accuracyPercent: Number(result.accuracyPercent || 0),
        completed: Boolean(result.completed),
        feedbackSummary: Array.isArray(result.feedbackSummary)
            ? result.feedbackSummary.map(item => sanitizeClientText(item, 220)).slice(0, 8)
            : []
    };

    // إذا أعاد الطالب نفس مستوى الذاكرة، نحتفظ بآخر نتيجة لذلك المستوى بدل التكرار.
    const existingIndex = labState.memory.levels.findIndex(level => level.levelId === safeResult.levelId);
    if (existingIndex >= 0) {
        labState.memory.levels[existingIndex] = safeResult;
    } else {
        labState.memory.levels.push(safeResult);
    }

    labState.memory.completedLevels = labState.memory.levels.filter(level => level.completed).length;
    labState.memory.totalAttempts = labState.memory.levels.reduce((sum, level) => sum + Number(level.attempts || 0), 0);
    labState.memory.totalWrongMatches = labState.memory.levels.reduce((sum, level) => sum + Number(level.wrongMatches || 0), 0);
    labState.memory.totalTimeSpentSeconds = labState.memory.levels.reduce((sum, level) => sum + Number(level.timeSpentSeconds || 0), 0);

    safeResult.feedbackSummary.forEach(item => {
        if (item && !labState.memory.feedbackSummary.includes(item)) {
            labState.memory.feedbackSummary.push(item);
        }
    });

    labState.memory.feedbackSummary = labState.memory.feedbackSummary.slice(0, 12);

    addLabEvent('memory_result_recorded', 'memory', `تم تسجيل نتيجة لعبة الذاكرة: ${safeResult.levelTitle}`, {
        levelId: safeResult.levelId,
        attempts: safeResult.attempts,
        wrongMatches: safeResult.wrongMatches,
        matchedPairs: safeResult.matchedPairs,
        totalPairs: safeResult.totalPairs,
        accuracyPercent: safeResult.accuracyPercent,
        feedbackSummary: safeResult.feedbackSummary
    });
}

window.recordMemoryGameResult = recordMemoryGameResult;

function loadSavedIdentity() {
    try {
        const saved = JSON.parse(localStorage.getItem('circleLab.identity') || '{}');
        const studentInput = document.getElementById('studentCode');
        const classInput = document.getElementById('className');

        if (saved.studentCode && studentInput) studentInput.value = saved.studentCode;
        if (saved.className && classInput) classInput.value = saved.className;

        if (saved.studentCode && saved.className) {
            labState.studentCode = saved.studentCode;
            labState.className = saved.className;
            const info = document.getElementById('sessionInfo');
            if (info) {
                info.textContent = `بيانات محفوظة: ${labState.studentCode} / ${labState.className}. يمكنك تعديلها قبل الاختبار.`;
                info.style.color = '#2980b9';
            }
        }
    } catch (err) {
        console.warn('تعذر قراءة بيانات الطالب المحفوظة.', err);
    }
}

function startLabSession() {
    const studentInput = document.getElementById('studentCode');
    const classInput = document.getElementById('className');
    const info = document.getElementById('sessionInfo');

    labState.studentCode = sanitizeClientText(studentInput ? studentInput.value : '', 60);
    labState.className = sanitizeClientText(classInput ? classInput.value : '', 20);

    if (!labState.studentCode || !labState.className) {
        if (info) {
            info.textContent = 'يرجى إدخال اسم الطالب والشعبة قبل إرسال النتيجة.';
            info.style.color = '#e74c3c';
        }
        return false;
    }

    try {
        localStorage.setItem('circleLab.identity', JSON.stringify({
            studentCode: labState.studentCode,
            className: labState.className
        }));
    } catch (err) {
        console.warn('تعذر حفظ بيانات الطالب محلياً.', err);
    }

    addLabEvent('student_ready', 'general', 'تم إدخال اسم الطالب والشعبة', {
        studentCode: labState.studentCode,
        className: labState.className
    });

    if (info) {
        info.textContent = `جلسة نشطة: ${labState.studentCode} / ${labState.className}`;
        info.style.color = '#27ae60';
    }

    return true;
}

function isWebAppConfigured() {
    return Boolean(
        LAB_CONFIG.webAppUrl &&
        LAB_CONFIG.webAppUrl.startsWith('https://') &&
        !LAB_CONFIG.webAppUrl.includes('ضع_رابط')
    );
}

function setSubmitStatus(message, type = 'pending') {
    const statusBox = document.getElementById('submitStatus');
    if (!statusBox) return;

    statusBox.textContent = message;
    statusBox.className = `submit-status ${type}`;
}

function buildSubmissionPayload() {
    const studentInput = document.getElementById('studentCode');
    const classInput = document.getElementById('className');

    labState.studentCode = sanitizeClientText(
        labState.studentCode || (studentInput ? studentInput.value : ''),
        60
    );

    labState.className = sanitizeClientText(
        labState.className || (classInput ? classInput.value : ''),
        20
    );

    const answers = labState.quiz.answers.filter(Boolean);
    const wrongAnswers = answers.filter(a => !a.isCorrect);

    const misconceptions = Array.from(
        new Set(
            wrongAnswers
                .map(a => a.misconception)
                .filter(Boolean)
        )
    );

    const totalQuestions = quizData.length;
    const score = correctScore;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const compassProgress = typeof getCompassProgress === 'function' ? Math.round(getCompassProgress() * 100) : 0;

    return {
        token: LAB_CONFIG.token,
        labId: LAB_CONFIG.labId,
        labVersion: LAB_CONFIG.labVersion,
        sessionId: labState.sessionId,
        studentCode: labState.studentCode,
        className: labState.className,
        startedAt: labState.startedAt.toISOString(),
        submittedAt: nowIso(),
        timeSpentSeconds: elapsedSeconds(),
        userAgent: navigator.userAgent,

        quiz: {
            score,
            totalQuestions,
            percentage,
            answeredQuestions: answers.length,
            levelSummary: typeof getLevelSummary === 'function' ? getLevelSummary() : {},
            wrongQuestions: wrongAnswers.map(a => a.questionIndex),
            misconceptions,
            answers
        },

        compass: {
            targetRadiusCm: typeof compassTargetRadius !== 'undefined' ? compassTargetRadius : '',
            completed: typeof compassState !== 'undefined' ? Boolean(compassState.completed) : false,
            completionPercent: typeof compassState !== 'undefined' && compassState.completed ? 100 : compassProgress,
            attempts: labState.compass.attempts,
            centerMisses: labState.compass.centerMisses,
            openingErrors: labState.compass.openingErrors,
            pathWarnings: labState.compass.pathWarnings,
            autoDemoUsed: labState.compass.autoDemoUsed
        },

        memory: labState.memory,

        // حقول مختصرة مسطّحة لتسهيل قراءتها في Apps Script أو Google Sheets لاحقاً
        memoryCompletedLevels: labState.memory.completedLevels,
        memoryTotalAttempts: labState.memory.totalAttempts,
        memoryWrongMatches: labState.memory.totalWrongMatches,
        memoryTimeSpentSeconds: labState.memory.totalTimeSpentSeconds,
        memoryFeedbackSummary: labState.memory.feedbackSummary.join(' | '),
        memoryLevelsSummary: labState.memory.levels.map(level =>
            `${level.levelTitle}: ${level.matchedPairs}/${level.totalPairs}, محاولات=${level.attempts}, أخطاء=${level.wrongMatches}, زمن=${level.timeSpentSeconds}ث`
        ).join(' || '),

        events: labState.events
    };
}

async function sendPayloadToCollector(payload) {
    if (!isWebAppConfigured()) {
        throw new Error('لم يتم ضبط رابط Apps Script Web App داخل LAB_CONFIG.webAppUrl.');
    }

    if (LAB_CONFIG.useNoCors) {
        await fetch(LAB_CONFIG.webAppUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });
        return { ok: true, opaque: true };
    }

    const response = await fetch(LAB_CONFIG.webAppUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.ok === false) {
        throw new Error(data.error || `فشل الإرسال. رمز الاستجابة: ${response.status}`);
    }

    return data;
}

async function submitLabResults() {
    if (labState.submitted) {
        setSubmitStatus('تم إرسال هذه المحاولة مسبقاً. عند إعادة التجربة ستنشأ جلسة جديدة.', 'success');
        return;
    }

    if (!startLabSession()) {
        setSubmitStatus('لم يتم الإرسال: يرجى إدخال اسم الطالب والشعبة أولاً.', 'error');
        return;
    }

    if (typeof isAssessmentComplete === 'function' && !isAssessmentComplete()) {
        const answered = typeof getAnsweredCount === 'function' ? getAnsweredCount() : 0;
        const total = typeof quizData !== 'undefined' ? quizData.length : 0;
        setSubmitStatus(`لم يتم الإرسال: أكمل أسئلة التحقق في جميع المستويات أولاً. الإجابات الحالية ${answered} من ${total}.`, 'error');
        return;
    }

    const missingBox = document.getElementById('missingLevelsBox');
    if (missingBox) missingBox.innerHTML = '';

    addLabEvent('submission_started', 'summary', 'بدأ إرسال النتائج إلى لوحة المعلم');
    const payload = buildSubmissionPayload();
    savePendingSubmission(payload);

    if (!isWebAppConfigured()) {
        setSubmitStatus('النتيجة حُفظت محلياً، لكن رابط Apps Script Web App لم يتم ضبطه بعد داخل ملف script.js.', 'error');
        return;
    }

    setSubmitStatus('جارٍ إرسال النتيجة إلى لوحة بيانات المعلم...', 'pending');

    try {
        await sendPayloadToCollector(payload);
        labState.submitted = true;
        clearPendingSubmission(payload.sessionId);
        setSubmitStatus('تم إرسال طلب النتيجة إلى لوحة بيانات المعلم. تحقق من Google Sheets للتأكيد.', 'success');
    } catch (err) {
        console.error(err);
        setSubmitStatus('تعذر الإرسال الآن. حُفظت النتيجة محلياً وستُعاد المحاولة عند توفر الاتصال.', 'error');
    }
}

function savePendingSubmission(payload) {
    try {
        const key = 'circleLab.pendingSubmissions';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const withoutDuplicate = existing.filter(item => item.sessionId !== payload.sessionId);
        withoutDuplicate.push(payload);
        localStorage.setItem(key, JSON.stringify(withoutDuplicate));
    } catch (err) {
        console.warn('تعذر حفظ الإرسال محلياً.', err);
    }
}

function clearPendingSubmission(sessionId) {
    try {
        const key = 'circleLab.pendingSubmissions';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = existing.filter(item => item.sessionId !== sessionId);
        localStorage.setItem(key, JSON.stringify(updated));
    } catch (err) {
        console.warn('تعذر حذف الإرسال المحلي.', err);
    }
}

async function retryPendingSubmissions(manual = false) {
    try {
        if (!isWebAppConfigured()) {
            if (manual) {
                setSubmitStatus('لا يمكن إعادة الإرسال: ضع رابط Apps Script Web App في ملف script.js أولاً.', 'error');
            }
            return;
        }

        const key = 'circleLab.pendingSubmissions';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');

        if (!existing.length) {
            if (manual) {
                setSubmitStatus('لا توجد نتائج محفوظة تحتاج إلى إعادة إرسال.', 'success');
            }
            return;
        }

        let sentCount = 0;
        for (const payload of existing) {
            await sendPayloadToCollector(payload);
            clearPendingSubmission(payload.sessionId);
            sentCount++;
        }

        if (manual) {
            setSubmitStatus(`تمت محاولة إعادة إرسال ${sentCount} نتيجة محفوظة. تحقق من Google Sheets للتأكيد.`, 'success');
        }
    } catch (err) {
        console.warn('بقيت بعض النتائج غير مرسلة.', err);
        if (manual) {
            setSubmitStatus('بقيت بعض النتائج محفوظة محلياً بسبب تعذر الاتصال.', 'error');
        }
    }
}

window.addEventListener('online', () => retryPendingSubmissions(false));

// ==========================================
// 1. نظام التبويبات
// ==========================================
function switchTab(tabId) {
    if (typeof isLevelUnlocked === 'function' && !isLevelUnlocked(tabId)) {
        showLockedNavigationMessage(tabId);
        updateNavigationLocks();
        return;
    }

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[data-tab-id="${tabId}"]`) || document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('.mode-container').forEach(container => container.classList.remove('active-mode'));
    const activeContainer = document.getElementById(tabId + '-mode');
    if (activeContainer) activeContainer.classList.add('active-mode');

    if (tabId === 'compass' && typeof drawCompass === 'function') {
        drawCompass();
    }

    if (typeof renderLevelQuestionVisual === 'function') {
        renderLevelQuestionVisual(tabId);
    }

    if (typeof updateAssessmentProgress === 'function') {
        updateAssessmentProgress();
    }

    updateNavigationLocks();
    addLabEvent('level_open', tabId, `فتح المستوى: ${tabId}`);
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

const angles = { C: 0, A: Math.PI / 4, D: Math.PI / 2, B: Math.PI, F: 5 * Math.PI / 4, E: 3 * Math.PI / 2 };
const points = {
    M: { x: id_cx, y: id_cy, label: 'م', angle: null },
    C: { x: id_cx + id_r * Math.cos(angles.C), y: id_cy + id_r * Math.sin(angles.C), label: 'ج', angle: angles.C },
    A: { x: id_cx + id_r * Math.cos(angles.A), y: id_cy + id_r * Math.sin(angles.A), label: 'أ', angle: angles.A },
    D: { x: id_cx + id_r * Math.cos(angles.D), y: id_cy + id_r * Math.sin(angles.D), label: 'د', angle: angles.D },
    B: { x: id_cx + id_r * Math.cos(angles.B), y: id_cy + id_r * Math.sin(angles.B), label: 'ب', angle: angles.B },
    F: { x: id_cx + id_r * Math.cos(angles.F), y: id_cy + id_r * Math.sin(angles.F), label: 'و', angle: angles.F },
    E: { x: id_cx + id_r * Math.cos(angles.E), y: id_cy + id_r * Math.sin(angles.E), label: 'هـ', angle: angles.E }
};

const elementsData = {
    center: [{ type: 'point', p: 'M', text: 'المركز (م): النقطة الثابتة في منتصف الدائرة.' }],
    radius: [
        { type: 'line', p1: 'M', p2: 'A', text: 'نصف القطر (م أ): يصل بين المركز والمحيط.' },
        { type: 'line', p1: 'M', p2: 'B', text: 'نصف القطر (م ب): جميع أنصاف الأقطار متساوية الطول.' },
        { type: 'line', p1: 'M', p2: 'C', text: 'نصف القطر (م ج): قطعة من المركز للنقطة ج.' },
        { type: 'line', p1: 'M', p2: 'D', text: 'نصف القطر (م د).' },
        { type: 'line', p1: 'M', p2: 'E', text: 'نصف القطر (م هـ).' },
        { type: 'line', p1: 'M', p2: 'F', text: 'نصف القطر (م و).' }
    ],
    diameter: [
        { type: 'line', p1: 'B', p2: 'C', text: 'القطر (ب ج): أطول وتر في الدائرة، ويمر بالمركز.' },
        { type: 'line', p1: 'D', p2: 'E', text: 'القطر (د هـ): يتكون من نصفي قطر على استقامة واحدة.' },
        { type: 'line', p1: 'A', p2: 'F', text: 'القطر (أ و): يقسم الدائرة لنصفين متطابقين.' }
    ],
    chord: [
        { type: 'line', p1: 'A', p2: 'D', text: 'الوتر (أ د): قطعة مستقيمة تصل بين نقطتين ولا تمر بالمركز.' },
        { type: 'line', p1: 'A', p2: 'B', text: 'الوتر (أ ب): وتر آخر.' },
        { type: 'line', p1: 'D', p2: 'B', text: 'الوتر (د ب).' },
        { type: 'line', p1: 'C', p2: 'E', text: 'الوتر (ج هـ).' },
        { type: 'line', p1: 'E', p2: 'F', text: 'الوتر (هـ و).' },
        { type: 'line', p1: 'F', p2: 'B', text: 'الوتر (و ب).' }
    ],
    arc: [
        { type: 'arc', s: angles.C, e: angles.A, text: 'القوس (ج أ): جزء من محيط الدائرة.' },
        { type: 'arc', s: angles.A, e: angles.D, text: 'القوس (أ د).' },
        { type: 'arc', s: angles.D, e: angles.B, text: 'القوس (د ب).' },
        { type: 'arc', s: angles.B, e: angles.F, text: 'القوس (ب و).' },
        { type: 'arc', s: angles.F, e: angles.E, text: 'القوس (و هـ).' }
    ],
    circumference: [{ type: 'circle', text: 'المحيط: هو الخط المنحني المغلق الذي يمثل طول إطار الدائرة.' }]
};

function highlight(name) {
    if (currentElement === name) {
        cycleIndex++;
    } else {
        currentElement = name;
        cycleIndex = 0;
    }

    cycleIndex %= elementsData[name].length;
    descBox.textContent = elementsData[name][cycleIndex].text;

    document.querySelectorAll('.list-btn').forEach(btn => btn.classList.remove('active'));
    const clicked = Array.from(document.querySelectorAll('.list-btn')).find(btn => btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(name));
    if (clicked) {
        clicked.classList.add('active');
        clicked.style.background = systemColors[name];
    }
    document.querySelectorAll('.list-btn:not(.active)').forEach(btn => {
        btn.style.background = '#fff';
    });

    addLabEvent('identify_highlight', 'identify', `استكشف الطالب: ${name}`, {
        exampleIndex: cycleIndex + 1
    });

    drawIdentify();
}

function drawIdentify() {
    idCtx.clearRect(0, 0, 450, 450);
    idCtx.beginPath();
    idCtx.arc(id_cx, id_cy, id_r, 0, Math.PI * 2);
    idCtx.strokeStyle = currentElement === 'circumference' ? systemColors.circumference : '#ecf0f1';
    idCtx.lineWidth = currentElement === 'circumference' ? 6 : 2;
    idCtx.stroke();

    if (currentElement) {
        idCtx.lineWidth = 6;
        idCtx.strokeStyle = systemColors[currentElement];

        const item = elementsData[currentElement][cycleIndex];
        if (item.type === 'point') {
            idCtx.fillStyle = systemColors[currentElement];
            idCtx.beginPath();
            idCtx.arc(points[item.p].x, points[item.p].y, 8, 0, Math.PI * 2);
            idCtx.fill();
        } else if (item.type === 'line') {
            idCtx.beginPath();
            idCtx.moveTo(points[item.p1].x, points[item.p1].y);
            idCtx.lineTo(points[item.p2].x, points[item.p2].y);
            idCtx.stroke();
        } else if (item.type === 'arc') {
            idCtx.lineWidth = 8;
            idCtx.beginPath();
            idCtx.arc(id_cx, id_cy, id_r, item.s, item.e);
            idCtx.stroke();
        }
    }

    idCtx.font = 'bold 26px Arial';
    idCtx.fillStyle = '#2c3e50';
    Object.values(points).forEach(p => {
        idCtx.beginPath();
        idCtx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        idCtx.fill();
        const offset = 30;
        const tx = p.label === 'م' ? p.x - 15 : p.x + Math.cos(p.angle) * offset;
        const ty = p.label === 'م' ? p.y - 15 : p.y + Math.sin(p.angle) * offset;
        idCtx.textAlign = p.label === 'م' ? 'right' : (Math.cos(p.angle) >= 0 ? 'left' : 'right');
        idCtx.textBaseline = p.label === 'م' ? 'bottom' : 'middle';
        idCtx.fillText(p.label, tx, ty);
    });
}

drawIdentify();

// ==========================================
// 3. المستوى 2: التفاعل الحي
// ==========================================
const exCanvas = document.getElementById('exploreCanvas');
const exCtx = exCanvas.getContext('2d');
const radiusSlider = document.getElementById('radiusSlider');
let angle1 = 0.5;
let angle2 = 2.5;
let activePoint = null;
let explorePointerId = null;
let hasPlayedSuccess = false;

function drawExplore() {
    exCtx.clearRect(0, 0, exCanvas.width, exCanvas.height);
    const r = parseInt(radiusSlider.value, 10);
    const cx = exCanvas.width / 2;
    const cy = exCanvas.height / 2;

    exCtx.beginPath();
    exCtx.arc(cx, cy, r, 0, Math.PI * 2);
    exCtx.strokeStyle = '#dfe6e9';
    exCtx.lineWidth = 2;
    exCtx.stroke();

    exCtx.beginPath();
    exCtx.arc(cx, cy, 5, 0, Math.PI * 2);
    exCtx.fillStyle = '#2c3e50';
    exCtx.fill();
    exCtx.font = 'bold 26px Arial';
    exCtx.textAlign = 'right';
    exCtx.textBaseline = 'bottom';
    exCtx.fillText('م', cx - 10, cy - 10);

    const p1 = { x: cx + r * Math.cos(angle1), y: cy + r * Math.sin(angle1) };
    const p2 = { x: cx + r * Math.cos(angle2), y: cy + r * Math.sin(angle2) };
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const isDiam = dist >= (r * 2) - 2;

    exCtx.beginPath();
    exCtx.moveTo(p1.x, p1.y);
    exCtx.lineTo(p2.x, p2.y);
    exCtx.strokeStyle = isDiam ? systemColors.diameter : systemColors.chord;
    exCtx.lineWidth = isDiam ? 6 : 4;
    exCtx.stroke();

    exCtx.font = 'bold 26px Arial';
    exCtx.beginPath();
    exCtx.arc(p1.x, p1.y, 10, 0, Math.PI * 2);
    exCtx.fillStyle = '#e74c3c';
    exCtx.fill();
    exCtx.fillStyle = '#2c3e50';
    exCtx.textAlign = Math.cos(angle1) >= 0 ? 'left' : 'right';
    exCtx.textBaseline = 'middle';
    exCtx.fillText('أ', p1.x + Math.cos(angle1) * 28, p1.y + Math.sin(angle1) * 28);

    exCtx.beginPath();
    exCtx.arc(p2.x, p2.y, 10, 0, Math.PI * 2);
    exCtx.fillStyle = '#e74c3c';
    exCtx.fill();
    exCtx.fillStyle = '#2c3e50';
    exCtx.textAlign = Math.cos(angle2) >= 0 ? 'left' : 'right';
    exCtx.textBaseline = 'middle';
    exCtx.fillText('ب', p2.x + Math.cos(angle2) * 28, p2.y + Math.sin(angle2) * 28);

    const radiusMm = Math.round(r * 2 / 3);
    const scaleMmPerPixel = radiusMm / r;
    document.getElementById('radiusVal').textContent = radiusMm;
    document.getElementById('diamVal').textContent = radiusMm * 2;
    document.getElementById('chordVal').textContent = Math.round(dist * scaleMmPerPixel);
    document.getElementById('chordType').textContent = isDiam ? 'قطر' : 'وتر';

    const exploreFeedback = document.getElementById('feedbackMsg');
    if (exploreFeedback) {
        exploreFeedback.textContent = isDiam
            ? 'أحسنت! عندما يمر الوتر بالمركز يصبح قطراً.'
            : 'حرك النقطتين الحمراوين (أ، ب). إذا مرت القطعة بالمركز أصبحت قطراً.';
        exploreFeedback.className = isDiam ? 'is-diameter' : '';
    }

    const successSound = document.getElementById('successSound');
    if (isDiam && !hasPlayedSuccess) {
        if (successSound) {
            successSound.currentTime = 0;
            successSound.play().catch(() => {});
        }
        addLabEvent('diameter_discovered', 'explore', 'حوّل الطالب الوتر إلى قطر', {
            radiusMm,
            chordMm: Math.round(dist * scaleMmPerPixel)
        });
        hasPlayedSuccess = true;
    } else if (!isDiam) {
        hasPlayedSuccess = false;
    }
}

function getExploreCanvasPoint(e) {
    const rect = exCanvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (exCanvas.width / rect.width),
        y: (e.clientY - rect.top) * (exCanvas.height / rect.height)
    };
}

function handleExplorePointerDown(e) {
    const pos = getExploreCanvasPoint(e);
    const cx = exCanvas.width / 2;
    const cy = exCanvas.height / 2;
    const r = parseInt(radiusSlider.value, 10);

    const d1 = Math.hypot(pos.x - (cx + r * Math.cos(angle1)), pos.y - (cy + r * Math.sin(angle1)));
    const d2 = Math.hypot(pos.x - (cx + r * Math.cos(angle2)), pos.y - (cy + r * Math.sin(angle2)));

    if (d1 < 30) {
        activePoint = 1;
    } else if (d2 < 30) {
        activePoint = 2;
    } else {
        activePoint = null;
        return;
    }

    explorePointerId = e.pointerId;
    exCanvas.setPointerCapture(explorePointerId);
    addLabEvent('explore_drag_start', 'explore', activePoint === 1 ? 'بدأ تحريك النقطة أ' : 'بدأ تحريك النقطة ب');
}

function handleExplorePointerMove(e) {
    if (!activePoint) return;
    if (e.cancelable) e.preventDefault();

    const pos = getExploreCanvasPoint(e);
    const cx = exCanvas.width / 2;
    const cy = exCanvas.height / 2;
    const ang = Math.atan2(pos.y - cy, pos.x - cx);

    if (activePoint === 1) {
        angle1 = ang;
    } else {
        angle2 = ang;
    }

    drawExplore();
}

function handleExplorePointerUp() {
    activePoint = null;
    if (explorePointerId !== null) {
        try { exCanvas.releasePointerCapture(explorePointerId); } catch (err) {}
        explorePointerId = null;
    }
}

radiusSlider.addEventListener('input', () => {
    addLabEvent('explore_radius_changed', 'explore', 'غيّر الطالب نصف قطر الدائرة', {
        sliderValue: radiusSlider.value
    });
    drawExplore();
});

exCanvas.addEventListener('pointerdown', handleExplorePointerDown);
exCanvas.addEventListener('pointermove', handleExplorePointerMove);
exCanvas.addEventListener('pointerup', handleExplorePointerUp);
exCanvas.addEventListener('pointercancel', handleExplorePointerUp);
exCanvas.addEventListener('pointerleave', handleExplorePointerUp);

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

// كل مربع كبير = 1 سم، وكل مربع كبير مقسم إلى 4 مربعات صغيرة.
const compassScale = 40;
const compassSubDivisions = 4;
const compassMinorStep = compassScale / compassSubDivisions;
const compassBinsCount = 180;
const compassCompletionThreshold = 0.98;
const compassMissionRadii = [4, 3, 5, 6];
let compassMissionIndex = 0;
let compassTargetRadius = compassMissionRadii[compassMissionIndex];
let compassAutoAnimation = null;
let compassPointerId = null;

const compassState = {
    targetCenter: { x: 320, y: 280 },
    center: { x: 320, y: 280 },
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

function snapToCompassGrid(pos) {
    return {
        x: Math.round(pos.x / compassScale) * compassScale,
        y: Math.round(pos.y / compassScale) * compassScale
    };
}

function isNearPoint(p1, p2, tolerance = 20) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y) <= tolerance;
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
    const percent = compassState.completed ? 100 : Math.round(getCompassProgress() * 100);
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

    // شبكة دقيقة: 4 مربعات صغيرة داخل كل 1 سم.
    ctx.strokeStyle = '#eef3f6';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += compassMinorStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y <= h; y += compassMinorStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    // شبكة رئيسية: كل مربع كبير = 1 سم.
    ctx.strokeStyle = '#cfd8dc';
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += compassScale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y <= h; y += compassScale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    ctx.restore();
}

function drawDigitalRuler(ctx) {
    const startX = 55;
    const y = compassCanvas.height - 45;
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

    if (compassState.completed) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, rPx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return;
    }

    for (let i = 0; i < compassState.drawnBins.length; i++) {
        if (!compassState.drawnBins[i]) continue;
        const a1 = i * step;
        const a2 = a1 + step * 0.98;
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
    const radiusUnits = Math.round(compassTargetRadius);

    ctx.save();

    ctx.fillStyle = 'rgba(39, 174, 96, 0.10)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, rPx, 0, Math.PI * 2);
    ctx.fill();

    // نصف قطر أفقي لليمين لتسهيل عد المربعات الكبيرة.
    ctx.strokeStyle = systemColors.radius;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + rPx, c.y);
    ctx.stroke();

    // نقطة المركز م.
    ctx.fillStyle = systemColors.center;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
    ctx.fill();

    // علامات العد: 1، 2، 3... كل مربع كبير = 1 سم.
    ctx.strokeStyle = '#2c3e50';
    ctx.fillStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 1; i <= radiusUnits; i++) {
        const x = c.x + i * compassScale;
        ctx.beginPath();
        ctx.moveTo(x, c.y - 10);
        ctx.lineTo(x, c.y + 10);
        ctx.stroke();
        ctx.fillText(String(i), x, c.y + 24);
    }

    ctx.fillStyle = systemColors.radius;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`التحقق: عدّ ${radiusUnits} مربعات كبيرة من م إلى محيط الدائرة`, c.x, c.y + rPx + 30);

    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`كل مربع كبير = 1 سم ← إذن نصف القطر = ${compassTargetRadius} سم`, c.x, c.y + rPx + 55);

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

function markCompassBin(angle) {
    const normalized = normalizeAngle(angle);
    const step = Math.PI * 2 / compassBinsCount;
    const idx = Math.floor(normalized / step);
    for (let offset = -3; offset <= 3; offset++) {
        compassState.drawnBins[(idx + offset + compassBinsCount) % compassBinsCount] = true;
    }
}

function completeCompassCircle() {
    compassState.completed = true;
    compassState.fixed = true;
    compassState.drawnBins.fill(true);
    const successSound = document.getElementById('successSound');
    if (successSound) {
        successSound.currentTime = 0;
        successSound.play().catch(() => {});
    }
    addLabEvent('compass_completed', 'compass', 'أكمل الطالب رسم الدائرة بالفرجار', {
        targetRadiusCm: compassTargetRadius,
        attempts: labState.compass.attempts
    });
    setCompassFeedback(`اكتملت الدائرة! الفتحة بقيت ثابتة، ونصف القطر = ${compassTargetRadius} سم.`, 'success');
}

function markCompassAngle(angle) {
    const step = Math.PI * 2 / compassBinsCount;
    const previousAngle = compassState.lastPointerAngle;

    if (typeof previousAngle === 'number') {
        const from = normalizeAngle(previousAngle);
        const to = normalizeAngle(angle);
        let delta = to - from;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;

        const samples = Math.max(1, Math.ceil(Math.abs(delta) / step));
        for (let i = 0; i <= samples; i++) {
            markCompassBin(from + delta * (i / samples));
        }
    } else {
        markCompassBin(angle);
    }

    compassState.lastPointerAngle = angle;

    const progress = getCompassProgress();
    if (progress >= compassCompletionThreshold && !compassState.completed) {
        completeCompassCircle();
    }
}

function handleCompassPointerDown(e) {
    if (!compassCanvas || compassState.completed) return;
    const pos = getCompassCanvasPoint(e);
    const target = compassState.targetCenter;

    if (!compassState.centerPlaced) {
        const snappedPos = snapToCompassGrid(pos);
        if (isNearPoint(snappedPos, target, 20)) {
            compassState.centerPlaced = true;
            compassState.center = { ...target };
            addLabEvent('compass_center_placed', 'compass', 'حدد الطالب المركز م على تقاطع الشبكة');
            setCompassFeedback('أحسنت! تم تحديد المركز على نقطة تقاطع في الشبكة. الآن اضبط فتحة الفرجار على نصف القطر المطلوب.', 'success');
        } else {
            labState.compass.centerMisses++;
            addLabEvent('compass_center_miss', 'compass', 'لم يحدد المركز على نقطة التقاطع الصحيحة');
            setCompassFeedback('اضغط على النقطة م عند تقاطع الشبكة؛ يجب أن يكون المركز مثبتاً على نقطة تقاطع واضحة.', 'warning');
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
        labState.compass.attempts++;
        const angle = Math.atan2(pos.y - compassState.center.y, pos.x - compassState.center.x);
        compassState.currentAngle = angle;
        compassState.lastPointerAngle = null;
        markCompassAngle(angle);
        addLabEvent('compass_draw_attempt', 'compass', 'بدأ محاولة رسم بالفرجار', {
            targetRadiusCm: compassTargetRadius,
            openingCm: compassState.openingCm,
            attemptNumber: labState.compass.attempts
        });
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
        const now = Date.now();
        if (now - labState.compass.lastPathWarningAt > 800) {
            labState.compass.pathWarnings++;
            labState.compass.lastPathWarningAt = now;
            addLabEvent('compass_path_warning', 'compass', 'خرج الطالب عن مسار الدائرة', {
                warningNumber: labState.compass.pathWarnings
            });
        }
        setCompassFeedback('حافظ على الفتحة ثابتة: حرّك القلم قريباً من مسار الدائرة.', 'warning');
        return;
    }

    const angle = Math.atan2(pos.y - compassState.center.y, pos.x - compassState.center.x);
    compassState.currentAngle = angle;
    markCompassAngle(angle);
    drawCompass();
}

function handleCompassPointerUp() {
    compassState.drawing = false;
    compassState.lastPointerAngle = null;
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
        compassState.lastPointerAngle = null;
        setCompassFeedback('تغيّرت فتحة الفرجار؛ أعد تثبيت السن ثم ابدأ الرسم من جديد.', 'warning');
    } else if (!compassState.centerPlaced) {
        setCompassFeedback('حدّد المركز م أولاً، ثم اضبط فتحة الفرجار.', 'info');
    } else if (isCompassOpeningCorrect()) {
        addLabEvent('compass_opening_correct', 'compass', 'ضبط الطالب فتحة الفرجار بشكل صحيح', {
            targetRadiusCm: compassTargetRadius,
            openingCm: compassState.openingCm
        });
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
        labState.compass.openingErrors++;
        addLabEvent('compass_opening_error', 'compass', 'حاول تثبيت فتحة غير صحيحة', {
            targetRadiusCm: compassTargetRadius,
            openingCm: compassState.openingCm,
            errorNumber: labState.compass.openingErrors
        });
        setCompassFeedback(`لا تثبّت بعد: فتحة الفرجار يجب أن تساوي ${compassTargetRadius} سم.`, 'warning');
        drawCompass();
        return;
    }
    compassState.fixed = true;
    compassState.completed = false;
    compassState.drawnBins = new Array(compassBinsCount).fill(false);
    compassState.lastPointerAngle = null;
    addLabEvent('compass_fixed', 'compass', 'ثبت الطالب سن الفرجار في المركز', {
        openingCm: compassState.openingCm
    });
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
    addLabEvent('compass_reset', 'compass', 'أعاد الطالب محاولة الفرجار');
    setCompassFeedback('اضغط على النقطة المعلّمة م لتثبيت سن الفرجار.', 'info');
    drawCompass();
}

function newCompassMission() {
    compassMissionIndex = (compassMissionIndex + 1) % compassMissionRadii.length;
    compassTargetRadius = compassMissionRadii[compassMissionIndex];
    if (compassTargetVal) compassTargetVal.textContent = compassTargetRadius.toString();
    addLabEvent('compass_new_mission', 'compass', 'انتقل الطالب إلى مهمة فرجار جديدة', {
        targetRadiusCm: compassTargetRadius
    });
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

    labState.compass.autoDemoUsed = true;
    addLabEvent('compass_auto_demo', 'compass', 'استخدم الطالب العرض التلقائي للفرجار', {
        targetRadiusCm: compassTargetRadius
    });

    compassState.completed = false;
    compassState.drawnBins = new Array(compassBinsCount).fill(false);
    compassState.lastPointerAngle = null;
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
                compassState.drawnBins.fill(true);
                setCompassFeedback('اكتملت الدائرة بالنموذج التلقائي. جرّب الآن بنفسك.', 'success');
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
    compassCanvas.addEventListener('pointercancel', handleCompassPointerUp);
    compassCanvas.addEventListener('pointerleave', handleCompassPointerUp);
}
if (compassRadiusSlider) {
    compassRadiusSlider.addEventListener('input', updateCompassOpeningFromSlider);
}
if (compassTargetVal) compassTargetVal.textContent = compassTargetRadius.toString();
if (compassRadiusSlider) {
    compassRadiusSlider.min = '1';
    compassRadiusSlider.max = '8';
    compassRadiusSlider.step = '1';
    compassRadiusSlider.value = compassState.openingCm.toString();
}
if (compassRadiusVal) compassRadiusVal.textContent = compassState.openingCm.toString();
drawCompass();


// ==========================================
// 5. أسئلة التحقق الموزعة على جميع المستويات
// ==========================================
const qzCanvas = document.getElementById('quizCanvas');
const qzCtx = qzCanvas ? qzCanvas.getContext('2d') : null;
let correctScore = 0;
let wrongScore = 0;
let currentQuestionIndex = 0;

const levelOrder = ['identify', 'explore', 'compass', 'quiz'];
const levelInfo = {
    identify: {
        title: 'المستوى 1: استكشاف العناصر',
        shortTitle: 'استكشاف العناصر',
        containerId: 'identify-questions-container',
        nextLevel: 'explore'
    },
    explore: {
        title: 'المستوى 2: تحدي القطر والوتر',
        shortTitle: 'تحدي القطر والوتر',
        containerId: 'explore-questions-container',
        nextLevel: 'compass'
    },
    compass: {
        title: 'المستوى 3: الفرجار الرقمي',
        shortTitle: 'الفرجار الرقمي',
        containerId: 'compass-questions-container',
        nextLevel: 'quiz'
    },
    quiz: {
        title: 'المستوى 4: التقييم الختامي',
        shortTitle: 'التقييم الختامي',
        containerId: 'quiz-questions-container',
        nextLevel: null
    }
};


// ==========================================
// 5.1 نظام قفل التنقل للحصة التقييمية
// ==========================================
function isLevelQuestionsComplete(levelId) {
    if (typeof getQuestionsForLevel !== 'function') return false;
    const indices = getQuestionsForLevel(levelId);
    if (!indices.length) return false;
    return indices.every(idx => Boolean(labState.quiz.answers[idx]));
}

function isLevelUnlocked(tabId) {
    if (tabId === 'identify') return true;
    if (tabId === 'explore') return isLevelQuestionsComplete('identify');
    if (tabId === 'compass') return isLevelQuestionsComplete('explore');
    if (tabId === 'quiz') return isLevelQuestionsComplete('compass');
    return true;
}

function isMemoryGameUnlocked() {
    return isLevelQuestionsComplete('explore');
}

function getLockedReason(tabId) {
    const reasons = {
        explore: 'أكمل أسئلة تحقق المستوى الأول أولاً، ثم سيفتح مستوى تحدي القطر والوتر.',
        compass: 'أكمل أسئلة تحقق المستوى الثاني أولاً. بعد ذلك تظهر لعبة الذاكرة كنشاط تثبيت، ويفتح الفرجار الرقمي.',
        quiz: 'أكمل أسئلة تحقق المستوى الثالث أولاً، ثم يفتح التقييم الختامي.',
        memory: 'لعبة الذاكرة ستظهر بعد إنهاء المستوى الثاني؛ لتكون نشاط تثبيت لا نشاطاً مفتوحاً من البداية.'
    };
    return reasons[tabId] || 'هذا الجزء مقفل حتى تنهي المهمة السابقة.';
}

function showLockedNavigationMessage(tabId) {
    const info = document.getElementById('sessionInfo');
    const message = getLockedReason(tabId);
    if (info) {
        info.textContent = message;
        info.style.color = '#8a4b08';
    } else {
        alert(message);
    }
    addLabEvent('locked_navigation_attempt', 'navigation', message, { requestedTab: tabId });
}

function updateNavigationLocks() {
    document.querySelectorAll('.tab-btn[data-tab-id]').forEach(btn => {
        const tabId = btn.dataset.tabId;
        const baseLabel = btn.dataset.baseLabel || btn.textContent.replace(/^✅\s*/, '').replace(/^🔒\s*/, '').trim();
        btn.dataset.baseLabel = baseLabel;

        const unlocked = isLevelUnlocked(tabId);
        const completed = isLevelQuestionsComplete(tabId);

        btn.disabled = !unlocked;
        btn.setAttribute('aria-disabled', String(!unlocked));
        btn.classList.toggle('locked', !unlocked);
        btn.classList.toggle('completed-level', unlocked && completed);
        btn.title = unlocked ? '' : getLockedReason(tabId);

        if (!unlocked) {
            btn.textContent = `🔒 ${baseLabel}`;
        } else if (completed) {
            btn.textContent = `✅ ${baseLabel}`;
        } else {
            btn.textContent = baseLabel;
        }
    });

    const memoryBtn = document.getElementById('btnOpenMemoryGame');
    if (memoryBtn) {
        const unlocked = isMemoryGameUnlocked();
        const baseLabel = memoryBtn.dataset.baseLabel || memoryBtn.textContent.replace(/^✅\s*/, '').replace(/^🔒\s*/, '').trim();
        memoryBtn.dataset.baseLabel = baseLabel;

        memoryBtn.disabled = !unlocked;
        memoryBtn.setAttribute('aria-disabled', String(!unlocked));
        memoryBtn.classList.toggle('locked', !unlocked);
        memoryBtn.classList.toggle('gate-hidden', !unlocked);
        memoryBtn.classList.toggle('ready-memory', unlocked);
        memoryBtn.title = unlocked ? 'نشاط تثبيت بعد المستوى الثاني' : getLockedReason('memory');
        memoryBtn.textContent = unlocked ? `🧠 نشاط تثبيت: لعبة الذاكرة` : baseLabel;
    }
}

window.isMemoryGameUnlocked = isMemoryGameUnlocked;
window.showLockedNavigationMessage = showLockedNavigationMessage;

// المصفوفة التالية موزعة تربوياً على المستويات الأربعة بدلاً من تجميعها في مستوى واحد.
// يظل رقم السؤال عالمياً حتى تصل النتائج إلى Google Sheets كسجل تشخيصي واحد.
const quizData = [
    {
        level: 'identify',
        text: 'ما اسم النقطة الثابتة في منتصف الدائرة؟',
        options: ['الوتر', 'المركز', 'القوس'],
        correct: 1,
        focusElement: 'center',
        feedback: [
            'الوتر قطعة مستقيمة تصل بين نقطتين على الدائرة، وليس النقطة التي في المنتصف.',
            'صحيح؛ المركز هو النقطة الثابتة التي تبعد عنها جميع نقاط الدائرة المسافة نفسها.',
            'القوس جزء منحني من محيط الدائرة، وليس النقطة الثابتة في المنتصف.'
        ],
        misconceptions: ['خلط بين نقطة المركز والقطعة المستقيمة', '', 'خلط بين المركز والقوس']
    },
    {
        level: 'identify',
        text: 'في الرسم، ماذا تسمى القطعة التي تصل المركز بنقطة على الدائرة مثل (م أ)؟',
        options: ['وتراً', 'نصف قطر', 'قطراً'],
        correct: 1,
        focusElement: 'radius',
        feedback: [
            'ليست وتراً؛ لأن الوتر يصل بين نقطتين على الدائرة، أما هذه القطعة فتبدأ من المركز.',
            'صحيح؛ نصف القطر يصل المركز بنقطة على الدائرة.',
            'ليست قطراً؛ لأن القطر يصل بين نقطتين على الدائرة ويمر بالمركز.'
        ],
        misconceptions: ['اعتقاد أن أي قطعة مستقيمة داخل الدائرة وتر', '', 'خلط بين نصف القطر والقطر']
    },
    {
        level: 'identify',
        text: 'الجزء المنحني من محيط الدائرة بين نقطتين يسمى:',
        options: ['قوساً', 'وتراً', 'قطراً'],
        correct: 0,
        focusElement: 'arc',
        feedback: [
            'صحيح؛ القوس جزء منحني من محيط الدائرة.',
            'الوتر قطعة مستقيمة، أما القوس فهو جزء منحني.',
            'القطر قطعة مستقيمة تمر بالمركز، أما الجزء المنحني فهو قوس.'
        ],
        misconceptions: ['', 'خلط بين القوس والوتر', 'خلط بين القوس والقطر']
    },
    {
        level: 'explore',
        text: 'عندما تصل القطعة بين نقطتين على الدائرة وتمر بالمركز، فإنها تسمى:',
        options: ['وتراً عادياً', 'قطراً', 'قوساً'],
        correct: 1,
        exploreAction: 'showDiameter',
        feedback: [
            'هي وتر من حيث إنها تصل بين نقطتين، لكنها ليست وتراً عادياً؛ لأنها تمر بالمركز فتسمى قطراً.',
            'صحيح؛ الوتر الذي يمر بالمركز يسمى قطراً.',
            'ليست قوساً؛ لأن القوس جزء منحني، أما هذه قطعة مستقيمة.'
        ],
        misconceptions: ['إجابة ناقصة: لم يميز أن الوتر المار بالمركز قطر', '', 'خلط بين القوس والقطعة المستقيمة']
    },
    {
        level: 'explore',
        text: 'إذا كان نصف القطر 5 سم، فما طول القطر؟',
        options: ['5 سم', '10 سم', '2.5 سم'],
        correct: 1,
        exploreAction: 'showDiameter',
        feedback: [
            'هذه قيمة نصف القطر، وليست القطر. القطر يساوي ضعفي نصف القطر.',
            'صحيح؛ القطر = ٢ × نصف القطر = ٢ × ٥ = ١٠ سم.',
            'هذه قيمة أصغر من نصف القطر. المطلوب حساب القطر، أي مضاعفة نصف القطر.'
        ],
        misconceptions: ['نسي أن القطر يساوي ضعفي نصف القطر', '', 'استخدم القسمة بدل الضرب في علاقة القطر بنصف القطر']
    },
    {
        level: 'explore',
        text: 'أي عبارة صحيحة عن القطر؟',
        options: ['هو وتر يمر بالمركز', 'هو قوس طويل', 'هو نصف القطر نفسه'],
        correct: 0,
        exploreAction: 'showDiameter',
        feedback: [
            'صحيح؛ القطر وتر خاص يمر بالمركز ويعد أطول وتر في الدائرة.',
            'ليس قوساً؛ القطر قطعة مستقيمة، والقوس جزء منحني.',
            'ليس نصف القطر نفسه؛ القطر يساوي نصفين من نصف القطر.'
        ],
        misconceptions: ['', 'خلط بين القطر والقوس', 'خلط بين القطر ونصف القطر']
    },
    {
        level: 'compass',
        text: 'فتحة الفرجار التي تضبطها قبل الرسم تمثل:',
        options: ['القطر', 'نصف القطر', 'المحيط'],
        correct: 1,
        compassHint: 'الفتحة = نصف القطر؛ لذلك نضبطها على المسافة من المركز إلى أي نقطة على الدائرة.',
        feedback: [
            'ليست القطر؛ القطر يساوي ضعفي الفتحة لأن الفتحة تمثل نصف القطر.',
            'صحيح؛ فتحة الفرجار تمثل نصف القطر.',
            'المحيط هو طول الإطار المنحني كاملاً، ولا تمثله فتحة الفرجار.'
        ],
        misconceptions: ['خلط بين القطر ونصف القطر في استخدام الفرجار', '', 'خلط بين المسافة الخطية والمحيط']
    },
    {
        level: 'compass',
        text: 'لرسم دائرة نصف قطرها 4 سم، أضبط فتحة الفرجار على:',
        options: ['2 سم', '4 سم', '8 سم'],
        correct: 1,
        compassHint: 'عند المهمة الحالية اضبط فتحة الفرجار على القيمة المطلوبة لنصف القطر، ثم ثبت السن في المركز.',
        feedback: [
            '2 سم نصف القيمة المطلوبة، وستنتج دائرة أصغر من المطلوب.',
            'صحيح؛ لأن فتحة الفرجار تساوي نصف القطر المطلوب.',
            '8 سم تمثل ضعف نصف القطر، أي القطر، وليست فتحة الفرجار المطلوبة.'
        ],
        misconceptions: ['قسم نصف القطر على 2 عند ضبط الفتحة', '', 'ضاعف نصف القطر واعتبر الفتحة قطراً']
    },
    {
        level: 'quiz',
        shape: 2,
        text: 'في الشكل الختامي، القطعة (س ص) تمر بالمركز (ن)، إذن هي:',
        options: ['وتر فقط', 'قوس', 'قطر'],
        correct: 2,
        hl: { type: 'line', p1: 'S', p2: 'Y', c: systemColors.diameter },
        feedback: [
            'هي وتر، لكنها ليست وتراً فقط؛ لأنها تمر بالمركز، لذلك تسمى قطراً.',
            'ليست قوساً؛ لأن القوس جزء منحني من المحيط، أما (س ص) فهي قطعة مستقيمة.',
            'صحيح؛ القطعة (س ص) قطر لأنها تصل بين نقطتين على الدائرة وتمر بالمركز (ن).'
        ],
        misconceptions: ['إجابة ناقصة: لم يميز أن الوتر المار بالمركز قطر', 'خلط بين القوس والقطعة المستقيمة', '']
    },
    {
        level: 'quiz',
        shape: 2,
        text: 'تحدي ختامي: إذا كان طول القطر (س ص) = 14 سم، فما طول نصف القطر (ن و)؟',
        options: ['7 سم', '14 سم', '28 سم'],
        correct: 0,
        hl: { type: 'line', p1: 'N', p2: 'W', c: systemColors.radius },
        feedback: [
            'صحيح؛ نصف القطر = القطر ÷ ٢ = ١٤ ÷ ٢ = ٧ سم.',
            'هذه قيمة القطر، وليست نصف القطر. نصف القطر يساوي القطر ÷ ٢.',
            'هذه قيمة ضعف القطر، بينما المطلوب هو نصف القطر: القطر ÷ ٢.'
        ],
        misconceptions: ['', 'اعتبر القطر نصف قطر', 'ضاعف القطر بدلاً من قسمته على 2']
    }
];

function getQuestionsForLevel(levelId) {
    return quizData
        .map((question, index) => ({ question, index }))
        .filter(item => item.question.level === levelId)
        .map(item => item.index);
}

function getAnsweredCount() {
    return labState.quiz.answers.filter(Boolean).length;
}

function isAssessmentComplete() {
    return getAnsweredCount() === quizData.length;
}

function getLevelSummary() {
    const summary = {};
    levelOrder.forEach(levelId => {
        const indices = getQuestionsForLevel(levelId);
        const answers = indices.map(idx => labState.quiz.answers[idx]).filter(Boolean);
        const correct = answers.filter(a => a.isCorrect).length;
        summary[levelId] = {
            title: levelInfo[levelId].title,
            answered: answers.length,
            total: indices.length,
            correct,
            wrong: answers.length - correct,
            completed: answers.length === indices.length
        };
    });
    return summary;
}

function updateAssessmentProgress() {
    const answered = getAnsweredCount();
    const total = quizData.length;
    const percent = total ? Math.round((answered / total) * 100) : 0;
    const text = document.getElementById('assessmentProgressText');
    const bar = document.getElementById('assessmentProgressBar');

    if (text) text.textContent = `${answered} / ${total}`;
    if (bar) bar.style.width = `${percent}%`;
}

function getMissingLevelButtonsHtml() {
    const missing = levelOrder.filter(levelId => {
        const indices = getQuestionsForLevel(levelId);
        return indices.some(idx => !labState.quiz.answers[idx]);
    });

    if (!missing.length) return '';

    return `
        <div class="missing-levels-list">
            ${missing.map(levelId => `<button class="ghost-btn" type="button" onclick="switchTab('${levelId}')">${levelInfo[levelId].shortTitle}</button>`).join('')}
        </div>`;
}

function renderLevelQuestionVisual(levelId) {
    const indices = getQuestionsForLevel(levelId);
    if (!indices.length) return;

    const visibleIndex = indices.find(idx => {
        const card = document.getElementById('q' + idx);
        return card && card.style.display !== 'none';
    });

    const firstUnanswered = indices.find(idx => !labState.quiz.answers[idx]);
    const qIndex = typeof visibleIndex === 'number'
        ? visibleIndex
        : (typeof firstUnanswered === 'number' ? firstUnanswered : indices[indices.length - 1]);

    currentQuestionIndex = qIndex;
    const qData = quizData[qIndex];

    if (levelId === 'quiz' && qData && qData.shape) {
        drawQuizShape(qData.shape, labState.quiz.answers[qIndex] ? qData.hl : null);
    }
}

function initQuizDOM() {
    levelOrder.forEach(levelId => {
        const info = levelInfo[levelId];
        const container = document.getElementById(info.containerId);
        if (!container) return;

        container.innerHTML = '';
        const indices = getQuestionsForLevel(levelId);

        indices.forEach((qIndex, localIndex) => {
            const q = quizData[qIndex];
            const isFirst = localIndex === 0;
            const isLastInLevel = localIndex === indices.length - 1;
            const isFinalQuestion = levelId === 'quiz' && isLastInLevel;
            const nextLabel = isFinalQuestion
                ? 'عرض النتيجة وإرسالها'
                : (isLastInLevel ? 'إنهاء أسئلة هذا المستوى' : 'السؤال التالي »');

            const html = `
                <div class="question-card" id="q${qIndex}" style="display: ${isFirst ? 'block' : 'none'};">
                    <div class="question-meta">
                        <span class="question-pill level">${info.shortTitle}</span>
                        <span class="question-pill">السؤال ${qIndex + 1} من ${quizData.length}</span>
                        <span class="question-pill">${localIndex + 1} / ${indices.length} في هذا المستوى</span>
                    </div>
                    <h3>${q.text}</h3>
                    <div class="options">
                        ${q.options.map((opt, i) => `<button class="option-btn" onclick="checkAnswer(${qIndex}, ${i}, this)">${opt}</button>`).join('')}
                    </div>
                    <div class="answer-feedback" id="feedback${qIndex}" aria-live="polite"></div>
                    <button class="next-btn" id="next${qIndex}" onclick="nextQuestion(${qIndex})" style="display:none;">${nextLabel}</button>
                </div>`;
            container.innerHTML += html;
        });

        if (levelId !== 'quiz') {
            const nextLevel = info.nextLevel;
            container.innerHTML += `
                <div class="level-completion-card" id="level-completion-${levelId}">
                    <h3>✅ أتممت أسئلة ${info.shortTitle}</h3>
                    <p>أحسنت. انتقل الآن إلى ${levelInfo[nextLevel].shortTitle}.</p>
                    <button class="next-btn" type="button" onclick="switchTab('${nextLevel}')">الانتقال إلى ${levelInfo[nextLevel].shortTitle}</button>
                </div>`;
        } else {
            container.innerHTML += `
                <div class="question-card" id="quiz-completion" style="display:none; text-align: center;">
                    <h2 style="color: #27ae60;">🎉 اكتملت أسئلة التحقق الموزعة!</h2>
                    <div class="score-board">
                        <p>✅ الإجابات الصحيحة: <strong id="correctScore" style="color: #27ae60;">0</strong></p>
                        <p>❌ الإجابات الخاطئة: <strong id="wrongScore" style="color: #e74c3c;">0</strong></p>
                        <p>📊 النسبة: <strong id="percentageScore" style="color: #2980b9;">0%</strong></p>
                    </div>

                    <div id="submitStatus" class="submit-status pending" aria-live="polite">
                        سيتم إرسال النتيجة إلى لوحة بيانات المعلم بعد إكمال جميع أسئلة المستويات وإدخال رمز الطالب والشعبة.
                    </div>

                    <div id="missingLevelsBox"></div>

                    <div class="completion-actions">
                        <button class="start-btn" type="button" onclick="submitLabResults()">إرسال النتيجة للمعلم</button>
                        <button class="ghost-btn" type="button" onclick="retryPendingSubmissions(true)">إعادة إرسال المحفوظ</button>
                        <button class="next-btn" type="button" onclick="location.reload()">إعادة التجربة</button>
                    </div>
                </div>`;
        }
    });

    updateAssessmentProgress();
}

function applyQuestionVisual(qData, answered = false) {
    if (!qData) return;

    if (qData.focusElement && typeof highlight === 'function') {
        highlight(qData.focusElement);
        return;
    }

    if (qData.exploreAction === 'showDiameter') {
        angle1 = 0;
        angle2 = Math.PI;
        drawExplore();
        return;
    }

    if (qData.compassHint) {
        setCompassFeedback(qData.compassHint, answered ? 'success' : 'info');
        drawCompass();
        return;
    }

    if (qData.shape && typeof drawQuizShape === 'function') {
        drawQuizShape(qData.shape, answered ? qData.hl : null);
    }
}

function drawQuizShape(shapeId, highlightData = null) {
    if (!qzCtx) return;

    qzCtx.clearRect(0, 0, 450, 450);
    const cx = 225;
    const cy = 225;
    const r = 150;

    qzCtx.beginPath();
    qzCtx.arc(cx, cy, r, 0, Math.PI * 2);
    qzCtx.strokeStyle = '#ecf0f1';
    qzCtx.lineWidth = 2;
    qzCtx.stroke();

    let pts = {};
    if (shapeId === 1) {
        pts = {
            M: { x: cx, y: cy, l: 'م', a: null },
            A: { x: cx + r * Math.cos(0.5), y: cy + r * Math.sin(0.5), l: 'أ', a: 0.5 },
            B: { x: cx - r, y: cy, l: 'ب', a: Math.PI },
            C: { x: cx + r, y: cy, l: 'ج', a: 0 },
            D: { x: cx + r * Math.cos(3.8), y: cy + r * Math.sin(3.8), l: 'د', a: 3.8 },
            E: { x: cx + r * Math.cos(5.2), y: cy + r * Math.sin(5.2), l: 'هـ', a: 5.2 }
        };
        drawQLine(pts.M, pts.A);
        drawQLine(pts.B, pts.C);
        drawQLine(pts.D, pts.E);
    } else {
        pts = {
            N: { x: cx, y: cy, l: 'ن', a: null },
            S: { x: cx + r * Math.cos(Math.PI / 4), y: cy + r * Math.sin(Math.PI / 4), l: 'س', a: Math.PI / 4 },
            Y: { x: cx + r * Math.cos(5 * Math.PI / 4), y: cy + r * Math.sin(5 * Math.PI / 4), l: 'ص', a: 5 * Math.PI / 4 },
            W: { x: cx + r * Math.cos(7 * Math.PI / 4), y: cy + r * Math.sin(7 * Math.PI / 4), l: 'و', a: 7 * Math.PI / 4 },
            X: { x: cx + r * Math.cos(Math.PI), y: cy + r * Math.sin(Math.PI), l: 'ع', a: Math.PI },
            L: { x: cx + r * Math.cos(3 * Math.PI / 2), y: cy + r * Math.sin(3 * Math.PI / 2), l: 'ل', a: 3 * Math.PI / 2 }
        };
        drawQLine(pts.S, pts.Y);
        drawQLine(pts.N, pts.W);
        drawQLine(pts.X, pts.L);
    }

    function drawQLine(p1, p2, c = '#bdc3c7', lw = 3) {
        if (!p1 || !p2) return;
        qzCtx.beginPath();
        qzCtx.moveTo(p1.x, p1.y);
        qzCtx.lineTo(p2.x, p2.y);
        qzCtx.strokeStyle = c;
        qzCtx.lineWidth = lw;
        qzCtx.stroke();
    }

    if (highlightData) {
        if (highlightData.type === 'line') {
            drawQLine(pts[highlightData.p1], pts[highlightData.p2], highlightData.c, 6);
        } else if (highlightData.type === 'arc') {
            qzCtx.beginPath();
            qzCtx.arc(cx, cy, r, highlightData.s, highlightData.e);
            qzCtx.strokeStyle = highlightData.c;
            qzCtx.lineWidth = 8;
            qzCtx.stroke();
        } else if (highlightData.type === 'multi_radius') {
            drawQLine(pts.N, pts.S, systemColors.radius, 6);
            drawQLine(pts.N, pts.Y, systemColors.radius, 6);
            drawQLine(pts.N, pts.W, systemColors.radius, 6);
        }
    }

    qzCtx.font = 'bold 26px Arial';
    qzCtx.fillStyle = '#2c3e50';
    Object.values(pts).forEach(p => {
        qzCtx.beginPath();
        qzCtx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        qzCtx.fill();
        const isCenter = p.a === null;
        const tx = isCenter ? p.x - 15 : p.x + Math.cos(p.a) * 30;
        const ty = isCenter ? p.y - 15 : p.y + Math.sin(p.a) * 30;
        qzCtx.textAlign = isCenter ? 'right' : (Math.cos(p.a) >= 0 ? 'left' : 'right');
        qzCtx.textBaseline = isCenter ? 'bottom' : 'middle';
        qzCtx.fillText(p.l, tx, ty);
    });
}

function checkAnswer(qIndex, selectedOptionIndex, btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('button').forEach(b => b.disabled = true);

    const qData = quizData[qIndex];
    const isCorrect = selectedOptionIndex === qData.correct;
    const selectedAnswer = qData.options[selectedOptionIndex];
    const correctAnswer = qData.options[qData.correct];
    const explanation = qData.feedback && qData.feedback[selectedOptionIndex]
        ? qData.feedback[selectedOptionIndex]
        : (isCorrect ? 'إجابة صحيحة.' : 'راجع العنصر المضاء في النشاط وحاول تفسير السبب.');
    const misconception = isCorrect
        ? ''
        : (qData.misconceptions && qData.misconceptions[selectedOptionIndex]
            ? qData.misconceptions[selectedOptionIndex]
            : 'خطأ غير مصنف');

    const successSound = document.getElementById('successSound');
    const failSound = document.getElementById('failSound');

    if (isCorrect) {
        correctScore++;
        btn.classList.add('correct');
        if (successSound) {
            successSound.currentTime = 0;
            successSound.play().catch(() => {});
        }
    } else {
        wrongScore++;
        btn.classList.add('wrong');
        parent.children[qData.correct].classList.add('correct');
        if (failSound) {
            failSound.currentTime = 0;
            failSound.play().catch(() => {});
        }
    }

    const levelTitle = levelInfo[qData.level].title;
    labState.quiz.answers[qIndex] = {
        questionIndex: qIndex + 1,
        questionLevel: qData.level,
        questionLevelTitle: levelTitle,
        questionText: `[${levelTitle}] ${qData.text}`,
        selectedOptionIndex,
        selectedAnswer,
        correctOptionIndex: qData.correct,
        correctAnswer,
        isCorrect,
        misconception,
        explanation,
        elapsedAtSecond: elapsedSeconds()
    };

    addLabEvent('quiz_answer', qData.level, `إجابة السؤال ${qIndex + 1}`, {
        questionIndex: qIndex + 1,
        level: qData.level,
        isCorrect,
        selectedAnswer,
        correctAnswer,
        misconception
    });

    const feedbackBox = document.getElementById('feedback' + qIndex);
    feedbackBox.innerHTML = `
        <span class="feedback-title">${isCorrect ? 'أحسنت! إجابة صحيحة ✅' : 'إجابة غير صحيحة، والتفسير هو:'}</span>
        <span>${explanation}</span>
        ${misconception ? `<span class="mini-rule">التشخيص: ${misconception}</span>` : '<span class="mini-rule">انظر إلى العنصر المضاء في النشاط لتثبيت الفكرة.</span>'}
    `;
    feedbackBox.className = `answer-feedback show ${isCorrect ? 'correct-feedback' : 'wrong-feedback'}`;

    applyQuestionVisual(qData, true);
    updateAssessmentProgress();
    updateNavigationLocks();
    document.getElementById('next' + qIndex).style.display = 'block';
}

function nextQuestion(currentIndex) {
    const qData = quizData[currentIndex];
    const levelId = qData.level;
    const levelQuestions = getQuestionsForLevel(levelId);
    const localIndex = levelQuestions.indexOf(currentIndex);
    const currentCard = document.getElementById('q' + currentIndex);
    if (currentCard) currentCard.style.display = 'none';

    if (localIndex + 1 < levelQuestions.length) {
        const nextIndex = levelQuestions[localIndex + 1];
        currentQuestionIndex = nextIndex;
        const nextCard = document.getElementById('q' + nextIndex);
        if (nextCard) nextCard.style.display = 'block';
        applyQuestionVisual(quizData[nextIndex], false);
        return;
    }

    if (levelId !== 'quiz') {
        const completion = document.getElementById('level-completion-' + levelId);
        if (completion) completion.style.display = 'block';
        addLabEvent('level_questions_completed', levelId, `اكتملت أسئلة ${levelInfo[levelId].shortTitle}`, getLevelSummary()[levelId]);
        updateAssessmentProgress();
        updateNavigationLocks();
        return;
    }

    finishDistributedAssessment();
}

function finishDistributedAssessment() {
    const completion = document.getElementById('quiz-completion');
    if (completion) completion.style.display = 'block';

    const answered = getAnsweredCount();
    const total = quizData.length;
    const percentage = total ? Math.round((correctScore / total) * 100) : 0;

    const correctEl = document.getElementById('correctScore');
    const wrongEl = document.getElementById('wrongScore');
    const percentageEl = document.getElementById('percentageScore');
    const missingBox = document.getElementById('missingLevelsBox');

    if (correctEl) correctEl.textContent = correctScore;
    if (wrongEl) wrongEl.textContent = wrongScore;
    if (percentageEl) percentageEl.textContent = `${percentage}%`;

    if (missingBox) {
        missingBox.innerHTML = answered < total
            ? `<div class="submit-status error">أجبت عن ${answered} من ${total}. أكمل أسئلة المستويات الناقصة قبل الإرسال.${getMissingLevelButtonsHtml()}</div>`
            : '';
    }

    addLabEvent('distributed_assessment_completed', 'summary', 'اكتملت أسئلة التحقق الموزعة', {
        score: correctScore,
        wrong: wrongScore,
        answered,
        total,
        percentage,
        levelSummary: getLevelSummary()
    });

    updateAssessmentProgress();

    if (answered === total) {
        submitLabResults();
    } else {
        setSubmitStatus('لم يتم إرسال النتيجة بعد؛ أكمل أسئلة التحقق في المستويات الناقصة أولاً.', 'error');
    }
}

// ==========================================
// تهيئة التطبيق
// ==========================================
loadSavedIdentity();
initQuizDOM();
updateNavigationLocks();
renderLevelQuestionVisual('identify');
addLabEvent('lab_loaded', 'general', 'تم تحميل مختبر هندسة الدائرة بنظام أسئلة موزعة على المستويات');
retryPendingSubmissions(false);
