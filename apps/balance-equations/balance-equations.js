/* balance-equations.js
   تطبيق "ميزان المعادلة – BalanceX"
   يعتمد على ملف balance-questions.json الموجود في نفس المجلد.
*/

'use strict';

(function () {
  // عناصر عامة
  const tabButtons = document.querySelectorAll('.balance-tab-button');
  const tabPanels = document.querySelectorAll('.balance-tab-panel');
  const appRoot = document.getElementById('balance-app');

  // بيانات من JSON
  let questionsData = {
    explore: [],
    train: [],
    word: []
  };

  // حالة "استكشاف"
  let exploreOriginalEquation = null;
  let exploreCurrentEquation = null;

  // حالة "تدريب"
  let trainCurrentExercise = null;
  let trainCurrentEquation = null;

  // عناصر استكشاف
  const exploreSelect = document.getElementById('balance-explore-equation-select');
  const exploreRandomBtn = document.getElementById('balance-explore-random-btn');
  const exploreResetBtn = document.getElementById('balance-explore-reset-btn');
  const exploreEqDisplay = document.getElementById('balance-explore-equation-display');
  const exploreBalanceContainer = document.getElementById('balance-explore-balance');
  const exploreLog = document.getElementById('balance-explore-log');
  const exploreKInput = document.getElementById('balance-explore-k-input');
  const exploreAddKBtn = document.getElementById('balance-explore-addk-btn');
  const exploreOpButtons = document.querySelectorAll('#balance-tab-explore .balance-op-button');

  // عناصر تدريب
  const trainNextBtn = document.getElementById('balance-train-next-btn');
  const trainEqLabel = document.getElementById('balance-train-equation-label');
  const trainEqCurrent = document.getElementById('balance-train-equation-current');
  const trainBalanceContainer = document.getElementById('balance-train-balance');
  const trainLog = document.getElementById('balance-train-log');
  const trainAdd1Btn = document.getElementById('balance-train-add1-btn');
  const trainSub1Btn = document.getElementById('balance-train-sub1-btn');
  const trainKInput = document.getElementById('balance-train-k-input');
  const trainAddKBtn = document.getElementById('balance-train-addk-btn');
  const trainSubKBtn = document.getElementById('balance-train-subk-btn');
  const trainCheckBtn = document.getElementById('balance-train-check-btn');

  // عناصر مسائل حياتية
  const wordSelect = document.getElementById('balance-word-select');
  const wordContext = document.getElementById('balance-word-context');
  const wordText = document.getElementById('balance-word-text');
  const wordEquationToggleBtn = document.getElementById('balance-word-equation-toggle-btn');
  const wordSolveBtn = document.getElementById('balance-word-solve-btn');
  const wordEquationDisplay = document.getElementById('balance-word-equation-display');
  const wordImage = document.getElementById('balance-word-image');

  /* ===================== أداة مساعدة عامة ===================== */

  function showErrorMessage(message) {
    const p = document.createElement('p');
    p.textContent = message;
    p.style.color = '#b91c1c';
    p.style.fontSize = '0.9rem';
    p.style.marginTop = '0.5rem';
    appRoot.appendChild(p);
  }

  function appendLog(logElement, text) {
    if (!logElement) return;
    const entry = document.createElement('div');
    entry.className = 'balance-log-entry';
    entry.innerHTML = `<strong>•</strong> ${text}`;
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;
  }

  /* ===================== نموذج المعادلة ===================== */

  // المعادلة: { left: { x: رقم, c: رقم }, right: { x: رقم, c: رقم } }

  function createEquationFromData(data) {
    return {
      left: {
        x: Number(data.left && data.left.x) || 0,
        c: Number(data.left && data.left.constant) || 0
      },
      right: {
        x: Number(data.right && data.right.x) || 0,
        c: Number(data.right && data.right.constant) || 0
      }
    };
  }

  function cloneEquation(eq) {
    return {
      left: { x: eq.left.x, c: eq.left.c },
      right: { x: eq.right.x, c: eq.right.c }
    };
  }

  function addConstToBoth(eq, k) {
    eq.left.c += k;
    eq.right.c += k;
  }

  function addXToBoth(eq, k) {
    eq.left.x += k;
    eq.right.x += k;
  }

  function equationToString(eq) {
    function sideToString(side) {
      const parts = [];
      const x = side.x;
      const c = side.c;

      if (x !== 0) {
        if (Math.abs(x) === 1) {
          parts.push(x === 1 ? 'x' : '-x');
        } else {
          parts.push((x > 0 ? '' : '-') + Math.abs(x) + 'x');
        }
      }

      if (c !== 0) {
        const sign = c > 0 ? (parts.length ? ' + ' : '') : (parts.length ? ' - ' : '-');
        parts.push(sign + Math.abs(c));
      }

      if (parts.length === 0) {
        return '0';
      }

      return parts.join('');
    }

    return `${sideToString(eq.left)} = ${sideToString(eq.right)}`;
  }

  function isSimpleSolved(eq) {
    // الشكل x = a
    return eq.left.x === 1 && eq.left.c === 0 && eq.right.x === 0;
  }

  /* ===================== رسم الميزان ===================== */

  function renderBalance(container, eq) {
    if (!container || !eq) return;

    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'balance-scale-inner';

    const beam = document.createElement('div');
    beam.className = 'balance-beam';

    const pivot = document.createElement('div');
    pivot.className = 'balance-pivot';
    beam.appendChild(pivot);

    const pansWrapper = document.createElement('div');
    pansWrapper.className = 'balance-pans';

    const leftPan = document.createElement('div');
    leftPan.className = 'balance-pan';

    const rightPan = document.createElement('div');
    rightPan.className = 'balance-pan';

    // عناوين الكفتين
    const leftLabel = document.createElement('div');
    leftLabel.className = 'balance-pan-label';
    leftLabel.textContent = 'الطرف الأيسر';

    const rightLabel = document.createElement('div');
    rightLabel.className = 'balance-pan-label';
    rightLabel.textContent = 'الطرف الأيمن';

    leftPan.appendChild(leftLabel);
    rightPan.appendChild(rightLabel);

    // تعبئة العناصر
    fillPanTokens(leftPan, eq.left);
    fillPanTokens(rightPan, eq.right);

    pansWrapper.appendChild(leftPan);
    pansWrapper.appendChild(rightPan);

    wrapper.appendChild(beam);
    wrapper.appendChild(pansWrapper);

    container.appendChild(wrapper);
  }

  // ✅ النسخة المعدلة: إضافة حرف "و" بين x والعدد
  function fillPanTokens(panElement, side) {
    const xCoeff = side.x;
    const c = side.c;

    const hasX = xCoeff !== 0;
    const hasC = c !== 0;

    // 1) بطاقات x
    if (hasX) {
      const count = Math.min(Math.abs(xCoeff), 5); // لا نُكثر من التكرار بصريًا
      for (let i = 0; i < count; i++) {
        const token = document.createElement('div');
        token.className =
          'balance-token balance-token-x' + (xCoeff < 0 ? ' negative' : '');
        token.textContent = 'x';
        panElement.appendChild(token);
      }
      if (Math.abs(xCoeff) > 5) {
        const extra = document.createElement('div');
        extra.className = 'balance-token balance-token-x';
        extra.textContent = `×${Math.abs(xCoeff)}`;
        panElement.appendChild(extra);
      }
    }

    // 2) حرف "و" بين x والعدد (إذا وُجِد الاثنان)
    if (hasX && hasC) {
      const opChip = document.createElement('span');
      opChip.className = 'balance-op-chip';
      opChip.textContent = 'و';
      panElement.appendChild(opChip);
    }

    // 3) بطاقة العدد
    if (hasC) {
      const numToken = document.createElement('div');
      numToken.className =
        'balance-token balance-token-num' + (c < 0 ? ' negative' : '');
      numToken.textContent = c.toString();
      panElement.appendChild(numToken);
    }
  }

  /* ===================== التبويبات ===================== */

  function initTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));

        btn.classList.add('active');
        const activePanel = document.getElementById(`balance-tab-${target}`);
        if (activePanel) {
          activePanel.classList.add('active');
        }
      });
    });
  }

  /* ===================== استكشاف الميزان ===================== */

  function initExploreTab() {
    if (!exploreSelect) return;

    // تعبئة قائمة المعادلات
    exploreSelect.innerHTML = '';
    questionsData.explore.forEach(eq => {
      const option = document.createElement('option');
      option.value = eq.id;
      option.textContent = eq.label;
      exploreSelect.appendChild(option);
    });

    if (questionsData.explore.length > 0) {
      loadExploreEquation(questionsData.explore[0].id);
    }

    exploreSelect.addEventListener('change', () => {
      loadExploreEquation(exploreSelect.value);
    });

    exploreRandomBtn.addEventListener('click', () => {
      const list = questionsData.explore;
      if (!list || !list.length) return;
      const random = list[Math.floor(Math.random() * list.length)];
      exploreSelect.value = random.id;
      loadExploreEquation(random.id);
    });

    exploreResetBtn.addEventListener('click', () => {
      if (!exploreOriginalEquation) return;
      exploreCurrentEquation = cloneEquation(exploreOriginalEquation);
      exploreLog.innerHTML = '';
      updateExploreView('تمّت إعادة المعادلة إلى حالتها الأصلية.');
    });

    exploreOpButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!exploreCurrentEquation) return;
        const op = btn.getAttribute('data-op');
        handleExploreQuickOperation(op);
      });
    });

    exploreAddKBtn.addEventListener('click', () => {
      if (!exploreCurrentEquation) return;
      const k = Number(exploreKInput.value);
      if (!Number.isFinite(k) || !exploreKInput.value) {
        appendLog(exploreLog, '❗ أدخل قيمة عددية في خانة k أولًا.');
        return;
      }
      addConstToBoth(exploreCurrentEquation, k);
      updateExploreView(`أضفنا ${formatNumber(k)} للطرفين → معادلة مكافئة.`);
    });
  }

  function loadExploreEquation(id) {
    const eqData = questionsData.explore.find(e => e.id === id);
    if (!eqData) return;
    exploreOriginalEquation = createEquationFromData(eqData);
    exploreCurrentEquation = cloneEquation(exploreOriginalEquation);
    exploreLog.innerHTML = '';
    updateExploreView('تم تحميل المعادلة.');
  }

  function handleExploreQuickOperation(op) {
    switch (op) {
      case 'add1':
        addConstToBoth(exploreCurrentEquation, 1);
        updateExploreView('أضفنا 1 للطرفين.');
        break;
      case 'sub1':
        addConstToBoth(exploreCurrentEquation, -1);
        updateExploreView('طرحنا 1 من الطرفين.');
        break;
      case 'addx':
        addXToBoth(exploreCurrentEquation, 1);
        updateExploreView('أضفنا x للطرفين.');
        break;
      case 'subx':
        addXToBoth(exploreCurrentEquation, -1);
        updateExploreView('طرحنا x من الطرفين.');
        break;
      default:
        break;
    }
  }

  function updateExploreView(message) {
    const eqString = equationToString(exploreCurrentEquation);
    if (exploreEqDisplay) {
      exploreEqDisplay.textContent = eqString;
    }
    renderBalance(exploreBalanceContainer, exploreCurrentEquation);
    if (message) {
      appendLog(
        exploreLog,
        `${message} (المعادلة الآن: <span dir="ltr">${eqString}</span>)`
      );
    }
  }

  /* ===================== تدريب على الحل ===================== */

  function initTrainTab() {
    if (!trainNextBtn) return;

    trainNextBtn.addEventListener('click', () => {
      startNewTrainExercise();
    });

    trainAdd1Btn.addEventListener('click', () => {
      if (!trainCurrentEquation) return;
      addConstToBoth(trainCurrentEquation, 1);
      updateTrainView('أضفنا 1 للطرفين.');
    });

    trainSub1Btn.addEventListener('click', () => {
      if (!trainCurrentEquation) return;
      addConstToBoth(trainCurrentEquation, -1);
      updateTrainView('طرحنا 1 من الطرفين.');
    });

    trainAddKBtn.addEventListener('click', () => {
      if (!trainCurrentEquation) return;
      const k = Number(trainKInput.value);
      if (!Number.isFinite(k) || !trainKInput.value) {
        appendLog(trainLog, '❗ أدخل قيمة عددية في خانة k أولًا.');
        return;
      }
      addConstToBoth(trainCurrentEquation, k);
      updateTrainView(`أضفنا ${formatNumber(k)} للطرفين.`);
    });

    trainSubKBtn.addEventListener('click', () => {
      if (!trainCurrentEquation) return;
      const k = Number(trainKInput.value);
      if (!Number.isFinite(k) || !trainKInput.value) {
        appendLog(trainLog, '❗ أدخل قيمة عددية في خانة k أولًا.');
        return;
      }
      addConstToBoth(trainCurrentEquation, -k);
      updateTrainView(`طرحنا ${formatNumber(k)} من الطرفين.`);
    });

    trainCheckBtn.addEventListener('click', () => {
      checkTrainSolution();
    });

    // بدء تمرين أول عند التحميل
    if (questionsData.train && questionsData.train.length > 0) {
      startNewTrainExercise();
    }
  }

  function startNewTrainExercise(customExercise) {
    trainLog.innerHTML = '';
    trainKInput.value = '';
    trainCheckBtn.disabled = true;

    if (customExercise) {
      trainCurrentExercise = customExercise;
    } else {
      const list = questionsData.train;
      if (!list || !list.length) return;
      const random = list[Math.floor(Math.random() * list.length)];
      trainCurrentExercise = random;
    }

    const eqData = trainCurrentExercise;
    trainCurrentEquation = createEquationFromData(eqData);

    const originalString = eqData.label || equationToString(trainCurrentEquation);
    trainEqLabel.textContent = originalString;
    updateTrainView('تم تحميل مسألة جديدة.');
  }

  function updateTrainView(message) {
    const eqString = equationToString(trainCurrentEquation);
    trainEqCurrent.textContent = eqString;
    renderBalance(trainBalanceContainer, trainCurrentEquation);
    if (message) {
      appendLog(
        trainLog,
        `${message} (المعادلة الآن: <span dir="ltr">${eqString}</span>)`
      );
    }

    if (isSimpleSolved(trainCurrentEquation)) {
      trainCheckBtn.disabled = false;
      appendLog(
        trainLog,
        '✅ يبدو أنك وصلت إلى صورة من الشكل x = a. يمكنك الآن فحص الحل بالتعويض.'
      );
    }
  }

  function checkTrainSolution() {
    if (!trainCurrentExercise || !trainCurrentEquation) return;

    const expected = Number(trainCurrentExercise.solution);
    let candidate = null;

    if (isSimpleSolved(trainCurrentEquation)) {
      candidate = trainCurrentEquation.right.c;
    } else if (Number.isFinite(trainCurrentExercise.solution)) {
      candidate = expected;
    }

    if (!Number.isFinite(candidate)) {
      appendLog(trainLog, 'لا يمكن تحديد حل واضح من الصورة الحالية للمعادلة.');
      return;
    }

    const originalEq = createEquationFromData(trainCurrentExercise);
    const leftVal = originalEq.left.x * candidate + originalEq.left.c;
    const rightVal = originalEq.right.x * candidate + originalEq.right.c;

    const checkText =
      `<span dir="ltr">${equationToString(originalEq)}</span><br>` +
      `بالتعويض عن x بالقيمة ${formatNumber(candidate)} نحصل على:<br>` +
      `<span dir="ltr">Left = ${leftVal} ، Right = ${rightVal}</span>`;

    if (leftVal === rightVal) {
      appendLog(
        trainLog,
        `🔎 فحص الحل:<br>${checkText}<br>✅ الطرفان متساويان، إذن الحل صحيح.`
      );
    } else {
      appendLog(
        trainLog,
        `🔎 فحص الحل:<br>${checkText}<br>⚠ الطرفان غير متساويين، راجع خطواتك.`
      );
    }
  }

  /* ===================== مسائل حياتية ===================== */

  function initWordTab() {
    if (!wordSelect) return;

    wordSelect.innerHTML = '';
    questionsData.word.forEach(w => {
      const option = document.createElement('option');
      option.value = w.id;
      option.textContent = w.shortTitle || w.context || 'مسألة';
      wordSelect.appendChild(option);
    });

    if (questionsData.word.length > 0) {
      loadWordProblem(questionsData.word[0].id);
    }

    wordSelect.addEventListener('change', () => {
      loadWordProblem(wordSelect.value);
    });

    wordEquationToggleBtn.addEventListener('click', () => {
      if (!wordEquationDisplay.textContent) {
        const current = getCurrentWordProblem();
        if (current) {
          wordEquationDisplay.textContent = current.equation || current.label || '';
        }
      } else {
        wordEquationDisplay.textContent = '';
      }
    });

    wordSolveBtn.addEventListener('click', () => {
      const current = getCurrentWordProblem();
      if (!current) return;

      const exercise = {
        id: current.id,
        label: current.equation || current.label,
        left: current.left,
        right: current.right,
        solution: current.solution
      };

      startNewTrainExercise(exercise);
      activateTab('train');
    });
  }

  function getCurrentWordProblem() {
    const id = wordSelect.value;
    return questionsData.word.find(w => w.id === id);
  }

  function loadWordProblem(id) {
    const problem = questionsData.word.find(w => w.id === id);
    if (!problem) return;

    wordContext.textContent = problem.context || '';
    wordText.textContent = problem.text || '';
    wordEquationDisplay.textContent = '';

    // التعامل مع الصورة
    if (wordImage) {
      if (problem.image) {
        // إذا كان المسار مثل "images/..." نضيف ../../ لأنه في الجذر math-apps/
        let imgSrc = problem.image;
        if (imgSrc.startsWith('images/')) {
          imgSrc = `../../${imgSrc}`;
        }
        wordImage.src = imgSrc;
        wordImage.alt =
          problem.imageAlt ||
          problem.context ||
          problem.shortTitle ||
          'صورة توضيحية للمسألة الكلامية';
        wordImage.style.display = 'block';
      } else {
        wordImage.src = '';
        wordImage.alt = '';
        wordImage.style.display = 'none';
      }
    }
  }

  function activateTab(tabName) {
    tabButtons.forEach(b => {
      const isActive = b.getAttribute('data-tab') === tabName;
      b.classList.toggle('active', isActive);
    });
    tabPanels.forEach(panel => {
      const id = panel.id.replace('balance-tab-', '');
      panel.classList.toggle('active', id === tabName);
    });
  }

  /* ===================== تحميل JSON وبدء التطبيق ===================== */

  function formatNumber(n) {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(2);
  }

  function loadQuestionsJson() {
    fetch('balance-questions.json')
      .then(resp => {
        if (!resp.ok) {
          throw new Error('HTTP error ' + resp.status);
        }
        return resp.json();
      })
      .then(data => {
        questionsData.explore = data.explore || [];
        questionsData.train = data.train || [];
        questionsData.word = data.word || [];

        initTabs();
        initExploreTab();
        initTrainTab();
        initWordTab();
      })
      .catch(err => {
        console.error('خطأ في تحميل balance-questions.json:', err);
        showErrorMessage(
          'لم نتمكّن من تحميل ملف الأسئلة balance-questions.json. تأكّد من وجوده في نفس المجلد مع هذا الملف.'
        );
        initTabs();
      });
  }

  // بدء التشغيل
  document.addEventListener('DOMContentLoaded', loadQuestionsJson);
})();
