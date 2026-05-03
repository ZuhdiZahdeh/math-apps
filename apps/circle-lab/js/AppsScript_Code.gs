/****************************************************
 * Circle Geometry Lab Collector
 * Apps Script Web App → Google Sheets
 *
 * الاستخدام:
 * 1) افتح Google Sheets.
 * 2) Extensions → Apps Script.
 * 3) الصق هذا الملف باسم Code.gs.
 * 4) شغّل setupWorkbook مرة واحدة.
 * 5) أضف Script Property باسم LAB_SECRET وقيمته circle-lab-2026.
 * 6) Deploy → New deployment → Web app.
 ****************************************************/

const CONFIG = {
  // إذا كان السكربت مربوطاً بملف Google Sheets نفسه، يمكنك ترك هذه القيمة فارغة.
  // إذا كان السكربت مستقلاً، ضع معرف الجدول هنا.
  SPREADSHEET_ID: '',

  LAB_ID: 'circle-geometry-grade6',
  SECRET_PROPERTY: 'LAB_SECRET',

  SHEETS: {
    attempts: 'Attempts',
    questions: 'QuestionResponses',
    compass: 'CompassPerformance',
    events: 'Events',
    summary: 'Summary'
  }
};

const HEADERS = {
  Attempts: [
    'serverTimestamp',
    'submittedAt',
    'labId',
    'labVersion',
    'sessionId',
    'studentCode',
    'className',
    'score',
    'totalQuestions',
    'percentage',
    'masteryLevel',
    'wrongQuestions',
    'misconceptionSummary',
    'compassCompleted',
    'compassAttempts',
    'compassTargetRadius',
    'compassProgressPercent',
    'compassCenterMisses',
    'compassOpeningErrors',
    'compassPathWarnings',
    'timeSpentSeconds',
    'userAgent'
  ],

  QuestionResponses: [
    'serverTimestamp',
    'sessionId',
    'studentCode',
    'className',
    'questionIndex',
    'questionText',
    'selectedAnswer',
    'correctAnswer',
    'isCorrect',
    'misconception',
    'explanation',
    'elapsedAtSecond'
  ],

  CompassPerformance: [
    'serverTimestamp',
    'sessionId',
    'studentCode',
    'className',
    'targetRadiusCm',
    'completed',
    'completionPercent',
    'attempts',
    'centerMisses',
    'openingErrors',
    'pathWarnings',
    'autoDemoUsed',
    'timeSpentSeconds'
  ],

  Events: [
    'serverTimestamp',
    'sessionId',
    'studentCode',
    'className',
    'eventType',
    'levelId',
    'value',
    'elapsedAtSecond',
    'extraJson'
  ]
};

function setupWorkbook() {
  const ss = getWorkbook_();

  ensureSheet_(ss, CONFIG.SHEETS.attempts, HEADERS.Attempts);
  ensureSheet_(ss, CONFIG.SHEETS.questions, HEADERS.QuestionResponses);
  ensureSheet_(ss, CONFIG.SHEETS.compass, HEADERS.CompassPerformance);
  ensureSheet_(ss, CONFIG.SHEETS.events, HEADERS.Events);
  setupSummarySheet_(ss);

  return 'تم تجهيز ملف Google Sheets بنجاح.';
}

function doGet(e) {
  return jsonResponse_({
    ok: true,
    service: 'Circle Geometry Lab Collector',
    labId: CONFIG.LAB_ID,
    serverTime: new Date().toISOString()
  });
}

function doPost(e) {
  const started = Date.now();
  let lock;

  try {
    const payload = parsePayload_(e);
    validatePayload_(payload);

    lock = LockService.getScriptLock();
    lock.waitLock(15000);

    const ss = getWorkbook_();
    ensureSheet_(ss, CONFIG.SHEETS.attempts, HEADERS.Attempts);
    ensureSheet_(ss, CONFIG.SHEETS.questions, HEADERS.QuestionResponses);
    ensureSheet_(ss, CONFIG.SHEETS.compass, HEADERS.CompassPerformance);
    ensureSheet_(ss, CONFIG.SHEETS.events, HEADERS.Events);

    const result = writePayload_(ss, payload);

    return jsonResponse_({
      ok: true,
      duplicate: result.duplicate || false,
      sessionId: payload.sessionId,
      rows: result,
      elapsedMs: Date.now() - started,
      serverTime: new Date().toISOString()
    });

  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err),
      serverTime: new Date().toISOString()
    });

  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (err) {}
    }
  }
}

function parsePayload_(e) {
  if (!e) throw new Error('لم يصل كائن الطلب e.');

  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }

  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }

  throw new Error('لم تصل بيانات POST.');
}

