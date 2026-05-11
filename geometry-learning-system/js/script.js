(function () {
  'use strict';

  const DATA = window.GEOMETRY_QUESTION_BANK;
  const STORAGE_KEY = 'geometryUnitApp.unified.v2';
  const ONLINE_QUEUE_KEY = 'geometryUnitApp.onlineQueue.v1';
  const ONLINE_MAX_QUEUE_SIZE = 300;

  const ONLINE_CONFIG = {
    enabled: true,
    endpoint: 'https://script.google.com/macros/s/AKfycbxNSR9Nw_QeYyNejTXIJv85PKXRhzRrh-Xh4cMZG1ezv4uSjqDET5Fjbe-D6lqnXVSYDg/exec',
    sendEveryAttempt: true,
    sendExitTickets: true,
    sendReports: true
  };

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');

  if (!DATA || !Array.isArray(DATA.lessons)) {
    app.innerHTML = '<div class="empty-state">تعذر تحميل ملف الأسئلة الموحد. تأكد من وجود الملف <code>data/geometry-questions.js</code>.</div>';
    return;
  }

  function createId(prefix = 'id') {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function createDefaultState() {
    return {
      sessionId: createId('session'),
      student: { name: '', className: '' },
      view: 'home',
      currentLessonId: null,
      currentQuestionByLesson: {},
      progress: {},
      exitTickets: {},
      openAnswers: {},
      lastFeedback: null,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  const defaultState = createDefaultState();
  let state = loadState();

  function loadState() {
    const base = createDefaultState();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return structuredCloneSafe(base);
      return {
        ...structuredCloneSafe(base),
        ...saved,
        sessionId: saved.sessionId || base.sessionId,
        student: { ...base.student, ...(saved.student || {}) },
        currentQuestionByLesson: saved.currentQuestionByLesson || {},
        progress: saved.progress || {},
        exitTickets: saved.exitTickets || {},
        openAnswers: saved.openAnswers || {}
      };
    } catch (err) {
      console.warn('تعذر قراءة حالة التطبيق المحفوظة.', err);
      return structuredCloneSafe(base);
    }
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('تعذر حفظ التقدم محلياً.', err);
      showToast('تعذر حفظ التقدم محلياً. قد تكون مساحة التخزين ممتلئة.');
    }
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  function onlineEnabled() {
    return Boolean(ONLINE_CONFIG.enabled && ONLINE_CONFIG.endpoint && ONLINE_CONFIG.endpoint.startsWith('https://'));
  }

  function buildOnlineEnvelope(action, payload) {
    return {
      action,
      payload,
      clientSentAt: new Date().toISOString(),
      sessionId: state.sessionId || createId('session'),
      appVersion: DATA.meta?.version || ''
    };
  }

  async function sendOnline(action, payload, options = {}) {
    if (!onlineEnabled()) return false;

    const envelope = buildOnlineEnvelope(action, payload);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      queueOnline(envelope);
      if (options.toast) showToast('لا يوجد اتصال بالإنترنت. تم حفظ البيانات مؤقتاً وستُرسل لاحقاً.');
      return false;
    }

    try {
      await fetch(ONLINE_CONFIG.endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(envelope)
      });

      if (options.toast) showToast(options.successMessage || 'تم إرسال البيانات إلكترونياً.');
      return true;
    } catch (err) {
      queueOnline(envelope);
      console.warn('تعذر الإرسال Online، تم حفظ البيانات في قائمة انتظار محلية.', err);
      if (options.toast) showToast('تعذر الإرسال الآن. تم حفظ البيانات مؤقتاً وستُرسل عند توفر الاتصال.');
      return false;
    }
  }

  function queueOnline(envelope) {
    try {
      const queue = JSON.parse(localStorage.getItem(ONLINE_QUEUE_KEY) || '[]');
      queue.push({
        ...envelope,
        queuedAt: new Date().toISOString()
      });
      const trimmed = queue.slice(-ONLINE_MAX_QUEUE_SIZE);
      localStorage.setItem(ONLINE_QUEUE_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.warn('تعذر حفظ قائمة الإرسال المؤجل.', err);
    }
  }

  async function syncOnlineQueue(options = {}) {
    if (!onlineEnabled()) return;

    let queue = [];
    try {
      queue = JSON.parse(localStorage.getItem(ONLINE_QUEUE_KEY) || '[]');
    } catch (err) {
      queue = [];
    }

    if (!Array.isArray(queue) || queue.length === 0) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const remaining = [];
    let sent = 0;

    for (const item of queue) {
      try {
        await fetch(ONLINE_CONFIG.endpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(item)
        });
        sent += 1;
      } catch (err) {
        remaining.push(item);
      }
    }

    try {
      localStorage.setItem(ONLINE_QUEUE_KEY, JSON.stringify(remaining));
    } catch (err) {
      console.warn('تعذر تحديث قائمة الإرسال المؤجل.', err);
    }

    if (options.toast && sent > 0 && remaining.length === 0) {
      showToast(`تمت مزامنة ${sent} عملية إرسال مؤجلة.`);
    }
  }

  function getLesson(id) {
    return DATA.lessons.find(lesson => lesson.id === id) || DATA.lessons[0];
  }

  function getQuestion(lessonId, index) {
    const lesson = getLesson(lessonId);
    return lesson.questions[index] || lesson.questions[0];
  }

  function findQuestion(qid) {
    for (const lesson of DATA.lessons) {
      const question = lesson.questions.find(q => q.id === qid);
      if (question) return { lesson, question };
    }
    return null;
  }

  function getQuestionMax(question) {
    if (question.type === 'open') return Number(question.score || DATA.scoring.openTaskScore || 5);
    return Number(DATA.scoring.maxPerQuestion || 10);
  }

  function defaultQuestionProgress() {
    return {
      attempts: 0,
      completed: false,
      correct: false,
      score: 0,
      wrongCount: 0,
      lastAnswer: '',
      misconceptions: [],
      completedAt: ''
    };
  }

  function getProgress(qid) {
    return state.progress[qid] || defaultQuestionProgress();
  }

  function saveProgress(qid, progress) {
    state.progress[qid] = progress;
    saveState();
  }

  function scoreForAttempt(question, attemptNumber) {
    if (question.type === 'open') return getQuestionMax(question);
    if (attemptNumber <= 1) return DATA.scoring.firstAttempt || 10;
    if (attemptNumber === 2) return DATA.scoring.secondAttempt || 7;
    if (attemptNumber === 3) return DATA.scoring.thirdAttempt || 5;
    return 0;
  }

  function lessonStats(lesson) {
    const questionMax = lesson.questions.reduce((sum, q) => sum + getQuestionMax(q), 0);
    const questionScore = lesson.questions.reduce((sum, q) => sum + Number(getProgress(q.id).score || 0), 0);
    const completedQuestions = lesson.questions.filter(q => getProgress(q.id).completed).length;
    const exitAnswered = Boolean((state.exitTickets[lesson.id] || '').trim());
    const exitScore = exitAnswered ? Number(DATA.scoring.exitTicketBonus || 5) : 0;
    const max = questionMax + Number(DATA.scoring.exitTicketBonus || 5);
    const score = questionScore + exitScore;
    const completed = completedQuestions === lesson.questions.length && exitAnswered;
    const percentage = max ? Math.round((score / max) * 100) : 0;
    return { questionMax, questionScore, completedQuestions, exitAnswered, exitScore, max, score, completed, percentage };
  }

  function overallStats() {
    const stats = DATA.lessons.map(lessonStats);
    const score = stats.reduce((sum, item) => sum + item.score, 0);
    const max = stats.reduce((sum, item) => sum + item.max, 0);
    const completedLessons = stats.filter(item => item.completed).length;
    const completedQuestions = DATA.lessons.reduce((sum, lesson) => sum + lesson.questions.filter(q => getProgress(q.id).completed).length, 0);
    const totalQuestions = DATA.lessons.reduce((sum, lesson) => sum + lesson.questions.length, 0);
    return {
      score,
      max,
      percentage: max ? Math.round((score / max) * 100) : 0,
      completedLessons,
      lessonCount: DATA.lessons.length,
      completedQuestions,
      totalQuestions
    };
  }

  function lessonStatusClass(stats) {
    if (stats.completed) return 'done';
    if (stats.completedQuestions > 0 || stats.exitAnswered) return 'progress';
    return 'pending';
  }

  function lessonStatusText(stats) {
    if (stats.completed) return 'مكتمل';
    if (stats.completedQuestions > 0 || stats.exitAnswered) return 'قيد الإنجاز';
    return 'لم يبدأ';
  }

  function render() {
    const view = state.view || 'home';
    if (view === 'map') return renderMap();
    if (view === 'lesson') return renderLesson(state.currentLessonId || DATA.lessons[0].id);
    if (view === 'report') return renderReport();
    if (view === 'teacher') return renderTeacher();
    return renderHome();
  }

  function renderHome() {
    const stats = overallStats();
    state.view = 'home';
    app.innerHTML = `
      <section class="hero-card">
        <div class="hero-content">
          <span class="tag primary">${escapeHtml(DATA.meta.version)}</span>
          <h2 class="hero-title">${escapeHtml(DATA.meta.appTitle)}</h2>
          <p class="hero-text">${escapeHtml(DATA.meta.subtitle)}. التطبيق يعمل مباشرة من المتصفح دون خادم؛ لأن ملف الأسئلة الموحّد محمّل بصيغة JavaScript منفصلة.</p>

          <div class="student-form" aria-label="بيانات الطالب">
            <div class="input-group">
              <label for="studentName">اسم الطالب/الطالبة</label>
              <input id="studentName" class="input" type="text" maxlength="60" autocomplete="name" value="${escapeHtml(state.student.name)}" placeholder="اكتب الاسم هنا">
            </div>
            <div class="input-group">
              <label for="className">الشعبة</label>
              <input id="className" class="input" type="text" maxlength="20" value="${escapeHtml(state.student.className)}" placeholder="مثال: السادس أ">
            </div>
          </div>

          <div class="btn-row">
            <button type="button" class="btn" data-action="start-map">بدء رحلة الهندسة</button>
            <button type="button" class="btn ghost" data-action="save-student">حفظ البيانات</button>
            <button type="button" class="btn ghost" data-action="report">عرض التقرير</button>
          </div>
        </div>

        <aside class="hero-stats" aria-label="ملخص التقدم">
          <div class="stat-card"><strong>${stats.completedLessons}/${stats.lessonCount}</strong><span>دروس مكتملة</span></div>
          <div class="stat-card"><strong>${stats.completedQuestions}/${stats.totalQuestions}</strong><span>أسئلة منجزة</span></div>
          <div class="stat-card"><strong>${stats.percentage}%</strong><span>نسبة التقدم والإنجاز</span></div>
        </aside>
      </section>

      <div class="section-title">
        <div>
          <h2>خريطة التعلم</h2>
          <p>كل محطة مرتبطة بهدف تعليمي، نشاط تفاعلي، تغذية راجعة، وبطاقة خروج.</p>
        </div>
        <button class="btn ghost small" type="button" data-action="map">فتح الخريطة كاملة</button>
      </div>
      ${renderLessonGrid(DATA.lessons.slice(0, 4))}
    `;
  }

  function renderMap() {
    state.view = 'map';
    const stats = overallStats();
    app.innerHTML = `
      <section class="panel" style="padding: 22px;">
        <div class="section-title" style="margin-top:0;">
          <div>
            <span class="tag primary">${escapeHtml(DATA.meta.grade)}</span>
            <h2>خريطة وحدة الهندسة</h2>
            <p>ابدأ بالارتفاعات ثم المساحات ثم الدائرة، وانتهِ بالمهمة الأدائية الختامية.</p>
          </div>
          <div class="status-pill ${stats.completedLessons === stats.lessonCount ? 'done' : 'progress'}">${stats.percentage}% إنجاز</div>
        </div>
        <div class="progress-track" aria-label="تقدم الوحدة"><span class="progress-fill" style="width:${stats.percentage}%"></span></div>
      </section>
      ${renderLessonGrid(DATA.lessons)}
    `;
  }

  function renderLessonGrid(lessons) {
    return `<section class="lesson-grid" aria-label="دروس الوحدة">
      ${lessons.map(lesson => {
        const stats = lessonStats(lesson);
        const statusClass = lessonStatusClass(stats);
        return `
          <article class="lesson-card" data-action="open-lesson" data-lesson-id="${escapeHtml(lesson.id)}" tabindex="0" role="button" aria-label="فتح درس ${escapeHtml(lesson.title)}">
            <div class="icon" aria-hidden="true">${escapeHtml(lesson.icon)}</div>
            <div class="status-pill ${statusClass}">${lessonStatusText(stats)}</div>
            <h3>${escapeHtml(lesson.order)}. ${escapeHtml(lesson.title)}</h3>
            <p>${escapeHtml(lesson.objective)}</p>
            <div class="progress-track"><span class="progress-fill" style="width:${stats.percentage}%"></span></div>
            <small>${stats.completedQuestions}/${lesson.questions.length} أسئلة + بطاقة خروج</small>
          </article>
        `;
      }).join('')}
    </section>`;
  }

  function renderLesson(lessonId) {
    const lesson = getLesson(lessonId);
    state.view = 'lesson';
    state.currentLessonId = lesson.id;
    const index = clampIndex(Number(state.currentQuestionByLesson[lesson.id] || 0), lesson.questions.length);
    state.currentQuestionByLesson[lesson.id] = index;
    const question = lesson.questions[index];
    const stats = lessonStats(lesson);

    app.innerHTML = `
      <section class="lesson-layout">
        <aside class="sidebar">
          <span class="tag primary">الدرس ${lesson.order}</span>
          <h2>${escapeHtml(lesson.icon)} ${escapeHtml(lesson.title)}</h2>
          <p><strong>الفكرة الكبرى:</strong> ${escapeHtml(lesson.bigIdea)}</p>
          <div class="progress-track"><span class="progress-fill" style="width:${stats.percentage}%"></span></div>
          <p class="unit-note">${stats.completedQuestions}/${lesson.questions.length} أسئلة، بطاقة الخروج: ${stats.exitAnswered ? 'منجزة' : 'غير منجزة'}.</p>

          <div class="lesson-mini-list" aria-label="أسئلة الدرس">
            ${lesson.questions.map((q, i) => {
              const p = getProgress(q.id);
              const cls = i === index ? 'active' : '';
              const icon = p.completed ? (p.correct ? '✓' : '•') : '…';
              return `<button type="button" class="mini-item ${cls}" data-action="go-question" data-index="${i}"><span>سؤال ${i + 1}</span><strong>${icon}</strong></button>`;
            }).join('')}
          </div>

          <div class="btn-row">
            <button type="button" class="btn ghost small" data-action="map">العودة للخريطة</button>
            <button type="button" class="btn ghost small" data-action="report">التقرير</button>
          </div>
        </aside>

        <div class="lesson-main">
          <div class="info-grid">
            <div class="info-box"><strong>هدف الدرس</strong><p>${escapeHtml(lesson.objective)}</p></div>
            <div class="info-box"><strong>تمهيد</strong><p>${escapeHtml(lesson.warmup)}</p></div>
            <div class="info-box"><strong>توجيه للمعلم</strong><p>${escapeHtml(lesson.teacherMove)}</p></div>
          </div>

          ${renderQuestionCard(lesson, question, index)}
          ${renderExitTicket(lesson)}
        </div>
      </section>
    `;
  }

  function clampIndex(index, length) {
    if (!Number.isFinite(index) || index < 0) return 0;
    if (index >= length) return Math.max(0, length - 1);
    return index;
  }

  function renderQuestionCard(lesson, question, index) {
    const p = getProgress(question.id);
    const feedback = state.lastFeedback && state.lastFeedback.qid === question.id ? state.lastFeedback : null;
    return `
      <article class="question-card" aria-label="سؤال تفاعلي">
        <div class="question-header">
          <span class="question-pill">السؤال ${index + 1} من ${lesson.questions.length}</span>
          <span class="tag ${p.completed ? (p.correct ? 'success' : 'danger') : 'warning'}">${p.completed ? (p.correct ? `منجز: ${p.score}/${getQuestionMax(question)}` : 'انتهت المحاولات') : `المحاولة ${Math.min(p.attempts + 1, DATA.scoring.maxAttempts)}/${DATA.scoring.maxAttempts}`}</span>
        </div>
        <h3 class="question-prompt">${escapeHtml(question.prompt)}</h3>
        <div class="question-workspace">
          <div class="visual-card">${renderVisual(question.visual || {}, question)}</div>
          <div class="answer-panel">
            ${question.formula ? `<div class="formula-box">${escapeHtml(question.formula)}</div>` : ''}
            ${renderAnswerControl(question, p)}
            ${feedback ? renderFeedback(feedback) : renderProgressHint(question, p)}
            <div class="btn-row">
              <button type="button" class="btn ghost small" data-action="prev-question" ${index === 0 ? 'disabled' : ''}>السابق</button>
              <button type="button" class="btn ghost small" data-action="next-question" ${index === lesson.questions.length - 1 ? 'disabled' : ''}>التالي</button>
              <button type="button" class="btn ghost small" data-action="reset-question" data-qid="${escapeHtml(question.id)}">إعادة هذا السؤال</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderAnswerControl(question, progress) {
    if (question.type === 'choice') return renderChoiceControl(question, progress);
    if (question.type === 'number') return renderNumberControl(question, progress);
    if (question.type === 'matching') return renderMatchingControl(question, progress);
    if (question.type === 'slider') return renderSliderControl(question, progress);
    if (question.type === 'open') return renderOpenControl(question, progress);
    return '<div class="empty-state">نوع سؤال غير مدعوم في ملف الأسئلة.</div>';
  }

  function renderChoiceControl(question, progress) {
    const disabled = progress.completed ? 'disabled' : '';
    return `<div class="option-list" role="group" aria-label="اختيارات الإجابة">
      ${question.options.map((option, i) => {
        let cls = '';
        if (progress.completed && i === question.answerIndex) cls = 'correct';
        if (progress.completed && progress.lastAnswer === i && i !== question.answerIndex) cls = 'wrong';
        return `<button type="button" class="option-btn ${cls}" data-action="answer-choice" data-qid="${escapeHtml(question.id)}" data-index="${i}" ${disabled}>
          <span>${escapeHtml(option)}</span><strong>${i + 1}</strong>
        </button>`;
      }).join('')}
    </div>`;
  }

  function renderNumberControl(question, progress) {
    if (progress.completed) {
      return `<div class="feedback-box info"><h4>الإجابة المسجلة</h4><p>${escapeHtml(progress.lastAnswer)} ${escapeHtml(question.unit || '')}</p><p class="hint">الإجابة الصحيحة: ${escapeHtml(formatCorrectAnswer(question))}</p></div>`;
    }
    return `
      <div class="number-form">
        <input class="input" id="numericAnswer" type="text" inputmode="decimal" data-qid="${escapeHtml(question.id)}" placeholder="اكتب الإجابة العددية هنا">
        <button class="btn" type="button" data-action="answer-number" data-qid="${escapeHtml(question.id)}">تحقق</button>
      </div>
      <p class="unit-note">اكتب العدد فقط. الوحدة المطلوبة: ${escapeHtml(question.unit || 'حسب السؤال')}.</p>
    `;
  }

  function renderSliderControl(question, progress) {
    if (progress.completed) {
      return `<div class="feedback-box info"><h4>الإجابة المسجلة</h4><p>${escapeHtml(progress.lastAnswer)} ${escapeHtml(question.unit || '')}</p><p class="hint">الإجابة الصحيحة: ${escapeHtml(formatCorrectAnswer(question))}</p></div>`;
    }
    const value = question.min || 1;
    return `
      <div class="slider-wrap">
        <label for="sliderAnswer">فتحة الفرجار الحالية: <span class="slider-value" id="sliderValue">${value}</span> ${escapeHtml(question.unit || '')}</label>
        <input id="sliderAnswer" type="range" min="${question.min}" max="${question.max}" step="${question.step || 1}" value="${value}" data-qid="${escapeHtml(question.id)}">
        <button class="btn" type="button" data-action="answer-slider" data-qid="${escapeHtml(question.id)}">تحقق من الفتحة</button>
      </div>
    `;
  }

  function renderMatchingControl(question, progress) {
    if (progress.completed) {
      return `<div class="feedback-box info"><h4>لعبة المطابقة</h4><p>${progress.correct ? 'تمت المطابقة بنجاح.' : 'انتهت المحاولات. راجع التعريفات في بطاقة التغذية الراجعة.'}</p></div>`;
    }
    const terms = question.pairs.map(pair => pair.term);
    const shuffled = deterministicShuffle(terms, question.id);
    return `
      <div class="matching-table" aria-label="مطابقة التعريفات">
        ${question.pairs.map((pair, i) => `
          <div class="match-row">
            <p>${escapeHtml(pair.definition)}</p>
            <select class="select" data-match-index="${i}" aria-label="اختر المصطلح للتعريف ${i + 1}">
              <option value="">اختر المصطلح</option>
              ${shuffled.map(term => `<option value="${escapeHtml(term)}">${escapeHtml(term)}</option>`).join('')}
            </select>
          </div>
        `).join('')}
      </div>
      <button class="btn" type="button" data-action="answer-matching" data-qid="${escapeHtml(question.id)}">تحقق من المطابقة</button>
    `;
  }

  function renderOpenControl(question, progress) {
    const saved = state.openAnswers[question.id] || '';
    return `
      <textarea class="textarea" id="openAnswer" data-qid="${escapeHtml(question.id)}" placeholder="اكتب إجابتك هنا...">${escapeHtml(saved)}</textarea>
      <p class="unit-note">الحد الأدنى المقترح: ${question.minLength || 30} حرفاً. هذه مهمة أدائية تُسجّل للمعلم.</p>
      <button class="btn" type="button" data-action="answer-open" data-qid="${escapeHtml(question.id)}">حفظ المهمة</button>
    `;
  }

  function renderProgressHint(question, progress) {
    if (progress.completed && progress.correct) {
      return `<div class="feedback-box correct"><h4>تم الإنجاز</h4><p>${escapeHtml(question.feedback.correct)}</p></div>`;
    }
    if (progress.completed && !progress.correct) {
      return `<div class="feedback-box wrong"><h4>راجع المفهوم</h4><p>${escapeHtml(question.feedback.wrong)}</p><p class="hint">الإجابة الصحيحة: ${escapeHtml(formatCorrectAnswer(question))}</p></div>`;
    }
    return `<div class="feedback-box info"><h4>تلميح تعليمي</h4><p>${escapeHtml(question.feedback.hint || 'اقرأ السؤال وحدد المعطيات قبل الإجابة.')}</p></div>`;
  }

  function renderFeedback(feedback) {
    const cls = feedback.type === 'correct' ? 'correct' : feedback.type === 'wrong' ? 'wrong' : 'info';
    return `<div class="feedback-box ${cls}"><h4>${escapeHtml(feedback.title)}</h4><p>${escapeHtml(feedback.message)}</p>${feedback.hint ? `<p class="hint">${escapeHtml(feedback.hint)}</p>` : ''}</div>`;
  }

  function renderExitTicket(lesson) {
    const answer = state.exitTickets[lesson.id] || '';
    const answered = Boolean(answer.trim());
    return `
      <section class="exit-ticket" aria-label="بطاقة خروج">
        <div class="question-header">
          <h3>بطاقة خروج الدرس</h3>
          <span class="tag ${answered ? 'success' : 'warning'}">${answered ? `+${DATA.scoring.exitTicketBonus} نقاط` : 'غير منجزة'}</span>
        </div>
        <p>${escapeHtml(lesson.exitTicket)}</p>
        <textarea class="textarea" id="exitTicketAnswer" placeholder="اكتب إجابة بطاقة الخروج هنا...">${escapeHtml(answer)}</textarea>
        <div class="btn-row">
          <button type="button" class="btn success" data-action="save-exit-ticket" data-lesson-id="${escapeHtml(lesson.id)}">حفظ بطاقة الخروج</button>
          <button type="button" class="btn ghost" data-action="next-lesson">الدرس التالي</button>
        </div>
      </section>
    `;
  }

  function deterministicShuffle(items, seedText) {
    const arr = [...items];
    let seed = 0;
    for (let i = 0; i < seedText.length; i++) seed += seedText.charCodeAt(i) * (i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = seed % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function parseStudentFields() {
    const name = document.getElementById('studentName')?.value || state.student.name || '';
    const className = document.getElementById('className')?.value || state.student.className || '';
    state.student.name = name.trim().replace(/\s+/g, ' ').slice(0, 60);
    state.student.className = className.trim().replace(/\s+/g, ' ').slice(0, 20);
    saveState();
  }

  function evaluateChoice(qid, index) {
    const found = findQuestion(qid);
    if (!found) return;
    const { question } = found;
    const isCorrect = Number(index) === Number(question.answerIndex);
    recordAttempt(question, isCorrect, Number(index));
  }

  function evaluateNumber(qid) {
    const found = findQuestion(qid);
    if (!found) return;
    const { question } = found;
    const input = document.getElementById('numericAnswer');
    const raw = input ? input.value : '';
    const value = normalizeNumber(raw);
    if (Number.isNaN(value)) {
      state.lastFeedback = { qid, type: 'info', title: 'تنبيه', message: 'اكتب رقماً واضحاً. يمكنك استخدام الأرقام العربية أو الإنجليزية.', hint: question.feedback.hint };
      render();
      return;
    }
    const tol = Number(question.tolerance ?? 0.01);
    const isCorrect = Math.abs(value - Number(question.answer)) <= tol;
    recordAttempt(question, isCorrect, value);
  }

  function evaluateSlider(qid) {
    const found = findQuestion(qid);
    if (!found) return;
    const { question } = found;
    const input = document.getElementById('sliderAnswer');
    const value = Number(input ? input.value : 0);
    const tol = Number(question.tolerance ?? 0);
    const isCorrect = Math.abs(value - Number(question.answer)) <= tol;
    recordAttempt(question, isCorrect, value);
  }

  function evaluateMatching(qid) {
    const found = findQuestion(qid);
    if (!found) return;
    const { question } = found;
    const selects = [...document.querySelectorAll('[data-match-index]')];
    if (!selects.length) return;
    let correct = 0;
    const selected = [];
    selects.forEach(sel => {
      const i = Number(sel.dataset.matchIndex);
      const val = sel.value;
      selected[i] = val;
      if (val === question.pairs[i].term) correct += 1;
    });
    const isCorrect = correct === question.pairs.length;
    recordAttempt(question, isCorrect, `${correct}/${question.pairs.length}`, {
      message: isCorrect ? question.feedback.correct : `طابقت ${correct} من ${question.pairs.length} تعريفات بشكل صحيح.`,
      hint: question.feedback.hint
    });
  }

  function evaluateOpen(qid) {
    const found = findQuestion(qid);
    if (!found) return;
    const { question } = found;
    const textarea = document.getElementById('openAnswer');
    const answer = (textarea ? textarea.value : '').trim();
    state.openAnswers[qid] = answer;
    if (answer.length < Number(question.minLength || 30)) {
      state.lastFeedback = { qid, type: 'info', title: 'إجابة غير كافية بعد', message: question.feedback.wrong, hint: question.feedback.hint };
      saveState();
      render();
      return;
    }
    const p = getProgress(qid);
    p.attempts = Math.max(1, p.attempts || 1);
    p.completed = true;
    p.correct = true;
    p.score = getQuestionMax(question);
    p.lastAnswer = answer;
    p.completedAt = new Date().toISOString();
    saveProgress(qid, p);
    sendAnswerOnline(question, p, answer, true, { message: question.feedback.correct });
    state.lastFeedback = { qid, type: 'correct', title: 'تم حفظ المهمة الأدائية', message: question.feedback.correct, hint: '' };
    saveState();
    render();
  }

  function getStudentAnswerForOnline(question, answerValue) {
    if (question.type === 'choice') {
      const index = Number(answerValue);
      return {
        index,
        text: question.options?.[index] || ''
      };
    }

    if (question.type === 'matching') {
      return {
        summary: String(answerValue || ''),
        correctPairs: question.pairs?.map(pair => ({ term: pair.term, definition: pair.definition })) || []
      };
    }

    return answerValue;
  }

  function buildAnswerPayload(question, progress, answerValue, isCorrect, options = {}) {
    const found = findQuestion(question.id);
    const lesson = found ? found.lesson : getLesson(state.currentLessonId);
    const message = isCorrect
      ? (options.message || question.feedback?.correct || '')
      : (options.message || question.feedback?.wrong || '');

    return {
      sessionId: state.sessionId || createId('session'),
      studentName: state.student.name || '',
      className: state.student.className || '',
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      questionId: question.id,
      questionType: question.type,
      prompt: question.prompt,
      studentAnswer: getStudentAnswerForOnline(question, answerValue),
      correctAnswer: formatCorrectAnswer(question),
      isCorrect: Boolean(isCorrect),
      attempts: Number(progress.attempts || 0),
      score: Number(progress.score || 0),
      maxScore: getQuestionMax(question),
      misconception: question.misconception || '',
      feedback: message,
      progressSnapshot: structuredCloneSafe(progress),
      clientTimestamp: new Date().toISOString(),
      appVersion: DATA.meta?.version || ''
    };
  }

  function sendAnswerOnline(question, progress, answerValue, isCorrect, options = {}) {
    if (!ONLINE_CONFIG.sendEveryAttempt) return;
    const payload = buildAnswerPayload(question, progress, answerValue, isCorrect, options);
    sendOnline('submitAnswer', payload);
  }

  function recordAttempt(question, isCorrect, answerValue, options = {}) {
    const p = getProgress(question.id);
    if (p.completed) {
      showToast('هذا السؤال منجز. يمكنك استخدام زر إعادة هذا السؤال إذا أردت المحاولة من جديد.');
      return;
    }

    p.attempts = Number(p.attempts || 0) + 1;
    p.lastAnswer = answerValue;

    if (isCorrect) {
      p.completed = true;
      p.correct = true;
      p.score = scoreForAttempt(question, p.attempts);
      p.completedAt = new Date().toISOString();
      state.lastFeedback = {
        qid: question.id,
        type: 'correct',
        title: `إجابة صحيحة (+${p.score})`,
        message: options.message || question.feedback.correct,
        hint: p.attempts > 1 ? 'رائع، استفدت من التغذية الراجعة وعدت إلى الحل الصحيح.' : ''
      };
    } else {
      p.correct = false;
      p.wrongCount = Number(p.wrongCount || 0) + 1;
      if (question.misconception && !p.misconceptions.includes(question.misconception)) {
        p.misconceptions.push(question.misconception);
      }

      const maxAttempts = Number(DATA.scoring.maxAttempts || 3);
      if (p.attempts >= maxAttempts) {
        p.completed = true;
        p.score = 0;
        p.completedAt = new Date().toISOString();
        state.lastFeedback = {
          qid: question.id,
          type: 'wrong',
          title: 'انتهت المحاولات',
          message: `${options.message || question.feedback.wrong} الإجابة الصحيحة: ${formatCorrectAnswer(question)}.`,
          hint: question.feedback.hint
        };
      } else {
        p.completed = false;
        state.lastFeedback = {
          qid: question.id,
          type: 'wrong',
          title: `ليست صحيحة بعد (${p.attempts}/${maxAttempts})`,
          message: options.message || question.feedback.wrong,
          hint: question.feedback.hint
        };
      }
    }

    saveProgress(question.id, p);
    sendAnswerOnline(question, p, answerValue, isCorrect, {
      message: state.lastFeedback?.qid === question.id ? state.lastFeedback.message : ''
    });
    render();
  }

  function formatCorrectAnswer(question) {
    if (question.type === 'choice') return question.options[question.answerIndex];
    if (question.type === 'number') return `${question.answer} ${question.unit || ''}`.trim();
    if (question.type === 'slider') return `${question.answer} ${question.unit || ''}`.trim();
    if (question.type === 'matching') return 'مطابقة كل مصطلح مع تعريفه الصحيح';
    if (question.type === 'open') return 'إجابة أدائية مستوفية للشروط';
    return '';
  }

  function normalizeNumber(raw) {
    const arabic = '٠١٢٣٤٥٦٧٨٩';
    const persian = '۰۱۲۳۴۵۶۷۸۹';
    let value = String(raw || '').trim();
    value = value.replace(/[٠-٩]/g, d => arabic.indexOf(d));
    value = value.replace(/[۰-۹]/g, d => persian.indexOf(d));
    value = value.replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
    if (!value || value === '-' || value === '.') return NaN;
    return Number(value);
  }

  function saveExitTicket(lessonId) {
    const val = document.getElementById('exitTicketAnswer')?.value || '';
    const lesson = getLesson(lessonId);
    state.exitTickets[lessonId] = val.trim();
    state.lastFeedback = null;
    saveState();

    if (ONLINE_CONFIG.sendExitTickets && state.exitTickets[lessonId]) {
      sendOnline('submitExitTicket', {
        sessionId: state.sessionId || createId('session'),
        studentName: state.student.name || '',
        className: state.student.className || '',
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        exitTicket: lesson.exitTicket,
        answer: state.exitTickets[lessonId],
        clientTimestamp: new Date().toISOString(),
        appVersion: DATA.meta?.version || ''
      });
    }

    showToast('تم حفظ بطاقة الخروج.');
    render();
  }

  function resetQuestion(qid) {
    delete state.progress[qid];
    if (state.lastFeedback?.qid === qid) state.lastFeedback = null;
    saveState();
    showToast('تمت إعادة السؤال.');
    render();
  }

  function nextLesson() {
    const current = getLesson(state.currentLessonId);
    const index = DATA.lessons.findIndex(l => l.id === current.id);
    const next = DATA.lessons[index + 1] || DATA.lessons[0];
    state.currentLessonId = next.id;
    state.currentQuestionByLesson[next.id] = state.currentQuestionByLesson[next.id] || 0;
    state.lastFeedback = null;
    state.view = 'lesson';
    saveState();
    render();
  }

  function goQuestion(deltaOrIndex, absolute = false) {
    const lesson = getLesson(state.currentLessonId);
    const current = Number(state.currentQuestionByLesson[lesson.id] || 0);
    const next = absolute ? Number(deltaOrIndex) : current + Number(deltaOrIndex);
    state.currentQuestionByLesson[lesson.id] = clampIndex(next, lesson.questions.length);
    state.lastFeedback = null;
    saveState();
    render();
  }

  function renderReport() {
    state.view = 'report';
    const stats = overallStats();
    const studentName = state.student.name || 'غير محدد';
    const className = state.student.className || 'غير محددة';
    const misconceptions = getMisconceptionCounts();
    app.innerHTML = `
      <section class="panel" style="padding:22px;">
        <div class="section-title" style="margin-top:0;">
          <div>
            <span class="tag primary">تقرير الطالب</span>
            <h2>${escapeHtml(studentName)} - ${escapeHtml(className)}</h2>
            <p>ملخص قابل للطباعة والتصدير، يدعم ملف الإنجاز والتغذية الراجعة.</p>
          </div>
          <div class="btn-row">
            <button class="btn ghost small" type="button" data-action="print-report">طباعة</button>
            <button class="btn ghost small" type="button" data-action="export-report">تصدير JSON</button>
            <button class="btn success small" type="button" data-action="send-report-online">حفظ التقرير Online</button>
          </div>
        </div>
        <div class="report-grid">
          <div class="report-card"><h3>النسبة العامة</h3><div class="big-number">${stats.percentage}%</div><p>${stats.score}/${stats.max} نقطة</p></div>
          <div class="report-card"><h3>الدروس المكتملة</h3><div class="big-number">${stats.completedLessons}/${stats.lessonCount}</div><p>تشمل بطاقة الخروج لكل درس.</p></div>
          <div class="report-card"><h3>الأسئلة المنجزة</h3><div class="big-number">${stats.completedQuestions}/${stats.totalQuestions}</div><p>تُحتسب المحاولات والتغذية الراجعة.</p></div>
        </div>
      </section>

      <div class="section-title"><div><h2>تفصيل الدروس</h2><p>يعرض نسبة كل درس، وعدد الأسئلة المنجزة، وحالة بطاقة الخروج.</p></div></div>
      ${renderLessonsReportTable()}

      <div class="section-title"><div><h2>الأخطاء الشائعة والتوصيات</h2><p>تُجمع تلقائياً من محاولات الطالب غير الصحيحة.</p></div></div>
      ${renderMisconceptionPanel(misconceptions)}
    `;
  }

  function renderLessonsReportTable() {
    return `<div class="table-wrap"><table class="report-table">
      <thead><tr><th>الدرس</th><th>الأسئلة</th><th>بطاقة الخروج</th><th>النقاط</th><th>النسبة</th><th>الحالة</th></tr></thead>
      <tbody>
        ${DATA.lessons.map(lesson => {
          const s = lessonStats(lesson);
          return `<tr>
            <td>${escapeHtml(lesson.title)}</td>
            <td>${s.completedQuestions}/${lesson.questions.length}</td>
            <td>${s.exitAnswered ? 'منجزة' : 'غير منجزة'}</td>
            <td>${s.score}/${s.max}</td>
            <td>${s.percentage}%</td>
            <td><span class="status-pill ${lessonStatusClass(s)}">${lessonStatusText(s)}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`;
  }

  function getMisconceptionCounts() {
    const counts = new Map();
    Object.values(state.progress).forEach(p => {
      (p.misconceptions || []).forEach(item => {
        counts.set(item, (counts.get(item) || 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }

  function renderMisconceptionPanel(items) {
    if (!items.length) {
      return '<div class="empty-state">لا توجد أخطاء شائعة مسجلة حتى الآن. هذا يعني أن الطالب لم يخطئ أو لم يبدأ المحاولة بعد.</div>';
    }
    return `<div class="report-grid">
      ${items.map(([text, count]) => `<div class="report-card"><h3>${escapeHtml(text)}</h3><p><strong>${count}</strong> مرة</p><p>${escapeHtml(recommendationFor(text))}</p></div>`).join('')}
    </div>`;
  }

  function recommendationFor(text) {
    if (text.includes('الارتفاع') || text.includes('المائلة') || text.includes('الضلع')) return 'نشاط علاجي: اطلب من الطالب رسم زاوية قائمة وتحديد المسافة العمودية قبل استخدام القانون.';
    if (text.includes('القسمة على 2') || text.includes('مثلث') || text.includes('شبه المنحرف')) return 'نشاط علاجي: استخدم قص ولصق أو مضاعفة الشكل لتفسير سبب القسمة على 2.';
    if (text.includes('قطر') || text.includes('نصف القطر') || text.includes('وتر') || text.includes('قوس')) return 'نشاط علاجي: ارسم دائرة بلون مختلف لكل عنصر، واطلب من الطالب وصف بداية ونهاية كل عنصر.';
    if (text.includes('المحيط') || text.includes('المساحة') || text.includes('تربيع')) return 'نشاط علاجي: قارن بين حالة تحتاج شريطاً حول دائرة وحالة تحتاج تغطية سطح دائري.';
    return 'نشاط علاجي: أعد قراءة السؤال وحدد الشكل، المعطيات، المطلوب، والقانون المناسب قبل الحساب.';
  }

  function renderTeacher() {
    state.view = 'teacher';
    const stats = overallStats();
    const misconceptions = getMisconceptionCounts();
    const questionTypes = countQuestionTypes();
    app.innerHTML = `
      <section class="panel" style="padding:22px;">
        <div class="section-title" style="margin-top:0;">
          <div>
            <span class="tag primary">لوحة المعلم</span>
            <h2>تشخيص تعليمي ومهني للتطبيق الموحد</h2>
            <p>هذه اللوحة تساعد في متابعة التقدم وتوثيق التغذية الراجعة ضمن ملف الإنجاز.</p>
          </div>
          <button class="btn ghost small" type="button" data-action="report">تقرير الطالب</button>
        </div>
        <div class="report-grid">
          <div class="report-card"><h3>الدروس</h3><div class="big-number">${DATA.lessonCount}</div><p>محطات تعليمية مرتبة منهجياً.</p></div>
          <div class="report-card"><h3>الأسئلة</h3><div class="big-number">${DATA.questionCount}</div><p>من ملف أسئلة موحد قابل للتعديل.</p></div>
          <div class="report-card"><h3>تقدم الطالب الحالي</h3><div class="big-number">${stats.percentage}%</div><p>${stats.completedLessons}/${stats.lessonCount} دروس مكتملة.</p></div>
        </div>
      </section>

      <div class="section-title"><div><h2>أنواع الأنشطة</h2><p>يدعم التطبيق أكثر من نمط سؤال داخل السكريبت الموحد.</p></div></div>
      <div class="report-grid">
        ${Object.entries(questionTypes).map(([type, count]) => `<div class="report-card"><h3>${escapeHtml(typeLabel(type))}</h3><div class="big-number">${count}</div></div>`).join('')}
      </div>

      <div class="section-title"><div><h2>المؤشرات التشخيصية</h2><p>تظهر الأخطاء المتكررة بناءً على محاولات الطالب.</p></div></div>
      ${renderMisconceptionPanel(misconceptions)}

      <div class="section-title"><div><h2>سلم تقدير مختصر</h2><p>مقترح للاستخدام في ملف الـ portfolio.</p></div></div>
      <div class="table-wrap"><table class="report-table">
        <thead><tr><th>المستوى</th><th>النسبة</th><th>الوصف</th></tr></thead>
        <tbody>${DATA.rubric.map(row => `<tr><td>${escapeHtml(row.level)}</td><td>${escapeHtml(row.range)}</td><td>${escapeHtml(row.description)}</td></tr>`).join('')}</tbody>
      </table></div>

      <div class="section-title"><div><h2>بنية الملفات المعتمدة</h2><p>تم اعتماد صيغة تشغيل مباشرة مناسبة للمتصفحات دون خادم.</p></div></div>
      <div class="term-list">
        <div class="term-card"><strong>index.html</strong><span>واجهة واحدة للتطبيق كله.</span></div>
        <div class="term-card"><strong>data/geometry-questions.js</strong><span>ملف الأسئلة والأهداف والتغذية الراجعة.</span></div>
        <div class="term-card"><strong>css/style.css</strong><span>تنسيق موحد لكل الدروس والألعاب.</span></div>
        <div class="term-card"><strong>js/script.js</strong><span>محرك الأسئلة والتصحيح والتقرير.</span></div>
      </div>
    `;
  }

  function countQuestionTypes() {
    const counts = {};
    DATA.lessons.forEach(lesson => lesson.questions.forEach(q => { counts[q.type] = (counts[q.type] || 0) + 1; }));
    return counts;
  }

  function typeLabel(type) {
    const labels = { choice: 'اختيار من متعدد', number: 'إجابة عددية', matching: 'مطابقة', slider: 'فرجار/منزلق', open: 'مهمة أدائية' };
    return labels[type] || type;
  }

  function buildReportPayload() {
    return {
      sessionId: state.sessionId || createId('session'),
      app: DATA.meta.appTitle,
      version: DATA.meta.version,
      exportedAt: new Date().toISOString(),
      student: state.student,
      overall: overallStats(),
      lessons: DATA.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        stats: lessonStats(lesson),
        exitTicket: state.exitTickets[lesson.id] || '',
        questions: lesson.questions.map(q => ({ id: q.id, prompt: q.prompt, type: q.type, progress: getProgress(q.id) }))
      })),
      misconceptions: getMisconceptionCounts().map(([text, count]) => ({ text, count }))
    };
  }

  function exportReport() {
    const payload = buildReportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (state.student.name || 'student').replace(/[\\/:*?"<>|\s]+/g, '-');
    a.href = url;
    a.download = `geometry-report-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('تم تجهيز ملف التقرير للتنزيل.');
  }

  function sendReportOnline() {
    if (!ONLINE_CONFIG.sendReports) return;
    const payload = buildReportPayload();
    sendOnline('submitReport', payload, {
      toast: true,
      successMessage: 'تم إرسال التقرير إلكترونياً. يمكن مراجعته في Google Sheets.'
    });
  }

  function resetAll() {
    const ok = confirm('هل تريد مسح كل تقدم الطالب من هذا المتصفح؟');
    if (!ok) return;
    state = createDefaultState();
    localStorage.removeItem(STORAGE_KEY);
    render();
    showToast('تم مسح التقدم.');
  }

  function renderVisual(visual, question) {
    const type = visual.type || 'default';
    if (type === 'parallel_lines') return svgParallelLines();
    if (type === 'triangle_internal') return svgTriangleInternal();
    if (type === 'triangle_external') return svgTriangleExternal();
    if (type === 'grid_parallelogram') return svgGridParallelogram();
    if (type === 'trapezoid_height') return svgTrapezoidHeight();
    if (type === 'rectangle') return svgRectangle(visual);
    if (type === 'square') return svgSquare(visual);
    if (type === 'triangle') return svgTriangle(visual);
    if (type === 'triangle_in_rect') return svgTriangleInRect(visual);
    if (type === 'parallelogram') return svgParallelogram(visual);
    if (type === 'parallelogram_compare') return svgParallelogramCompare(visual);
    if (type === 'trapezoid') return svgTrapezoid(visual);
    if (type === 'circle_element') return svgCircleElement(visual.focus || 'all');
    if (type === 'circle_measure') return svgCircleMeasure(visual, question);
    if (type === 'compass') return svgCompass(visual);
    if (type === 'project_garden') return svgProjectGarden();
    if (type === 'project_strategy') return svgProjectStrategy();
    if (type === 'project_open') return svgProjectOpen();
    return `<svg class="geo-svg" viewBox="0 0 420 260" role="img" aria-label="رسم هندسي"><rect x="40" y="40" width="340" height="180" rx="18" class="geo-shape"/><text x="210" y="135" text-anchor="middle" class="geo-label">رسم توضيحي</text></svg>`;
  }

  function svgWrap(content, label = 'رسم هندسي') {
    return `<svg class="geo-svg" viewBox="0 0 420 280" role="img" aria-label="${escapeHtml(label)}">${content}</svg>`;
  }

  function svgParallelLines() {
    return svgWrap(`
      <line x1="55" y1="78" x2="365" y2="78" class="geo-line"/>
      <line x1="55" y1="208" x2="365" y2="208" class="geo-line"/>
      <line x1="225" y1="78" x2="225" y2="208" class="geo-height"/>
      <path d="M225 193 h15 v15" fill="none" stroke="#b91c1c" stroke-width="3"/>
      <line x1="105" y1="78" x2="175" y2="208" stroke="#64748b" stroke-width="4" stroke-dasharray="7 6"/>
      <line x1="305" y1="78" x2="305" y2="208" stroke="#f59e0b" stroke-width="4"/>
      <text x="230" y="150" class="geo-label">البعد العمودي</text>
      <text x="98" y="154" class="geo-small">قطعة مائلة</text>
      <text x="310" y="150" class="geo-small">قطعة عمودية</text>
    `, 'البعد العمودي بين خطين متوازيين');
  }

  function svgTriangleInternal() {
    return svgWrap(`
      <polygon points="210,45 70,220 350,220" class="geo-shape"/>
      <line x1="210" y1="45" x2="210" y2="220" class="geo-height"/>
      <path d="M210 202 h18 v18" fill="none" stroke="#b91c1c" stroke-width="3"/>
      <text x="210" y="36" text-anchor="middle" class="geo-label">رأس</text>
      <text x="210" y="246" text-anchor="middle" class="geo-label">قاعدة</text>
      <text x="218" y="145" class="geo-label">ارتفاع</text>
    `, 'ارتفاع داخلي في مثلث');
  }

  function svgTriangleExternal() {
    return svgWrap(`
      <polygon points="88,58 170,218 360,218" class="geo-shape-soft"/>
      <line x1="45" y1="218" x2="370" y2="218" stroke="#334155" stroke-width="3"/>
      <line x1="88" y1="58" x2="88" y2="218" class="geo-height"/>
      <path d="M88 200 h18 v18" fill="none" stroke="#b91c1c" stroke-width="3"/>
      <text x="102" y="140" class="geo-label">ارتفاع خارجي</text>
      <text x="52" y="239" class="geo-small">امتداد القاعدة</text>
    `, 'ارتفاع خارجي في مثلث منفرج');
  }

  function svgGridParallelogram() {
    let grid = '';
    for (let x = 60; x <= 360; x += 40) grid += `<line x1="${x}" y1="40" x2="${x}" y2="240" class="geo-grid"/>`;
    for (let y = 40; y <= 240; y += 40) grid += `<line x1="60" y1="${y}" x2="360" y2="${y}" class="geo-grid"/>`;
    return svgWrap(`
      ${grid}
      <polygon points="120,80 320,80 280,240 80,240" fill="rgba(36,87,214,.16)" stroke="#2457d6" stroke-width="4"/>
      <line x1="300" y1="80" x2="300" y2="240" class="geo-height"/>
      <path d="M300 222 h18 v18" fill="none" stroke="#b91c1c" stroke-width="3"/>
      <text x="310" y="150" class="geo-label">4 وحدات</text>
      <text x="170" y="262" class="geo-small">عد عمودياً بين الضلعين المتوازيين</text>
    `, 'ارتفاع متوازي أضلاع على شبكة');
  }

  function svgTrapezoidHeight() {
    return svgWrap(`
      <polygon points="105,85 315,85 360,220 60,220" class="geo-shape-soft"/>
      <line x1="105" y1="85" x2="315" y2="85" stroke="#2457d6" stroke-width="5"/>
      <line x1="60" y1="220" x2="360" y2="220" stroke="#2457d6" stroke-width="5"/>
      <line x1="250" y1="85" x2="250" y2="220" class="geo-height"/>
      <path d="M250 202 h18 v18" fill="none" stroke="#b91c1c" stroke-width="3"/>
      <text x="185" y="75" text-anchor="middle" class="geo-label">قاعدة علوية</text>
      <text x="210" y="247" text-anchor="middle" class="geo-label">قاعدة سفلية</text>
      <text x="258" y="153" class="geo-label">ارتفاع</text>
    `, 'ارتفاع شبه المنحرف');
  }

  function svgRectangle(v) {
    return svgWrap(`
      <rect x="85" y="75" width="250" height="130" rx="8" class="geo-shape"/>
      <text x="210" y="225" text-anchor="middle" class="geo-label">الطول = ${escapeHtml(v.length || '')}</text>
      <text x="355" y="145" text-anchor="middle" class="geo-label" transform="rotate(90 355 145)">العرض = ${escapeHtml(v.width || '')}</text>
    `, 'مستطيل');
  }

  function svgSquare(v) {
    return svgWrap(`
      <rect x="125" y="55" width="170" height="170" rx="8" class="geo-shape"/>
      <text x="210" y="246" text-anchor="middle" class="geo-label">ضلع = ${escapeHtml(v.side || '')}</text>
      <text x="210" y="145" text-anchor="middle" class="geo-small">مساحة = الضلع × الضلع</text>
    `, 'مربع');
  }

  function svgTriangle(v) {
    return svgWrap(`
      <polygon points="210,55 85,220 335,220" class="geo-shape-soft"/>
      <line x1="210" y1="55" x2="210" y2="220" class="geo-height"/>
      <path d="M210 202 h18 v18" fill="none" stroke="#b91c1c" stroke-width="3"/>
      <text x="210" y="246" text-anchor="middle" class="geo-label">القاعدة = ${escapeHtml(v.base || '')}</text>
      <text x="220" y="140" class="geo-label">الارتفاع = ${escapeHtml(v.height || '')}</text>
    `, 'مثلث');
  }

  function svgTriangleInRect(v) {
    return svgWrap(`
      <rect x="70" y="70" width="280" height="150" rx="8" fill="#eff6ff" stroke="#2457d6" stroke-width="3"/>
      <polygon points="70,220 350,220 350,70" fill="rgba(245,158,11,.28)" stroke="#d97706" stroke-width="4"/>
      <line x1="70" y1="220" x2="350" y2="70" stroke="#d97706" stroke-width="3" stroke-dasharray="8 6"/>
      <text x="210" y="244" text-anchor="middle" class="geo-label">${escapeHtml(v.length || '')}</text>
      <text x="368" y="150" text-anchor="middle" class="geo-label" transform="rotate(90 368 150)">${escapeHtml(v.width || '')}</text>
      <text x="235" y="160" text-anchor="middle" class="geo-small">المثلث نصف المستطيل</text>
    `, 'مثلث داخل مستطيل');
  }

  function svgParallelogram(v) {
    const sideText = v.side ? `<text x="77" y="145" text-anchor="middle" class="geo-small" transform="rotate(-65 77 145)">ضلع مائل = ${escapeHtml(v.side)}</text>` : '';
    const heightText = v.unknownHeight ? 'الارتفاع = ؟' : `الارتفاع = ${escapeHtml(v.height || '')}`;
    const areaText = v.area ? `<text x="210" y="145" text-anchor="middle" class="geo-label">المساحة = ${escapeHtml(v.area)}</text>` : '';
    return svgWrap(`
      <polygon points="120,70 350,70 295,220 65,220" class="geo-shape"/>
      <line x1="315" y1="70" x2="315" y2="220" class="geo-height"/>
      <path d="M315 202 h18 v18" fill="none" stroke="#b91c1c" stroke-width="3"/>
      <text x="180" y="246" text-anchor="middle" class="geo-label">القاعدة = ${escapeHtml(v.base || '')}</text>
      <text x="322" y="145" class="geo-label">${heightText}</text>
      ${sideText}
      ${areaText}
      ${v.context ? `<text x="210" y="42" text-anchor="middle" class="geo-small">${escapeHtml(v.context)}</text>` : ''}
    `, 'متوازي أضلاع');
  }

  function svgParallelogramCompare(v) {
    return svgWrap(`
      <rect x="55" y="65" width="145" height="90" rx="8" fill="#ecfdf5" stroke="#16803c" stroke-width="3"/>
      <text x="127" y="113" text-anchor="middle" class="geo-label">مستطيل ${escapeHtml(v.rect || '')}</text>
      <path d="M210 110 h55" stroke="#64748b" stroke-width="3" marker-end="url(#arrow)"/>
      <polygon points="285,65 385,65 360,155 260,155" class="geo-shape"/>
      <text x="310" y="184" text-anchor="middle" class="geo-label">قاعدة = ${escapeHtml(v.base || '')}</text>
      <text x="300" y="116" class="geo-small">المساحة نفسها</text>
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/></marker></defs>
    `, 'مقارنة مساحة المستطيل ومتوازي الأضلاع');
  }

  function svgTrapezoid(v) {
    return svgWrap(`
      <polygon points="110,75 310,75 365,220 55,220" class="geo-shape-soft"/>
      <line x1="265" y1="75" x2="265" y2="220" class="geo-height"/>
      <path d="M265 202 h18 v18" fill="none" stroke="#b91c1c" stroke-width="3"/>
      <text x="210" y="62" text-anchor="middle" class="geo-label">${escapeHtml(v.b2 || '')}</text>
      <text x="210" y="246" text-anchor="middle" class="geo-label">${escapeHtml(v.b1 || '')}</text>
      <text x="275" y="146" class="geo-label">${escapeHtml(v.unknownHeight ? 'الارتفاع = ؟' : (v.height || ''))}</text>
      ${v.area ? `<text x="210" y="150" text-anchor="middle" class="geo-label">المساحة = ${escapeHtml(v.area)}</text>` : ''}
      ${v.context ? `<text x="210" y="32" text-anchor="middle" class="geo-small">${escapeHtml(v.context)}</text>` : ''}
    `, 'شبه منحرف');
  }

  function svgCircleElement(focus) {
    const showAll = focus === 'all';
    const radius = (showAll || focus === 'radius') ? 'stroke="#16803c" stroke-width="5"' : 'stroke="#94a3b8" stroke-width="2"';
    const diameter = (showAll || focus === 'diameter' || focus === 'diameter_chord') ? 'stroke="#2457d6" stroke-width="5"' : 'stroke="#94a3b8" stroke-width="2"';
    const chord = (showAll || focus === 'chord' || focus === 'diameter_chord') ? 'stroke="#f59e0b" stroke-width="5"' : 'stroke="#94a3b8" stroke-width="2"';
    const arc = (showAll || focus === 'arc') ? 'stroke="#7c3aed" stroke-width="8"' : 'stroke="#94a3b8" stroke-width="3"';
    const center = (showAll || focus === 'center') ? '#b91c1c' : '#334155';
    return svgWrap(`
      <circle cx="210" cy="140" r="95" fill="#f8fbff" stroke="#334155" stroke-width="4"/>
      <line x1="210" y1="140" x2="300" y2="110" ${radius}/>
      <line x1="115" y1="140" x2="305" y2="140" ${diameter}/>
      <line x1="140" y1="205" x2="300" y2="205" ${chord}/>
      <path d="M 275 70 A 95 95 0 0 1 305 150" fill="none" ${arc}/>
      <circle cx="210" cy="140" r="8" fill="${center}"/>
      <text x="210" y="128" text-anchor="middle" class="geo-small">م</text>
      <text x="305" y="105" class="geo-small">نصف قطر</text>
      <text x="198" y="132" class="geo-small">قطر</text>
      <text x="192" y="226" class="geo-small">وتر</text>
      <text x="315" y="105" class="geo-small">قوس</text>
      ${focus === 'diameter_chord' ? `<text x="210" y="260" text-anchor="middle" class="geo-label">القطر وتر خاص يمر بالمركز</text>` : ''}
    `, 'عناصر الدائرة');
  }

  function svgCircleMeasure(v, q) {
    const mode = v.mode || '';
    const fill = mode.includes('area') ? 'rgba(245,158,11,.23)' : '#f8fbff';
    const boundary = mode.includes('circumference') ? '#b91c1c' : '#334155';
    const label = v.radius ? `نق = ${escapeHtml(v.radius)}` : v.diameter ? `ق = ${escapeHtml(v.diameter)}` : v.circumference ? `محيط = ${escapeHtml(v.circumference)}` : '';
    const line = v.diameter ? `<line x1="115" y1="140" x2="305" y2="140" stroke="#2457d6" stroke-width="5"/><text x="210" y="128" text-anchor="middle" class="geo-label">${escapeHtml(v.diameter)}</text>` : `<line x1="210" y1="140" x2="305" y2="140" stroke="#16803c" stroke-width="5"/><text x="255" y="128" class="geo-label">${escapeHtml(v.radius || '')}</text>`;
    return svgWrap(`
      <circle cx="210" cy="140" r="95" fill="${fill}" stroke="${boundary}" stroke-width="5"/>
      ${line}
      <circle cx="210" cy="140" r="7" fill="#b91c1c"/>
      <text x="210" y="248" text-anchor="middle" class="geo-label">${label}</text>
      <text x="210" y="42" text-anchor="middle" class="geo-small">${mode.includes('area') ? 'المساحة = المنطقة الداخلية' : mode.includes('circumference') ? 'المحيط = الحد الخارجي' : 'علاقة القطر ونصف القطر'}</text>
    `, 'قياس دائرة');
  }

  function svgCompass(v) {
    return svgWrap(`
      <circle cx="210" cy="150" r="90" fill="#f8fbff" stroke="#94a3b8" stroke-width="3" stroke-dasharray="8 6"/>
      <circle cx="210" cy="150" r="7" fill="#b91c1c"/>
      <line x1="210" y1="150" x2="300" y2="150" stroke="#16803c" stroke-width="5"/>
      <path d="M210 150 L162 55 L300 150" fill="none" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
      <circle cx="162" cy="55" r="6" fill="#334155"/>
      <circle cx="300" cy="150" r="6" fill="#334155"/>
      <text x="255" y="138" class="geo-label">فتحة الفرجار = ${escapeHtml(v.target || '')}</text>
      <text x="210" y="258" text-anchor="middle" class="geo-small">الفتحة تمثل نصف القطر</text>
    `, 'فرجار رقمي');
  }

  function svgProjectGarden() {
    return svgWrap(`
      <rect x="45" y="55" width="250" height="150" rx="10" fill="#dcfce7" stroke="#16803c" stroke-width="4"/>
      <polygon points="45,205 145,205 95,120" fill="#fde68a" stroke="#d97706" stroke-width="4"/>
      <circle cx="250" cy="130" r="42" fill="#dbeafe" stroke="#2457d6" stroke-width="4"/>
      <text x="170" y="48" text-anchor="middle" class="geo-label">مستطيل 20×12</text>
      <text x="92" y="228" text-anchor="middle" class="geo-small">مثلث 10×6</text>
      <text x="250" y="135" text-anchor="middle" class="geo-small">نافورة نق=3</text>
    `, 'تصميم حديقة');
  }

  function svgProjectStrategy() {
    return svgWrap(`
      <rect x="55" y="55" width="310" height="170" rx="18" fill="#fff" stroke="#d9e2ef" stroke-width="3"/>
      <text x="210" y="92" text-anchor="middle" class="geo-label">خطة الحل</text>
      <text x="210" y="128" text-anchor="middle" class="geo-small">1. أحدد الشكل</text>
      <text x="210" y="158" text-anchor="middle" class="geo-small">2. أكتب المعطيات</text>
      <text x="210" y="188" text-anchor="middle" class="geo-small">3. أختار القانون</text>
      <text x="210" y="218" text-anchor="middle" class="geo-small">4. أحسب وأفسر الوحدة</text>
    `, 'استراتيجية حل');
  }

  function svgProjectOpen() {
    return svgWrap(`
      <circle cx="128" cy="140" r="58" fill="#dbeafe" stroke="#2457d6" stroke-width="4"/>
      <rect x="215" y="88" width="130" height="105" rx="10" fill="#dcfce7" stroke="#16803c" stroke-width="4"/>
      <line x1="185" y1="140" x2="215" y2="140" stroke="#64748b" stroke-width="3" stroke-dasharray="6 5"/>
      <text x="210" y="242" text-anchor="middle" class="geo-label">استخدم شكلين أو أكثر في موقف حياتي</text>
    `, 'مهمة أدائية مفتوحة');
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'home') { state.view = 'home'; state.lastFeedback = null; saveState(); render(); return; }
    if (action === 'map') { state.view = 'map'; state.lastFeedback = null; saveState(); render(); return; }
    if (action === 'report') { state.view = 'report'; state.lastFeedback = null; saveState(); render(); return; }
    if (action === 'teacher') { state.view = 'teacher'; state.lastFeedback = null; saveState(); render(); return; }
    if (action === 'save-student') { parseStudentFields(); showToast('تم حفظ بيانات الطالب.'); return; }
    if (action === 'start-map') { parseStudentFields(); state.view = 'map'; saveState(); render(); return; }
    if (action === 'open-lesson') { state.currentLessonId = target.dataset.lessonId; state.view = 'lesson'; state.lastFeedback = null; saveState(); render(); return; }
    if (action === 'go-question') { goQuestion(Number(target.dataset.index), true); return; }
    if (action === 'prev-question') { goQuestion(-1); return; }
    if (action === 'next-question') { goQuestion(1); return; }
    if (action === 'answer-choice') { evaluateChoice(target.dataset.qid, target.dataset.index); return; }
    if (action === 'answer-number') { evaluateNumber(target.dataset.qid); return; }
    if (action === 'answer-slider') { evaluateSlider(target.dataset.qid); return; }
    if (action === 'answer-matching') { evaluateMatching(target.dataset.qid); return; }
    if (action === 'answer-open') { evaluateOpen(target.dataset.qid); return; }
    if (action === 'save-exit-ticket') { saveExitTicket(target.dataset.lessonId); return; }
    if (action === 'reset-question') { resetQuestion(target.dataset.qid); return; }
    if (action === 'next-lesson') { nextLesson(); return; }
    if (action === 'export-report') { exportReport(); return; }
    if (action === 'send-report-online') { sendReportOnline(); return; }
    if (action === 'print-report') { window.print(); return; }
    if (action === 'reset-all') { resetAll(); return; }
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const card = event.target.closest('.lesson-card');
    if (card && card.dataset.lessonId) {
      event.preventDefault();
      state.currentLessonId = card.dataset.lessonId;
      state.view = 'lesson';
      state.lastFeedback = null;
      saveState();
      render();
      return;
    }
    if (event.target && event.target.id === 'numericAnswer') {
      event.preventDefault();
      evaluateNumber(event.target.dataset.qid);
    }
  });

  document.addEventListener('input', event => {
    if (event.target && event.target.id === 'sliderAnswer') {
      const out = document.getElementById('sliderValue');
      if (out) out.textContent = event.target.value;
    }
    if (event.target && event.target.id === 'openAnswer') {
      state.openAnswers[event.target.dataset.qid] = event.target.value;
      saveState();
    }
  });

  window.addEventListener('online', () => syncOnlineQueue({ toast: true }));
  syncOnlineQueue();
  render();
})();