function validatePayload_(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('صيغة البيانات غير صحيحة.');
  }

  const expectedSecret = PropertiesService
    .getScriptProperties()
    .getProperty(CONFIG.SECRET_PROPERTY);

  if (expectedSecret && payload.token !== expectedSecret) {
    throw new Error('رمز الإرسال غير صحيح.');
  }

  if (payload.labId !== CONFIG.LAB_ID) throw new Error('معرف المختبر غير مطابق.');
  if (!payload.sessionId) throw new Error('sessionId مفقود.');
  if (!payload.studentCode) throw new Error('studentCode مفقود.');
  if (!payload.className) throw new Error('className مفقود.');
}

function writePayload_(ss, payload) {
  const attemptsSheet = ss.getSheetByName(CONFIG.SHEETS.attempts);
  const questionsSheet = ss.getSheetByName(CONFIG.SHEETS.questions);
  const compassSheet = ss.getSheetByName(CONFIG.SHEETS.compass);
  const eventsSheet = ss.getSheetByName(CONFIG.SHEETS.events);

  const now = new Date();

  if (isDuplicateSession_(attemptsSheet, payload.sessionId)) {
    return {
      duplicate: true,
      attempts: 0,
      questions: 0,
      compass: 0,
      events: 0
    };
  }

  const quiz = payload.quiz || {};
  const compass = payload.compass || {};
  const answers = Array.isArray(quiz.answers) ? quiz.answers : [];
  const events = Array.isArray(payload.events) ? payload.events : [];

  const score = Number(quiz.score || 0);
  const totalQuestions = Number(quiz.totalQuestions || answers.length || 0);
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : '';

  const wrongQuestions = answers
    .filter(a => a && a.isCorrect === false)
    .map(a => a.questionIndex)
    .join(', ');

  const misconceptionSummary = unique_(
    answers
      .filter(a => a && a.isCorrect === false && a.misconception)
      .map(a => safeText_(a.misconception, 120))
  ).join(' | ');

  attemptsSheet.appendRow([
    now,
    safeText_(payload.submittedAt, 40),
    safeText_(payload.labId, 80),
    safeText_(payload.labVersion, 40),
    safeText_(payload.sessionId, 120),
    safeText_(payload.studentCode, 80),
    safeText_(payload.className, 40),
    score,
    totalQuestions,
    percentage,
    masteryLevel_(percentage),
    wrongQuestions,
    misconceptionSummary,
    Boolean(compass.completed),
    Number(compass.attempts || 0),
    Number(compass.targetRadiusCm || 0),
    Number(compass.completionPercent || 0),
    Number(compass.centerMisses || 0),
    Number(compass.openingErrors || 0),
    Number(compass.pathWarnings || 0),
    Number(payload.timeSpentSeconds || 0),
    safeText_(payload.userAgent, 250)
  ]);

  const questionRows = answers.map(a => [
    now,
    safeText_(payload.sessionId, 120),
    safeText_(payload.studentCode, 80),
    safeText_(payload.className, 40),
    Number(a.questionIndex || 0),
    safeText_(a.questionText, 300),
    safeText_(a.selectedAnswer, 120),
    safeText_(a.correctAnswer, 120),
    Boolean(a.isCorrect),
    safeText_(a.misconception, 180),
    safeText_(a.explanation, 500),
    Number(a.elapsedAtSecond || 0)
  ]);

  appendRows_(questionsSheet, questionRows);

  appendRows_(compassSheet, [[
    now,
    safeText_(payload.sessionId, 120),
    safeText_(payload.studentCode, 80),
    safeText_(payload.className, 40),
    Number(compass.targetRadiusCm || 0),
    Boolean(compass.completed),
    Number(compass.completionPercent || 0),
    Number(compass.attempts || 0),
    Number(compass.centerMisses || 0),
    Number(compass.openingErrors || 0),
    Number(compass.pathWarnings || 0),
    Boolean(compass.autoDemoUsed),
    Number(payload.timeSpentSeconds || 0)
  ]]);

  const eventRows = events.map(ev => [
    now,
    safeText_(payload.sessionId, 120),
    safeText_(payload.studentCode, 80),
    safeText_(payload.className, 40),
    safeText_(ev.eventType, 80),
    safeText_(ev.levelId, 40),
    safeText_(ev.value, 180),
    Number(ev.elapsedAtSecond || 0),
    safeText_(JSON.stringify(ev.extra || {}), 700)
  ]);

  appendRows_(eventsSheet, eventRows);

  return {
    duplicate: false,
    attempts: 1,
    questions: questionRows.length,
    compass: 1,
    events: eventRows.length
  };
}

function testDoPost() {
  const samplePayload = {
    token: PropertiesService.getScriptProperties().getProperty(CONFIG.SECRET_PROPERTY) || '',
    labId: CONFIG.LAB_ID,
    labVersion: '1.1.0-google-sheets',
    sessionId: 'TEST-' + Date.now(),
    studentCode: '6A-TEST',
    className: '6A',
    startedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    timeSpentSeconds: 420,
    userAgent: 'Apps Script Test',
    quiz: {
      score: 8,
      totalQuestions: 10,
      answers: [
        {
          questionIndex: 1,
          questionText: 'مثال سؤال',
          selectedAnswer: 'نصف قطر',
          correctAnswer: 'نصف قطر',
          isCorrect: true,
          misconception: '',
          explanation: 'إجابة صحيحة.',
          elapsedAtSecond: 60
        },
        {
          questionIndex: 2,
          questionText: 'مثال سؤال خاطئ',
          selectedAnswer: 'قطر',
          correctAnswer: 'وتر',
          isCorrect: false,
          misconception: 'خلط بين الوتر والقطر',
          explanation: 'الوتر لا يشترط أن يمر بالمركز.',
          elapsedAtSecond: 95
        }
      ]
    },
    compass: {
      targetRadiusCm: 4,
      completed: true,
      completionPercent: 100,
      attempts: 2,
      centerMisses: 1,
      openingErrors: 1,
      pathWarnings: 3,
      autoDemoUsed: false
    },
    events: [
      {
        eventType: 'level_open',
        levelId: 'quiz',
        value: 'بدأ الاختبار',
        elapsedAtSecond: 10,
        extra: {}
      }
    ]
  };

  const fakeEvent = {
    postData: {
      contents: JSON.stringify(samplePayload)
    }
  };

  const result = doPost(fakeEvent);
  Logger.log(result.getContent());
}

function getWorkbook_() {
  const id = String(CONFIG.SPREADSHEET_ID || '').trim();
  if (id && id !== 'ضع_معرف_Google_Sheet_هنا') {
    return SpreadsheetApp.openById(id);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('لم يتم العثور على ملف Google Sheets. ضع SPREADSHEET_ID أو اربط السكربت بالجدول.');
  }
  return active;
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  const firstCell = sheet.getRange(1, 1).getValue();
  if (!firstCell) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#e8f4fd');
    sheet.autoResizeColumns(1, headers.length);
  }

  return sheet;
}

function setupSummarySheet_(ss) {
  let sheet = ss.getSheetByName(CONFIG.SHEETS.summary);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEETS.summary);

  sheet.clear();
  sheet.getRange(1, 1, 1, 2).setValues([['المؤشر', 'القيمة']]);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#e8f4fd');

  sheet.getRange(2, 1, 8, 2).setValues([
    ['عدد المحاولات', '=COUNTA(Attempts!E2:E)'],
    ['متوسط الدرجة', '=IFERROR(AVERAGE(Attempts!H2:H),0)'],
    ['متوسط النسبة', '=IFERROR(AVERAGE(Attempts!J2:J),0)'],
    ['عدد الطلاب أقل من 70%', '=COUNTIF(Attempts!J2:J,"<70")'],
    ['نسبة إكمال الفرجار', '=IFERROR(COUNTIF(Attempts!N2:N,TRUE)/COUNTA(Attempts!N2:N),0)'],
    ['متوسط أخطاء المركز', '=IFERROR(AVERAGE(Attempts!R2:R),0)'],
    ['متوسط أخطاء فتحة الفرجار', '=IFERROR(AVERAGE(Attempts!S2:S),0)'],
    ['متوسط تحذيرات المسار', '=IFERROR(AVERAGE(Attempts!T2:T),0)']
  ]);

  sheet.getRange(11, 1).setValue('أكثر الأسئلة خطأ');
  sheet.getRange(12, 1).setFormula(
    '=QUERY(QuestionResponses!E:I,"select E, count(E) where I = false group by E order by count(E) desc label E \'السؤال\', count(E) \'عدد الأخطاء\'",1)'
  );

  sheet.getRange(18, 1).setValue('أكثر التصورات الخاطئة');
  sheet.getRange(19, 1).setFormula(
    '=QUERY(QuestionResponses!J:J,"select J, count(J) where J is not null group by J order by count(J) desc label J \'التصور الخاطئ\', count(J) \'عدد مرات التكرار\'",1)'
  );

  sheet.autoResizeColumns(1, 6);
}

function appendRows_(sheet, rows) {
  if (!rows || rows.length === 0) return;
  const startRow = sheet.getLastRow() + 1;
  const cols = rows[0].length;
  sheet.getRange(startRow, 1, rows.length, cols).setValues(rows);
}

function isDuplicateSession_(sheet, sessionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const sessionIdColumn = 5;
  const values = sheet
    .getRange(2, sessionIdColumn, lastRow - 1, 1)
    .getValues()
    .flat();

  return values.indexOf(sessionId) !== -1;
}

function masteryLevel_(percentage) {
  if (percentage === '' || isNaN(Number(percentage))) return '';
  const p = Number(percentage);
  if (p >= 90) return 'إتقان عال';
  if (p >= 70) return 'إتقان جيد';
  if (p >= 50) return 'يحتاج دعم';
  return 'دعم عاجل';
}

function safeText_(value, maxLength) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength || 200);
}

function unique_(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
